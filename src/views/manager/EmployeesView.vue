<script setup>
import { ref, computed } from 'vue'
import { db, useLiveQuery } from '../../lib/db'
import { generateUUIDv7 } from '../../lib/uuidv7'
import { useAuth } from '../../composables/useAuth'
import { useSyncEngine } from '../../composables/useSyncEngine'
import ConfirmModal from '../../components/shared/ConfirmModal.vue'
import ManagerPageHeader from '../../components/manager/ManagerPageHeader.vue'
import ManagerEmptyState from '../../components/manager/ManagerEmptyState.vue'
import { useToast } from '../../composables/useToast'

const { user } = useAuth()
const { refreshPendingCount, syncNow } = useSyncEngine()
const { success, error: toastError } = useToast()

// Lectures réactives Local-First depuis Dexie (sans latence réseau)
const rawEmployees = useLiveQuery(async () => {
  return await db.profiles
    .filter((p) => !p.deleted_at)
    .toArray()
}, [])

const rawTeams = useLiveQuery(async () => {
  return await db.teams
    .filter((t) => !t.deleted_at)
    .toArray()
}, [])

// Recherche et filtres : la liste complète peut être longue, le gestionnaire doit y entrer par le nom.
const searchQuery = ref('')
const filterRole = ref('all') // 'all', 'employee', 'manager', 'admin'
const filterTeam = ref('')

// Jointure locale réactive entre profils et équipes
const employees = computed(() => {
  const teamsMap = new Map((rawTeams.value || []).map((t) => [t.id, t]))
  return (rawEmployees.value || [])
    .map((emp) => ({
      ...emp,
      teams: teamsMap.get(emp.team_id) || null,
    }))
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'fr'))
})

const teams = computed(() => {
  return (rawTeams.value || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fr'))
})

// Comptes par rôle : les filtres annoncent ce qu'ils contiennent avant qu'on les ouvre.
const roleCounts = computed(() => {
  const list = employees.value || []
  return {
    all: list.length,
    employee: list.filter((e) => e.role === 'employee').length,
    manager: list.filter((e) => e.role === 'manager').length,
    admin: list.filter((e) => e.role === 'admin').length,
  }
})

const filteredEmployees = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  let list = employees.value || []
  if (filterRole.value !== 'all') list = list.filter((e) => e.role === filterRole.value)
  if (filterTeam.value) list = list.filter((e) => e.team_id === filterTeam.value)
  if (!q) return list
  return list.filter(
    (e) => (e.full_name || '').toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q)
  )
})

// Colonnes triables par l'en-tête.
const SORTABLE_COLUMNS = [
  { key: 'name', label: 'Nom complet' },
  { key: 'email', label: 'Email' },
  { key: 'team', label: 'Équipe' },
  { key: 'role', label: 'Rôle' },
  { key: 'time', label: 'Heure attendue' },
]

const SORT_ACCESSORS = {
  name: (e) => e.full_name || '',
  email: (e) => e.email || '',
  team: (e) => e.teams?.name || '',
  role: (e) => e.role || '',
  time: (e) => e.expected_arrival_time || '',
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
      title: 'Aucun collaborateur',
      message: 'Aucun profil actif pour le moment. Les comptes apparaissent ici après leur création.',
      icon: 'users',
      action: null,
      actionLabel: '',
    }
  }
  if (searchQuery.value.trim()) {
    return {
      title: 'Aucun résultat',
      message: `Aucun collaborateur ne correspond à « ${searchQuery.value.trim()} ».`,
      icon: 'search',
      action: 'clear-search',
      actionLabel: 'Effacer la recherche',
    }
  }
  return {
    title: 'Aucun collaborateur pour ce filtre',
    message: 'Aucun profil ne correspond au rôle ou à l\u2019équipe sélectionnés.',
    icon: 'filter',
    action: 'show-all',
    actionLabel: 'Voir tous les collaborateurs',
  }
})

const runEmptyAction = () => {
  if (emptyState.value.action === 'clear-search') searchQuery.value = ''
  else if (emptyState.value.action === 'show-all') {
    filterRole.value = 'all'
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

// Modal d'édition
const editingEmployee = ref(null)
const editForm = ref({
  full_name: '',
  role: 'employee',
  team_id: '',
  expected_arrival_time: '09:00:00',
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
      deleted_at: now,
      is_active: false,
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

    success(`Le collaborateur « ${target.full_name} » a été archivé.`)
    employeeToArchive.value = null
    await refreshPendingCount()
    if (user.value?.id) {
      syncNow(user.value.id)
    }
  } catch (err) {
    toastError(`Erreur d'archivage : ${err.message}`)
  } finally {
    isArchiving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <ManagerPageHeader
      title="Gestion des Collaborateurs"
      subtitle="Affectation d'équipes, horaires attendus et rôles d'accès"
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

    <!-- Filtres -->
    <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 flex flex-col gap-3">
      <!-- Filtres rapides par rôle -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-sm rounded-m3-sm font-semibold min-h-11 px-3"
          :class="filterRole === 'all' ? 'btn-primary' : 'btn-ghost'"
          @click="filterRole = 'all'"
        >
          Tous ({{ roleCounts.all }})
        </button>
        <button
          type="button"
          class="btn btn-sm rounded-m3-sm font-semibold min-h-11 px-3"
          :class="filterRole === 'employee' ? 'btn-primary' : 'btn-ghost'"
          @click="filterRole = 'employee'"
        >
          Employés ({{ roleCounts.employee }})
        </button>
        <button
          type="button"
          class="btn btn-sm rounded-m3-sm font-semibold min-h-11 px-3"
          :class="filterRole === 'manager' ? 'btn-primary' : 'btn-ghost'"
          @click="filterRole = 'manager'"
        >
          Managers ({{ roleCounts.manager }})
        </button>
        <button
          type="button"
          class="btn btn-sm rounded-m3-sm font-semibold min-h-11 px-3"
          :class="filterRole === 'admin' ? 'btn-primary' : 'btn-ghost'"
          @click="filterRole = 'admin'"
        >
          Administrateurs ({{ roleCounts.admin }})
        </button>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-end gap-3 pt-2 border-t border-base-300/60">
        <label class="input input-bordered flex w-full items-center gap-2 rounded-m3-md bg-base-300/50 min-h-11 flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input v-model="searchQuery" type="text" class="grow text-sm" placeholder="Rechercher par nom ou email" />
        </label>

        <fieldset class="fieldset sm:w-64">
          <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Équipe</legend>
          <select v-model="filterTeam" class="select select-bordered min-h-11 w-full rounded-m3-md text-sm">
            <option value="">Toutes les équipes</option>
            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </fieldset>
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
      <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg overflow-hidden">
        <!-- Fiches personne sous 640px -->
        <ul class="sm:hidden divide-y divide-base-300">
          <li v-for="emp in sortedEmployees" :key="emp.id" class="p-4 flex flex-col gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0" aria-hidden="true">
                {{ initials(emp.full_name) }}
              </div>
              <div class="min-w-0">
                <strong class="block text-sm font-bold text-base-content truncate">{{ emp.full_name }}</strong>
                <span class="block text-xs text-base-content/60 truncate">{{ emp.email }}</span>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-sm font-semibold capitalize rounded-m3-xs" :class="roleClass(emp.role)">{{ roleLabel(emp.role) }}</span>
              <span class="badge badge-soft badge-sm rounded-m3-xs">{{ emp.teams?.name || 'Non assigné' }}</span>
              <span class="font-mono text-xs font-semibold text-base-content/80">Arrivée {{ emp.expected_arrival_time?.slice(0, 5) || '—' }}</span>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-base-300/60">
              <button type="button" class="btn btn-secondary btn-outline font-semibold rounded-m3-sm gap-1.5 min-h-11 px-3" @click="openEditModal(emp)">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Modifier</span>
              </button>
              <button type="button" class="btn btn-ghost font-semibold text-error rounded-m3-sm min-h-11 px-3 hover:bg-error/10" @click="requestArchive(emp)">
                Archiver
              </button>
            </div>
          </li>
        </ul>

        <!-- Tableau complet à partir de 640px -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="table table-zebra table-sm">
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
                <td class="font-mono text-xs font-semibold text-base-content/80">
                  {{ emp.expected_arrival_time?.slice(0, 5) || '—' }}
                </td>
                <td class="text-right">
                  <div class="inline-flex items-center gap-1">
                    <button type="button" class="btn btn-ghost btn-sm min-h-11 rounded-m3-sm font-semibold px-2.5" @click="openEditModal(emp)">
                      Modifier
                    </button>
                    <button type="button" class="btn btn-ghost btn-sm min-h-11 rounded-m3-sm font-semibold text-error px-2.5 hover:bg-error/10" @click="requestArchive(emp)">
                      Archiver
                    </button>
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

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold text-base-content/80">Heure d'arrivée attendue</legend>
            <input
              v-model="editForm.expected_arrival_time"
              type="time"
              step="60"
              class="input input-bordered w-full rounded-m3-md min-h-11 text-sm"
              required
            />
            <span class="fieldset-label text-xs text-base-content/60">Utilisée pour qualifier les retards lors des pointages.</span>
          </fieldset>

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
              <span v-if="isSaving" class="loading loading-spinner loading-xs"></span>
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="editingEmployee = null">
        <button>Fermer</button>
      </form>
    </dialog>

    <!-- Modal de confirmation d'archivage -->
    <ConfirmModal
      :open="!!employeeToArchive"
      title="Archiver ce collaborateur ?"
      :message="`Le collaborateur « ${employeeToArchive?.full_name || ''} » ne pourra plus se connecter ni pointer. Son historique de présence sera conservé.`"
      confirm-label="Archiver le collaborateur"
      confirm-variant="error"
      :loading="isArchiving"
      @confirm="confirmArchive"
      @cancel="employeeToArchive = null"
    />
  </div>
</template>
