<script setup>
defineProps({
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
})
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
    <div class="text-center flex flex-col items-center gap-1.5 max-w-xs">
      <div v-if="isLocating" class="text-sm font-semibold text-info flex items-center gap-1.5">
        <span class="loading loading-spinner loading-xs"></span>
        Acquisition du signal GPS en cours...
      </div>
      <div v-else-if="inPerimeter" class="badge badge-success text-success-content font-bold py-3 px-4 text-xs gap-1.5 rounded-m3-xs">
        ✓ Position validée (vous êtes sur site)
      </div>
      <div v-else class="text-sm font-medium text-error">
        Distance au site : <strong>{{ distance }} m</strong> (limite : {{ allowedRadius }} m)
      </div>

      <div v-if="accuracy" class="badge badge-ghost badge-sm text-[11px] text-base-content/60 mt-1 rounded-m3-xs">
        Précision satellite : ±{{ accuracy }} m
      </div>
    </div>
  </div>
</template>

<style scoped>
.radar-pulse {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  border: 2px solid currentColor;
  opacity: 0;
  animation: ripple 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

@keyframes ripple {
  0% {
    transform: scale(0.85);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .radar-pulse {
    animation: none;
    opacity: 0.2;
    transform: scale(1);
  }
}
</style>
