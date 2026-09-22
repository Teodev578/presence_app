<script setup>
import { useRouter } from '../../router'
import { useProfile } from '../../composables/useProfile'
import { usePresences } from '../../composables/usePresences'
import DayCard from '../../components/employee/DayCard.vue'

const { navigate } = useRouter()
const { profile } = useProfile()
const { todayPresence } = usePresences()
</script>

<template>
  <div class="flex flex-col gap-5 max-w-lg mx-auto">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-black text-base-content tracking-tight">
          Bonjour, {{ profile?.full_name || 'Collaborateur' }} 👋
        </h1>
        <p class="text-xs text-base-content/60 mt-0.5 flex items-center gap-1.5">
          <span>Rôle :</span>
          <span class="badge badge-sm badge-outline capitalize font-semibold">{{ profile?.role || 'Employé' }}</span>
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

    <!-- Conseils rapides -->
    <div class="alert alert-info bg-info/10 border-info/20 text-info text-xs py-3 rounded-2xl flex items-start gap-2.5">
      <span class="text-base select-none">💡</span>
      <div class="text-xs leading-relaxed text-base-content/80">
        <strong class="text-base-content font-bold">Pensez à déclarer vos disponibilités</strong> pour la semaine prochaine afin de faciliter l'organisation des plannings.
      </div>
    </div>
  </div>
</template>
