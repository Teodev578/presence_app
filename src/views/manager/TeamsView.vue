<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const teams = ref([])
const loading = ref(true)
const newTeamName = ref('')
const isCreating = ref(false)

const loadTeams = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*, profiles(id, full_name, email)')
      .is('deleted_at', null)
      .order('name')

    if (error) throw error
    teams.value = data || []
  } catch (err) {
    console.error('Erreur chargement équipes :', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTeams()
})

const handleCreateTeam = async () => {
  if (!newTeamName.value.trim()) return
  isCreating.value = true
  try {
    const { error } = await supabase.from('teams').insert({
      name: newTeamName.value.trim(),
    })
    if (error) throw error
    newTeamName.value = ''
    await loadTeams()
  } catch (err) {
    alert(`Erreur création équipe : ${err.message}`)
  } finally {
    isCreating.value = false
  }
}

const archiveTeam = async (team) => {
  if (!confirm(`Confirmer la désactivation de l'équipe "${team.name}" ?`)) return
  try {
    const { error } = await supabase
      .from('teams')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', team.id)
    if (error) throw error
    await loadTeams()
  } catch (err) {
    alert(`Erreur d'archivage : ${err.message}`)
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h2 class="text-2xl font-black tracking-tight text-base-content">Gestion des Équipes</h2>
      <p class="text-xs text-base-content/60 mt-0.5">Structurez vos pôles et regroupez vos collaborateurs</p>
    </div>

    <!-- Formulaire d'ajout rapide DaisyUI -->
    <div class="card bg-base-100 border border-base-300 shadow-xs p-4 rounded-2xl flex flex-row items-center gap-3">
      <input
        v-model="newTeamName"
        type="text"
        placeholder="Nom de la nouvelle équipe (ex: Chantier Nord, Pôle Technique)..."
        class="input input-bordered input-sm rounded-lg flex-1 text-sm"
        @keyup.enter="handleCreateTeam"
      />
      <button
        type="button"
        class="btn btn-primary btn-sm rounded-lg font-bold gap-1"
        :disabled="!newTeamName.trim() || isCreating"
        @click="handleCreateTeam"
      >
        <span v-if="isCreating" class="loading loading-spinner loading-xs"></span>
        <span v-else>+ Créer l'équipe</span>
      </button>
    </div>

    <!-- Grille des équipes en cartes DaisyUI -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="loading" class="col-span-full p-8 text-center text-sm text-base-content/60 flex items-center justify-center gap-2">
        <span class="loading loading-spinner loading-sm text-primary"></span>
        Chargement des équipes...
      </div>
      <div v-else-if="!teams.length" class="col-span-full p-8 text-center text-sm text-base-content/60">
        Aucune équipe créée pour l'instant.
      </div>

      <div
        v-for="team in teams"
        :key="team.id"
        class="card bg-base-100 border border-base-300 shadow-xs rounded-2xl p-5 flex flex-col gap-3"
      >
        <div class="flex items-center justify-between border-b border-base-200 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">🏢</span>
            <h3 class="font-bold text-base text-base-content">{{ team.name }}</h3>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-circle btn-xs text-error"
            title="Archiver l'équipe"
            aria-label="Archiver l'équipe"
            @click="archiveTeam(team)"
          >
            🗑️
          </button>
        </div>

        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-base-content/60">
            Membres ({{ team.profiles?.length || 0 }}) :
          </span>

          <div v-if="team.profiles?.length" class="flex flex-wrap gap-1.5 mt-2">
            <span
              v-for="m in team.profiles"
              :key="m.id"
              class="badge badge-ghost badge-sm text-xs"
            >
              👤 {{ m.full_name }}
            </span>
          </div>
          <div v-else class="text-xs text-base-content/50 italic mt-2">
            Aucun membre assigné. Rendez-vous dans "Employés" pour en affecter.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
