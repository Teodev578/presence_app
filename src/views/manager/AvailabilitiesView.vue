<script setup>
import { ref, computed } from 'vue'
import { db, useLiveQuery } from '../../lib/db'
import { getLocalDateString } from '../../lib/dateUtils'
import { getMonday, formatWeekLabel } from '../../composables/useAvailabilities'
import ManagerPageHeader from '../../components/manager/ManagerPageHeader.vue'
import ManagerKpiCard from '../../components/manager/ManagerKpiCard.vue'
import ManagerEmptyState from '../../components/manager/ManagerEmptyState.vue'

const selectedWeekStart = ref(getMonday())
const todayStr = getLocalDateString()

const searchQuery = ref('')
const filterTeam = ref('')

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

const availableTeams = computed(() => (teamRows.value || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fr')))

const filteredEmployees = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return employees.value.filter((emp) => {
    if (filterTeam.value && emp.team_id !== filterTeam.value) return false
    if (!q) return true
    return (emp.full_name || '').toLowerCase().includes(q)
  })
})

// La matrice se trie par nom, croissant puis décroissant, sur la colonne Collaborateur.
const sortDir = ref('asc')

const sortedEmployees = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...filteredEmployees.value].sort((a, b) =>
    (a.full_name || '').localeCompare(b.full_name || '', 'fr', { numeric: true, sensitivity: 'base' }) * dir
  )
})

const toggleSort = () => {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
}

const ariaSort = () => (sortDir.value === 'asc' ? 'ascending' : 'descending')
const sortIconPath = () => (sortDir.value === 'asc' ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7')

/**
 * Message de l'état vide : distinguer « aucune équipe », « recherche sans résultat » et « filtre
 * d'équipe sans résultat », et proposer l'action qui débloque.
 */
const emptyState = computed(() => {
  if (!employees.value.length) {
    return { title: 'Aucun collaborateur', message: 'Aucun collaborateur actif répertorié.', icon: 'users', action: null, actionLabel: '' }
  }
  if (searchQuery.value.trim()) {
    return { title: 'Aucun résultat', message: `Aucun collaborateur ne correspond à « ${searchQuery.value.trim()} ».`, icon: 'search', action: 'clear-search', actionLabel: 'Effacer la recherche' }
  }
  return { title: 'Aucun collaborateur pour cette équipe', message: 'Aucun collaborateur n\u2019est rattaché à l\u2019équipe sélectionnée.', icon: 'filter', action: 'show-all', actionLabel: 'Voir toutes les équipes' }
})

const runEmptyAction = () => {
  if (emptyState.value.action === 'clear-search') searchQuery.value = ''
  else if (emptyState.value.action === 'show-all') filterTeam.value = ''
}

const availabilities = computed(() => availabilityRows.value || [])
const presences = computed(() => presenceRows.value || [])

const getDateForDay = (dayNumber) => {
  const d = new Date(`${selectedWeekStart.value}T12:00:00`)
  d.setDate(d.getDate() + (dayNumber - 1))
  return getLocalDateString(d)
}

const getAvailability = (userId, dayNumber) =>
  availabilities.value.find((a) => a.user_id === userId && a.day_of_week === dayNumber)

const getActualPresence = (userId, dayNumber) => {
  const dateStr = getDateForDay(dayNumber)
  return presences.value.find((p) => p.user_id === userId && p.work_date === dateStr)
}

// État d'une case : disponible pointé, disponible non pointé (jour révolu) ou disponible à venir.
const dayState = (empId, dayNumber) => {
  const declared = Boolean(getAvailability(empId, dayNumber))
  const presence = getActualPresence(empId, dayNumber) || null
  const isPast = getDateForDay(dayNumber) <= todayStr
  return { declared, presence, isPast }
}

const dayLabel = (state) => {
  if (!state.declared) return null
  if (state.presence) return 'Pointé'
  return state.isPast ? 'Non pointé' : 'À venir'
}

const dayBadgeClass = (state) => {
  if (state.presence) return 'badge-success text-success-content'
  if (state.isPast) return 'badge-warning text-warning-content'
  return 'badge-info badge-outline'
}

// Synthèse : sur les créneaux déclarés déjà révolus, combien ont donné un pointage.
const stats = computed(() => {
  const declaredSlots = availabilities.value.filter((a) => getDateForDay(a.day_of_week) <= todayStr)
  const pointedSlots = declaredSlots.filter((a) => getActualPresence(a.user_id, a.day_of_week))
  const rate = declaredSlots.length ? Math.round((pointedSlots.length / declaredSlots.length) * 100) : null
  return { declared: declaredSlots.length, pointed: pointedSlots.length, rate }
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <ManagerPageHeader
      title="Disponibilités de l'Équipe"
      subtitle="Vue croisée : déclarations des collaborateurs et conformité des présences"
    >
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </template>
    </ManagerPageHeader>

    <!-- Synthèse de la semaine -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      <ManagerKpiCard label="Créneaux déclarés" :value="stats.declared" caption="Jours révolus de la semaine" />
      <ManagerKpiCard label="Pointés" :value="stats.pointed" caption="Disponibilités tenues" tone="success" />
      <ManagerKpiCard
        label="Taux de tenue"
        :value="stats.rate === null ? 'Aucun' : stats.rate + '%'"
        :caption="stats.rate === null ? 'Aucun jour révolu' : 'Sur les jours révolus'"
        tone="info"
      />
    </div>

    <!-- Filtres -->
    <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 flex flex-col gap-3">
      <div class="flex flex-col sm:flex-row sm:items-end gap-3">
        <fieldset class="fieldset sm:w-auto">
          <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Semaine</legend>
          <div class="inline-flex items-center rounded-m3-md border border-base-300 bg-base-300/50">
            <button type="button" class="btn btn-ghost min-h-11 min-w-11 p-0 rounded-l-m3-md" aria-label="Semaine précédente" @click="prevWeek">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 18l-6-6 6-6"></path>
              </svg>
            </button>
            <span class="px-3 min-h-11 flex items-center text-sm font-semibold text-base-content whitespace-nowrap">{{ formatWeekLabel(selectedWeekStart) }}</span>
            <button type="button" class="btn btn-ghost min-h-11 min-w-11 p-0 rounded-r-m3-md" aria-label="Semaine suivante" @click="nextWeek">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6"></path>
              </svg>
            </button>
          </div>
        </fieldset>

        <fieldset class="fieldset flex-1 min-w-0">
          <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Recherche</legend>
          <label class="input input-bordered flex w-full items-center gap-2 rounded-m3-md bg-base-300/50 min-h-11">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input v-model="searchQuery" type="text" class="grow text-sm" placeholder="Rechercher un nom" />
          </label>
        </fieldset>

        <fieldset class="fieldset sm:w-56">
          <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Équipe</legend>
          <select v-model="filterTeam" class="select select-bordered min-h-11 w-full rounded-m3-md text-sm">
            <option value="">Toutes les équipes</option>
            <option v-for="t in availableTeams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </fieldset>
      </div>

      <!-- Légende des états -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-base-content/70">
        <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-success"></span> Disponible et pointé</span>
        <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-warning"></span> Disponible, non pointé</span>
        <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-info"></span> Disponible à venir</span>
      </div>
    </div>

    <!-- Chargement : ossature -->
    <div v-if="loading" class="card bg-base-200 border border-base-300 rounded-m3-lg p-4 flex flex-col gap-3">
      <div v-for="n in 4" :key="n" class="h-14 rounded-m3-md bg-base-300/60 animate-pulse"></div>
    </div>

    <ManagerEmptyState
      v-else-if="!filteredEmployees.length"
      :icon="emptyState.icon"
      :title="emptyState.title"
      :message="emptyState.message"
      :action-label="emptyState.actionLabel"
      @action="runEmptyAction"
    />

    <template v-else>
      <!-- Fiches par collaborateur sous 640px : plus de défilement horizontal -->
      <div class="sm:hidden flex flex-col gap-4">
        <div v-for="emp in sortedEmployees" :key="emp.id" class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 flex flex-col gap-3">
          <div class="min-w-0">
            <strong class="block text-sm font-bold text-base-content truncate">{{ emp.full_name }}</strong>
            <span class="badge badge-soft badge-xs w-fit mt-0.5 rounded-m3-xs">{{ emp.teams?.name || 'Sans équipe' }}</span>
          </div>
          <ul class="flex flex-col gap-1.5">
            <li v-for="d in daysHeader" :key="d.id" class="flex items-center justify-between gap-2 text-xs">
              <span class="text-base-content/60">{{ d.label }} {{ getDateForDay(d.id).slice(5) }}</span>
              <span v-if="dayState(emp.id, d.id).declared" class="badge badge-sm font-semibold rounded-m3-xs gap-1" :class="dayBadgeClass(dayState(emp.id, d.id))">
                {{ dayLabel(dayState(emp.id, d.id)) }}
              </span>
              <span v-else class="text-base-content/30">—</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Matrice à partir de 640px -->
      <div class="hidden sm:block card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table table-sm w-full">
            <thead>
              <tr class="text-xs uppercase text-base-content/60">
                <th class="w-48" :aria-sort="ariaSort()">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 font-semibold uppercase tracking-wide rounded-m3-xs transition-colors hover:text-base-content focus-visible:outline-2 focus-visible:outline-primary"
                    title="Trier par nom"
                    @click="toggleSort"
                  >
                    <span>Collaborateur</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path :d="sortIconPath()"></path>
                    </svg>
                  </button>
                </th>
                <th v-for="d in daysHeader" :key="d.id" class="text-center">
                  <div class="font-bold">{{ d.label }}</div>
                  <div class="text-xs text-base-content/50 font-normal">{{ getDateForDay(d.id).slice(5) }}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in sortedEmployees" :key="emp.id" class="hover">
                <td>
                  <div class="flex flex-col">
                    <strong class="text-sm font-bold text-base-content">{{ emp.full_name }}</strong>
                    <span class="badge badge-soft badge-xs w-fit mt-0.5 rounded-m3-xs">{{ emp.teams?.name || 'Sans équipe' }}</span>
                  </div>
                </td>
                <td v-for="d in daysHeader" :key="d.id" class="text-center">
                  <div v-if="dayState(emp.id, d.id).declared" class="inline-flex flex-col items-center gap-1">
                    <span class="badge badge-sm font-semibold rounded-m3-xs gap-1" :class="dayBadgeClass(dayState(emp.id, d.id))">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Dispo</span>
                    </span>
                    <span class="text-xs font-semibold" :class="dayState(emp.id, d.id).presence ? 'text-success' : (dayState(emp.id, d.id).isPast ? 'text-warning' : 'text-info')">
                      {{ dayLabel(dayState(emp.id, d.id)) }}
                    </span>
                  </div>
                  <span v-else class="text-base-content/30 text-xs">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
