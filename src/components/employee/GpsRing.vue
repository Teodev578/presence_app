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
      <div class="text-3xl z-10 select-none">
        <span v-if="isLocating" class="loading loading-ring loading-lg text-info"></span>
        <span v-else-if="inPerimeter">📍</span>
        <span v-else>⚠️</span>
      </div>
    </div>

    <!-- Informations de distance et tolérance -->
    <div class="text-center flex flex-col items-center gap-1.5 max-w-xs">
      <div v-if="isLocating" class="text-sm font-semibold text-info flex items-center gap-1.5">
        <span class="loading loading-spinner loading-xs"></span>
        Acquisition du signal GPS en cours...
      </div>
      <div v-else-if="inPerimeter" class="badge badge-success text-success-content font-bold py-3 px-4 text-xs gap-1.5">
        ✓ Position validée (vous êtes sur site)
      </div>
      <div v-else class="text-sm font-medium text-error">
        Distance au site : <strong>{{ distance }} m</strong> (limite : {{ allowedRadius }} m)
      </div>

      <div v-if="accuracy" class="badge badge-ghost badge-sm text-[11px] text-base-content/60 mt-1">
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
</style>
