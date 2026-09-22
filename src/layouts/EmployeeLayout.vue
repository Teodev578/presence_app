<script setup>
import { ref, computed } from 'vue'
import { useRouter } from '../router'
import { useAuth } from '../composables/useAuth'
import { useProfile } from '../composables/useProfile'
import SyncIndicator from '../components/shared/SyncIndicator.vue'

const { currentPath, navigate } = useRouter()
const { signOut } = useAuth()
const { profile } = useProfile()

const drawerOpen = ref(false)

const userInitial = computed(() => {
  const name = profile.value?.full_name || 'U'
  return name.trim()[0].toUpperCase()
})

const handleNav = (path) => {
  drawerOpen.value = false
  navigate(path)
}

const handleLogout = async () => {
  drawerOpen.value = false
  await signOut()
  navigate('/login')
}
</script>

<template>
  <div class="drawer min-h-screen bg-base-100 text-base-content">
    <!-- Contrôle réactif du tiroir latéral -->
    <input id="employee-drawer" type="checkbox" class="drawer-toggle" v-model="drawerOpen" />

    <!-- Conteneur principal de l'application -->
    <div class="drawer-content flex flex-col min-h-screen pb-[calc(4.5rem+var(--safe-bottom,0px))] md:pb-8">
      <!-- Barre de navigation supérieure épurée -->
      <header class="navbar bg-base-100/90 backdrop-blur-md sticky top-0 z-30 border-b border-base-300 px-4 sm:px-6 min-h-14">
        <!-- Bouton hamburger (tablette et desktop) + Marque & Logo -->
        <div class="flex items-center gap-2 sm:gap-3">
          <label
            for="employee-drawer"
            class="btn btn-ghost btn-circle btn-sm min-h-10 min-w-10 text-base-content hidden md:inline-flex cursor-pointer"
            aria-label="Ouvrir le menu de navigation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>

          <div class="w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span class="font-bold text-base tracking-tight text-base-content">PresenceApp</span>
        </div>

        <div class="flex-1"></div>

        <!-- Actions de droite : Synchronisation + Déconnexion rapide -->
        <div class="flex items-center gap-2">
          <button
            v-if="profile?.role === 'admin' || profile?.role === 'manager'"
            type="button"
            class="btn btn-ghost btn-xs font-semibold text-primary hover:bg-primary/10 rounded-m3-sm hidden sm:inline-flex min-h-8"
            title="Accéder au tableau de bord gestionnaire"
            @click="navigate('/manager')"
          >
            Tableau de bord
          </button>
          <SyncIndicator />
          <button
            type="button"
            class="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content min-w-9 min-h-9"
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

      <!-- Conteneur principal de la vue active -->
      <main class="flex-1 p-4 sm:p-6 w-full max-w-xl md:max-w-3xl mx-auto">
        <slot />
      </main>

      <!-- Barre de navigation inférieure Mobile uniquement (< 768px) -->
      <nav
        class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-base-100/95 backdrop-blur-md border-t border-base-300/70 flex flex-row items-center justify-around w-full h-[calc(4rem+var(--safe-bottom,0px))] pb-[var(--safe-bottom,0px)] px-3 shadow-lg"
        role="tablist"
        aria-label="Navigation principale mobile"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="currentPath === '/employee'"
          aria-label="Espace de pointage"
          class="flex-1 flex flex-col items-center justify-center h-full py-1 text-center transition-colors cursor-pointer select-none"
          @click="navigate('/employee')"
        >
          <div
            class="flex items-center justify-center px-5 py-1 rounded-full transition-all"
            :class="currentPath === '/employee' ? 'bg-primary/15 text-primary' : 'bg-transparent text-base-content/70 hover:text-base-content'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span
            class="text-[11px] mt-0.5 tracking-tight transition-colors"
            :class="currentPath === '/employee' ? 'font-bold text-primary' : 'font-medium text-base-content/70'"
          >
            Pointage
          </span>
        </button>

        <button
          type="button"
          role="tab"
          :aria-selected="currentPath.includes('/employee/check')"
          aria-label="Pointer présence"
          class="flex-1 flex flex-col items-center justify-center h-full py-1 text-center transition-colors cursor-pointer select-none"
          @click="navigate('/employee/check-in')"
        >
          <div
            class="flex items-center justify-center px-5 py-1 rounded-full transition-all"
            :class="currentPath.includes('/employee/check') ? 'bg-primary/15 text-primary' : 'bg-transparent text-base-content/70 hover:text-base-content'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <span
            class="text-[11px] mt-0.5 tracking-tight transition-colors"
            :class="currentPath.includes('/employee/check') ? 'font-bold text-primary' : 'font-medium text-base-content/70'"
          >
            Pointer
          </span>
        </button>

        <button
          type="button"
          role="tab"
          :aria-selected="currentPath === '/employee/availabilities'"
          aria-label="Gérer les disponibilités"
          class="flex-1 flex flex-col items-center justify-center h-full py-1 text-center transition-colors cursor-pointer select-none"
          @click="navigate('/employee/availabilities')"
        >
          <div
            class="flex items-center justify-center px-5 py-1 rounded-full transition-all"
            :class="currentPath === '/employee/availabilities' ? 'bg-primary/15 text-primary' : 'bg-transparent text-base-content/70 hover:text-base-content'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <span
            class="text-[11px] mt-0.5 tracking-tight transition-colors"
            :class="currentPath === '/employee/availabilities' ? 'font-bold text-primary' : 'font-medium text-base-content/70'"
          >
            Disponibilités
          </span>
        </button>
      </nav>
    </div>

    <!-- Volet latéral Navigation Drawer (drawer-side) -->
    <div class="drawer-side z-50">
      <label for="employee-drawer" aria-label="Fermer le menu" class="drawer-overlay"></label>
      <aside class="bg-base-200 border-r border-base-300/60 min-h-full w-72 sm:w-80 p-5 flex flex-col justify-between text-base-content">
        <div>
          <!-- En-tête du volet : Profil utilisateur -->
          <div class="flex items-center justify-between pb-4 border-b border-base-300/60">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="avatar placeholder shrink-0">
                <div class="bg-primary/15 text-primary rounded-full w-10 h-10 font-bold text-sm flex items-center justify-center">
                  <span>{{ userInitial }}</span>
                </div>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="font-bold text-sm text-base-content truncate">{{ profile?.full_name || 'Mon compte' }}</span>
                <span class="text-xs text-base-content/60 truncate">Prévu à {{ (profile?.expected_arrival_time || '09:00:00').slice(0, 5) }}</span>
              </div>
            </div>

            <!-- Bouton de fermeture -->
            <label
              for="employee-drawer"
              class="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content cursor-pointer shrink-0"
              aria-label="Fermer le menu"
            >
              ✕
            </label>
          </div>

          <!-- Menu de navigation principal -->
          <nav class="mt-6" aria-label="Navigation latérale">
            <ul class="menu bg-transparent w-full p-0 gap-1.5 font-medium">
              <li>
                <button
                  type="button"
                  class="flex items-center gap-3 py-3 px-3.5 rounded-m3-md transition-colors"
                  :class="currentPath === '/employee' || currentPath.includes('/employee/check')
                    ? 'bg-primary/15 text-primary font-bold'
                    : 'hover:bg-base-300/60 text-base-content/80'"
                  @click="handleNav('/employee')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Pointage de présence</span>
                </button>
              </li>

              <li>
                <button
                  type="button"
                  class="flex items-center gap-3 py-3 px-3.5 rounded-m3-md transition-colors"
                  :class="currentPath === '/employee/availabilities'
                    ? 'bg-primary/15 text-primary font-bold'
                    : 'hover:bg-base-300/60 text-base-content/80'"
                  @click="handleNav('/employee/availabilities')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>Mes disponibilités</span>
                </button>
              </li>

              <li v-if="profile?.role === 'admin' || profile?.role === 'manager'" class="pt-2 border-t border-base-300/40 mt-2">
                <button
                  type="button"
                  class="flex items-center gap-3 py-3 px-3.5 rounded-m3-md text-primary hover:bg-primary/10 transition-colors"
                  @click="handleNav('/manager')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span>Espace Gestionnaire</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <!-- Pied de volet : Déconnexion -->
        <div class="pt-4 border-t border-base-300/60 flex flex-col gap-3">
          <button
            type="button"
            class="btn btn-outline btn-error btn-sm w-full gap-2 rounded-m3-sm min-h-10"
            @click="handleLogout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Se déconnecter</span>
          </button>
          <span class="text-[10px] text-base-content/40 text-center">PresenceApp PWA</span>
        </div>
      </aside>
    </div>
  </div>
</template>
