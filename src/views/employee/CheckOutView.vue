<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from '../../router'
import { useGeolocation } from '../../composables/useGeolocation'
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
} = useGeolocation()

const { todayPresence, checkOut } = usePresences()

const location = ref(null)
const isSubmitting = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  startWatching()

  if (todayPresence.value?.location_id) {
    try {
      const loc = await db.locations.get(todayPresence.value.location_id)
      if (loc) {
        location.value = loc
      }
    } catch (e) {
      console.warn('Erreur chargement site départ :', e)
    }
  }

  if (!location.value) {
    location.value = {
      name: 'Site de pointage',
      latitude: 48.8566,
      longitude: 2.3522,
      radius_meters: 100000,
    }
  }
})

onUnmounted(() => {
  stopWatching()
})

const perimeterResult = computed(() => {
  if (!location.value || !currentCoords.value) {
    return { inPerimeter: false, distance: 0, allowedRadius: 50 }
  }
  return checkPerimeter(location.value)
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
    <!-- En-tête navigation -->
    <div class="flex items-center justify-between">
      <button type="button" class="btn btn-ghost btn-sm text-xs font-semibold gap-1" @click="navigate('/employee')">
        ← Annuler
      </button>
      <h1 class="text-base font-bold text-base-content">Pointer le départ</h1>
      <span class="w-16"></span>
    </div>

    <div v-if="location" class="card bg-base-100 border border-base-300 p-3 rounded-xl text-center text-xs text-base-content/70">
      Site : <strong class="text-base-content">{{ location.name }}</strong>
    </div>

    <!-- Radar GPS -->
    <GpsRing
      :in-perimeter="perimeterResult.inPerimeter"
      :distance="perimeterResult.distance"
      :allowed-radius="perimeterResult.allowedRadius"
      :accuracy="gpsAccuracy"
      :is-locating="isLocating"
    />

    <!-- Erreur GPS éventuelle -->
    <div v-if="gpsError" class="alert alert-error text-xs py-2.5 rounded-xl">
      <span>{{ gpsError }}</span>
    </div>

    <!-- Message d'erreur de soumission -->
    <div v-if="errorMessage" class="alert alert-error text-xs py-2.5 rounded-xl">
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Bouton de confirmation départ -->
    <div class="flex flex-col gap-2.5 mt-2">
      <button
        type="button"
        class="btn btn-warning text-warning-content w-full text-base font-bold min-h-12 shadow-sm rounded-xl active:scale-98 transition-transform"
        :disabled="!perimeterResult.inPerimeter || isSubmitting"
        @click="handleConfirmCheckOut"
      >
        <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
        <span v-if="isSubmitting">Validation...</span>
        <span v-else-if="perimeterResult.inPerimeter">Valider le départ</span>
        <span v-else>Périmètre non atteint</span>
      </button>
      <p class="text-[11px] text-base-content/50 text-center">
        Disponible hors ligne. Enregistrement local automatique.
      </p>
    </div>
  </div>
</template>
