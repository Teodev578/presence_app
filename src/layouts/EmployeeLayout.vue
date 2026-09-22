<script setup>
import { useRouter } from '../router'
import { useAuth } from '../composables/useAuth'
import SyncIndicator from '../components/shared/SyncIndicator.vue'

const { currentPath, navigate } = useRouter()
const { signOut } = useAuth()

const handleLogout = async () => {
  await signOut()
  navigate('/login')
}
</script>

<template>
  <div class="employee-shell">
    <!-- En-tête mobile supérieur -->
    <header class="mobile-top-bar">
      <div class="brand">
        <span class="brand-logo">⏱️</span>
        <span class="brand-name">PresenceApp</span>
      </div>

      <div class="top-bar-right">
        <SyncIndicator />
        <button
          type="button"
          class="logout-icon-btn"
          title="Se déconnecter"
          @click="handleLogout"
        >
          🚪
        </button>
      </div>
    </header>

    <!-- Conteneur principal de la vue active -->
    <main class="mobile-main-content">
      <slot />
    </main>

    <!-- Barre de navigation inférieure (Bottom Nav) -->
    <nav class="bottom-nav">
      <button
        type="button"
        class="nav-tab"
        :class="{ active: currentPath === '/employee' }"
        @click="navigate('/employee')"
      >
        <span class="tab-icon">🏠</span>
        <span class="tab-label">Accueil</span>
      </button>

      <button
        type="button"
        class="nav-tab"
        :class="{ active: currentPath.includes('/employee/check') }"
        @click="navigate('/employee/check-in')"
      >
        <span class="tab-icon">📍</span>
        <span class="tab-label">Pointer</span>
      </button>

      <button
        type="button"
        class="nav-tab"
        :class="{ active: currentPath === '/employee/availabilities' }"
        @click="navigate('/employee/availabilities')"
      >
        <span class="tab-icon">📅</span>
        <span class="tab-label">Disponibilités</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.employee-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-app, #f8fafc);
  color: var(--text-main, #1e293b);
  padding-bottom: 72px; /* Dégagement pour la barre inférieure */
}

.mobile-top-bar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-logo {
  font-size: 1.3rem;
}

.brand-name {
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
  color: var(--text-main, #0f172a);
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logout-icon-btn {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-icon-btn:hover {
  background: #f1f5f9;
}

.mobile-main-content {
  flex: 1;
  padding: 1.25rem 1rem;
  width: 100%;
  box-sizing: border-box;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border-color, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 40;
}

.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  background: none;
  border: none;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  height: 100%;
  transition: color 0.15s ease;
}

.nav-tab.active {
  color: #2563eb;
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-label {
  font-size: 0.7rem;
  font-weight: 600;
}
</style>
