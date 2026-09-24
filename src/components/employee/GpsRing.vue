<script setup>
import { computed } from 'vue'
import { formatDistance } from '../../composables/useGeolocation'

const props = defineProps({
  inPerimeter: {
    type: Boolean,
    default: false,
  },
  distance: {
    type: Number,
    default: 0,
  },
  allowedRadius: {
    type: Number,
    default: 50,
  },
  accuracy: {
    type: Number,
    default: null,
  },
  isLocating: {
    type: Boolean,
    default: false,
  },
  siteName: {
    type: String,
    default: '',
  },
  closestSiteName: {
    type: String,
    default: '',
  },
  hasSitesConfigured: {
    type: Boolean,
    default: true,
  },
})

const formattedDistance = computed(() => formatDistance(props.distance))
const formattedAllowedRadius = computed(() => formatDistance(props.allowedRadius))
</script>

<template>
  <div class="flex flex-col items-center gap-4 py-6 px-4">
    <!-- Anneau radar animé -->
    <div
      class="relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300"
      :class="{
        'border-2 border-success bg-success/10 text-success': inPerimeter,
        'border-2 border-error bg-error/10 text-error': !inPerimeter && !isLocating,
        'border-2 border-dashed border-info bg-info/10 text-info': isLocating
      }"
    >
      <div class="radar-pulse"></div>
      <div class="z-10 select-none flex items-center justify-center">
        <span v-if="isLocating" class="loading loading-ring loading-lg text-info"></span>
        <svg
          v-else-if="inPerimeter"
          xmlns="http://www.w3.org/2000/svg"
          class="w-8 h-8 text-success"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="w-8 h-8 text-error"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
    </div>

    <!-- Informations de distance et tolérance -->
    <div class="text-center flex flex-col items-center gap-1.5 max-w-sm">
      <div v-if="isLocating" class="text-sm font-semibold text-info flex items-center gap-1.5">
        <span class="loading loading-spinner loading-xs"></span>
        Recherche de votre position...
      </div>
      <div v-else-if="!hasSitesConfigured" class="text-xs font-medium text-warning">
        Aucun lieu de travail configuré pour le moment.
      </div>
      <div v-else-if="inPerimeter" class="flex flex-col items-center gap-1">
        <div class="badge badge-success text-success-content font-bold py-3 px-4 text-xs gap-1.5 rounded-m3-xs">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span>Vous êtes bien sur place !</span>
        </div>
        <p v-if="siteName" class="text-xs text-base-content/80 mt-0.5">
          Vous êtes sur le site <strong class="text-base-content font-bold">{{ siteName }}</strong> (à {{ formattedDistance }})
        </p>
      </div>
      <div v-else class="flex flex-col items-center gap-0.5 text-xs text-error font-medium">
        <div class="font-bold text-sm">Encore un peu loin du site</div>
        <p v-if="closestSiteName" class="text-base-content/70 text-[11px] mt-0.5">
          Lieu le plus proche : <strong class="text-base-content">{{ closestSiteName }}</strong> (à {{ formattedDistance }}, tolérance : {{ formattedAllowedRadius }})
        </p>
        <p v-else class="text-base-content/60 text-[11px] mt-0.5">
          Distance : {{ formattedDistance }} (tolérance : {{ formattedAllowedRadius }})
        </p>
      </div>

      <div v-if="accuracy" class="badge badge-ghost badge-sm text-[11px] text-base-content/60 mt-1 rounded-m3-xs">
        Précision GPS : ±{{ accuracy }} m
      </div>
    </div>
  </div>
</template>

<style scoped>
.radar-pulse {
  position: absolute;
  inset: -12px;
  border-radius: 9999px;
  border: 1px solid currentColor;
  opacity: 0.15;
  animation: pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.9);
    opacity: 0.4;
  }
  70% {
    transform: scale(1.3);
    opacity: 0;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}
</style>
