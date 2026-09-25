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
      return { label: 'Présent', badgeClass: 'badge-success text-success-content' }
    case 'late':
      return { label: 'En retard', badgeClass: 'badge-warning text-warning-content' }
    case 'completed_late':
      // Journée close : le retard reste lisible, sans colorer d'alarme un travail terminé
      return { label: 'Terminé', detail: 'avec retard', badgeClass: 'badge-ghost text-base-content/75', dotClass: 'bg-warning' }
    case 'completed':
      return { label: 'Terminé', badgeClass: 'badge-info text-info-content' }
    case 'absent':
      return { label: 'Absent', badgeClass: 'badge-error text-error-content' }
    default:
      return { label: props.status || 'Inconnu', badgeClass: 'badge-ghost' }
  }
})
</script>

<template>
  <span class="badge badge-sm font-semibold gap-1.5 py-2.5 px-3" :class="badgeConfig.badgeClass">
    <span class="inline-block w-1.5 h-1.5 rounded-full" :class="badgeConfig.dotClass || 'bg-current opacity-80'"></span>
    {{ badgeConfig.label }}
    <span v-if="badgeConfig.detail" class="font-normal opacity-70">{{ badgeConfig.detail }}</span>
  </span>
</template>
