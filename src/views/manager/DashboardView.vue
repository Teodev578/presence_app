<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from '../../router'
import { db, useLiveQuery } from '../../lib/db'
import { getLocalDateString, formatTime, formatWorkDate, formatSessionDuration, resolveSessionState } from '../../lib/dateUtils'
import { useLocations, isLocationActive } from '../../composables/domain/useLocations.js'
import ManagerPageHeader from '../../components/manager/ManagerPageHeader.vue'
import ManagerKpiCard from '../../components/manager/ManagerKpiCard.vue'
import ManagerEmptyState from '../../components/manager/ManagerEmptyState.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'

const { navigate } = useRouter()
const { locations, ensureLoaded: loadLocations } = useLocations()

// Date locale, sans dérive UTC : un pointage du soir ne doit pas basculer sur la veille.
const todayStr = getLocalDateString()

// Date du jour en clair : le gestionnaire situe la journée sans décoder un ISO.
const todayLabel = computed(() => {
  const label = formatWorkDate(todayStr, { long: true }) || todayStr
  return label.charAt(0).toUpperCase() + label.slice(1)
})

// Lecture réactive depuis Dexie. L'écran ne tire rien du réseau : l'engine rapatrie,
// Dexie expose, la vue se rafraîchit seule sans flash de chargement.
const profileRows = useLiveQuery(async () => db.profiles.toArray())
const presenceRows = useLiveQuery(async () =>
  db.presences
    .where('work_date')
    .equals(todayStr)
    .filter((p) => !p.deleted_at)
    .toArray()
)
const localLocations = useLiveQuery(async () => db.locations.toArray())

const isLoading = computed(() => presenceRows.value === undefined || profileRows.value === undefined)

const totalEmployees = computed(() =>
  (profileRows.value || []).filter((p) => p.is_active !== false && !p.deleted_at).length
)

const presencesToday = computed(() => {
  if (!presenceRows.value) return []
  const profilesMap = new Map((profileRows.value || []).map((pr) => [pr.id, pr]))
  const locationsMap = new Map((localLocations.value || []).map((loc) => [loc.id, loc]))
  return presenceRows.value
    .map((p) => ({
      ...p,
      profiles: profilesMap.get(p.user_id) || null,
      locations: locationsMap.get(p.location_id) || null,
    }))
    .sort((a, b) => String(b.check_in_time || '').localeCompare(String(a.check_in_time || '')))
})

onMounted(() => {
  // Amorçage du cache local des sites quand il est vide : l'écriture va dans Dexie, pas dans la vue.
  loadLocations()
})

const activeLocationsCount = computed(() => {
  return (locations.value || []).filter(isLocationActive).length
})

// Sémantique alignée sur la vue des pointages : les pointages effectifs portent une arrivée,
// l'absence déclarée est un statut à part, et le reste de l'effectif n'a simplement pas pointé.
const presenceStats = computed(() => {
  const list = presencesToday.value || []
  const pointed = list.filter((p) => p.status !== 'absent').length
  const onTime = list.filter((p) => p.status === 'present' || p.status === 'completed').length
  const late = list.filter((p) => p.status === 'late' || p.status === 'completed_late').length
  const declaredAbsent = list.filter((p) => p.status === 'absent').length
  const notPointed = Math.max(0, totalEmployees.value - pointed - declaredAbsent)
  return { pointed, onTime, late, declaredAbsent, notPointed }
})

const formatTimeSafe = (iso) => (iso ? formatTime(iso) : '--:--')

// Initiales pour l'avatar de fiche, partagées avec le tableau d'audit.
const initials = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}

// Précision GPS : garde anti NaN, couple libellé/couleur selon la tolérance de pointage.
const accuracyBadge = (accuracy) => {
  const value = Number(accuracy)
  if (!Number.isFinite(value)) return { label: 'GPS —', class: 'badge-soft text-base-content/60' }
  const rounded = Math.round(value)
  if (rounded <= 15) return { label: `±${rounded} m`, class: 'badge-success text-success-content' }
  if (rounded <= 50) return { label: `±${rounded} m`, class: 'badge-warning text-warning-content' }
  return { label: `±${rounded} m`, class: 'badge-soft text-base-content/60' }
}

const goToPresences = () => navigate('/manager/presences')
</script>

<template>
  <div class="flex flex-col gap-6">
    <ManagerPageHeader
      title="Tableau de bord"
      :subtitle="`Pointages du ${todayLabel}`"
    >
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      </template>

      <template #actions>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
          <button
            type="button"
            class="btn btn-outline rounded-m3-sm font-bold min-h-11 flex items-center justify-center gap-2 px-3 sm:px-4 active:scale-95 transition-transform duration-150"
            @click="navigate('/manager/locations')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span class="truncate">Lieux de travail ({{ activeLocationsCount }})</span>
          </button>
          <button
            type="button"
            class="btn btn-primary rounded-m3-sm font-bold shadow-xs min-h-11 flex items-center justify-center px-4 active:scale-95 transition-transform duration-150"
            @click="goToPresences"
          >
            <span class="truncate">Voir tous les pointages</span>
          </button>
        </div>
      </template>
    </ManagerPageHeader>

    <!-- Bandeau KPI : chaque carte mène au détail des pointages -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <ManagerKpiCard
        label="Équipe"
        :value="totalEmployees"
        caption="Personnes inscrites"
        tone="primary"
      />
      <ManagerKpiCard
        label="Pointés"
        :value="presenceStats.pointed"
        caption="Sur site ou journée finie"
        tone="success"
        clickable
        @select="goToPresences"
      />
      <ManagerKpiCard
        label="En retard"
        :value="presenceStats.late"
        caption="Arrivées tardives"
        tone="warning"
        clickable
        @select="goToPresences"
      />
      <ManagerKpiCard
        label="Non pointés"
        :value="presenceStats.notPointed"
        :caption="presenceStats.declaredAbsent > 1
          ? `${presenceStats.declaredAbsent} absences déclarées comprises`
          : presenceStats.declaredAbsent === 1
            ? '1 absence déclarée comprise'
            : 'Sans pointage ni absence prévue'"
        tone="error"
        clickable
        @select="goToPresences"
      />
    </div>

    <!-- Activité récente : fiches sous 640px, tableau d'audit au-delà -->
    <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg overflow-hidden">
      <div class="p-4 sm:p-5 border-b border-base-300/60 flex items-center justify-between gap-3">
        <h3 class="text-sm font-bold text-base-content">Derniers pointages aujourd'hui</h3>
        <span class="badge badge-primary badge-sm font-semibold shrink-0">{{ presencesToday.length === 1 ? '1 pointage' : `${presencesToday.length} pointages` }}</span>
      </div>

      <!-- Skeleton de chargement anti-FOUC -->
      <div v-if="isLoading" class="p-6 flex flex-col gap-3 animate-pulse" aria-busy="true" aria-label="Chargement des pointages">
        <div v-for="i in 3" :key="i" class="flex items-center justify-between py-2 border-b border-base-300/40 last:border-b-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-base-300 skeleton"></div>
            <div class="flex flex-col gap-1.5">
              <div class="h-4 bg-base-300 rounded-m3-xs w-32 skeleton"></div>
              <div class="h-3 bg-base-300 rounded-m3-xs w-20 skeleton"></div>
            </div>
          </div>
          <div class="h-6 bg-base-300 rounded-m3-xs w-16 skeleton"></div>
        </div>
      </div>

      <ManagerEmptyState
        v-else-if="!presencesToday.length"
        bare
        icon="calendar"
        title="Aucun pointage aujourd'hui"
        message="Personne n'a pointé pour le moment. Vérifiez vos sites ou consultez l'historique."
        action-label="Voir tous les pointages"
        @action="goToPresences"
      />

      <template v-else>
        <!-- Fiches synthétiques sous 640px -->
        <ul class="sm:hidden divide-y divide-base-300">
          <li v-for="p in presencesToday.slice(0, 8)" :key="p.id" class="p-4 flex flex-col gap-3">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0" aria-hidden="true">
                  {{ initials(p.profiles?.full_name) }}
                </div>
                <div class="min-w-0">
                  <strong class="block text-sm font-bold text-base-content truncate">{{ p.profiles?.full_name || 'Utilisateur inconnu' }}</strong>
                  <span class="block text-xs text-base-content/60 truncate">{{ p.locations?.name || 'Site principal' }}</span>
                </div>
              </div>
              <StatusBadge :status="p.status" />
            </div>

            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span class="font-mono font-semibold text-base-content">Arrivée {{ formatTimeSafe(p.check_in_time) }}</span>
              <span class="font-mono font-semibold text-base-content">Départ {{ formatTimeSafe(p.check_out_time) }}</span>
              <span v-if="resolveSessionState(p) === 'closed'" class="font-semibold text-base-content">Durée {{ formatSessionDuration(p) }}</span>
              <span v-else-if="resolveSessionState(p) === 'in_progress'" class="inline-flex items-center gap-1 font-semibold text-warning">
                <span class="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
                En cours
              </span>
            </div>

            <span class="badge badge-sm font-semibold gap-1 py-2.5 px-2 self-start" :class="accuracyBadge(p.check_in_accuracy).class">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="22" y1="12" x2="18" y2="12"></line>
                <line x1="6" y1="12" x2="2" y2="12"></line>
                <line x1="12" y1="6" x2="12" y2="2"></line>
                <line x1="12" y1="22" x2="12" y2="18"></line>
              </svg>
              {{ accuracyBadge(p.check_in_accuracy).label }}
            </span>
          </li>
        </ul>

        <!-- Tableau d'audit à partir de 640px -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="table table-sm w-full">
            <thead>
              <tr class="text-xs uppercase text-base-content/60">
                <th>Collaborateur</th>
                <th>Site</th>
                <th>Arrivée</th>
                <th>Départ</th>
                <th>Durée</th>
                <th>Statut</th>
                <th>Précision GPS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in presencesToday.slice(0, 8)" :key="p.id" class="hover">
                <td>
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0" aria-hidden="true">
                      {{ initials(p.profiles?.full_name) }}
                    </div>
                    <div class="min-w-0">
                      <strong class="block text-sm font-bold text-base-content truncate">{{ p.profiles?.full_name || 'Utilisateur inconnu' }}</strong>
                      <span class="block text-xs text-base-content/60 truncate">{{ p.profiles?.email || 'Email inconnu' }}</span>
                    </div>
                  </div>
                </td>
                <td class="text-xs text-base-content/80">{{ p.locations?.name || 'Site principal' }}</td>
                <td class="font-mono text-xs font-semibold">{{ formatTimeSafe(p.check_in_time) }}</td>
                <td class="font-mono text-xs font-semibold">{{ formatTimeSafe(p.check_out_time) }}</td>
                <td>
                  <span v-if="resolveSessionState(p) === 'closed'" class="text-xs font-semibold text-base-content">{{ formatSessionDuration(p) }}</span>
                  <span v-else-if="resolveSessionState(p) === 'in_progress'" class="text-xs font-semibold text-warning inline-flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
                    En cours
                  </span>
                  <span v-else-if="resolveSessionState(p) === 'missing_checkout'" class="text-xs font-semibold text-warning">Départ manquant</span>
                  <span v-else class="text-xs font-semibold text-base-content/50">—</span>
                </td>
                <td><StatusBadge :status="p.status" /></td>
                <td>
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
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>
