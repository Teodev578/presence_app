import { ref } from 'vue'

/**
 * Clé de persistance du thème. Le script de pré-peinture de index.html lit la même clé
 * avant le montage de l'application, ce qui évite un flash clair au démarrage.
 */
export const THEME_STORAGE_KEY = 'presence_theme'

/** Ordre du cycle du commutateur : le réglage système reste accessible. */
export const THEME_MODES = ['system', 'light', 'dark']

const mode = ref('system')

let initialized = false

const hasDom = () => typeof window !== 'undefined' && typeof document !== 'undefined'

const readStoredMode = () => {
  if (!hasDom()) return 'system'
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return THEME_MODES.includes(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

const persistMode = (value) => {
  if (!hasDom()) return
  try {
    // Le mode système ne laisse aucune surcharge derrière lui : l'attribut disparaît et la préférence OS reprend la main.
    if (value === 'system') window.localStorage.removeItem(THEME_STORAGE_KEY)
    else window.localStorage.setItem(THEME_STORAGE_KEY, value)
  } catch {
    // Stockage indisponible (navigation privée) : le thème appliqué reste valable pour la session
  }
}

const syncThemeColorMeta = () => {
  if (typeof getComputedStyle !== 'function') return
  const meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) return
  const surface = getComputedStyle(document.documentElement).getPropertyValue('--md-sys-color-surface').trim()
  if (surface) meta.setAttribute('content', surface)
}

const applyTheme = () => {
  if (!hasDom()) return
  if (mode.value === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', mode.value)
  syncThemeColorMeta()
}

const setMode = (value) => {
  if (!THEME_MODES.includes(value)) return
  mode.value = value
  persistMode(value)
  applyTheme()
}

/**
 * Applique la préférence stockée, puis suit les changements du réglage système tant qu'aucun
 * thème n'est forcé. Idempotent : les appels suivants ne réenregistrent aucun écouteur.
 */
export function initTheme() {
  if (initialized || !hasDom()) return
  initialized = true

  mode.value = readStoredMode()

  const mediaQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null
  if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', () => {
      if (mode.value === 'system') applyTheme()
    })
  }

  applyTheme()
}

export function useTheme() {
  initTheme()

  const cycleTheme = () => {
    const currentIndex = THEME_MODES.indexOf(mode.value)
    setMode(THEME_MODES[(currentIndex + 1) % THEME_MODES.length])
  }

  return {
    mode,
    cycleTheme,
  }
}
