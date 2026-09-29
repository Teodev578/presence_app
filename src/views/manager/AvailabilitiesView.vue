<script setup>
import { ref, computed } from 'vue'
import { db, useLiveQuery } from '../../lib/db'
import { getLocalDateString } from '../../lib/dateUtils'
import { getMonday, formatWeekLabel } from '../../composables/useAvailabilities'

const selectedWeekStart = ref(getMonday())
const todayStr = getLocalDateString()

const daysHeader = [
  { id: 1, label: 'Lundi' },
  { id: 2, label: 'Mardi' },
  { id: 3, label: 'Mercredi' },
  { id: 4, label: 'Jeudi' },
  { id: 5, label: 'Vendredi' },
]

const nextWeek = () => {
  const d = new Date(`${selectedWeekStart.value}T12:00:00`)
  d.setDate(d.getDate() + 7)
  selectedWeekStart.value = getLocalDateString(d)
}

const prevWeek = () => {
  const d = new Date(`${selectedWeekStart.value}T12:00:00`)
  d.setDate(d.getDate() - 7)
  selectedWeekStart.value = getLocalDateString(d)
}

// Bornes de la semaine affichée, du lundi au vendredi, en 'YYYY-MM-DD' comparables en chaîne.
const weekEnd = computed(() => {
  const d = new Date(`${selectedWeekStart.value}T12:00:00`)
  d.setDate(d.getDate() + 5)
  return getLocalDateString(d)
})

// Lecture réactive depuis Dexie : profils, disponibilités et pointages de la semaine.
// Un changement de semaine réabonne les deux requêtes bornées.
const employeeRows = useLiveQuery(async () => {
  const list = await db.profiles.toArray()
  return list
    .filter((p) => p.is_active !== false && !p.deleted_at)
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
}, null)

const availabilityRows = useLiveQuery(async () =>
  db.availabilities
    .where('week_start')
    .equals(selectedWeekStart.value)
    .filter((a) => !a.deleted_at)
    .toArray(),
null, () => selectedWeekStart.value)

const presenceRows = useLiveQuery(async () =>
  db.presences
    .where('work_date')
    .between(selectedWeekStart.value, weekEnd.value, true, false)
    .filter((p) => !p.deleted_at)
    .toArray(),
null, () => `${selectedWeekStart.value}|${weekEnd.value}`)

const teamRows = useLiveQuery(async () => db.teams.toArray(), [])

const loading = computed(() =>
  employeeRows.value === null || availabilityRows.value === null || presenceRows.value === null
)

// Les équipes sont jointes localement, le gabarit continue de lire `emp.teams?.name`.
const employees = computed(() => {
  const teamsMap = new Map((teamRows.value || []).map((t) => [t.id, t]))
  return (employeeRows.value || []).map((emp) => ({
    ...emp,
    teams: teamsMap.get(emp.team_id) || null,
  }))
})

const availabilities = computed(() => availabilityRows.value || [])
const presences = computed(() => presenceRows.value || [])

const getDateForDay = (dayNumber) => {
  const d = new Date(`${selectedWeekStart.value}T12:00:00`)
  d.setDate(d.getDate() + (dayNumber - 1))
  return getLocalDateString(d)
}

const getAvailability = (userId, dayNumber) => {
  return availabilities.value.find(
    (a) => a.user_id === userId && a.day_of_week === dayNumber
  )
}

const getActualPresence = (userId, dayNumber) => {
  const dateStr = getDateForDay(dayNumber)
  return presences.value.find((p) => p.user_id === userId && p.work_date === dateStr)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black tracking-tight text-base-content">Disponibilités de l'Équipe</h2>
        <p class="text-xs text-base-content/60 mt-0.5">
          Vue croisée : déclarations des collaborateurs et conformité des présences (Prévu vs Réel)
        </p>
      </div>

      <!-- Navigation temporelle DaisyUI -->
      <div class="card bg-base-200 border border-base-300 shadow-xs flex-row items-center gap-2 p-1.5 rounded-m3-md">
        <button type="button" class="btn btn-circle btn-ghost btn-sm" aria-label="Semaine précédente" @click="prevWeek">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span class="text-xs font-bold text-base-content px-2">{{ formatWeekLabel(selectedWeekStart) }}</span>
        <button type="button" class="btn btn-circle btn-ghost btn-sm" aria-label="Semaine suivante" @click="nextWeek">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>

    <!-- Tableau croisé matriciel DaisyUI -->
    <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-sm text-base-content/60 flex items-center justify-center gap-2">
        <span class="loading loading-spinner loading-sm text-primary"></span>
        Chargement de la grille d'équipe...
      </div>
      <div v-else-if="!employees.length" class="p-8 text-center text-sm text-base-content/60">
        Aucun collaborateur actif répertorié.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="table table-sm w-full">
          <thead>
            <tr class="text-xs uppercase text-base-content/60">
              <th class="w-48">Collaborateur</th>
              <th v-for="d in daysHeader" :key="d.id" class="text-center">
                <div class="font-bold">{{ d.label }}</div>
                <div class="text-[11px] text-base-content/50 font-normal">{{ getDateForDay(d.id).slice(5) }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in employees" :key="emp.id" class="hover">
              <td>
                <div class="flex flex-col">
                  <strong class="text-sm font-bold text-base-content">{{ emp.full_name }}</strong>
                  <span class="badge badge-soft badge-xs w-fit mt-0.5 rounded-m3-xs">{{ emp.teams?.name || 'Sans équipe' }}</span>
                </div>
              </td>

              <td v-for="d in daysHeader" :key="d.id" class="text-center">
                <div v-if="getAvailability(emp.id, d.id)" class="inline-flex flex-col items-center gap-1">
                  <span
                    class="badge badge-sm font-semibold rounded-m3-xs gap-1"
                    :class="[
                      getActualPresence(emp.id, d.id)
                        ? 'badge-success text-success-content'
                        : getDateForDay(d.id) <= todayStr
                          ? 'badge-warning text-warning-content'
                          : 'badge-info badge-outline'
                    ]"
                  >
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Dispo</span>
                  </span>
                  <span
                    v-if="getActualPresence(emp.id, d.id)"
                    class="text-[10px] font-bold text-success"
                  >
                    Pointé ({{ getActualPresence(emp.id, d.id)?.status }})
                  </span>
                  <span
                    v-else-if="getDateForDay(d.id) <= todayStr"
                    class="text-[10px] font-medium text-warning"
                  >
                    Non pointé
                  </span>
                </div>
                <span v-else class="text-base-content/30 text-xs">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
