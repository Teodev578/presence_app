#!/usr/bin/env node

/**
 * Vérification comportementale du repli de la barre latérale (src/composables/useSidebarNav.js).
 * Sans dépendance supplémentaire : un DOM minimal et deux media queries simulées sont installés
 * avant chaque import du module, puis les effets observables sont mesurés (état du rail,
 * persistance, réactions aux franchissements de seuil).
 *
 * Usage :
 *   node scripts/test-sidebar-nav.mjs       suite comportementale
 */

import assert from 'node:assert/strict'

const MODULE_URL = new URL('../src/composables/useSidebarNav.js', import.meta.url).href
const DOCKED_QUERY = '(min-width: 840px)'
const AUTO_RAIL_QUERY = '(min-width: 840px) and (max-width: 1023.98px)'
const STORAGE_KEY = 'presence_nav_collapsed'

let scenarioCounter = 0
let assertionCount = 0

const check = (description, assertion) => {
  assertion()
  assertionCount += 1
  console.log(`  ok ${description}`)
}

/** Résolution des deux seuils du contrat, indépendante du composable. */
const matchesFor = (query, width) => {
  if (query === DOCKED_QUERY) return width >= 840
  if (query === AUTO_RAIL_QUERY) return width >= 840 && width <= 1023.98
  return false
}

/**
 * Installe un DOM minimal avec deux media queries pilotables, puis renvoie de quoi franchir
 * les seuils. La largeur initiale est appliquée avant l'import : l'init lit `matches` sans émettre.
 */
function createDom({ stored = null, storageThrows = false, width = 1280 } = {}) {
  const storage = new Map()
  if (stored !== null) storage.set(STORAGE_KEY, stored)

  const entries = new Map()
  const entryFor = (query) => {
    if (!entries.has(query)) entries.set(query, { query, matches: null, listeners: [] })
    return entries.get(query)
  }

  const guard = () => {
    if (storageThrows) throw new Error('stockage refusé')
  }

  global.window = {
    localStorage: {
      getItem: (key) => {
        guard()
        return storage.has(key) ? storage.get(key) : null
      },
      setItem: (key, value) => {
        guard()
        storage.set(key, String(value))
      },
      removeItem: (key) => {
        guard()
        storage.delete(key)
      },
    },
    matchMedia: (query) => {
      const entry = entryFor(query)
      return {
        media: query,
        get matches() {
          return entry.matches
        },
        addEventListener: (type, callback) => {
          if (type === 'change') entry.listeners.push(callback)
        },
        removeEventListener: () => {},
      }
    },
  }

  // Vue lit doc.createElement au chargement du runtime-dom : un DOM simulé trop pauvre casse l'import
  global.document = {
    createElement: () => ({}),
    createElementNS: () => ({}),
  }

  for (const query of [DOCKED_QUERY, AUTO_RAIL_QUERY]) {
    entryFor(query).matches = matchesFor(query, width)
  }

  return {
    storage,
    setViewport(nextWidth) {
      for (const entry of entries.values()) {
        const matches = matchesFor(entry.query, nextWidth)
        if (entry.matches === matches) continue
        entry.matches = matches
        for (const callback of [...entry.listeners]) callback({ matches })
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
  console.log('sidebar-nav: suite comportementale')

  // 1. Sans préférence, le seuil décide : rail automatique dans la bande 840-1024, déploiement
  //    au delà, aucun rail sous 840, bornes de la bande respectées.
  const auto = await freshModule({ width: 900 })
  const autoNav = auto.module.useSidebarNav()
  check('clé de persistance stable', () => assert.equal(auto.module.SIDEBAR_STORAGE_KEY, STORAGE_KEY))
  check('sans préférence, bande 840-1024 : le rail s’applique', () => assert.equal(autoNav.isRail.value, true))
  auto.dom.setViewport(1280)
  check('sans préférence, au delà de 1024 : la barre se déploie', () => assert.equal(autoNav.isRail.value, false))
  auto.dom.setViewport(839)
  check('sans préférence, sous 840 : le rail n’a pas d’objet', () => assert.equal(autoNav.isRail.value, false))
  auto.dom.setViewport(1024)
  check('la bande s’arrête à 1024, borne haute exclue', () => assert.equal(autoNav.isRail.value, false))
  auto.dom.setViewport(1023)
  check('la bande couvre 1023, borne haute incluse', () => assert.equal(autoNav.isRail.value, true))

  // 2. Un choix explicite prime sur le seuil automatique, dans les deux sens.
  const forcedOpen = await freshModule({ stored: 'false', width: 900 })
  const forcedOpenNav = forcedOpen.module.useSidebarNav()
  check('préférence déployée : le rail automatique est déjoué', () => assert.equal(forcedOpenNav.isRail.value, false))
  forcedOpen.dom.setViewport(1280)
  check('préférence déployée : la barre reste déployée au delà', () => assert.equal(forcedOpenNav.isRail.value, false))

  const forcedRail = await freshModule({ stored: 'true', width: 1280 })
  const forcedRailNav = forcedRail.module.useSidebarNav()
  check('préférence repliée : le rail s’applique hors bande', () => assert.equal(forcedRailNav.isRail.value, true))
  forcedRail.dom.setViewport(900)
  check('préférence repliée : le rail reste acquis dans la bande', () => assert.equal(forcedRailNav.isRail.value, true))
  forcedRail.dom.setViewport(839)
  check('préférence repliée : le rail s’efface sous 840', () => assert.equal(forcedRailNav.isRail.value, false))
  forcedRail.dom.setViewport(900)
  check('de retour dans la bande : le rail revient', () => assert.equal(forcedRailNav.isRail.value, true))

  // 3. La poignée grave un choix persistant, dans les deux sens, et il survit au franchissement.
  const toggling = await freshModule({ width: 900 })
  const togglingNav = toggling.module.useSidebarNav()
  check('état initial : rail automatique', () => assert.equal(togglingNav.isRail.value, true))
  togglingNav.toggleRail()
  check('premier clic : barre déployée', () => assert.equal(togglingNav.isRail.value, false))
  check('premier clic : préférence déployée persistée', () => assert.equal(toggling.dom.storage.get(STORAGE_KEY), 'false'))
  toggling.dom.setViewport(1280)
  check('choix déployé : il tient hors bande', () => assert.equal(togglingNav.isRail.value, false))
  togglingNav.toggleRail()
  check('second clic : rail volontaire', () => assert.equal(togglingNav.isRail.value, true))
  check('second clic : préférence repliée persistée', () => assert.equal(toggling.dom.storage.get(STORAGE_KEY), 'true'))
  toggling.dom.setViewport(900)
  check('choix replié : il tient face au repli automatique', () => assert.equal(togglingNav.isRail.value, true))

  // 4. Valeur stockée inconnue ignorée : le seuil reprend la main.
  const corrupted = await freshModule({ stored: 'blue', width: 900 })
  const corruptedNav = corrupted.module.useSidebarNav()
  check('valeur stockée invalide ignorée : le seuil décide', () => assert.equal(corruptedNav.isRail.value, true))
  corrupted.dom.setViewport(1280)
  check('valeur stockée invalide ignorée : déploiement hors bande', () => assert.equal(corruptedNav.isRail.value, false))

  // 5. Stockage indisponible : aucune exception, le seuil décide encore.
  const noStorage = await freshModule({ storageThrows: true, width: 900 })
  const noStorageNav = noStorage.module.useSidebarNav()
  check('stockage refusé : le rail automatique fonctionne', () => assert.equal(noStorageNav.isRail.value, true))
  noStorageNav.toggleRail()
  check('stockage refusé : le clic déploie sans lever d’exception', () => assert.equal(noStorageNav.isRail.value, false))

  // 6. État partagé : les deux espaces lisent le même contrat.
  const shared = await freshModule({ width: 900 })
  const first = shared.module.useSidebarNav()
  const second = shared.module.useSidebarNav()
  first.toggleRail()
  check('état partagé entre deux consommateurs', () => assert.equal(second.isRail.value, false))

  // 7. Absence de DOM : le module reste importable, aucun rail ne s'invente.
  delete global.window
  delete global.document

  scenarioCounter += 1
  const bare = await import(`${MODULE_URL}?scenario=${scenarioCounter}`)
  const bareNav = bare.useSidebarNav()
  check('absence de DOM : aucun rail sans exception', () => assert.equal(bareNav.isRail.value, false))
  check('absence de DOM : le clic ne lève pas', () => {
    bareNav.toggleRail()
    assert.equal(bareNav.isRail.value, false)
  })

  console.log(`  assertions: ${assertionCount}`)
  console.log('sidebar-nav: behavior suite passed')
}

await runBehaviorSuite()
