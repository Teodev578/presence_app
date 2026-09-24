<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from '../../router'
import { useGeolocation, formatDistance } from '../../composables/useGeolocation'
import { usePresences } from '../../composables/usePresences'
import { useProfile } from '../../composables/useProfile'
import { db } from '../../lib/db'
import { supabase } from '../../lib/supabase'
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

const { checkIn } = usePresences()
const { profile } = useProfile()

const locations = ref([])
const manualSelectedLocation = ref(null)
const isSubmitting = ref(false)
const errorMessage = ref('')
const isLoadingLocations = ref(true)

onMounted(async () => {
  startWatching()

  try {
    isLoadingLocations.value = true
    // Récupération stricte des sites actifs réels sans filtres de type IndexedDB restrictifs
    let list = await db.locations
      .filter(
        (loc) =>
          !loc.deleted_at &&
          (loc.is_active === true || loc.is_active === 1 || loc.is_active === 'true')
      )
      .toArray()

    // Si le cache local est vide, synchronisation initiale depuis Supabase
    if (!list.length && navigator.onLine) {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .is('deleted_at', null)
      if (!error && data && data.length) {
        list = data
        await db.locations.bulkPut(data)
      }
    }

    locations.value = list
  } catch (err) {
    console.error('Erreur chargement sites :', err)
  } finally {
    isLoadingLocations.value = false
  }
})

onUnmounted(() => {
  stopWatching()
})

// Détection automatique en temps réel du site le plus proche ou correspondant
const autoMatch = computed(() => {
  return findMatchingLocation(currentCoords.value, locations.value)
})

// Site actif retenu : sélection manuelle prioritaire, sinon détection automatique
const selectedLocation = computed({
  get() {
    if (manualSelectedLocation.value) {
      return manualSelectedLocation.value
    }
    return autoMatch.value.matchedLocation || autoMatch.value.closestLocation || null
  },
  set(val) {
    manualSelectedLocation.value = val
  },
})

// Résultat du calcul de distance sur le site retenu
const perimeterResult = computed(() => {
  if (!selectedLocation.value || !currentCoords.value) {
    return { inPerimeter: false, distance: 0, allowedRadius: 50 }
  }
  return checkPerimeter(selectedLocation.value)
})

const handleConfirmCheckIn = async () => {
  if (!selectedLocation.value) {
    errorMessage.value = 'Aucun site de pointage sélectionné.'
    return
  }

  if (!perimeterResult.value.inPerimeter) {
    errorMessage.value = 'Rapprochez-vous du site pour valider votre présence.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await checkIn({
      locationId: selectedLocation.value.id,
      coords: currentCoords.value,
      accuracy: gpsAccuracy.value,
      expectedArrivalTime: profile.value?.expected_arrival_time || '09:00:00',
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
  <div class="flex-1 flex flex-col justify-center items-center py-2 sm:py-4 md:py-6 w-full h-full min-h-0 overflow-y-auto">
    <div class="card bg-base-200 border border-base-300/60 shadow-xs rounded-m3-xl p-4 sm:p-6 lg:p-7 w-full max-w-md md:max-w-3xl lg:max-w-4xl flex flex-col gap-4 sm:gap-5 my-auto">
      <!-- En-tête navigation avec touch target 44px+ -->
      <div class="flex items-center justify-between border-b border-base-300/40 pb-3">
        <button
          type="button"
          class="btn btn-ghost btn-sm min-h-11 px-3 text-xs font-semibold gap-1.5 rounded-m3-sm text-base-content/75 hover:text-base-content focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          @click="navigate('/employee')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Retour</span>
        </button>
        <div class="text-right">
          <h1 class="text-base sm:text-lg font-extrabold text-base-content tracking-tight">Pointer l'arrivée</h1>
          <p class="text-[11px] text-base-content/60">Vérification de votre présence</p>
        </div>
      </div>

      <!-- Si aucun site n'est configuré en base -->
      <div
        v-if="!isLoadingLocations && locations.length === 0"
        class="alert alert-warning text-xs py-3 rounded-m3-md flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>Aucun lieu de travail actif n'est configuré pour le moment. Contactez votre responsable.</span>
      </div>

      <!-- Corps adaptatif : colonne unique sur mobile, 2 colonnes sur tablette/desktop -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        <!-- Colonne Gauche : Radar GPS contextuel -->
        <div class="bg-base-100/70 border border-base-300/40 rounded-m3-lg p-2 sm:p-4 shadow-xs flex flex-col justify-center items-center">
          <GpsRing
            :in-perimeter="perimeterResult.inPerimeter"
            :distance="perimeterResult.distance"
            :allowed-radius="perimeterResult.allowedRadius"
            :accuracy="gpsAccuracy"
            :is-locating="isLocating"
            :site-name="selectedLocation?.name || ''"
            :closest-site-name="selectedLocation?.name || ''"
            :has-sites-configured="locations.length > 0"
          />
        </div>

        <!-- Colonne Droite : Statut du site, alertes et bouton d'action -->
        <div class="flex flex-col justify-between gap-3 sm:gap-4">
          <!-- Carte statut de localisation contextuelle -->
          <div v-if="selectedLocation" class="bg-base-100/90 border border-base-300/50 p-3.5 sm:p-4 rounded-m3-lg flex flex-col gap-2.5 shadow-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span
                  class="w-2.5 h-2.5 rounded-full shrink-0"
                  :class="perimeterResult.inPerimeter ? 'bg-success animate-pulse' : 'bg-base-content/30'"
                ></span>
                <span class="text-xs font-semibold text-base-content/75">
                  {{ perimeterResult.inPerimeter ? 'Lieu de travail confirmé' : 'Lieu le plus proche' }}
                </span>
              </div>
              <span v-if="perimeterResult.inPerimeter" class="badge badge-success text-[10px] font-bold rounded-m3-xs py-1 px-2">
                Vous êtes sur place
              </span>
              <span v-else class="badge badge-ghost text-[10px] text-base-content/60 rounded-m3-xs py-1 px-2">
                À distance du site
              </span>
            </div>

            <div class="text-sm sm:text-base font-bold text-base-content flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{{ selectedLocation.name }}</span>
            </div>

            <!-- Sélecteur manuel discret de dérogation si plusieurs sites configurés -->
            <div v-if="locations.length > 1" class="pt-2 border-t border-base-300/40 flex items-center justify-between gap-2">
              <label for="loc-select" class="text-[11px] text-base-content/60 font-medium">Changer de lieu :</label>
              <select
                id="loc-select"
                v-model="selectedLocation"
                class="select select-bordered select-xs rounded-m3-sm text-xs font-normal max-w-xs"
              >
                <option v-for="loc in locations" :key="loc.id" :value="loc">
                  {{ loc.name }} (tolérance : {{ loc.radius_meters }}m)
                </option>
              </select>
            </div>
          </div>

          <!-- Alertes d'erreurs éventuelles -->
          <div v-if="gpsError" class="alert alert-error text-xs py-2.5 rounded-m3-md">
            <span>{{ gpsError }}</span>
          </div>

          <div v-if="errorMessage" class="alert alert-error text-xs py-2.5 rounded-m3-md">
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Zone d'action de confirmation -->
          <div class="flex flex-col gap-2 pt-2 border-t border-base-300/40 mt-auto">
            <button
              type="button"
              class="btn btn-primary w-full text-sm sm:text-base font-bold min-h-12 sm:min-h-13 shadow-xs rounded-m3-md active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              :disabled="!perimeterResult.inPerimeter || isSubmitting || locations.length === 0"
              @click="handleConfirmCheckIn"
            >
              <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
              <span v-if="isSubmitting">Enregistrement de votre arrivée...</span>
              <span v-else-if="perimeterResult.inPerimeter">
                Confirmer mon arrivée sur {{ selectedLocation?.name }}
              </span>
              <span v-else>En attente de votre arrivée sur site</span>
            </button>
            <p class="text-[11px] text-base-content/50 text-center">
              Fonctionne même sans connexion. Synchronisation automatique.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
