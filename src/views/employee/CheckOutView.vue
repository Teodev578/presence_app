<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from '../../router'
import { useGeolocation, formatDistance } from '../../composables/useGeolocation'
import { usePresences } from '../../composables/usePresences'
import { db } from '../../lib/db'
import GpsRing from '../../components/employee/GpsRing.vue'

const { navigate } = useRouter()
const {
  currentCoords,
  gpsAccuracy,
  gpsError,
  isLocating,
  startWatching,
  stopWatching,
  checkPerimeter,
  findMatchingLocation,
} = useGeolocation()

const { todayPresence, checkOut } = usePresences()

const location = ref(null)
const allLocations = ref([])
const isSubmitting = ref(false)
const errorMessage = ref('')
const isLoading = ref(true)

onMounted(async () => {
  startWatching()

  try {
    isLoading.value = true

    // 1. Récupération des sites actifs réels
    const list = await db.locations
      .filter(
        (loc) =>
          !loc.deleted_at &&
          (loc.is_active === true || loc.is_active === 1 || loc.is_active === 'true')
      )
      .toArray()
    allLocations.value = list

    // 2. Recherche du site associé à la présence active du jour
    if (todayPresence.value?.location_id) {
      try {
        const loc = await db.locations.get(todayPresence.value.location_id)
        if (loc && !loc.deleted_at) {
          location.value = loc
        }
      } catch (e) {
        console.warn('Erreur chargement site départ :', e)
      }
    }

    // 3. Si aucun site d'arrivée explicite, détection dynamique
    if (!location.value && list.length > 0) {
      location.value = list[0]
    }
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  stopWatching()
})

// Détection automatique : vérifie si l'employé est sur le site de départ ou un site de l'entreprise
const autoMatch = computed(() => {
  return findMatchingLocation(currentCoords.value, allLocations.value)
})

// Site effectif pris en compte : le site sur lequel il est détecté, ou à défaut son site d'arrivée
const activeLocation = computed(() => {
  if (autoMatch.value.matchedLocation) {
    return autoMatch.value.matchedLocation
  }
  return location.value || autoMatch.value.closestLocation || null
})

const perimeterResult = computed(() => {
  if (!activeLocation.value || !currentCoords.value) {
    return { inPerimeter: false, distance: 0, allowedRadius: 50 }
  }
  return checkPerimeter(activeLocation.value)
})

const handleConfirmCheckOut = async () => {
  if (!todayPresence.value?.id) {
    errorMessage.value = 'Aucun pointage d’arrivée actif trouvé pour aujourd’hui.'
    return
  }

  if (!perimeterResult.value.inPerimeter) {
    errorMessage.value = 'Vous devez être sur le site pour valider votre départ.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await checkOut({
      presenceId: todayPresence.value.id,
      coords: currentCoords.value,
      accuracy: gpsAccuracy.value,
    })
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40)
    }
    navigate('/employee')
  } catch (err) {
    errorMessage.value = `Erreur : ${err.message}`
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 max-w-lg mx-auto">
    <!-- En-tête navigation avec touch target 48dp -->
    <div class="flex items-center justify-between">
      <button
        type="button"
        class="btn btn-ghost min-h-12 px-3 text-xs font-semibold gap-1 rounded-m3-sm"
        @click="navigate('/employee')"
      >
        ← Annuler
      </button>
      <h1 class="text-base font-bold text-base-content">Pointer le départ</h1>
      <span class="w-16"></span>
    </div>

    <!-- Si aucun site n'est disponible -->
    <div
      v-if="!isLoading && !activeLocation"
      class="alert alert-warning text-xs py-3 rounded-m3-md flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>Aucun site actif associé à ce pointage.</span>
    </div>

    <!-- Carte statut du site -->
    <div v-else-if="activeLocation" class="card bg-base-200 border border-base-300/60 p-3.5 rounded-m3-md flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :class="perimeterResult.inPerimeter ? 'bg-success animate-pulse' : 'bg-base-content/30'"
          ></span>
          <span class="text-xs font-medium text-base-content/70">
            {{ perimeterResult.inPerimeter ? 'Site validé pour le départ' : 'Site de pointage' }}
          </span>
        </div>
        <span v-if="perimeterResult.inPerimeter" class="badge badge-success text-[10px] font-bold rounded-m3-xs py-1 px-2">
          Dans le périmètre
        </span>
        <span v-else class="badge badge-ghost text-[10px] text-base-content/60 rounded-m3-xs py-1 px-2">
          Hors périmètre
        </span>
      </div>

      <div class="text-sm font-bold text-base-content flex items-center gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-warning shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>{{ activeLocation.name }}</span>
      </div>
    </div>

    <!-- Radar GPS -->
    <GpsRing
      :in-perimeter="perimeterResult.inPerimeter"
      :distance="perimeterResult.distance"
      :allowed-radius="perimeterResult.allowedRadius"
      :accuracy="gpsAccuracy"
      :is-locating="isLocating"
      :site-name="activeLocation?.name || ''"
      :closest-site-name="activeLocation?.name || ''"
      :has-sites-configured="Boolean(activeLocation)"
    />

    <!-- Erreur GPS éventuelle -->
    <div v-if="gpsError" class="alert alert-error text-xs py-2.5 rounded-m3-md">
      <span>{{ gpsError }}</span>
    </div>

    <!-- Message d'erreur de soumission -->
    <div v-if="errorMessage" class="alert alert-error text-xs py-2.5 rounded-m3-md">
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Bouton de confirmation départ -->
    <div class="flex flex-col gap-2.5 mt-2">
      <button
        type="button"
        class="btn btn-warning text-warning-content w-full text-base font-bold min-h-14 shadow-xs rounded-m3-md active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2"
        :disabled="!perimeterResult.inPerimeter || isSubmitting || !activeLocation"
        @click="handleConfirmCheckOut"
      >
        <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
        <span v-if="isSubmitting">Validation...</span>
        <span v-else-if="perimeterResult.inPerimeter">
          Valider le départ de {{ activeLocation?.name }}
        </span>
        <span v-else>Périmètre non atteint</span>
      </button>
      <p class="text-[11px] text-base-content/50 text-center">
        Disponible hors ligne. Enregistrement local automatique.
      </p>
    </div>
  </div>
</template>
