<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../composables/useProfile'
import StatusBadge from '../../components/shared/StatusBadge.vue'

const { profile } = useProfile()

const filterDate = ref(new Date().toISOString().slice(0, 10))
const filterStatus = ref('')
const filterSearch = ref('')
const presencesList = ref([])
const loading = ref(false)

// Modal d'édition/correction manuelle (admin)
const editingPresence = ref(null)
const editStatus = ref('present')
const isSavingEdit = ref(false)

const loadPresences = async () => {
  loading.value = true
  try {
    let query = supabase
      .from('presences')
      .select('*, profiles(full_name, email, role), locations(name)')
      .is('deleted_at', null)
      .order('check_in_time', { ascending: false })

    if (filterDate.value) {
      query = query.eq('work_date', filterDate.value)
    }

    if (filterStatus.value) {
      query = query.eq('status', filterStatus.value)
    }

    const { data, error } = await query
    if (error) throw error
    presencesList.value = data || []
  } catch (err) {
    console.error('Erreur chargement présences :', err)
  } finally {
    loading.value = false
  }
}

watch([filterDate, filterStatus], () => {
  loadPresences()
})

onMounted(() => {
  loadPresences()
})

const filteredPresences = () => {
  if (!filterSearch.value.trim()) return presencesList.value
  const q = filterSearch.value.toLowerCase()
  return presencesList.value.filter((p) => {
    return (
      p.profiles?.full_name?.toLowerCase().includes(q) ||
      p.profiles?.email?.toLowerCase().includes(q) ||
      p.locations?.name?.toLowerCase().includes(q)
    )
  })
}

const openEditModal = (p) => {
  editingPresence.value = p
  editStatus.value = p.status
}

const saveEdit = async () => {
  if (!editingPresence.value) return
  isSavingEdit.value = true
  try {
    const { error } = await supabase
      .from('presences')
      .update({ status: editStatus.value })
      .eq('id', editingPresence.value.id)

    if (error) throw error
    editingPresence.value = null
    await loadPresences()
  } catch (err) {
    alert(`Erreur de modification : ${err.message}`)
  } finally {
    isSavingEdit.value = false
  }
}

const formatTime = (iso) => {
  if (!iso) return '--:--'
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="presences-view">
    <div class="page-title-row">
      <div>
        <h2 class="section-title">Journal des Présences</h2>
        <p class="section-desc">Consultez, filtrez et auditez les relevés de pointage</p>
      </div>
    </div>

    <!-- Barre de filtrage -->
    <div class="filter-bar">
      <div class="filter-item">
        <label for="f-date" class="filter-label">Date :</label>
        <input id="f-date" v-model="filterDate" type="date" class="input-filter" />
      </div>

      <div class="filter-item">
        <label for="f-status" class="filter-label">Statut :</label>
        <select id="f-status" v-model="filterStatus" class="input-filter">
          <option value="">Tous les statuts</option>
          <option value="present">Présent</option>
          <option value="late">En retard</option>
          <option value="completed">Terminé</option>
        </select>
      </div>

      <div class="filter-item flex-1">
        <label for="f-search" class="filter-label">Recherche employé :</label>
        <input
          id="f-search"
          v-model="filterSearch"
          type="text"
          placeholder="Nom, prénom ou email..."
          class="input-filter"
        />
      </div>

      <button type="button" class="btn-refresh" @click="loadPresences">
        🔄 Actualiser
      </button>
    </div>

    <!-- Tableau des données -->
    <div class="table-card">
      <div v-if="loading" class="state-msg">
        Chargement des pointages...
      </div>
      <div v-else-if="!filteredPresences().length" class="state-msg">
        Aucun résultat pour cette sélection.
      </div>
      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Collaborateur</th>
              <th>Site</th>
              <th>Arrivée</th>
              <th>Départ</th>
              <th>Statut</th>
              <th>GPS Arrivée</th>
              <th v-if="profile?.role === 'admin'">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredPresences()" :key="p.id">
              <td>{{ p.work_date }}</td>
              <td class="col-user">
                <strong>{{ p.profiles?.full_name || 'Utilisateur inconnu' }}</strong>
                <span class="sub-email">{{ p.profiles?.email }}</span>
              </td>
              <td>{{ p.locations?.name || 'Site' }}</td>
              <td class="col-mono">{{ formatTime(p.check_in_time) }}</td>
              <td class="col-mono">{{ formatTime(p.check_out_time) }}</td>
              <td>
                <StatusBadge :status="p.status" />
              </td>
              <td class="col-gps">
                <span>Lat: {{ p.check_in_lat?.toFixed(4) }}, Lng: {{ p.check_in_lng?.toFixed(4) }}</span>
                <span class="acc-text">Précision: ±{{ Math.round(p.check_in_accuracy) }}m</span>
              </td>
              <td v-if="profile?.role === 'admin'">
                <button
                  type="button"
                  class="btn-edit"
                  title="Modifier le statut"
                  @click="openEditModal(p)"
                >
                  ✏️ Modifier
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de correction manuelle admin -->
    <div v-if="editingPresence" class="modal-backdrop">
      <div class="modal-card">
        <h3 class="modal-title">Correction manuelle du pointage</h3>
        <p class="modal-sub">
          Collaborateur : <strong>{{ editingPresence.profiles?.full_name }}</strong> ({{ editingPresence.work_date }})
        </p>

        <div class="modal-field">
          <label for="edit-st" class="field-label">Nouveau statut :</label>
          <select id="edit-st" v-model="editStatus" class="input-filter">
            <option value="present">Présent</option>
            <option value="late">En retard</option>
            <option value="completed">Terminé</option>
          </select>
        </div>

        <div class="modal-actions">
          <button
            type="button"
            class="btn-cancel"
            @click="editingPresence = null"
          >
            Annuler
          </button>
          <button
            type="button"
            class="btn-save"
            :disabled="isSavingEdit"
            @click="saveEdit"
          >
            <span v-if="isSavingEdit">Enregistrement...</span>
            <span v-else>Valider la correction</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.presences-view {
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

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  background: #ffffff;
  padding: 1.25rem;
  border-radius: 0.85rem;
  border: 1px solid var(--border-color, #e2e8f0);
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.flex-1 {
  flex: 1;
  min-width: 200px;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.input-filter {
  padding: 0.55rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  font-size: 0.85rem;
  background: #ffffff;
  color: #1e293b;
}

.btn-refresh {
  padding: 0.55rem 0.95rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.table-card {
  background: #ffffff;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;
}

.data-table th {
  background: #f8fafc;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
}

.col-user {
  display: flex;
  flex-direction: column;
}

.sub-email {
  font-size: 0.75rem;
  color: #64748b;
}

.col-mono {
  font-family: ui-monospace, monospace;
  font-weight: 600;
}

.col-gps {
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
  color: #475569;
}

.acc-text {
  font-size: 0.7rem;
  color: #94a3b8;
}

.btn-edit {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  padding: 0.35rem 0.65rem;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.state-msg {
  padding: 3rem;
  text-align: center;
  color: #64748b;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-card {
  background: white;
  border-radius: 1rem;
  padding: 1.75rem;
  width: 90%;
  max-width: 440px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
}

.modal-sub {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-cancel {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-save {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
