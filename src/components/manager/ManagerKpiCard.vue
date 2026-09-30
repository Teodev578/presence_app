<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    required: true,
  },
  caption: {
    type: String,
    default: '',
  },
  tone: {
    type: String,
    default: 'neutral', // 'neutral', 'primary', 'success', 'warning', 'info', 'error'
  },
  clickable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select'])

const toneConfig = computed(() => {
  switch (props.tone) {
    case 'primary':
      return { label: 'text-primary', value: 'text-primary', dot: 'bg-primary' }
    case 'success':
      return { label: 'text-success', value: 'text-success', dot: 'bg-success' }
    case 'warning':
      return { label: 'text-warning', value: 'text-warning', dot: 'bg-warning' }
    case 'info':
      return { label: 'text-info', value: 'text-info', dot: 'bg-info' }
    case 'error':
      return { label: 'text-error', value: 'text-error', dot: 'bg-error' }
    default:
      return { label: 'text-base-content/60', value: 'text-base-content', dot: null }
  }
})

const handleSelect = () => {
  if (props.clickable) emit('select')
}

const handleKeydown = (event) => {
  if (!props.clickable) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('select')
  }
}
</script>

<template>
  <component
    :is="clickable ? 'button' : 'div'"
    :type="clickable ? 'button' : null"
    class="card bg-base-200 border border-base-300 shadow-xs p-4 rounded-m3-md flex flex-col gap-1 text-left"
    :class="clickable ? 'cursor-pointer transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-primary' : ''"
    @click="handleSelect"
    @keydown="handleKeydown"
  >
    <span class="text-xs font-semibold flex items-center gap-1.5" :class="toneConfig.label">
      <span v-if="toneConfig.dot" class="w-2 h-2 rounded-full shrink-0" :class="toneConfig.dot"></span>
      {{ label }}
    </span>
    <span class="text-2xl font-black" :class="toneConfig.value">{{ value }}</span>
    <span v-if="caption" class="text-xs text-base-content/50">{{ caption }}</span>
  </component>
</template>
