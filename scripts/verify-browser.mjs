#!/usr/bin/env node

/**
 * Vérification navigateur réelle via le Chrome DevTools Protocol.
 *
 * L'oracle est auto-suffisant : il démarre son propre serveur Vite sur un port dédié, lance un
 * Chrome headless avec un profil jetable, monte un banc d'essai temporaire, mesure le DOM rendu
 * et la cascade CSS réelle, capture des copies d'écran de preuve, puis nettoie tout.
 *
 * Usage :
 *   node scripts/verify-browser.mjs --theme      bascule de thème
 *   node scripts/verify-browser.mjs --sessions   états des sessions de pointage
 *   node scripts/verify-browser.mjs              les deux
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
const TOKEN_THEME = 'browser-verify: theme toggle passed'
const TOKEN_SESSIONS = 'browser-verify: session states passed'

const MODE = process.argv[2] === '--theme' ? 'theme' : process.argv[2] === '--sessions' ? 'sessions' : 'all'

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

const HARNESS_JS = `import { createApp, h } from 'vue'
import '../src/style.css'
import ThemeToggle from '../src/components/shared/ThemeToggle.vue'
import WeekSummaryCard from '../src/components/employee/WeekSummaryCard.vue'
import { getLocalDateString, resolveSessionMinutes } from '../src/lib/dateUtils.js'

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

const app = createApp({
  render: () =>
    h('div', { class: 'p-4 flex flex-col gap-4' }, [
      h('div', { id: 'toggle-host' }, [h(ThemeToggle, { showLabel: true })]),
      h('div', { id: 'toggle-icon-host' }, [h(ThemeToggle)]),
      h('div', { id: 'card-host', style: 'max-width:520px' }, [
        h(WeekSummaryCard, {
          recentPresences: presences,
          weekPresences: presences,
          weekTotalMinutes,
        }),
      ]),
    ]),
})

app.mount('#app')

// Exposé à l'oracle pour comparer le rendu à la valeur d'agrégation réellement passée
window.__harness = { presences, weekTotalMinutes, resolveSessionMinutes }
window.__harnessReady = true
`

const MEASURE_EXPRESSION = `(() => {
  const collapse = (value) => (value || '').replace(/\\s+/g, ' ').trim()
  const push = (node) => (node ? getComputedStyle(node).backgroundColor : null)
  const labelButton = document.querySelector('#toggle-host button')
  const iconButton = document.querySelector('#toggle-icon-host button')
  const labelRect = labelButton ? labelButton.getBoundingClientRect() : null
  const iconRect = iconButton ? iconButton.getBoundingClientRect() : null
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

  return {
    theme: document.documentElement.getAttribute('data-theme'),
    stored: window.localStorage.getItem('presence_theme'),
    bodyBg: push(document.body),
    meta: meta ? meta.content : null,
    labelText: labelButton ? collapse(labelButton.innerText) : null,
    iconText: iconButton ? collapse(iconButton.innerText) : null,
    iconAria: iconButton ? iconButton.getAttribute('aria-label') : null,
    labelWidth: labelRect ? Math.round(labelRect.width) : 0,
    labelHeight: labelRect ? Math.round(labelRect.height) : 0,
    iconWidth: iconRect ? Math.round(iconRect.width) : 0,
    iconHeight: iconRect ? Math.round(iconRect.height) : 0,
    labelCenter: labelRect ? { x: Math.round(labelRect.x + labelRect.width / 2), y: Math.round(labelRect.y + labelRect.height / 2) } : null,
    rows,
    cardText: document.querySelector('#card-host') ? collapse(document.querySelector('#card-host').innerText) : null,
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
  console.log('browser-verify: bascule de thème')

  const initial = await cdp.measure()
  assertShape(initial)

  check('état initial : aucun attribut de thème forcé', () => assertEqual(initial.theme, null, 'data-theme'))
  check('état initial : aucune préférence stockée', () => assertEqual(initial.stored, null, 'localStorage'))
  check('état initial : surface M3 claire rendue', () => assertEqual(initial.bodyBg, LIGHT_SURFACE, 'fond du corps'))
  check('état initial : meta theme-color alignée sur la surface claire', () => assertEqual(initial.meta, '#fdfcff', 'meta'))

  check('variante libellée : libellé et action annoncés', () => {
    assertTrue((initial.labelText || '').includes('Apparence : Système'), `libellé inattendu : ${initial.labelText}`)
    assertTrue((initial.labelText || '').includes('passer au thème clair'), 'action suivante non annoncée')
  })
  check('variante libellée : cible tactile au moins 44px', () => {
    assertTrue(initial.labelWidth >= 44, `largeur ${initial.labelWidth}px`)
    assertTrue(initial.labelHeight >= 44, `hauteur ${initial.labelHeight}px`)
  })
  check('variante icône seule : cible 44x44 et nom accessible', () => {
    assertTrue(initial.iconWidth >= 44 && initial.iconHeight >= 44, `cible ${initial.iconWidth}x${initial.iconHeight}`)
    assertTrue((initial.iconAria || '').includes('Apparence'), `aria-label manquant : ${initial.iconAria}`)
  })

  await cdp.clickAt(initial.labelCenter)
  const light = await cdp.measure()
  check('premier clic : thème clair forcé', () => assertEqual(light.theme, 'light', 'data-theme'))
  check('premier clic : préférence persistée', () => assertEqual(light.stored, 'light', 'localStorage'))
  check('premier clic : surface claire rendue', () => assertEqual(light.bodyBg, LIGHT_SURFACE, 'fond du corps'))
  await cdp.screenshot('theme-light.png')

  await cdp.clickAt(light.labelCenter)
  const dark = await cdp.measure()
  check('deuxième clic : thème sombre forcé', () => assertEqual(dark.theme, 'dark', 'data-theme'))
  check('deuxième clic : préférence persistée', () => assertEqual(dark.stored, 'dark', 'localStorage'))
  check('deuxième clic : surface sombre réellement rendue', () => assertEqual(dark.bodyBg, DARK_SURFACE, 'fond du corps'))
  check('les deux thèmes produisent des surfaces distinctes', () => assertTrue(light.bodyBg !== dark.bodyBg, 'surfaces identiques'))
  check('meta theme-color suit le thème sombre', () => assertEqual(dark.meta, '#111318', 'meta'))
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

  return failures === 0
}

async function verifySessions(cdp) {
  console.log('browser-verify: états des sessions')

  const snapshot = await cdp.measure()
  assertShape(snapshot)

  check('la tuile rend trois lignes de pointage', () => assertTrue(snapshot.rows.length === 3, `${snapshot.rows.length} lignes`))

  const closed = snapshot.rows.find((row) => (row.text || '').includes('8h 30min'))
  const stale = snapshot.rows.find((row) => (row.text || '').includes('Départ manquant'))
  const openToday = snapshot.rows.find((row) => (row.text || '').includes('En cours'))

  check('session close : durée réelle affichée', () => assertTrue(Boolean(closed), `aucune ligne close dans ${JSON.stringify(snapshot.rows.map((r) => r.text))}`))
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

  check('le total hebdomadaire exclut la session oubliée', () => {
    // 8h30 de session close plus 90 minutes de la session du jour, la veille ouverte comptant zéro
    assertEqual(snapshot.weekTotal, 600, 'total de la semaine')
  })
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

  return failures === 0
}

async function main() {
  const chromePath = findChrome()
  if (!chromePath) {
    console.error('FAILURE browser-verify: aucun binaire Chrome trouvé, définir CHROME_PATH')
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
      height: 1000,
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

    let themeOk = true
    let sessionsOk = true
    if (MODE === 'theme' || MODE === 'all') themeOk = await verifyTheme(cdp)
    if (MODE === 'sessions' || MODE === 'all') sessionsOk = await verifySessions(cdp)

    if (cdp.pageErrors.length > 0) {
      failures += 1
      console.error(`  FAIL aucune exception de page attendue -> ${cdp.pageErrors.slice(0, 3).join(' | ')}`)
    } else {
      console.log('  ok aucune exception de page pendant le parcours')
    }

    if (MODE === 'theme' && themeOk) console.log(TOKEN_THEME)
    if (MODE === 'sessions' && sessionsOk) console.log(TOKEN_SESSIONS)
    if (MODE === 'all') {
      if (themeOk) console.log(TOKEN_THEME)
      if (sessionsOk) console.log(TOKEN_SESSIONS)
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
