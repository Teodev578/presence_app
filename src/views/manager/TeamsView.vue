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
  <div class="teams-view">
    <div class="view-header">
      <div>
        <h2 class="section-title">Gestion des Équipes</h2>
        <p class="section-desc">Structurez vos pôles et regroupez vos collaborateurs</p>
      </div>
    </div>

    <!-- Formulaire d'ajout rapide -->
    <div class="create-bar">
      <input
        v-model="newTeamName"
        type="text"
        placeholder="Nom de la nouvelle équipe (ex: Chantier Nord, Pôle Technique)..."
        class="input-team"
        @keyup.enter="handleCreateTeam"
      />
      <button
        type="button"
        class="btn-create"
        :disabled="!newTeamName.trim() || isCreating"
        @click="handleCreateTeam"
      >
        <span v-if="isCreating">Création...</span>
        <span v-else>+ Créer l'équipe</span>
      </button>
    </div>

    <!-- Liste des équipes en cartes -->
    <div class="teams-grid">
      <div v-if="loading" class="state-msg">
        Chargement des équipes...
      </div>
      <div v-else-if="!teams.length" class="state-msg">
        Aucune équipe créée pour l'instant.
      </div>
      <div
        v-for="team in teams"
        :key="team.id"
        class="team-card"
      >
        <div class="team-header">
          <div class="team-title-box">
            <span class="team-icon">🏢</span>
            <h3 class="team-name">{{ team.name }}</h3>
          </div>
          <button
            type="button"
            class="btn-del"
            title="Archiver l'équipe"
            @click="archiveTeam(team)"
          >
            🗑️
          </button>
        </div>

        <div class="team-members">
          <span class="members-caption">
            Membres ({{ team.profiles?.length || 0 }}) :
          </span>

          <div v-if="team.profiles?.length" class="members-pills">
            <span
              v-for="m in team.profiles"
              :key="m.id"
              class="member-pill"
            >
              👤 {{ m.full_name }}
            </span>
          </div>
          <div v-else class="no-members">
            Aucun membre assigné. Rendez-vous dans la section "Employés" pour en affecter.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.teams-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  color: #0f172a;
}

.section-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.2rem 0 0;
}

.create-bar {
  display: flex;
  gap: 0.75rem;
  background: #ffffff;
  padding: 1rem 1.25rem;
  border-radius: 0.85rem;
  border: 1px solid var(--border-color, #e2e8f0);
}

.input-team {
  flex: 1;
  padding: 0.65rem 0.85rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
}

.btn-create {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.25rem;
}

.team-card {
  background: #ffffff;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.75rem;
}

.team-title-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-icon {
  font-size: 1.3rem;
}

.team-name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.btn-del {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 4px;
}

.btn-del:hover {
  background: #fee2e2;
}

.members-caption {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
}

.members-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.member-pill {
  font-size: 0.78rem;
  background: #f1f5f9;
  color: #334155;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
}

.no-members {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.4rem;
  font-style: italic;
}

.state-msg {
  padding: 3rem;
  text-align: center;
  color: #64748b;
  grid-column: 1 / -1;
}
</style>
