#!/usr/bin/env node

/**
 * Vérification comportementale du commutateur de thème (src/composables/useTheme.js).
 * Sans dépendance supplémentaire : un DOM minimal est simulé avant chaque import du module,
 * puis les effets observables sont mesurés (attribut data-theme, localStorage, meta theme-color).
 *
 * Usage :
 *   node scripts/test-theme-toggle.mjs               suite comportementale
 *   node scripts/test-theme-toggle.mjs --storage-key cohérence de la clé avec index.html
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const MODULE_URL = new URL('../src/composables/useTheme.js', import.meta.url).href
const LIGHT_SURFACE = '#fdfcff'
const DARK_SURFACE = '#111318'

let scenarioCounter = 0
let assertionCount = 0

const check = (description, assertion) => {
  assertion()
  assertionCount += 1
  console.log(`  ok ${description}`)
}

/** Installe un DOM minimal en global et renvoie ses sondes d'observation. */
function createDom({ stored = null, systemDark = false } = {}) {
  const storage = new Map()
  if (stored !== null) storage.set('presence_theme', stored)

  const listeners = []
  let mediaMatches = systemDark

  const root = {
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value
    },
    removeAttribute(name) {
      delete this.attributes[name]
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null
    },
  }

  const meta = {
    content: LIGHT_SURFACE,
    setAttribute(name, value) {
      if (name === 'content') this.content = value
    },
  }

  global.window = {
    localStorage: {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
    },
    matchMedia: () => ({
      media: '(prefers-color-scheme: dark)',
      get matches() {
        return mediaMatches
      },
      addEventListener: (type, callback) => listeners.push({ type, callback }),
      removeEventListener: (type) => {
        const index = listeners.findIndex((entry) => entry.type === type)
        if (index > -1) listeners.splice(index, 1)
      },
    }),
  }

  global.document = {
    documentElement: root,
    querySelector: (selector) => (selector === 'meta[name="theme-color"]' ? meta : null),
    // Vue lit doc.createElement au chargement du module runtime-dom : un DOM simulé trop pauvre casse l'import
    createElement: () => ({}),
    createElementNS: () => ({}),
  }

  // Reproduit la résolution CSS : l'attribut data-theme prime, sinon le réglage système décide.
  global.getComputedStyle = () => ({
    getPropertyValue: (name) => {
      if (name !== '--md-sys-color-surface') return ''
      const forced = root.getAttribute('data-theme')
      const isDark = forced ? forced === 'dark' : mediaMatches
      return isDark ? DARK_SURFACE : LIGHT_SURFACE
    },
  })

  return {
    root,
    storage,
    meta,
    listeners,
    emitSystemChange(value) {
      mediaMatches = value
      for (const entry of listeners) {
        if (entry.type === 'change') entry.callback({ matches: value })
      }
    },
  }
}

/** Importe une instance neuve du module sur un DOM neuf (cache d'import neutralisé par requête). */
async function freshModule(options) {
  const dom = createDom(options)
  scenarioCounter += 1
  const module = await import(`${MODULE_URL}?scenario=${scenarioCounter}`)
  return { dom, module }
}

async function runBehaviorSuite() {
  console.log('theme-toggle: suite comportementale')

  // 1. Aucune préférence stockée : le thème suit le système
  const first = await freshModule()
  const firstTheme = first.module.useTheme()
  check('mode initial : système', () => assert.equal(firstTheme.mode.value, 'system'))
  check('aucun attribut data-theme en mode système', () => assert.equal(first.dom.root.getAttribute('data-theme'), null))
  check('meta theme-color alignée sur la surface claire', () => assert.equal(first.dom.meta.content, LIGHT_SURFACE))

  // 2. Cycle complet système vers clair, sombre, puis retour au système
  firstTheme.cycleTheme()
  check('cycle 1 : thème clair', () => assert.equal(firstTheme.mode.value, 'light'))
  check('attribut data-theme posé à light', () => assert.equal(first.dom.root.getAttribute('data-theme'), 'light'))
  check('préférence claire persistée', () => assert.equal(first.dom.storage.get('presence_theme'), 'light'))

  firstTheme.cycleTheme()
  check('cycle 2 : thème sombre', () => assert.equal(firstTheme.mode.value, 'dark'))
  check('attribut data-theme posé à dark', () => assert.equal(first.dom.root.getAttribute('data-theme'), 'dark'))
  check('meta theme-color alignée sur la surface sombre', () => assert.equal(first.dom.meta.content, DARK_SURFACE))

  firstTheme.cycleTheme()
  check('cycle 3 : retour au système', () => assert.equal(firstTheme.mode.value, 'system'))
  check('attribut supprimé au retour au système', () => assert.equal(first.dom.root.getAttribute('data-theme'), null))
  check('préférence effacée au retour au système', () => assert.equal(first.dom.storage.has('presence_theme'), false))

  // 3. Préférence stockée restaurée au chargement
  const restored = await freshModule({ stored: 'dark' })
  const restoredTheme = restored.module.useTheme()
  check('préférence sombre restaurée au chargement', () => assert.equal(restoredTheme.mode.value, 'dark'))
  check('attribut dark restauré avant le premier rendu utile', () => assert.equal(restored.dom.root.getAttribute('data-theme'), 'dark'))

  // 4. Valeur stockée invalide ignorée
  const corrupted = await freshModule({ stored: 'blue' })
  check('valeur stockée invalide ignorée', () => assert.equal(corrupted.module.useTheme().mode.value, 'system'))

  // 5. Suivi du réglage système tant qu'aucun thème n'est forcé
  const following = await freshModule({ systemDark: true })
  following.module.useTheme()
  check('aucun attribut imposé même si le système est sombre', () => assert.equal(following.dom.root.getAttribute('data-theme'), null))
  check('meta theme-color alignée sur la surface sombre du système', () => assert.equal(following.dom.meta.content, DARK_SURFACE))

  following.dom.emitSystemChange(false)
  check('changement de réglage système suivi par la meta', () => assert.equal(following.dom.meta.content, LIGHT_SURFACE))

  following.module.useTheme().cycleTheme()
  check('cycle depuis le système avec système sombre : thème clair forcé', () =>
    assert.equal(following.dom.root.getAttribute('data-theme'), 'light')
  )
  following.dom.emitSystemChange(true)
  check('thème forcé insensible au réglage système', () => assert.equal(following.dom.root.getAttribute('data-theme'), 'light'))

  // 6. État partagé et initialisation idempotente
  const shared = await freshModule()
  const consumer = shared.module.useTheme()
  const otherConsumer = shared.module.useTheme()
  consumer.cycleTheme()
  check('état partagé entre deux consommateurs', () => assert.equal(otherConsumer.mode.value, 'light'))
  check('un seul écouteur système enregistré', () =>
    assert.equal(shared.dom.listeners.filter((entry) => entry.type === 'change').length, 1)
  )

  // 7. Absence de DOM : le module reste importable et ne lève rien
  delete global.window
  delete global.document
  delete global.getComputedStyle

  scenarioCounter += 1
  const bare = await import(`${MODULE_URL}?scenario=${scenarioCounter}`)
  const bareTheme = bare.useTheme()
  check('absence de DOM : mode système sans exception', () => assert.equal(bareTheme.mode.value, 'system'))
  check('absence de DOM : le cycle ne lève pas', () => {
    bareTheme.cycleTheme()
    assert.equal(bareTheme.mode.value, 'light')
  })
  check('clé de stockage exportée', () => assert.equal(bare.THEME_STORAGE_KEY, 'presence_theme'))
  check('ordre du cycle complet', () => assert.deepEqual(bare.THEME_MODES, ['system', 'light', 'dark']))

  console.log(`  assertions: ${assertionCount}`)
  console.log('theme-toggle: behavior suite passed')
}

async function checkStorageKey() {
  const { module } = await freshModule()
  const key = module.THEME_STORAGE_KEY

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  const css = fs.readFileSync(path.join(ROOT, 'src', 'style.css'), 'utf8')

  const inlineRead = html.indexOf(`getItem('${key}')`)
  const moduleScript = html.indexOf('type="module"')
  assert.ok(inlineRead > -1, `index.html ne lit pas la clé ${key} avant le rendu`)
  assert.ok(html.includes("setAttribute('data-theme'"), 'index.html ne pose pas data-theme avant le rendu')
  assert.ok(moduleScript > -1 && inlineRead < moduleScript, 'le script de pré-peinture doit précéder le script module')

  const metaMatch = html.match(/<meta name="theme-color" content="(#[0-9a-fA-F]{6})"/)
  assert.ok(metaMatch, 'meta theme-color absente de index.html')

  const lightBlock = css.match(/:root,\s*\[data-theme="light"\]\s*\{[\s\S]*?\n\}/)
  assert.ok(lightBlock, 'bloc de thème clair introuvable dans src/style.css')
  const surfaceMatch = lightBlock[0].match(/--md-sys-color-surface:\s*(#[0-9a-fA-F]{6})/)
  assert.ok(surfaceMatch, 'token --md-sys-color-surface introuvable dans le bloc clair')
  assert.equal(metaMatch[1].toLowerCase(), surfaceMatch[1].toLowerCase(), 'la couleur de repli doit égaler la surface M3 claire')

  console.log('theme-toggle: storage key consistent with index.html')
  console.log(`  details: key=${key} fallback=${metaMatch[1]} surface=${surfaceMatch[1]}`)
}

const flag = process.argv[2]

if (flag === '--storage-key') {
  await checkStorageKey()
} else {
  await runBehaviorSuite()
}
