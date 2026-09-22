<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    required: true,
  },
  icon: {
    type: String,
    default: '📊',
  },
  subtitle: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: 'blue', // 'blue', 'green', 'amber', 'red'
  },
})

const colorConfig = computed(() => {
  switch (props.color) {
    case 'green':
      return { border: 'border-t-4 border-t-success', text: 'text-success' }
    case 'amber':
      return { border: 'border-t-4 border-t-warning', text: 'text-warning' }
    case 'red':
      return { border: 'border-t-4 border-t-error', text: 'text-error' }
    case 'blue':
    default:
      return { border: 'border-t-4 border-t-primary', text: 'text-primary' }
  }
})
</script>

<template>
  <div class="stats bg-base-100 shadow-xs border border-base-300 w-full rounded-2xl" :class="colorConfig.border">
    <div class="stat p-4 sm:p-5">
      <div class="stat-figure text-2xl opacity-90">{{ icon }}</div>
      <div class="stat-title text-[11px] font-bold uppercase tracking-wider text-base-content/60">{{ title }}</div>
      <div class="stat-value text-2xl sm:text-3xl font-black mt-1" :class="colorConfig.text">{{ value }}</div>
      <div v-if="subtitle" class="stat-desc text-xs text-base-content/60 mt-1">{{ subtitle }}</div>
    </div>
  </div>
</template>
