<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { getMonday, formatWeekLabel } from '../../composables/useAvailabilities'

const selectedWeekStart = ref(getMonday())
const employees = ref([])
const availabilities = ref([])
const presences = ref([])
const loading = ref(true)

const daysHeader = [
  { id: 1, label: 'Lundi' },
  { id: 2, label: 'Mardi' },
  { id: 3, label: 'Mercredi' },
  { id: 4, label: 'Jeudi' },
  { id: 5, label: 'Vendredi' },
]

const nextWeek = () => {
  const d = new Date(selectedWeekStart.value)
  d.setDate(d.getDate() + 7)
  selectedWeekStart.value = d.toISOString().slice(0, 10)
}

const prevWeek = () => {
  const d = new Date(selectedWeekStart.value)
  d.setDate(d.getDate() - 7)
  selectedWeekStart.value = d.toISOString().slice(0, 10)
}

const loadData = async () => {
  loading.value = true
  try {
    // 1. Liste des profils employés
    const { data: profs } = await supabase
      .from('profiles')
      .select('*, teams(name)')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('full_name')

    employees.value = profs || []

    // 2. Disponibilités pour cette semaine
    const { data: avails } = await supabase
      .from('availabilities')
      .select('*')
      .eq('week_start', selectedWeekStart.value)
      .is('deleted_at', null)

    availabilities.value = avails || []

    // 3. Présences réelles pour les jours de cette semaine
    const baseDate = new Date(selectedWeekStart.value)
    const endDate = new Date(baseDate)
    endDate.setDate(baseDate.getDate() + 5)

    const { data: pres } = await supabase
      .from('presences')
      .select('*')
      .gte('work_date', selectedWeekStart.value)
      .lt('work_date', endDate.toISOString().slice(0, 10))
      .is('deleted_at', null)

    presences.value = pres || []
  } catch (err) {
    console.error('Erreur chargement planning équipe :', err)
  } finally {
    loading.value = false
  }
}

watch(selectedWeekStart, () => {
  loadData()
})

onMounted(() => {
  loadData()
})

// Calcule la date ISO pour un jour donné de la semaine
const getDateForDay = (dayNumber) => {
  const d = new Date(selectedWeekStart.value)
  d.setDate(d.getDate() + (dayNumber - 1))
  return d.toISOString().slice(0, 10)
}

// Vérifie si un employé a déclaré sa disponibilité pour un jour
const getAvailability = (userId, dayNumber) => {
  return availabilities.value.find(
    (a) => a.user_id === userId && a.day_of_week === dayNumber
  )
}

// Vérifie si un employé a effectivement pointé pour un jour
const getActualPresence = (userId, dayNumber) => {
  const dateStr = getDateForDay(dayNumber)
  return presences.value.find((p) => p.user_id === userId && p.work_date === dateStr)
}
</script>

<template>
  <div class="manager-availabilities-view">
    <div class="view-header">
      <div>
        <h2 class="section-title">Disponibilités de l'Équipe</h2>
        <p class="section-desc">
          Vue croisée : déclarations des collaborateurs et conformité des présences (Prévu vs Réel)
        </p>
      </div>

      <!-- Navigation temporelle -->
      <div class="week-picker">
        <button type="button" class="btn-nav" @click="prevWeek">←</button>
        <span class="week-text">{{ formatWeekLabel(selectedWeekStart) }}</span>
        <button type="button" class="btn-nav" @click="nextWeek">→</button>
      </div>
    </div>

    <!-- Tableau croisé matriciel -->
    <div class="matrix-card">
      <div v-if="loading" class="state-msg">
        Chargement de la grille d'équipe...
      </div>
      <div v-else-if="!employees.length" class="state-msg">
        Aucun collaborateur actif répertorié.
      </div>
      <div v-else class="table-responsive">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="col-fixed">Collaborateur</th>
              <th v-for="d in daysHeader" :key="d.id" class="col-day">
                <div class="day-th-title">{{ d.label }}</div>
                <div class="day-th-sub">{{ getDateForDay(d.id).slice(5) }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in employees" :key="emp.id">
              <td class="col-fixed user-cell">
                <div class="name-box">
                  <strong>{{ emp.full_name }}</strong>
                  <span class="team-tag">{{ emp.teams?.name || 'Sans équipe' }}</span>
                </div>
              </td>

              <td
                v-for="d in daysHeader"
                :key="d.id"
                class="cell-status"
              >
                <!-- Disponibilité déclarée -->
                <div
                  v-if="getAvailability(emp.id, d.id)"
                  class="pill-avail"
                  :class="{
                    'pill-matched': getActualPresence(emp.id, d.id),
                    'pill-unmatched': !getActualPresence(emp.id, d.id) && getDateForDay(d.id) <= new Date().toISOString().slice(0, 10)
                  }"
                  :title="getAvailability(emp.id, d.id)?.note || 'Disponible'"
                >
                  <span class="avail-icon">✓ Dispo</span>
                  <span
                    v-if="getActualPresence(emp.id, d.id)"
                    class="pointage-tag"
                  >
                    Pointé ({{ getActualPresence(emp.id, d.id)?.status }})
                  </span>
                  <span
                    v-else-if="getDateForDay(d.id) <= new Date().toISOString().slice(0, 10)"
                    class="gap-tag"
                  >
                    Non pointé
                  </span>
                </div>
                <div v-else class="pill-none">
                  -
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.manager-availabilities-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  color: #0f172a;
}

.section-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.2rem 0 0;
}

.week-picker {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #ffffff;
  padding: 0.5rem 0.85rem;
  border-radius: 0.65rem;
  border: 1px solid var(--border-color, #e2e8f0);
}

.btn-nav {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
}

.week-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}

.matrix-card {
  background: #ffffff;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.table-responsive {
  overflow-x: auto;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.matrix-table th {
  background: #f8fafc;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.col-fixed {
  min-width: 200px;
}

.col-day {
  text-align: center;
  min-width: 130px;
}

.day-th-title {
  font-weight: 700;
  font-size: 0.85rem;
  color: #1e293b;
}

.day-th-sub {
  font-size: 0.75rem;
  color: #64748b;
}

.matrix-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.user-cell .name-box {
  display: flex;
  flex-direction: column;
}

.team-tag {
  font-size: 0.72rem;
  color: #64748b;
}

.cell-status {
  text-align: center;
}

.pill-avail {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  padding: 0.35rem 0.65rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.pill-matched {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
}

.pill-unmatched {
  background: #fffbeb;
  border-color: #fde68a;
  color: #b45309;
}

.pointage-tag {
  font-size: 0.68rem;
  font-weight: 500;
}

.gap-tag {
  font-size: 0.68rem;
  color: #dc2626;
  font-weight: 700;
}

.pill-none {
  color: #cbd5e1;
  font-size: 1.1rem;
}

.state-msg {
  padding: 3rem;
  text-align: center;
  color: #64748b;
}
</style>
