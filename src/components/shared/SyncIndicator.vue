<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSyncEngine } from '../../composables/useSyncEngine'
import { useAuth } from '../../composables/useAuth'

const props = defineProps({
  compact: {
    type: Boolean,
    default: false,
  },
})

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

const triggerSync = () => {
  if (user.value?.id) {
    syncNow(user.value.id)
  }
}

const statusText = computed(() => {
  if (!isOnline.value) return 'Hors ligne'
  if (isSyncing.value) return props.compact ? 'Sync...' : 'Synchronisation...'
  if (pendingCount.value > 0) return `${pendingCount.value} en attente`
  return 'À jour'
})
</script>

<template>
  <!-- Variante compacte et discrète pour la barre de navigation (Navbar) -->
  <button
    v-if="compact"
    type="button"
    class="inline-flex items-center gap-1.5 h-7 min-h-7 px-2.5 rounded-full border border-base-300/70 bg-base-100/75 hover:bg-base-200/70 active:scale-95 transition-all text-base-content/75 hover:text-base-content cursor-pointer shadow-2xs select-none"
    :title="!isOnline ? 'Terminal déconnecté d\'Internet (stockage local actif)' : pendingCount > 0 ? `${pendingCount} mutation(s) en attente de synchronisation (cliquer pour forcer)` : 'Données synchronisées avec le serveur'"
    :aria-label="`Statut réseau : ${statusText}`"
    @click="triggerSync"
  >
    <span v-if="isSyncing" class="loading loading-spinner loading-xs text-info shrink-0"></span>
    <span
      v-else
      class="inline-block w-1.5 h-1.5 rounded-full shrink-0"
      :class="{
        'bg-base-content/40': !isOnline,
        'bg-warning animate-pulse': isOnline && pendingCount > 0,
        'bg-success': isOnline && pendingCount === 0
      }"
    ></span>

    <Transition name="fade-fast" mode="out-in">
      <span :key="statusText" class="text-[11px] font-medium leading-none">{{ statusText }}</span>
    </Transition>
  </button>

  <!-- Variante standard (pour le tiroir latéral ou volet détaillé) -->
  <button
    v-else
    type="button"
    class="badge badge-sm shrink min-w-0 max-w-full py-2.5 px-3 gap-1.5 font-medium cursor-pointer transition-all duration-200 select-none hover:opacity-85 active:scale-95"
    :class="{
      'badge-ghost border-base-300 bg-base-200 text-base-content/60': !isOnline,
      'badge-warning border-warning/40 bg-warning/10 text-warning-content': isOnline && pendingCount > 0 && !isSyncing,
      'badge-success border-success/40 bg-success/10 text-success': isOnline && pendingCount === 0 && !isSyncing,
      'badge-info border-info/40 bg-info/10 text-info': isOnline && isSyncing
    }"
    :title="!isOnline ? 'Terminal hors ligne' : pendingCount > 0 ? `${pendingCount} mutation(s) en attente` : 'Données synchronisées (cliquer pour forcer)'"
    aria-label="État de synchronisation"
    @click="triggerSync"
  >
    <span v-if="isSyncing" class="loading loading-spinner loading-xs text-info shrink-0"></span>
    <span
      v-else
      class="inline-block w-1.5 h-1.5 rounded-full shrink-0"
      :class="{
        'bg-base-content/40': !isOnline,
        'bg-warning animate-pulse': isOnline && pendingCount > 0,
        'bg-success': isOnline && pendingCount === 0
      }"
    ></span>

    <Transition name="fade-fast" mode="out-in">
      <!-- Troncature d'abord : le badge cède sa largeur au lieu de pousser le contrôle d'apparence.
           min-w-0 est requis, un élément flex ne descendant jamais sous sa largeur de contenu -->
      <span :key="statusText" class="text-xs truncate min-w-0">{{ statusText }}</span>
    </Transition>
  </button>
</template>

<style scoped>
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.15s ease;
}
.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}
</style>
