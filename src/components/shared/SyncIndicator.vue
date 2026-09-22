<script setup>
import { computed } from 'vue'
import { useSyncEngine } from '../../composables/useSyncEngine'
import { useAuth } from '../../composables/useAuth'

const { isSyncing, pendingCount, syncNow } = useSyncEngine()
const { user } = useAuth()

const triggerSync = () => {
  if (user.value?.id) {
    syncNow(user.value.id)
  }
}

const statusText = computed(() => {
  if (isSyncing.value) return 'Synchronisation...'
  if (pendingCount.value > 0) return `${pendingCount.value} en attente`
  return 'À jour'
})
</script>

<template>
  <button
    type="button"
    class="badge badge-sm py-2.5 px-3 gap-1.5 font-medium cursor-pointer transition-all duration-200 select-none hover:opacity-85 active:scale-95"
    :class="{
      'badge-warning border-warning/40 bg-warning/10 text-warning-content': pendingCount > 0 && !isSyncing,
      'badge-success border-success/40 bg-success/10 text-success': pendingCount === 0 && !isSyncing,
      'badge-info border-info/40 bg-info/10 text-info': isSyncing
    }"
    :title="pendingCount > 0 ? `${pendingCount} mutation(s) en attente` : 'Données synchronisées (cliquer pour forcer)'"
    aria-label="État de synchronisation"
    @click="triggerSync"
  >
    <span v-if="isSyncing" class="loading loading-spinner loading-xs text-info"></span>
    <span
      v-else
      class="inline-block w-1.5 h-1.5 rounded-full"
      :class="pendingCount > 0 ? 'bg-warning animate-pulse' : 'bg-success'"
    ></span>

    <Transition name="fade-fast" mode="out-in">
      <span :key="statusText" class="text-xs">{{ statusText }}</span>
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
