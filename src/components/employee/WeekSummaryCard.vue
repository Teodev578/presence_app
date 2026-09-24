<script setup>
import { computed } from 'vue'
import {
  formatTime,
  calculateWorkDuration,
  calculateElapsedTime,
  formatHoursMinutes,
  formatWorkDate,
} from '../../lib/dateUtils'

const props = defineProps({
  recentPresences: {
    type: Array,
    default: () => [],
  },
  weekPresences: {
    type: Array,
    default: () => [],
  },
  weekTotalMinutes: {
    type: Number,
    default: 0,
  },
  weeklyTargetHours: {
    type: Number,
    default: 35,
  },
})

const emit = defineEmits(['openAvailabilities'])

// Calcul de la progression hebdomadaire vers l'objectif contractuel (35h)
const targetMinutes = computed(() => props.weeklyTargetHours * 60)

const progressPercent = computed(() => {
  if (targetMinutes.value <= 0) return 0
  const ratio = (props.weekTotalMinutes / targetMinutes.value) * 100
  return Math.min(100, Math.round(ratio))
})

const weekHoursFormatted = computed(() => {
  return formatHoursMinutes(props.weekTotalMinutes)
})

// Détermination de la durée pour chaque ligne d'historique
const getPresenceDuration = (presence) => {
  if (presence.check_in_time && presence.check_out_time) {
    return calculateWorkDuration(presence.check_in_time, presence.check_out_time)
  }
  if (presence.check_in_time && !presence.check_out_time) {
    return calculateElapsedTime(presence.check_in_time)
  }
  return '--'
}
</script>

<template>
  <div class="card bg-base-200 border border-base-300/60 shadow-xs rounded-m3-lg h-full flex flex-col justify-between">
    <div class="card-body p-5 sm:p-6 gap-4 flex-1 flex flex-col justify-between min-h-0">
      <!-- En-tête de la carte -->
      <div class="flex items-start justify-between shrink-0">
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-base-content/60">Cette semaine</span>
          <h2 class="text-xl font-bold text-base-content capitalize mt-0.5">Bilan & Activité</h2>
        </div>
        <span class="badge badge-primary py-2 px-2.5 rounded-m3-xs font-bold text-xs">
          {{ weekHoursFormatted }} / {{ weeklyTargetHours }}h
        </span>
      </div>

      <!-- Jauge de progression et métrique hebdomadaire -->
      <div class="bg-base-100/80 p-4 rounded-m3-md border border-base-300/40 flex flex-col gap-2.5 shrink-0">
        <div class="flex items-baseline justify-between">
          <span class="text-xs font-semibold text-base-content/70">Cumul hebdomadaire validé</span>
          <span class="text-sm font-extrabold text-primary">{{ progressPercent }}%</span>
        </div>

        <progress
          class="progress progress-primary w-full h-2 rounded-full"
          :value="progressPercent"
          max="100"
          :aria-valuenow="progressPercent"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Progression hebdomadaire de ${progressPercent}%`"
        ></progress>

        <div class="flex items-center justify-between text-[11px] text-base-content/60">
          <span>Objectif contractuel : {{ weeklyTargetHours }}h00</span>
          <span v-if="progressPercent >= 100" class="text-success font-semibold flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Objectif atteint
          </span>
          <span v-else class="text-base-content/50">
            Reste {{ formatHoursMinutes(Math.max(0, targetMinutes - weekTotalMinutes)) }}
          </span>
        </div>
      </div>

      <!-- Section Historique Récent extensible en hauteur -->
      <div class="flex-1 flex flex-col min-h-0 gap-2 my-1">
        <div class="flex items-center justify-between shrink-0">
          <span class="text-xs font-bold text-base-content/70 uppercase tracking-wider">
            Derniers pointages
          </span>
          <span class="text-[11px] text-base-content/50 font-medium">5 récents</span>
        </div>

        <!-- Liste des pointages récents -->
        <div v-if="recentPresences.length > 0" class="flex-1 flex flex-col gap-1.5 overflow-y-auto min-h-0">
          <div
            v-for="item in recentPresences"
            :key="item.id"
            class="flex items-center justify-between p-2.5 rounded-m3-sm bg-base-100/60 border border-base-300/30 text-xs transition-colors hover:bg-base-100"
          >
            <div class="flex items-center gap-2">
              <span
                class="w-2 h-2 rounded-full shrink-0"
                :class="item.check_out_time ? 'bg-success' : 'bg-warning animate-pulse'"
              ></span>
              <span class="font-semibold text-base-content">{{ formatWorkDate(item.work_date) }}</span>
            </div>

            <div class="flex items-center gap-3">
              <span class="font-mono text-base-content/70 text-[11px]">
                {{ formatTime(item.check_in_time) }} → {{ item.check_out_time ? formatTime(item.check_out_time) : 'En cours' }}
              </span>
              <span class="badge badge-ghost badge-sm font-semibold rounded-m3-xs py-1 px-2 text-[10px]">
                {{ getPresenceDuration(item) }}
              </span>
            </div>
          </div>
        </div>

        <!-- État vide centré et valorisé dans l'espace disponible -->
        <div
          v-else
          class="flex-1 flex flex-col items-center justify-center p-6 rounded-m3-md bg-base-100/40 border border-base-300/30 text-center gap-2 min-h-[130px]"
        >
          <div class="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center text-base-content/40">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <span class="text-xs text-base-content/60 font-medium max-w-xs">
            Aucun pointage antérieur enregistré cette semaine.
          </span>
        </div>
      </div>

      <!-- Action rapide vers les disponibilités ancrée en bas -->
      <div class="pt-2 mt-auto shrink-0">
        <button
          type="button"
          class="btn btn-ghost border border-base-300/80 w-full text-xs font-semibold min-h-12 rounded-m3-md gap-2 text-base-content/80 hover:text-base-content hover:bg-base-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          @click="emit('openAvailabilities')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>Consulter le planning complet de la semaine</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 ml-auto text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
