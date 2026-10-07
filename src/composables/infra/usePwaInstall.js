import { ref, shallowRef, computed } from 'vue'

// État réactif de niveau module garantissant la capture de beforeinstallprompt dès le chargement initial
const deferredPrompt = shallowRef(null)
const isStandalone = ref(false)
const justInstalled = ref(false)
const isIOS = ref(false)
const isDesktop = ref(false)
const isChromium = ref(false)
const isInstalling = ref(false)
const showIosGuide = ref(false)
const showDesktopGuide = ref(false)
let isInitialized = false

/**
 * Initialise les écouteurs globaux du navigateur pour la détection et l'installation PWA.
 * Idempotent et réentrant en toute sécurité.
 */
export function initPwaInstall() {
  if (typeof window === 'undefined' || isInitialized) return
  isInitialized = true

  const checkStandalone = () => {
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches
    const isNavigatorStandalone = window.navigator.standalone === true
    const isTwa = typeof document !== 'undefined' && document.referrer.includes('android-app://')
    isStandalone.value = Boolean(isStandaloneDisplay || isNavigatorStandalone || isTwa)
  }

  checkStandalone()

  const mediaQuery = window.matchMedia('(display-mode: standalone)')
  if (mediaQuery?.addEventListener) {
    mediaQuery.addEventListener('change', checkStandalone)
  }

  const ua = navigator.userAgent || ''
  isIOS.value = /iPad|iPhone|iPod/.test(ua) && !window.MSStream

  // Détection de l'environnement de bureau et du moteur Chromium (Chrome, Edge, Brave, Opera)
  const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  isDesktop.value = !isMobileUa && !isIOS.value
  isChromium.value = Boolean(window.chrome || /Chrome|Chromium|Edg|OPR/i.test(ua))

  // Interception de l'invitation native (Android et Desktop Chrome/Edge)
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt.value = event
  })

  // Confirmation après l'installation effective par le système
  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    justInstalled.value = true
    isStandalone.value = true
    showIosGuide.value = false
    showDesktopGuide.value = false
  })
}

// Auto-initialisation immédiate côté client
if (typeof window !== 'undefined') {
  initPwaInstall()
}

/**
 * Composable fournissant l'état d'installation PWA et les actions adaptées mobile & desktop.
 */
export function usePwaInstall() {
  const isInstalled = computed(() => isStandalone.value || justInstalled.value)
  const canPromptDirectly = computed(() => Boolean(deferredPrompt.value))
  const isInstallable = computed(() => !isInstalled.value && (canPromptDirectly.value || isIOS.value || (isDesktop.value && isChromium.value)))

  const installStatus = computed(() => {
    if (isInstalled.value) return 'installed'
    if (canPromptDirectly.value) return 'ready'
    if (isIOS.value) return 'ios'
    if (isDesktop.value && isChromium.value) return 'desktop'
    return 'browser'
  })

  const promptInstall = async () => {
    if (deferredPrompt.value) {
      isInstalling.value = true
      try {
        const promptEvent = deferredPrompt.value
        await promptEvent.prompt()
        const choice = await promptEvent.userChoice
        if (choice?.outcome === 'accepted') {
          justInstalled.value = true
          deferredPrompt.value = null
        }
        return choice?.outcome
      } finally {
        isInstalling.value = false
      }
    } else if (isIOS.value) {
      showIosGuide.value = !showIosGuide.value
      return 'ios_guide_toggled'
    } else if (isDesktop.value) {
      showDesktopGuide.value = !showDesktopGuide.value
      return 'desktop_guide_toggled'
    }
    return 'unsupported'
  }

  const toggleIosGuide = () => {
    showIosGuide.value = !showIosGuide.value
  }

  const closeIosGuide = () => {
    showIosGuide.value = false
  }

  const toggleDesktopGuide = () => {
    showDesktopGuide.value = !showDesktopGuide.value
  }

  const closeDesktopGuide = () => {
    showDesktopGuide.value = false
  }

  return {
    isStandalone,
    isInstalled,
    isInstallable,
    canPromptDirectly,
    isIOS,
    isDesktop,
    isChromium,
    isInstalling,
    showIosGuide,
    showDesktopGuide,
    installStatus,
    promptInstall,
    toggleIosGuide,
    closeIosGuide,
    toggleDesktopGuide,
    closeDesktopGuide,
    initPwaInstall,
  }
}
