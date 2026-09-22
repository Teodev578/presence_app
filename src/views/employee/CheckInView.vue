<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from '../../router'
import { useGeolocation } from '../../composables/useGeolocation'
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
} = useGeolocation()

const { checkIn } = usePresences()
const { profile } = useProfile()

const locations = ref([])
const selectedLocation = ref(null)
const isSubmitting = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  startWatching()

  try {
    let list = await db.locations.where('is_active').equals(1).toArray()
    if (!list.length) {
      const { data } = await supabase.from('locations').select('*').eq('is_active', true)
      if (data && data.length) {
        list = data
        await db.locations.bulkPut(data)
      }
    }

    if (!list.length) {
      list = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Siège Principal / Site Central',
          latitude: 48.8566,
          longitude: 2.3522,
          radius_meters: 100000,
        },
      ]
    }

    locations.value = list
    selectedLocation.value = list[0]
  } catch (err) {
    console.error('Erreur chargement sites :', err)
  }
})

onUnmounted(() => {
  stopWatching()
})

const perimeterResult = computed(() => {
  if (!selectedLocation.value || !currentCoords.value) {
    return { inPerimeter: false, distance: 0, allowedRadius: 50 }
  }
  return checkPerimeter(selectedLocation.value)
})

const handleConfirmCheckIn = async () => {
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
      <h1 class="text-base font-bold text-base-content">Pointer l'arrivée</h1>
      <span class="w-16"></span>
    </div>

    <!-- Sélecteur de site si multiple -->
    <div v-if="locations.length > 1" class="fieldset">
      <label for="loc-select" class="fieldset-legend text-xs font-semibold text-base-content/70">
        Site de pointage
      </label>
      <select id="loc-select" v-model="selectedLocation" class="select select-bordered w-full rounded-m3-md text-sm">
        <option v-for="loc in locations" :key="loc.id" :value="loc">
          {{ loc.name }} (rayon {{ loc.radius_meters }}m)
        </option>
      </select>
    </div>
    <div v-else-if="selectedLocation" class="card bg-base-200 border border-base-300/60 p-3 rounded-m3-md text-center text-xs text-base-content/70">
      Site : <strong class="text-base-content">{{ selectedLocation.name }}</strong>
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
    <div v-if="gpsError" class="alert alert-error text-xs py-2.5 rounded-m3-md">
      <span>{{ gpsError }}</span>
    </div>

    <!-- Message d'erreur de soumission -->
    <div v-if="errorMessage" class="alert alert-error text-xs py-2.5 rounded-m3-md">
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Bouton de confirmation -->
    <div class="flex flex-col gap-2.5 mt-2">
      <button
        type="button"
        class="btn btn-primary w-full text-base font-bold min-h-14 shadow-xs rounded-m3-md active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        :disabled="!perimeterResult.inPerimeter || isSubmitting"
        @click="handleConfirmCheckIn"
      >
        <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
        <span v-if="isSubmitting">Enregistrement...</span>
        <span v-else-if="perimeterResult.inPerimeter">Valider l'arrivée</span>
        <span v-else>Périmètre non atteint</span>
      </button>
      <p class="text-[11px] text-base-content/50 text-center">
        Disponible hors ligne. Enregistrement local automatique.
      </p>
    </div>
  </div>
</template>
