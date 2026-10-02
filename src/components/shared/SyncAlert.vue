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
    class="btn btn-ghost btn-sm min-h-11 min-w-11 gap-2 rounded-full border-0 px-2 sm:px-2.5 select-none shrink-0 inline-flex items-center transition-colors cursor-pointer"
    :class="{
      'text-warning hover:bg-warning/10': state === 'offline',
      'text-info hover:bg-info/10': state === 'pending' || state === 'syncing',
      'text-success hover:bg-success/10': state === 'healthy'
    }"
    :title="title"
    :aria-label="`Statut réseau : ${label}. ${title}`"
    @click="triggerSync"
  >
    <!-- Indicateur coloré rond devant -->
    <span class="inline-block w-2 h-2 rounded-full bg-current shrink-0"></span>

    <!-- Icône habituelle selon l'état (Wi-Fi & Synchronisation, sans outline) -->
    <!-- En cours de synchronisation ou en attente : flèches circulaires -->
    <template v-if="state === 'syncing' || state === 'pending'">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4 shrink-0"
        :class="{ 'animate-spin': state === 'syncing' }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
      <span v-if="state === 'pending' && pendingCount > 0" class="text-xs font-semibold leading-none">
        {{ pendingCount }}
      </span>
    </template>

    <!-- Hors ligne : nuage barré -->
    <svg
      v-else-if="state === 'offline'"
      xmlns="http://www.w3.org/2000/svg"
      class="w-4 h-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0-4 7h1.74a5 5 0 0 0 9.21 2M1 1l22 22" />
    </svg>

    <!-- À jour / connecté : nuage classique épuré sans coche -->
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      class="w-4 h-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  </button>
</template>
