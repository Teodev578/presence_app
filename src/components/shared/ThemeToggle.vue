<script setup>
import { ref, computed, watch, h } from 'vue'
import { useTheme } from '../../composables/useTheme'
import { useSidebarNav } from '../../composables/useSidebarNav'

// `inline` force le groupe segmenté hors tiroir (page Paramètres), même quand la barre est en rail.
const props = defineProps({
  inline: {
    type: Boolean,
    default: false,
  },
})

const { mode, setMode } = useTheme()
const { isRail } = useSidebarNav()

const showSegmented = computed(() => props.inline || !isRail.value)

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
    },
    paths.map(([tag, attrs]) => h(tag, attrs))
  )

/**
 * Trois états possibles. Le libellé visible porte le nom du mode, ce qui satisfait
 * le critère Label in Name, et l'état sélectionné se signale par aria-pressed.
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

const chooseMode = (value) => {
  setMode(value)
  menuOpen.value = false
}

watch(isRail, (railed) => {
  if (!railed) menuOpen.value = false
})
</script>

<template>
  <!-- Barre déployée : un seul contrôle, trois segments joints. L'état retenu porte la teinte
       primaire, les autres restent en retrait et se signalent au survol. -->
  <div
    v-if="showSegmented"
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

  <!-- Barre repliée en rail : les trois segments n'y tiennent plus. L'icône de l'état retenu
       ouvre un menu latéral portant les mêmes choix nommés, hors du rail pour rester lisible. -->
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
