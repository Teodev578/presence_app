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
  <div class="flex flex-col gap-6">
    <div>
      <h2 class="text-2xl font-black tracking-tight text-base-content">Journal des Présences</h2>
      <p class="text-xs text-base-content/60 mt-0.5">Consultez, filtrez et auditez les relevés de pointage</p>
    </div>

    <!-- Barre de filtrage DaisyUI -->
    <div class="card bg-base-100 border border-base-300 shadow-xs p-4 rounded-m3-lg flex flex-wrap gap-4 items-end">
      <div class="fieldset">
        <label for="f-date" class="fieldset-legend text-xs font-semibold text-base-content/70">Date :</label>
        <input id="f-date" v-model="filterDate" type="date" class="input input-bordered input-sm rounded-m3-sm" />
      </div>

      <div class="fieldset">
        <label for="f-status" class="fieldset-legend text-xs font-semibold text-base-content/70">Statut :</label>
        <select id="f-status" v-model="filterStatus" class="select select-bordered select-sm rounded-m3-sm">
          <option value="">Tous les statuts</option>
          <option value="present">Présent</option>
          <option value="late">En retard</option>
          <option value="completed">Terminé</option>
        </select>
      </div>

      <div class="fieldset flex-1 min-w-[200px]">
        <label for="f-search" class="fieldset-legend text-xs font-semibold text-base-content/70">Recherche collaborateur :</label>
        <input
          id="f-search"
          v-model="filterSearch"
          type="text"
          placeholder="Nom, prénom ou email..."
          class="input input-bordered input-sm rounded-m3-sm w-full"
        />
      </div>

      <button type="button" class="btn btn-outline btn-sm rounded-m3-sm gap-1.5" @click="loadPresences">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
        </svg>
        <span>Actualiser</span>
      </button>
    </div>

    <!-- Tableau des données DaisyUI -->
    <div class="card bg-base-100 border border-base-300 shadow-xs rounded-m3-lg overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-sm text-base-content/60 flex items-center justify-center gap-2">
        <span class="loading loading-spinner loading-sm text-primary"></span>
        Chargement des pointages...
      </div>
      <div v-else-if="!filteredPresences().length" class="p-8 text-center text-sm text-base-content/60">
        Aucun résultat pour cette sélection.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="table table-zebra table-sm w-full">
          <thead>
            <tr class="text-xs uppercase text-base-content/60">
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
            <tr v-for="p in filteredPresences()" :key="p.id" class="hover">
              <td class="font-mono text-xs">{{ p.work_date }}</td>
              <td>
                <div class="flex flex-col">
                  <strong class="text-sm font-bold text-base-content">{{ p.profiles?.full_name || 'Utilisateur inconnu' }}</strong>
                  <span class="text-xs text-base-content/60">{{ p.profiles?.email }}</span>
                </div>
              </td>
              <td class="text-xs text-base-content/80">{{ p.locations?.name || 'Site' }}</td>
              <td class="font-mono text-xs font-semibold">{{ formatTime(p.check_in_time) }}</td>
              <td class="font-mono text-xs font-semibold">{{ formatTime(p.check_out_time) }}</td>
              <td>
                <StatusBadge :status="p.status" />
              </td>
              <td>
                <div class="flex flex-col text-xs text-base-content/70">
                  <span>Lat: {{ p.check_in_lat?.toFixed(4) }}, Lng: {{ p.check_in_lng?.toFixed(4) }}</span>
                  <span class="text-[11px] text-base-content/50">±{{ Math.round(p.check_in_accuracy) }}m</span>
                </div>
              </td>
              <td v-if="profile?.role === 'admin'">
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-primary font-semibold gap-1 rounded-m3-sm"
                  title="Modifier le statut"
                  @click="openEditModal(p)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Modifier</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de correction manuelle admin (DaisyUI Modal) -->
    <dialog :class="['modal', { 'modal-open': !!editingPresence }]">
      <div class="modal-box rounded-m3-xl max-w-sm sm:max-w-md p-6 gap-4 flex flex-col bg-base-100 border border-base-300 shadow-sm">
        <h3 class="text-base font-bold text-base-content">Correction manuelle du pointage</h3>
        <p class="text-xs text-base-content/60">
          Collaborateur : <strong class="text-base-content">{{ editingPresence?.profiles?.full_name }}</strong> ({{ editingPresence?.work_date }})
        </p>

        <div class="fieldset">
          <label for="edit-st" class="fieldset-legend text-xs font-semibold text-base-content/70">Nouveau statut :</label>
          <select id="edit-st" v-model="editStatus" class="select select-bordered select-sm w-full rounded-m3-md">
            <option value="present">Présent</option>
            <option value="late">En retard</option>
            <option value="completed">Terminé</option>
          </select>
        </div>

        <div class="modal-action mt-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-m3-sm"
            @click="editingPresence = null"
          >
            Annuler
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm rounded-m3-sm font-bold shadow-xs"
            :disabled="isSavingEdit"
            @click="saveEdit"
          >
            <span v-if="isSavingEdit" class="loading loading-spinner loading-xs"></span>
            <span v-else>Valider la correction</span>
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-xs" @click="editingPresence = null">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
