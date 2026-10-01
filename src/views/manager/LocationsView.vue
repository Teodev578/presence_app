<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLocations, isLocationActive } from '../../composables/useLocations'
import { useGeolocation } from '../../composables/useGeolocation'
import { parseGeoInput, parseAndResolveGeoInput } from '../../lib/geoParser'
import ConfirmModal from '../../components/shared/ConfirmModal.vue'
import ManagerPageHeader from '../../components/manager/ManagerPageHeader.vue'
import { useToast } from '../../composables/useToast'

const { locations, ensureLoaded, createLocation, updateLocation, deleteLocation } = useLocations()
const { currentCoords, isLocating, gpsError, startWatching, stopWatching } = useGeolocation()

// État de recherche et filtrage
const searchQuery = ref('')
const filterStatus = ref('all') // 'all', 'active', 'inactive'

// État du modal de création/édition
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const isSubmitting = ref(false)
const formError = ref('')

const form = ref({
  name: '',
  latitude: '',
  longitude: '',
  radius_meters: 50,
  is_active: true,
})

// Recherche d'adresse en ligne
const addressQuery = ref('')
const addressSuggestions = ref([])
const isSearchingAddress = ref(false)

// Assistant lien cartographique (Google Maps, Apple Maps, Coordonnées)
const mapUrlInput = ref('')
const mapUrlFeedback = ref({ status: null, message: '' })
const isResolvingMapUrl = ref(false)
let mapInputTimeout = null

// Initialisation
onMounted(async () => {
  await ensureLoaded()
})

// Liste filtrée : la recherche tolère un nom manquant, le statut passe par le prédicat partagé.
const filteredLocations = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return (locations.value || []).filter((loc) => {
    const matchesSearch = !query || (loc.name || '').toLowerCase().includes(query)
    if (!matchesSearch) return false
    if (filterStatus.value === 'active') return isLocationActive(loc)
    if (filterStatus.value === 'inactive') return !isLocationActive(loc)
    return true
  })
})

// Comptes par statut : les filtres annoncent ce qu'ils contiennent avant qu'on les ouvre.
const locationCounts = computed(() => {
  const list = locations.value || []
  const active = list.filter(isLocationActive).length
  return { all: list.length, active, inactive: list.length - active }
})

/**
 * Message de l'état vide : distinguer « aucun site », « aucun résultat de recherche »,
 * « aucun site actif » et « aucun site inactif », et proposer l'action réellement utile.
 */
const emptyState = computed(() => {
  if (locationCounts.value.all === 0) {
    return {
      title: 'Aucun lieu enregistré',
      message: 'Ajoutez un premier lieu de travail pour permettre le pointage de l’équipe.',
      action: 'create',
      actionLabel: 'Ajouter un lieu',
    }
  }
  if (searchQuery.value.trim()) {
    return {
      title: 'Aucun résultat',
      message: `Aucun lieu ne correspond à « ${searchQuery.value.trim()} ».`,
      action: 'clear-search',
      actionLabel: 'Effacer la recherche',
    }
  }
  if (filterStatus.value === 'active') {
    return {
      title: 'Aucun lieu actif',
      message: 'Tous vos lieux sont inactifs. Activez-en un pour permettre le pointage.',
      action: 'show-all',
      actionLabel: 'Voir tous les lieux',
    }
  }
  return {
    title: 'Aucun lieu inactif',
    message: 'Tous les lieux sont actifs et ouverts au pointage.',
    action: 'show-all',
    actionLabel: 'Voir tous les lieux',
  }
})

const runEmptyAction = () => {
  if (emptyState.value.action === 'create') openCreateModal()
  else if (emptyState.value.action === 'clear-search') searchQuery.value = ''
  else filterStatus.value = 'all'
}

// Coordonnée lisible : « 45.76400° N » plutôt qu'un décimal signé, illisible pour un gestionnaire.
const formatCoordinate = (value, axis) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  const hemisphere = axis === 'lat' ? (numeric >= 0 ? 'N' : 'S') : (numeric >= 0 ? 'E' : 'O')
  return `${Math.abs(numeric).toFixed(5)}° ${hemisphere}`
}

// Le lien cartographique n'est ouvert qu'au clic : aucun service tiers n'est chargé dans la carte.
const mapUrl = (loc) => `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`

// Ouvrir modal pour ajout
const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = {
    name: '',
    latitude: '',
    longitude: '',
    radius_meters: 50,
    is_active: true,
  }
  addressQuery.value = ''
  addressSuggestions.value = []
  mapUrlInput.value = ''
  mapUrlFeedback.value = { status: null, message: '' }
  isResolvingMapUrl.value = false
  formError.value = ''
  isModalOpen.value = true
}

// Ouvrir modal pour édition
const openEditModal = (loc) => {
  isEditing.value = true
  editingId.value = loc.id
  form.value = {
    name: loc.name,
    latitude: loc.latitude,
    longitude: loc.longitude,
    radius_meters: loc.radius_meters || 50,
    is_active: isLocationActive(loc),
  }
  addressQuery.value = ''
  addressSuggestions.value = []
  mapUrlInput.value = ''
  mapUrlFeedback.value = { status: null, message: '' }
  isResolvingMapUrl.value = false
  formError.value = ''
  isModalOpen.value = true
}

// Fermer modal
const closeModal = () => {
  isModalOpen.value = false
  stopWatching()
}

// Récupérer la position GPS actuelle
const useCurrentLocation = () => {
  formError.value = ''
  if (!navigator.geolocation) {
    formError.value = 'La géolocalisation n’est pas prise en charge.'
    return
  }

  startWatching()
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.value.latitude = Number(pos.coords.latitude.toFixed(6))
      form.value.longitude = Number(pos.coords.longitude.toFixed(6))
      stopWatching()
    },
    (err) => {
      stopWatching()
      formError.value = `Erreur GPS : ${err.message}`
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

// Recherche d'adresse via api-adresse.data.gouv.fr
let searchTimeout = null
const onAddressInput = () => {
  clearTimeout(searchTimeout)
  if (!addressQuery.value || addressQuery.value.trim().length < 3) {
    addressSuggestions.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    isSearchingAddress.value = true
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(addressQuery.value)}&limit=5`)
      if (res.ok) {
        const json = await res.json()
        addressSuggestions.value = (json.features || []).map((f) => ({
          label: f.properties.label,
          city: f.properties.city,
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0],
        }))
      }
    } catch {
      addressSuggestions.value = []
    } finally {
      isSearchingAddress.value = false
    }
  }, 350)
}

const selectAddress = (sug) => {
  form.value.latitude = Number(sug.latitude.toFixed(6))
  form.value.longitude = Number(sug.longitude.toFixed(6))
  if (!form.value.name) {
    form.value.name = sug.label
  }
  addressQuery.value = sug.label
  addressSuggestions.value = []
}

// Traitement d'un lien Google Maps, Apple Maps ou coordonnées brutes
const handleMapInput = () => {
  mapUrlFeedback.value = { status: null, message: '' }
  if (!mapUrlInput.value || !mapUrlInput.value.trim()) {
    return
  }

  clearTimeout(mapInputTimeout)
  const quick = parseGeoInput(mapUrlInput.value)
  if (quick.success) {
    form.value.latitude = quick.latitude
    form.value.longitude = quick.longitude
    if (quick.name && !form.value.name.trim()) {
      form.value.name = quick.name
    }
    mapUrlFeedback.value = {
      status: 'success',
      message: `Position détectée (${quick.source}) : ${quick.latitude}, ${quick.longitude}`,
    }
    return
  }

  if (quick.isShortUrl) {
    mapUrlFeedback.value = {
      status: 'info',
      message: 'Résolution du lien court en cours...',
    }
    isResolvingMapUrl.value = true
  }

  mapInputTimeout = setTimeout(async () => {
    isResolvingMapUrl.value = true
    try {
      const result = await parseAndResolveGeoInput(mapUrlInput.value)
      if (result.success) {
        form.value.latitude = result.latitude
        form.value.longitude = result.longitude
        if (result.name && !form.value.name.trim()) {
          form.value.name = result.name
        }
        mapUrlFeedback.value = {
          status: 'success',
          message: `Position détectée (${result.source}) : ${result.latitude}, ${result.longitude}`,
        }
      } else if (result.isShortUrl) {
        mapUrlFeedback.value = {
          status: 'warning',
          message: result.error,
        }
      } else {
        mapUrlFeedback.value = {
          status: 'error',
          message: result.error || 'Format non reconnu.',
        }
      }
    } finally {
      isResolvingMapUrl.value = false
    }
  }, quick.isShortUrl ? 50 : 250)
}

const handleMapPaste = (event) => {
  const pastedText = event.clipboardData?.getData('text')
  if (pastedText) {
    setTimeout(() => {
      mapUrlInput.value = pastedText.trim()
      handleMapInput()
    }, 0)
  }
}

// Soumission du formulaire
const handleSubmit = async () => {
  formError.value = ''

  if (!form.value.name.trim()) {
    formError.value = 'Renseignez un nom pour ce lieu.'
    return
  }
  if (form.value.latitude === '' || isNaN(Number(form.value.latitude))) {
    formError.value = 'Renseignez une latitude valide.'
    return
  }
  if (form.value.longitude === '' || isNaN(Number(form.value.longitude))) {
    formError.value = 'Renseignez une longitude valide.'
    return
  }

  isSubmitting.value = true
  try {
    if (isEditing.value) {
      await updateLocation(editingId.value, {
        name: form.value.name,
        latitude: form.value.latitude,
        longitude: form.value.longitude,
        radius_meters: form.value.radius_meters,
        is_active: form.value.is_active,
      })
    } else {
      await createLocation({
        name: form.value.name,
        latitude: form.value.latitude,
        longitude: form.value.longitude,
        radius_meters: form.value.radius_meters,
        is_active: form.value.is_active,
      })
      success(`Le lieu « ${form.value.name} » a été ajouté.`)
    }
    closeModal()
  } catch (err) {
    formError.value = err.message || 'Une erreur est survenue lors de l’enregistrement.'
  } finally {
    isSubmitting.value = false
  }
}

// État et confirmation de suppression via ConfirmModal
const { success, error: toastError } = useToast()
const locationToDelete = ref(null)
const isDeleting = ref(false)

const requestDelete = (loc) => {
  locationToDelete.value = loc
}

const confirmDelete = async () => {
  if (!locationToDelete.value) return
  isDeleting.value = true
  const target = locationToDelete.value
  try {
    await deleteLocation(target.id)
    success(`Le lieu « ${target.name} » a été supprimé.`)
    locationToDelete.value = null
  } catch (err) {
    toastError(`Erreur de suppression : ${err.message}`)
  } finally {
    isDeleting.value = false
  }
}

// Bascule rapide statut actif/inactif, avec retour explicite : sous le filtre courant, la carte
// peut quitter la liste ; le toast confirme qu'elle a changé d'état et non qu'elle a disparu.
const toggleStatus = async (loc) => {
  const next = !isLocationActive(loc)
  try {
    await updateLocation(loc.id, { is_active: next })
    success(`Le lieu « ${loc.name} » est maintenant ${next ? 'actif' : 'inactif'}.`)
  } catch (err) {
    toastError(`Impossible de changer l’état de « ${loc.name} » : ${err.message}`)
  }
}


</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- En-tête -->
    <ManagerPageHeader
      title="Lieux de travail"
      subtitle="Adresses et zones où l'équipe peut valider son arrivée"
    >
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </template>

      <template #actions>
        <button
          type="button"
          class="btn btn-primary rounded-m3-sm font-bold shadow-xs min-h-11 flex items-center justify-center gap-2 w-full sm:w-auto active:scale-95 transition-transform duration-150"
          @click="openCreateModal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          <span>Ajouter un lieu</span>
        </button>
      </template>
    </ManagerPageHeader>

    <!-- Filtres et recherche -->
    <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 flex flex-col gap-3">
      <!-- Recherche : pleine largeur du conteneur, cible confortable -->
      <div class="w-full">
        <label class="input input-bordered flex w-full items-center gap-2 rounded-m3-md bg-base-300/50 min-h-11">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="grow text-sm"
            placeholder="Rechercher un lieu par nom..."
          />
        </label>
      </div>

      <!-- Filtre Statut -->
      <div class="flex items-center gap-2 self-start">
        <span class="text-sm font-semibold text-base-content/60">Statut :</span>
        <div class="join">
          <button
            type="button"
            class="btn join-item min-h-11 px-3 rounded-l-m3-sm"
            :class="{ 'btn-primary': filterStatus === 'all' }"
            @click="filterStatus = 'all'"
          >
            Tous ({{ locationCounts.all }})
          </button>
          <button
            type="button"
            class="btn join-item min-h-11 px-3"
            :class="{ 'btn-primary': filterStatus === 'active' }"
            @click="filterStatus = 'active'"
          >
            Actifs ({{ locationCounts.active }})
          </button>
          <button
            type="button"
            class="btn join-item min-h-11 px-3 rounded-r-m3-sm"
            :class="{ 'btn-primary': filterStatus === 'inactive' }"
            @click="filterStatus = 'inactive'"
          >
            Inactifs ({{ locationCounts.inactive }})
          </button>
        </div>
      </div>
    </div>

    <!-- Liste des sites -->
    <div v-if="filteredLocations.length === 0" class="card bg-base-200 border border-base-300 rounded-m3-lg p-8 text-center items-center">
      <div class="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center text-base-content/40 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
      <h3 class="font-bold text-base text-base-content">{{ emptyState.title }}</h3>
      <p class="text-sm text-base-content/60 mt-1 max-w-md mx-auto">{{ emptyState.message }}</p>
      <div class="mt-4">
        <button
          type="button"
          class="btn btn-primary min-h-11 rounded-m3-sm"
          @click="runEmptyAction"
        >
          {{ emptyState.actionLabel }}
        </button>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
      <div
        v-for="loc in filteredLocations"
        :key="loc.id"
        class="card bg-base-200 border border-base-300 shadow-xs hover:border-primary/40 transition-all rounded-m3-lg p-5 flex flex-col gap-4"
      >
        <!-- Titre & État de pointage -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
              <line x1="9" y1="22" x2="9" y2="2"></line>
              <line x1="15" y1="22" x2="15" y2="2"></line>
              <line x1="4" y1="12" x2="20" y2="12"></line>
            </svg>
            <h3 class="font-bold text-base text-base-content truncate">{{ loc.name }}</h3>
          </div>
          <label
            class="flex min-h-11 shrink-0 cursor-pointer select-none items-center gap-2"
            :title="isLocationActive(loc) ? 'Désactiver ce lieu pour le pointage' : 'Activer ce lieu pour le pointage'"
          >
            <span
              class="text-xs font-bold"
              :class="isLocationActive(loc) ? 'text-success' : 'text-base-content/50'"
            >
              {{ isLocationActive(loc) ? 'Actif' : 'Inactif' }}
            </span>
            <input
              type="checkbox"
              class="toggle toggle-success toggle-sm"
              :checked="isLocationActive(loc)"
              :aria-label="isLocationActive(loc) ? `Désactiver ${loc.name} pour le pointage` : `Activer ${loc.name} pour le pointage`"
              @change="toggleStatus(loc)"
            />
          </label>
        </div>

        <!-- Périmètre autorisé : la zone de pointage se lit d'un coup d'œil -->
        <div class="flex items-center gap-3 rounded-m3-md bg-base-300/50 border border-base-300/60 p-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"></circle>
            <circle cx="12" cy="12" r="4.5" class="opacity-60"></circle>
            <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"></circle>
            <line x1="12" y1="3" x2="12" y2="21" class="opacity-30"></line>
            <line x1="3" y1="12" x2="21" y2="12" class="opacity-30"></line>
          </svg>
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wide text-base-content/50">Périmètre autorisé</p>
            <p class="text-sm font-bold text-base-content">{{ loc.radius_meters || 50 }} m autour du point</p>
          </div>
        </div>

        <!-- Position : coordonnées lisibles et lien cartographique ouvert à la demande -->
        <div class="flex flex-col gap-2">
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wide text-base-content/50">Position</p>
            <p class="text-sm font-mono text-base-content/80 break-words">
              {{ formatCoordinate(loc.latitude, 'lat') }} · {{ formatCoordinate(loc.longitude, 'lng') }}
            </p>
          </div>
          <a
            :href="mapUrl(loc)"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-ghost min-h-11 w-full justify-start gap-1.5 rounded-m3-sm px-2 text-primary font-semibold"
            :aria-label="`Voir ${loc.name} sur la carte`"
            title="Ouvrir la position dans la carte"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>Voir sur la carte</span>
          </a>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2 mt-auto pt-3 border-t border-base-300/60">
          <button
            type="button"
            class="btn btn-ghost text-error font-medium rounded-m3-sm min-h-11 px-3"
            @click="requestDelete(loc)"
            title="Supprimer ce lieu"
          >
            Supprimer
          </button>
          <button
            type="button"
            class="btn btn-secondary btn-outline font-semibold rounded-m3-sm gap-1.5 min-h-11 px-3"
            @click="openEditModal(loc)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Modifier</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal d'Ajout / Édition -->
    <dialog class="modal" :class="{ 'modal-open': isModalOpen }">
      <div class="modal-box max-w-xl rounded-m3-xl p-5 sm:p-6 bg-base-100 border border-base-300 shadow-sm">
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-base-200">
          <h3 class="font-black text-xl text-base-content flex items-center gap-2">
            <svg v-if="isEditing" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{{ isEditing ? 'Modifier le lieu' : 'Ajouter un lieu de travail' }}</span>
          </h3>
          <button
            type="button"
            class="btn btn-circle btn-ghost min-w-11 min-h-11"
            aria-label="Fermer la modale"
            @click="closeModal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Message d'erreur -->
        <div v-if="formError" class="alert alert-error text-xs py-2.5 rounded-m3-md mb-4 text-error-content flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ formError }}</span>
        </div>

        <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
          <!-- Nom du site -->
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text font-bold text-sm">Nom du lieu *</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              class="input input-bordered w-full min-h-11 rounded-m3-md text-sm"
              placeholder="ex. Siège, Atelier, Dépôt, Chantier..."
              required
            />
          </div>

          <!-- Assistant de localisation rapide -->
          <div class="bg-base-200/60 p-4 rounded-m3-lg flex flex-col gap-3">
            <span class="text-sm font-bold text-base-content/70">Positionner le lieu</span>

            <!-- Bouton GPS actuel -->
            <button
              type="button"
              class="btn btn-outline btn-primary min-h-11 w-full rounded-m3-sm font-bold flex items-center justify-center gap-2"
              :disabled="isLocating"
              @click="useCurrentLocation"
            >
              <span v-if="isLocating" class="loading loading-spinner loading-xs"></span>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
              <span>Prendre ma position actuelle</span>
            </button>

            <!-- Saisie lien cartographique ou coordonnées -->
            <div class="flex flex-col gap-1">
              <div class="relative flex items-center">
                <input
                  v-model="mapUrlInput"
                  type="text"
                  class="input input-bordered w-full min-h-11 rounded-m3-md text-sm pl-9"
                  placeholder="Coller un lien cartographique ou des coordonnées..."
                  @input="handleMapInput"
                  @paste="handleMapPaste"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4 absolute left-3 text-base-content/50 pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span
                  v-if="isResolvingMapUrl"
                  class="loading loading-spinner loading-xs absolute right-2.5 text-primary"
                ></span>
              </div>

              <!-- Retours contextuels -->
              <div
                v-if="mapUrlFeedback.status === 'info'"
                class="text-xs text-primary font-medium flex items-center gap-1.5 px-1 mt-0.5"
              >
                <span class="loading loading-spinner loading-xs text-primary"></span>
                <span>{{ mapUrlFeedback.message }}</span>
              </div>
              <div
                v-if="mapUrlFeedback.status === 'success'"
                class="text-xs text-success font-medium flex items-center gap-1.5 px-1 mt-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{{ mapUrlFeedback.message }}</span>
              </div>
              <div
                v-else-if="mapUrlFeedback.status === 'warning'"
                class="text-xs text-warning font-medium flex items-start gap-1.5 px-1 mt-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{{ mapUrlFeedback.message }}</span>
              </div>
              <div
                v-else-if="mapUrlFeedback.status === 'error'"
                class="text-xs text-error font-medium flex items-center gap-1.5 px-1 mt-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{{ mapUrlFeedback.message }}</span>
              </div>
            </div>

            <!-- Recherche d'adresse postale -->
            <div class="relative">
              <div class="form-control">
                <input
                  v-model="addressQuery"
                  type="text"
                  class="input input-bordered w-full min-h-11 rounded-m3-md text-sm"
                  placeholder="Rechercher une adresse (France)..."
                  @input="onAddressInput"
                />
              </div>

              <!-- Liste déroulante des suggestions -->
              <ul
                v-if="addressSuggestions.length > 0"
                class="menu absolute z-50 bg-base-100 border border-base-300 rounded-m3-md shadow-xs w-full mt-1 p-1 text-xs"
              >
                <li v-for="(sug, idx) in addressSuggestions" :key="idx">
                  <button
                    type="button"
                    class="py-2 flex flex-col items-start"
                    @click="selectAddress(sug)"
                  >
                    <span class="font-bold text-base-content">{{ sug.label }}</span>
                    <span class="text-base-content/50 text-xs">{{ sug.city }}</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <!-- Coordonnées GPS -->
          <div class="grid grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-bold text-sm">Latitude *</span>
              </label>
              <input
                v-model.number="form.latitude"
                type="number"
                step="0.000001"
                class="input input-bordered w-full min-h-11 rounded-m3-md text-sm font-mono"
                placeholder="48.8566"
                required
              />
            </div>
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-bold text-sm">Longitude *</span>
              </label>
              <input
                v-model.number="form.longitude"
                type="number"
                step="0.000001"
                class="input input-bordered w-full min-h-11 rounded-m3-md text-sm font-mono"
                placeholder="2.3522"
                required
              />
            </div>
          </div>

          <!-- Rayon de détection en mètres -->
          <div class="form-control">
            <div class="flex items-center justify-between py-1">
              <span class="label-text font-bold text-sm">Rayon de détection</span>
              <span class="badge badge-primary badge-sm font-bold">{{ form.radius_meters }} mètres</span>
            </div>
            <input
              v-model.number="form.radius_meters"
              type="range"
              min="20"
              max="500"
              step="10"
              class="range range-primary range-sm w-full mt-3"
            />
            <div class="w-full flex justify-between text-xs text-base-content/50 px-1 mt-1 font-mono">
              <span>20m</span>
              <span>100m</span>
              <span>250m</span>
              <span>500m</span>
            </div>
          </div>

          <!-- Statut actif -->
          <div class="form-control mt-1">
            <label class="label cursor-pointer justify-start gap-3 py-1 min-h-11">
              <input
                v-model="form.is_active"
                type="checkbox"
                class="checkbox checkbox-primary rounded-m3-xs"
              />
              <span class="label-text font-semibold text-sm text-base-content">
                Lieu ouvert au pointage
              </span>
            </label>
          </div>

          <!-- Boutons de validation -->
          <div class="modal-action mt-2 pt-4 border-t border-base-200 gap-2">
            <button
              type="button"
              class="btn btn-ghost min-h-11 rounded-m3-sm font-medium"
              :disabled="isSubmitting"
              @click="closeModal"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn btn-primary min-h-11 rounded-m3-sm font-bold shadow-xs"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
              <span v-else>{{ isEditing ? 'Enregistrer les modifications' : 'Ajouter ce lieu' }}</span>
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeModal">
        <button type="button">fermer</button>
      </form>
    </dialog>

    <!-- Modale de confirmation de suppression Material 3 -->
    <ConfirmModal
      :open="!!locationToDelete"
      title="Supprimer le lieu"
      :message="`Confirmez-vous la suppression du lieu « ${locationToDelete?.name} » ? Cette action est définitive.`"
      confirm-text="Supprimer"
      confirm-class="btn-error"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="locationToDelete = null"
    />
  </div>
</template>
