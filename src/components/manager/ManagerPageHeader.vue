<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-black tracking-tight text-base-content flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <slot name="icon">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </slot>
        </div>
        <span>{{ title }}</span>
      </h1>
      <p v-if="subtitle" class="text-xs text-base-content/60 mt-0.5">{{ subtitle }}</p>
    </div>

    <div v-if="$slots.actions" class="w-full sm:w-auto flex flex-wrap sm:flex-nowrap items-stretch sm:items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
