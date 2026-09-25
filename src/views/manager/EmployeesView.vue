<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import ConfirmModal from '../../components/shared/ConfirmModal.vue'
import { useToast } from '../../composables/useToast'

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
    success('Profil mis à jour avec succès.')
    editingEmployee.value = null
    await loadData()
  } catch (err) {
    toastError(`Erreur de mise à jour : ${err.message}`)
  } finally {
    isSaving.value = false
  }
}

const { success, error: toastError } = useToast()
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
    <div>
      <h2 class="text-2xl font-black tracking-tight text-base-content">Gestion des Collaborateurs</h2>
      <p class="text-xs text-base-content/60 mt-0.5">Affectation d'équipes, horaires attendus et rôles d'accès</p>
    </div>

    <!-- Tableau DaisyUI -->
    <div class="card bg-base-100 border border-base-300 shadow-xs rounded-m3-lg overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-sm text-base-content/60 flex items-center justify-center gap-2">
        <span class="loading loading-spinner loading-sm text-primary"></span>
        Chargement des profils...
      </div>
      <div v-else-if="!employees.length" class="p-8 text-center text-sm text-base-content/60">
        Aucun collaborateur actif.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="table table-zebra table-sm w-full">
          <thead>
            <tr class="text-xs uppercase text-base-content/60">
              <th>Nom complet</th>
              <th>Email</th>
              <th>Équipe</th>
              <th>Rôle</th>
              <th>Heure attendue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in employees" :key="emp.id" class="hover">
              <td class="font-bold text-sm text-base-content">{{ emp.full_name }}</td>
              <td class="text-xs text-base-content/60">{{ emp.email }}</td>
              <td>
                <span class="badge badge-ghost badge-sm rounded-m3-xs">{{ emp.teams?.name || 'Non assigné' }}</span>
              </td>
              <td>
                <span
                  class="badge badge-sm font-semibold capitalize rounded-m3-xs"
                  :class="{
                    'badge-error text-error-content': emp.role === 'admin',
                    'badge-primary text-primary-content': emp.role === 'manager',
                    'badge-ghost': emp.role === 'employee'
                  }"
                >
                  {{ emp.role }}
                </span>
              </td>
              <td class="font-mono text-xs font-semibold">{{ emp.expected_arrival_time?.slice(0, 5) }}</td>
              <td>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm text-primary font-semibold gap-1.5 rounded-m3-sm min-h-11 px-3"
                    @click="openEditModal(emp)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span>Modifier</span>
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm text-error font-semibold gap-1.5 rounded-m3-sm min-h-11 px-3"
                    @click="requestArchive(emp)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

    <!-- Modal d'édition employé DaisyUI -->
    <dialog :class="['modal', { 'modal-open': !!editingEmployee }]">
      <div class="modal-box rounded-m3-xl max-w-sm sm:max-w-md p-6 gap-4 flex flex-col bg-base-100 border border-base-300 shadow-sm">
        <h3 class="text-base font-bold text-base-content">Modifier le collaborateur</h3>
        <p class="text-xs text-base-content/60">{{ editingEmployee?.email }}</p>

        <div class="fieldset">
          <label for="f-name" class="fieldset-legend text-xs font-semibold text-base-content/70">Nom complet :</label>
          <input id="f-name" v-model="editForm.full_name" type="text" class="input input-bordered input-sm rounded-m3-sm w-full" />
        </div>

        <div class="fieldset">
          <label for="f-role" class="fieldset-legend text-xs font-semibold text-base-content/70">Rôle d'accès :</label>
          <select id="f-role" v-model="editForm.role" class="select select-bordered select-sm rounded-m3-sm w-full">
            <option value="employee">Employé</option>
            <option value="manager">Manager</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <div class="fieldset">
          <label for="f-team" class="fieldset-legend text-xs font-semibold text-base-content/70">Équipe de rattachement :</label>
          <select id="f-team" v-model="editForm.team_id" class="select select-bordered select-sm rounded-m3-sm w-full">
            <option value="">Aucune équipe</option>
            <option v-for="t in teams" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>

        <div class="fieldset">
          <label for="f-time" class="fieldset-legend text-xs font-semibold text-base-content/70">Heure d'arrivée attendue :</label>
          <input id="f-time" v-model="editForm.expected_arrival_time" type="time" class="input input-bordered input-sm rounded-m3-sm w-full" />
        </div>

        <div class="modal-action mt-2">
          <button type="button" class="btn btn-ghost btn-sm rounded-m3-sm" @click="editingEmployee = null">
            Annuler
          </button>
          <button type="button" class="btn btn-primary btn-sm rounded-m3-sm font-bold shadow-xs" :disabled="isSaving" @click="saveEmployee">
            <span v-if="isSaving" class="loading loading-spinner loading-xs"></span>
            <span v-else>Enregistrer</span>
          </button>
        </div>
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
