<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    required: true,
  },
  icon: {
    type: String,
    default: '📊',
  },
  subtitle: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: 'blue', // 'blue', 'green', 'amber', 'red'
  },
})
</script>

<template>
  <div class="stat-card" :class="`stat-${color}`">
    <div class="stat-header">
      <span class="stat-title">{{ title }}</span>
      <span class="stat-icon">{{ icon }}</span>
    </div>
    <div class="stat-value">{{ value }}</div>
    <div v-if="subtitle" class="stat-subtitle">{{ subtitle }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-title {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted, #64748b);
  letter-spacing: 0.03em;
}

.stat-icon {
  font-size: 1.2rem;
}

.stat-value {
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--text-main, #0f172a);
}

.stat-subtitle {
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
}

.stat-blue {
  border-top: 3px solid #3b82f6;
}

.stat-green {
  border-top: 3px solid #10b981;
}

.stat-amber {
  border-top: 3px solid #f59e0b;
}

.stat-red {
  border-top: 3px solid #ef4444;
}
</style>
