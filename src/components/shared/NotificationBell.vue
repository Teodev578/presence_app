<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotifications } from '../../composables/useNotifications'
import { useRouter } from '../../router'

const isOpen = ref(false)
const containerRef = ref(null)
const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
const { navigate } = useRouter()

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

const handleAction = (item) => {
  markAsRead(item.id)
  if (item.targetRoute) {
    navigate(item.targetRoute)
  }
  close()
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
      class="btn btn-ghost btn-circle min-w-11 min-h-11 text-base-content/70 hover:text-base-content cursor-pointer transition-colors relative"
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
      <!-- Pastille de notification non lue -->
      <span
        v-if="unreadCount > 0"
        class="badge badge-error badge-xs absolute top-1.5 right-1.5 font-bold min-h-4 min-w-4 p-0.5 text-xs text-error-content"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
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
          <div class="flex items-center gap-2">
            <h3 id="notification-dialog-title" class="font-bold text-base text-base-content leading-tight">Notifications</h3>
            <span v-if="unreadCount > 0" class="badge badge-primary badge-sm font-semibold">{{ unreadCount }}</span>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button
            v-if="unreadCount > 0"
            type="button"
            class="btn btn-ghost min-h-11 px-2.5 text-xs text-base-content/60 hover:text-base-content"
            @click="markAllAsRead"
          >
            Tout marquer lu
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-circle min-h-11 min-w-11 text-base-content/60 hover:text-base-content"
            aria-label="Fermer la boîte de dialogue"
            @click="close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Corps : Liste des notifications ou État vide -->
      <div v-if="notifications.length > 0" class="max-h-80 overflow-y-auto space-y-2.5 pr-1 py-1">
        <div
          v-for="item in notifications"
          :key="item.id"
          class="p-3 rounded-m3-md border border-base-300/80 bg-base-200/50 flex flex-col gap-2 transition-colors hover:border-primary/40"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-warning/15 text-warning flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span class="font-bold text-xs text-base-content">{{ item.title }}</span>
            </div>
            <span class="badge badge-warning badge-xs shrink-0 font-medium">
              J-{{ item.daysRemaining }}
            </span>
          </div>

          <p class="text-xs text-base-content/80 leading-relaxed">
            {{ item.message }}
          </p>

          <div v-if="item.actionLabel" class="pt-1 flex justify-end">
            <button
              type="button"
              class="btn btn-primary min-h-11 rounded-m3-sm px-3 text-xs font-semibold gap-1.5"
              @click="handleAction(item)"
            >
              <span>{{ item.actionLabel }}</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Corps : État vide classique et soigné -->
      <div v-else class="py-5 flex flex-col items-center text-center">
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
          class="btn btn-ghost px-4 min-h-11 rounded-m3-sm text-base-content font-medium active:scale-95 transition-transform"
          @click="close"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

