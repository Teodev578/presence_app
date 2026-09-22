<script setup>
import { useRouter } from '../router'
import { useAuth } from '../composables/useAuth'
import { useProfile } from '../composables/useProfile'
import SyncIndicator from '../components/shared/SyncIndicator.vue'

const { currentPath, navigate } = useRouter()
const { signOut } = useAuth()
const { profile } = useProfile()

const handleLogout = async () => {
  await signOut()
  navigate('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-base-200 text-base-content pb-20 md:pb-8">
    <!-- Barre de navigation supérieure responsive -->
    <header class="navbar bg-base-100/90 backdrop-blur-md sticky top-0 z-30 border-b border-base-300 px-4 sm:px-6 min-h-14">
      <!-- Marque & Logo -->
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <span class="font-bold text-base tracking-tight text-base-content">PresenceApp</span>
      </div>

      <!-- Navigation Desktop (visible dès l'écran moyen) -->
      <nav class="hidden md:flex items-center gap-1 ml-8">
        <button
          type="button"
          class="btn btn-sm text-xs font-semibold rounded-lg transition-colors"
          :class="currentPath === '/employee' || currentPath.includes('/employee/check')
            ? 'btn-primary'
            : 'btn-ghost text-base-content/70 hover:text-base-content'"
          @click="navigate('/employee')"
        >
          Pointage
        </button>
        <button
          type="button"
          class="btn btn-sm text-xs font-semibold rounded-lg transition-colors"
          :class="currentPath === '/employee/availabilities'
            ? 'btn-primary'
            : 'btn-ghost text-base-content/70 hover:text-base-content'"
          @click="navigate('/employee/availabilities')"
        >
          Disponibilités
        </button>
      </nav>

      <div class="flex-1"></div>

      <!-- Actions de droite : Sync + Rôle manager éventuel + Déconnexion -->
      <div class="flex items-center gap-2">
        <button
          v-if="profile?.role === 'admin' || profile?.role === 'manager'"
          type="button"
          class="btn btn-ghost btn-xs font-semibold text-primary hover:bg-primary/10 rounded-lg hidden sm:inline-flex"
          title="Accéder au tableau de bord gestionnaire"
          @click="navigate('/manager')"
        >
          Tableau de bord
        </button>
        <SyncIndicator />
        <button
          type="button"
          class="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
          title="Se déconnecter"
          aria-label="Se déconnecter"
          @click="handleLogout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </header>

    <!-- Conteneur principal de la vue active (largeur adaptative) -->
    <main class="flex-1 p-4 sm:p-6 w-full max-w-xl md:max-w-2xl mx-auto">
      <slot />
    </main>

    <!-- Barre de navigation inférieure Mobile uniquement (DaisyUI btm-nav) -->
    <nav class="md:hidden btm-nav btm-nav-md bg-base-100/95 backdrop-blur-md border-t border-base-300 z-40 fixed bottom-0 left-0 right-0">
      <button
        type="button"
        :class="{ 'active text-primary font-bold': currentPath === '/employee' }"
        @click="navigate('/employee')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span class="btm-nav-label text-[11px]">Pointage</span>
      </button>

      <button
        type="button"
        :class="{ 'active text-primary font-bold': currentPath.includes('/employee/check') }"
        @click="navigate('/employee/check-in')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span class="btm-nav-label text-[11px]">Pointer</span>
      </button>

      <button
        type="button"
        :class="{ 'active text-primary font-bold': currentPath === '/employee/availabilities' }"
        @click="navigate('/employee/availabilities')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span class="btm-nav-label text-[11px]">Disponibilités</span>
      </button>
    </nav>
  </div>
</template>
