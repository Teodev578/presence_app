<script setup>
import { useRouter } from '../../router'
import { useProfile } from '../../composables/useProfile'
import { usePresences } from '../../composables/usePresences'
import DayCard from '../../components/employee/DayCard.vue'

const { navigate } = useRouter()
const { profile } = useProfile()
const { todayPresence } = usePresences()
</script>

<template>
  <div class="home-view">
    <div class="user-greeting">
      <div>
        <h1 class="welcome-text">Bonjour, {{ profile?.full_name || 'Collaborateur' }} 👋</h1>
        <p class="role-caption">
          Rôle : <span class="capitalize">{{ profile?.role || 'Employé' }}</span>
        </p>
      </div>
    </div>

    <!-- Carte statut du jour -->
    <DayCard
      :presence="todayPresence"
      :expected-arrival-time="profile?.expected_arrival_time || '09:00:00'"
      @check-in="navigate('/employee/check-in')"
      @check-out="navigate('/employee/check-out')"
      @open-availabilities="navigate('/employee/availabilities')"
    />

    <!-- Conseils rapides -->
    <div class="info-card">
      <div class="info-icon">💡</div>
      <div class="info-text">
        <strong>Pensez à déclarer vos disponibilités</strong> pour la semaine prochaine afin de faciliter l'organisation des équipes.
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 520px;
  margin: 0 auto;
}

.user-greeting {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-main, #1e293b);
  margin: 0;
}

.role-caption {
  font-size: 0.8rem;
  color: var(--text-muted, #64748b);
  margin: 0.2rem 0 0;
}

.capitalize {
  text-transform: capitalize;
  font-weight: 600;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1rem 1.15rem;
}

.info-icon {
  font-size: 1.5rem;
}

.info-text {
  font-size: 0.85rem;
  color: var(--text-muted, #475569);
  line-height: 1.4;
}
</style>
