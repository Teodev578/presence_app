<script setup>
import { ref, computed, h } from 'vue'
import { useRouter } from '../router'
import { useAuth } from '../composables/useAuth'
import { useProfile } from '../composables/useProfile'
import { useSidebarNav } from '../composables/useSidebarNav'
import SyncIndicator from '../components/shared/SyncIndicator.vue'
import SyncAlert from '../components/shared/SyncAlert.vue'
import ThemeToggle from '../components/shared/ThemeToggle.vue'

const { currentPath, navigate } = useRouter()
const { signOut } = useAuth()
const { profile } = useProfile()
const { isRail, toggleRail } = useSidebarNav()

const drawerOpen = ref(false)

const userInitial = computed(() => {
  const name = profile.value?.full_name || 'U'
  return name.trim()[0].toUpperCase()
})

const expectedArrival = computed(() => (profile.value?.expected_arrival_time || '09:00:00').slice(0, 5))

const railHandleLabel = computed(() => (isRail.value ? 'Déplier la navigation' : 'Replier la navigation'))

const createIcon = (paths) => () =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      class: 'w-5 h-5 shrink-0',
    },
    paths.map(([tag, attrs]) => h(tag, attrs))
  )

const navItems = [
  {
    path: '/employee',
    label: 'Pointage de présence',
    isActive: (path) => path === '/employee' || path.includes('/employee/check'),
    icon: createIcon([
      ['circle', { cx: '12', cy: '12', r: '10' }],
      ['polyline', { points: '12 6 12 12 16 14' }],
    ]),
  },
  {
    path: '/employee/availabilities',
    label: 'Mes disponibilités',
    isActive: (path) => path === '/employee/availabilities',
    icon: createIcon([
      ['rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }],
      ['line', { x1: '16', y1: '2', x2: '16', y2: '6' }],
      ['line', { x1: '8', y1: '2', x2: '8', y2: '6' }],
      ['line', { x1: '3', y1: '10', x2: '21', y2: '10' }],
    ]),
  },
]

const gatewayLabel = 'Espace Gestionnaire'

const canReachManagerSpace = computed(() => profile.value?.role === 'admin' || profile.value?.role === 'manager')

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
  <div
    class="drawer drawer-docked min-h-screen bg-base-100 text-base-content"
    :class="{ 'drawer-rail': isRail }"
  >
    <!-- Contrôle réactif du tiroir latéral -->
    <input id="employee-drawer" type="checkbox" class="drawer-toggle" v-model="drawerOpen" />

    <!-- Conteneur principal de l'application : onepage strict sans défilement sur tablette et desktop -->
    <div class="drawer-content flex flex-col min-h-screen md:h-screen md:max-h-screen md:overflow-hidden pb-[calc(0.75rem+var(--safe-bottom,0px))] md:pb-2">
      <!-- Barre de navigation supérieure épurée -->
      <header class="navbar bg-base-100/90 backdrop-blur-md sticky top-0 z-30 border-b border-base-300 px-4 sm:px-6 min-h-14 shrink-0">
        <!-- Bouton hamburger (mobile et tablette < 840px) + Marque & Logo -->
        <div class="flex items-center gap-2 sm:gap-3">
          <label
            for="employee-drawer"
            class="btn btn-ghost btn-circle btn-sm min-h-12 min-w-12 sm:min-h-10 sm:min-w-10 text-base-content inline-flex cursor-pointer docked:hidden"
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

        <!-- Alerte réseau uniquement : le raccourci gestionnaire vit dans le tiroir, avec les autres entrées -->
        <div class="flex items-center gap-2">
          <SyncAlert />
        </div>
      </header>

      <!-- Conteneur principal de la vue active : fluide, optimisé onepage sans scrollbar -->
      <main class="flex-1 flex flex-col w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-5 md:px-6 lg:px-6 xl:px-8 py-2 md:py-2.5 transition-all min-h-0 overflow-visible md:overflow-hidden">
        <slot />
      </main>
    </div>

    <!-- Volet latéral Navigation Drawer (drawer-side) -->
    <div class="drawer-side z-50">
      <label for="employee-drawer" aria-label="Fermer le menu" class="drawer-overlay"></label>
      <aside
        id="employee-sidebar"
        class="relative bg-base-200 border-r border-base-300/60 min-h-full w-72 sm:w-80 p-5 flex flex-col justify-between text-base-content"
      >
        <div>
          <!-- En-tête Marque & Logo, poignée de repli comprise -->
          <div class="rail-header flex items-center justify-between pb-4 border-b border-base-300/60">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div class="rail-hide flex flex-col">
                <span class="font-bold text-base tracking-tight text-base-content">PresenceApp</span>
                <span class="badge badge-primary badge-xs uppercase font-bold tracking-wider">Espace Collaborateur</span>
              </div>
            </div>

            <!-- Bouton de fermeture du tiroir superposé (< 840px) -->
            <label
              for="employee-drawer"
              class="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content cursor-pointer shrink-0 docked:hidden"
              aria-label="Fermer le menu"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </label>

            <!-- Poignée de repli : offerte une fois la barre ancrée, seul moyen de passer en rail -->
            <button
              type="button"
              class="rail-handle hidden docked:inline-flex btn btn-ghost btn-circle absolute top-5 right-4 min-w-11 min-h-11 text-base-content/60 hover:text-base-content"
              aria-controls="employee-sidebar"
              :aria-expanded="!isRail"
              :aria-label="railHandleLabel"
              :title="railHandleLabel"
              @click="toggleRail"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 transition-transform"
                :class="isRail ? 'rotate-180' : ''"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>

          <!-- Menu de navigation principal -->
          <nav class="mt-6" aria-label="Navigation latérale">
            <p class="rail-hide px-3.5 text-xs font-medium uppercase tracking-wide text-base-content/60">Navigation</p>
            <ul class="menu bg-transparent w-full p-0 gap-1.5 font-medium mt-2">
              <li v-for="item in navItems" :key="item.path">
                <button
                  type="button"
                  class="rail-entry relative flex items-center gap-3 py-3 px-3.5 rounded-m3-md transition-colors"
                  :class="[
                    item.isActive(currentPath)
                      ? 'bg-primary/15 text-primary font-bold'
                      : 'hover:bg-base-300/60 text-base-content/80',
                    isRail ? 'tooltip tooltip-right' : '',
                  ]"
                  :aria-label="item.label"
                  :data-tip="isRail ? item.label : null"
                  @click="handleNav(item.path)"
                >
                  <span
                    aria-hidden="true"
                    class="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full transition-colors"
                    :class="item.isActive(currentPath) ? 'bg-primary' : 'bg-transparent'"
                  ></span>
                  <component :is="item.icon" />
                  <span class="rail-hide text-sm">{{ item.label }}</span>
                </button>
              </li>
            </ul>

            <!-- Passerelle vers l'espace de gestion. Rangée neutre : la teinte primaire
                 est réservée à l'entrée sélectionnée. -->
            <template v-if="canReachManagerSpace">
              <p class="rail-hide mt-5 px-3.5 text-xs font-medium uppercase tracking-wide text-base-content/60">Mon espace</p>
              <ul class="menu bg-transparent w-full p-0 gap-1.5 font-medium mt-2">
                <li>
                  <button
                    type="button"
                    class="rail-entry flex items-center gap-3 py-3 px-3.5 rounded-m3-md transition-colors text-base-content/80 hover:bg-base-300/60"
                    :class="isRail ? 'tooltip tooltip-right' : ''"
                    :aria-label="gatewayLabel"
                    :data-tip="isRail ? gatewayLabel : null"
                    @click="handleNav('/manager')"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    <span class="rail-hide text-sm">{{ gatewayLabel }}</span>
                  </button>
                </li>
              </ul>
            </template>
          </nav>
        </div>

        <!-- Pied de volet : réglages, identité et sortie -->
        <div class="pt-4 border-t border-base-300/60 flex flex-col gap-3">
          <!-- Deux rangées distinctes : le badge de synchronisation ne peut plus comprimer le contrôle d'apparence -->
          <div class="rail-center flex flex-col gap-2 px-1">
            <div class="rail-center flex items-center justify-between gap-2 min-w-0">
              <span class="rail-hide text-xs text-base-content/60 font-medium shrink-0">Statut réseau</span>
              <SyncIndicator class="rail-network" />
            </div>
            <ThemeToggle />
          </div>

          <div class="rail-stack flex items-center gap-3 px-1">
            <div class="avatar placeholder shrink-0">
              <div class="bg-primary/15 text-primary rounded-full w-10 h-10 font-bold text-sm flex items-center justify-center">
                <span>{{ userInitial }}</span>
              </div>
            </div>
            <div class="rail-hide flex flex-col min-w-0">
              <span class="font-bold text-sm text-base-content truncate">{{ profile?.full_name || 'Mon compte' }}</span>
              <span class="text-xs text-base-content/60 truncate">Prévu à {{ expectedArrival }}</span>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-circle text-error min-w-11 min-h-11 ml-auto shrink-0"
              aria-label="Se déconnecter"
              title="Se déconnecter"
              @click="handleLogout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
