<script setup>
import { useToast } from '../../composables/ui/useToast.js'

const { toasts, dismissToast } = useToast()
</script>

<template>
  <div
    class="fixed top-16 lg:top-20 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-[calc(100vw-2rem)] sm:max-w-sm w-full pointer-events-none pt-[var(--safe-top,0px)]"
    aria-live="polite"
  >
    <TransitionGroup name="toast-slide">
      <div
        v-for="t in toasts"
        :key="t.id"
        role="alert"
        class="alert text-xs sm:text-sm py-2.5 px-3.5 rounded-m3-md border border-base-300 shadow-sm pointer-events-auto flex items-center justify-between gap-3 backdrop-blur-md"
        :class="{
          'alert-success text-success-content border-success/40 bg-success/90': t.type === 'success',
          'alert-error text-error-content border-error/40 bg-error/90': t.type === 'error',
          'alert-warning text-warning-content border-warning/40 bg-warning/90': t.type === 'warning',
          'alert-info text-info-content border-info/40 bg-info/90': t.type === 'info',
        }"
      >
        <span class="flex-1 font-medium leading-snug">{{ t.message }}</span>
        <button
          type="button"
          class="btn btn-ghost btn-circle min-h-11 min-w-11 shrink-0 opacity-80 hover:opacity-100 hover:bg-black/15 text-current focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Fermer la notification"
          @click="dismissToast(t.id)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.95);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>
