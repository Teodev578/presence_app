<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'generic', // 'generic', 'search', 'filter', 'calendar', 'users', 'team', 'file'
  },
  actionLabel: {
    type: String,
    default: '',
  },
  bare: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['action'])
</script>

<template>
  <div
    class="p-8 text-center items-center"
    :class="bare ? 'flex flex-col' : 'card bg-base-200 border border-base-300 rounded-m3-lg'"
  >
    <div class="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center text-base-content/40 mb-3">
      <svg v-if="icon === 'search'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="8" y1="8" x2="14" y2="14"></line>
      </svg>
      <svg v-else-if="icon === 'filter'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path>
      </svg>
      <svg v-else-if="icon === 'calendar'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <svg v-else-if="icon === 'users'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      <svg v-else-if="icon === 'team'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <line x1="9" y1="22" x2="9" y2="2"></line>
        <line x1="15" y1="22" x2="15" y2="2"></line>
        <line x1="4" y1="12" x2="20" y2="12"></line>
      </svg>
      <svg v-else-if="icon === 'file'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <h3 class="font-bold text-base text-base-content">{{ title }}</h3>
    <p v-if="message" class="text-sm text-base-content/60 mt-1 max-w-md mx-auto">{{ message }}</p>
    <div v-if="actionLabel" class="mt-4">
      <button
        type="button"
        class="btn btn-primary min-h-11 rounded-m3-sm font-bold"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>
