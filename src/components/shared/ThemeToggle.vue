<script setup>
import { computed, h } from 'vue'
import { useTheme } from '../../composables/useTheme'

defineProps({
  showLabel: {
    type: Boolean,
    default: false,
  },
})

const { mode, cycleTheme } = useTheme()

const MODE_LABELS = { system: 'Système', light: 'Clair', dark: 'Sombre' }
const NEXT_THEME_LABELS = { system: 'clair', light: 'sombre', dark: 'système' }

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

const MODE_ICONS = {
  // Écran : le thème suit le réglage du système
  system: createIcon([
    ['rect', { x: '2', y: '3', width: '20', height: '14', rx: '2', ry: '2' }],
    ['line', { x1: '8', y1: '21', x2: '16', y2: '21' }],
    ['line', { x1: '12', y1: '17', x2: '12', y2: '21' }],
  ]),
  light: createIcon([
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
  dark: createIcon([
    ['path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' }],
  ]),
}

const currentIcon = computed(() => MODE_ICONS[mode.value] || MODE_ICONS.system)
const currentLabel = computed(() => MODE_LABELS[mode.value] || MODE_LABELS.system)
const nextLabel = computed(() => NEXT_THEME_LABELS[mode.value] || 'clair')
const hint = computed(() => `Apparence : ${currentLabel.value}. Cliquer pour passer au thème ${nextLabel.value}.`)
</script>

<template>
  <!-- Variante compacte pour la rangée de réglages des tiroirs -->
  <button
    v-if="showLabel"
    type="button"
    class="btn btn-ghost btn-sm min-h-11 gap-1.5 rounded-m3-sm px-2.5 font-medium text-base-content/70 hover:text-base-content"
    :title="hint"
    :aria-label="hint"
    @click="cycleTheme"
  >
    <component :is="currentIcon" />
    <span class="text-[11px] sm:text-xs leading-none">{{ currentLabel }}</span>
  </button>

  <!-- Variante icône seule pour les en-têtes -->
  <button
    v-else
    type="button"
    class="btn btn-ghost btn-circle min-h-11 min-w-11 text-base-content/80 hover:text-base-content"
    :title="hint"
    :aria-label="hint"
    @click="cycleTheme"
  >
    <component :is="currentIcon" />
  </button>
</template>
