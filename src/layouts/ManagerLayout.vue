<script setup>
import { ref, computed, h } from 'vue'
import { useRouter } from '../router'
import { useAuth } from '../composables/useAuth'
import { useProfile } from '../composables/useProfile'
import SyncIndicator from '../components/shared/SyncIndicator.vue'
import ThemeToggle from '../components/shared/ThemeToggle.vue'

const { currentPath, navigate } = useRouter()
const { signOut } = useAuth()
const { profile } = useProfile()

const drawerOpen = ref(false)

const userInitial = computed(() => {
  const name = profile.value?.full_name || 'U'
  return name.trim()[0].toUpperCase()
})

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
      class: 'w-4 h-4 shrink-0',
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
    label: 'Lieux & Sites',
    icon: createIcon([
      ['path', { d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' }],
      ['circle', { cx: '12', cy: '10', r: '3' }],
    ]),
  },
  {
    path: '/manager/presences',
    label: 'Présences',
    icon: createIcon([
      ['circle', { cx: '12', cy: '12', r: '10' }],
      ['polyline', { points: '12 6 12 12 16 14' }],
    ]),
  },
  {
    path: '/manager/availabilities',
    label: 'Disponibilités équipe',
    icon: createIcon([
      ['rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }],
      ['line', { x1: '16', y1: '2', x2: '16', y2: '6' }],
      ['line', { x1: '8', y1: '2', x2: '8', y2: '6' }],
      ['line', { x1: '3', y1: '10', x2: '21', y2: '10' }],
    ]),
  },
  {
    path: '/manager/employees',
    label: 'Employés',
    icon: createIcon([
      ['path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }],
      ['circle', { cx: '9', cy: '7', r: '4' }],
      ['path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }],
      ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }],
    ]),
  },
  {
    path: '/manager/teams',
    label: 'Équipes',
    icon: createIcon([
      ['rect', { x: '4', y: '2', width: '16', height: '20', rx: '2', ry: '2' }],
      ['line', { x1: '9', y1: '22', x2: '9', y2: '2' }],
      ['line', { x1: '15', y1: '22', x2: '15', y2: '2' }],
      ['line', { x1: '4', y1: '12', x2: '20', y2: '12' }],
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

const activeTitle = computed(() => {
  const current = navItems.find((item) => item.path === currentPath.value)
  return current ? current.label : 'Administration & Suivi'
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
  <div class="drawer lg:drawer-open min-h-screen bg-base-200 text-base-content">
    <input id="manager-drawer" type="checkbox" class="drawer-toggle" v-model="drawerOpen" />

    <!-- Conteneur principal -->
    <div class="drawer-content flex flex-col min-h-screen min-w-0">
      <!-- En-tête supérieur adaptatif -->
      <header class="navbar bg-base-100/90 backdrop-blur-md border-b border-base-300 px-4 sm:px-6 min-h-14 lg:min-h-16 sticky top-0 z-30 justify-between">
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Bouton hamburger (mobile et tablette < 1024px) -->
          <label
            for="manager-drawer"
            class="btn btn-ghost btn-circle btn-sm min-h-12 min-w-12 sm:min-h-10 sm:min-w-10 text-base-content lg:hidden cursor-pointer"
            aria-label="Ouvrir le menu de gestion"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>

          <div class="flex items-center gap-2 lg:hidden">
            <div class="w-7 h-7 rounded-m3-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span class="font-bold text-sm tracking-tight text-base-content">PresenceApp</span>
          </div>

          <h1 class="text-base sm:text-lg font-bold text-base-content hidden sm:inline-block lg:block">
            {{ activeTitle }}
          </h1>
        </div>

        <!-- Actions de droite : Indicateur de synchronisation discret + Passerelle Pointage personnel -->
        <div class="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <SyncIndicator compact />

          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-m3-sm font-semibold text-primary hover:bg-primary/10 gap-1.5 min-h-9"
            title="Basculer vers mon espace de pointage personnel"
            @click="navigate('/employee')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span class="hidden sm:inline">Mon pointage</span>
          </button>
        </div>
      </header>

      <!-- Corps de la vue active -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
        <slot />
      </main>
    </div>

    <!-- Volet latéral / Sidebar (drawer-side) -->
    <div class="drawer-side z-50">
      <label for="manager-drawer" aria-label="Fermer le menu" class="drawer-overlay"></label>
      <aside class="w-64 sm:w-72 bg-base-100 border-r border-base-300 min-h-full flex flex-col justify-between p-4 sm:p-5 text-base-content">
        <div>
          <!-- En-tête Marque & Logo -->
          <div class="flex items-center justify-between pb-4 border-b border-base-300/60">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-base tracking-tight text-base-content">PresenceApp</span>
                <span class="badge badge-primary badge-xs uppercase font-bold tracking-wider">Espace Manager</span>
              </div>
            </div>

            <!-- Bouton de fermeture mobile -->
            <label
              for="manager-drawer"
              class="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content cursor-pointer lg:hidden"
              aria-label="Fermer le menu"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </label>
          </div>

          <!-- Navigation principale -->
          <nav class="mt-4 sm:mt-6" aria-label="Navigation latérale">
            <ul class="menu bg-transparent w-full p-0 gap-1 font-medium">
              <li v-for="item in navItems" :key="item.path">
                <button
                  type="button"
                  class="flex items-center gap-3 py-2.5 px-3 rounded-m3-md transition-colors"
                  :class="currentPath === item.path
                    ? 'bg-primary/15 text-primary font-bold'
                    : 'hover:bg-base-300/60 text-base-content/80'"
                  @click="handleNav(item.path)"
                >
                  <component :is="item.icon" />
                  <span class="text-sm">{{ item.label }}</span>
                </button>
              </li>

              <!-- Passerelle vers mon espace de pointage personnel -->
              <li class="pt-2 border-t border-base-300/40 mt-2">
                <button
                  type="button"
                  class="flex items-center gap-3 py-2.5 px-3 rounded-m3-md text-primary hover:bg-primary/10 transition-colors font-semibold"
                  @click="handleNav('/employee')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span class="text-sm">Mon pointage personnel</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <!-- Pied de volet : Statut réseau, Profil utilisateur & Déconnexion -->
        <div class="pt-4 border-t border-base-300/60 flex flex-col gap-3">
          <div class="flex items-center justify-between px-1">
            <span class="text-xs text-base-content/60 font-medium">Statut réseau</span>
            <SyncIndicator />
          </div>

          <ThemeToggle show-label />

          <div class="flex items-center gap-3 px-1">
            <div class="avatar placeholder shrink-0">
              <div class="bg-primary/15 text-primary rounded-full w-9 h-9 font-bold text-sm flex items-center justify-center">
                <span>{{ userInitial }}</span>
              </div>
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-semibold text-base-content truncate">{{ profile?.full_name || 'Gestionnaire' }}</span>
              <span class="text-xs text-base-content/60 truncate">{{ profile?.email || '' }}</span>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-outline btn-error btn-sm w-full gap-2 rounded-m3-sm min-h-10 mt-1"
            @click="handleLogout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
