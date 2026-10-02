<script setup>
import { ref, computed, h } from 'vue'
import { useRouter } from '../router'
import { useProfile } from '../composables/useProfile'
import { useSidebarNav } from '../composables/useSidebarNav'
import SyncIndicator from '../components/shared/SyncIndicator.vue'
import SyncAlert from '../components/shared/SyncAlert.vue'

const { currentPath, navigate } = useRouter()
const { profile } = useProfile()
const { isRail, isDocked, toggleRail } = useSidebarNav()

const drawerOpen = ref(false)

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
    label: 'Pointage',
    isActive: (path) => path === '/employee' || path.includes('/employee/check'),
    icon: createIcon([
      ['circle', { cx: '12', cy: '12', r: '10' }],
      ['polyline', { points: '12 6 12 12 16 14' }],
    ]),
  },
  {
    path: '/employee/availabilities',
    label: 'Ma disponibilité',
    isActive: (path) => path === '/employee/availabilities',
    icon: createIcon([
      ['rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }],
      ['line', { x1: '16', y1: '2', x2: '16', y2: '6' }],
      ['line', { x1: '8', y1: '2', x2: '8', y2: '6' }],
      ['line', { x1: '3', y1: '10', x2: '21', y2: '10' }],
    ]),
  },
]

// Table de navigation : chaque écran porte son titre et, pour les écrans descendants, sa cible de
// retour. Les destinations du tiroir n'affichent le retour qu'une fois le tiroir masqué (mobile).
const EMPLOYEE_ROUTES = {
  '/': { title: 'Pointage', back: null, sub: false },
  '/employee': { title: 'Pointage', back: null, sub: false },
  '/employee/availabilities': { title: 'Ma disponibilité', back: '/employee', sub: true },
  '/employee/check-in': { title: "Pointage d'arrivée", back: '/employee', sub: true },
  '/employee/check-out': { title: 'Pointage de départ', back: '/employee', sub: true },
  '/employee/settings': { title: 'Paramètres', back: '/employee', sub: true },
}

const barEntry = computed(
  () => EMPLOYEE_ROUTES[currentPath.value] ?? { title: 'Espace Collaborateur', back: null, sub: false }
)
const barTitle = computed(() => barEntry.value.title)
const backTarget = computed(() => barEntry.value.back)
const showBack = computed(() => Boolean(backTarget.value) && (barEntry.value.sub || !isDocked.value))
const onSettings = computed(() => currentPath.value.includes('/settings'))

const gatewayLabel = 'Espace Gestionnaire'

const canReachManagerSpace = computed(() => profile.value?.role === 'admin' || profile.value?.role === 'manager')

const handleNav = (path) => {
  drawerOpen.value = false
  navigate(path)
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
    <div class="employee-onepage drawer-content flex flex-col min-h-screen md:h-screen md:max-h-screen md:overflow-hidden pb-[calc(0.75rem+var(--safe-bottom,0px))] md:pb-2">
      <!-- Barre de navigation supérieure épurée -->
      <header class="navbar bg-base-100/90 backdrop-blur-md sticky top-0 z-30 border-b border-base-300 px-4 sm:px-6 min-h-14 shrink-0">
        <!-- Commande de tête : hamburger sur les destinations de tiroir sous 840px, retour sur les
             écrans descendants et sur les destinations de tiroir une fois le tiroir masqué -->
        <div class="flex items-center gap-2 sm:gap-3">
          <label
            v-if="!showBack"
            for="employee-drawer"
            class="btn btn-ghost btn-circle min-h-11 min-w-11 text-base-content inline-flex cursor-pointer docked:hidden"
            aria-label="Ouvrir le menu de navigation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>

          <button
            v-if="showBack"
            type="button"
            class="btn btn-ghost btn-circle min-w-11 min-h-11 text-base-content/80 hover:text-base-content"
            aria-label="Retour"
            title="Retour"
            @click="navigate(backTarget)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>

          <span class="font-bold text-base tracking-tight text-base-content truncate">{{ barTitle }}</span>
        </div>

        <div class="flex-1"></div>

        <!-- Alerte réseau uniquement : le raccourci gestionnaire vit dans le tiroir, avec les autres entrées -->
        <div class="flex items-center gap-2">
          <SyncAlert />
          <button
            v-if="!onSettings"
            type="button"
            class="btn btn-ghost btn-circle min-w-11 min-h-11 text-base-content/70 hover:text-base-content"
            aria-label="Ouvrir les paramètres"
            title="Paramètres"
            @click="navigate('/employee/settings')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </header>

      <!-- Conteneur principal de la vue active : fluide, optimisé onepage sans scrollbar -->
      <main class="flex-1 flex flex-col w-full max-w-6xl xl:max-w-7xl 2xl:max-w-none mx-auto px-4 sm:px-5 md:px-6 lg:px-6 xl:px-8 py-2 md:py-2.5 transition-all min-h-0 overflow-visible md:overflow-hidden">
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
          <div class="rail-header flex items-center justify-between gap-2 pb-4 border-b border-base-300/60 relative">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary drawer-rail:w-10 drawer-rail:h-10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 drawer-rail:w-6 drawer-rail:h-6">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M14 11l2 2 4-4" />
                </svg>
              </div>
              <div class="rail-hide flex flex-col">
                <span class="font-bold text-base tracking-tight text-base-content">PresenceApp</span>
                <span class="badge badge-primary badge-xs uppercase font-bold tracking-wider">Espace Collaborateur</span>
              </div>
            </div>

            <!-- Poignée de repli : offerte une fois la barre ancrée, seul moyen de passer en rail -->
            <button
              type="button"
              class="rail-handle hidden docked:inline-flex btn btn-ghost btn-circle shrink-0 min-w-11 min-h-11 text-base-content/60 hover:text-base-content"
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
                  class="rail-entry relative flex items-center gap-3 py-3 px-3.5 rounded-m3-md transition-colors focus-visible:outline-2 focus-visible:outline-primary"
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
              <div class="mt-5 border-t border-base-content/20" aria-hidden="true"></div>
              <p class="rail-hide mt-3 px-3.5 text-xs font-medium uppercase tracking-wide text-base-content/60">Mon espace</p>
              <ul class="menu bg-transparent w-full p-0 gap-1.5 font-medium mt-2">
                <li>
                  <button
                    type="button"
                    class="rail-entry flex items-center gap-3 py-3 px-3.5 rounded-m3-md transition-colors text-base-content/80 hover:bg-base-300/60 focus-visible:outline-2 focus-visible:outline-primary"
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

        <!-- Pied de volet : statut réseau seul. Les réglages (apparence, compte, sortie) vivent sur la page Paramètres. -->
        <div class="pt-4 border-t border-base-300/60">
          <div class="rail-center flex items-center justify-between gap-2 min-w-0 px-1">
            <span class="rail-hide text-xs text-base-content/60 font-medium shrink-0">Statut réseau</span>
            <SyncIndicator class="rail-network" />
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
