<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  siteName: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <Transition name="confirm">
    <div
      v-if="visible"
      role="status"
      aria-live="polite"
      class="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2.5 bg-base-100/95 backdrop-blur-xs rounded-m3-xl px-4 text-center select-none"
    >
      <div class="confirm-pop w-16 h-16 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <h3 class="text-base sm:text-lg font-extrabold text-base-content tracking-tight">
        {{ title }}
      </h3>
      <p class="text-xs sm:text-sm text-base-content/70 max-w-xs leading-relaxed">
        {{ message }}
      </p>
      <p v-if="siteName" class="badge badge-ghost rounded-m3-xs py-1.5 px-2.5 text-[11px] font-semibold text-base-content/75">
        {{ siteName }}
      </p>
    </div>
  </Transition>
</template>

<style scoped>
.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

.confirm-pop {
  animation: confirm-pop 240ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes confirm-pop {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
