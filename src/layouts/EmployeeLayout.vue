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
  <div class="min-h-screen flex flex-col bg-base-200 text-base-content pb-20">
    <!-- En-tête mobile supérieur (DaisyUI navbar) -->
    <header class="navbar bg-base-100/90 backdrop-blur-md sticky top-0 z-30 border-b border-base-300 px-4 min-h-14">
      <div class="flex-1 flex items-center gap-2">
        <span class="text-xl">⏱️</span>
        <span class="font-bold text-base tracking-tight">PresenceApp</span>
      </div>

      <div class="flex-none flex items-center gap-2">
        <SyncIndicator />
        <button
          type="button"
          class="btn btn-ghost btn-circle btn-sm"
          title="Se déconnecter"
          aria-label="Se déconnecter"
          @click="handleLogout"
        >
          🚪
        </button>
      </div>
    </header>

    <!-- Conteneur principal de la vue active -->
    <main class="flex-1 p-4 w-full max-w-md mx-auto">
      <slot />
    </main>

    <!-- Barre de navigation inférieure (DaisyUI btm-nav) -->
    <nav class="btm-nav btm-nav-md bg-base-100/95 backdrop-blur-md border-t border-base-300 z-40 fixed bottom-0 left-0 right-0">
      <button
        type="button"
        :class="{ 'active text-primary font-bold': currentPath === '/employee' }"
        @click="navigate('/employee')"
      >
        <span class="text-lg">🏠</span>
        <span class="btm-nav-label text-[11px]">Accueil</span>
      </button>

      <button
        type="button"
        :class="{ 'active text-primary font-bold': currentPath.includes('/employee/check') }"
        @click="navigate('/employee/check-in')"
      >
        <span class="text-lg">📍</span>
        <span class="btm-nav-label text-[11px]">Pointer</span>
      </button>

      <button
        type="button"
        :class="{ 'active text-primary font-bold': currentPath === '/employee/availabilities' }"
        @click="navigate('/employee/availabilities')"
      >
        <span class="text-lg">📅</span>
        <span class="btm-nav-label text-[11px]">Dispos</span>
      </button>
    </nav>
  </div>
</template>
