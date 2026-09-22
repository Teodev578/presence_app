<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const employees = ref([])
const teams = ref([])
const loading = ref(true)

// Modal d'édition
const editingEmployee = ref(null)
const editForm = ref({
  full_name: '',
  role: 'employee',
  team_id: '',
  expected_arrival_time: '09:00:00',
})
const isSaving = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const { data: profs } = await supabase
      .from('profiles')
      .select('*, teams(name)')
      .is('deleted_at', null)
      .order('full_name')

    employees.value = profs || []

    const { data: tms } = await supabase
      .from('teams')
      .select('*')
      .is('deleted_at', null)
      .order('name')

    teams.value = tms || []
  } catch (err) {
    console.error('Erreur chargement employés :', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const openEditModal = (emp) => {
  editingEmployee.value = emp
  editForm.value = {
    full_name: emp.full_name,
    role: emp.role,
    team_id: emp.team_id || '',
    expected_arrival_time: emp.expected_arrival_time || '09:00:00',
  }
}

const saveEmployee = async () => {
  if (!editingEmployee.value) return
  isSaving.value = true
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
    editingEmployee.value = null
    await loadData()
  } catch (err) {
    alert(`Erreur de mise à jour : ${err.message}`)
  } finally {
    isSaving.value = false
  }
}

const archiveEmployee = async (emp) => {
  if (!confirm(`Confirmer l'archivage du collaborateur "${emp.full_name}" ?`)) return
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', emp.id)

    if (error) throw error
    await loadData()
  } catch (err) {
    alert(`Erreur d'archivage : ${err.message}`)
  }
}
</script>

<template>
  <div class="employees-view">
    <div class="view-header">
      <div>
        <h2 class="section-title">Gestion des Collaborateurs</h2>
        <p class="section-desc">Affectation d'équipes, horaires attendus et rôles d'accès</p>
      </div>
    </div>

    <div class="card-table">
      <div v-if="loading" class="state-msg">
        Chargement des profils...
      </div>
      <div v-else-if="!employees.length" class="state-msg">
        Aucun collaborateur actif.
      </div>
      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom complet</th>
              <th>Email</th>
              <th>Équipe</th>
              <th>Rôle</th>
              <th>Heure attendue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in employees" :key="emp.id">
              <td><strong>{{ emp.full_name }}</strong></td>
              <td class="col-sub">{{ emp.email }}</td>
              <td>{{ emp.teams?.name || 'Non assigné' }}</td>
              <td>
                <span class="role-pill" :class="`role-${emp.role}`">
                  {{ emp.role }}
                </span>
              </td>
              <td class="col-mono">{{ emp.expected_arrival_time?.slice(0, 5) }}</td>
              <td class="col-actions">
                <button
                  type="button"
                  class="btn-action btn-edit"
                  @click="openEditModal(emp)"
                >
                  ✏️ Modifier
                </button>
                <button
                  type="button"
                  class="btn-action btn-del"
                  @click="archiveEmployee(emp)"
                >
                  📦 Archiver
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal d'édition employé -->
    <div v-if="editingEmployee" class="modal-backdrop">
      <div class="modal-card">
        <h3 class="modal-title">Modifier le collaborateur</h3>
        <p class="modal-sub">{{ editingEmployee.email }}</p>

        <div class="modal-field">
          <label for="f-name" class="field-label">Nom complet :</label>
          <input id="f-name" v-model="editForm.full_name" type="text" class="input-text" />
        </div>

        <div class="modal-field">
          <label for="f-role" class="field-label">Rôle d'accès :</label>
          <select id="f-role" v-model="editForm.role" class="input-text">
            <option value="employee">Employé</option>
            <option value="manager">Manager</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <div class="modal-field">
          <label for="f-team" class="field-label">Équipe de rattachement :</label>
          <select id="f-team" v-model="editForm.team_id" class="input-text">
            <option value="">Aucune équipe</option>
            <option v-for="t in teams" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>

        <div class="modal-field">
          <label for="f-time" class="field-label">Heure d'arrivée attendue :</label>
          <input id="f-time" v-model="editForm.expected_arrival_time" type="time" class="input-text" />
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="editingEmployee = null">
            Annuler
          </button>
          <button type="button" class="btn-save" :disabled="isSaving" @click="saveEmployee">
            <span v-if="isSaving">Mise à jour...</span>
            <span v-else>Enregistrer</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.employees-view {
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

.card-table {
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

.col-sub {
  color: #64748b;
  font-size: 0.82rem;
}

.col-mono {
  font-family: ui-monospace, monospace;
}

.role-pill {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
}

.role-employee {
  background: #f1f5f9;
  color: #475569;
}

.role-manager {
  background: #eff6ff;
  color: #2563eb;
}

.role-admin {
  background: #faf5ff;
  color: #7c3aed;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  border: 1px solid #cbd5e1;
  background: white;
  padding: 0.35rem 0.65rem;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-edit:hover {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

.btn-del:hover {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
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

.input-text {
  padding: 0.55rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  font-size: 0.85rem;
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

.state-msg {
  padding: 3rem;
  text-align: center;
  color: #64748b;
}
</style>
