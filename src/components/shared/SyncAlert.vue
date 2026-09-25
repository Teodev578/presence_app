<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useSyncEngine } from '../../composables/useSyncEngine'
import { useAuth } from '../../composables/useAuth'

const { pendingCount, syncNow } = useSyncEngine()
const { user } = useAuth()

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

const handleOnline = () => {
  isOnline.value = true
}
const handleOffline = () => {
  isOnline.value = false
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
})

/**
 * Silence total quand tout va bien : l'en-tête ne porte un signal que s'il y a matière à agir.
 * L'état permanent reste consultable dans le tiroir.
 */
const state = computed(() => {
  if (!isOnline.value) return 'offline'
  if (pendingCount.value > 0) return 'pending'
  return 'healthy'
})

const isVisible = computed(() => state.value !== 'healthy')

const label = computed(() => (state.value === 'offline' ? 'Hors ligne' : `${pendingCount.value} en attente`))

const title = computed(() =>
  state.value === 'offline'
    ? 'Terminal déconnecté d\u2019Internet, stockage local actif'
    : `${pendingCount.value} mutation(s) en attente, cliquer pour forcer la synchronisation`
)

const triggerSync = () => {
  if (user.value?.id) {
    syncNow(user.value.id)
  }
}
</script>

<template>
  <button
    v-if="isVisible"
    type="button"
    class="btn btn-ghost btn-sm min-h-11 gap-1.5 rounded-full border px-2.5 select-none shrink-0"
    :class="state === 'offline' ? 'border-warning/40 text-warning' : 'border-info/40 text-info'"
    :title="title"
    :aria-label="`Statut réseau : ${label}. ${title}`"
    @click="triggerSync"
  >
    <span class="inline-block w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
    <span class="text-[11px] sm:text-xs font-medium leading-none">{{ label }}</span>
  </button>
</template>
