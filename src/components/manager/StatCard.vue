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
    type: [Object, Function, String],
    default: null,
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
      return { border: 'border-t-4 border-t-success', text: 'text-success', iconBg: 'bg-success/10 text-success' }
    case 'amber':
      return { border: 'border-t-4 border-t-warning', text: 'text-warning', iconBg: 'bg-warning/10 text-warning' }
    case 'red':
      return { border: 'border-t-4 border-t-error', text: 'text-error', iconBg: 'bg-error/10 text-error' }
    case 'blue':
    default:
      return { border: 'border-t-4 border-t-primary', text: 'text-primary', iconBg: 'bg-primary/10 text-primary' }
  }
})
</script>

<template>
  <div class="stats bg-base-100 shadow-xs border border-base-300 w-full rounded-m3-lg" :class="colorConfig.border">
    <div class="stat p-4 sm:p-5">
      <div v-if="icon" class="stat-figure">
        <div class="w-10 h-10 rounded-m3-sm flex items-center justify-center" :class="colorConfig.iconBg">
          <component :is="icon" v-if="typeof icon !== 'string'" class="w-5 h-5" />
          <span v-else class="text-sm font-bold">{{ icon }}</span>
        </div>
      </div>
      <div class="stat-title text-[11px] font-bold uppercase tracking-wider text-base-content/60">{{ title }}</div>
      <div class="stat-value text-2xl sm:text-3xl font-black mt-1" :class="colorConfig.text">{{ value }}</div>
      <div v-if="subtitle" class="stat-desc text-xs text-base-content/60 mt-1">{{ subtitle }}</div>
    </div>
  </div>
</template>
