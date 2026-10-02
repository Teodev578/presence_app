<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from '../../router'
import { db, useLiveQuery } from '../../lib/db'
import { generateUUIDv7 } from '../../lib/uuidv7'
import { useAuth } from '../../composables/useAuth'
import { useSyncEngine } from '../../composables/useSyncEngine'
import ConfirmModal from '../../components/shared/ConfirmModal.vue'
import ManagerPageHeader from '../../components/manager/ManagerPageHeader.vue'
import ManagerEmptyState from '../../components/manager/ManagerEmptyState.vue'
import { useToast } from '../../composables/useToast'

const { route } = useRouter()
const { user } = useAuth()
const { refreshPendingCount, syncNow } = useSyncEngine()
const { success, error: toastError } = useToast()

// Lectures réactives Local-First depuis Dexie (sans latence réseau)
const rawEmployees = useLiveQuery(async () => {
  return await db.profiles
    .filter((p) => !p.deleted_at)
    .toArray()
})

const rawTeams = useLiveQuery(async () => {
  return await db.teams
    .filter((t) => !t.deleted_at)
    .toArray()
})

const isLoading = computed(() => rawEmployees.value === undefined || rawTeams.value === undefined)

// Recherche et filtres
const searchQuery = ref('')
const filterRole = ref('all') // 'all', 'employee', 'manager', 'admin'
const filterStatus = ref(route.value.query.status || 'all') // 'all', 'active', 'pending_validation', 'archived', 'disabled'
const filterTeam = ref('')

watch(
  () => route.value.query.status,
  (newStatus) => {
    if (newStatus) {
      filterStatus.value = newStatus
    }
  }
)

// Jointure locale réactive entre profils et équipes
const employees = computed(() => {
  const teamsMap = new Map((rawTeams.value || []).map((t) => [t.id, t]))
  return (rawEmployees.value || [])
    .map((emp) => ({
      ...emp,
      status: emp.status || 'active',
      teams: teamsMap.get(emp.team_id) || null,
    }))
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'fr'))
})

const teams = computed(() => {
  return (rawTeams.value || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fr'))
})

// Comptes par rôle et par statut
const roleCounts = computed(() => {
  const list = employees.value || []
  return {
    all: list.length,
    employee: list.filter((e) => e.role === 'employee').length,
    manager: list.filter((e) => e.role === 'manager').length,
    admin: list.filter((e) => e.role === 'admin').length,
  }
})

const statusCounts = computed(() => {
  const list = employees.value || []
  return {
    all: list.length,
    active: list.filter((e) => e.status === 'active').length,
    pending_validation: list.filter((e) => e.status === 'pending_validation').length,
    archived: list.filter((e) => e.status === 'archived').length,
    disabled: list.filter((e) => e.status === 'disabled').length,
  }
})

const filteredEmployees = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  let list = employees.value || []
  if (filterRole.value !== 'all') list = list.filter((e) => e.role === filterRole.value)
  if (filterStatus.value !== 'all') list = list.filter((e) => e.status === filterStatus.value)
  if (filterTeam.value) list = list.filter((e) => e.team_id === filterTeam.value)
  if (!q) return list
  return list.filter(
    (e) => (e.full_name || '').toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q)
  )
})

// Colonnes triables par l'en-tête
const SORTABLE_COLUMNS = [
  { key: 'name', label: 'Nom complet' },
  { key: 'email', label: 'Email' },
  { key: 'team', label: 'Équipe' },
  { key: 'role', label: 'Rôle' },
  { key: 'status', label: 'Statut' },
  { key: 'time', label: 'Horaires attendus' },
]

const SORT_ACCESSORS = {
  name: (e) => e.full_name || '',
  email: (e) => e.email || '',
  team: (e) => e.teams?.name || '',
  role: (e) => e.role || '',
  status: (e) => e.status || 'active',
  time: (e) => (e.expected_arrival_time || '') + (e.expected_departure_time || ''),
}

const sortKey = ref('name')
const sortDir = ref('asc')

const sortedEmployees = computed(() => {
  const list = [...(filteredEmployees.value || [])]
  const accessor = SORT_ACCESSORS[sortKey.value] || SORT_ACCESSORS.name
  const dir = sortDir.value === 'asc' ? 1 : -1
  return list.sort((a, b) => {
    const va = accessor(a)
    const vb = accessor(b)
    const aMissing = va === null || va === undefined || va === ''
    const bMissing = vb === null || vb === undefined || vb === ''
    if (aMissing && bMissing) return 0
    if (aMissing) return 1
    if (bMissing) return -1
    return String(va).localeCompare(String(vb), 'fr', { numeric: true, sensitivity: 'base' }) * dir
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

const sortIconPath = (key) => {
  if (sortKey.value !== key) return 'M8 9l4-4 4 4M16 15l-4-4-4 4'
  return sortDir.value === 'asc' ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7'
}

const emptyState = computed(() => {
  if (!(employees.value || []).length) {
    return {
      title: 'Aucun membre d’équipe',
      message: 'Aucune personne enregistrée pour le moment. Les profils apparaîtront ici après leur inscription.',
      icon: 'users',
      action: null,
      actionLabel: '',
    }
  }
  if (searchQuery.value.trim()) {
    return {
      title: 'Aucun résultat',
      message: `Aucun membre ne correspond à « ${searchQuery.value.trim()} ».`,
      icon: 'search',
      action: 'clear-search',
      actionLabel: 'Effacer la recherche',
    }
  }
  return {
    title: 'Aucun membre pour ce filtre',
    message: 'Aucune personne ne correspond au rôle, statut ou à l’équipe sélectionnés.',
    icon: 'filter',
    action: 'show-all',
    actionLabel: 'Voir toute l’équipe',
  }
})

const runEmptyAction = () => {
  if (emptyState.value.action === 'clear-search') searchQuery.value = ''
  else if (emptyState.value.action === 'show-all') {
    filterRole.value = 'all'
    filterStatus.value = 'all'
    filterTeam.value = ''
  }
}

const initials = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}

const roleLabel = (role) => ({ employee: 'Employé', manager: 'Manager', admin: 'Administrateur' }[role] || role)

const roleClass = (role) => ({
  'badge-error text-error-content': role === 'admin',
  'badge-primary text-primary-content': role === 'manager',
  'badge-soft': role === 'employee',
})

const statusLabel = (status) => ({
  active: 'Actif',
  pending_validation: 'En attente',
  archived: 'Archivé',
  disabled: 'Désactivé',
}[status || 'active'] || status)

const statusClass = (status) => ({
  active: 'badge-success text-success-content',
  pending_validation: 'badge-warning text-warning-content',
  archived: 'badge-warning text-warning-content',
  disabled: 'badge-neutral text-base-content/60',
}[status || 'active'] || 'badge-soft')

const getPendingDaysRemaining = (createdAt) => {
  if (!createdAt) return 7
  try {
    const created = new Date(createdAt).getTime()
    const expiry = created + 7 * 24 * 60 * 60 * 1000
    return Math.max(0, Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000)))
  } catch {
    return 7
  }
}

const getArchivedDaysRemaining = (archivedAt) => {
  if (!archivedAt) return 30
  try {
    const archived = new Date(archivedAt).getTime()
    const expiry = archived + 30 * 24 * 60 * 60 * 1000
    return Math.max(0, Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000)))
  } catch {
    return 30
  }
}

// Modal d'édition
const editingEmployee = ref(null)
const editForm = ref({
  full_name: '',
  role: 'employee',
  team_id: '',
  expected_arrival_time: '09:00:00',
  expected_departure_time: '18:00:00',
})
const isSaving = ref(false)
const editError = ref('')

const openEditModal = (emp) => {
  editingEmployee.value = emp
  editError.value = ''
  editForm.value = {
    full_name: emp.full_name || '',
    role: emp.role || 'employee',
    team_id: emp.team_id || '',
    expected_arrival_time: emp.expected_arrival_time || '09:00:00',
    expected_departure_time: emp.expected_departure_time || '18:00:00',
  }
}

const saveEmployee = async () => {
  if (!editingEmployee.value) return
  isSaving.value = true
  editError.value = ''

  try {
    const now = new Date().toISOString()
    const id = editingEmployee.value.id
    const payload = {
      id,
      full_name: editForm.value.full_name,
      role: editForm.value.role,
      team_id: editForm.value.team_id || null,
      expected_arrival_time: editForm.value.expected_arrival_time,
      expected_departure_time: editForm.value.expected_departure_time,
      updated_at: now,
    }
    const clientMutationId = generateUUIDv7()

    await db.transaction('rw', db.profiles, db.sync_outbox, async () => {
      await db.profiles.update(id, payload)
      await db.sync_outbox.add({
        client_mutation_id: clientMutationId,
        table_name: 'profiles',
        record_id: id,
        operation: 'UPDATE',
        payload,
        created_at: now,
        attempts: 0,
        status: 'pending',
      })
    })

    success('Profil mis à jour avec succès.')
    editingEmployee.value = null
    await refreshPendingCount()
    if (user.value?.id) {
      syncNow(user.value.id)
    }
  } catch (err) {
    editError.value = err.message || 'Mise à jour impossible.'
    toastError(`Erreur de mise à jour : ${err.message}`)
  } finally {
    isSaving.value = false
  }
}

// Action : Valider un compte en attente
const employeeToValidate = ref(null)
const isValidating = ref(false)

const requestValidate = (emp) => {
  employeeToValidate.value = emp
}

const confirmValidate = async () => {
  if (!employeeToValidate.value) return
  isValidating.value = true
  const target = employeeToValidate.value
  const now = new Date().toISOString()
  const clientMutationId = generateUUIDv7()

  try {
    const payload = {
      id: target.id,
      status: 'active',
      is_active: true,
      confirmed_at: now,
      updated_at: now,
    }

    await db.transaction('rw', db.profiles, db.sync_outbox, async () => {
      await db.profiles.update(target.id, payload)
      await db.sync_outbox.add({
        client_mutation_id: clientMutationId,
        table_name: 'profiles',
        record_id: target.id,
        operation: 'UPDATE',
        payload,
        created_at: now,
        attempts: 0,
        status: 'pending',
      })
    })

    success(`Le compte de « ${target.full_name} » a été validé.`)
    employeeToValidate.value = null
    await refreshPendingCount()
    if (user.value?.id) {
      syncNow(user.value.id)
    }
  } catch (err) {
    toastError(`Erreur de validation : ${err.message}`)
  } finally {
    isValidating.value = false
  }
}

// Action : Archiver un compte actif (délai de 30 jours)
const employeeToArchive = ref(null)
const isArchiving = ref(false)

const requestArchive = (emp) => {
  employeeToArchive.value = emp
}

const confirmArchive = async () => {
  if (!employeeToArchive.value) return
  isArchiving.value = true
  const target = employeeToArchive.value
  const now = new Date().toISOString()
  const clientMutationId = generateUUIDv7()

  try {
    const payload = {
      id: target.id,
      status: 'archived',
      archived_at: now,
      updated_at: now,
    }

    await db.transaction('rw', db.profiles, db.sync_outbox, async () => {
      await db.profiles.update(target.id, payload)
      await db.sync_outbox.add({
        client_mutation_id: clientMutationId,
        table_name: 'profiles',
        record_id: target.id,
        operation: 'UPDATE',
        payload,
        created_at: now,
        attempts: 0,
        status: 'pending',
      })
    })

    success(`Le compte de « ${target.full_name} » a été archivé (période de rétractation de 30 jours).`)
    employeeToArchive.value = null
    await refreshPendingCount()
    if (user.value?.id) {
      syncNow(user.value.id)
    }
  } catch (err) {
    toastError(`Erreur : ${err.message}`)
  } finally {
    isArchiving.value = false
  }
}

// Action : Désarchiver / Réactiver un compte
const employeeToUnarchive = ref(null)
const isUnarchiving = ref(false)

const requestUnarchive = (emp) => {
  employeeToUnarchive.value = emp
}

const confirmUnarchive = async () => {
  if (!employeeToUnarchive.value) return
  isUnarchiving.value = true
  const target = employeeToUnarchive.value
  const now = new Date().toISOString()
  const clientMutationId = generateUUIDv7()

  try {
    const payload = {
      id: target.id,
      status: 'active',
      is_active: true,
      archived_at: null,
      updated_at: now,
    }

    await db.transaction('rw', db.profiles, db.sync_outbox, async () => {
      await db.profiles.update(target.id, payload)
      await db.sync_outbox.add({
        client_mutation_id: clientMutationId,
        table_name: 'profiles',
        record_id: target.id,
        operation: 'UPDATE',
        payload,
        created_at: now,
        attempts: 0,
        status: 'pending',
      })
    })

    success(`Le compte de « ${target.full_name} » a été restauré en statut actif.`)
    employeeToUnarchive.value = null
    await refreshPendingCount()
    if (user.value?.id) {
      syncNow(user.value.id)
    }
  } catch (err) {
    toastError(`Erreur : ${err.message}`)
  } finally {
    isUnarchiving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <ManagerPageHeader
      title="Membres de l'équipe"
      subtitle="Rôles, statuts de compte et heures d'arrivée"
    >
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      </template>
    </ManagerPageHeader>

    <!-- Filtres par statut et rôle -->
    <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 flex flex-col gap-3.5">
      <!-- Filtres rapides par statut de compte -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-bold text-base-content/60 uppercase tracking-wide mr-1">Statut :</span>
        <button
          type="button"
          class="btn rounded-m3-sm font-semibold min-h-11 px-3"
          :class="filterStatus === 'all' ? 'btn-primary' : 'btn-ghost'"
          @click="filterStatus = 'all'"
        >
          Tous ({{ statusCounts.all }})
        </button>
        <button
          type="button"
          class="btn rounded-m3-sm font-semibold min-h-11 px-3 gap-1.5"
          :class="filterStatus === 'active' ? 'btn-primary' : 'btn-ghost'"
          @click="filterStatus = 'active'"
        >
          <span>Actifs ({{ statusCounts.active }})</span>
        </button>
        <button
          type="button"
          class="btn rounded-m3-sm font-semibold min-h-11 px-3 gap-1.5"
          :class="filterStatus === 'pending_validation' ? 'btn-primary' : 'btn-ghost'"
          @click="filterStatus = 'pending_validation'"
        >
          <span>En attente ({{ statusCounts.pending_validation }})</span>
          <span v-if="statusCounts.pending_validation > 0" class="badge badge-warning badge-xs"></span>
        </button>
        <button
          type="button"
          class="btn rounded-m3-sm font-semibold min-h-11 px-3"
          :class="filterStatus === 'archived' ? 'btn-primary' : 'btn-ghost'"
          @click="filterStatus = 'archived'"
        >
          Archivés ({{ statusCounts.archived }})
        </button>
        <button
          v-if="statusCounts.disabled > 0"
          type="button"
          class="btn rounded-m3-sm font-semibold min-h-11 px-3"
          :class="filterStatus === 'disabled' ? 'btn-primary' : 'btn-ghost'"
          @click="filterStatus = 'disabled'"
        >
          Désactivés ({{ statusCounts.disabled }})
        </button>
      </div>

      <!-- Filtres secondaires : rôle, recherche, équipe -->
      <div class="flex flex-col sm:flex-row sm:items-end gap-3 pt-2.5 border-t border-base-300/60">
        <label class="input input-bordered flex w-full items-center gap-2 rounded-m3-md bg-base-300/50 min-h-11 flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input v-model="searchQuery" type="text" class="grow text-sm" placeholder="Rechercher par nom ou email" />
        </label>

        <fieldset class="fieldset sm:w-48">
          <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Rôle</legend>
          <select v-model="filterRole" class="select select-bordered min-h-11 w-full rounded-m3-md text-sm">
            <option value="all">Tous les rôles</option>
            <option value="employee">Employés ({{ roleCounts.employee }})</option>
            <option value="manager">Managers ({{ roleCounts.manager }})</option>
            <option value="admin">Administrateurs ({{ roleCounts.admin }})</option>
          </select>
        </fieldset>

        <fieldset class="fieldset sm:w-56">
          <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Équipe</legend>
          <select v-model="filterTeam" class="select select-bordered min-h-11 w-full rounded-m3-md text-sm">
            <option value="">Toutes les équipes</option>
            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </fieldset>
      </div>
    </div>

    <!-- Skeleton de chargement anti-FOUC -->
    <div v-if="isLoading" class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-5 animate-pulse flex flex-col gap-4" aria-busy="true" aria-label="Chargement des collaborateurs">
      <div v-for="i in 4" :key="i" class="flex items-center justify-between py-2 border-b border-base-300/40 last:border-b-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-base-300 skeleton"></div>
          <div class="flex flex-col gap-1.5">
            <div class="h-4 bg-base-300 rounded-m3-xs w-36 skeleton"></div>
            <div class="h-3 bg-base-300 rounded-m3-xs w-24 skeleton"></div>
          </div>
        </div>
        <div class="h-6 bg-base-300 rounded-m3-xs w-20 skeleton"></div>
      </div>
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
      <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg overflow-hidden">
        <!-- Fiches personne sous 640px -->
        <ul class="sm:hidden divide-y divide-base-300">
          <li v-for="emp in sortedEmployees" :key="emp.id" class="p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between gap-3 min-w-0">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0" aria-hidden="true">
                  {{ initials(emp.full_name) }}
                </div>
                <div class="min-w-0">
                  <strong class="block text-sm font-bold text-base-content truncate">{{ emp.full_name }}</strong>
                  <span class="block text-xs text-base-content/60 truncate">{{ emp.email }}</span>
                </div>
              </div>

              <!-- Badge de statut -->
              <span class="badge badge-sm font-semibold rounded-m3-xs shrink-0" :class="statusClass(emp.status)">
                {{ statusLabel(emp.status) }}
              </span>
            </div>

            <!-- Détails et avertissement de délai -->
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-sm font-semibold capitalize rounded-m3-xs" :class="roleClass(emp.role)">{{ roleLabel(emp.role) }}</span>
              <span class="badge badge-soft badge-sm rounded-m3-xs">{{ emp.teams?.name || 'Non assigné' }}</span>
              <span class="font-mono text-xs font-semibold text-base-content/80">
                Arrivée {{ emp.expected_arrival_time?.slice(0, 5) || '—' }} - Départ {{ emp.expected_departure_time?.slice(0, 5) || '—' }}
              </span>
            </div>

            <!-- Avertissements d'échéances -->
            <div v-if="emp.status === 'pending_validation'" class="text-xs text-warning bg-warning/10 rounded-m3-xs p-2 flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Suppression automatique dans {{ getPendingDaysRemaining(emp.created_at) }} jour{{ getPendingDaysRemaining(emp.created_at) > 1 ? 's' : '' }} sans validation.</span>
            </div>

            <div v-else-if="emp.status === 'archived'" class="text-xs text-base-content/70 bg-base-300/60 rounded-m3-xs p-2 flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Désactivation automatique dans {{ getArchivedDaysRemaining(emp.archived_at) }} jour{{ getArchivedDaysRemaining(emp.archived_at) > 1 ? 's' : '' }}. Données conservées.</span>
            </div>

            <!-- Actions contextuelles selon statut -->
            <div class="flex items-center justify-end gap-2 pt-3 border-t border-base-300/60">
              <!-- Si en attente : Valider le compte -->
              <template v-if="emp.status === 'pending_validation'">
                <button
                  type="button"
                  class="btn btn-primary font-bold rounded-m3-sm gap-1.5 min-h-11 px-4"
                  @click="requestValidate(emp)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Valider le compte</span>
                </button>
              </template>

              <!-- Si actif : Modifier & Archiver -->
              <template v-else-if="emp.status === 'active'">
                <button type="button" class="btn btn-secondary btn-outline font-semibold rounded-m3-sm gap-1.5 min-h-11 px-3" @click="openEditModal(emp)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Modifier</span>
                </button>
                <button type="button" class="btn btn-ghost font-semibold text-warning rounded-m3-sm min-h-11 px-3 hover:bg-warning/10" @click="requestArchive(emp)">
                  Archiver
                </button>
              </template>

              <!-- Si archivé : Désarchiver -->
              <template v-else-if="emp.status === 'archived'">
                <button type="button" class="btn btn-outline btn-primary font-semibold rounded-m3-sm min-h-11 px-4 gap-1.5" @click="requestUnarchive(emp)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>Désarchiver</span>
                </button>
              </template>

              <!-- Si désactivé : Réactiver -->
              <template v-else-if="emp.status === 'disabled'">
                <button type="button" class="btn btn-ghost font-semibold text-primary rounded-m3-sm min-h-11 px-3 hover:bg-primary/10" @click="requestUnarchive(emp)">
                  Réactiver
                </button>
              </template>
            </div>
          </li>
        </ul>

        <!-- Tableau complet à partir de 640px -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr class="bg-base-300/40 text-base-content/70">
                <th
                  v-for="col in SORTABLE_COLUMNS"
                  :key="col.key"
                  class="font-bold cursor-pointer select-none hover:text-base-content"
                  :aria-sort="ariaSort(col.key)"
                  @click="toggleSort(col.key)"
                >
                  <div class="flex items-center gap-1.5">
                    <span>{{ col.label }}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path :d="sortIconPath(col.key)"></path>
                    </svg>
                  </div>
                </th>
                <th class="text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in sortedEmployees" :key="emp.id" class="hover:bg-base-300/30">
                <td>
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0" aria-hidden="true">
                      {{ initials(emp.full_name) }}
                    </div>
                    <strong class="font-bold text-base-content">{{ emp.full_name }}</strong>
                  </div>
                </td>
                <td class="font-mono text-xs text-base-content/80">{{ emp.email }}</td>
                <td>
                  <span v-if="emp.teams?.name" class="badge badge-soft badge-sm rounded-m3-xs font-semibold">{{ emp.teams.name }}</span>
                  <span v-else class="text-xs text-base-content/50 italic">Non assigné</span>
                </td>
                <td>
                  <span class="badge badge-sm font-semibold capitalize rounded-m3-xs" :class="roleClass(emp.role)">{{ roleLabel(emp.role) }}</span>
                </td>
                <td>
                  <div class="flex flex-col gap-0.5">
                    <span class="badge badge-sm font-semibold rounded-m3-xs" :class="statusClass(emp.status)">
                      {{ statusLabel(emp.status) }}
                    </span>
                    <span v-if="emp.status === 'pending_validation'" class="text-xs text-warning font-medium">
                      J-{{ getPendingDaysRemaining(emp.created_at) }}
                    </span>
                    <span v-else-if="emp.status === 'archived'" class="text-xs text-base-content/60 font-medium">
                      J-{{ getArchivedDaysRemaining(emp.archived_at) }}
                    </span>
                  </div>
                </td>
                <td class="font-mono text-xs font-semibold text-base-content/80">
                  {{ emp.expected_arrival_time?.slice(0, 5) || '—' }} - {{ emp.expected_departure_time?.slice(0, 5) || '—' }}
                </td>
                <td class="text-right">
                  <div class="inline-flex items-center gap-1.5">
                    <!-- Si en attente : Valider le compte -->
                    <template v-if="emp.status === 'pending_validation'">
                      <button
                        type="button"
                        class="btn btn-primary min-h-11 rounded-m3-sm font-bold px-3 gap-1"
                        @click="requestValidate(emp)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Valider</span>
                      </button>
                    </template>

                    <!-- Si actif : Modifier & Archiver -->
                    <template v-else-if="emp.status === 'active'">
                      <button type="button" class="btn btn-ghost min-h-11 rounded-m3-sm font-semibold px-2.5" @click="openEditModal(emp)">
                        Modifier
                      </button>
                      <button type="button" class="btn btn-ghost min-h-11 rounded-m3-sm font-semibold text-warning px-2.5 hover:bg-warning/10" @click="requestArchive(emp)">
                        Archiver
                      </button>
                    </template>

                    <!-- Si archivé : Désarchiver -->
                    <template v-else-if="emp.status === 'archived'">
                      <button type="button" class="btn btn-outline btn-primary min-h-11 rounded-m3-sm font-semibold px-3 gap-1" @click="requestUnarchive(emp)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span>Désarchiver</span>
                      </button>
                    </template>

                    <!-- Si désactivé : Réactiver -->
                    <template v-else-if="emp.status === 'disabled'">
                      <button type="button" class="btn btn-ghost min-h-11 rounded-m3-sm font-semibold text-primary px-2.5 hover:bg-primary/10" @click="requestUnarchive(emp)">
                        Réactiver
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modal d'édition collaborateur -->
    <dialog class="modal" :class="{ 'modal-open': !!editingEmployee }">
      <div class="modal-box rounded-m3-xl max-w-lg border border-base-300 bg-base-100 p-6 flex flex-col gap-4">
        <h3 class="font-bold text-lg text-base-content">
          Modifier « {{ editingEmployee?.full_name }} »
        </h3>
        <p class="text-xs text-base-content/70">
          Les modifications sont instantanées localement et synchronisées en arrière-plan.
        </p>

        <form v-if="editingEmployee" @submit.prevent="saveEmployee" class="flex flex-col gap-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold text-base-content/80">Nom complet</legend>
            <input
              v-model="editForm.full_name"
              type="text"
              class="input input-bordered w-full rounded-m3-md min-h-11 text-sm"
              required
            />
          </fieldset>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold text-base-content/80">Rôle dans l'application</legend>
              <select v-model="editForm.role" class="select select-bordered w-full rounded-m3-md min-h-11 text-sm">
                <option value="employee">Employé</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrateur</option>
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold text-base-content/80">Équipe affectée</legend>
              <select v-model="editForm.team_id" class="select select-bordered w-full rounded-m3-md min-h-11 text-sm">
                <option value="">Aucune équipe</option>
                <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </fieldset>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold text-base-content/80">Heure d'arrivée habituelle</legend>
              <input
                v-model="editForm.expected_arrival_time"
                type="time"
                step="60"
                class="input input-bordered w-full rounded-m3-md min-h-11 text-sm"
                required
              />
              <span class="fieldset-label text-xs text-base-content/60">Sert de repère pour signaler les arrivées après l'horaire.</span>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold text-base-content/80">Heure de départ habituelle</legend>
              <input
                v-model="editForm.expected_departure_time"
                type="time"
                step="60"
                class="input input-bordered w-full rounded-m3-md min-h-11 text-sm"
                required
              />
              <span class="fieldset-label text-xs text-base-content/60">Sert de repère pour la fin de journée.</span>
            </fieldset>
          </div>

          <div v-if="editError" class="alert alert-error text-xs rounded-m3-md py-2">
            {{ editError }}
          </div>

          <div class="modal-action mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              class="btn btn-ghost rounded-m3-sm min-h-11 px-4 font-semibold"
              :disabled="isSaving"
              @click="editingEmployee = null"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn btn-primary rounded-m3-sm min-h-11 px-5 font-bold shadow-xs flex items-center gap-2"
              :disabled="isSaving"
            >
              <span v-if="isSaving" class="loading loading-spinner loading-xs" aria-hidden="true"></span>
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="editingEmployee = null">
        <button>Fermer</button>
      </form>
    </dialog>

    <!-- Modal de validation de compte -->
    <ConfirmModal
      :open="!!employeeToValidate"
      title="Valider ce collaborateur ?"
      :message="`Le compte de « ${employeeToValidate?.full_name || ''} » sera validé et pourra immédiatement enregistrer ses pointages.`"
      confirm-text="Valider le compte"
      confirm-class="btn-primary"
      :loading="isValidating"
      @confirm="confirmValidate"
      @cancel="employeeToValidate = null"
    />

    <!-- Modal d'archivage temporaire (30 jours) -->
    <ConfirmModal
      :open="!!employeeToArchive"
      title="Archiver ce compte ?"
      :message="`Le compte de « ${employeeToArchive?.full_name || ''} » sera placé en archive temporaire pendant 30 jours. Pendant cette période, vous pourrez le désarchiver à tout moment. Passé ce délai, il sera désactivé mais son historique restera scellé.`"
      confirm-text="Archiver"
      confirm-class="btn-warning text-warning-content"
      :loading="isArchiving"
      @confirm="confirmArchive"
      @cancel="employeeToArchive = null"
    />

    <!-- Modal de désarchivage / réactivation -->
    <ConfirmModal
      :open="!!employeeToUnarchive"
      title="Restaurer ce collaborateur ?"
      :message="`Le compte de « ${employeeToUnarchive?.full_name || ''} » sera immédiatement réactivé et pourra à nouveau pointer ses présences.`"
      confirm-text="Restaurer le compte"
      confirm-class="btn-primary"
      :loading="isUnarchiving"
      @confirm="confirmUnarchive"
      @cancel="employeeToUnarchive = null"
    />
  </div>
</template>
