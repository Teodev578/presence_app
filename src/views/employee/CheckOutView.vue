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
  <div class="flex-1 flex flex-col justify-center items-center py-1 sm:py-2 md:py-3 w-full h-full min-h-0 overflow-y-auto">
    <div class="card bg-base-200 border border-base-300/60 shadow-xs rounded-m3-xl p-4 sm:p-6 lg:p-8 w-full max-w-md md:max-w-5xl lg:max-w-5xl xl:max-w-6xl flex flex-col gap-4 sm:gap-6 my-auto">
      <!-- En-tête navigation avec touch target 44px+ -->
      <div class="flex items-center justify-between border-b border-base-300/40 pb-3 sm:pb-4">
        <button
          type="button"
          class="btn btn-ghost btn-sm min-h-11 px-3 text-xs font-semibold gap-1.5 rounded-m3-sm text-base-content/75 hover:text-base-content focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2"
          @click="navigate('/employee')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Retour</span>
        </button>
        <div class="text-right">
          <h1 class="text-base sm:text-xl font-extrabold text-base-content tracking-tight">Pointer le départ</h1>
          <p class="text-xs text-base-content/60">Validation de fin de service</p>
        </div>
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
        <span>Aucun lieu de travail actif n'est associé à ce pointage.</span>
      </div>

      <!-- Corps adaptatif : colonne unique sur mobile, 2 colonnes harmonieuses sur tablette/desktop -->
      <div v-else class="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7 items-stretch">
        <!-- Colonne Gauche (5/12) : Radar GPS contextuel -->
        <div class="md:col-span-5 bg-base-100/70 border border-base-300/40 rounded-m3-lg p-4 sm:p-6 shadow-xs flex flex-col justify-center items-center">
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
        </div>

        <!-- Colonne Droite (7/12) : Statut du site, alertes et bouton d'action -->
        <div class="md:col-span-7 flex flex-col justify-between gap-4">
          <!-- Carte statut du site -->
          <div v-if="activeLocation" class="bg-base-100/90 border border-base-300/50 p-4 sm:p-5 rounded-m3-lg flex flex-col gap-3 shadow-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span
                  class="w-2.5 h-2.5 rounded-full shrink-0"
                  :class="perimeterResult.inPerimeter ? 'bg-success animate-pulse' : 'bg-base-content/30'"
                ></span>
                <span class="text-xs font-semibold text-base-content/75">
                  {{ perimeterResult.inPerimeter ? 'Lieu de travail confirmé' : 'Lieu de pointage' }}
                </span>
              </div>
              <span v-if="perimeterResult.inPerimeter" class="badge badge-success text-[10px] font-bold rounded-m3-xs py-1 px-2.5">
                Vous êtes sur place
              </span>
              <span v-else class="badge badge-ghost text-[10px] text-base-content/60 rounded-m3-xs py-1 px-2.5">
                À distance du site
              </span>
            </div>

            <div class="text-base sm:text-lg font-bold text-base-content flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-warning shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{{ activeLocation.name }}</span>
            </div>
          </div>

          <!-- Alertes d'erreurs éventuelles -->
          <div v-if="gpsError" class="alert alert-error text-xs py-2.5 rounded-m3-md">
            <span>{{ gpsError }}</span>
          </div>

          <div v-if="errorMessage" class="alert alert-error text-xs py-2.5 rounded-m3-md">
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Zone d'action de confirmation départ -->
          <div class="flex flex-col gap-2.5 pt-3 border-t border-base-300/40 mt-auto">
            <button
              type="button"
              class="btn btn-warning text-warning-content w-full text-sm sm:text-base font-bold min-h-12 sm:min-h-13 shadow-xs rounded-m3-md active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2"
              :disabled="!perimeterResult.inPerimeter || isSubmitting || !activeLocation"
              @click="handleConfirmCheckOut"
            >
              <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
              <span v-if="isSubmitting">Enregistrement de votre départ...</span>
              <span v-else-if="perimeterResult.inPerimeter">
                Confirmer mon départ de {{ activeLocation?.name }}
              </span>
              <span v-else>En attente de votre présence sur site</span>
            </button>
            <p class="text-xs text-base-content/50 text-center">
              Fonctionne même sans connexion. Synchronisation automatique.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
