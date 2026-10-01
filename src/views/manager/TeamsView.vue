<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import ConfirmModal from '../../components/shared/ConfirmModal.vue'
import ManagerPageHeader from '../../components/manager/ManagerPageHeader.vue'
import ManagerEmptyState from '../../components/manager/ManagerEmptyState.vue'
import { useToast } from '../../composables/useToast'

const teams = ref([])
const loading = ref(true)
const loadError = ref('')

const searchQuery = ref('')
const sortBy = ref('name') // 'name' | 'members'

const { success, error: toastError } = useToast()

const loadTeams = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*, profiles(id, full_name, email)')
      .is('deleted_at', null)
      .order('name')

    if (error) throw error
    teams.value = data || []
  } catch (err) {
    loadError.value = err.message || 'Chargement impossible.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTeams()
})

const sortedTeams = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const list = (teams.value || []).filter((t) => !q || (t.name || '').toLowerCase().includes(q))
  return [...list].sort((a, b) => {
    if (sortBy.value === 'members') {
      return (b.profiles?.length || 0) - (a.profiles?.length || 0)
    }
    return (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
  })
})

const emptyState = computed(() => {
  if (!(teams.value || []).length) {
    return { title: 'Aucune équipe', message: 'Créez votre première équipe pour regrouper les collaborateurs par pôle.', icon: 'team', action: 'create', actionLabel: 'Créer une équipe' }
  }
  return { title: 'Aucun résultat', message: `Aucune équipe ne correspond à « ${searchQuery.value.trim()} ».`, icon: 'search', action: 'clear-search', actionLabel: 'Effacer la recherche' }
})

const runEmptyAction = () => {
  if (emptyState.value.action === 'create') openCreateModal()
  else if (emptyState.value.action === 'clear-search') searchQuery.value = ''
}

const initials = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}

// Création et renommage partagent la même modale : `editingTeam` distingue les deux.
const isModalOpen = ref(false)
const editingTeam = ref(null)
const formName = ref('')
const isSaving = ref(false)
const formError = ref('')

const openCreateModal = () => {
  editingTeam.value = null
  formName.value = ''
  formError.value = ''
  isModalOpen.value = true
}

const openRenameModal = (team) => {
  editingTeam.value = team
  formName.value = team.name
  formError.value = ''
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingTeam.value = null
}

const saveTeam = async () => {
  const name = formName.value.trim()
  if (!name) {
    formError.value = 'Un nom d\u2019équipe est requis.'
    return
  }
  isSaving.value = true
  formError.value = ''
  try {
    if (editingTeam.value) {
      const { error } = await supabase.from('teams').update({ name }).eq('id', editingTeam.value.id)
      if (error) throw error
      success(`L'équipe « ${name} » a été renommée.`)
    } else {
      const { error } = await supabase.from('teams').insert({ name })
      if (error) throw error
      success(`L'équipe « ${name} » a été créée.`)
    }
    closeModal()
    await loadTeams()
  } catch (err) {
    formError.value = err.message || 'Enregistrement impossible.'
    toastError(`Erreur : ${err.message}`)
  } finally {
    isSaving.value = false
  }
}

const teamToArchive = ref(null)
const isArchiving = ref(false)

const requestArchive = (team) => {
  teamToArchive.value = team
}

const confirmArchive = async () => {
  if (!teamToArchive.value) return
  isArchiving.value = true
  const target = teamToArchive.value
  try {
    const { error } = await supabase
      .from('teams')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', target.id)
    if (error) throw error
    success(`L'équipe « ${target.name} » a été désactivée.`)
    teamToArchive.value = null
    await loadTeams()
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
      title="Gestion des Équipes"
      subtitle="Structurez vos pôles et regroupez vos collaborateurs"
    >
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
          <line x1="9" y1="22" x2="9" y2="2"></line>
          <line x1="15" y1="22" x2="15" y2="2"></line>
          <line x1="4" y1="12" x2="20" y2="12"></line>
        </svg>
      </template>

      <template #actions>
        <button
          type="button"
          class="btn btn-primary rounded-m3-sm font-bold shadow-xs min-h-11 flex items-center justify-center gap-2 w-full sm:w-auto active:scale-95 transition-transform duration-150"
          @click="openCreateModal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          <span>Nouvelle équipe</span>
        </button>
      </template>
    </ManagerPageHeader>

    <!-- Erreur de chargement -->
    <div v-if="loadError" class="alert alert-error rounded-m3-lg flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 min-w-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span class="text-sm truncate">Chargement des équipes impossible : {{ loadError }}</span>
      </div>
      <button type="button" class="btn min-h-11 rounded-m3-sm font-semibold" @click="loadTeams">Réessayer</button>
    </div>

    <!-- Filtres -->
    <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 flex flex-col sm:flex-row sm:items-end gap-3">
      <label class="input input-bordered flex w-full items-center gap-2 rounded-m3-md bg-base-300/50 min-h-11 flex-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input v-model="searchQuery" type="text" class="grow text-sm" placeholder="Rechercher une équipe par nom" />
      </label>

      <fieldset class="fieldset sm:w-56">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Trier par</legend>
        <select v-model="sortBy" class="select select-bordered min-h-11 w-full rounded-m3-md text-sm">
          <option value="name">Nom</option>
          <option value="members">Effectif</option>
        </select>
      </fieldset>
    </div>

    <!-- Chargement : ossature -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="n in 3" :key="n" class="h-40 rounded-m3-lg bg-base-300/60 animate-pulse"></div>
    </div>

    <ManagerEmptyState
      v-else-if="!sortedTeams.length"
      :icon="emptyState.icon"
      :title="emptyState.title"
      :message="emptyState.message"
      :action-label="emptyState.actionLabel"
      @action="runEmptyAction"
    />

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="team in sortedTeams"
        :key="team.id"
        class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-5 flex flex-col gap-3"
      >
        <div class="flex items-center justify-between gap-2 border-b border-base-300/60 pb-3">
          <div class="flex items-center gap-2 min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
              <line x1="9" y1="22" x2="9" y2="2"></line>
              <line x1="15" y1="22" x2="15" y2="2"></line>
              <line x1="4" y1="12" x2="20" y2="12"></line>
            </svg>
            <h3 class="font-bold text-base text-base-content truncate">{{ team.name }}</h3>
          </div>
          <span class="badge badge-soft badge-sm font-semibold shrink-0">{{ team.profiles?.length || 0 }} membre{{ (team.profiles?.length || 0) > 1 ? 's' : '' }}</span>
        </div>

        <div class="flex-1">
          <div v-if="team.profiles?.length" class="flex flex-wrap gap-1.5">
            <span v-for="m in team.profiles" :key="m.id" class="badge badge-soft badge-sm text-xs rounded-m3-xs gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-base-content/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>{{ m.full_name }}</span>
            </span>
          </div>
          <p v-else class="text-xs text-base-content/50 italic">Aucun membre assigné. Affectez-en depuis la Gestion des Collaborateurs.</p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-base-300/60">
          <button type="button" class="btn btn-ghost text-primary font-semibold rounded-m3-sm gap-1.5 min-h-11 px-3" @click="openRenameModal(team)">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Renommer</span>
          </button>
          <button type="button" class="btn btn-ghost text-error font-medium rounded-m3-sm gap-1.5 min-h-11 px-3" @click="requestArchive(team)">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Désactiver</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modale de création / renommage -->
    <dialog class="modal" :class="{ 'modal-open': isModalOpen }">
      <div class="modal-box rounded-m3-xl max-w-md p-5 sm:p-6 bg-base-100 border border-base-300 shadow-sm">
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-base-200">
          <h3 class="font-black text-xl text-base-content flex items-center gap-2">
            <div class="w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                <line x1="9" y1="22" x2="9" y2="2"></line>
                <line x1="15" y1="22" x2="15" y2="2"></line>
                <line x1="4" y1="12" x2="20" y2="12"></line>
              </svg>
            </div>
            <span>{{ editingTeam ? 'Renommer l\u2019équipe' : 'Nouvelle équipe' }}</span>
          </h3>
          <button type="button" class="btn btn-circle btn-ghost min-w-11 min-h-11" aria-label="Fermer la modale" @click="closeModal">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div v-if="formError" class="alert alert-error text-xs py-2.5 rounded-m3-md mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ formError }}</span>
        </div>

        <form class="flex flex-col gap-5" @submit.prevent="saveTeam">
          <div class="form-control">
            <label for="team-name" class="label py-1"><span class="label-text font-bold text-sm">Nom de l'équipe</span></label>
            <input id="team-name" v-model="formName" type="text" class="input input-bordered w-full min-h-11 rounded-m3-md text-sm" placeholder="ex: Chantier Nord, Pôle Technique..." />
          </div>

          <div class="modal-action mt-2 pt-4 border-t border-base-200 gap-2">
            <button type="button" class="btn btn-ghost min-h-11 rounded-m3-sm font-medium px-5 active:scale-95 transition-transform duration-150" :disabled="isSaving" @click="closeModal">Annuler</button>
            <button type="submit" class="btn btn-primary min-h-11 rounded-m3-sm font-bold shadow-xs flex-1 active:scale-95 transition-transform duration-150" :disabled="isSaving">
              <span v-if="isSaving" class="loading loading-spinner loading-xs"></span>
              <span v-else>{{ editingTeam ? 'Renommer' : 'Créer l\u2019équipe' }}</span>
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-xs" @click="closeModal">
        <button>close</button>
      </form>
    </dialog>

    <!-- Modale de confirmation d'archivage -->
    <ConfirmModal
      :open="!!teamToArchive"
      title="Désactiver l'équipe"
      :message="`Confirmez-vous la désactivation de l'équipe « ${teamToArchive?.name} » ?`"
      confirm-text="Désactiver"
      confirm-class="btn-error"
      :loading="isArchiving"
      @confirm="confirmArchive"
      @cancel="teamToArchive = null"
    />
  </div>
</template>
