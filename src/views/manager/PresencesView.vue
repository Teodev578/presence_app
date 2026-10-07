<script setup>
import { ref, computed } from 'vue'
import { db, useLiveQuery } from '../../lib/db'
import { generateUUIDv7 } from '../../lib/uuidv7'
import { useAuth } from '../../composables'
import { useProfile } from '../../composables'
import { useSyncEngine } from '../../composables'
import { useToast } from '../../composables'
import {
  getLocalDateString,
  getMonday,
  formatTime,
  formatWorkDate,
  formatSessionDuration,
  resolveSessionState,
  resolveSessionMinutes,
} from '../../lib/dateUtils'
import { formatWeekLabel } from '../../composables'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import ManagerPageHeader from '../../components/manager/ManagerPageHeader.vue'
import ManagerKpiCard from '../../components/manager/ManagerKpiCard.vue'

const { user } = useAuth()
const { profile } = useProfile()
const { syncNow } = useSyncEngine()
const { success: toastSuccess, error: toastError } = useToast()

// Filtre de période : presets journalier / semaine / mois, puis plage personnalisée.
// `filterDate` sert d'ancre calendaire pour les presets, `customStart`/`customEnd` pour la plage libre.
const filterPeriod = ref('day') // 'day' | 'week' | 'month' | 'custom'
const filterDate = ref(getLocalDateString())
const customStart = ref(getLocalDateString())
const customEnd = ref(getLocalDateString())
const filterStatus = ref('')
const filterSearch = ref('')

// Décalage calendaire en jours, sans dérive de fuseau (midi local).
const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + days)
  return getLocalDateString(d)
}

// Navigation de l'ancre par les flèches : jour avance d'un jour, la semaine de 7 jours, le mois d'un mois.
// Seule la saisie de l'ancre change, la logique `dateRange` reste intacte.
const shiftAnchor = (unit, direction) => {
  const anchor = filterDate.value || getLocalDateString()
  if (unit === 'day') {
    filterDate.value = addDays(anchor, direction)
    return
  }
  if (unit === 'month') {
    const d = new Date(`${anchor}T12:00:00`)
    d.setDate(1)
    d.setMonth(d.getMonth() + direction)
    filterDate.value = getLocalDateString(d)
    return
  }
  filterDate.value = addDays(anchor, 7 * direction)
}

// Plage effective [start, end] selon le preset, toujours en 'YYYY-MM-DD' comparables en chaîne.
const dateRange = computed(() => {
  const anchor = filterDate.value || getLocalDateString()

  if (filterPeriod.value === 'custom') {
    const start = customStart.value || anchor
    const end = customEnd.value || start
    return start <= end ? { start, end } : { start: end, end: start }
  }
  if (filterPeriod.value === 'week') {
    const monday = getMonday(new Date(`${anchor}T12:00:00`))
    return { start: monday, end: addDays(monday, 6) }
  }
  if (filterPeriod.value === 'month') {
    const d = new Date(`${anchor}T12:00:00`)
    return {
      start: getLocalDateString(new Date(d.getFullYear(), d.getMonth(), 1)),
      end: getLocalDateString(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
    }
  }
  return { start: anchor, end: anchor }
})

// Formats de dates unifiés pour les sélecteurs et l'en-tête de période
const dayLabelLong = computed(() => {
  const d = new Date(`${filterDate.value || getLocalDateString()}T12:00:00`)
  if (isNaN(d.getTime())) return filterDate.value
  const str = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return str.charAt(0).toUpperCase() + str.slice(1)
})

const dayLabelShort = computed(() => {
  const d = new Date(`${filterDate.value || getLocalDateString()}T12:00:00`)
  if (isNaN(d.getTime())) return filterDate.value
  const str = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  return str.charAt(0).toUpperCase() + str.slice(1)
})

const weekLabelLong = computed(() => {
  return formatWeekLabel(dateRange.value.start, { includeWeekend: true })
})

const weekLabelShort = computed(() => {
  return formatWeekLabel(dateRange.value.start, { includeWeekend: true, short: true })
})

const monthLabel = computed(() => {
  const { start } = dateRange.value
  const d = new Date(`${start}T12:00:00`)
  if (isNaN(d.getTime())) return start
  const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
})

// Libellé de la plage, pour situer la période sans ambiguïté : le jour se lit en toutes lettres,
// la semaine annonce sa plage, le mois son nom et son année.
const periodLabel = computed(() => {
  const { start, end } = dateRange.value
  if (filterPeriod.value === 'day') return formatWorkDate(start, { long: true }) || start
  if (filterPeriod.value === 'month') return monthLabel.value
  if (filterPeriod.value === 'week') return weekLabelLong.value
  return `${formatWorkDate(start) || start} – ${formatWorkDate(end) || end}`
})

// Modal d'édition/correction manuelle (admin)
const editingPresence = ref(null)
const editStatus = ref('present')
const isSavingEdit = ref(false)
const editError = ref('')

// Lecture réactive depuis Dexie : la base locale est la source de vérité de l'écran, jamais le
// réseau. Un changement de plage réabonne la requête, une écriture locale ou un pull rafraîchit la
// vue sans intervention. La plage s'appuie sur l'index B-Tree `work_date` plutôt qu'un scan complet.
const presenceRows = useLiveQuery(async () => {
    const { start, end } = dateRange.value
    if (!start || !end) return []
    return db.presences
      .where('work_date')
      .between(start, end, true, true)
      .filter((p) => !p.deleted_at)
      .toArray()
  }, [], () => `${dateRange.value.start}|${dateRange.value.end}`)

// Profils et sites sont joints localement : un libellé renommé se répercute sans rechargement.
const localProfiles = useLiveQuery(async () => db.profiles.toArray(), [])
const localLocations = useLiveQuery(async () => db.locations.toArray(), [])

const presencesList = computed(() => {
  if (!presenceRows.value) return []
  const profilesMap = new Map((localProfiles.value || []).map((pr) => [pr.id, pr]))
  const locationsMap = new Map((localLocations.value || []).map((loc) => [loc.id, loc]))
  return presenceRows.value.map((p) => ({
    ...p,
    profiles: profilesMap.get(p.user_id) || null,
    locations: locationsMap.get(p.location_id) || null,
  }))
})

// Synthèse chiffrée de la journée
const stats = computed(() => {
  const list = presencesList.value || []
  const total = list.length
  const onTime = list.filter((p) => p.status === 'present' || p.status === 'completed').length
  const late = list.filter((p) => p.status === 'late' || p.status === 'completed_late').length
  const completed = list.filter((p) => Boolean(p.check_out_time)).length
  return { total, onTime, late, completed }
})

// Comptes par statut : les filtres annoncent ce qu'ils contiennent avant qu'on les ouvre.
const statusCounts = computed(() => {
  const list = presencesList.value || []
  const present = list.filter((p) => p.status === 'present').length
  const late = list.filter((p) => p.status === 'late').length
  const completed = list.filter((p) => p.status === 'completed' || p.status === 'completed_late').length
  const absent = list.filter((p) => p.status === 'absent').length
  return { all: list.length, present, late, completed, absent }
})

// Propriété réactive calculée pour le filtrage fluide sans lag
const filteredPresences = computed(() => {
  let list = presencesList.value || []

  if (filterStatus.value) {
    if (filterStatus.value === 'completed') {
      list = list.filter((p) => p.status === 'completed' || p.status === 'completed_late')
    } else {
      list = list.filter((p) => p.status === filterStatus.value)
    }
  }

  if (!filterSearch.value.trim()) return list
  const q = filterSearch.value.toLowerCase()
  return list.filter((p) => {
    return (
      p.profiles?.full_name?.toLowerCase().includes(q) ||
      p.profiles?.email?.toLowerCase().includes(q) ||
      p.locations?.name?.toLowerCase().includes(q)
    )
  })
})

// Colonnes triables par l'en-tête. L'audit privilégie l'arrivée et le départ, sans exclure le reste.
const SORTABLE_COLUMNS = [
  { key: 'name', label: 'Collaborateur' },
  { key: 'site', label: 'Site' },
  { key: 'date', label: 'Date' },
  { key: 'check_in', label: 'Arrivée' },
  { key: 'check_out', label: 'Départ' },
  { key: 'duration', label: 'Durée' },
  { key: 'status', label: 'Statut' },
  { key: 'gps', label: 'Précision GPS' },
]

// Tri par défaut : la date la plus récente d'abord, puis l'arrivée la plus tardive dans la journée.
const sortKey = ref('date')
const sortDir = ref('desc')

const SORT_ACCESSORS = {
  name: (p) => p.profiles?.full_name || '',
  site: (p) => p.locations?.name || '',
  date: (p) => p.work_date || '',
  check_in: (p) => p.check_in_time || '',
  check_out: (p) => p.check_out_time || '',
  duration: (p) => {
    const state = resolveSessionState(p)
    return state === 'closed' || state === 'in_progress' ? resolveSessionMinutes(p) : null
  },
  status: (p) => p.status || '',
  gps: (p) => (p.check_in_accuracy == null ? null : Number(p.check_in_accuracy)),
}

const sortedPresences = computed(() => {
  const list = [...(filteredPresences.value || [])]
  const accessor = SORT_ACCESSORS[sortKey.value] || SORT_ACCESSORS.check_in
  const dir = sortDir.value === 'asc' ? 1 : -1
  return list.sort((a, b) => {
    const va = accessor(a)
    const vb = accessor(b)
    const aMissing = va === null || va === undefined || va === ''
    const bMissing = vb === null || vb === undefined || vb === ''
    if (aMissing && bMissing) return 0
    if (aMissing) return 1 // une valeur absente se range en fin de liste, dans les deux sens
    if (bMissing) return -1
    const cmp = typeof va === 'number' && typeof vb === 'number'
      ? va - vb
      : String(va).localeCompare(String(vb), 'fr', { numeric: true, sensitivity: 'base' })
    if (cmp === 0) {
      // Départage stable : l'heure d'arrivée suit le sens courant
      return String(a.check_in_time || '').localeCompare(String(b.check_in_time || '')) * dir
    }
    return cmp * dir
  })
})

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

const ariaSort = (key) => {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

// Icône d'en-tête : double chevron au repos, flèche orientée quand la colonne trie.
const sortIconPath = (key) => {
  if (sortKey.value !== key) return 'M8 9l4-4 4 4M16 15l-4 4-4-4'
  return sortDir.value === 'asc' ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7'
}

/**
 * Message de l'état vide : distinguer « aucun pointage sur la période », « aucun résultat de
 * recherche » et « aucun pointage pour ce statut », et proposer l'action réellement utile.
 */
const emptyState = computed(() => {
  if (!(presencesList.value || []).length) {
    // L'actualisation vit dans l'en-tête : l'état vide n'en propose pas de doublon.
    return {
      title: 'Aucun pointage',
      message: `Aucun pointage n'a été enregistré sur cette période (${periodLabel.value}).`,
      icon: 'calendar',
      action: null,
      actionLabel: '',
    }
  }
  if (filterSearch.value.trim()) {
    return {
      title: 'Aucun résultat',
      message: `Aucun pointage ne correspond à « ${filterSearch.value.trim()} ».`,
      icon: 'search',
      action: 'clear-search',
      actionLabel: 'Effacer la recherche',
    }
  }
  return {
    title: 'Aucun pointage pour ce filtre',
    message: 'Aucun pointage ne correspond au statut sélectionné pour cette période.',
    icon: 'filter',
    action: 'show-all',
    actionLabel: 'Voir tous les pointages',
  }
})

const runEmptyAction = () => {
  if (emptyState.value.action === 'clear-search') filterSearch.value = ''
  else if (emptyState.value.action === 'show-all') filterStatus.value = ''
}

// Initiales pour l'avatar de la carte
const initials = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}

// Précision GPS : couple libellé/couleur selon la tolérance de pointage
const accuracyBadge = (accuracy) => {
  const value = Number(accuracy)
  if (!Number.isFinite(value)) return { label: 'GPS —', class: 'badge-soft text-base-content/60' }
  const rounded = Math.round(value)
  if (rounded <= 15) return { label: `±${rounded} m`, class: 'badge-success text-success-content' }
  if (rounded <= 50) return { label: `±${rounded} m`, class: 'badge-warning text-warning-content' }
  return { label: `±${rounded} m`, class: 'badge-soft text-base-content/60' }
}

const openEditModal = (p) => {
  editingPresence.value = p
  editStatus.value = p.status
  editError.value = ''
}

const saveEdit = async () => {
  if (!editingPresence.value) return
  isSavingEdit.value = true
  editError.value = ''

  try {
    const updatedTime = new Date().toISOString()
    const presenceId = editingPresence.value.id
    const newStatus = editStatus.value

    // Mise à jour locale Dexie + outbox pour résilience offline
    const record = await db.presences.get(presenceId)
    if (record) {
      const payload = { ...record, status: newStatus, updated_at: updatedTime }
      const outboxEntry = {
        id: generateUUIDv7(),
        client_mutation_id: generateUUIDv7(),
        table_name: 'presences',
        record_id: presenceId,
        operation: 'UPDATE',
        payload,
        created_at: updatedTime,
        attempts: 0,
        status: 'pending',
      }
      await db.transaction('rw', db.presences, db.sync_outbox, async () => {
        await db.presences.update(presenceId, { status: newStatus, updated_at: updatedTime })
        await db.sync_outbox.add(outboxEntry)
      })
    }

    editingPresence.value = null
    toastSuccess('Le statut du pointage a été corrigé.')

    // La correction vit dans Dexie et l'outbox : l'engine la pousse, la vue se rafraîchit seule.
    if (navigator.onLine) {
      syncNow(user?.id)
    }
  } catch (err) {
    editError.value = `Erreur de modification : ${err.message}`
    toastError(`Erreur de modification : ${err.message}`)
  } finally {
    isSavingEdit.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- En-tête -->
    <ManagerPageHeader
      title="Pointages"
      subtitle="Arrivées, départs et heures constatées sur le terrain"
    >
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </template>
    </ManagerPageHeader>

    <!-- Synthèse : le bandeau décrit les temps (ponctualité, clôture), le filtre décrit la session -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <ManagerKpiCard
        label="Pointages"
        :value="stats.total"
        caption="Sur la période"
      />
      <ManagerKpiCard
        label="À l'heure"
        :value="stats.onTime"
        caption="Arrivées ponctuelles, journées closes comprises"
        tone="success"
      />
      <ManagerKpiCard
        label="En retard"
        :value="stats.late"
        caption="Arrivées tardives, journées closes comprises"
        tone="warning"
      />
      <ManagerKpiCard
        label="Journées terminées"
        :value="stats.completed"
        caption="Avec départ enregistré"
        tone="info"
      />
    </div>

    <!-- Filtres et recherche -->
    <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 flex flex-col gap-3">
      <!-- Recherche : pleine largeur du conteneur, cible confortable -->
      <label class="input input-bordered flex w-full items-center gap-2 rounded-m3-md bg-base-300/50 min-h-11">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="filterSearch"
          type="text"
          class="grow text-sm"
          placeholder="Rechercher un nom, un email ou un site"
        />
      </label>

      <!-- Presets de période, puis ancre du mode courant dans un gabarit unique -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Période</legend>
        <div class="join w-full overflow-x-auto sm:w-auto">
          <button
            type="button"
            class="btn join-item min-h-11 px-3 shrink-0"
            :class="{ 'btn-primary': filterPeriod === 'day' }"
            @click="filterPeriod = 'day'"
          >
            Jour
          </button>
          <button
            type="button"
            class="btn join-item min-h-11 px-3 shrink-0"
            :class="{ 'btn-primary': filterPeriod === 'week' }"
            @click="filterPeriod = 'week'"
          >
            Semaine
          </button>
          <button
            type="button"
            class="btn join-item min-h-11 px-3 shrink-0"
            :class="{ 'btn-primary': filterPeriod === 'month' }"
            @click="filterPeriod = 'month'"
          >
            Mois
          </button>
          <button
            type="button"
            class="btn join-item min-h-11 px-3 shrink-0"
            :class="{ 'btn-primary': filterPeriod === 'custom' }"
            @click="filterPeriod = 'custom'"
          >
            Personnalisé
          </button>
        </div>
      </fieldset>

      <!-- Jour : date d'ancrage avec chevrons et ouverture native au clic -->
      <fieldset v-if="filterPeriod === 'day'" class="fieldset w-full sm:w-auto max-w-full">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Date</legend>
        <div class="relative flex w-full sm:w-auto items-center justify-between sm:justify-start rounded-m3-md border border-base-300 bg-base-300/50 min-h-11 max-w-full">
          <button
            type="button"
            class="btn btn-ghost min-h-11 min-w-11 shrink-0 p-0 rounded-l-m3-md active:scale-95 transition-transform duration-150 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Jour précédent"
            @click="shiftAnchor('day', -1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6"></path>
            </svg>
          </button>
          <label for="f-date" class="relative flex-1 sm:flex-initial min-w-0 px-2 sm:px-3 min-h-11 flex items-center justify-center text-center cursor-pointer hover:bg-base-content/5 transition-colors">
            <input
              id="f-date"
              v-model="filterDate"
              type="date"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto"
              aria-label="Sélectionner une date"
            />
            <span class="sm:hidden text-xs sm:text-sm font-semibold text-base-content truncate pointer-events-none">
              {{ dayLabelShort }}
            </span>
            <span class="hidden sm:inline text-sm font-semibold text-base-content whitespace-nowrap pointer-events-none">
              {{ dayLabelLong }}
            </span>
          </label>
          <button
            type="button"
            class="btn btn-ghost min-h-11 min-w-11 shrink-0 p-0 rounded-r-m3-md active:scale-95 transition-transform duration-150 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Jour suivant"
            @click="shiftAnchor('day', 1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6"></path>
            </svg>
          </button>
        </div>
      </fieldset>

      <!-- Semaine : ancre parcourue par flèches, format adaptatif responsive -->
      <fieldset v-else-if="filterPeriod === 'week'" class="fieldset w-full sm:w-auto max-w-full">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Semaine</legend>
        <div class="flex w-full sm:w-auto items-center justify-between sm:justify-start rounded-m3-md border border-base-300 bg-base-300/50 min-h-11 max-w-full">
          <button
            type="button"
            class="btn btn-ghost min-h-11 min-w-11 shrink-0 p-0 rounded-l-m3-md active:scale-95 transition-transform duration-150 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Semaine précédente"
            @click="shiftAnchor('week', -1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6"></path>
            </svg>
          </button>
          <div class="flex-1 sm:flex-initial min-w-0 px-2 sm:px-3 min-h-11 flex items-center justify-center text-center">
            <span class="sm:hidden text-xs sm:text-sm font-semibold text-base-content truncate">
              {{ weekLabelShort }}
            </span>
            <span class="hidden sm:inline text-sm font-semibold text-base-content whitespace-nowrap">
              {{ weekLabelLong }}
            </span>
          </div>
          <button
            type="button"
            class="btn btn-ghost min-h-11 min-w-11 shrink-0 p-0 rounded-r-m3-md active:scale-95 transition-transform duration-150 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Semaine suivante"
            @click="shiftAnchor('week', 1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6"></path>
            </svg>
          </button>
        </div>
      </fieldset>

      <!-- Mois : ancre parcourue par flèches, mois lisible -->
      <fieldset v-else-if="filterPeriod === 'month'" class="fieldset w-full sm:w-auto max-w-full">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Mois</legend>
        <div class="flex w-full sm:w-auto items-center justify-between sm:justify-start rounded-m3-md border border-base-300 bg-base-300/50 min-h-11 max-w-full">
          <button
            type="button"
            class="btn btn-ghost min-h-11 min-w-11 shrink-0 p-0 rounded-l-m3-md active:scale-95 transition-transform duration-150 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Mois précédent"
            @click="shiftAnchor('month', -1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6"></path>
            </svg>
          </button>
          <div class="flex-1 sm:flex-initial min-w-0 px-2 sm:px-3 min-h-11 flex items-center justify-center text-center">
            <span class="text-sm font-semibold text-base-content whitespace-nowrap">
              {{ monthLabel }}
            </span>
          </div>
          <button
            type="button"
            class="btn btn-ghost min-h-11 min-w-11 shrink-0 p-0 rounded-r-m3-md active:scale-95 transition-transform duration-150 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Mois suivant"
            @click="shiftAnchor('month', 1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6"></path>
            </svg>
          </button>
        </div>
      </fieldset>

      <!-- Personnalisé : plage choisie par l'utilisateur -->
      <div v-else class="flex flex-col sm:flex-row gap-3">
        <div class="fieldset sm:flex-1 min-w-0">
          <label for="f-start" class="fieldset-legend text-xs font-semibold text-base-content/70">Du</label>
          <input id="f-start" v-model="customStart" type="date" :max="customEnd" class="input input-bordered min-h-11 rounded-m3-sm w-full" />
        </div>
        <div class="fieldset sm:flex-1 min-w-0">
          <label for="f-end" class="fieldset-legend text-xs font-semibold text-base-content/70">Au</label>
          <input id="f-end" v-model="customEnd" type="date" :min="customStart" class="input input-bordered min-h-11 rounded-m3-sm w-full" />
        </div>
      </div>

      <!-- Filtre de statut en pleine largeur sous la période, segment actif atténué, défilement sur mobile -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Statut</legend>
        <div class="join w-full overflow-x-auto sm:w-auto">
          <button
            type="button"
            class="btn join-item min-h-11 px-3 shrink-0"
            :class="{ 'btn-active font-semibold': filterStatus === '' }"
            @click="filterStatus = ''"
          >
            Tous ({{ statusCounts.all }})
          </button>
          <button
            type="button"
            class="btn join-item min-h-11 px-3 shrink-0"
            :class="{ 'btn-active font-semibold': filterStatus === 'present' }"
            @click="filterStatus = 'present'"
          >
            Présents ({{ statusCounts.present }})
          </button>
          <button
            type="button"
            class="btn join-item min-h-11 px-3 shrink-0"
            :class="{ 'btn-active font-semibold': filterStatus === 'late' }"
            @click="filterStatus = 'late'"
          >
            En retard ({{ statusCounts.late }})
          </button>
          <button
            type="button"
            class="btn join-item min-h-11 px-3 shrink-0"
            :class="{ 'btn-active font-semibold': filterStatus === 'completed' }"
            @click="filterStatus = 'completed'"
          >
            Terminés ({{ statusCounts.completed }})
          </button>
          <button
            type="button"
            class="btn join-item min-h-11 px-3 shrink-0"
            :class="{ 'btn-active font-semibold': filterStatus === 'absent' }"
            @click="filterStatus = 'absent'"
          >
            Absents ({{ statusCounts.absent }})
          </button>
        </div>
      </fieldset>
    </div>

    <!-- État vide : icône de situation, aucune action concurrente de l'actualisation d'en-tête -->
    <div v-if="!filteredPresences.length" class="card bg-base-200 border border-base-300 rounded-m3-lg p-8 text-center items-center">
      <div class="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center text-base-content/40 mb-3">
        <svg v-if="emptyState.icon === 'calendar'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <svg v-else-if="emptyState.icon === 'search'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="8" y1="8" x2="14" y2="14"></line>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path>
        </svg>
      </div>
      <h3 class="font-bold text-base text-base-content">{{ emptyState.title }}</h3>
      <p class="text-sm text-base-content/60 mt-1 max-w-md mx-auto">{{ emptyState.message }}</p>
      <div v-if="emptyState.action" class="mt-4">
        <button
          type="button"
          class="btn btn-outline min-h-11 rounded-m3-sm"
          @click="runEmptyAction"
        >
          {{ emptyState.actionLabel }}
        </button>
      </div>
    </div>

    <!-- Pointages : fiches synthétiques sous 640px, tableau d'audit au-delà -->
    <div v-else class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg overflow-hidden">
      <!-- Fiches synthétiques : identité, site, temps, statut -->
      <ul class="sm:hidden divide-y divide-base-300">
        <li v-for="p in sortedPresences" :key="p.id" class="p-4 flex flex-col gap-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                {{ initials(p.profiles?.full_name) }}
              </div>
              <div class="min-w-0">
                <strong class="block text-sm font-bold text-base-content truncate">{{ p.profiles?.full_name || 'Utilisateur inconnu' }}</strong>
                <span class="block text-xs text-base-content/60 truncate">{{ p.profiles?.email || 'Email inconnu' }}</span>
              </div>
            </div>
            <StatusBadge :status="p.status" />
          </div>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/80">
            <span class="inline-flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {{ p.locations?.name || 'Site central' }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {{ formatWorkDate(p.work_date, { long: true }) || p.work_date }}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span class="font-mono font-semibold text-base-content">Arrivée {{ formatTime(p.check_in_time) }}</span>
            <span class="font-mono font-semibold text-base-content">Départ {{ formatTime(p.check_out_time) }}</span>
            <span v-if="resolveSessionState(p) === 'closed'" class="font-semibold text-base-content">Durée {{ formatSessionDuration(p) }}</span>
            <span v-else-if="resolveSessionState(p) === 'in_progress'" class="inline-flex items-center gap-1 font-semibold text-warning">
              <span class="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
              En cours
            </span>
            <span v-else-if="resolveSessionState(p) === 'missing_checkout'" class="inline-flex items-center gap-1 font-semibold text-warning">
              <span class="w-1.5 h-1.5 rounded-full bg-warning"></span>
              Départ manquant
            </span>
          </div>

          <div class="flex items-center justify-between gap-3">
            <span class="badge badge-sm font-semibold gap-1 py-2.5 px-2" :class="accuracyBadge(p.check_in_accuracy).class">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="22" y1="12" x2="18" y2="12"></line>
                <line x1="6" y1="12" x2="2" y2="12"></line>
                <line x1="12" y1="6" x2="12" y2="2"></line>
                <line x1="12" y1="22" x2="12" y2="18"></line>
              </svg>
              {{ accuracyBadge(p.check_in_accuracy).label }}
            </span>
            <button
              v-if="profile?.role === 'admin'"
              type="button"
              class="btn btn-secondary btn-outline font-semibold rounded-m3-sm gap-1.5 min-h-11 px-3"
              title="Modifier le statut"
              @click="openEditModal(p)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Modifier</span>
            </button>
          </div>
        </li>
      </ul>

      <!-- Tableau d'audit : à partir de 640px -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="table table-sm w-full">
          <thead>
            <tr class="text-xs uppercase text-base-content/60">
              <th v-for="col in SORTABLE_COLUMNS" :key="col.key" :aria-sort="ariaSort(col.key)">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 font-semibold uppercase tracking-wide rounded-m3-xs transition-colors hover:text-base-content focus-visible:outline-2 focus-visible:outline-primary"
                  :title="`Trier par ${col.label.toLowerCase()}`"
                  @click="toggleSort(col.key)"
                >
                  <span>{{ col.label }}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-3 h-3 shrink-0"
                    :class="sortKey === col.key ? 'text-primary' : 'text-base-content/30'"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path :d="sortIconPath(col.key)"></path>
                  </svg>
                </button>
              </th>
              <th v-if="profile?.role === 'admin'">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in sortedPresences" :key="p.id" class="hover">
              <td>
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    {{ initials(p.profiles?.full_name) }}
                  </div>
                  <div class="min-w-0">
                    <strong class="block text-sm font-bold text-base-content truncate">{{ p.profiles?.full_name || 'Utilisateur inconnu' }}</strong>
                    <span class="block text-xs text-base-content/60 truncate">{{ p.profiles?.email || 'Email inconnu' }}</span>
                  </div>
                </div>
              </td>
              <td class="text-xs text-base-content/80">{{ p.locations?.name || 'Site central' }}</td>
              <td class="text-xs text-base-content/80">{{ formatWorkDate(p.work_date, { long: true }) || p.work_date }}</td>
              <td class="font-mono text-xs font-semibold text-base-content">{{ formatTime(p.check_in_time) }}</td>
              <td class="font-mono text-xs font-semibold text-base-content">{{ formatTime(p.check_out_time) }}</td>
              <td>
                <span v-if="resolveSessionState(p) === 'closed'" class="text-xs font-semibold text-base-content">
                  {{ formatSessionDuration(p) }}
                </span>
                <span v-else-if="resolveSessionState(p) === 'in_progress'" class="text-xs font-semibold text-warning inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
                  En cours
                </span>
                <span
                  v-else-if="resolveSessionState(p) === 'missing_checkout'"
                  class="text-xs font-semibold text-warning inline-flex items-center gap-1"
                  title="Arrivée pointée sans départ : durée indisponible tant que le pointage n'est pas corrigé"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-warning"></span>
                  Départ manquant
                </span>
                <span v-else class="text-xs font-semibold text-base-content/50">—</span>
              </td>
              <td>
                <StatusBadge :status="p.status" />
              </td>
              <td>
                <span class="badge badge-sm font-semibold gap-1 py-2.5 px-2" :class="accuracyBadge(p.check_in_accuracy).class">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="22" y1="12" x2="18" y2="12"></line>
                    <line x1="6" y1="12" x2="2" y2="12"></line>
                    <line x1="12" y1="6" x2="12" y2="2"></line>
                    <line x1="12" y1="22" x2="12" y2="18"></line>
                  </svg>
                  {{ accuracyBadge(p.check_in_accuracy).label }}
                </span>
              </td>
              <td v-if="profile?.role === 'admin'">
                <button
                  type="button"
                  class="btn btn-secondary btn-outline font-semibold rounded-m3-sm gap-1.5 min-h-11 px-3"
                  title="Modifier le statut"
                  @click="openEditModal(p)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Modifier</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de correction manuelle admin (DaisyUI Modal) -->
    <dialog :class="['modal', { 'modal-open': !!editingPresence }]">
      <div class="modal-box rounded-m3-xl max-w-sm sm:max-w-md p-6 gap-4 flex flex-col bg-base-100 border border-base-300 shadow-sm">
        <div class="flex items-center justify-between pb-2 border-b border-base-200">
          <h3 class="font-black text-xl text-base-content flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Correction manuelle</span>
          </h3>
          <button
            type="button"
            class="btn btn-circle btn-ghost min-w-11 min-h-11"
            aria-label="Fermer la modale"
            @click="editingPresence = null"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <p class="text-xs text-base-content/60">
          Collaborateur : <strong class="text-base-content">{{ editingPresence?.profiles?.full_name }}</strong> ({{ editingPresence?.work_date }})
        </p>

        <!-- Message d'erreur intégré sans alert() bloquant -->
        <div v-if="editError" class="alert alert-error text-xs py-2 rounded-m3-xs flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{{ editError }}</span>
        </div>

        <div class="fieldset">
          <label for="edit-st" class="fieldset-legend text-xs font-semibold text-base-content/70">Nouveau statut :</label>
          <select id="edit-st" v-model="editStatus" class="select select-bordered min-h-11 w-full rounded-m3-md">
            <option value="present">Présent (à l'heure)</option>
            <option value="late">En retard</option>
            <option value="completed">Terminé (à l'heure)</option>
            <option value="completed_late">Terminé (avec retard)</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        <div class="modal-action mt-2 pt-4 border-t border-base-200 gap-2">
          <button
            type="button"
            class="btn btn-ghost min-h-11 rounded-m3-sm font-medium"
            @click="editingPresence = null"
          >
            Annuler
          </button>
          <button
            type="button"
            class="btn btn-primary min-h-11 rounded-m3-sm font-bold shadow-xs px-4"
            :disabled="isSavingEdit"
            @click="saveEdit"
          >
            <span v-if="isSavingEdit" class="loading loading-spinner loading-xs"></span>
            <span v-else>Enregistrer la modification</span>
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-xs" @click="editingPresence = null">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
