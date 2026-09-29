<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import { db } from '../../lib/db'
import { generateUUIDv7 } from '../../lib/uuidv7'
import { useProfile } from '../../composables/useProfile'
import { useToast } from '../../composables/useToast'
import {
  getLocalDateString,
  formatTime,
  formatWorkDate,
  formatSessionDuration,
  resolveSessionState,
} from '../../lib/dateUtils'
import StatusBadge from '../../components/shared/StatusBadge.vue'

const { profile } = useProfile()
const { success: toastSuccess, error: toastError } = useToast()

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

    // La liste locale fait foi immédiatement : une date sans pointage vide bien la vue
    presencesList.value = enrichedLocal

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

watch(filterDate, () => {
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

// Comptes par statut : les filtres annoncent ce qu'ils contiennent avant qu'on les ouvre.
const statusCounts = computed(() => {
  const list = presencesList.value || []
  const present = list.filter((p) => p.status === 'present').length
  const late = list.filter((p) => p.status === 'late').length
  const completed = list.filter((p) => p.status === 'completed' || p.status === 'completed_late').length
  return { all: list.length, present, late, completed }
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

// La date filtrée en clair, pour les messages d'état vide
const readableDate = computed(() => formatWorkDate(filterDate.value) || filterDate.value)

/**
 * Message de l'état vide : distinguer « aucun pointage pour la date », « aucun résultat de
 * recherche » et « aucun pointage pour ce statut », et proposer l'action réellement utile.
 */
const emptyState = computed(() => {
  if (!(presencesList.value || []).length) {
    return {
      title: 'Aucun pointage',
      message: `Aucun pointage n'a été enregistré le ${readableDate.value}.`,
      action: 'refresh',
      actionLabel: 'Actualiser',
    }
  }
  if (filterSearch.value.trim()) {
    return {
      title: 'Aucun résultat',
      message: `Aucun pointage ne correspond à « ${filterSearch.value.trim()} ».`,
      action: 'clear-search',
      actionLabel: 'Effacer la recherche',
    }
  }
  return {
    title: 'Aucun pointage pour ce filtre',
    message: 'Aucun pointage ne correspond au statut sélectionné pour cette journée.',
    action: 'show-all',
    actionLabel: 'Voir tous les pointages',
  }
})

const runEmptyAction = () => {
  if (emptyState.value.action === 'refresh') loadPresences()
  else if (emptyState.value.action === 'clear-search') filterSearch.value = ''
  else filterStatus.value = ''
}

// Initiales pour l'avatar de la carte
const initials = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}

// Précision GPS : couple libellé/couleur selon la tolérance de pointage
const accuracyBadge = (accuracy) => {
  const value = Number(accuracy)
  if (!Number.isFinite(value)) return { label: 'GPS —', class: 'badge-soft text-base-content/60' }
  const rounded = Math.round(value)
  if (rounded <= 15) return { label: `±${rounded} m`, class: 'badge-success text-success-content' }
  if (rounded <= 50) return { label: `±${rounded} m`, class: 'badge-warning text-warning-content' }
  return { label: `±${rounded} m`, class: 'badge-soft text-base-content/60' }
}

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
    toastSuccess('Le statut du pointage a été corrigé.')
    await loadPresences()
  } catch (err) {
    editError.value = `Erreur de modification : ${err.message}`
    toastError(`Erreur de modification : ${err.message}`)
  } finally {
    isSavingEdit.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- En-tête -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black tracking-tight text-base-content flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </div>
          <span>Contrôle des Présences</span>
        </h1>
        <p class="text-xs text-base-content/60 mt-0.5">
          Suivi de l'assiduité, précision GPS et audit des temps de travail
        </p>
      </div>

      <div>
        <button
          type="button"
          class="btn btn-outline rounded-m3-sm font-bold min-h-11 flex items-center gap-2 px-3"
          @click="loadPresences"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          <span>Actualiser</span>
        </button>
      </div>
    </div>

    <!-- Synthèse KPI rapide de la journée -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="card bg-base-200 border border-base-300 shadow-xs p-4 rounded-m3-md flex flex-col gap-1">
        <span class="text-xs font-semibold text-base-content/60">Total pointés</span>
        <span class="text-2xl font-black text-base-content">{{ stats.total }}</span>
        <span class="text-[11px] text-base-content/50">Pointages enregistrés</span>
      </div>
      <div class="card bg-base-200 border border-base-300 shadow-xs p-4 rounded-m3-md flex flex-col gap-1">
        <span class="text-xs font-semibold text-success flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-success"></span>
          À l'heure
        </span>
        <span class="text-2xl font-black text-success">{{ stats.onTime }}</span>
        <span class="text-[11px] text-base-content/50">Arrivées ponctuelles</span>
      </div>
      <div class="card bg-base-200 border border-base-300 shadow-xs p-4 rounded-m3-md flex flex-col gap-1">
        <span class="text-xs font-semibold text-warning flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-warning"></span>
          En retard
        </span>
        <span class="text-2xl font-black text-warning">{{ stats.late }}</span>
        <span class="text-[11px] text-base-content/50">Retards constatés</span>
      </div>
      <div class="card bg-base-200 border border-base-300 shadow-xs p-4 rounded-m3-md flex flex-col gap-1">
        <span class="text-xs font-semibold text-info flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-info"></span>
          Départs validés
        </span>
        <span class="text-2xl font-black text-info">{{ stats.completed }}</span>
        <span class="text-[11px] text-base-content/50">Journées clôturées</span>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 flex flex-col gap-3">
      <!-- Recherche : pleine largeur du conteneur, cible confortable -->
      <div class="w-full">
        <label class="input input-bordered flex w-full items-center gap-2 rounded-m3-md bg-base-300/50 min-h-11">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="filterSearch"
            type="text"
            class="grow text-sm"
            placeholder="Rechercher un collaborateur (nom, email ou site)..."
          />
        </label>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <!-- Date -->
        <div class="fieldset">
          <label for="f-date" class="fieldset-legend text-xs font-semibold text-base-content/70">Date :</label>
          <input id="f-date" v-model="filterDate" type="date" class="input input-bordered min-h-11 rounded-m3-sm w-full sm:w-auto" />
        </div>

        <!-- Filtre Statut -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <span class="text-sm font-semibold text-base-content/60">Statut :</span>
          <div class="join join-vertical w-full sm:join-horizontal sm:w-auto">
            <button
              type="button"
              class="btn join-item w-full sm:w-auto min-h-11 px-3 rounded-t-m3-sm sm:rounded-l-m3-sm sm:rounded-tr-none"
              :class="{ 'btn-primary': filterStatus === '' }"
              @click="filterStatus = ''"
            >
              Tous ({{ statusCounts.all }})
            </button>
            <button
              type="button"
              class="btn join-item w-full sm:w-auto min-h-11 px-3"
              :class="{ 'btn-primary': filterStatus === 'present' }"
              @click="filterStatus = 'present'"
            >
              Présents ({{ statusCounts.present }})
            </button>
            <button
              type="button"
              class="btn join-item w-full sm:w-auto min-h-11 px-3"
              :class="{ 'btn-primary': filterStatus === 'late' }"
              @click="filterStatus = 'late'"
            >
              En retard ({{ statusCounts.late }})
            </button>
            <button
              type="button"
              class="btn join-item w-full sm:w-auto min-h-11 px-3 rounded-b-m3-sm sm:rounded-r-m3-sm sm:rounded-bl-none"
              :class="{ 'btn-primary': filterStatus === 'completed' }"
              @click="filterStatus = 'completed'"
            >
              Terminés ({{ statusCounts.completed }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading" class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-8 text-center text-sm text-base-content/60 flex items-center justify-center gap-2">
      <span class="loading loading-spinner loading-sm text-primary"></span>
      Chargement des pointages...
    </div>

    <!-- État vide -->
    <div v-else-if="!filteredPresences.length" class="card bg-base-200 border border-base-300 rounded-m3-lg p-8 text-center items-center">
      <div class="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center text-base-content/40 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      </div>
      <h3 class="font-bold text-base text-base-content">{{ emptyState.title }}</h3>
      <p class="text-sm text-base-content/60 mt-1 max-w-md mx-auto">{{ emptyState.message }}</p>
      <div class="mt-4">
        <button
          type="button"
          class="btn btn-primary min-h-11 rounded-m3-sm"
          @click="runEmptyAction"
        >
          {{ emptyState.actionLabel }}
        </button>
      </div>
    </div>

    <!-- Grille des pointages -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="p in filteredPresences"
        :key="p.id"
        class="card bg-base-200 border border-base-300 shadow-xs hover:border-primary/40 transition-all rounded-m3-lg p-5 flex flex-col gap-4"
      >
        <!-- Identité & Statut -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              {{ initials(p.profiles?.full_name) }}
            </div>
            <div class="min-w-0">
              <h3 class="font-bold text-sm text-base-content truncate">{{ p.profiles?.full_name || 'Utilisateur inconnu' }}</h3>
              <p class="text-xs text-base-content/60 truncate">{{ p.profiles?.email || 'Email inconnu' }}</p>
            </div>
          </div>
          <StatusBadge :status="p.status" />
        </div>

        <!-- Temps de présence -->
        <div class="grid grid-cols-3 gap-2 rounded-m3-md bg-base-300/50 border border-base-300/60 p-3">
          <div class="min-w-0">
            <p class="text-[11px] font-medium uppercase tracking-wide text-base-content/50">Arrivée</p>
            <p class="text-sm font-mono font-semibold text-base-content">{{ formatTime(p.check_in_time) }}</p>
          </div>
          <div class="min-w-0">
            <p class="text-[11px] font-medium uppercase tracking-wide text-base-content/50">Départ</p>
            <p class="text-sm font-mono font-semibold text-base-content">{{ formatTime(p.check_out_time) }}</p>
          </div>
          <div class="min-w-0">
            <p class="text-[11px] font-medium uppercase tracking-wide text-base-content/50">Durée</p>
            <p v-if="resolveSessionState(p) === 'closed'" class="text-sm font-semibold text-base-content">
              {{ formatSessionDuration(p) }}
            </p>
            <p v-else-if="resolveSessionState(p) === 'in_progress'" class="text-xs font-semibold text-warning flex items-center gap-1 mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
              En cours
            </p>
            <p
              v-else-if="resolveSessionState(p) === 'missing_checkout'"
              class="text-xs font-semibold text-warning flex items-center gap-1 mt-0.5"
              title="Arrivée pointée sans départ : durée indisponible tant que le pointage n'est pas corrigé"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-warning"></span>
              Départ manquant
            </p>
            <p v-else class="text-sm font-semibold text-base-content/50">—</p>
          </div>
        </div>

        <!-- Contexte : site, date, précision GPS -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-base-content/80">
          <span class="inline-flex items-center gap-1.5 min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span class="truncate">{{ p.locations?.name || 'Site central' }}</span>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>{{ formatWorkDate(p.work_date) || p.work_date }}</span>
          </span>
          <span class="badge badge-sm font-semibold gap-1 py-2.5 px-2" :class="accuracyBadge(p.check_in_accuracy).class">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="22" y1="12" x2="18" y2="12"></line>
              <line x1="6" y1="12" x2="2" y2="12"></line>
              <line x1="12" y1="6" x2="12" y2="2"></line>
              <line x1="12" y1="22" x2="12" y2="18"></line>
            </svg>
            {{ accuracyBadge(p.check_in_accuracy).label }}
          </span>
        </div>

        <!-- Actions -->
        <div v-if="profile?.role === 'admin'" class="flex items-center justify-end mt-auto pt-3 border-t border-base-300/60">
          <button
            type="button"
            class="btn btn-secondary btn-outline font-semibold rounded-m3-sm gap-1.5 min-h-11 px-3"
            title="Modifier le statut"
            @click="openEditModal(p)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Modifier</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de correction manuelle admin (DaisyUI Modal) -->
    <dialog :class="['modal', { 'modal-open': !!editingPresence }]">
      <div class="modal-box rounded-m3-xl max-w-sm sm:max-w-md p-6 gap-4 flex flex-col bg-base-100 border border-base-300 shadow-sm">
        <div class="flex items-center justify-between pb-2 border-b border-base-200">
          <h3 class="font-black text-xl text-base-content flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Correction manuelle</span>
          </h3>
          <button
            type="button"
            class="btn btn-circle btn-ghost min-w-11 min-h-11"
            aria-label="Fermer la modale"
            @click="editingPresence = null"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

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
          <select id="edit-st" v-model="editStatus" class="select select-bordered min-h-11 w-full rounded-m3-md">
            <option value="present">Présent (à l'heure)</option>
            <option value="late">En retard</option>
            <option value="completed">Terminé (à l'heure)</option>
            <option value="completed_late">Terminé (avec retard)</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        <div class="modal-action mt-2 pt-4 border-t border-base-200 gap-2">
          <button
            type="button"
            class="btn btn-ghost min-h-11 rounded-m3-sm font-medium"
            @click="editingPresence = null"
          >
            Annuler
          </button>
          <button
            type="button"
            class="btn btn-primary min-h-11 rounded-m3-sm font-bold shadow-xs px-4"
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
