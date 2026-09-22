<script setup>
import { computed } from 'vue'
import StatusBadge from '../shared/StatusBadge.vue'

const props = defineProps({
  presence: {
    type: Object,
    default: null,
  },
  expectedArrivalTime: {
    type: String,
    default: '09:00:00',
  },
})

const emit = defineEmits(['checkIn', 'checkOut', 'openAvailabilities'])

const todayFormatted = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
})

const formatTime = (isoStr) => {
  if (!isoStr) return '--:--'
  const d = new Date(isoStr)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="card bg-base-100 shadow-sm border border-base-300 rounded-2xl">
    <div class="card-body p-5 sm:p-6 gap-4">
      <!-- En-tête de la carte -->
      <div class="flex items-start justify-between">
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-base-content/60">Aujourd'hui</span>
          <h2 class="text-xl font-bold text-base-content capitalize mt-0.5">{{ todayFormatted }}</h2>
        </div>
        <StatusBadge v-if="presence" :status="presence.status" />
        <span v-else class="badge badge-ghost badge-sm py-2 px-2.5">Non pointé</span>
      </div>

      <!-- Détails des horaires -->
      <div class="grid grid-cols-2 gap-3 bg-base-200/60 p-4 rounded-xl border border-base-200">
        <div class="flex flex-col items-center">
          <span class="text-xs font-semibold text-base-content/60">Arrivée</span>
          <span class="text-2xl font-bold text-base-content tracking-tight my-0.5">
            {{ presence?.check_in_time ? formatTime(presence.check_in_time) : '--:--' }}
          </span>
          <span class="text-[11px] text-base-content/50">Attendu : {{ expectedArrivalTime.slice(0, 5) }}</span>
        </div>

        <div class="flex flex-col items-center border-l border-base-300">
          <span class="text-xs font-semibold text-base-content/60">Départ</span>
          <span class="text-2xl font-bold text-base-content tracking-tight my-0.5">
            {{ presence?.check_out_time ? formatTime(presence.check_out_time) : '--:--' }}
          </span>
          <span class="text-[11px] text-base-content/50">{{ presence?.check_out_time ? 'Validé' : 'En attente' }}</span>
        </div>
      </div>

      <!-- Actions principales contextuelles -->
      <div class="card-actions flex flex-col gap-2.5 mt-2">
        <!-- Cas 1 : Aucun pointage d'arrivée -->
        <button
          v-if="!presence"
          type="button"
          class="btn btn-success text-white w-full shadow-md text-base font-bold min-h-12 active:scale-98 transition-transform"
          @click="emit('checkIn')"
        >
          <span>📍</span>
          Pointer mon arrivée
        </button>

        <!-- Cas 2 : Arrivée validée mais pas de départ -->
        <button
          v-else-if="!presence.check_out_time"
          type="button"
          class="btn btn-warning text-white w-full shadow-md text-base font-bold min-h-12 active:scale-98 transition-transform"
          @click="emit('checkOut')"
        >
          <span>🏁</span>
          Pointer mon départ
        </button>

        <!-- Cas 3 : Journée achevée -->
        <div v-else class="alert alert-success py-3 text-sm font-semibold justify-center">
          ✓ Journée entièrement enregistrée.
        </div>

        <button
          type="button"
          class="btn btn-outline btn-primary w-full text-sm font-semibold min-h-10 mt-1"
          @click="emit('openAvailabilities')"
        >
          <span>📅</span>
          Mes disponibilités de la semaine
        </button>
      </div>
    </div>
  </div>
</template>
