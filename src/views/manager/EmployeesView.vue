<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import ConfirmModal from '../../components/shared/ConfirmModal.vue'
import ManagerPageHeader from '../../components/manager/ManagerPageHeader.vue'
import ManagerEmptyState from '../../components/manager/ManagerEmptyState.vue'
import { useToast } from '../../composables/useToast'

const employees = ref([])
const teams = ref([])
const loading = ref(true)
const loadError = ref('')

// Recherche et filtres : la liste complète peut être longue, le gestionnaire doit y entrer par le nom.
const searchQuery = ref('')
const filterRole = ref('all') // 'all', 'employee', 'manager', 'admin'
const filterTeam = ref('')

const loadData = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const { data: profs, error: profError } = await supabase
      .from('profiles')
      .select('*, teams(name)')
      .is('deleted_at', null)
      .order('full_name')

    if (profError) throw profError
    employees.value = profs || []

    const { data: tms, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .is('deleted_at', null)
      .order('name')

    if (teamError) throw teamError
    teams.value = tms || []
  } catch (err) {
    loadError.value = err.message || 'Chargement impossible.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
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
    return { title: 'Aucun collaborateur', message: 'Aucun profil actif pour le moment. Les comptes apparaissent ici après leur création.', icon: 'users', action: null, actionLabel: '' }
  }
  if (searchQuery.value.trim()) {
    return { title: 'Aucun résultat', message: `Aucun collaborateur ne correspond à « ${searchQuery.value.trim()} ».`, icon: 'search', action: 'clear-search', actionLabel: 'Effacer la recherche' }
  }
  return { title: 'Aucun collaborateur pour ce filtre', message: 'Aucun profil ne correspond au rôle ou à l\u2019équipe sélectionnés.', icon: 'filter', action: 'show-all', actionLabel: 'Voir tous les collaborateurs' }
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
    full_name: emp.full_name,
    role: emp.role,
    team_id: emp.team_id || '',
    expected_arrival_time: emp.expected_arrival_time || '09:00:00',
  }
}

const { success, error: toastError } = useToast()

const saveEmployee = async () => {
  if (!editingEmployee.value) return
  isSaving.value = true
  editError.value = ''
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.value.full_name,
        role: editForm.value.role,
        team_id: editForm.value.team_id || null,
        expected_arrival_time: editForm.value.expected_arrival_time,
      })
      .eq('id', editingEmployee.value.id)

    if (error) throw error
    success('Profil mis à jour avec succès.')
    editingEmployee.value = null
    await loadData()
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
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', target.id)

    if (error) throw error
    success(`Le collaborateur « ${target.full_name} » a été archivé.`)
    employeeToArchive.value = null
    await loadData()
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

    <!-- Erreur de chargement : le fait, puis l'action qui débloque -->
    <div v-if="loadError" class="alert alert-error rounded-m3-lg flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 min-w-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span class="text-sm truncate">Chargement des profils impossible : {{ loadError }}</span>
      </div>
      <button type="button" class="btn min-h-11 rounded-m3-sm font-semibold" @click="loadData">Réessayer</button>
    </div>

    <!-- Filtres et recherche -->
    <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 flex flex-col gap-3">
      <label class="input input-bordered flex w-full items-center gap-2 rounded-m3-md bg-base-300/50 min-h-11">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input v-model="searchQuery" type="text" class="grow text-sm" placeholder="Rechercher un nom ou un email" />
      </label>

      <div class="flex flex-col sm:flex-row sm:items-end gap-3">
        <fieldset class="fieldset flex-1 min-w-0">
          <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Rôle</legend>
          <div class="join w-full overflow-x-auto sm:w-auto">
            <button type="button" class="btn join-item min-h-11 px-3 shrink-0" :class="{ 'btn-primary': filterRole === 'all' }" @click="filterRole = 'all'">
              Tous ({{ roleCounts.all }})
            </button>
            <button type="button" class="btn join-item min-h-11 px-3 shrink-0" :class="{ 'btn-primary': filterRole === 'employee' }" @click="filterRole = 'employee'">
              Employés ({{ roleCounts.employee }})
            </button>
            <button type="button" class="btn join-item min-h-11 px-3 shrink-0" :class="{ 'btn-primary': filterRole === 'manager' }" @click="filterRole = 'manager'">
              Managers ({{ roleCounts.manager }})
            </button>
            <button type="button" class="btn join-item min-h-11 px-3 shrink-0" :class="{ 'btn-primary': filterRole === 'admin' }" @click="filterRole = 'admin'">
              Admins ({{ roleCounts.admin }})
            </button>
          </div>
        </fieldset>

        <fieldset class="fieldset sm:w-64">
          <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Équipe</legend>
          <select v-model="filterTeam" class="select select-bordered min-h-11 w-full rounded-m3-md text-sm">
            <option value="">Toutes les équipes</option>
            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </fieldset>
      </div>
    </div>

    <!-- Chargement : ossature à la forme du contenu attendu -->
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
              <button type="button" class="btn btn-ghost text-error font-medium rounded-m3-sm gap-1.5 min-h-11 px-3" @click="requestArchive(emp)">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8"></polyline>
                  <rect x="1" y="3" width="22" height="5"></rect>
                  <line x1="10" y1="12" x2="14" y2="12"></line>
                </svg>
                <span>Archiver</span>
              </button>
            </div>
          </li>
        </ul>

        <!-- Tableau triable à partir de 640px -->
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
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" :class="sortKey === col.key ? 'text-primary' : 'text-base-content/30'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path :d="sortIconPath(col.key)"></path>
                    </svg>
                  </button>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in sortedEmployees" :key="emp.id" class="hover">
                <td>
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0" aria-hidden="true">
                      {{ initials(emp.full_name) }}
                    </div>
                    <strong class="text-sm font-bold text-base-content truncate">{{ emp.full_name }}</strong>
                  </div>
                </td>
                <td class="text-xs text-base-content/60">{{ emp.email }}</td>
                <td><span class="badge badge-soft badge-sm rounded-m3-xs">{{ emp.teams?.name || 'Non assigné' }}</span></td>
                <td><span class="badge badge-sm font-semibold rounded-m3-xs" :class="roleClass(emp.role)">{{ roleLabel(emp.role) }}</span></td>
                <td class="font-mono text-xs font-semibold">{{ emp.expected_arrival_time?.slice(0, 5) || '—' }}</td>
                <td>
                  <div class="flex items-center gap-1">
                    <button type="button" class="btn btn-ghost text-primary font-semibold gap-1.5 rounded-m3-sm min-h-11 px-3" @click="openEditModal(emp)">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      <span>Modifier</span>
                    </button>
                    <button type="button" class="btn btn-ghost text-error font-semibold gap-1.5 rounded-m3-sm min-h-11 px-3" @click="requestArchive(emp)">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="21 8 21 21 3 21 3 8"></polyline>
                        <rect x="1" y="3" width="22" height="5"></rect>
                        <line x1="10" y1="12" x2="14" y2="12"></line>
                      </svg>
                      <span>Archiver</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modal d'édition -->
    <dialog class="modal" :class="{ 'modal-open': !!editingEmployee }">
      <div class="modal-box rounded-m3-xl max-w-xl p-5 sm:p-6 bg-base-100 border border-base-300 shadow-sm">
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-base-200">
          <h3 class="font-black text-xl text-base-content flex items-center gap-2">
            <div class="w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <span>Modifier le collaborateur</span>
          </h3>
          <button type="button" class="btn btn-circle btn-ghost min-w-11 min-h-11" aria-label="Fermer la modale" @click="editingEmployee = null">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <p class="text-xs text-base-content/60 mb-4">{{ editingEmployee?.email }}</p>

        <div v-if="editError" class="alert alert-error text-xs py-2.5 rounded-m3-md mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ editError }}</span>
        </div>

        <form class="flex flex-col gap-5" @submit.prevent="saveEmployee">
          <div class="form-control">
            <label for="f-name" class="label py-1"><span class="label-text font-bold text-sm">Nom complet</span></label>
            <input id="f-name" v-model="editForm.full_name" type="text" class="input input-bordered w-full min-h-11 rounded-m3-md text-sm" />
          </div>

          <div class="form-control">
            <label for="f-role" class="label py-1"><span class="label-text font-bold text-sm">Rôle d'accès</span></label>
            <select id="f-role" v-model="editForm.role" class="select select-bordered w-full min-h-11 rounded-m3-md text-sm">
              <option value="employee">Employé</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <div class="form-control">
            <label for="f-team" class="label py-1"><span class="label-text font-bold text-sm">Équipe de rattachement</span></label>
            <select id="f-team" v-model="editForm.team_id" class="select select-bordered w-full min-h-11 rounded-m3-md text-sm">
              <option value="">Aucune équipe</option>
              <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>

          <div class="form-control">
            <label for="f-time" class="label py-1"><span class="label-text font-bold text-sm">Heure d'arrivée attendue</span></label>
            <input id="f-time" v-model="editForm.expected_arrival_time" type="time" class="input input-bordered w-full min-h-11 rounded-m3-md text-sm" />
          </div>

          <div class="modal-action mt-2 pt-4 border-t border-base-200 gap-2">
            <button type="button" class="btn btn-ghost min-h-11 rounded-m3-sm font-medium px-5 active:scale-95 transition-transform duration-150" :disabled="isSaving" @click="editingEmployee = null">Annuler</button>
            <button type="submit" class="btn btn-primary min-h-11 rounded-m3-sm font-bold shadow-xs flex-1 active:scale-95 transition-transform duration-150" :disabled="isSaving">
              <span v-if="isSaving" class="loading loading-spinner loading-xs"></span>
              <span v-else>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-xs" @click="editingEmployee = null">
        <button>close</button>
      </form>
    </dialog>

    <!-- Modale de confirmation d'archivage collaborateur -->
    <ConfirmModal
      :open="!!employeeToArchive"
      title="Archiver le collaborateur"
      :message="`Confirmez-vous l'archivage de « ${employeeToArchive?.full_name} » ? Ses accès seront suspendus.`"
      confirm-text="Archiver"
      confirm-class="btn-error"
      :loading="isArchiving"
      @confirm="confirmArchive"
      @cancel="employeeToArchive = null"
    />
  </div>
</template>
