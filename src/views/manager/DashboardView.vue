<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from '../../router'
import { supabase } from '../../lib/supabase'
import { useLocations } from '../../composables/useLocations'
import StatCard from '../../components/manager/StatCard.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'

const { navigate } = useRouter()
const { locations, ensureLoaded: loadLocations } = useLocations()

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
          class="btn btn-outline btn-sm rounded-xl font-bold gap-1.5"
          @click="navigate('/manager/locations')"
        >
          <span>📍</span>
          <span>Sites autorisés ({{ activeLocationsCount }})</span>
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm rounded-xl font-bold shadow-xs"
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
        icon="👥"
        subtitle="Employés enregistrés"
        color="blue"
      />
      <StatCard
        title="Présents à l'heure"
        :value="onTimeCount"
        icon="✅"
        subtitle="Pointages conformes"
        color="green"
      />
      <StatCard
        title="Retards signalés"
        :value="lateCount"
        icon="⏰"
        subtitle="Arrivée après horaire"
        color="amber"
      />
      <StatCard
        title="Non pointés / Absents"
        :value="absentCount"
        icon="⚠️"
        subtitle="En attente de pointage"
        color="red"
      />
    </div>

    <!-- Derniers pointages récents (DaisyUI Card & Table) -->
    <div class="card bg-base-100 border border-base-300 shadow-xs rounded-2xl overflow-hidden">
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
