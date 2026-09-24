<script setup>
import { computed } from 'vue'
import { useRouter } from '../../router'
import { useProfile } from '../../composables/useProfile'
import { usePresences } from '../../composables/usePresences'
import DayCard from '../../components/employee/DayCard.vue'
import WeekSummaryCard from '../../components/employee/WeekSummaryCard.vue'

const { navigate } = useRouter()
const { profile } = useProfile()
const {
  todayPresence,
  recentPresences,
  weekPresences,
  weekTotalMinutes,
} = usePresences()

const displayName = computed(() => {
  if (!profile.value?.full_name) return ''
  const parts = profile.value.full_name.trim().split(' ')
  return parts[0]
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-baseline justify-between">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-base-content tracking-tight">
          Bonjour{{ displayName ? ` ${displayName}` : '' }}
        </h1>
        <p class="text-xs md:text-sm text-base-content/60 mt-0.5">
          Espace de pointage personnel
        </p>
      </div>
    </div>

    <!-- Grille adaptative : mono-colonne sur mobile/tablette, 2 colonnes asymétriques dès grand écran (lg: 1024px) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <!-- Colonne principale : Carte statut du jour (7/12) -->
      <div class="lg:col-span-7">
        <DayCard
          :presence="todayPresence"
          :expected-arrival-time="profile?.expected_arrival_time || '09:00:00'"
          @check-in="navigate('/employee/check-in')"
          @check-out="navigate('/employee/check-out')"
          @open-availabilities="navigate('/employee/availabilities')"
        />
      </div>

      <!-- Colonne compagnon : Synthèse hebdomadaire et activité récente (5/12) -->
      <div class="lg:col-span-5">
        <WeekSummaryCard
          :recent-presences="recentPresences"
          :week-presences="weekPresences"
          :week-total-minutes="weekTotalMinutes"
          @open-availabilities="navigate('/employee/availabilities')"
        />
      </div>
    </div>
  </div>
</template>
