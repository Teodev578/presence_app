<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from '../../router'
import { supabase } from '../../lib/supabase'
import { db } from '../../lib/db'
import StatCard from '../../components/manager/StatCard.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'

const { navigate } = useRouter()

const todayStr = new Date().toISOString().slice(0, 10)
const loading = ref(true)

const totalEmployees = ref(0)
const presencesToday = ref([])

onMounted(async () => {
  loading.value = true
  try {
    // 1. Nombre total d'employés actifs
    const { count: empCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('deleted_at', null)

    totalEmployees.value = empCount || 0

    // 2. Présences du jour
    const { data: presences } = await supabase
      .from('presences')
      .select('*, profiles(full_name, email, role), locations(name)')
      .eq('work_date', todayStr)
      .is('deleted_at', null)
      .order('check_in_time', { ascending: false })

    presencesToday.value = presences || []
  } catch (err) {
    console.error('Erreur chargement dashboard manager :', err)
  } finally {
    loading.value = false
  }
})

const onTimeCount = computed(() => {
  return presencesToday.value.filter((p) => p.status === 'present' || p.status === 'completed')
    .length
})

const lateCount = computed(() => {
  return presencesToday.value.filter((p) => p.status === 'late').length
})

const absentCount = computed(() => {
  const total = totalEmployees.value
  const presentOrLate = presencesToday.value.length
  return Math.max(0, total - presentOrLate)
})

const formatTime = (iso) => {
  if (!iso) return '--:--'
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="dashboard-view">
    <div class="view-header">
      <div>
        <h2 class="section-title">Tableau de bord de l'activité</h2>
        <p class="section-desc">Statut des effectifs pour la journée du {{ todayStr }}</p>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="btn-primary"
          @click="navigate('/manager/presences')"
        >
          Voir tous les pointages →
        </button>
      </div>
    </div>

    <!-- Grille des statistiques clés -->
    <div class="stats-grid">
      <StatCard
        title="Effectif Actif"
        :value="totalEmployees"
        icon="👥"
        subtitle="Employés enregistrés"
        color="blue"
      />
      <StatCard
        title="Présents à l'heure"
        :value="onTimeCount"
        icon="✅"
        subtitle="Pointages conformes"
        color="green"
      />
      <StatCard
        title="Retards signalés"
        :value="lateCount"
        icon="⏰"
        subtitle="Arrivée après l'horaire attendu"
        color="amber"
      />
      <StatCard
        title="Non pointés / Absents"
        :value="absentCount"
        icon="⚠️"
        subtitle="En attente de pointage"
        color="red"
      />
    </div>

    <!-- Derniers pointages récents -->
    <div class="card-section">
      <div class="card-header">
        <h3 class="card-title">Derniers pointages enregistrés aujourd'hui</h3>
        <span class="count-pill">{{ presencesToday.length }} pointage(s)</span>
      </div>

      <div v-if="loading" class="loading-state">
        Chargement des données en cours...
      </div>

      <div v-else-if="!presencesToday.length" class="empty-state">
        Aucun pointage enregistré pour le moment aujourd'hui.
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Collaborateur</th>
              <th>Site</th>
              <th>Arrivée</th>
              <th>Départ</th>
              <th>Statut</th>
              <th>Précision GPS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in presencesToday.slice(0, 8)" :key="p.id">
              <td class="col-user">
                <strong>{{ p.profiles?.full_name || 'Utilisateur inconnu' }}</strong>
                <span class="sub-email">{{ p.profiles?.email }}</span>
              </td>
              <td>{{ p.locations?.name || 'Site principal' }}</td>
              <td class="col-mono">{{ formatTime(p.check_in_time) }}</td>
              <td class="col-mono">{{ formatTime(p.check_out_time) }}</td>
              <td>
                <StatusBadge :status="p.status" />
              </td>
              <td class="col-sub">±{{ Math.round(p.check_in_accuracy) }} m</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #0f172a;
}

.section-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.25rem 0 0;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.65rem 1.15rem;
  border-radius: 0.6rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}

.card-section {
  background: #ffffff;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.count-pill {
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;
}

.data-table th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.85rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 0.95rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.col-user {
  display: flex;
  flex-direction: column;
}

.sub-email {
  font-size: 0.75rem;
  color: #64748b;
}

.col-mono {
  font-family: ui-monospace, monospace;
  font-weight: 600;
}

.col-sub {
  color: #64748b;
  font-size: 0.8rem;
}

.loading-state,
.empty-state {
  padding: 3rem;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
}
</style>
