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
          <span class="text-[11px] text-base-content/50">Prévu à {{ expectedArrivalTime.slice(0, 5) }}</span>
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
          class="btn btn-primary w-full shadow-sm text-base font-bold min-h-12 active:scale-98 transition-transform gap-2"
          @click="emit('checkIn')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>Pointer l'arrivée</span>
        </button>

        <!-- Cas 2 : Arrivée validée mais pas de départ -->
        <button
          v-else-if="!presence.check_out_time"
          type="button"
          class="btn btn-warning text-warning-content w-full shadow-sm text-base font-bold min-h-12 active:scale-98 transition-transform gap-2"
          @click="emit('checkOut')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Pointer le départ</span>
        </button>

        <!-- Cas 3 : Journée achevée -->
        <div v-else class="alert alert-success/15 border border-success/30 text-success text-xs font-semibold py-2.5 justify-center rounded-xl">
          Journée enregistrée
        </div>

        <button
          type="button"
          class="btn btn-ghost border border-base-300 w-full text-xs font-semibold min-h-10 mt-1 gap-2 text-base-content/80 hover:text-base-content hover:bg-base-200"
          @click="emit('openAvailabilities')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>Gérer mes disponibilités</span>
        </button>
      </div>
    </div>
  </div>
</template>
