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
  <div class="flex flex-col flex-1 min-h-0 gap-2 sm:gap-3 md:gap-3.5 h-full overflow-y-auto md:overflow-hidden pb-4 md:pb-0">
    <div class="flex items-baseline justify-between shrink-0">
      <div>
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-base-content tracking-tight">
          Bonjour{{ displayName ? ` ${displayName}` : '' }}
        </h1>
        <p class="text-xs sm:text-sm text-base-content/60 mt-0.5">
          Espace de pointage personnel
        </p>
      </div>
    </div>

    <!-- Grille adaptative : mono-colonne sur mobile (ordre inversé), 2 colonnes dès tablette (md: 768px) et grand écran (lg: 1024px) -->
    <div class="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-3.5 md:gap-4 lg:gap-5 xl:gap-6 items-stretch flex-1 min-h-0">
      <!-- Carte statut du jour (en 2e position sur mobile, colonne gauche 6/12 tablette, 7/12 desktop) -->
      <div class="order-2 md:order-1 md:col-span-6 lg:col-span-7 flex flex-col min-h-0">
        <DayCard
          :presence="todayPresence"
          :expected-arrival-time="profile?.expected_arrival_time || '09:00:00'"
          @check-in="navigate('/employee/check-in')"
          @check-out="navigate('/employee/check-out')"
          @open-availabilities="navigate('/employee/availabilities')"
        />
      </div>

      <!-- Carte synthèse hebdomadaire (en 1re position sur mobile, colonne droite 6/12 tablette, 5/12 desktop) -->
      <div class="order-1 md:order-2 md:col-span-6 lg:col-span-5 flex flex-col min-h-0">
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
