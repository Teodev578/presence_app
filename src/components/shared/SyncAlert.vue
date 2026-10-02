<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useSyncEngine } from '../../composables/useSyncEngine'
import { useAuth } from '../../composables/useAuth'

const { isSyncing, pendingCount, syncNow } = useSyncEngine()
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
 * Statut réseau universel unifié : visible en permanence dans le bandeau supérieur
 * à toutes les résolutions (mobile, tablette, bureau).
 */
const state = computed(() => {
  if (!isOnline.value) return 'offline'
  if (isSyncing?.value) return 'syncing'
  if (pendingCount.value > 0) return 'pending'
  return 'healthy'
})

const label = computed(() => {
  if (state.value === 'offline') return 'Hors ligne'
  if (state.value === 'syncing') return 'Synchronisation...'
  if (state.value === 'pending') {
    return pendingCount.value > 1 ? `${pendingCount.value} en attente` : '1 en attente'
  }
  return 'À jour'
})

const title = computed(() => {
  if (state.value === 'offline') return 'Terminal déconnecté d\u2019Internet, stockage local actif'
  if (state.value === 'syncing') return 'Synchronisation des données en cours avec le serveur'
  if (state.value === 'pending') {
    return pendingCount.value > 1
      ? `${pendingCount.value} modifications en attente, cliquer pour forcer la synchronisation`
      : '1 modification en attente, cliquer pour forcer la synchronisation'
  }
  return 'Données synchronisées avec le serveur, cliquer pour forcer la synchronisation'
})

const triggerSync = () => {
  if (user.value?.id) {
    syncNow(user.value.id)
  }
}
</script>

<template>
  <button
    type="button"
    class="btn btn-ghost btn-sm min-h-11 gap-1.5 rounded-full border px-2.5 select-none shrink-0 inline-flex items-center transition-colors cursor-pointer"
    :class="{
      'border-warning/40 text-warning hover:bg-warning/5': state === 'offline',
      'border-info/40 text-info hover:bg-info/5': state === 'pending' || state === 'syncing',
      'border-success/40 text-success hover:bg-success/5': state === 'healthy'
    }"
    :title="title"
    :aria-label="`Statut réseau : ${label}. ${title}`"
    @click="triggerSync"
  >
    <span v-if="state === 'syncing'" class="loading loading-spinner loading-xs text-info shrink-0"></span>
    <span v-else class="inline-block w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
    <span class="text-xs font-medium leading-none">{{ label }}</span>
  </button>
</template>
