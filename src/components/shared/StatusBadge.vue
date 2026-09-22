<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: 'present',
  },
})

const badgeConfig = computed(() => {
  switch (props.status) {
    case 'present':
      return { label: 'Présent', class: 'badge-present' }
    case 'late':
      return { label: 'En retard', class: 'badge-late' }
    case 'completed':
      return { label: 'Terminé', class: 'badge-completed' }
    case 'absent':
      return { label: 'Absent', class: 'badge-absent' }
    default:
      return { label: props.status || 'Inconnu', class: 'badge-default' }
  }
})
</script>

<template>
  <span class="status-badge" :class="badgeConfig.class">
    <span class="status-dot"></span>
    {{ badgeConfig.label }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.01em;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.badge-present {
  background-color: #ecfdf5;
  color: #059669;
}

.badge-late {
  background-color: #fffbeb;
  color: #d97706;
}

.badge-completed {
  background-color: #eff6ff;
  color: #2563eb;
}

.badge-absent {
  background-color: #fef2f2;
  color: #dc2626;
}

.badge-default {
  background-color: #f1f5f9;
  color: #64748b;
}
</style>
