<script setup>
import { ref, computed } from 'vue'
import { useRouter } from '../../router'
import { db, useLiveQuery } from '../../lib/db'
import { generateUUIDv7 } from '../../lib/uuidv7'
import { useAuth } from '../../composables/useAuth'
import { useSyncEngine } from '../../composables/useSyncEngine'
import { useToast } from '../../composables/useToast'
import { getLocalDateString, formatTime, formatWorkDate, calculateWorkDuration, getPublicHoliday } from '../../lib/dateUtils'
import { getMonday, formatWeekLabel } from '../../composables/useAvailabilities'
import ManagerPageHeader from '../../components/manager/ManagerPageHeader.vue'
import ManagerKpiCard from '../../components/manager/ManagerKpiCard.vue'
import ManagerEmptyState from '../../components/manager/ManagerEmptyState.vue'

const { navigate } = useRouter()
const { user } = useAuth()
const { refreshPendingCount, syncNow } = useSyncEngine()
const { success: toastSuccess, error: toastError } = useToast()

const selectedWeekStart = ref(getMonday())
const todayStr = getLocalDateString()

const searchQuery = ref('')
const filterTeam = ref('')
const selectedCell = ref(null)

const daysHeader = [
  { id: 1, label: 'Lundi', short: 'Lun.' },
  { id: 2, label: 'Mardi', short: 'Mar.' },
  { id: 3, label: 'Mercredi', short: 'Mer.' },
  { id: 4, label: 'Jeudi', short: 'Jeu.' },
  { id: 5, label: 'Vendredi', short: 'Ven.' },
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

// Lecture réactive depuis Dexie : profils, disponibilités, pointages et sites.
const employeeRows = useLiveQuery(async () => {
  const list = await db.profiles.toArray()
  return list
    .filter((p) => p.is_active !== false && !p.deleted_at)
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
}, [])

const availabilityRows = useLiveQuery(async () =>
  db.availabilities
    .where('week_start')
    .equals(selectedWeekStart.value)
    .toArray(),
[], () => selectedWeekStart.value)

const presenceRows = useLiveQuery(async () =>
  db.presences
    .where('work_date')
    .between(selectedWeekStart.value, weekEnd.value, true, false)
    .filter((p) => !p.deleted_at)
    .toArray(),
[], () => `${selectedWeekStart.value}|${weekEnd.value}`)

const teamRows = useLiveQuery(async () => db.teams.toArray(), [])
const locationRows = useLiveQuery(async () => db.locations.toArray(), [])

const locationsMap = computed(() => new Map((locationRows.value || []).map((loc) => [loc.id, loc])))

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

// Formatage en français naturel des dates d'en-tête (ex: "Lun. 28 sept.")
const formatDayHeader = (dayNumber) => {
  const dateStr = getDateForDay(dayNumber)
  const d = new Date(`${dateStr}T12:00:00`)
  const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' })
  const dayNum = d.getDate()
  const monthName = d.toLocaleDateString('fr-FR', { month: 'short' })
  const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1)
  return `${capDay} ${dayNum} ${monthName}`
}

const isCurrentDay = (dayNumber) => getDateForDay(dayNumber) === todayStr

// Détection d'un jour férié légal pour une colonne donnée
const getDayHoliday = (dayNumber) => {
  const dateStr = getDateForDay(dayNumber)
  return getPublicHoliday(dateStr)
}

// Détermine si un collaborateur a configuré ses disponibilités pour la semaine affichée.
const isEmployeeConfigured = (userId) =>
  availabilities.value.some((a) => a.user_id === userId)

// Récupère la note éventuelle enregistrée par le collaborateur pour la semaine affichée.
const getEmployeeWeekNote = (userId) => {
  const match = availabilities.value.find((a) => a.user_id === userId && a.note)
  return match?.note ? match.note.trim() : null
}

// Récupère la disponibilité active (non supprimée) du collaborateur pour un jour donné.
const getActiveAvailability = (userId, dayNumber) =>
  availabilities.value.find((a) => a.user_id === userId && a.day_of_week === dayNumber && !a.deleted_at)

const getActualPresence = (userId, dayNumber) => {
  const dateStr = getDateForDay(dayNumber)
  return presences.value.find((p) => p.user_id === userId && p.work_date === dateStr)
}

/**
 * Modélisation d'état cellulaire contextuelle et unifiée :
 * - present : pointage effectif (affiche l'heure d'arrivée en vert).
 * - holiday : jour férié chômé légal (état informatif neutre, sans alerte erronée).
 * - missing : jour passé non pointé (alerte ambrée « Non pointé » sans vert trompeur).
 * - absent : jour passé ou présent déclaré indisponible (switch décoché).
 * - today_waiting : aujourd'hui en attente de pointage.
 * - future_planned : jour ouvré futur présumé présent.
 * - future_absent : jour futur déclaré indisponible à l'avance.
 */
const dayState = (empId, dayNumber) => {
  const dateStr = getDateForDay(dayNumber)
  const isPast = dateStr < todayStr
  const isToday = dateStr === todayStr
  const isFuture = dateStr > todayStr
  const holidayName = getDayHoliday(dayNumber)
  const isHoliday = !!holidayName

  const configured = isEmployeeConfigured(empId)
  const activeRecord = getActiveAvailability(empId, dayNumber)
  const presence = getActualPresence(empId, dayNumber) || null
  const isExplicitlyUnavailable = configured && !activeRecord

  let type = 'future_planned'
  if (presence) {
    type = 'present'
  } else if (isHoliday) {
    type = 'holiday'
  } else if (isExplicitlyUnavailable) {
    type = isFuture ? 'future_absent' : 'absent'
  } else if (isPast) {
    type = 'missing'
  } else if (isToday) {
    type = 'today_waiting'
  } else {
    type = 'future_planned'
  }

  const location = presence?.location_id ? locationsMap.value.get(presence.location_id) : null
  const locationName = location?.name || null

  return {
    type,
    presence,
    isPast,
    isToday,
    isFuture,
    activeRecord,
    locationName,
    isHoliday,
    holidayName,
  }
}

// Synthèse : sur les créneaux ouvrés révolus où le collaborateur est attendu, combien ont donné un pointage.
const stats = computed(() => {
  let expectedCount = 0
  let pointedCount = 0

  const pastDays = daysHeader.filter((d) => getDateForDay(d.id) <= todayStr)

  for (const emp of filteredEmployees.value) {
    for (const d of pastDays) {
      const state = dayState(emp.id, d.id)
      // Un jour férié chômé n'est pas une présence attendue
      if (state.type !== 'absent' && state.type !== 'holiday') {
        expectedCount++
        if (state.presence) {
          pointedCount++
        }
      }
    }
  }

  const rate = expectedCount > 0 ? Math.round((pointedCount / expectedCount) * 100) : null
  return { declared: expectedCount, pointed: pointedCount, rate }
})

// Gestion de la modale de détail et d'ajustement d'horaires
const isSavingSchedule = ref(false)
const scheduleError = ref('')
const customStartTime = ref('09:00')
const customEndTime = ref('18:00')

const openCellDetail = (emp, dayNumber) => {
  const dateStr = getDateForDay(dayNumber)
  const state = dayState(emp.id, dayNumber)
  const presence = getActualPresence(emp.id, dayNumber)
  const note = getEmployeeWeekNote(emp.id)
  const day = daysHeader.find((d) => d.id === dayNumber)
  const location = presence?.location_id ? locationsMap.value.get(presence.location_id) : null
  const activeAvailability = getActiveAvailability(emp.id, dayNumber)

  scheduleError.value = ''
  if (activeAvailability?.start_time) {
    customStartTime.value = activeAvailability.start_time.slice(0, 5)
  } else if (emp.expected_arrival_time) {
    customStartTime.value = emp.expected_arrival_time.slice(0, 5)
  } else {
    customStartTime.value = '09:00'
  }

  if (activeAvailability?.end_time) {
    customEndTime.value = activeAvailability.end_time.slice(0, 5)
  } else if (emp.expected_departure_time) {
    customEndTime.value = emp.expected_departure_time.slice(0, 5)
  } else {
    customEndTime.value = '18:00'
  }

  selectedCell.value = {
    employee: emp,
    dayNumber,
    dayLabel: day?.label || '',
    dateStr,
    dateFormatted: formatWorkDate(dateStr, { long: true }),
    state,
    presence,
    duration: presence ? calculateWorkDuration(presence.check_in_time, presence.check_out_time) : null,
    locationName: location?.name || null,
    note,
    activeAvailability,
  }
}

const saveCustomSchedule = async () => {
  if (!selectedCell.value) return
  const { employee, dayNumber } = selectedCell.value
  isSavingSchedule.value = true
  scheduleError.value = ''

  try {
    const now = new Date().toISOString()
    const existing = getActiveAvailability(employee.id, dayNumber)
    const clientMutationId = generateUUIDv7()
    const formattedStartTime = customStartTime.value
      ? (customStartTime.value.length === 5 ? `${customStartTime.value}:00` : customStartTime.value)
      : null
    const formattedEndTime = customEndTime.value
      ? (customEndTime.value.length === 5 ? `${customEndTime.value}:00` : customEndTime.value)
      : null

    if (existing) {
      const payload = {
        id: existing.id,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        updated_at: now,
      }
      await db.transaction('rw', db.availabilities, db.sync_outbox, async () => {
        await db.availabilities.update(existing.id, payload)
        await db.sync_outbox.add({
          client_mutation_id: clientMutationId,
          table_name: 'availabilities',
          record_id: existing.id,
          operation: 'UPDATE',
          payload,
          created_at: now,
          attempts: 0,
          status: 'pending',
        })
      })
    } else {
      const newId = generateUUIDv7()
      const payload = {
        id: newId,
        user_id: employee.id,
        week_start: selectedWeekStart.value,
        day_of_week: dayNumber,
        slot: 'full_day',
        note: null,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        declared_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        client_mutation_id: clientMutationId,
      }
      await db.transaction('rw', db.availabilities, db.sync_outbox, async () => {
        await db.availabilities.add(payload)
        await db.sync_outbox.add({
          client_mutation_id: clientMutationId,
          table_name: 'availabilities',
          record_id: newId,
          operation: 'INSERT',
          payload,
          created_at: now,
          attempts: 0,
          status: 'pending',
        })
      })
    }

    toastSuccess('Horaires de la journée enregistrés.')
    await refreshPendingCount()
    if (user.value?.id) {
      syncNow(user.value.id)
    }
  } catch (err) {
    scheduleError.value = err.message || 'Impossible d\'enregistrer les horaires.'
    toastError(scheduleError.value)
  } finally {
    isSavingSchedule.value = false
  }
}

const resetToDefaultSchedule = async () => {
  if (!selectedCell.value) return
  const { employee, dayNumber } = selectedCell.value
  const existing = getActiveAvailability(employee.id, dayNumber)
  if (!existing) {
    customStartTime.value = employee.expected_arrival_time?.slice(0, 5) || '09:00'
    customEndTime.value = employee.expected_departure_time?.slice(0, 5) || '18:00'
    return
  }
  isSavingSchedule.value = true
  scheduleError.value = ''
  try {
    const now = new Date().toISOString()
    const clientMutationId = generateUUIDv7()
    const payload = {
      id: existing.id,
      start_time: null,
      end_time: null,
      updated_at: now,
    }
    await db.transaction('rw', db.availabilities, db.sync_outbox, async () => {
      await db.availabilities.update(existing.id, payload)
      await db.sync_outbox.add({
        client_mutation_id: clientMutationId,
        table_name: 'availabilities',
        record_id: existing.id,
        operation: 'UPDATE',
        payload,
        created_at: now,
        attempts: 0,
        status: 'pending',
      })
    })
    customStartTime.value = employee.expected_arrival_time?.slice(0, 5) || '09:00'
    customEndTime.value = employee.expected_departure_time?.slice(0, 5) || '18:00'
    toastSuccess('Horaires réinitialisés aux valeurs habituelles.')
    await refreshPendingCount()
    if (user.value?.id) {
      syncNow(user.value.id)
    }
  } catch (err) {
    scheduleError.value = err.message || 'Impossible de réinitialiser.'
    toastError(scheduleError.value)
  } finally {
    isSavingSchedule.value = false
  }
}

const getScheduledHours = (emp, dayNumber) => {
  const avail = getActiveAvailability(emp.id, dayNumber)
  if (avail?.start_time || avail?.end_time) {
    const start = avail.start_time ? avail.start_time.slice(0, 5) : (emp.expected_arrival_time ? emp.expected_arrival_time.slice(0, 5) : '09:00')
    const end = avail.end_time ? avail.end_time.slice(0, 5) : (emp.expected_departure_time ? emp.expected_departure_time.slice(0, 5) : '18:00')
    return { text: `${start} - ${end}`, isCustom: true }
  }
  const start = emp.expected_arrival_time ? emp.expected_arrival_time.slice(0, 5) : '09:00'
  const end = emp.expected_departure_time ? emp.expected_departure_time.slice(0, 5) : '18:00'
  return { text: `${start} - ${end}`, isCustom: false }
}

const closeCellDetail = () => {
  selectedCell.value = null
}

const goToPresences = (dateStr) => {
  closeCellDetail()
  navigate('/manager/presences')
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <ManagerPageHeader
      title="Disponibilités"
      subtitle="Présences prévues par l'équipe pour la semaine"
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
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 min-w-0">
      <ManagerKpiCard label="Présences attendues" :value="stats.declared" caption="Jours passés" />
      <ManagerKpiCard label="Pointés" :value="stats.pointed" caption="Journées pointées" tone="success" />
      <ManagerKpiCard
        label="Présence constatée"
        :value="stats.rate === null ? 'Aucun' : stats.rate + '%'"
        :caption="stats.rate === null ? 'Aucun jour passé' : 'Sur les jours prévus'"
        tone="info"
      />
    </div>

    <!-- Filtres & Légende épurée -->
    <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 flex flex-col gap-3.5">
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

      <!-- Légende unifiée et sobre -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-base-300/60 text-xs text-base-content/70">
        <span class="inline-flex items-center gap-1.5 font-medium">
          <span class="badge badge-xs badge-success text-success-content p-0.5 rounded-m3-xs inline-flex items-center justify-center">
            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
          Pointé
        </span>
        <span class="inline-flex items-center gap-1.5 font-medium">
          <span class="badge badge-xs badge-warning text-warning-content p-0.5 rounded-m3-xs inline-flex items-center justify-center">
            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </span>
          Non pointé
        </span>
        <span class="inline-flex items-center gap-1.5 font-medium">
          <span class="badge badge-xs bg-orange-500/20 text-orange-400 border border-orange-500/40 p-0.5 rounded-m3-xs inline-flex items-center justify-center">
            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
          Absence signalée
        </span>
        <span class="inline-flex items-center gap-1.5 font-medium">
          <span class="badge badge-xs badge-outline border-base-content/30 text-base-content/60 p-0.5 rounded-m3-xs inline-flex items-center justify-center">
            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
          Prévu
        </span>
        <span class="inline-flex items-center gap-1.5 font-medium">
          <span class="badge badge-xs badge-info/20 text-info border border-info/30 p-0.5 rounded-m3-xs inline-flex items-center justify-center">
            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          Jour férié
        </span>
        <span class="inline-flex items-center gap-1.5 text-base-content/50 ml-auto">
          <svg class="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>Cliquez sur une case pour afficher le détail</span>
        </span>
      </div>
    </div>

    <ManagerEmptyState
      v-if="!filteredEmployees.length"
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
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <strong class="block text-sm font-bold text-base-content truncate">{{ emp.full_name }}</strong>
                <span
                  v-if="getEmployeeWeekNote(emp.id)"
                  class="badge badge-xs badge-primary rounded-m3-xs gap-1"
                  title="Note de semaine"
                >
                  <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>Note</span>
                </span>
              </div>
              <span class="badge badge-soft badge-xs w-fit mt-0.5 rounded-m3-xs">{{ emp.teams?.name || 'Sans équipe' }}</span>
            </div>
            <span v-if="getEmployeeWeekNote(emp.id)" class="text-xs italic text-base-content/60 truncate max-w-[150px]">
              « {{ getEmployeeWeekNote(emp.id) }} »
            </span>
          </div>

          <ul class="flex flex-col gap-1.5">
            <li
              v-for="d in daysHeader"
              :key="d.id"
              class="flex items-center justify-between gap-2 text-xs p-2 rounded-m3-sm border border-base-300/40 bg-base-100/50 cursor-pointer active:scale-98 transition-all"
              :class="isCurrentDay(d.id) ? 'border-primary/40 bg-primary/5' : ''"
              @click="openCellDetail(emp, d.id)"
            >
              <div class="flex items-center gap-1.5">
                <span class="font-medium text-base-content/75">{{ formatDayHeader(d.id) }}</span>
                <span v-if="getDayHoliday(d.id)" class="badge badge-info badge-soft badge-xs font-semibold rounded-m3-xs">{{ getDayHoliday(d.id) }}</span>
                <span v-else-if="isCurrentDay(d.id)" class="badge badge-primary badge-xs font-bold rounded-m3-xs">Auj.</span>
              </div>

              <!-- Statut contextuel épuré mobile -->
              <div v-if="dayState(emp.id, d.id).type === 'present'" class="flex items-center gap-1.5">
                <span class="badge badge-sm badge-success text-success-content font-bold rounded-m3-xs gap-1">
                  <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>{{ formatTime(dayState(emp.id, d.id).presence?.check_in_time) }}</span>
                </span>
                <span class="text-xs text-base-content/50 truncate max-w-[80px]">
                  {{ dayState(emp.id, d.id).locationName || 'Pointé' }}
                </span>
              </div>

              <div v-else-if="dayState(emp.id, d.id).type === 'missing'" class="flex items-center gap-1">
                <span class="badge badge-sm badge-warning text-warning-content font-semibold rounded-m3-xs gap-1">
                  <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span>Non pointé</span>
                </span>
              </div>

              <div v-else-if="dayState(emp.id, d.id).type === 'absent'" class="flex items-center gap-1">
                <span class="badge badge-sm bg-orange-500/20 text-orange-400 border border-orange-500/40 font-semibold rounded-m3-xs gap-1">
                  <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  <span>Absent</span>
                </span>
              </div>

              <div v-else-if="dayState(emp.id, d.id).type === 'holiday'" class="flex items-center gap-1">
                <span class="badge badge-sm badge-info/20 text-info border border-info/30 font-medium rounded-m3-xs gap-1">
                  <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>Férié</span>
                </span>
                <span class="text-xs text-base-content/50 truncate max-w-[80px]">
                  {{ dayState(emp.id, d.id).holidayName }}
                </span>
              </div>

              <div v-else-if="dayState(emp.id, d.id).type === 'today_waiting'" class="flex items-center gap-1">
                <span class="badge badge-sm badge-info badge-outline font-medium rounded-m3-xs">
                  En attente
                </span>
              </div>

              <div v-else class="flex items-center gap-1">
                <span class="badge badge-sm badge-outline border-base-content/25 text-base-content/50 font-normal rounded-m3-xs gap-1">
                  <svg class="w-3 h-3 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Prévu</span>
                </span>
              </div>
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
                <th class="w-52" :aria-sort="ariaSort()">
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
                <th
                  v-for="d in daysHeader"
                  :key="d.id"
                  class="text-center transition-colors"
                  :class="isCurrentDay(d.id) ? 'bg-primary/10 text-primary border-x border-primary/20' : ''"
                >
                  <div class="flex flex-col items-center justify-center gap-0.5">
                    <div class="font-bold flex items-center gap-1">
                      <span>{{ formatDayHeader(d.id) }}</span>
                    </div>
                    <span v-if="getDayHoliday(d.id)" class="badge badge-info badge-soft badge-xs font-semibold rounded-m3-xs truncate max-w-[110px]" :title="getDayHoliday(d.id)">
                      {{ getDayHoliday(d.id) }}
                    </span>
                    <span v-else-if="isCurrentDay(d.id)" class="badge badge-primary badge-xs font-bold rounded-m3-xs uppercase tracking-wider">Aujourd'hui</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in sortedEmployees" :key="emp.id" class="hover">
                <td>
                  <div class="flex flex-col">
                    <div class="flex items-center gap-1.5">
                      <strong class="text-sm font-bold text-base-content">{{ emp.full_name }}</strong>
                      <span
                        v-if="getEmployeeWeekNote(emp.id)"
                        class="tooltip tooltip-right cursor-help text-primary"
                        :data-tip="`Note de semaine : « ${getEmployeeWeekNote(emp.id)} »`"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </span>
                    </div>
                    <span class="badge badge-soft badge-xs w-fit mt-0.5 rounded-m3-xs">{{ emp.teams?.name || 'Sans équipe' }}</span>
                  </div>
                </td>
                <td
                  v-for="d in daysHeader"
                  :key="d.id"
                  class="text-center p-2 transition-colors"
                  :class="isCurrentDay(d.id) ? 'bg-primary/5 border-x border-primary/10' : ''"
                >
                  <!-- Case interactive cliquable avec état contextuel unifié -->
                  <button
                    type="button"
                    class="w-full flex flex-col items-center justify-center gap-1 p-1.5 rounded-m3-sm transition-all hover:bg-base-300/50 hover:shadow-xs active:scale-95 focus-visible:outline-2 focus-visible:outline-primary"
                    :title="`Consulter le détail du ${formatDayHeader(d.id)} pour ${emp.full_name}`"
                    @click="openCellDetail(emp, d.id)"
                  >
                    <!-- 1. Présence effective constatée (vert doux avec heure en clair) -->
                    <template v-if="dayState(emp.id, d.id).type === 'present'">
                      <span class="badge badge-sm badge-success text-success-content font-bold rounded-m3-xs gap-1">
                        <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>{{ formatTime(dayState(emp.id, d.id).presence?.check_in_time) }}</span>
                      </span>
                      <span class="text-xs text-base-content/60 truncate max-w-[100px]">
                        {{ dayState(emp.id, d.id).isHoliday ? `${dayState(emp.id, d.id).locationName || 'Pointé'} (Férié)` : (dayState(emp.id, d.id).locationName || 'Pointé') }}
                      </span>
                    </template>

                    <!-- Férié chômé : pas d'anomalie, état neutre informatif -->
                    <template v-else-if="dayState(emp.id, d.id).type === 'holiday'">
                      <span class="badge badge-sm badge-info/15 text-info border border-info/30 font-medium rounded-m3-xs gap-1">
                        <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>Férié</span>
                      </span>
                      <span class="text-xs text-base-content/60 truncate max-w-[100px]" :title="dayState(emp.id, d.id).holidayName">
                        {{ dayState(emp.id, d.id).holidayName }}
                      </span>
                    </template>

                    <!-- 2. Anomalie : jour passé attendu mais non pointé (alerte ambrée sobre) -->
                    <template v-else-if="dayState(emp.id, d.id).type === 'missing'">
                      <span class="badge badge-sm badge-warning text-warning-content font-semibold rounded-m3-xs gap-1">
                        <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <span>Non pointé</span>
                      </span>
                      <span
                        class="text-xs font-mono leading-tight"
                        :class="getScheduledHours(emp, d.id).isCustom ? 'text-primary font-bold' : 'text-warning/80 font-medium'"
                        :title="getScheduledHours(emp, d.id).isCustom ? 'Horaires aménagés pour cette journée' : 'Horaires habituels'"
                      >
                        {{ getScheduledHours(emp, d.id).text }}
                      </span>
                    </template>

                    <!-- 3. Absence déclarée par l'employé (orange doux épuré) -->
                    <template v-else-if="dayState(emp.id, d.id).type === 'absent'">
                      <span class="badge badge-sm bg-orange-500/20 text-orange-400 border border-orange-500/40 font-semibold rounded-m3-xs gap-1">
                        <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span>Absent</span>
                      </span>
                      <span class="text-xs text-orange-400/80 font-medium">Non dispo</span>
                    </template>

                    <!-- 4. Jour présent (Aujourd'hui) en attente de pointage -->
                    <template v-else-if="dayState(emp.id, d.id).type === 'today_waiting'">
                      <span class="badge badge-sm badge-info badge-outline font-medium rounded-m3-xs">
                        ○ En attente
                      </span>
                      <span
                        class="text-xs font-mono leading-tight"
                        :class="getScheduledHours(emp, d.id).isCustom ? 'text-primary font-bold' : 'text-primary font-medium'"
                        :title="getScheduledHours(emp, d.id).isCustom ? 'Horaires aménagés pour cette journée' : 'Horaires habituels'"
                      >
                        {{ getScheduledHours(emp, d.id).text }}
                      </span>
                    </template>

                    <!-- 5. Jour futur : absence planifiée -->
                    <template v-else-if="dayState(emp.id, d.id).type === 'future_absent'">
                      <span class="badge badge-sm bg-orange-500/10 text-orange-400/80 border border-orange-500/25 font-normal rounded-m3-xs gap-1">
                        <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span>Absent</span>
                      </span>
                      <span class="text-xs text-base-content/40">Prévu</span>
                    </template>

                    <!-- 6. Jour futur ouvré standard : présence prévue (sobre contour neutre) -->
                    <template v-else>
                      <span class="badge badge-sm badge-outline border-base-content/25 text-base-content/60 font-normal rounded-m3-xs gap-1">
                        <svg class="w-3 h-3 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Prévu</span>
                      </span>
                      <span
                        class="text-xs font-mono leading-tight"
                        :class="getScheduledHours(emp, d.id).isCustom ? 'text-primary font-bold' : 'text-base-content/60'"
                        :title="getScheduledHours(emp, d.id).isCustom ? 'Horaires aménagés pour cette journée' : 'Horaires habituels'"
                      >
                        {{ getScheduledHours(emp, d.id).text }}
                      </span>
                    </template>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modale de détail interactive d'un créneau -->
    <div v-if="selectedCell" class="modal modal-open bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div class="modal-box bg-base-100 border border-base-300/60 rounded-m3-lg p-5 max-w-md w-full shadow-sm flex flex-col gap-4">
        <!-- En-tête de la modale -->
        <div class="flex items-start justify-between gap-3 border-b border-base-300/40 pb-3">
          <div>
            <span class="badge badge-primary badge-xs font-bold uppercase tracking-wider mb-1 rounded-m3-xs">{{ selectedCell.employee?.teams?.name || 'Sans équipe' }}</span>
            <h3 class="text-base font-bold text-base-content">{{ selectedCell.employee?.full_name }}</h3>
            <p class="text-xs text-base-content/60 mt-0.5">{{ selectedCell.dateFormatted }}</p>
          </div>
          <button
            type="button"
            class="btn btn-circle btn-ghost"
            aria-label="Fermer"
            @click="closeCellDetail"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Détail opérationnel -->
        <div class="flex flex-col gap-3 text-xs">
          <!-- Statut de pointage -->
          <div class="bg-base-200/60 border border-base-300/50 rounded-m3-md p-3 flex flex-col gap-2">
            <span class="font-semibold text-base-content/75 uppercase tracking-wide text-xs">Pointage effectif</span>
            <div v-if="selectedCell.presence" class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <span class="text-base-content/60">Arrivée enregistrée :</span>
                <strong class="text-success text-sm font-bold">{{ formatTime(selectedCell.presence.check_in_time) }}</strong>
              </div>
              <div v-if="selectedCell.presence.check_out_time" class="flex items-center justify-between">
                <span class="text-base-content/60">Départ enregistré :</span>
                <strong class="text-base-content text-sm font-bold">{{ formatTime(selectedCell.presence.check_out_time) }}</strong>
              </div>
              <div v-if="selectedCell.duration" class="flex items-center justify-between pt-1 border-t border-base-300/40">
                <span class="text-base-content/60">Durée accomplie :</span>
                <span class="font-semibold text-base-content">{{ selectedCell.duration }}</span>
              </div>
              <div v-if="selectedCell.locationName" class="flex items-center justify-between">
                <span class="text-base-content/60">Lieu de pointage :</span>
                <span class="font-medium text-base-content">{{ selectedCell.locationName }}</span>
              </div>
              <div v-if="selectedCell.state.isHoliday" class="flex items-center justify-between text-info font-medium pt-1 border-t border-base-300/40">
                <span>Jour férié :</span>
                <span>{{ selectedCell.state.holidayName }} (travaillé)</span>
              </div>
            </div>
            <div v-else class="text-base-content/60 italic">
              <template v-if="selectedCell.state.type === 'holiday'">
                Jour férié ({{ selectedCell.state.holidayName }}).
              </template>
              <template v-else-if="selectedCell.state.type === 'missing'">
                Aucun pointage enregistré pour cette journée.
              </template>
              <template v-else-if="selectedCell.state.type === 'absent' || selectedCell.state.type === 'future_absent'">
                Absence signalée par le collaborateur.
              </template>
              <template v-else-if="selectedCell.state.type === 'today_waiting'">
                En attente du pointage aujourd'hui.
              </template>
              <template v-else>
                Journée à venir.
              </template>
            </div>
          </div>

          <!-- Note éventuelle rédigée par l'employé pour sa semaine -->
          <div v-if="selectedCell.note" class="bg-primary/5 border border-primary/20 rounded-m3-md p-3 flex flex-col gap-1.5">
            <span class="font-semibold text-primary flex items-center gap-1.5">
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Note laissée par le collaborateur</span>
            </span>
            <p class="text-xs text-base-content/80 italic bg-base-100/60 p-2 rounded-m3-xs border border-primary/10">
              « {{ selectedCell.note }} »
            </p>
          </div>

          <!-- Ajustement des horaires prévus pour la journée (par le manager) -->
          <form @submit.prevent="saveCustomSchedule" class="bg-base-200/50 border border-base-300/60 rounded-m3-md p-3.5 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-base-content/80 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Horaires prévus pour ce jour</span>
              </span>
              <span v-if="getActiveAvailability(selectedCell.employee.id, selectedCell.dayNumber)?.start_time || getActiveAvailability(selectedCell.employee.id, selectedCell.dayNumber)?.end_time" class="badge badge-primary badge-xs rounded-m3-xs font-semibold">
                Aménagé
              </span>
              <span v-else class="text-xs text-base-content/50 italic">
                Horaire habituel
              </span>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <fieldset class="fieldset">
                <legend class="fieldset-legend text-xs font-semibold text-base-content/80">Arrivée prévue</legend>
                <input
                  v-model="customStartTime"
                  type="time"
                  step="60"
                  class="input input-bordered w-full rounded-m3-md min-h-11 text-sm bg-base-100"
                  required
                />
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend text-xs font-semibold text-base-content/80">Départ prévu</legend>
                <input
                  v-model="customEndTime"
                  type="time"
                  step="60"
                  class="input input-bordered w-full rounded-m3-md min-h-11 text-sm bg-base-100"
                  required
                />
              </fieldset>
            </div>

            <div v-if="scheduleError" class="alert alert-error text-xs rounded-m3-md py-2">
              {{ scheduleError }}
            </div>

            <div class="flex items-center justify-between gap-2 pt-1">
              <button
                v-if="getActiveAvailability(selectedCell.employee.id, selectedCell.dayNumber)?.start_time || getActiveAvailability(selectedCell.employee.id, selectedCell.dayNumber)?.end_time"
                type="button"
                class="btn btn-ghost min-h-11 text-xs text-base-content/70 hover:text-base-content px-2 font-medium"
                :disabled="isSavingSchedule"
                @click="resetToDefaultSchedule"
              >
                Rétablir l'horaire habituel
              </button>
              <span v-else></span>

              <button
                type="submit"
                class="btn btn-primary min-h-11 px-4 rounded-m3-sm font-semibold flex items-center gap-1.5"
                :disabled="isSavingSchedule"
              >
                <span v-if="isSavingSchedule" class="loading loading-spinner loading-xs"></span>
                <span>Enregistrer l'horaire</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Pied d'action -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-base-300/40">
          <button type="button" class="btn btn-ghost rounded-m3-sm min-h-11 active:scale-95 transition-transform duration-150 motion-reduce:transform-none" @click="closeCellDetail">
            Fermer
          </button>
          <button
            type="button"
            class="btn btn-primary rounded-m3-sm font-semibold min-h-11 flex items-center gap-1.5 active:scale-95 transition-transform duration-150 motion-reduce:transform-none"
            @click="goToPresences(selectedCell.dateStr)"
          >
            <span>Consulter les pointages</span>
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeCellDetail"></div>
    </div>
  </div>
</template>
