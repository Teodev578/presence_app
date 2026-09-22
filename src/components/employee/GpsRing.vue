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
  <div class="radar-box">
    <!-- Anneau radar animé -->
    <div
      class="radar-ring"
      :class="{
        'radar-in': inPerimeter,
        'radar-out': !inPerimeter && !isLocating,
        'radar-loading': isLocating
      }"
    >
      <div class="radar-pulse"></div>
      <div class="radar-center-icon">
        <span v-if="isLocating">📡</span>
        <span v-else-if="inPerimeter">📍</span>
        <span v-else>⚠️</span>
      </div>
    </div>

    <!-- Informations de distance et tolérance -->
    <div class="radar-details">
      <div v-if="isLocating" class="status-msg text-loading">
        Acquisition du signal GPS en cours...
      </div>
      <div v-else-if="inPerimeter" class="status-msg text-success">
        ✓ Position validée (vous êtes sur site)
      </div>
      <div v-else class="status-msg text-warning">
        Distance au site : <strong>{{ distance }} m</strong> (limite : {{ allowedRadius }} m)
      </div>

      <div v-if="accuracy" class="accuracy-tag">
        Précision satellite : ±{{ accuracy }} m
      </div>
    </div>
  </div>
</template>

<style scoped>
.radar-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem 1rem;
}

.radar-ring {
  position: relative;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.radar-in {
  background: rgba(16, 185, 129, 0.12);
  border: 2px solid #10b981;
}

.radar-out {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
}

.radar-loading {
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
}

.radar-center-icon {
  font-size: 2.2rem;
  z-index: 2;
}

.radar-pulse {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  border: 2px solid currentColor;
  opacity: 0;
  animation: ripple 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

.radar-in .radar-pulse {
  color: #10b981;
}

.radar-out .radar-pulse {
  color: #ef4444;
}

.radar-loading .radar-pulse {
  color: #3b82f6;
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

.radar-details {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.status-msg {
  font-size: 0.95rem;
  font-weight: 600;
}

.text-success {
  color: #059669;
}

.text-warning {
  color: #dc2626;
}

.text-loading {
  color: #2563eb;
}

.accuracy-tag {
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
}
</style>
