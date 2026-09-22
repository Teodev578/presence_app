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

  // Chargement local des sites
  try {
    let list = await db.locations.where('is_active').equals(1).toArray()
    if (!list.length) {
      // Tentative de récupération distante
      const { data } = await supabase.from('locations').select('*').eq('is_active', true)
      if (data && data.length) {
        list = data
        await db.locations.bulkPut(data)
      }
    }

    // Si aucun site n'est encore configuré en base, créer un site de démonstration pour le test
    if (!list.length) {
      list = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Siège Principal / Site Central',
          latitude: 48.8566, // Par défaut Paris si non localisé
          longitude: 2.3522,
          radius_meters: 100000, // Périmètre large en mode dev pour faciliter les tests
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

// Évaluation en temps réel du périmètre
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
    navigate('/employee')
  } catch (err) {
    errorMessage.value = `Erreur : ${err.message}`
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="check-in-view">
    <div class="header-nav">
      <button type="button" class="back-link" @click="navigate('/employee')">
        ← Annuler
      </button>
      <h2 class="view-title">Pointer mon arrivée</h2>
      <span style="width: 40px"></span>
    </div>

    <!-- Sélecteur de site si multiple -->
    <div v-if="locations.length > 1" class="location-select-box">
      <label for="loc-select" class="loc-label">Site de pointage :</label>
      <select id="loc-select" v-model="selectedLocation" class="loc-dropdown">
        <option v-for="loc in locations" :key="loc.id" :value="loc">
          {{ loc.name }} (rayon {{ loc.radius_meters }}m)
        </option>
      </select>
    </div>
    <div v-else-if="selectedLocation" class="single-loc-badge">
      📍 Site ciblé : <strong>{{ selectedLocation.name }}</strong>
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

    <!-- Bouton de confirmation -->
    <div class="action-footer">
      <button
        type="button"
        class="confirm-btn"
        :disabled="!perimeterResult.inPerimeter || isSubmitting"
        @click="handleConfirmCheckIn"
      >
        <span v-if="isSubmitting">Enregistrement...</span>
        <span v-else-if="perimeterResult.inPerimeter">✓ Confirmer ma présence</span>
        <span v-else>⚠️ Rapprochez-vous du site</span>
      </button>
      <p class="offline-hint">
        Fonctionne hors-ligne : votre présence sera mémorisée localement et transmise dès le retour du réseau.
      </p>
    </div>
  </div>
</template>

<style scoped>
.check-in-view {
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

.location-select-box {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.loc-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted, #64748b);
}

.loc-dropdown {
  padding: 0.65rem;
  border-radius: 0.65rem;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  color: var(--text-main, #1e293b);
  font-size: 0.9rem;
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
  background-color: #10b981;
  color: white;
  border: none;
  padding: 1.1rem;
  border-radius: 0.85rem;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: all 0.2s ease;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #059669;
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
