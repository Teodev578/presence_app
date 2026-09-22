<script setup>
import { useRouter } from '../router'
import { useAuth } from '../composables/useAuth'
import { useProfile } from '../composables/useProfile'
import SyncIndicator from '../components/shared/SyncIndicator.vue'

const { currentPath, navigate } = useRouter()
const { signOut } = useAuth()
const { profile } = useProfile()

const navItems = [
  { path: '/manager', label: 'Tableau de bord', icon: '📊' },
  { path: '/manager/presences', label: 'Présences', icon: '⏱️' },
  { path: '/manager/availabilities', label: 'Disponibilités équipe', icon: '📅' },
  { path: '/manager/employees', label: 'Employés', icon: '👥' },
  { path: '/manager/teams', label: 'Équipes', icon: '🏢' },
  { path: '/manager/export', label: 'Export CSV', icon: '📥' },
]

const handleLogout = async () => {
  await signOut()
  navigate('/login')
}
</script>

<template>
  <div class="manager-container">
    <!-- Barre latérale Desktop (Sidebar) -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="logo-icon">⏱️</span>
        <div class="brand-text">
          <span class="app-title">PresenceApp</span>
          <span class="badge-role">Espace Manager</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.path"
          type="button"
          class="nav-link"
          :class="{ active: currentPath === item.path }"
          @click="navigate(item.path)"
        >
          <span class="link-icon">{{ item.icon }}</span>
          <span class="link-label">{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="profile-chip">
          <div class="avatar-circle">
            {{ (profile?.full_name || 'U')[0].toUpperCase() }}
          </div>
          <div class="profile-names">
            <span class="user-fullname">{{ profile?.full_name || 'Utilisateur' }}</span>
            <span class="user-email">{{ profile?.email || '' }}</span>
          </div>
        </div>

        <button
          type="button"
          class="logout-link"
          @click="handleLogout"
        >
          🚪 Se déconnecter
        </button>
      </div>
    </aside>

    <!-- Zone principale -->
    <div class="main-wrapper">
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">Administration & Suivi</h1>
        </div>
        <div class="header-right">
          <SyncIndicator />
        </div>
      </header>

      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.manager-container {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-app, #f8fafc);
  color: var(--text-main, #0f172a);
}

.sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid var(--border-color, #e2e8f0);
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1rem;
  box-sizing: border-box;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.5rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.logo-icon {
  font-size: 1.6rem;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.app-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.badge-role {
  font-size: 0.7rem;
  color: #2563eb;
  font-weight: 600;
  text-transform: uppercase;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 1.5rem;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.65rem;
  background: none;
  border: none;
  color: #475569;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.nav-link:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.nav-link.active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.link-icon {
  font-size: 1.1rem;
}

.sidebar-footer {
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.profile-chip {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #dbeafe;
  color: #1e40af;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.profile-names {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-fullname {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.7rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-link {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.5rem;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-link:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.top-header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: #0f172a;
}

.page-content {
  flex: 1;
  padding: 2rem;
}

@media (max-width: 900px) {
  .manager-container {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
  }
}
</style>
