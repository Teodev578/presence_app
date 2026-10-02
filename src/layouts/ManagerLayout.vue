<script setup>
import { ref, computed, h } from 'vue'
import { useRouter } from '../router'
import { useSidebarNav } from '../composables/useSidebarNav'
import SyncAlert from '../components/shared/SyncAlert.vue'
import NotificationBell from '../components/shared/NotificationBell.vue'

const { currentPath, navigate } = useRouter()
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
    path: '/manager',
    label: 'Tableau de bord',
    icon: createIcon([
      ['rect', { x: '3', y: '3', width: '7', height: '7' }],
      ['rect', { x: '14', y: '3', width: '7', height: '7' }],
      ['rect', { x: '14', y: '14', width: '7', height: '7' }],
      ['rect', { x: '3', y: '14', width: '7', height: '7' }],
    ]),
  },
  {
    path: '/manager/locations',
    label: 'Lieux de travail',
    icon: createIcon([
      ['path', { d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' }],
      ['circle', { cx: '12', cy: '10', r: '3' }],
    ]),
  },
  {
    path: '/manager/presences',
    label: 'Pointages',
    icon: createIcon([
      ['circle', { cx: '12', cy: '12', r: '10' }],
      ['polyline', { points: '12 6 12 12 16 14' }],
    ]),
  },
  {
    path: '/manager/availabilities',
    label: 'Disponibilités',
    icon: createIcon([
      ['rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }],
      ['line', { x1: '16', y1: '2', x2: '16', y2: '6' }],
      ['line', { x1: '8', y1: '2', x2: '8', y2: '6' }],
      ['line', { x1: '3', y1: '10', x2: '21', y2: '10' }],
    ]),
  },
  {
    path: '/manager/employees',
    label: 'Collaborateurs',
    icon: createIcon([
      ['path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }],
      ['circle', { cx: '12', cy: '7', r: '4' }],
    ]),
  },
  {
    path: '/manager/teams',
    label: 'Équipes',
    icon: createIcon([
      ['path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }],
      ['circle', { cx: '9', cy: '7', r: '4' }],
      ['path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }],
      ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }],
    ]),
  },
  {
    path: '/manager/export',
    label: 'Export CSV',
    icon: createIcon([
      ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }],
      ['polyline', { points: '7 10 12 15 17 10' }],
      ['line', { x1: '12', y1: '15', x2: '12', y2: '3' }],
    ]),
  },
]

// Table de navigation : chaque écran porte son titre et, pour les écrans descendants, sa cible de
// retour. Les destinations du tiroir n'affichent le retour qu'une fois le tiroir masqué (mobile).
const MANAGER_ROUTES = {
  '/manager': { title: 'Tableau de bord', back: null, sub: false },
  '/manager/locations': { title: 'Lieux de travail', back: '/manager', sub: false },
  '/manager/presences': { title: 'Pointages', back: '/manager', sub: false },
  '/manager/availabilities': { title: 'Disponibilités', back: '/manager', sub: false },
  '/manager/employees': { title: 'Équipe', back: '/manager', sub: false },
  '/manager/teams': { title: 'Équipes', back: '/manager', sub: false },
  '/manager/export': { title: 'Export CSV', back: '/manager', sub: false },
  '/manager/settings': { title: 'Paramètres', back: '/manager', sub: true },
}

const barEntry = computed(
  () => MANAGER_ROUTES[currentPath.value] ?? { title: 'Espace Manager', back: null, sub: false }
)
const barTitle = computed(() => barEntry.value.title)
const backTarget = computed(() => barEntry.value.back)
const showBack = computed(() => Boolean(backTarget.value) && (barEntry.value.sub || !isDocked.value))
const onSettings = computed(() => currentPath.value.includes('/settings'))

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
    <input id="manager-drawer" type="checkbox" class="drawer-toggle" v-model="drawerOpen" />

    <!-- Conteneur principal -->
    <div class="drawer-content flex flex-col min-h-screen min-w-0">
      <!-- En-tête supérieur adaptatif -->
      <header class="navbar bg-base-100/90 backdrop-blur-md border-b border-base-300 px-4 sm:px-6 min-h-14 lg:min-h-16 sticky top-0 z-30 justify-between">
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Bouton hamburger (mobile et tablette < 840px), cédé au retour sur les écrans descendants -->
          <label
            v-if="!showBack"
            for="manager-drawer"
            class="btn btn-ghost btn-circle min-h-11 min-w-11 text-base-content docked:hidden cursor-pointer"
            aria-label="Ouvrir le menu de gestion"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>

          <!-- Retour : écrans descendants à toute largeur, destinations du tiroir une fois le tiroir masqué -->
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

          <span class="text-base sm:text-lg font-bold text-base-content truncate">{{ barTitle }}</span>
        </div>

        <!-- Actions supérieures : notifications, alerte réseau et accès paramètres -->
        <div class="flex items-center gap-2 sm:gap-3">
          <SyncAlert v-if="!onSettings" />
          <NotificationBell v-if="!onSettings" />
          
          <button
            v-if="!onSettings"
            type="button"
            class="btn btn-ghost btn-circle min-w-11 min-h-11 text-base-content/70 hover:text-base-content"
            aria-label="Ouvrir les paramètres"
            title="Paramètres"
            @click="navigate('/manager/settings')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </header>

      <!-- Corps de la vue active : fluide, exploite l'ensemble de l'espace sur grand écran -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 xl:px-10 w-full max-w-none">
        <slot />
      </main>
    </div>

    <!-- Volet latéral / Sidebar (drawer-side) -->
    <div class="drawer-side z-50">
      <label for="manager-drawer" aria-label="Fermer le menu" class="drawer-overlay"></label>
      <aside
        id="manager-sidebar"
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
                <span class="badge badge-primary badge-xs uppercase font-bold tracking-wider">Espace Manager</span>
              </div>
            </div>

            <!-- Poignée de repli : offerte une fois la barre ancrée, seul moyen de passer en rail -->
            <button
              type="button"
              class="rail-handle hidden docked:inline-flex btn btn-ghost btn-circle shrink-0 min-w-11 min-h-11 text-base-content/60 hover:text-base-content"
              aria-controls="manager-sidebar"
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

          <!-- Navigation principale -->
          <nav class="mt-6" aria-label="Navigation latérale">
            <p class="rail-hide px-3.5 text-xs font-medium uppercase tracking-wide text-base-content/60">Navigation</p>
            <ul class="menu bg-transparent w-full p-0 gap-1.5 font-medium mt-2">
              <li v-for="item in navItems" :key="item.path">
                <button
                  type="button"
                  class="rail-entry relative flex items-center gap-3 py-3 px-3.5 rounded-m3-md transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                  :class="[
                    currentPath === item.path
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
                    :class="currentPath === item.path ? 'bg-primary' : 'bg-transparent'"
                  ></span>
                  <component :is="item.icon" />
                  <span class="rail-hide text-sm">{{ item.label }}</span>
                </button>
              </li>
            </ul>

            <!-- Passerelle vers mon espace de pointage personnel. Rangée neutre : la teinte
                 primaire est réservée à l'entrée sélectionnée. -->
            <div class="mt-5 border-t border-base-content/20" aria-hidden="true"></div>
            <p class="rail-hide mt-3 px-3.5 text-xs font-medium uppercase tracking-wide text-base-content/60">Mon espace</p>
            <ul class="menu bg-transparent w-full p-0 gap-1.5 font-medium mt-2">
              <li>
                <button
                  type="button"
                  class="rail-entry flex items-center gap-3 py-3 px-3.5 rounded-m3-md transition-colors text-base-content/80 hover:bg-base-300/60 focus-visible:outline-2 focus-visible:outline-primary"
                  :class="isRail ? 'tooltip tooltip-right' : ''"
                  aria-label="Mon pointage personnel"
                  :data-tip="isRail ? 'Mon pointage personnel' : null"
                  @click="handleNav('/employee')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span class="rail-hide text-sm">Mon pointage personnel</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    </div>
  </div>
</template>
