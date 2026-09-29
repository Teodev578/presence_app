<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import { db } from '../../lib/db'
import { generateUUIDv7 } from '../../lib/uuidv7'
import { useProfile } from '../../composables/useProfile'
import { useToast } from '../../composables/useToast'
import {
  getLocalDateString,
  getMonday,
  formatTime,
  formatWorkDate,
  formatSessionDuration,
  resolveSessionState,
  resolveSessionMinutes,
} from '../../lib/dateUtils'
import StatusBadge from '../../components/shared/StatusBadge.vue'

const { profile } = useProfile()
const { success: toastSuccess, error: toastError } = useToast()

// Filtre de période : presets journalier / semaine / mois, puis plage personnalisée.
// `filterDate` sert d'ancre calendaire pour les presets, `customStart`/`customEnd` pour la plage libre.
const filterPeriod = ref('day') // 'day' | 'week' | 'month' | 'custom'
const filterDate = ref(getLocalDateString())
const customStart = ref(getLocalDateString())
const customEnd = ref(getLocalDateString())
const filterStatus = ref('')
const filterSearch = ref('')
const presencesList = ref([])
const loading = ref(false)

// Décalage calendaire en jours, sans dérive de fuseau (midi local).
const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + days)
  return getLocalDateString(d)
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

// Libellé de la plage, pour situer la période sans ambiguïté.
const periodLabel = computed(() => {
  const { start, end } = dateRange.value
  if (filterPeriod.value === 'day') return formatWorkDate(start) || start
  if (filterPeriod.value === 'month') {
    const d = new Date(`${start}T12:00:00`)
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }
  return `${formatWorkDate(start) || start} → ${formatWorkDate(end) || end}`
})

// Modal d'édition/correction manuelle (admin)
const editingPresence = ref(null)
const editStatus = ref('present')
const isSavingEdit = ref(false)
const editError = ref('')

const loadPresences = async () => {
  loading.value = true
  try {
    // 1. Consultation locale-first (Dexie) pour réactivité et usage hors-ligne
    const { start, end } = dateRange.value
    const localPresences = await db.presences
      .filter((p) => !p.deleted_at && (!start || p.work_date >= start) && (!end || p.work_date <= end))
      .toArray()

    const profiles = await db.profiles.toArray()
    const locations = await db.locations.toArray()
    const profilesMap = new Map(profiles.map((pr) => [pr.id, pr]))
    const locationsMap = new Map(locations.map((loc) => [loc.id, loc]))

    const enrichedLocal = localPresences.map((p) => ({
      ...p,
      profiles: profilesMap.get(p.user_id) || null,
      locations: locationsMap.get(p.location_id) || null,
    }))

    // La liste locale fait foi immédiatement : une date sans pointage vide bien la vue
    presencesList.value = enrichedLocal

    // 2. Synchronisation distante si connecté
    if (navigator.onLine) {
      let query = supabase
        .from('presences')
        .select('*, profiles(full_name, email, role), locations(name)')
        .is('deleted_at', null)
        .order('check_in_time', { ascending: false })

      if (start) {
        query = query.gte('work_date', start)
      }
      if (end) {
        query = query.lte('work_date', end)
      }

      const { data, error } = await query
      if (!error && data) {
        presencesList.value = data
        // Mise en cache locale des pointages distants
        const rawPresences = data.map(({ profiles: _p, locations: _l, ...p }) => p)
        if (rawPresences.length) {
          await db.presences.bulkPut(rawPresences)
        }
      }
    }
  } catch (err) {
    console.error('Erreur chargement présences :', err)
  } finally {
    loading.value = false
  }
}

watch(dateRange, () => {
  loadPresences()
})

onMounted(() => {
  loadPresences()
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
  return { all: list.length, present, late, completed }
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
    return {
      title: 'Aucun pointage',
      message: `Aucun pointage n'a été enregistré sur cette période (${periodLabel.value}).`,
      action: 'refresh',
      actionLabel: 'Actualiser',
    }
  }
  if (filterSearch.value.trim()) {
    return {
      title: 'Aucun résultat',
      message: `Aucun pointage ne correspond à « ${filterSearch.value.trim()} ».`,
      action: 'clear-search',
      actionLabel: 'Effacer la recherche',
    }
  }
  return {
    title: 'Aucun pointage pour ce filtre',
    message: 'Aucun pointage ne correspond au statut sélectionné pour cette période.',
    action: 'show-all',
    actionLabel: 'Voir tous les pointages',
  }
})

const runEmptyAction = () => {
  if (emptyState.value.action === 'refresh') loadPresences()
  else if (emptyState.value.action === 'clear-search') filterSearch.value = ''
  else filterStatus.value = ''
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

    // Propagation Supabase si en ligne
    if (navigator.onLine) {
      const { error } = await supabase
        .from('presences')
        .update({ status: newStatus, updated_at: updatedTime })
        .eq('id', presenceId)

      if (error) throw error
    }

    editingPresence.value = null
    toastSuccess('Le statut du pointage a été corrigé.')
    await loadPresences()
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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black tracking-tight text-base-content flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </div>
          <span>Contrôle des Présences</span>
        </h1>
        <p class="text-xs text-base-content/60 mt-0.5">
          Suivi de l'assiduité, précision GPS et audit des temps de travail
        </p>
      </div>

      <div>
        <button
          type="button"
          class="btn btn-outline rounded-m3-sm font-bold min-h-11 flex items-center gap-2 px-3"
          @click="loadPresences"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          <span>Actualiser</span>
        </button>
      </div>
    </div>

    <!-- Synthèse KPI rapide de la journée -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="card bg-base-200 border border-base-300 shadow-xs p-4 rounded-m3-md flex flex-col gap-1">
        <span class="text-xs font-semibold text-base-content/60">Total pointés</span>
        <span class="text-2xl font-black text-base-content">{{ stats.total }}</span>
        <span class="text-[11px] text-base-content/50">Pointages enregistrés</span>
      </div>
      <div class="card bg-base-200 border border-base-300 shadow-xs p-4 rounded-m3-md flex flex-col gap-1">
        <span class="text-xs font-semibold text-success flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-success"></span>
          À l'heure
        </span>
        <span class="text-2xl font-black text-success">{{ stats.onTime }}</span>
        <span class="text-[11px] text-base-content/50">Arrivées ponctuelles</span>
      </div>
      <div class="card bg-base-200 border border-base-300 shadow-xs p-4 rounded-m3-md flex flex-col gap-1">
        <span class="text-xs font-semibold text-warning flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-warning"></span>
          En retard
        </span>
        <span class="text-2xl font-black text-warning">{{ stats.late }}</span>
        <span class="text-[11px] text-base-content/50">Retards constatés</span>
      </div>
      <div class="card bg-base-200 border border-base-300 shadow-xs p-4 rounded-m3-md flex flex-col gap-1">
        <span class="text-xs font-semibold text-info flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-info"></span>
          Départs validés
        </span>
        <span class="text-2xl font-black text-info">{{ stats.completed }}</span>
        <span class="text-[11px] text-base-content/50">Journées clôturées</span>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 flex flex-col gap-3">
      <!-- Recherche : pleine largeur du conteneur, cible confortable -->
      <div class="w-full">
        <label class="input input-bordered flex w-full items-center gap-2 rounded-m3-md bg-base-300/50 min-h-11">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="filterSearch"
            type="text"
            class="grow text-sm"
            placeholder="Rechercher un collaborateur (nom, email ou site)..."
          />
        </label>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <!-- Période : presets puis plage personnalisée -->
        <div class="flex flex-col gap-2">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <span class="text-sm font-semibold text-base-content/60">Période :</span>
            <div class="join join-vertical w-full sm:join-horizontal sm:w-auto">
              <button
                type="button"
                class="btn join-item w-full sm:w-auto min-h-11 px-3 rounded-t-m3-sm sm:rounded-l-m3-sm sm:rounded-tr-none"
                :class="{ 'btn-primary': filterPeriod === 'day' }"
                @click="filterPeriod = 'day'"
              >
                Jour
              </button>
              <button
                type="button"
                class="btn join-item w-full sm:w-auto min-h-11 px-3"
                :class="{ 'btn-primary': filterPeriod === 'week' }"
                @click="filterPeriod = 'week'"
              >
                Semaine
              </button>
              <button
                type="button"
                class="btn join-item w-full sm:w-auto min-h-11 px-3"
                :class="{ 'btn-primary': filterPeriod === 'month' }"
                @click="filterPeriod = 'month'"
              >
                Mois
              </button>
              <button
                type="button"
                class="btn join-item w-full sm:w-auto min-h-11 px-3 rounded-b-m3-sm sm:rounded-r-m3-sm sm:rounded-bl-none"
                :class="{ 'btn-primary': filterPeriod === 'custom' }"
                @click="filterPeriod = 'custom'"
              >
                Personnalisé
              </button>
            </div>
          </div>

          <!-- Jour : date d'ancrage -->
          <div v-if="filterPeriod === 'day'" class="fieldset">
            <label for="f-date" class="fieldset-legend text-xs font-semibold text-base-content/70">Date :</label>
            <input id="f-date" v-model="filterDate" type="date" class="input input-bordered min-h-11 rounded-m3-sm w-full sm:w-auto" />
          </div>

          <!-- Personnalisé : plage choisie par l'utilisateur -->
          <div v-else-if="filterPeriod === 'custom'" class="flex flex-col sm:flex-row sm:items-end gap-3">
            <div class="fieldset">
              <label for="f-start" class="fieldset-legend text-xs font-semibold text-base-content/70">Du :</label>
              <input id="f-start" v-model="customStart" type="date" :max="customEnd" class="input input-bordered min-h-11 rounded-m3-sm w-full sm:w-auto" />
            </div>
            <div class="fieldset">
              <label for="f-end" class="fieldset-legend text-xs font-semibold text-base-content/70">Au :</label>
              <input id="f-end" v-model="customEnd" type="date" :min="customStart" class="input input-bordered min-h-11 rounded-m3-sm w-full sm:w-auto" />
            </div>
          </div>

          <!-- Semaine / Mois : la plage calculée est annoncée en clair -->
          <p v-else class="text-xs text-base-content/60">
            {{ periodLabel }}
          </p>
        </div>

        <!-- Filtre Statut -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:self-end">
          <span class="text-sm font-semibold text-base-content/60">Statut :</span>
          <div class="join join-vertical w-full sm:join-horizontal sm:w-auto">
            <button
              type="button"
              class="btn join-item w-full sm:w-auto min-h-11 px-3 rounded-t-m3-sm sm:rounded-l-m3-sm sm:rounded-tr-none"
              :class="{ 'btn-primary': filterStatus === '' }"
              @click="filterStatus = ''"
            >
              Tous ({{ statusCounts.all }})
            </button>
            <button
              type="button"
              class="btn join-item w-full sm:w-auto min-h-11 px-3"
              :class="{ 'btn-primary': filterStatus === 'present' }"
              @click="filterStatus = 'present'"
            >
              Présents ({{ statusCounts.present }})
            </button>
            <button
              type="button"
              class="btn join-item w-full sm:w-auto min-h-11 px-3"
              :class="{ 'btn-primary': filterStatus === 'late' }"
              @click="filterStatus = 'late'"
            >
              En retard ({{ statusCounts.late }})
            </button>
            <button
              type="button"
              class="btn join-item w-full sm:w-auto min-h-11 px-3 rounded-b-m3-sm sm:rounded-r-m3-sm sm:rounded-bl-none"
              :class="{ 'btn-primary': filterStatus === 'completed' }"
              @click="filterStatus = 'completed'"
            >
              Terminés ({{ statusCounts.completed }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading" class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-8 text-center text-sm text-base-content/60 flex items-center justify-center gap-2">
      <span class="loading loading-spinner loading-sm text-primary"></span>
      Chargement des pointages...
    </div>

    <!-- État vide -->
    <div v-else-if="!filteredPresences.length" class="card bg-base-200 border border-base-300 rounded-m3-lg p-8 text-center items-center">
      <div class="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center text-base-content/40 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      </div>
      <h3 class="font-bold text-base text-base-content">{{ emptyState.title }}</h3>
      <p class="text-sm text-base-content/60 mt-1 max-w-md mx-auto">{{ emptyState.message }}</p>
      <div class="mt-4">
        <button
          type="button"
          class="btn btn-primary min-h-11 rounded-m3-sm"
          @click="runEmptyAction"
        >
          {{ emptyState.actionLabel }}
        </button>
      </div>
    </div>

    <!-- Tableau des pointages -->
    <div v-else class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg overflow-hidden">
      <div class="overflow-x-auto">
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
              <td class="text-xs text-base-content/80">{{ formatWorkDate(p.work_date) || p.work_date }}</td>
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
            <span v-else>Valider la correction</span>
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-xs" @click="editingPresence = null">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
