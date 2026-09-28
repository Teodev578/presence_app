import { ref, computed } from 'vue'

/**
 * Clé de persistance du repli de la barre latérale. En l'absence de valeur, le seuil décide :
 * entre 840 px et 1024 px, la barre se replie d'elle-même en rail pour épargner la largeur de
 * la vue. Un clic sur la poignée inscrit un choix explicite, qui prime ensuite sur ce seuil.
 */
export const SIDEBAR_STORAGE_KEY = 'presence_nav_collapsed'

/** Seuil d'ancrage de la règle 07 : en deçà, la barre est un tiroir superposé et le rail n'a pas d'objet. */
export const DOCKED_QUERY = '(min-width: 840px)'

/** Bande d'ancrage étroite où la barre se replie d'elle-même. */
export const AUTO_RAIL_QUERY = '(min-width: 840px) and (max-width: 1023.98px)'

/** `null` suit le seuil, `true` replie, `false` déploie. */
const explicit = ref(null)

const isDocked = ref(false)

const isAutoRail = ref(false)

let initialized = false

const hasDom = () => typeof window !== 'undefined' && typeof document !== 'undefined'

const readStoredPreference = () => {
  if (!hasDom()) return null
  try {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored === 'true') return true
    if (stored === 'false') return false
    return null
  } catch {
    return null
  }
}

const persistPreference = (value) => {
  if (!hasDom()) return
  try {
    if (value === null) window.localStorage.removeItem(SIDEBAR_STORAGE_KEY)
    else window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value))
  } catch {
    // Stockage indisponible (navigation privée) : le repli reste valable pour la session
  }
}

/**
 * Applique la préférence stockée puis suit les deux seuils. Idempotent : les appels suivants
 * ne réenregistrent aucun écouteur.
 */
export function initSidebarNav() {
  if (initialized || !hasDom()) return
  initialized = true

  explicit.value = readStoredPreference()

  if (typeof window.matchMedia !== 'function') return

  const docked = window.matchMedia(DOCKED_QUERY)
  const autoRail = window.matchMedia(AUTO_RAIL_QUERY)
  isDocked.value = docked.matches
  isAutoRail.value = autoRail.matches

  const follows = (mediaQuery, target) => {
    if (typeof mediaQuery.addEventListener !== 'function') return
    mediaQuery.addEventListener('change', (event) => {
      target.value = event.matches
    })
  }

  follows(docked, isDocked)
  follows(autoRail, isAutoRail)
}

export function useSidebarNav() {
  initSidebarNav()

  // Le rail n'existe qu'une fois la barre ancrée : sous 840 px, le tiroir superposé se déploie
  // en pleine largeur et garde ses libellés, quelle que soit la préférence enregistrée.
  const isRail = computed(() => isDocked.value && (explicit.value ?? isAutoRail.value))

  const toggleRail = () => {
    explicit.value = !isRail.value
    persistPreference(explicit.value)
  }

  return {
    isRail,
    toggleRail,
  }
}
