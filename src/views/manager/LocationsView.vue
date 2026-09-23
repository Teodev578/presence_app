<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLocations } from '../../composables/useLocations'
import { useGeolocation } from '../../composables/useGeolocation'

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

// Initialisation
onMounted(async () => {
  await ensureLoaded()
})

// Liste filtrée
const filteredLocations = computed(() => {
  return (locations.value || []).filter((loc) => {
    const matchesSearch = !searchQuery.value || loc.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    if (!matchesSearch) return false
    if (filterStatus.value === 'active') return loc.is_active
    if (filterStatus.value === 'inactive') return !loc.is_active
    return true
  })
})

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
    is_active: loc.is_active ?? true,
  }
  addressQuery.value = ''
  addressSuggestions.value = []
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

// Soumission du formulaire
const handleSubmit = async () => {
  formError.value = ''

  if (!form.value.name.trim()) {
    formError.value = 'Veuillez saisir un nom pour ce site.'
    return
  }
  if (form.value.latitude === '' || isNaN(Number(form.value.latitude))) {
    formError.value = 'Veuillez renseigner une latitude valide.'
    return
  }
  if (form.value.longitude === '' || isNaN(Number(form.value.longitude))) {
    formError.value = 'Veuillez renseigner une longitude valide.'
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
    }
    closeModal()
  } catch (err) {
    formError.value = err.message || 'Une erreur est survenue lors de l’enregistrement.'
  } finally {
    isSubmitting.value = false
  }
}

// Bascule rapide statut actif/inactif
const toggleStatus = async (loc) => {
  try {
    await updateLocation(loc.id, { is_active: !loc.is_active })
  } catch (err) {
    console.error('Erreur bascule statut site :', err)
  }
}

// Suppression avec confirmation
const handleDelete = async (loc) => {
  if (confirm(`Confirmez-vous la suppression du site "${loc.name}" ?`)) {
    try {
      await deleteLocation(loc.id)
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    }
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- En-tête -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black tracking-tight text-base-content flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <span>Gestion des Sites & Lieux</span>
        </h1>
        <p class="text-xs text-base-content/60 mt-0.5">
          Définissez les périmètres autorisés pour le pointage des collaborateurs
        </p>
      </div>

      <div>
        <button
          type="button"
          class="btn btn-primary rounded-m3-sm font-bold shadow-xs flex items-center gap-2"
          @click="openCreateModal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Nouveau Site</span>
        </button>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="card bg-base-100 border border-base-300 shadow-xs rounded-m3-lg p-4">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <!-- Recherche -->
        <div class="w-full sm:w-80">
          <label class="input input-bordered input-sm flex items-center gap-2 rounded-m3-md bg-base-200/50">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="grow text-xs"
              placeholder="Rechercher un site par nom..."
            />
          </label>
        </div>

        <!-- Filtre Statut -->
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <span class="text-xs font-semibold text-base-content/60">Statut :</span>
          <div class="join">
            <button
              type="button"
              class="btn btn-xs join-item rounded-l-m3-sm"
              :class="{ 'btn-primary': filterStatus === 'all' }"
              @click="filterStatus = 'all'"
            >
              Tous ({{ (locations || []).length }})
            </button>
            <button
              type="button"
              class="btn btn-xs join-item"
              :class="{ 'btn-primary': filterStatus === 'active' }"
              @click="filterStatus = 'active'"
            >
              Actifs
            </button>
            <button
              type="button"
              class="btn btn-xs join-item rounded-r-m3-sm"
              :class="{ 'btn-primary': filterStatus === 'inactive' }"
              @click="filterStatus = 'inactive'"
            >
              Inactifs
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des sites -->
    <div v-if="filteredLocations.length === 0" class="card bg-base-100 border border-base-300 rounded-m3-lg p-8 text-center items-center">
      <div class="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center text-base-content/40 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
      <h3 class="font-bold text-base text-base-content">Aucun site trouvé</h3>
      <p class="text-xs text-base-content/60 mt-1 max-w-sm mx-auto">
        {{ searchQuery ? 'Aucun résultat ne correspond à votre recherche.' : 'Créez votre premier site pour autoriser le pointage géolocalisé.' }}
      </p>
      <div class="mt-4">
        <button
          v-if="!searchQuery"
          type="button"
          class="btn btn-primary btn-sm rounded-m3-sm"
          @click="openCreateModal"
        >
          Créer un site
        </button>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="loc in filteredLocations"
        :key="loc.id"
        class="card bg-base-100 border border-base-300 shadow-xs hover:border-primary/40 transition-all rounded-m3-lg p-5 flex flex-col justify-between"
      >
        <div class="flex flex-col gap-3">
          <!-- Titre & Statut -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                <line x1="9" y1="22" x2="9" y2="2"></line>
                <line x1="15" y1="22" x2="15" y2="2"></line>
                <line x1="4" y1="12" x2="20" y2="12"></line>
              </svg>
              <h3 class="font-bold text-sm text-base-content truncate">{{ loc.name }}</h3>
            </div>
            <span
              class="badge badge-sm shrink-0 font-semibold cursor-pointer rounded-m3-xs"
              :class="loc.is_active ? 'badge-success text-success-content' : 'badge-ghost text-base-content/50'"
              @click="toggleStatus(loc)"
              title="Cliquer pour changer le statut"
            >
              {{ loc.is_active ? 'Actif' : 'Inactif' }}
            </span>
          </div>

          <!-- Détails Coordonnées & Rayon -->
          <div class="bg-base-200/60 rounded-m3-md p-3 flex flex-col gap-1.5 text-xs text-base-content/80 font-mono">
            <div class="flex items-center justify-between">
              <span class="text-base-content/50">Latitude :</span>
              <span class="font-semibold">{{ Number(loc.latitude).toFixed(5) }}°</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-base-content/50">Longitude :</span>
              <span class="font-semibold">{{ Number(loc.longitude).toFixed(5) }}°</span>
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-base-300/50">
              <span class="text-base-content/50">Rayon toléré :</span>
              <span class="font-semibold text-primary">± {{ loc.radius_meters || 50 }} m</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-base-200">
          <button
            type="button"
            class="btn btn-ghost btn-xs text-error font-medium rounded-m3-sm"
            @click="handleDelete(loc)"
            title="Supprimer ce site"
          >
            Supprimer
          </button>
          <button
            type="button"
            class="btn btn-secondary btn-outline btn-xs font-semibold rounded-m3-sm gap-1"
            @click="openEditModal(loc)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
      <div class="modal-box rounded-m3-xl max-w-md p-5 sm:p-6 bg-base-100 border border-base-300 shadow-sm">
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-base-200">
          <h3 class="font-black text-lg text-base-content flex items-center gap-2">
            <svg v-if="isEditing" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{{ isEditing ? 'Modifier le site' : 'Ajouter un nouveau site' }}</span>
          </h3>
          <button
            type="button"
            class="btn btn-sm btn-circle btn-ghost"
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

        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <!-- Nom du site -->
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text font-bold text-xs">Nom du site *</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              class="input input-bordered rounded-m3-md text-sm"
              placeholder="ex: Siège social, Chantier Alpha, Dépôt..."
              required
            />
          </div>

          <!-- Assistant de localisation rapide -->
          <div class="bg-base-200/60 p-3 rounded-m3-lg flex flex-col gap-2.5">
            <span class="text-xs font-bold text-base-content/70">Assistant de localisation</span>

            <!-- Bouton GPS actuel -->
            <button
              type="button"
              class="btn btn-sm btn-outline btn-primary rounded-m3-sm font-bold flex items-center justify-center gap-2"
              :disabled="isLocating"
              @click="useCurrentLocation"
            >
              <span v-if="isLocating" class="loading loading-spinner loading-xs"></span>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
              <span>Détecter ma position actuelle</span>
            </button>

            <!-- Recherche d'adresse postale -->
            <div class="relative">
              <div class="form-control">
                <input
                  v-model="addressQuery"
                  type="text"
                  class="input input-bordered input-sm rounded-m3-md text-xs"
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
                    <span class="text-base-content/50 text-[10px]">{{ sug.city }}</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <!-- Coordonnées GPS -->
          <div class="grid grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-bold text-xs">Latitude *</span>
              </label>
              <input
                v-model.number="form.latitude"
                type="number"
                step="0.000001"
                class="input input-bordered rounded-m3-md text-xs font-mono"
                placeholder="48.8566"
                required
              />
            </div>
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-bold text-xs">Longitude *</span>
              </label>
              <input
                v-model.number="form.longitude"
                type="number"
                step="0.000001"
                class="input input-bordered rounded-m3-md text-xs font-mono"
                placeholder="2.3522"
                required
              />
            </div>
          </div>

          <!-- Rayon de tolérance en mètres -->
          <div class="form-control">
            <div class="flex items-center justify-between py-1">
              <span class="label-text font-bold text-xs">Rayon de tolérance</span>
              <span class="badge badge-primary badge-sm font-bold">{{ form.radius_meters }} mètres</span>
            </div>
            <input
              v-model.number="form.radius_meters"
              type="range"
              min="20"
              max="500"
              step="10"
              class="range range-primary range-xs mt-2"
            />
            <div class="w-full flex justify-between text-[10px] text-base-content/50 px-1 mt-1 font-mono">
              <span>20m</span>
              <span>100m</span>
              <span>250m</span>
              <span>500m</span>
            </div>
          </div>

          <!-- Statut actif -->
          <div class="form-control mt-1">
            <label class="label cursor-pointer justify-start gap-3 py-1">
              <input
                v-model="form.is_active"
                type="checkbox"
                class="checkbox checkbox-primary checkbox-sm rounded-m3-xs"
              />
              <span class="label-text font-semibold text-xs text-base-content">
                Site actif pour le pointage
              </span>
            </label>
          </div>

          <!-- Boutons de validation -->
          <div class="modal-action mt-4 pt-3 border-t border-base-200">
            <button
              type="button"
              class="btn btn-ghost btn-sm rounded-m3-sm font-medium"
              :disabled="isSubmitting"
              @click="closeModal"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn btn-primary btn-sm rounded-m3-sm font-bold shadow-xs"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
              <span v-else>{{ isEditing ? 'Mettre à jour' : 'Enregistrer le site' }}</span>
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeModal">
        <button type="button">fermer</button>
      </form>
    </dialog>
  </div>
</template>
