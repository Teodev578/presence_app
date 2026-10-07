<script setup>
import { ref, computed, watch, onMounted, h } from 'vue'
import { useTheme } from '../../composables/ui/useTheme.js'
import { useSidebarNav } from '../../composables/ui/useSidebarNav.js'

// `inline` active le mode vignettes de prévisualisation (page Paramètres).
const props = defineProps({
  inline: {
    type: Boolean,
    default: false,
  },
})

const { mode, setMode } = useTheme()
const { isRail } = useSidebarNav()

const showSegmented = computed(() => props.inline || !isRail.value)

/** Détection réactive de la préférence système */
const systemIsDark = ref(false)

const updateSystemDark = () => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    systemIsDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
}

onMounted(() => {
  updateSystemDark()
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', updateSystemDark)
    }
  }
})

/** Menu du rail : ouvert sur demande, refermé dès qu'un choix est retenu ou que la barre se déploie. */
const menuOpen = ref(false)

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
      'aria-hidden': 'true',
    },
    paths.map(([tag, attrs]) => h(tag, attrs))
  )

/**
 * Trois états d'apparence avec métadonnées et icônes vectorielles.
 */
const MODES = [
  {
    value: 'system',
    label: 'Automatique',
    hint: "Suivre le réglage d'apparence du système",
    icon: createIcon([
      ['rect', { x: '2', y: '3', width: '20', height: '14', rx: '2', ry: '2' }],
      ['line', { x1: '8', y1: '21', x2: '16', y2: '21' }],
      ['line', { x1: '12', y1: '17', x2: '12', y2: '21' }],
    ]),
  },
  {
    value: 'light',
    label: 'Clair',
    hint: 'Forcer le thème clair',
    icon: createIcon([
      ['circle', { cx: '12', cy: '12', r: '4' }],
      ['line', { x1: '12', y1: '2', x2: '12', y2: '4' }],
      ['line', { x1: '12', y1: '20', x2: '12', y2: '22' }],
      ['line', { x1: '4.22', y1: '4.22', x2: '5.64', y2: '5.64' }],
      ['line', { x1: '18.36', y1: '18.36', x2: '19.78', y2: '19.78' }],
      ['line', { x1: '2', y1: '12', x2: '4', y2: '12' }],
      ['line', { x1: '20', y1: '12', x2: '22', y2: '12' }],
      ['line', { x1: '4.22', y1: '19.78', x2: '5.64', y2: '18.36' }],
      ['line', { x1: '18.36', y1: '5.64', x2: '19.78', y2: '4.22' }],
    ]),
  },
  {
    value: 'dark',
    label: 'Sombre',
    hint: 'Forcer le thème sombre',
    icon: createIcon([['path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' }]]),
  },
]

const activeMode = computed(() => MODES.find((option) => option.value === mode.value) ?? MODES[0])

const currentDescription = computed(() => {
  switch (mode.value) {
    case 'light':
      return 'Contraste élevé recommandé pour les environnements lumineux.'
    case 'dark':
      return 'Confort visuel en faible éclairage et préservation de la batterie.'
    default:
      return `Suit votre appareil (actuellement résolu en mode ${systemIsDark.value ? 'Sombre' : 'Clair'}).`
  }
})

const chooseMode = (value) => {
  setMode(value)
  menuOpen.value = false
}

watch(isRail, (railed) => {
  if (!railed) menuOpen.value = false
})
</script>

<template>
  <div v-if="showSegmented" class="w-full">
    <!-- Barre déployée standard (hors page Paramètres) -->
    <div
      v-if="!props.inline"
      class="join w-full rounded-m3-sm border border-base-300 overflow-hidden"
      role="group"
      aria-label="Apparence de l'interface"
    >
      <button
        v-for="option in MODES"
        :key="option.value"
        type="button"
        class="join-item btn btn-ghost flex-1 min-w-0 min-h-11 gap-1 px-1.5 font-medium"
        :class="mode === option.value ? 'bg-primary/15 text-primary font-bold' : 'text-base-content/70'"
        :aria-pressed="mode === option.value"
        :aria-label="`Thème ${option.label}`"
        :title="option.hint"
        @click="setMode(option.value)"
      >
        <span class="hidden sm:inline-flex" aria-hidden="true">
          <component :is="option.icon" />
        </span>
        <span class="text-xs truncate">{{ option.label }}</span>
      </button>
    </div>

    <!-- Mode vignettes de prévisualisation interactives Material 3 (Option 1 - Page Paramètres) -->
    <div v-else class="flex flex-col gap-3.5 w-full h-full justify-between">
      <div
        class="grid grid-cols-3 gap-2.5 sm:gap-3 w-full"
        role="radiogroup"
        aria-label="Apparence de l'interface"
      >
        <button
          v-for="option in MODES"
          :key="option.value"
          type="button"
          role="radio"
          :aria-checked="mode === option.value"
          :aria-label="`Thème ${option.label}`"
          :title="option.hint"
          class="relative flex flex-col justify-between gap-2.5 p-2 sm:p-2.5 md:p-3 rounded-m3-md border text-left transition-all duration-200 min-h-11 focus-visible:outline-2 focus-visible:outline-primary cursor-pointer select-none"
          :class="mode === option.value
            ? 'border-primary ring-2 ring-primary/25 bg-primary/5 text-base-content font-semibold'
            : 'border-base-300/80 bg-base-100 hover:border-base-content/30 text-base-content/70'"
          @click="chooseMode(option.value)"
        >
          <!-- Vignette 1 : Système (Automatique) -->
          <div
            v-if="option.value === 'system'"
            class="w-full h-12 sm:h-14 md:h-16 rounded-m3-xs border border-base-300/80 overflow-hidden shrink-0 flex shadow-none pointer-events-none"
            aria-hidden="true"
          >
            <div class="w-1/2 h-full bg-[#fdfcff] p-1.5 flex flex-col justify-between border-r border-base-300/80">
              <div class="flex items-center gap-1">
                <div class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                <div class="h-1 bg-slate-300/80 rounded-full w-4 sm:w-8"></div>
              </div>
              <div class="h-2 sm:h-2.5 bg-slate-200/90 rounded-m3-xs w-full"></div>
            </div>
            <div class="w-1/2 h-full bg-[#111318] p-1.5 flex flex-col justify-between">
              <div class="flex items-center gap-1">
                <div class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                <div class="h-1 bg-zinc-700 rounded-full w-4 sm:w-8"></div>
              </div>
              <div class="h-2 sm:h-2.5 bg-zinc-800 rounded-m3-xs w-full"></div>
            </div>
          </div>

          <!-- Vignette 2 : Clair -->
          <div
            v-else-if="option.value === 'light'"
            class="w-full h-12 sm:h-14 md:h-16 rounded-m3-xs border border-slate-200 bg-[#fdfcff] p-1.5 flex flex-col justify-between overflow-hidden shrink-0 shadow-none pointer-events-none"
            aria-hidden="true"
          >
            <div class="flex items-center gap-1">
              <div class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
              <div class="h-1 bg-slate-300/80 rounded-full w-8 sm:w-12"></div>
            </div>
            <div class="flex gap-1.5 items-center">
              <div class="w-2.5 h-5 sm:h-6 rounded-m3-xs bg-slate-200/90 shrink-0"></div>
              <div class="flex-1 flex flex-col gap-0.5 sm:gap-1">
                <div class="h-1.5 sm:h-2 bg-slate-200/80 rounded-full w-full border border-slate-300/40"></div>
                <div class="h-1.5 sm:h-2 bg-slate-200/80 rounded-full w-2/3 border border-slate-300/40"></div>
              </div>
            </div>
          </div>

          <!-- Vignette 3 : Sombre -->
          <div
            v-else
            class="w-full h-12 sm:h-14 md:h-16 rounded-m3-xs border border-zinc-800 bg-[#111318] p-1.5 flex flex-col justify-between overflow-hidden shrink-0 shadow-none pointer-events-none"
            aria-hidden="true"
          >
            <div class="flex items-center gap-1">
              <div class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
              <div class="h-1 bg-zinc-700 rounded-full w-8 sm:w-12"></div>
            </div>
            <div class="flex gap-1.5 items-center">
              <div class="w-2.5 h-5 sm:h-6 rounded-m3-xs bg-zinc-800 shrink-0"></div>
              <div class="flex-1 flex flex-col gap-0.5 sm:gap-1">
                <div class="h-1.5 sm:h-2 bg-zinc-800 rounded-full w-full border border-zinc-700/50"></div>
                <div class="h-1.5 sm:h-2 bg-zinc-800 rounded-full w-2/3 border border-zinc-700/50"></div>
              </div>
            </div>
          </div>

          <!-- Indicateur radio Material 3 en coin supérieur -->
          <div
            class="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-4 h-4 rounded-full flex items-center justify-center border transition-colors z-10"
            :class="mode === option.value ? 'border-primary bg-primary text-primary-content' : 'border-base-300/90 bg-base-200/80'"
            aria-hidden="true"
          >
            <svg
              v-if="mode === option.value"
              xmlns="http://www.w3.org/2000/svg"
              class="w-2.5 h-2.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <!-- Libellé du mode -->
          <div class="flex items-center gap-1 min-w-0 w-full pt-1">
            <component
              :is="option.icon"
              class="w-3.5 h-3.5 shrink-0"
              :class="mode === option.value ? 'text-primary' : 'text-base-content/60'"
            />
            <span class="text-xs font-semibold tracking-tight leading-tight break-words min-w-0">{{ option.label }}</span>
          </div>
        </button>
      </div>

      <!-- Encart contextuel informatif -->
      <div class="flex items-start gap-2.5 p-3 rounded-m3-md bg-base-100 border border-base-300/60 text-xs text-base-content/70 mt-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4 text-primary shrink-0 mt-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <p class="leading-relaxed">
          {{ currentDescription }}
        </p>
      </div>
    </div>
  </div>

  <!-- Barre repliée en rail : menu déroulant accessible -->
  <div v-else class="relative flex w-full justify-center" @keydown.escape="menuOpen = false">
    <button
      type="button"
      class="btn btn-ghost btn-circle min-w-11 min-h-11 text-base-content/80"
      :class="menuOpen ? 'bg-base-300/60 text-base-content' : ''"
      aria-haspopup="true"
      aria-controls="appearance-rail-menu"
      :aria-expanded="menuOpen"
      :aria-label="`Apparence : ${activeMode.label}`"
      :title="`Apparence : ${activeMode.label}`"
      @click="menuOpen = !menuOpen"
    >
      <component :is="activeMode.icon" />
    </button>

    <ul
      v-show="menuOpen"
      id="appearance-rail-menu"
      role="menu"
      aria-label="Apparence de l'interface"
      class="menu absolute bottom-0 left-full z-50 ml-2 w-44 gap-0.5 rounded-m3-sm border border-base-300/60 bg-base-100 p-1"
    >
      <li v-for="option in MODES" :key="option.value">
        <button
          type="button"
          role="menuitemradio"
          class="min-h-11 gap-2"
          :class="mode === option.value ? 'bg-primary/15 text-primary font-bold' : 'text-base-content/80'"
          :aria-checked="mode === option.value"
          :aria-label="`Thème ${option.label}`"
          :title="option.hint"
          @click="chooseMode(option.value)"
        >
          <component :is="option.icon" />
          <span class="text-xs">{{ option.label }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
