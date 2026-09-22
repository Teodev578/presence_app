<script setup>
import { useSyncEngine } from '../../composables/useSyncEngine'
import { useAuth } from '../../composables/useAuth'

const { isSyncing, pendingCount, syncNow } = useSyncEngine()
const { user } = useAuth()

const triggerSync = () => {
  if (user.value?.id) {
    syncNow(user.value.id)
  }
}
</script>

<template>
  <button
    type="button"
    class="sync-pill"
    :class="{
      'sync-pending': pendingCount > 0,
      'sync-online': pendingCount === 0 && !isSyncing,
      'sync-active': isSyncing
    }"
    :title="pendingCount > 0 ? `${pendingCount} mutation(s) en attente de synchronisation` : 'Données synchronisées'"
    @click="triggerSync"
  >
    <!-- Icône / indicateur animé -->
    <span v-if="isSyncing" class="sync-dot dot-spinning"></span>
    <span v-else-if="pendingCount > 0" class="sync-dot dot-pending"></span>
    <span v-else class="sync-dot dot-synced"></span>

    <span class="sync-label">
      <template v-if="isSyncing">Synchronisation...</template>
      <template v-else-if="pendingCount > 0">{{ pendingCount }} en attente</template>
      <template v-else>À jour</template>
    </span>
  </button>
</template>

<style scoped>
.sync-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-surface, #ffffff);
  color: var(--text-muted, #64748b);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.sync-pill:hover {
  background: var(--bg-surface-hover, #f8fafc);
}

.sync-pending {
  border-color: #f59e0b;
  color: #b45309;
  background: #fffbeb;
}

.sync-online {
  border-color: #10b981;
  color: #047857;
  background: #ecfdf5;
}

.sync-active {
  border-color: #3b82f6;
  color: #1d4ed8;
  background: #eff6ff;
}

.sync-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.dot-synced {
  background-color: #10b981;
}

.dot-pending {
  background-color: #f59e0b;
}

.dot-spinning {
  background-color: #3b82f6;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.6; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.6; }
}
</style>
