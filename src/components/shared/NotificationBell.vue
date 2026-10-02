<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isOpen = ref(false)
const containerRef = ref(null)

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    close()
  }
}

const handleKeydown = (event) => {
  if (event.key === 'Escape' && isOpen.value) {
    close()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', handleClickOutside)
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside)
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <div ref="containerRef" class="relative inline-flex items-center">
    <!-- Déclencheur cloche dans le bandeau supérieur -->
    <button
      type="button"
      class="btn btn-ghost btn-circle min-w-11 min-h-11 text-base-content/70 hover:text-base-content cursor-pointer transition-colors"
      :class="{ 'text-primary bg-primary/10': isOpen }"
      aria-label="Ouvrir les notifications"
      title="Notifications"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      @click.stop="toggleOpen"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </button>

    <!-- Boîte de dialogue ancrée en dessous de l'icône (popover dialog) -->
    <div
      v-if="isOpen"
      role="dialog"
      aria-modal="false"
      aria-labelledby="notification-dialog-title"
      class="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-m3-xl p-4 sm:p-5 bg-base-100 border border-base-300 shadow-sm z-50 flex flex-col gap-3"
      @click.stop
    >
      <!-- En-tête du dialogue -->
      <div class="flex items-center justify-between pb-3 border-b border-base-200/60">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-m3-sm bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <h3 id="notification-dialog-title" class="font-bold text-base text-base-content leading-tight">Notifications</h3>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-circle btn-sm min-h-11 min-w-11 text-base-content/60 hover:text-base-content"
          aria-label="Fermer la boîte de dialogue"
          @click="close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Corps : État vide classique et soigné -->
      <div class="py-5 flex flex-col items-center text-center">
        <div class="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center text-base-content/40 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <h4 class="font-bold text-sm sm:text-base text-base-content">Aucune notification</h4>
        <p class="text-xs text-base-content/70 mt-1 max-w-xs leading-relaxed">
          Vous êtes à jour. Les alertes de service et rappels d’activité apparaîtront ici.
        </p>
      </div>

      <!-- Pied d'action -->
      <div class="pt-2 border-t border-base-200/60 flex justify-end">
        <button
          type="button"
          class="btn btn-ghost btn-sm px-4 min-h-11 rounded-m3-sm text-base-content font-medium active:scale-95 transition-transform"
          @click="close"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>
