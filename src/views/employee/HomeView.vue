<script setup>
import { computed } from 'vue'
import { useRouter } from '../../router'
import { useProfile } from '../../composables/useProfile'
import { usePresences } from '../../composables/usePresences'
import DayCard from '../../components/employee/DayCard.vue'

const { navigate } = useRouter()
const { profile } = useProfile()
const { todayPresence } = usePresences()

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
        <h1 class="text-2xl font-bold text-base-content tracking-tight">
          Bonjour{{ displayName ? ` ${displayName}` : '' }}
        </h1>
        <p class="text-xs text-base-content/60 mt-0.5">
          Espace de pointage personnel
        </p>
      </div>
    </div>

    <!-- Carte statut du jour -->
    <DayCard
      :presence="todayPresence"
      :expected-arrival-time="profile?.expected_arrival_time || '09:00:00'"
      @check-in="navigate('/employee/check-in')"
      @check-out="navigate('/employee/check-out')"
      @open-availabilities="navigate('/employee/availabilities')"
    />
  </div>
</template>
