<script setup>
import { computed } from 'vue'
import StatusBadge from '../shared/StatusBadge.vue'

const props = defineProps({
  presence: {
    type: Object,
    default: null,
  },
  expectedArrivalTime: {
    type: String,
    default: '09:00:00',
  },
})

const emit = defineEmits(['checkIn', 'checkOut', 'openAvailabilities'])

const todayFormatted = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
})

const formatTime = (isoStr) => {
  if (!isoStr) return '--:--'
  const d = new Date(isoStr)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="day-status-card">
    <div class="card-header">
      <div>
        <span class="date-caption">Aujourd'hui</span>
        <h2 class="date-title">{{ todayFormatted }}</h2>
      </div>
      <StatusBadge v-if="presence" :status="presence.status" />
      <span v-else class="badge-waiting">Non pointé</span>
    </div>

    <!-- Détails des horaires -->
    <div class="time-grid">
      <div class="time-box">
        <span class="time-label">Arrivée</span>
        <span class="time-value">
          {{ presence?.check_in_time ? formatTime(presence.check_in_time) : '--:--' }}
        </span>
        <span class="time-sub">Attendu : {{ expectedArrivalTime.slice(0, 5) }}</span>
      </div>

      <div class="time-box">
        <span class="time-label">Départ</span>
        <span class="time-value">
          {{ presence?.check_out_time ? formatTime(presence.check_out_time) : '--:--' }}
        </span>
        <span class="time-sub">{{ presence?.check_out_time ? 'Validé' : 'En attente' }}</span>
      </div>
    </div>

    <!-- Actions principales contextuelles -->
    <div class="card-actions">
      <!-- Cas 1 : Aucun pointage d'arrivée -->
      <button
        v-if="!presence"
        type="button"
        class="action-btn btn-check-in"
        @click="emit('checkIn')"
      >
        <span class="btn-icon">📍</span>
        Pointer mon arrivée
      </button>

      <!-- Cas 2 : Arrivée validée mais pas de départ -->
      <button
        v-else-if="!presence.check_out_time"
        type="button"
        class="action-btn btn-check-out"
        @click="emit('checkOut')"
      >
        <span class="btn-icon">🏁</span>
        Pointer mon départ
      </button>

      <!-- Cas 3 : Journée achevée -->
      <div v-else class="day-completed-notice">
        ✓ Journée entièrement enregistrée.
      </div>

      <button
        type="button"
        class="btn-secondary"
        @click="emit('openAvailabilities')"
      >
        📅 Mes disponibilités de la semaine
      </button>
    </div>
  </div>
</template>

<style scoped>
.day-status-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 1.25rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.date-caption {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted, #64748b);
  letter-spacing: 0.05em;
}

.date-title {
  margin: 0.2rem 0 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main, #1e293b);
  text-transform: capitalize;
}

.badge-waiting {
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
}

.time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  background: var(--bg-subtle, #f8fafc);
  padding: 1rem;
  border-radius: 0.85rem;
  border: 1px solid var(--border-color, #e2e8f0);
}

.time-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.time-label {
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
  font-weight: 600;
}

.time-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-main, #1e293b);
  margin: 0.15rem 0;
}

.time-sub {
  font-size: 0.7rem;
  color: var(--text-muted, #94a3b8);
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.95rem;
  border-radius: 0.85rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-check-in {
  background-color: #10b981;
  color: white;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
}

.btn-check-in:hover {
  background-color: #059669;
}

.btn-check-out {
  background-color: #f59e0b;
  color: white;
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.25);
}

.btn-check-out:hover {
  background-color: #d97706;
}

.day-completed-notice {
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: #059669;
  background: #ecfdf5;
  padding: 0.85rem;
  border-radius: 0.85rem;
  border: 1px solid #a7f3d0;
}

.btn-secondary {
  background: transparent;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  padding: 0.75rem;
  border-radius: 0.85rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #eff6ff;
}

.btn-icon {
  font-size: 1.1rem;
}
</style>
