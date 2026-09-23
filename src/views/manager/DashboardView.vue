<script setup>
import { ref, onMounted, computed, h } from 'vue'
import { useRouter } from '../../router'
import { supabase } from '../../lib/supabase'
import { useLocations } from '../../composables/useLocations'
import StatCard from '../../components/manager/StatCard.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'

const { navigate } = useRouter()
const { locations, ensureLoaded: loadLocations } = useLocations()

const createIcon = (paths) => () =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      class: 'w-5 h-5 shrink-0',
    },
    paths.map(([tag, attrs]) => h(tag, attrs))
  )

const iconUsers = createIcon([
  ['path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }],
  ['circle', { cx: '9', cy: '7', r: '4' }],
  ['path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }],
  ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }],
])

const iconCheck = createIcon([
  ['path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }],
  ['polyline', { points: '22 4 12 14.01 9 11.01' }],
])

const iconClockAlert = createIcon([
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['polyline', { points: '12 6 12 12 16 14' }],
])

const iconAlertTriangle = createIcon([
  ['path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }],
  ['line', { x1: '12', y1: '9', x2: '12', y2: '13' }],
  ['line', { x1: '12', y1: '17', x2: '12.01', y2: '17' }],
])

const todayStr = new Date().toISOString().slice(0, 10)
const loading = ref(true)

const totalEmployees = ref(0)
const presencesToday = ref([])

onMounted(async () => {
  loading.value = true
  try {
    const { count: empCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('deleted_at', null)

    totalEmployees.value = empCount || 0

    const { data: presences } = await supabase
      .from('presences')
      .select('*, profiles(full_name, email, role), locations(name)')
      .eq('work_date', todayStr)
      .is('deleted_at', null)
      .order('check_in_time', { ascending: false })

    presencesToday.value = presences || []
    await loadLocations()
  } catch (err) {
    console.error('Erreur chargement dashboard manager :', err)
  } finally {
    loading.value = false
  }
})

const activeLocationsCount = computed(() => {
  return (locations.value || []).filter((l) => l.is_active).length
})

const onTimeCount = computed(() => {
  return presencesToday.value.filter((p) => p.status === 'present' || p.status === 'completed')
    .length
})

const lateCount = computed(() => {
  return presencesToday.value.filter((p) => p.status === 'late').length
})

const absentCount = computed(() => {
  const total = totalEmployees.value
  const presentOrLate = presencesToday.value.length
  return Math.max(0, total - presentOrLate)
})

const formatTime = (iso) => {
  if (!iso) return '--:--'
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black tracking-tight text-base-content">Tableau de bord de l'activité</h2>
        <p class="text-xs text-base-content/60 mt-0.5">Statut des effectifs pour la journée du {{ todayStr }}</p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-outline btn-sm rounded-m3-sm font-bold gap-1.5"
          @click="navigate('/manager/locations')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>Sites autorisés ({{ activeLocationsCount }})</span>
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm rounded-m3-sm font-bold shadow-xs"
          @click="navigate('/manager/presences')"
        >
          Voir tous les pointages →
        </button>
      </div>
    </div>

    <!-- Grille des statistiques clés (DaisyUI Stats) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Effectif Actif"
        :value="totalEmployees"
        :icon="iconUsers"
        subtitle="Employés enregistrés"
        color="blue"
      />
      <StatCard
        title="Présents à l'heure"
        :value="onTimeCount"
        :icon="iconCheck"
        subtitle="Pointages conformes"
        color="green"
      />
      <StatCard
        title="Retards signalés"
        :value="lateCount"
        :icon="iconClockAlert"
        subtitle="Arrivée après horaire"
        color="amber"
      />
      <StatCard
        title="Non pointés / Absents"
        :value="absentCount"
        :icon="iconAlertTriangle"
        subtitle="En attente de pointage"
        color="red"
      />
    </div>

    <!-- Derniers pointages récents (DaisyUI Card & Table) -->
    <div class="card bg-base-100 border border-base-300 shadow-xs rounded-m3-lg overflow-hidden">
      <div class="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
        <h3 class="text-sm font-bold text-base-content">Derniers pointages enregistrés aujourd'hui</h3>
        <span class="badge badge-primary badge-sm font-semibold">{{ presencesToday.length }} pointage(s)</span>
      </div>

      <div v-if="loading" class="p-8 text-center text-sm text-base-content/60 flex items-center justify-center gap-2">
        <span class="loading loading-spinner loading-sm text-primary"></span>
        Chargement des données en cours...
      </div>

      <div v-else-if="!presencesToday.length" class="p-8 text-center text-sm text-base-content/60">
        Aucun pointage enregistré pour le moment aujourd'hui.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="table table-zebra table-sm w-full">
          <thead>
            <tr class="text-xs uppercase text-base-content/60">
              <th>Collaborateur</th>
              <th>Site</th>
              <th>Arrivée</th>
              <th>Départ</th>
              <th>Statut</th>
              <th>Précision GPS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in presencesToday.slice(0, 8)" :key="p.id" class="hover">
              <td>
                <div class="flex flex-col">
                  <strong class="text-sm font-bold text-base-content">{{ p.profiles?.full_name || 'Utilisateur inconnu' }}</strong>
                  <span class="text-xs text-base-content/60">{{ p.profiles?.email }}</span>
                </div>
              </td>
              <td class="text-xs text-base-content/80">{{ p.locations?.name || 'Site principal' }}</td>
              <td class="font-mono text-xs font-semibold">{{ formatTime(p.check_in_time) }}</td>
              <td class="font-mono text-xs font-semibold">{{ formatTime(p.check_out_time) }}</td>
              <td>
                <StatusBadge :status="p.status" />
              </td>
              <td class="text-xs text-base-content/60">±{{ Math.round(p.check_in_accuracy) }} m</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
