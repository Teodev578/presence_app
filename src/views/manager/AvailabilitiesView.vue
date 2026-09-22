<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { getMonday, formatWeekLabel } from '../../composables/useAvailabilities'

const selectedWeekStart = ref(getMonday())
const employees = ref([])
const availabilities = ref([])
const presences = ref([])
const loading = ref(true)

const daysHeader = [
  { id: 1, label: 'Lundi' },
  { id: 2, label: 'Mardi' },
  { id: 3, label: 'Mercredi' },
  { id: 4, label: 'Jeudi' },
  { id: 5, label: 'Vendredi' },
]

const nextWeek = () => {
  const d = new Date(selectedWeekStart.value)
  d.setDate(d.getDate() + 7)
  selectedWeekStart.value = d.toISOString().slice(0, 10)
}

const prevWeek = () => {
  const d = new Date(selectedWeekStart.value)
  d.setDate(d.getDate() - 7)
  selectedWeekStart.value = d.toISOString().slice(0, 10)
}

const loadData = async () => {
  loading.value = true
  try {
    const { data: profs } = await supabase
      .from('profiles')
      .select('*, teams(name)')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('full_name')

    employees.value = profs || []

    const { data: avails } = await supabase
      .from('availabilities')
      .select('*')
      .eq('week_start', selectedWeekStart.value)
      .is('deleted_at', null)

    availabilities.value = avails || []

    const baseDate = new Date(selectedWeekStart.value)
    const endDate = new Date(baseDate)
    endDate.setDate(baseDate.getDate() + 5)

    const { data: pres } = await supabase
      .from('presences')
      .select('*')
      .gte('work_date', selectedWeekStart.value)
      .lt('work_date', endDate.toISOString().slice(0, 10))
      .is('deleted_at', null)

    presences.value = pres || []
  } catch (err) {
    console.error('Erreur chargement planning équipe :', err)
  } finally {
    loading.value = false
  }
}

watch(selectedWeekStart, () => {
  loadData()
})

onMounted(() => {
  loadData()
})

const getDateForDay = (dayNumber) => {
  const d = new Date(selectedWeekStart.value)
  d.setDate(d.getDate() + (dayNumber - 1))
  return d.toISOString().slice(0, 10)
}

const getAvailability = (userId, dayNumber) => {
  return availabilities.value.find(
    (a) => a.user_id === userId && a.day_of_week === dayNumber
  )
}

const getActualPresence = (userId, dayNumber) => {
  const dateStr = getDateForDay(dayNumber)
  return presences.value.find((p) => p.user_id === userId && p.work_date === dateStr)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black tracking-tight text-base-content">Disponibilités de l'Équipe</h2>
        <p class="text-xs text-base-content/60 mt-0.5">
          Vue croisée : déclarations des collaborateurs et conformité des présences (Prévu vs Réel)
        </p>
      </div>

      <!-- Navigation temporelle DaisyUI -->
      <div class="card bg-base-100 border border-base-300 shadow-xs flex-row items-center gap-3 p-2 rounded-2xl">
        <button type="button" class="btn btn-circle btn-ghost btn-sm text-base" aria-label="Semaine précédente" @click="prevWeek">
          ←
        </button>
        <span class="text-xs font-bold text-base-content px-2">{{ formatWeekLabel(selectedWeekStart) }}</span>
        <button type="button" class="btn btn-circle btn-ghost btn-sm text-base" aria-label="Semaine suivante" @click="nextWeek">
          →
        </button>
      </div>
    </div>

    <!-- Tableau croisé matriciel DaisyUI -->
    <div class="card bg-base-100 border border-base-300 shadow-xs rounded-2xl overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-sm text-base-content/60 flex items-center justify-center gap-2">
        <span class="loading loading-spinner loading-sm text-primary"></span>
        Chargement de la grille d'équipe...
      </div>
      <div v-else-if="!employees.length" class="p-8 text-center text-sm text-base-content/60">
        Aucun collaborateur actif répertorié.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="table table-zebra table-sm w-full">
          <thead>
            <tr class="text-xs uppercase text-base-content/60">
              <th class="w-48">Collaborateur</th>
              <th v-for="d in daysHeader" :key="d.id" class="text-center">
                <div class="font-bold">{{ d.label }}</div>
                <div class="text-[11px] text-base-content/50 font-normal">{{ getDateForDay(d.id).slice(5) }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in employees" :key="emp.id" class="hover">
              <td>
                <div class="flex flex-col">
                  <strong class="text-sm font-bold text-base-content">{{ emp.full_name }}</strong>
                  <span class="badge badge-ghost badge-xs w-fit mt-0.5">{{ emp.teams?.name || 'Sans équipe' }}</span>
                </div>
              </td>

              <td v-for="d in daysHeader" :key="d.id" class="text-center">
                <div v-if="getAvailability(emp.id, d.id)" class="inline-flex flex-col items-center gap-1">
                  <span
                    class="badge badge-sm font-semibold"
                    :class="[
                      getActualPresence(emp.id, d.id)
                        ? 'badge-success text-success-content'
                        : getDateForDay(d.id) <= new Date().toISOString().slice(0, 10)
                          ? 'badge-warning text-warning-content'
                          : 'badge-info badge-outline'
                    ]"
                  >
                    ✓ Dispo
                  </span>
                  <span
                    v-if="getActualPresence(emp.id, d.id)"
                    class="text-[10px] font-bold text-success"
                  >
                    Pointé ({{ getActualPresence(emp.id, d.id)?.status }})
                  </span>
                  <span
                    v-else-if="getDateForDay(d.id) <= new Date().toISOString().slice(0, 10)"
                    class="text-[10px] font-medium text-warning"
                  >
                    Non pointé
                  </span>
                </div>
                <span v-else class="text-base-content/30 text-xs">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
