<script setup>
import { computed } from 'vue'
import StatusBadge from '../shared/StatusBadge.vue'
import { formatTime, calculateWorkDuration, calculateElapsedTime } from '../../lib/dateUtils'

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

const workDuration = computed(() => {
  if (props.presence?.check_in_time && props.presence?.check_out_time) {
    return calculateWorkDuration(props.presence.check_in_time, props.presence.check_out_time)
  }
  if (props.presence?.check_in_time) {
    return calculateElapsedTime(props.presence.check_in_time)
  }
  return null
})
</script>

<template>
  <div class="card bg-base-200 border border-base-300/60 shadow-xs rounded-m3-lg h-full flex flex-col justify-between overflow-hidden">
    <div class="card-body p-3.5 sm:p-4.5 lg:p-5 gap-2.5 sm:gap-3 flex-1 flex flex-col justify-between min-h-0">
      <!-- En-tête de la carte -->
      <div class="flex items-start justify-between shrink-0 gap-2">
        <div>
          <span class="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-base-content/60">Aujourd'hui</span>
          <h2 class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-base-content capitalize mt-0.5 tracking-tight leading-tight">
            {{ todayFormatted }}
          </h2>
        </div>
        <StatusBadge v-if="presence" :status="presence.status" class="shrink-0" />
        <span v-else class="badge badge-ghost text-xs font-semibold py-1.5 px-2.5 rounded-m3-sm shrink-0">
          Non pointé
        </span>
      </div>

      <!-- Corps central : Panneau de pointage et repères temporels compact et réactif -->
      <div class="flex-1 flex flex-col min-h-0 my-0">
        <div class="bg-base-100/90 rounded-m3-lg border border-base-300/50 px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3.5 lg:py-4 flex-1 flex flex-col justify-between gap-2.5 sm:gap-3 shadow-xs min-h-0">
          <!-- Grille des bornes horaires Arrivée / Départ -->
          <div class="grid grid-cols-2 gap-2.5 sm:gap-4 my-auto py-1 sm:py-2">
            <!-- Borne Arrivée -->
            <div class="flex flex-col items-center text-center">
              <div class="flex items-center gap-1 sm:gap-1.5 mb-0.5 text-base-content/70">
                <div class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Arrivée</span>
              </div>
              <span class="text-2xl sm:text-3xl lg:text-4xl font-black text-base-content tracking-tight font-mono my-0.5 leading-none">
                {{ presence?.check_in_time ? formatTime(presence.check_in_time) : '--:--' }}
              </span>
              <span class="text-[10px] sm:text-xs text-base-content/60 font-medium mt-0.5">
                Prévu à {{ expectedArrivalTime.slice(0, 5) }}
              </span>
            </div>

            <!-- Borne Départ -->
            <div class="flex flex-col items-center text-center border-l border-base-300/80 pl-2.5 sm:pl-4">
              <div class="flex items-center gap-1 sm:gap-1.5 mb-0.5 text-base-content/70">
                <div class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-base-200 text-base-content/70 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </div>
                <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Départ</span>
              </div>
              <span class="text-2xl sm:text-3xl lg:text-4xl font-black text-base-content tracking-tight font-mono my-0.5 leading-none">
                {{ presence?.check_out_time ? formatTime(presence.check_out_time) : '--:--' }}
              </span>
              <span class="text-[10px] sm:text-xs text-base-content/60 font-medium mt-0.5">
                {{ presence?.check_out_time ? 'Validé' : 'En attente' }}
              </span>
            </div>
          </div>

          <!-- Bannière contextuelle de statut : durée active ou consigne bienveillante -->
          <div
            v-if="workDuration"
            class="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium py-1.5 px-3 rounded-m3-md bg-base-200/70 border border-base-300/40 mt-auto shrink-0"
          >
            <svg
              v-if="!presence.check_out_time"
              xmlns="http://www.w3.org/2000/svg"
              class="w-3.5 h-3.5 text-warning animate-pulse shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="w-3.5 h-3.5 text-success shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span class="text-base-content/75">
              {{ presence.check_out_time ? 'Durée validée :' : 'En poste depuis :' }}
            </span>
            <strong class="text-base-content font-bold text-xs sm:text-sm">{{ workDuration }}</strong>
          </div>

          <div
            v-else
            class="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-base-content/65 py-1.5 px-2.5 rounded-m3-md bg-base-200/40 border border-base-300/30 text-center mt-auto shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Pointage géolocalisé attendu sur votre site de travail.</span>
          </div>
        </div>
      </div>

      <!-- Actions principales contextuelles ancrées en bas -->
      <div class="card-actions flex flex-col gap-2 mt-auto shrink-0 pt-2 border-t border-base-300/40">
        <!-- Cas 1 : Aucun pointage d'arrivée -->
        <button
          v-if="!presence"
          type="button"
          class="btn btn-primary w-full shadow-xs text-sm sm:text-base font-bold min-h-12 sm:min-h-13 rounded-m3-md active:scale-95 transition-transform gap-2.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
          class="btn btn-warning text-warning-content w-full shadow-xs text-sm sm:text-base font-bold min-h-12 sm:min-h-13 rounded-m3-md active:scale-95 transition-transform gap-2.5 focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2"
          @click="emit('checkOut')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Pointer le départ</span>
        </button>

        <!-- Cas 3 : Journée achevée (Bouton d'état intégré sans saut visuel) -->
        <button
          v-else
          type="button"
          disabled
          class="btn btn-outline border-success/40 text-success bg-success/5 w-full shadow-xs text-sm sm:text-base font-bold min-h-12 sm:min-h-13 rounded-m3-md gap-2.5 cursor-default opacity-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Journée enregistrée</span>
        </button>

        <button
          type="button"
          class="btn btn-ghost border border-base-300/80 w-full text-xs sm:text-sm font-semibold min-h-11 rounded-m3-md gap-2 text-base-content/80 hover:text-base-content hover:bg-base-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
