import { ref, computed } from 'vue'

/**
 * Clé de persistance du repli de la barre latérale. En l'absence de valeur, le seuil décide :
 * entre 840 px et 1024 px, la barre se replie d'elle-même en rail pour épargner la largeur de
 * la vue ; au delà, elle se déploie. Un clic sur la poignée inscrit un choix borné à la bande
 * où il a été pris ; tout franchissement de seuil l'efface et rend la main au seuil.
 */
export const SIDEBAR_STORAGE_KEY = 'presence_nav_collapsed'

/** Seuil d'ancrage de la règle 07 : en deçà, la barre est un tiroir superposé et le rail n'a pas d'objet. */
export const DOCKED_QUERY = '(min-width: 840px)'

/** Bande d'ancrage étroite où la barre se replie d'elle-même. */
export const AUTO_RAIL_QUERY = '(min-width: 840px) and (max-width: 1023.98px)'

/** `null` suit le seuil, `true` replie, `false` déploie, jusqu'au prochain franchissement. */
const explicit = ref(null)

const isDocked = ref(false)

const isAutoRail = ref(false)

let initialized = false

const hasDom = () => typeof window !== 'undefined' && typeof document !== 'undefined'

/** Bande de largeur courante : la préférence n'y vaut que pour elle. */
const currentBand = () => (isAutoRail.value ? 'tablet' : 'desktop')

const readStoredPreference = (band) => {
  if (!hasDom()) return null
  try {
    const raw = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.collapsed === 'boolean' && parsed.band === band) return parsed.collapsed
    return null
  } catch {
    // Valeur absente, héritée d'un ancien format ou corrompue : le seuil décide
    return null
  }
}

const persistPreference = (value, band) => {
  if (!hasDom()) return
  try {
    if (value === null) window.localStorage.removeItem(SIDEBAR_STORAGE_KEY)
    else window.localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify({ collapsed: value, band }))
  } catch {
    // Stockage indisponible (navigation privée) : le repli reste valable pour la session
  }
}

/**
 * Applique la préférence stockée puis suit les deux seuils. Idempotent : les appels suivants
 * ne réenregistrent aucun écouteur. Tout franchissement de seuil révoque la préférence : le
 * seuil gagne toujours, en repli (tablette) comme en déploiement (desktop).
 */
export function initSidebarNav() {
  if (initialized || !hasDom()) return
  initialized = true

  if (typeof window.matchMedia !== 'function') return

  const docked = window.matchMedia(DOCKED_QUERY)
  const autoRail = window.matchMedia(AUTO_RAIL_QUERY)
  isDocked.value = docked.matches
  isAutoRail.value = autoRail.matches

  explicit.value = readStoredPreference(currentBand())

  const follows = (mediaQuery, target) => {
    if (typeof mediaQuery.addEventListener !== 'function') return
    mediaQuery.addEventListener('change', (event) => {
      target.value = event.matches
      explicit.value = null
      persistPreference(null)
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
    persistPreference(explicit.value, currentBand())
  }

  return {
    isRail,
    toggleRail,
  }
}
