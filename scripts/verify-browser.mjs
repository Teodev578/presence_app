#!/usr/bin/env node

/**
 * Vérification navigateur réelle via le Chrome DevTools Protocol.
 *
 * L'oracle est auto-suffisant : il démarre son propre serveur Vite sur un port dédié, lance un
 * Chrome headless avec un profil jetable, monte un banc d'essai temporaire, mesure le DOM rendu
 * et la cascade CSS réelle, capture des copies d'écran de preuve, puis nettoie tout.
 *
 * Usage :
 *   node scripts/verify-browser.mjs --theme         bascule de thème
 *   node scripts/verify-browser.mjs --sessions      états des sessions de pointage
 *   node scripts/verify-browser.mjs --sync-alert    alerte réseau de l'en-tête
 *   node scripts/verify-browser.mjs --week-tile     densité de la tuile hebdomadaire
 *   node scripts/verify-browser.mjs --status-badge  sémantique des statuts
 *   node scripts/verify-browser.mjs --appearance-control  pied de tiroir à 375px
 *   node scripts/verify-browser.mjs --check-overlay       volet de confirmation de pointage
 *   node scripts/verify-browser.mjs --availability-summary résumé de disponibilités
 *   node scripts/verify-browser.mjs                 tous les modes
 *
 * Dépendance d'environnement : un binaire Chrome (CHROME_PATH pour le forcer).
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const VITE_PORT = 5199
const CDP_PORT = 9224
const HARNESS_DIR = path.join(ROOT, '__browser-harness__')
const EVIDENCE_DIR = path.join(ROOT, '.unlazy', 'evidence')

const TOKENS = {
  theme: 'browser-verify: theme toggle passed',
  sessions: 'browser-verify: session states passed',
  'sync-alert': 'browser-verify: sync alert states passed',
  'week-tile': 'browser-verify: week tile passed',
  'status-badge': 'browser-verify: status badge passed',
  'appearance-control': 'browser-verify: appearance control passed',
  'check-overlay': 'browser-verify: check overlay passed',
  'availability-summary': 'browser-verify: availability summary passed',
}

const HARNESS_HTML = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="theme-color" content="#fdfcff" />
    <title>Banc d'essai navigateur</title>
  </head>
  <body class="bg-base-100 text-base-content">
    <div id="app"></div>
    <script type="module" src="/__browser-harness__/harness.js"></script>
  </body>
</html>
`

const HARNESS_JS = `import { createApp, h, ref } from 'vue'
import '../src/style.css'
import ThemeToggle from '../src/components/shared/ThemeToggle.vue'
import SyncAlert from '../src/components/shared/SyncAlert.vue'
import SyncIndicator from '../src/components/shared/SyncIndicator.vue'
import StatusBadge from '../src/components/shared/StatusBadge.vue'
import WeekSummaryCard from '../src/components/employee/WeekSummaryCard.vue'
import CheckConfirmationOverlay from '../src/components/employee/CheckConfirmationOverlay.vue'
import AvailabilitySummary from '../src/components/employee/AvailabilitySummary.vue'
import { getLocalDateString, resolveSessionMinutes } from '../src/lib/dateUtils.js'
import { useSyncEngine } from '../src/composables/useSyncEngine.js'

const dayOffset = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d
}

const at = (base, hours, minutes) => {
  const d = new Date(base)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

const yesterday = dayOffset(-1)
const today = new Date()

// Session ouverte du jour calée sur 90 minutes écoulées, pour rester déterministe quelle que soit l'heure du test
const openTodayStart = new Date(Date.now() - 90 * 60000)

const presences = [
  {
    id: 'closed',
    work_date: getLocalDateString(yesterday),
    check_in_time: at(yesterday, 8, 0),
    check_out_time: at(yesterday, 16, 30),
  },
  {
    id: 'stale',
    work_date: getLocalDateString(yesterday),
    check_in_time: at(yesterday, 23, 6),
    check_out_time: null,
  },
  {
    id: 'openToday',
    work_date: getLocalDateString(today),
    check_in_time: openTodayStart.toISOString(),
    check_out_time: null,
  },
]

const weekTotalMinutes = presences.reduce((sum, presence) => sum + resolveSessionMinutes(presence), 0)

// Sonde sans rendu : expose les états du moteur de synchronisation pour simuler le réseau
const SyncProbe = {
  setup() {
    const { pendingCount, isSyncing } = useSyncEngine()
    window.__harness.setPendingCount = (value) => {
      pendingCount.value = value
    }
    window.__harness.setSyncing = (value) => {
      isSyncing.value = value
    }
    return () => null
  },
}

// Sonde du volet de confirmation : monte et démonte la surface à la demande du vérificateur
const OverlayProbe = {
  setup() {
    const visible = ref(false)
    window.__harness.setOverlayVisible = (value) => {
      visible.value = value
    }
    return () =>
      h('div', { id: 'overlay-host', class: 'relative w-[420px] h-[320px] border border-base-300 bg-base-200 rounded-m3-lg' }, [
        h(CheckConfirmationOverlay, {
          visible: visible.value,
          title: 'Arrivée validée',
          message: 'Votre pointage a bien été enregistré.',
          siteName: 'Siège Lyon',
        }),
      ])
  },
}

// Sonde du résumé : permet de faire varier la sélection pour éprouver l'animation du compteur
const SummaryProbe = {
  setup() {
    const count = ref(5)
    const labels = ref(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'])
    window.__harness.setSummaryCount = (value) => {
      count.value = value
      labels.value = value > 0 ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].slice(0, value) : []
    }
    return () =>
      h('div', { id: 'summary-host', class: 'w-[420px] bg-base-200' }, [
        h(AvailabilitySummary, { count: count.value, labels: labels.value }),
      ])
  },
}

// Largeur utile réelle du pied de tiroir à 375px : aside w-72 (288px) moins p-5 (2 x 20px)
const DRAWER_INNER_WIDTH = 248

// Structure identique au bloc de réglages des deux mises en page, que G22 épingle par ailleurs
const settingsBlock = (id, width) =>
  h('div', { id, style: 'width:' + width + 'px', class: 'bg-base-200' }, [
    h('div', { id: id + '-block', class: 'flex flex-col gap-2 px-1' }, [
      h('div', { class: 'flex items-center justify-between gap-2 min-w-0' }, [
        h('span', { class: 'text-xs text-base-content/60 font-medium shrink-0' }, 'Statut réseau'),
        h(SyncIndicator),
      ]),
      h(ThemeToggle),
    ]),
  ])

window.__harness = {
  presences,
  weekTotalMinutes,
  afterPaint: () => new Promise((resolve) => requestAnimationFrame(() => resolve())),
}

const app = createApp({
  render: () =>
    h('div', { class: 'p-4 flex flex-col gap-4' }, [
      h(SyncProbe),
      h(OverlayProbe),
      h(SummaryProbe),
      h('div', { id: 'summary-empty-host', class: 'w-[420px] bg-base-200' }, [
        h(AvailabilitySummary, { count: 0, labels: [] }),
      ]),
      h('div', { id: 'toggle-host' }, [h(ThemeToggle)]),
      settingsBlock('drawer-settings', DRAWER_INNER_WIDTH),
      settingsBlock('drawer-settings-narrow', 200),
      h('div', { id: 'sync-alert-host' }, [h(SyncAlert)]),
      h('div', { id: 'status-badge-host', class: 'flex flex-wrap gap-2' }, [
        h(StatusBadge, { status: 'present' }),
        h(StatusBadge, { status: 'late' }),
        h(StatusBadge, { status: 'completed' }),
        h(StatusBadge, { status: 'completed_late' }),
      ]),
      h('div', { id: 'card-host', style: 'max-width:520px' }, [
        h(WeekSummaryCard, {
          recentPresences: presences,
          weekPresences: presences,
          weekTotalMinutes,
        }),
      ]),
      h('div', { id: 'card-low-host', style: 'max-width:520px' }, [
        h(WeekSummaryCard, {
          recentPresences: presences,
          weekPresences: presences,
          weekTotalMinutes: 21,
        }),
      ]),
      h('div', { id: 'card-clean-host', style: 'max-width:520px' }, [
        h(WeekSummaryCard, {
          recentPresences: presences.filter((presence) => presence.check_out_time),
          weekPresences: presences.filter((presence) => presence.check_out_time),
          weekTotalMinutes: 510,
        }),
      ]),
    ]),
})

app.mount('#app')
window.__harnessReady = true
`

const MEASURE_EXPRESSION = `(() => {
  const collapse = (value) => (value || '').replace(/\\s+/g, ' ').trim()
  const background = (node) => (node ? getComputedStyle(node).backgroundColor : null)
  const labelButton = document.querySelector('#toggle-host button')
  const alertButton = document.querySelector('#sync-alert-host button')
  const labelRect = labelButton ? labelButton.getBoundingClientRect() : null
  const measureSettings = (hostId) => {
    const host = document.querySelector('#' + hostId)
    const block = document.querySelector('#' + hostId + '-block')
    if (!host || !block) return null
    const blockRect = block.getBoundingClientRect()
    const button = block.querySelector('button.btn')
    const badge = block.querySelector('.badge')
    const badgeText = badge ? badge.querySelector('span[class*="text-xs"]') : null
    const buttonRect = button ? button.getBoundingClientRect() : null
    const badgeRect = badge ? badge.getBoundingClientRect() : null
    const style = button ? getComputedStyle(button) : null
    return {
      hostWidth: Math.round(host.getBoundingClientRect().width),
      scrollWidth: block.scrollWidth,
      clientWidth: block.clientWidth,
      right: Math.round(blockRect.right),
      buttonText: button ? collapse(button.innerText) : null,
      buttonAria: button ? button.getAttribute('aria-label') : null,
      buttonWidth: buttonRect ? Math.round(buttonRect.width) : 0,
      buttonHeight: buttonRect ? Math.round(buttonRect.height) : 0,
      buttonTop: buttonRect ? Math.round(buttonRect.top) : 0,
      buttonRight: buttonRect ? Math.round(buttonRect.right) : 0,
      buttonBottom: buttonRect ? Math.round(buttonRect.bottom) : 0,
      buttonBorderWidth: style ? style.borderTopWidth : null,
      buttonBorderColor: style ? style.borderTopColor : null,
      buttonBackground: style ? style.backgroundColor : null,
      badgeRight: badgeRect ? Math.round(badgeRect.right) : 0,
      badgeBottom: badgeRect ? Math.round(badgeRect.bottom) : 0,
      badgeText: badge ? collapse(badge.innerText) : null,
      badgeTextScroll: badgeText ? badgeText.scrollWidth : 0,
      badgeTextClient: badgeText ? badgeText.clientWidth : 0,
    }
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  const list = document.querySelector('#card-host .overflow-y-auto')
  const rows = list
    ? [...list.children].map((row) => {
        const dot = row.querySelector('span.rounded-full')
        const badge = row.querySelector('.badge')
        return {
          text: collapse(row.innerText),
          dot: dot ? dot.className : null,
          badge: badge ? collapse(badge.innerText) : null,
        }
      })
    : []
  const lowProgress = document.querySelector('#card-low-host progress')
  const overlayHost = document.querySelector('#overlay-host')
  const overlayBox = overlayHost ? overlayHost.querySelector('[role="status"]') : null
  const overlayStyle = overlayBox ? getComputedStyle(overlayBox) : null
  const summaryHost = document.querySelector('#summary-host')
  const summaryBadge = summaryHost ? summaryHost.querySelector('.badge') : null
  const summaryBadgeStyle = summaryBadge ? getComputedStyle(summaryBadge) : null
  const summaryEmptyHost = document.querySelector('#summary-empty-host')

  return {
    theme: document.documentElement.getAttribute('data-theme'),
    stored: window.localStorage.getItem('presence_theme'),
    bodyBg: background(document.body),
    meta: meta ? meta.content : null,
    labelText: labelButton ? collapse(labelButton.innerText) : null,
    labelAria: labelButton ? labelButton.getAttribute('aria-label') : null,
    labelWidth: labelRect ? Math.round(labelRect.width) : 0,
    labelHeight: labelRect ? Math.round(labelRect.height) : 0,
    labelCenter: labelRect ? { x: Math.round(labelRect.x + labelRect.width / 2), y: Math.round(labelRect.y + labelRect.height / 2) } : null,
    settings: measureSettings('drawer-settings'),
    narrow: measureSettings('drawer-settings-narrow'),
    syncAlertText: alertButton ? collapse(alertButton.innerText) : null,
    syncAlertAria: alertButton ? alertButton.getAttribute('aria-label') : null,
    badges: [...document.querySelectorAll('#status-badge-host .badge')].map((badge) => {
      const dot = badge.querySelector('span.rounded-full')
      return { text: collapse(badge.innerText), classes: badge.className, dot: dot ? dot.className : null }
    }),
    rows,
    cardText: document.querySelector('#card-host') ? collapse(document.querySelector('#card-host').innerText) : null,
    cardBadges: [...document.querySelectorAll('#card-host .badge')].map((badge) => collapse(badge.innerText)),
    lowCardText: document.querySelector('#card-low-host') ? collapse(document.querySelector('#card-low-host').innerText) : null,
    cleanCardText: document.querySelector('#card-clean-host') ? collapse(document.querySelector('#card-clean-host').innerText) : null,
    lowProgressValue: lowProgress ? lowProgress.getAttribute('value') : null,
    lowProgressAria: lowProgress ? lowProgress.getAttribute('aria-valuenow') : null,
    overlay: {
      present: Boolean(overlayBox),
      text: overlayBox ? collapse(overlayBox.innerText) : null,
      role: overlayBox ? overlayBox.getAttribute('role') : null,
      live: overlayBox ? overlayBox.getAttribute('aria-live') : null,
      position: overlayStyle ? overlayStyle.position : null,
      opacity: overlayStyle ? overlayStyle.opacity : null,
      transitionDuration: overlayStyle ? overlayStyle.transitionDuration : null,
    },
    summary: {
      text: summaryHost ? collapse(summaryHost.innerText) : null,
      badgeText: summaryBadge ? collapse(summaryBadge.innerText) : null,
      badgeTransition: summaryBadgeStyle ? summaryBadgeStyle.transitionDuration : null,
      chips: summaryHost ? [...summaryHost.querySelectorAll('.badge')].map((badge) => collapse(badge.innerText)) : [],
    },
    summaryEmpty: {
      text: summaryEmptyHost ? collapse(summaryEmptyHost.innerText) : null,
    },
    weekTotal: window.__harness ? window.__harness.weekTotalMinutes : null,
  }
})()`

const REQUIRED_FIELDS = ['theme', 'stored', 'bodyBg', 'meta', 'rows', 'cardText', 'weekTotal']

const LIGHT_SURFACE = 'rgb(253, 252, 255)'
const DARK_SURFACE = 'rgb(17, 19, 24)'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'google-chrome-stable',
    'google-chrome',
    'chromium',
    'chromium-browser',
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (candidate.includes('/')) {
      if (fs.existsSync(candidate)) return candidate
      continue
    }
    for (const dir of (process.env.PATH || '').split(path.delimiter)) {
      const full = path.join(dir, candidate)
      if (fs.existsSync(full)) return full
    }
  }
  return null
}

async function waitForHttp(url, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs
  let lastError = 'inconnu'
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) })
      if (response.ok) return
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error.cause?.code || error.name
    }
    await sleep(250)
  }
  throw new Error(`${label} injoignable après ${timeoutMs} ms (${lastError})`)
}

class Cdp {
  constructor(socket) {
    this.socket = socket
    this.nextId = 0
    this.pending = new Map()
    this.pageErrors = []
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) reject(new Error(message.error.message))
        else resolve(message.result)
        return
      }
      if (message.method === 'Runtime.exceptionThrown') {
        this.pageErrors.push(message.params?.exceptionDetails?.exception?.description || 'exception sans description')
      }
      if (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error') {
        this.pageErrors.push((message.params.args || []).map((arg) => arg.value ?? arg.description).join(' '))
      }
    }
  }

  static async connect(webSocketUrl) {
    const socket = new WebSocket(webSocketUrl)
    await new Promise((resolve, reject) => {
      socket.onopen = resolve
      socket.onerror = () => reject(new Error('connexion CDP refusée'))
    })
    return new Cdp(socket)
  }

  send(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) {
      throw new Error(`évaluation en échec : ${result.exceptionDetails.exception?.description || 'inconnue'}`)
    }
    return result.result?.value
  }

  async measure() {
    return this.evaluate(MEASURE_EXPRESSION)
  }

  /** Déclenche une action puis mesure dans la même image, pour saisir une transition en cours. */
  async measureAfter(action) {
    return this.evaluate(
      `(async () => { ${action}; await window.__harness.afterPaint(); return ${MEASURE_EXPRESSION}; })()`
    )
  }

  async clickAt(point) {
    const base = { x: point.x, y: point.y, button: 'left', clickCount: 1 }
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...base })
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...base })
    await sleep(150)
  }

  async screenshot(fileName) {
    const shot = await this.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(EVIDENCE_DIR, fileName), Buffer.from(shot.data, 'base64'))
  }

  close() {
    this.socket.close()
  }
}

let failures = 0

const check = (description, assertion) => {
  try {
    assertion()
    console.log(`  ok ${description}`)
  } catch (error) {
    failures += 1
    console.error(`  FAIL ${description} -> ${error.message}`)
  }
}

const assertEqual = (actual, expected, label) => {
  if (actual !== expected) throw new Error(`${label} attendu "${expected}", obtenu "${actual}"`)
}

const assertTrue = (condition, label) => {
  if (!condition) throw new Error(label)
}

function assertShape(snapshot) {
  for (const field of REQUIRED_FIELDS) {
    if (snapshot[field] === undefined) throw new Error(`mesure incomplète : champ ${field} absent`)
  }
  if (!Array.isArray(snapshot.rows)) throw new Error('mesure incomplète : lignes illisibles')
}

async function verifyTheme(cdp) {
  const before = failures
  console.log('browser-verify: bascule de thème')

  const initial = await cdp.measure()
  assertShape(initial)

  check('état initial : aucun attribut de thème forcé', () => assertEqual(initial.theme, null, 'data-theme'))
  check('état initial : aucune préférence stockée', () => assertEqual(initial.stored, null, 'localStorage'))
  check('état initial : surface M3 claire rendue', () => assertEqual(initial.bodyBg, LIGHT_SURFACE, 'fond du corps'))
  check('état initial : meta theme-color alignée sur la surface claire', () => assertEqual(initial.meta, '#fdfcff', 'meta'))

  check('bouton unique : mode courant nommé dans le libellé visible', () =>
    assertEqual(initial.labelText, 'Thème : Système', 'libellé'))
  check('bouton unique : action suivante annoncée', () => {
    assertTrue((initial.labelAria || '').includes('Thème : Système'), `nom accessible : ${initial.labelAria}`)
    assertTrue((initial.labelAria || '').includes('passer au thème clair'), 'action non annoncée')
  })
  check('bouton unique : cible tactile au moins 44px de haut', () => {
    assertTrue(initial.labelHeight >= 44, `hauteur ${initial.labelHeight}px`)
  })

  await cdp.clickAt(initial.labelCenter)
  const light = await cdp.measure()
  check('premier clic : thème clair forcé', () => assertEqual(light.theme, 'light', 'data-theme'))
  check('premier clic : préférence persistée', () => assertEqual(light.stored, 'light', 'localStorage'))
  check('premier clic : surface claire rendue', () => assertEqual(light.bodyBg, LIGHT_SURFACE, 'fond du corps'))
  check('premier clic : libellé du mode mis à jour', () => assertEqual(light.labelText, 'Thème : Clair', 'libellé'))
  await cdp.screenshot('theme-light.png')

  await cdp.clickAt(light.labelCenter)
  const dark = await cdp.measure()
  check('deuxième clic : thème sombre forcé', () => assertEqual(dark.theme, 'dark', 'data-theme'))
  check('deuxième clic : préférence persistée', () => assertEqual(dark.stored, 'dark', 'localStorage'))
  check('deuxième clic : surface sombre réellement rendue', () => assertEqual(dark.bodyBg, DARK_SURFACE, 'fond du corps'))
  check('les deux thèmes produisent des surfaces distinctes', () => assertTrue(light.bodyBg !== dark.bodyBg, 'surfaces identiques'))
  check('meta theme-color suit le thème sombre', () => assertEqual(dark.meta, '#111318', 'meta'))
  check('deuxième clic : libellé du mode mis à jour', () => assertEqual(dark.labelText, 'Thème : Sombre', 'libellé'))
  await cdp.screenshot('theme-dark.png')

  await cdp.clickAt(dark.labelCenter)
  const backToSystem = await cdp.measure()
  check('troisième clic : retour au réglage système', () => assertEqual(backToSystem.theme, null, 'data-theme'))
  check('retour système : préférence effacée', () => assertEqual(backToSystem.stored, null, 'localStorage'))

  // Le réglage système est émulé au niveau du moteur : le thème doit suivre sans préférence forcée
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'dark' }],
  })
  await sleep(200)
  const systemDark = await cdp.measure()
  check('mode système : la préférence sombre de l\u2019OS est suivie', () =>
    assertEqual(systemDark.bodyBg, DARK_SURFACE, 'fond du corps')
  )
  check('mode système : meta theme-color suit le basculement OS', () => assertEqual(systemDark.meta, '#111318', 'meta'))

  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'light' }],
  })
  await sleep(200)
  const systemLight = await cdp.measure()
  check('mode système : retour à la surface claire', () => assertEqual(systemLight.bodyBg, LIGHT_SURFACE, 'fond du corps'))

  return failures === before
}

async function verifySessions(cdp) {
  const before = failures
  console.log('browser-verify: états des sessions')

  const snapshot = await cdp.measure()
  assertShape(snapshot)

  check('la tuile rend trois lignes de pointage', () => assertTrue(snapshot.rows.length === 3, `${snapshot.rows.length} lignes`))

  const closed = snapshot.rows.find((row) => (row.text || '').includes('8h 30min'))
  const stale = snapshot.rows.find((row) => (row.text || '').includes('Départ manquant'))
  const openToday = snapshot.rows.find((row) => (row.text || '').includes('En cours'))

  check('session close : durée réelle affichée', () => assertTrue(Boolean(closed), `lignes : ${JSON.stringify(snapshot.rows.map((r) => r.text))}`))
  check('journée révolue sans départ : libellé « Départ manquant »', () => assertTrue(Boolean(stale), 'libellé absent du rendu'))
  check('journée révolue sans départ : pastille non pulsante', () =>
    assertTrue(stale && !String(stale.dot).includes('animate-pulse'), `classes de pastille : ${stale?.dot}`)
  )
  check('journée révolue sans départ : durée indisponible au lieu d\u2019un temps écoulé', () =>
    assertEqual(stale?.badge, '--', 'badge de durée')
  )
  check('session du jour ouverte : libellé « En cours »', () => assertTrue(Boolean(openToday), 'libellé absent du rendu'))
  check('session du jour ouverte : pastille pulsante', () =>
    assertTrue(openToday && String(openToday.dot).includes('animate-pulse'), `classes de pastille : ${openToday?.dot}`)
  )
  check('session du jour ouverte : durée écoulée affichée', () =>
    assertTrue(openToday?.badge && openToday.badge !== '--', `badge de durée : ${openToday?.badge}`)
  )

  check('le total hebdomadaire exclut la session oubliée', () => assertEqual(snapshot.weekTotal, 600, 'total de la semaine'))
  check('la jauge reflète le total recalculé', () => {
    const expected = Math.min(100, Math.round((600 / (35 * 60)) * 100))
    assertTrue((snapshot.cardText || '').includes(`${expected}%`), `pourcentage attendu ${expected}% absent de la tuile`)
  })

  // Mesure portée sur la ligne concernée : la tuile affiche aussi un temps restant, qui ne doit pas
  // pouvoir confondre l'oracle
  check('aucune durée écoulée sur la ligne de la veille', () =>
    assertTrue(!/\d+h \d\dmin/.test(stale?.text || ''), `durée fantôme dans la ligne : ${stale?.text}`)
  )
  check('les durées restantes de la tuile restent affichées', () =>
    assertTrue(/\d+h \d\dmin/.test(snapshot.cardText || ''), 'aucune durée formatée dans la tuile')
  )

  await cdp.screenshot('session-states.png')

  return failures === before
}

async function verifySyncAlert(cdp) {
  const before = failures
  console.log('browser-verify: alerte réseau')

  const healthy = await cdp.measure()
  check('en-tête silencieux quand tout est synchronisé', () => assertEqual(healthy.syncAlertText, null, 'alerte affichée'))

  await cdp.evaluate('window.__harness.setPendingCount(3)')
  await sleep(200)
  const pending = await cdp.measure()
  check('alerte affichée dès qu\u2019une mutation attend', () =>
    assertTrue((pending.syncAlertText || '').includes('3 en attente'), `texte : ${pending.syncAlertText}`)
  )

  await cdp.evaluate("window.dispatchEvent(new Event('offline'))")
  await sleep(200)
  const offline = await cdp.measure()
  check('alerte affichée hors ligne', () => assertTrue((offline.syncAlertText || '').includes('Hors ligne'), `texte : ${offline.syncAlertText}`))
  check('hors ligne : état annoncé aux lecteurs d\u2019écran', () =>
    assertTrue((offline.syncAlertAria || '').includes('Hors ligne'), `aria : ${offline.syncAlertAria}`)
  )
  await cdp.screenshot('sync-alert.png')

  await cdp.evaluate("window.__harness.setPendingCount(0); window.dispatchEvent(new Event('online'))")
  await sleep(250)
  const restored = await cdp.measure()
  check('retour au silence après résorption', () => assertEqual(restored.syncAlertText, null, 'alerte encore affichée'))

  return failures === before
}

async function verifyWeekTile(cdp) {
  const before = failures
  console.log('browser-verify: tuile hebdomadaire')

  const snapshot = await cdp.measure()
  assertShape(snapshot)

  // innerText renvoie le texte après application de text-transform : le libellé est mis en capitales par le CSS
  check('départ manquant constaté sur la semaine', () => {
    assertTrue(/départs/i.test(snapshot.cardText || ''), 'libellé absent de la tuile')
    assertTrue((snapshot.cardText || '').includes('1 manquant'), `tuile : ${snapshot.cardText}`)
  })
  check('ni terme administratif ni injonction dans la tuile', () =>
    assertTrue(!/anomalie|à corriger|à compléter/i.test(snapshot.cardText || ''), `tuile : ${snapshot.cardText}`)
  )
  check('état sain annoncé sans réserve', () =>
    assertTrue((snapshot.cleanCardText || '').includes('Tous enregistrés'), `tuile saine : ${snapshot.cleanCardText}`)
  )
  check('état sain exempt de terme administratif', () =>
    assertTrue(!/anomalie|à corriger|à compléter/i.test(snapshot.cleanCardText || ''), `tuile saine : ${snapshot.cleanCardText}`)
  )
  check('pointages récents libellés sans progression trompeuse', () =>
    assertTrue(snapshot.cardBadges.some((text) => text.includes('3 derniers pointages')), `badges : ${JSON.stringify(snapshot.cardBadges)}`)
  )
  check('jauge lisible sous 5 % de progression', () => assertEqual(snapshot.lowProgressValue, '3', 'segment de jauge'))
  check('la progression annoncée reste la valeur réelle', () => assertEqual(snapshot.lowProgressAria, '1', 'aria-valuenow'))
  check('le pourcentage réel reste affiché', () => assertTrue((snapshot.lowCardText || '').includes('1%'), 'pourcentage absent'))

  await cdp.screenshot('week-tile.png')

  return failures === before
}

async function verifyStatusBadge(cdp) {
  const before = failures
  console.log('browser-verify: statuts de pointage')

  const snapshot = await cdp.measure()
  const [present, late, done, doneLate] = snapshot.badges

  check('quatre statuts rendus', () => assertEqual(snapshot.badges.length, 4, 'nombre de badges'))
  check('statut présent inchangé', () => {
    assertTrue(present?.text.includes('Présent'), `texte : ${present?.text}`)
    assertTrue(present?.classes.includes('badge-success'), `classes : ${present?.classes}`)
  })
  check('retard en cours toujours signalé', () => {
    assertTrue(late?.text.includes('En retard'), `texte : ${late?.text}`)
    assertTrue(late?.classes.includes('badge-warning'), `classes : ${late?.classes}`)
  })
  check('journée close à l\u2019heure inchangée', () => {
    assertEqual(done?.text, 'Terminé', 'texte')
    assertTrue(done?.classes.includes('badge-info'), `classes : ${done?.classes}`)
  })
  check('journée close avec retard non alarmante', () => {
    assertTrue(doneLate?.text.includes('Terminé'), `texte : ${doneLate?.text}`)
    assertTrue(!doneLate?.classes.includes('badge-warning'), `classes : ${doneLate?.classes}`)
  })
  check('retard conservé sur la journée close', () => {
    assertTrue(doneLate?.text.includes('avec retard'), `texte : ${doneLate?.text}`)
    assertTrue(String(doneLate?.dot).includes('bg-warning'), `pastille : ${doneLate?.dot}`)
  })

  await cdp.screenshot('status-badge.png')

  return failures === before
}

async function verifyAppearanceControl(cdp) {
  const before = failures
  console.log('browser-verify: pied de tiroir')

  // État le plus large possible du badge : c'est lui qui comprimait le commutateur
  await cdp.evaluate('window.__harness.setSyncing(true)')
  await sleep(250)

  const snapshot = await cdp.measure()
  const settings = snapshot.settings
  const narrow = snapshot.narrow
  if (!settings || !narrow) {
    failures += 1
    console.error('  FAIL bloc de réglages absent du banc d\u2019essai')
    return false
  }

  check('le badge prend son état le plus large sans comprimer', () =>
    assertTrue((settings.badgeText || '').includes('Synchronisation'), `état du badge : ${settings.badgeText}`)
  )
  check('aucun débordement horizontal du bloc de réglages', () =>
    assertTrue(settings.scrollWidth <= settings.clientWidth + 1, `scroll ${settings.scrollWidth} > client ${settings.clientWidth}`)
  )
  check('le badge reste contenu dans le pied de tiroir', () =>
    assertTrue(settings.badgeRight <= settings.right + 0.5, `badge ${settings.badgeRight} > bloc ${settings.right}`)
  )
  check('le badge ne pousse plus le contrôle d\u2019apparence', () =>
    assertTrue(settings.badgeBottom <= settings.buttonTop + 0.5, `bas du badge ${settings.badgeBottom} > haut du bouton ${settings.buttonTop}`)
  )

  check('le contrôle d\u2019apparence nomme son action', () => {
    assertTrue((settings.buttonText || '').includes('Thème : Système'), `libellé : ${settings.buttonText}`)
    assertTrue((settings.buttonAria || '').includes('Thème : Système'), `nom accessible : ${settings.buttonAria}`)
  })
  check('le contrôle d\u2019apparence occupe la largeur du pied de tiroir', () =>
    assertTrue(settings.buttonWidth >= settings.clientWidth - 12, `bouton ${settings.buttonWidth}px pour un bloc de ${settings.clientWidth}px`)
  )
  check('le contrôle d\u2019apparence atteint 44px de haut', () =>
    assertTrue(settings.buttonHeight >= 44, `hauteur ${settings.buttonHeight}px`)
  )
  check('le contrôle d\u2019apparence reste dans le tiroir', () =>
    assertTrue(settings.buttonRight <= settings.right + 0.5, `bouton ${settings.buttonRight} > bloc ${settings.right}`)
  )
  check('le contrôle d\u2019apparence porte une bordure visible', () => {
    assertTrue(parseFloat(settings.buttonBorderWidth) >= 1, `épaisseur de bordure ${settings.buttonBorderWidth}`)
    assertTrue(settings.buttonBorderColor !== settings.buttonBackground, 'bordure indistinguable du fond')
    assertTrue(settings.buttonBorderColor !== 'rgba(0, 0, 0, 0)', 'bordure transparente')
  })

  // Cas de torture : à 200px, la troncature doit s'engager au lieu de déborder. Sans ce contrôle,
  // l'absence de troncature resterait invisible tant que la largeur suffit.
  check('sous contrainte extrême, la troncature s\u2019engage', () =>
    assertTrue(narrow.badgeTextScroll > narrow.badgeTextClient, `texte ${narrow.badgeTextScroll}px pour ${narrow.badgeTextClient}px`)
  )
  check('sous contrainte extrême, le bloc ne déborde pas malgré tout', () =>
    assertTrue(narrow.scrollWidth <= narrow.clientWidth + 1, `scroll ${narrow.scrollWidth} > client ${narrow.clientWidth}`)
  )
  check('sous contrainte extrême, le contrôle d\u2019apparence reste entier', () =>
    assertTrue(narrow.buttonRight <= narrow.right + 0.5, `bouton ${narrow.buttonRight} > bloc ${narrow.right}`)
  )

  await cdp.evaluate('window.__harness.setSyncing(false)')
  await sleep(200)
  await cdp.screenshot('drawer-appearance.png')

  return failures === before
}

const assertBatchFields = (snapshot) => {
  for (const field of ['overlay', 'summary', 'summaryEmpty']) {
    if (!snapshot[field]) throw new Error(`mesure incomplète : champ ${field} absent`)
  }
}

async function verifyCheckOverlay(cdp) {
  const before = failures
  console.log('browser-verify: volet de confirmation de pointage')

  const initial = await cdp.measure()
  assertShape(initial)
  assertBatchFields(initial)

  check('volet masqué au repos', () => assertEqual(initial.overlay.present, false, 'présence'))
  check('aucune surface de statut rendue au repos', () => assertEqual(initial.overlay.role, null, 'role'))

  // Mesure dans l'image qui suit l'activation : la transition d'entrée est encore en cours,
  // ce qui prouve que l'apparition est animée et non instantanée.
  const entering = await cdp.measureAfter('window.__harness.setOverlayVisible(true)')
  check('volet monté à l’activation', () => assertEqual(entering.overlay.present, true, 'présence'))
  check('surface de statut annoncée poliment', () => {
    assertEqual(entering.overlay.role, 'status', 'role')
    assertEqual(entering.overlay.live, 'polite', 'aria-live')
  })
  check('volet ancré sur la carte', () => assertEqual(entering.overlay.position, 'absolute', 'position'))
  check('entrée réellement animée', () =>
    assertTrue(parseFloat(entering.overlay.transitionDuration) > 0, `transition : ${entering.overlay.transitionDuration}`)
  )

  await sleep(320)
  const settled = await cdp.measure()
  check('volet pleinement visible après l’entrée', () => assertEqual(settled.overlay.opacity, '1', 'opacité'))
  check('titre, message et site rendus', () => {
    const text = settled.overlay.text || ''
    assertTrue(text.includes('Arrivée validée'), `titre : ${text}`)
    assertTrue(text.includes('bien été enregistré'), 'message absent')
    assertTrue(text.includes('Siège Lyon'), 'site absent')
  })
  await cdp.screenshot('check-overlay.png')

  await cdp.evaluate('window.__harness.setOverlayVisible(false)')
  await sleep(320)
  const gone = await cdp.measure()
  check('volet retiré après désactivation', () => assertEqual(gone.overlay.present, false, 'présence'))

  return failures === before
}

async function verifyAvailabilitySummary(cdp) {
  const before = failures
  console.log('browser-verify: résumé des disponibilités')

  const initial = await cdp.measure()
  assertShape(initial)
  assertBatchFields(initial)

  check('compte et jours rendus', () => {
    assertTrue((initial.summary.badgeText || '').includes('5 jours sélectionnés'), `compte : ${initial.summary.badgeText}`)
    assertTrue(
      initial.summary.chips.includes('Lun') && initial.summary.chips.includes('Ven'),
      `jours : ${JSON.stringify(initial.summary.chips)}`
    )
  })
  check('état vide explicite et conséquence annoncée', () => {
    const text = initial.summaryEmpty.text || ''
    assertTrue(text.includes('Aucun jour sélectionné'), `texte : ${text}`)
    assertTrue(text.includes('retirera'), 'conséquence non annoncée')
  })

  const entering = await cdp.measureAfter('window.__harness.setSummaryCount(2)')
  check('changement de sélection animé', () =>
    assertTrue(parseFloat(entering.summary.badgeTransition) > 0, `transition : ${entering.summary.badgeTransition}`)
  )

  await sleep(380)
  const settled = await cdp.measure()
  check('nouveau compte et jours après la transition', () => {
    assertTrue((settled.summary.badgeText || '').includes('2 jours sélectionnés'), `compte : ${settled.summary.badgeText}`)
    assertTrue(settled.summary.chips.includes('Lun'), `jours : ${JSON.stringify(settled.summary.chips)}`)
    assertTrue(settled.summary.chips.includes('Mar'), `jours : ${JSON.stringify(settled.summary.chips)}`)
    assertTrue(
      !settled.summary.chips.includes('Mer') && !settled.summary.chips.includes('Ven'),
      `jours restants : ${JSON.stringify(settled.summary.chips)}`
    )
  })
  await cdp.screenshot('availability-summary.png')

  return failures === before
}

const VERIFIERS = {
  theme: verifyTheme,
  sessions: verifySessions,
  'sync-alert': verifySyncAlert,
  'week-tile': verifyWeekTile,
  'status-badge': verifyStatusBadge,
  'appearance-control': verifyAppearanceControl,
  'check-overlay': verifyCheckOverlay,
  'availability-summary': verifyAvailabilitySummary,
}

async function main() {
  const chromePath = findChrome()
  if (!chromePath) {
    console.error('FAILURE browser-verify: aucun binaire Chrome trouvé, définir CHROME_PATH')
    process.exit(1)
  }

  const requested = process.argv.slice(2).filter((argument) => argument.startsWith('--')).map((argument) => argument.slice(2))
  const modes = requested.length === 0 || requested.includes('all') ? Object.keys(VERIFIERS) : requested
  const unknown = modes.filter((mode) => !VERIFIERS[mode])
  if (unknown.length > 0) {
    console.error(`FAILURE browser-verify: mode inconnu ${unknown.join(', ')}`)
    process.exit(1)
  }

  fs.mkdirSync(HARNESS_DIR, { recursive: true })
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  fs.writeFileSync(path.join(HARNESS_DIR, 'harness.html'), HARNESS_HTML)
  fs.writeFileSync(path.join(HARNESS_DIR, 'harness.js'), HARNESS_JS)

  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'presenceapp-cdp-'))
  const vite = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', '--port', String(VITE_PORT), '--strictPort', '--host', '127.0.0.1'],
    { cwd: ROOT, stdio: 'ignore' }
  )
  const chrome = spawn(
    chromePath,
    [
      '--headless',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      'about:blank',
    ],
    { stdio: 'ignore' }
  )

  let cdp = null
  const passed = new Set()
  try {
    await waitForHttp(`http://127.0.0.1:${CDP_PORT}/json/version`, 25000, 'Chrome DevTools')
    await waitForHttp(`http://127.0.0.1:${VITE_PORT}/`, 40000, 'Serveur Vite')

    const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
    const target = targets.find((entry) => entry.type === 'page')
    if (!target) throw new Error('aucune cible de page exposée par CDP')

    cdp = await Cdp.connect(target.webSocketDebuggerUrl)
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 1200,
      deviceScaleFactor: 1,
      mobile: false,
    })

    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${VITE_PORT}/__browser-harness__/harness.html` })

    const deadline = Date.now() + 30000
    let ready = false
    while (Date.now() < deadline && !ready) {
      ready = await cdp.evaluate('Boolean(window.__harnessReady)').catch(() => false)
      if (!ready) await sleep(250)
    }
    if (!ready) throw new Error('le banc d\u2019essai n\u2019a pas monté ses composants')
    await sleep(300)

    for (const mode of modes) {
      if (await VERIFIERS[mode](cdp)) passed.add(mode)
    }

    if (cdp.pageErrors.length > 0) {
      failures += 1
      console.error(`  FAIL aucune exception de page attendue -> ${cdp.pageErrors.slice(0, 3).join(' | ')}`)
    } else {
      console.log('  ok aucune exception de page pendant le parcours')
    }

    for (const mode of modes) {
      if (passed.has(mode)) console.log(TOKENS[mode])
    }

    console.log(`  copies d'écran de preuve : ${path.relative(ROOT, EVIDENCE_DIR)}`)
  } catch (error) {
    failures += 1
    console.error(`FAILURE browser-verify: ${error.message}`)
  } finally {
    if (cdp) cdp.close()
    vite.kill('SIGTERM')
    chrome.kill('SIGTERM')
    await sleep(400)
    fs.rmSync(HARNESS_DIR, { recursive: true, force: true })
    try {
      fs.rmSync(profileDir, { recursive: true, force: true })
    } catch {
      // Profil temporaire encore verrouillé par Chrome : il reste dans le répertoire temporaire système
    }
  }

  process.exit(failures === 0 ? 0 : 1)
}

await main()
