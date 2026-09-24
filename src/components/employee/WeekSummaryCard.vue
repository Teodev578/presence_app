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
  <div class="card bg-base-200 border border-base-300/60 shadow-xs rounded-m3-lg h-full flex flex-col justify-between overflow-hidden">
    <div class="card-body p-3.5 sm:p-4.5 lg:p-5 gap-2.5 sm:gap-3 flex-1 flex flex-col justify-between min-h-0">
      <!-- En-tête de la carte avec typographie rehaussée -->
      <div class="flex items-start justify-between shrink-0 gap-2">
        <div>
          <span class="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-base-content/60">Cette semaine</span>
          <h2 class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-base-content capitalize mt-0.5 tracking-tight leading-tight">
            Bilan & Activité
          </h2>
        </div>
        <span class="badge badge-primary py-1.5 px-2.5 rounded-m3-sm font-bold text-xs sm:text-sm shrink-0 shadow-xs">
          {{ weekHoursFormatted }} / {{ weeklyTargetHours }}h
        </span>
      </div>

      <!-- Jauge de progression et métriques enrichies -->
      <div class="bg-base-100/90 p-3 sm:p-3.5 lg:p-4 rounded-m3-lg border border-base-300/50 flex flex-col gap-2.5 shadow-xs shrink-0">
        <div class="flex items-baseline justify-between">
          <span class="text-xs sm:text-sm font-bold text-base-content/75 uppercase tracking-wider">Cumul hebdomadaire</span>
          <span class="text-lg sm:text-xl lg:text-2xl font-black text-primary font-mono">{{ progressPercent }}%</span>
        </div>

        <progress
          class="progress progress-primary w-full h-2.5 rounded-full bg-base-200"
          :value="progressPercent"
          max="100"
          :aria-valuenow="progressPercent"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Progression hebdomadaire de ${progressPercent}%`"
        ></progress>

        <!-- Mini-tuiles statistiques métriques compactes -->
        <div class="grid grid-cols-2 gap-2 sm:gap-2.5 pt-0.5">
          <div class="flex items-center gap-2 p-2 rounded-m3-sm bg-base-200/60 border border-base-300/40">
            <div class="w-6 h-6 rounded-full bg-base-300/80 text-base-content/70 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-[10px] font-semibold text-base-content/50 uppercase tracking-wider">Objectif</span>
              <span class="text-xs sm:text-sm font-bold text-base-content truncate">{{ weeklyTargetHours }}h00</span>
            </div>
          </div>

          <div class="flex items-center gap-2 p-2 rounded-m3-sm bg-base-200/60 border border-base-300/40">
            <div
              class="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
              :class="progressPercent >= 100 ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary'"
            >
              <svg v-if="progressPercent >= 100" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 14 14"></polyline>
              </svg>
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-[10px] font-semibold text-base-content/50 uppercase tracking-wider">Reste</span>
              <span
                class="text-xs sm:text-sm font-bold truncate"
                :class="progressPercent >= 100 ? 'text-success' : 'text-base-content'"
              >
                {{ progressPercent >= 100 ? 'Atteint' : formatHoursMinutes(Math.max(0, targetMinutes - weekTotalMinutes)) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Historique Récent extensible en hauteur -->
      <div class="flex-1 flex flex-col min-h-0 gap-2 my-0.5">
        <div class="flex items-center justify-between shrink-0">
          <span class="text-[11px] sm:text-xs font-bold text-base-content/75 uppercase tracking-wider">
            Derniers pointages
          </span>
          <span class="badge badge-ghost text-[10px] font-semibold py-0.5 px-2 rounded-m3-xs text-base-content/60">
            {{ recentPresences.length }} / 5 récents
          </span>
        </div>

        <!-- Liste des pointages récents -->
        <div v-if="recentPresences.length > 0" class="flex-1 flex flex-col gap-1.5 overflow-y-auto min-h-0">
          <div
            v-for="item in recentPresences"
            :key="item.id"
            class="flex items-center justify-between p-2.5 rounded-m3-md bg-base-100/70 border border-base-300/40 text-xs transition-colors hover:bg-base-100 shadow-xs"
          >
            <div class="flex items-center gap-2">
              <span
                class="w-2 h-2 rounded-full shrink-0"
                :class="item.check_out_time ? 'bg-success' : 'bg-warning animate-pulse'"
              ></span>
              <span class="font-bold text-base-content">{{ formatWorkDate(item.work_date) }}</span>
            </div>

            <div class="flex items-center gap-2.5">
              <span class="font-mono text-base-content/75 text-[11px] sm:text-xs">
                {{ formatTime(item.check_in_time) }} → {{ item.check_out_time ? formatTime(item.check_out_time) : 'En cours' }}
              </span>
              <span class="badge badge-ghost font-bold rounded-m3-xs py-0.5 px-1.5 text-[10px] sm:text-[11px]">
                {{ getPresenceDuration(item) }}
              </span>
            </div>
          </div>
        </div>

        <!-- État vide chaleureux et centré dans l'espace disponible -->
        <div
          v-else
          class="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 rounded-m3-lg bg-base-100/70 border border-base-300/40 text-center gap-2 min-h-[90px]"
        >
          <div class="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div class="flex flex-col gap-0.5 max-w-xs">
            <span class="text-xs sm:text-sm font-bold text-base-content">
              Aucun pointage antérieur cette semaine
            </span>
            <span class="text-[11px] sm:text-xs text-base-content/60 leading-normal">
              Vos pointages enregistrés s'afficheront ici.
            </span>
          </div>
        </div>
      </div>

      <!-- Action rapide vers les disponibilités ancrée en bas -->
      <div class="pt-2 mt-auto shrink-0 border-t border-base-300/40">
        <button
          type="button"
          class="btn btn-ghost border border-base-300/80 w-full text-xs sm:text-sm font-semibold min-h-11 rounded-m3-md gap-2 text-base-content/85 hover:text-base-content hover:bg-base-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
