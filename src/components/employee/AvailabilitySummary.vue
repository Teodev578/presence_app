<script setup>
import { computed } from 'vue'
import { describeAvailabilityCount } from '../../lib/availabilitySummary'

const props = defineProps({
  count: {
    type: Number,
    required: true,
  },
  labels: {
    type: Array,
    default: () => [],
  },
})

const countLabel = computed(() => describeAvailabilityCount(props.count))
</script>

<template>
  <div class="bg-base-100/70 border border-base-300/40 rounded-m3-lg p-3 sm:p-3.5 flex flex-col gap-2 shadow-xs">
    <div class="flex items-center justify-between gap-3">
      <span class="text-xs font-semibold text-base-content/75 flex items-center gap-1.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-3.5 h-3.5 text-primary shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>Avant d'enregistrer</span>
      </span>

      <Transition name="fade-fast" mode="out-in">
        <span
          :key="count"
          class="badge font-bold rounded-m3-xs py-1.5 px-2.5 text-xs shrink-0"
          :class="count > 0 ? 'badge-primary' : 'badge-ghost text-base-content/60'"
        >
          {{ countLabel }}
        </span>
      </Transition>
    </div>

    <div v-if="count > 0" class="flex flex-wrap gap-1.5">
      <span
        v-for="day in labels"
        :key="day"
        class="badge badge-ghost rounded-m3-xs py-1 px-2 text-[11px] font-semibold text-base-content/75"
      >
        {{ day }}
      </span>
    </div>
    <p v-else class="text-[11px] sm:text-xs text-base-content/60 leading-relaxed">
      Aucun jour coché : l'enregistrement retirera vos disponibilités de cette semaine.
    </p>
  </div>
</template>

<style scoped>
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 120ms ease;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}
</style>
