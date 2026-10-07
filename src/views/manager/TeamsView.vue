<script setup>
import { ref, computed } from 'vue'
import { db, useLiveQuery } from '../../lib/db'
import { generateUUIDv7 } from '../../lib/uuidv7'
import { useAuth } from '../../composables/auth/useAuth.js'
import { useSyncEngine } from '../../composables/infra/useSyncEngine.js'
import { useToast } from '../../composables/ui/useToast.js'
import ConfirmModal from '../../components/shared/ConfirmModal.vue'
import ManagerPageHeader from '../../components/manager/ManagerPageHeader.vue'
import ManagerEmptyState from '../../components/manager/ManagerEmptyState.vue'

const { user } = useAuth()
const { refreshPendingCount, syncNow } = useSyncEngine()
const { success, error: toastError } = useToast()

const searchQuery = ref('')
const sortBy = ref('name') // 'name' | 'members'

// Lectures réactives Local-First depuis Dexie (sans latence réseau)
const rawTeams = useLiveQuery(async () => {
  return await db.teams
    .filter((t) => !t.deleted_at)
    .toArray()
})

const rawProfiles = useLiveQuery(async () => {
  return await db.profiles
    .filter((p) => !p.deleted_at && p.is_active !== false)
    .toArray()
})

const isLoading = computed(() => rawTeams.value === undefined || rawProfiles.value === undefined)

// Jointure locale réactive entre équipes et profils
const teams = computed(() => {
  const profilesByTeam = new Map()
  for (const prof of rawProfiles.value || []) {
    if (prof.team_id) {
      if (!profilesByTeam.has(prof.team_id)) {
        profilesByTeam.set(prof.team_id, [])
      }
      profilesByTeam.get(prof.team_id).push(prof)
    }
  }

  return (rawTeams.value || []).map((t) => ({
    ...t,
    profiles: profilesByTeam.get(t.id) || [],
  }))
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
    return {
      title: 'Aucune équipe',
      message: 'Ajoutez une première équipe pour regrouper les personnes par atelier ou chantier.',
      icon: 'team',
      action: 'create',
      actionLabel: 'Ajouter une équipe',
    }
  }
  return {
    title: 'Aucun résultat',
    message: `Aucune équipe ne correspond à « ${searchQuery.value.trim()} ».`,
    icon: 'search',
    action: 'clear-search',
    actionLabel: 'Effacer la recherche',
  }
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
    formError.value = 'Renseignez un nom pour cette équipe.'
    return
  }
  isSaving.value = true
  formError.value = ''
  try {
    const now = new Date().toISOString()
    const clientMutationId = generateUUIDv7()

    if (editingTeam.value) {
      const id = editingTeam.value.id
      const payload = {
        id,
        name,
        updated_at: now,
      }
      await db.transaction('rw', db.teams, db.sync_outbox, async () => {
        await db.teams.update(id, { name, updated_at: now })
        await db.sync_outbox.add({
          client_mutation_id: clientMutationId,
          table_name: 'teams',
          record_id: id,
          operation: 'UPDATE',
          payload,
          created_at: now,
          attempts: 0,
          status: 'pending',
        })
      })
      success(`L'équipe « ${name} » a été renommée.`)
    } else {
      const id = generateUUIDv7()
      const payload = {
        id,
        name,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      }
      await db.transaction('rw', db.teams, db.sync_outbox, async () => {
        await db.teams.add(payload)
        await db.sync_outbox.add({
          client_mutation_id: clientMutationId,
          table_name: 'teams',
          record_id: id,
          operation: 'INSERT',
          payload,
          created_at: now,
          attempts: 0,
          status: 'pending',
        })
      })
      success(`L'équipe « ${name} » a été créée.`)
    }

    closeModal()
    await refreshPendingCount()
    if (user.value?.id) {
      syncNow(user.value.id)
    }
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
  const now = new Date().toISOString()
  const clientMutationId = generateUUIDv7()

  try {
    await db.transaction('rw', db.teams, db.sync_outbox, async () => {
      await db.teams.update(target.id, {
        deleted_at: now,
        updated_at: now,
      })
      await db.sync_outbox.add({
        client_mutation_id: clientMutationId,
        table_name: 'teams',
        record_id: target.id,
        operation: 'UPDATE',
        payload: {
          id: target.id,
          deleted_at: now,
          updated_at: now,
        },
        created_at: now,
        attempts: 0,
        status: 'pending',
      })
    })

    success(`L'équipe « ${target.name} » a été désactivée.`)
    teamToArchive.value = null
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
      title="Équipes"
      subtitle="Regroupez les personnes par pôle, atelier ou chantier"
    >
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
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
          <span>Ajouter une équipe</span>
        </button>
      </template>
    </ManagerPageHeader>

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

    <!-- Skeleton de chargement anti-FOUC -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4" aria-busy="true" aria-label="Chargement des équipes">
      <div v-for="i in 3" :key="i" class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-5 flex flex-col gap-3 animate-pulse">
        <div class="flex items-center justify-between pb-3 border-b border-base-300/40">
          <div class="h-5 bg-base-300 rounded-m3-xs w-32"></div>
          <div class="h-4 bg-base-300 rounded-full w-20"></div>
        </div>
        <div class="flex gap-2 py-2">
          <div class="h-6 bg-base-300 rounded-m3-xs w-24"></div>
          <div class="h-6 bg-base-300 rounded-m3-xs w-20"></div>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-base-300/40">
          <div class="h-8 bg-base-300 rounded-m3-xs w-20"></div>
        </div>
      </div>
    </div>

    <ManagerEmptyState
      v-else-if="!sortedTeams.length"
      :icon="emptyState.icon"
      :title="emptyState.title"
      :message="emptyState.message"
      :action-label="emptyState.actionLabel"
      @action="runEmptyAction"
    />

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
      <div
        v-for="team in sortedTeams"
        :key="team.id"
        class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-5 flex flex-col gap-3"
      >
        <div class="flex items-center justify-between gap-2 border-b border-base-300/60 pb-3">
          <div class="flex items-center gap-2 min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <h3 class="font-bold text-base text-base-content truncate">{{ team.name }}</h3>
          </div>
          <span class="badge badge-soft badge-sm font-semibold shrink-0">{{ team.profiles?.length || 0 }} personne{{ (team.profiles?.length || 0) > 1 ? 's' : '' }}</span>
        </div>

        <div class="flex-1">
          <div v-if="team.profiles?.length" class="flex flex-wrap gap-1.5">
            <span v-for="m in team.profiles" :key="m.id" class="badge badge-soft badge-sm text-xs rounded-m3-xs gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              {{ m.full_name || m.email }}
            </span>
          </div>
          <p v-else class="text-xs text-base-content/50 italic py-2">Aucune personne dans cette équipe.</p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-base-300/60">
          <button
            type="button"
            class="btn btn-ghost min-h-11 rounded-m3-sm text-xs font-semibold px-3"
            @click="openRenameModal(team)"
          >
            Renommer
          </button>
          <button
            type="button"
            class="btn btn-ghost min-h-11 rounded-m3-sm text-xs font-semibold text-error px-3 hover:bg-error/10"
            @click="requestArchive(team)"
          >
            Désactiver
          </button>
        </div>
      </div>
    </div>

    <!-- Modale création / renommage -->
    <dialog class="modal" :class="{ 'modal-open': isModalOpen }">
      <div class="modal-box rounded-m3-xl max-w-md border border-base-300 bg-base-100 p-6 flex flex-col gap-4">
        <h3 class="font-bold text-lg text-base-content">
          {{ editingTeam ? `Renommer l'équipe « ${editingTeam.name} »` : 'Ajouter une équipe' }}
        </h3>
        <p class="text-xs text-base-content/70">
          {{ editingTeam ? 'Modifiez le nom de l’équipe.' : 'Donnez un nom clair pour identifier cette équipe.' }}
        </p>

        <form @submit.prevent="saveTeam" class="flex flex-col gap-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold text-base-content/80">Nom de l'équipe</legend>
            <input
              v-model="formName"
              type="text"
              class="input input-bordered w-full rounded-m3-md min-h-11 text-sm"
              placeholder="Ex: Pôle Développement, Équipe Chantier A..."
              autofocus
              required
            />
          </fieldset>

          <div v-if="formError" class="alert alert-error text-xs rounded-m3-md py-2">
            {{ formError }}
          </div>

          <div class="modal-action mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              class="btn btn-ghost rounded-m3-sm min-h-11 px-4 font-semibold"
              :disabled="isSaving"
              @click="closeModal"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn btn-primary rounded-m3-sm min-h-11 px-5 font-bold shadow-xs flex items-center gap-2"
              :disabled="isSaving"
            >
              <span v-if="isSaving" class="loading loading-spinner loading-xs"></span>
              <span>{{ editingTeam ? 'Enregistrer' : 'Ajouter' }}</span>
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeModal">
        <button>Fermer</button>
      </form>
    </dialog>

    <!-- Modale de confirmation de désactivation -->
    <ConfirmModal
      :open="!!teamToArchive"
      title="Désactiver cette équipe ?"
      :message="`L'équipe « ${teamToArchive?.name || ''} » ne sera plus proposée pour de nouvelles personnes. L'historique des pointages reste conservé.`"
      confirm-label="Désactiver l'équipe"
      confirm-variant="error"
      :loading="isArchiving"
      @confirm="confirmArchive"
      @cancel="teamToArchive = null"
    />
  </div>
</template>
