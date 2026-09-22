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

  // Fallback si non trouvé
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
  <div class="check-out-view">
    <div class="header-nav">
      <button type="button" class="back-link" @click="navigate('/employee')">
        ← Annuler
      </button>
      <h2 class="view-title">Pointer mon départ</h2>
      <span style="width: 40px"></span>
    </div>

    <div v-if="location" class="single-loc-badge">
      🏁 Site de départ : <strong>{{ location.name }}</strong>
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
    <div v-if="gpsError" class="alert-error">
      {{ gpsError }}
    </div>

    <!-- Message d'erreur de soumission -->
    <div v-if="errorMessage" class="alert-error">
      {{ errorMessage }}
    </div>

    <!-- Bouton de confirmation départ -->
    <div class="action-footer">
      <button
        type="button"
        class="confirm-btn"
        :disabled="!perimeterResult.inPerimeter || isSubmitting"
        @click="handleConfirmCheckOut"
      >
        <span v-if="isSubmitting">Validation...</span>
        <span v-else-if="perimeterResult.inPerimeter">✓ Terminer ma journée</span>
        <span v-else>⚠️ Retournez sur le site</span>
      </button>
      <p class="offline-hint">
        Enregistrement immédiat dans votre base locale avec transmission garantie.
      </p>
    </div>
  </div>
</template>

<style scoped>
.check-out-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 520px;
  margin: 0 auto;
}

.header-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-link {
  background: none;
  border: none;
  color: var(--text-muted, #64748b);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem;
}

.view-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-main, #1e293b);
}

.single-loc-badge {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-muted, #475569);
  background: #f1f5f9;
  padding: 0.6rem;
  border-radius: 0.75rem;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #f87171;
  color: #991b1b;
  font-size: 0.85rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  text-align: center;
}

.action-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.confirm-btn {
  background-color: #f59e0b;
  color: white;
  border: none;
  padding: 1.1rem;
  border-radius: 0.85rem;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  transition: all 0.2s ease;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #d97706;
}

.confirm-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
}

.offline-hint {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
  margin: 0;
}
</style>
