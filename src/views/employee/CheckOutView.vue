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
const isSuccess = ref(false)
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
    errorMessage.value = 'Aucune arrivée active n’a été enregistrée aujourd’hui.'
    return
  }

  if (!perimeterResult.value.inPerimeter) {
    errorMessage.value = 'Vous devez vous trouver sur votre lieu de travail pour enregistrer votre départ.'
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
    isSuccess.value = true
    await new Promise((r) => setTimeout(r, 700))
    navigate('/employee')
  } catch (err) {
    errorMessage.value = `Erreur : ${err.message}`
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col w-full h-full min-h-0 overflow-y-auto md:overflow-hidden py-1 md:py-1.5">
    <div class="card bg-base-200 border border-base-300/60 shadow-xs rounded-m3-xl p-3.5 sm:p-5 lg:p-6 w-full flex-1 flex flex-col justify-between gap-3 sm:gap-4 md:gap-5">
      <!-- En-tête navigation avec touch target 44px+ -->
      <div class="flex items-center justify-between border-b border-base-300/40 pb-2.5 sm:pb-3.5 shrink-0">
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
          <h1 class="text-base sm:text-xl font-extrabold text-base-content tracking-tight">Valider mon départ</h1>
          <p class="text-xs text-base-content/60">Merci pour votre travail, bonne fin de journée !</p>
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
      <div v-else class="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-5 md:gap-6 items-stretch flex-1 min-h-0">
        <!-- Colonne Gauche (5/12) : Radar GPS contextuel -->
        <div class="md:col-span-5 bg-base-100/70 border border-base-300/40 rounded-m3-lg p-3 sm:p-5 shadow-xs flex flex-col justify-center items-center h-full">
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

        <!-- Colonne Droite (7/12) : Statut du site, synthèse contextuelle et action de départ -->
        <div class="md:col-span-7 bg-base-100/70 border border-base-300/40 rounded-m3-lg p-3.5 sm:p-5 lg:p-6 shadow-xs flex flex-col justify-between h-full gap-3 sm:gap-4">
          <!-- Partie haute : Statut du site de pointage -->
          <div class="flex flex-col gap-3">
            <div v-if="activeLocation" class="bg-base-200/80 border border-base-300/60 p-3.5 sm:p-4 rounded-m3-md flex flex-col gap-2.5 shadow-xs">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span
                    class="w-2.5 h-2.5 rounded-full shrink-0"
                    :class="perimeterResult.inPerimeter ? 'bg-success animate-pulse' : 'bg-base-content/30'"
                  ></span>
                  <span class="text-xs font-semibold text-base-content/75">
                    {{ perimeterResult.inPerimeter ? 'Vous êtes au bon endroit' : 'Lieu de pointage' }}
                  </span>
                </div>
                <span v-if="perimeterResult.inPerimeter" class="badge badge-success text-[10px] font-bold rounded-m3-xs py-1 px-2.5">
                  Sur place
                </span>
                <span v-else class="badge badge-ghost text-[10px] text-base-content/60 rounded-m3-xs py-1 px-2.5">
                  À distance du site
                </span>
              </div>

              <div class="text-sm sm:text-lg font-bold text-base-content flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 sm:w-5 sm:h-5 text-warning shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{{ activeLocation.name }}</span>
              </div>
            </div>

            <!-- Fiche récapitulative contextuelle de départ -->
            <div class="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div class="bg-base-200/50 border border-base-300/40 rounded-m3-md p-3 flex flex-col gap-1">
                <span class="text-[11px] font-medium text-base-content/60 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Statut session
                </span>
                <span class="text-sm sm:text-base font-bold text-base-content">
                  En cours de service
                </span>
              </div>

              <div class="bg-base-200/50 border border-base-300/40 rounded-m3-md p-3 flex flex-col gap-1">
                <span class="text-[11px] font-medium text-base-content/60 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                    <path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4z" />
                  </svg>
                  Signal GPS
                </span>
                <span class="text-sm sm:text-base font-bold text-base-content">
                  {{ gpsAccuracy ? `±${Math.round(gpsAccuracy)} m` : 'Recherche...' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Partie basse : Guidage contextuel, alertes et action de confirmation départ -->
          <div class="flex flex-col gap-2.5 mt-auto">
            <!-- Conseils contextuels d'acquisition GPS si hors périmètre ou signal imprécis -->
            <div
              v-if="!perimeterResult.inPerimeter && !isLocating && activeLocation && !isSuccess"
              class="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-m3-md bg-base-200/70 border border-base-300/60 text-xs text-base-content/75 shadow-2xs"
            >
              <div class="w-5 h-5 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="font-bold text-base-content text-[11px] uppercase tracking-wider">Aide à la localisation</span>
                <span v-if="gpsAccuracy && gpsAccuracy > 35" class="leading-relaxed">
                  Précision satellite fluctuante (±{{ Math.round(gpsAccuracy) }} m). Activer le Wi-Fi (même sans s'y connecter) ou vous approcher d'une ouverture permet de stabiliser le signal.
                </span>
                <span v-else class="leading-relaxed">
                  Vous devez être situé sur votre lieu de travail (<strong class="text-base-content">{{ activeLocation.name }}</strong>, à {{ formatDistance(perimeterResult.distance) }}) pour valider votre départ.
                </span>
              </div>
            </div>

            <div v-if="gpsError" class="alert alert-error text-xs py-2 sm:py-2.5 rounded-m3-md">
              <span>{{ gpsError }}</span>
            </div>

            <div v-if="errorMessage" class="alert alert-error text-xs py-2 sm:py-2.5 rounded-m3-md">
              <span>{{ errorMessage }}</span>
            </div>

            <button
              type="button"
              class="btn w-full text-sm sm:text-base font-bold min-h-12 sm:min-h-13 shadow-xs rounded-m3-md active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-offset-2"
              :class="[
                isSuccess
                  ? 'btn-success text-success-content focus-visible:ring-success'
                  : 'btn-warning text-warning-content focus-visible:ring-warning'
              ]"
              :disabled="!perimeterResult.inPerimeter || isSubmitting || isSuccess || !activeLocation"
              @click="handleConfirmCheckOut"
            >
              <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
              <span v-if="isSubmitting">Validation de votre départ en cours...</span>
              <template v-else-if="isSuccess">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Départ validé</span>
              </template>
              <span v-else-if="perimeterResult.inPerimeter">
                Confirmer mon départ
              </span>
              <span v-else>Rapprochez-vous pour valider</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

