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
  <div class="min-h-screen flex bg-base-200 text-base-content">
    <!-- Barre latérale Desktop (Sidebar DaisyUI) -->
    <aside class="w-64 bg-base-100 border-r border-base-300 flex flex-col p-4 shrink-0">
      <!-- En-tête Marque -->
      <div class="flex items-center gap-3 px-2 py-3 border-b border-base-200">
        <span class="text-2xl">⏱️</span>
        <div class="flex flex-col">
          <span class="font-bold text-base tracking-tight text-base-content">PresenceApp</span>
          <span class="badge badge-primary badge-xs uppercase font-bold tracking-wider">Espace Manager</span>
        </div>
      </div>

      <!-- Navigation DaisyUI Menu -->
      <nav class="flex-1 mt-6">
        <ul class="menu bg-base-100 w-full p-0 gap-1 font-medium">
          <li v-for="item in navItems" :key="item.path">
            <button
              type="button"
              :class="{ 'active font-semibold': currentPath === item.path }"
              @click="navigate(item.path)"
            >
              <span class="text-lg">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </button>
          </li>
        </ul>
      </nav>

      <!-- Profil & Déconnexion -->
      <div class="border-t border-base-200 pt-4 flex flex-col gap-3">
        <div class="flex items-center gap-3 px-2">
          <div class="avatar avatar-placeholder">
            <div class="bg-primary/10 text-primary w-9 rounded-full font-bold text-sm">
              <span>{{ (profile?.full_name || 'U')[0].toUpperCase() }}</span>
            </div>
          </div>
          <div class="flex flex-col overflow-hidden">
            <span class="text-sm font-semibold text-base-content truncate">{{ profile?.full_name || 'Utilisateur' }}</span>
            <span class="text-xs text-base-content/60 truncate">{{ profile?.email || '' }}</span>
          </div>
        </div>

        <button
          type="button"
          class="btn btn-outline btn-error btn-sm w-full gap-2 mt-1"
          @click="handleLogout"
        >
          🚪 Se déconnecter
        </button>
      </div>
    </aside>

    <!-- Zone principale -->
    <div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
      <header class="navbar bg-base-100 border-b border-base-300 px-6 min-h-16 justify-between sticky top-0 z-20">
        <div class="flex-1">
          <h1 class="text-lg font-bold text-base-content">Administration & Suivi</h1>
        </div>
        <div class="flex-none">
          <SyncIndicator />
        </div>
      </header>

      <main class="flex-1 p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
