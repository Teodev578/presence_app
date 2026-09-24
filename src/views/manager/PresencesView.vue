<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import { db } from '../../lib/db'
import { generateUUIDv7 } from '../../lib/uuidv7'
import { useProfile } from '../../composables/useProfile'
import { getLocalDateString, formatTime, calculateWorkDuration, calculateElapsedTime } from '../../lib/dateUtils'
import StatusBadge from '../../components/shared/StatusBadge.vue'

const { profile } = useProfile()

const filterDate = ref(getLocalDateString())
const filterStatus = ref('')
const filterSearch = ref('')
const presencesList = ref([])
const loading = ref(false)

// Modal d'édition/correction manuelle (admin)
const editingPresence = ref(null)
const editStatus = ref('present')
const isSavingEdit = ref(false)
const editError = ref('')

const loadPresences = async () => {
  loading.value = true
  try {
    // 1. Consultation locale-first (Dexie) pour réactivité et usage hors-ligne
    const localPresences = await db.presences
      .filter((p) => !p.deleted_at && (!filterDate.value || p.work_date === filterDate.value))
      .toArray()

    const profiles = await db.profiles.toArray()
    const locations = await db.locations.toArray()
    const profilesMap = new Map(profiles.map((pr) => [pr.id, pr]))
    const locationsMap = new Map(locations.map((loc) => [loc.id, loc]))

    const enrichedLocal = localPresences.map((p) => ({
      ...p,
      profiles: profilesMap.get(p.user_id) || null,
      locations: locationsMap.get(p.location_id) || null,
    }))

    if (enrichedLocal.length > 0) {
      presencesList.value = enrichedLocal
    }

    // 2. Synchronisation distante si connecté
    if (navigator.onLine) {
      let query = supabase
        .from('presences')
        .select('*, profiles(full_name, email, role), locations(name)')
        .is('deleted_at', null)
        .order('check_in_time', { ascending: false })

      if (filterDate.value) {
        query = query.eq('work_date', filterDate.value)
      }

      if (filterStatus.value) {
        if (filterStatus.value === 'completed') {
          query = query.in('status', ['completed', 'completed_late'])
        } else {
          query = query.eq('status', filterStatus.value)
        }
      }

      const { data, error } = await query
      if (!error && data) {
        presencesList.value = data
        // Mise en cache locale des pointages distants
        const rawPresences = data.map(({ profiles: _p, locations: _l, ...p }) => p)
        if (rawPresences.length) {
          await db.presences.bulkPut(rawPresences)
        }
      }
    }
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

// Synthèse chiffrée de la journée
const stats = computed(() => {
  const list = presencesList.value || []
  const total = list.length
  const onTime = list.filter((p) => p.status === 'present' || p.status === 'completed').length
  const late = list.filter((p) => p.status === 'late' || p.status === 'completed_late').length
  const completed = list.filter((p) => Boolean(p.check_out_time)).length
  return { total, onTime, late, completed }
})

// Propriété réactive calculée pour le filtrage fluide sans lag
const filteredPresences = computed(() => {
  let list = presencesList.value || []

  if (filterStatus.value) {
    if (filterStatus.value === 'completed') {
      list = list.filter((p) => p.status === 'completed' || p.status === 'completed_late')
    } else {
      list = list.filter((p) => p.status === filterStatus.value)
    }
  }

  if (!filterSearch.value.trim()) return list
  const q = filterSearch.value.toLowerCase()
  return list.filter((p) => {
    return (
      p.profiles?.full_name?.toLowerCase().includes(q) ||
      p.profiles?.email?.toLowerCase().includes(q) ||
      p.locations?.name?.toLowerCase().includes(q)
    )
  })
})

const openEditModal = (p) => {
  editingPresence.value = p
  editStatus.value = p.status
  editError.value = ''
}

const saveEdit = async () => {
  if (!editingPresence.value) return
  isSavingEdit.value = true
  editError.value = ''

  try {
    const updatedTime = new Date().toISOString()
    const presenceId = editingPresence.value.id
    const newStatus = editStatus.value

    // Mise à jour locale Dexie + outbox pour résilience offline
    const record = await db.presences.get(presenceId)
    if (record) {
      const payload = { ...record, status: newStatus, updated_at: updatedTime }
      const outboxEntry = {
        id: generateUUIDv7(),
        client_mutation_id: generateUUIDv7(),
        table_name: 'presences',
        record_id: presenceId,
        operation: 'UPDATE',
        payload,
        created_at: updatedTime,
        attempts: 0,
        status: 'pending',
      }
      await db.transaction('rw', db.presences, db.sync_outbox, async () => {
        await db.presences.update(presenceId, { status: newStatus, updated_at: updatedTime })
        await db.sync_outbox.add(outboxEntry)
      })
    }

    // Propagation Supabase si en ligne
    if (navigator.onLine) {
      const { error } = await supabase
        .from('presences')
        .update({ status: newStatus, updated_at: updatedTime })
        .eq('id', presenceId)

      if (error) throw error
    }

    editingPresence.value = null
    await loadPresences()
  } catch (err) {
    editError.value = `Erreur de modification : ${err.message}`
  } finally {
    isSavingEdit.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h2 class="text-2xl font-black tracking-tight text-base-content">Contrôle des Présences</h2>
      <p class="text-xs text-base-content/60 mt-0.5">Suivi de l'assiduité, précision GPS et audit des temps de travail</p>
    </div>

    <!-- Synthèse KPI rapide de la journée -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="card bg-base-100 border border-base-300 shadow-xs p-4 rounded-m3-md flex flex-col gap-1">
        <span class="text-xs font-semibold text-base-content/60">Total pointés</span>
        <span class="text-2xl font-black text-base-content">{{ stats.total }}</span>
        <span class="text-[11px] text-base-content/50">Pointages enregistrés</span>
      </div>
      <div class="card bg-base-100 border border-base-300 shadow-xs p-4 rounded-m3-md flex flex-col gap-1">
        <span class="text-xs font-semibold text-success flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-success"></span>
          À l'heure
        </span>
        <span class="text-2xl font-black text-success">{{ stats.onTime }}</span>
        <span class="text-[11px] text-base-content/50">Arrivées ponctuelles</span>
      </div>
      <div class="card bg-base-100 border border-base-300 shadow-xs p-4 rounded-m3-md flex flex-col gap-1">
        <span class="text-xs font-semibold text-warning flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-warning"></span>
          En retard
        </span>
        <span class="text-2xl font-black text-warning">{{ stats.late }}</span>
        <span class="text-[11px] text-base-content/50">Retards constatés</span>
      </div>
      <div class="card bg-base-100 border border-base-300 shadow-xs p-4 rounded-m3-md flex flex-col gap-1">
        <span class="text-xs font-semibold text-info flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-info"></span>
          Départs validés
        </span>
        <span class="text-2xl font-black text-info">{{ stats.completed }}</span>
        <span class="text-[11px] text-base-content/50">Journées clôturées</span>
      </div>
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

      <button type="button" class="btn btn-outline btn-sm rounded-m3-sm gap-1.5 min-h-11 px-3" @click="loadPresences">
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
      <div v-else-if="!filteredPresences.length" class="p-8 text-center text-sm text-base-content/60">
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
              <th>Durée</th>
              <th>Statut</th>
              <th>Précision GPS</th>
              <th v-if="profile?.role === 'admin'">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredPresences" :key="p.id" class="hover">
              <td class="font-mono text-xs">{{ p.work_date }}</td>
              <td>
                <div class="flex flex-col">
                  <strong class="text-sm font-bold text-base-content">{{ p.profiles?.full_name || 'Utilisateur inconnu' }}</strong>
                  <span class="text-xs text-base-content/60">{{ p.profiles?.email }}</span>
                </div>
              </td>
              <td class="text-xs text-base-content/80">{{ p.locations?.name || 'Site central' }}</td>
              <td class="font-mono text-xs font-semibold">{{ formatTime(p.check_in_time) }}</td>
              <td class="font-mono text-xs font-semibold">{{ formatTime(p.check_out_time) }}</td>
              <td class="text-xs font-medium text-base-content/80">
                <span v-if="p.check_out_time">
                  {{ calculateWorkDuration(p.check_in_time, p.check_out_time) || '--' }}
                </span>
                <span v-else-if="p.check_in_time" class="text-warning text-[11px] font-medium flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
                  En cours
                </span>
                <span v-else>--</span>
              </td>
              <td>
                <StatusBadge :status="p.status" />
              </td>
              <td>
                <div class="flex items-center gap-1.5 text-xs">
                  <span
                    class="badge badge-xs text-[10px] font-semibold py-1 px-1.5 rounded-m3-xs gap-1"
                    :class="{
                      'badge-success text-success-content': p.check_in_accuracy && p.check_in_accuracy <= 15,
                      'badge-warning text-warning-content': p.check_in_accuracy && p.check_in_accuracy > 15 && p.check_in_accuracy <= 50,
                      'badge-ghost text-base-content/60': !p.check_in_accuracy || p.check_in_accuracy > 50
                    }"
                  >
                    ±{{ Math.round(p.check_in_accuracy || 0) }}m
                  </span>
                </div>
              </td>
              <td v-if="profile?.role === 'admin'">
                <button
                  type="button"
                  class="btn btn-ghost btn-sm text-primary font-semibold gap-1.5 rounded-m3-sm min-h-11 px-3"
                  title="Modifier le statut"
                  @click="openEditModal(p)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

        <!-- Message d'erreur intégré sans alert() bloquant -->
        <div v-if="editError" class="alert alert-error text-xs py-2 rounded-m3-xs flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{{ editError }}</span>
        </div>

        <div class="fieldset">
          <label for="edit-st" class="fieldset-legend text-xs font-semibold text-base-content/70">Nouveau statut :</label>
          <select id="edit-st" v-model="editStatus" class="select select-bordered select-sm w-full rounded-m3-md">
            <option value="present">Présent (à l'heure)</option>
            <option value="late">En retard</option>
            <option value="completed">Terminé (à l'heure)</option>
            <option value="completed_late">Terminé (avec retard)</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        <div class="modal-action mt-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-m3-sm min-h-11 px-3"
            @click="editingPresence = null"
          >
            Annuler
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm rounded-m3-sm font-bold shadow-xs min-h-11 px-4"
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
