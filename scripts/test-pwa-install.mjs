#!/usr/bin/env node
/**
 * Oracle de vérification déterministe pour l'installation PWA et la tuile Paramètres.
 * Vérifie l'intégrité du manifeste, des icônes, du Service Worker, du composable et du composant UI.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()

let passedCount = 0
let failedCount = 0

function assert(condition, message) {
  if (condition) {
    passedCount++
    console.log(`  ✓ ${message}`)
  } else {
    failedCount++
    console.error(`  ✗ ÉCHEC : ${message}`)
  }
}

console.log('\n--- 1. Vérification du manifeste Web App et des icônes ---')
const manifestPath = resolve(root, 'public/manifest.webmanifest')
assert(existsSync(manifestPath), 'public/manifest.webmanifest existe')

if (existsSync(manifestPath)) {
  const content = readFileSync(manifestPath, 'utf8')
  let json = null
  try {
    json = JSON.parse(content)
  } catch (e) {
    assert(false, `manifest.webmanifest est un JSON valide : ${e.message}`)
  }

  if (json) {
    assert(json.name && json.name.includes('PresenceApp'), 'manifest.name est défini')
    assert(json.short_name === 'PresenceApp', 'manifest.short_name est PresenceApp')
    assert(json.display === 'standalone', 'manifest.display est standalone')
    assert(json.start_url === '/', 'manifest.start_url est /')
    assert(Array.isArray(json.icons) && json.icons.length >= 2, 'manifest.icons contient au moins 2 icônes')

    for (const icon of json.icons || []) {
      const iconPath = resolve(root, 'public', icon.src.replace(/^\//, ''))
      assert(existsSync(iconPath), `Icône déclarée existe : ${icon.src}`)
    }
  }
}

const appleTouchIconPath = resolve(root, 'public/apple-touch-icon.png')
assert(existsSync(appleTouchIconPath), 'public/apple-touch-icon.png existe pour iOS')

console.log('\n--- 2. Vérification de index.html et des balises méta ---')
const indexHtmlPath = resolve(root, 'index.html')
assert(existsSync(indexHtmlPath), 'index.html existe')
if (existsSync(indexHtmlPath)) {
  const indexHtml = readFileSync(indexHtmlPath, 'utf8')
  assert(indexHtml.includes('/manifest.webmanifest'), 'index.html référence le manifeste PWA')
  assert(indexHtml.includes('/apple-touch-icon.png'), 'index.html référence apple-touch-icon.png')
  assert(indexHtml.includes('mobile-web-app-capable'), 'index.html inclut mobile-web-app-capable')
}

console.log('\n--- 3. Conformité du Service Worker ---')
const swPath = resolve(root, 'public/sw.js')
assert(existsSync(swPath), 'public/sw.js existe')
if (existsSync(swPath)) {
  const swContent = readFileSync(swPath, 'utf8')
  assert(swContent.includes("'fetch'"), 'sw.js écoute les requêtes fetch pour la conformité PWA')
  assert(swContent.includes('presence-outbox-sync'), 'sw.js préserve le handler Background Sync')
}

console.log('\n--- 4. Composable usePwaInstall ---')
const composablePath = resolve(root, 'src/composables/usePwaInstall.js')
assert(existsSync(composablePath), 'src/composables/usePwaInstall.js existe')
if (existsSync(composablePath)) {
  const compContent = readFileSync(composablePath, 'utf8')
  assert(compContent.includes('beforeinstallprompt'), 'Interception de beforeinstallprompt présente')
  assert(compContent.includes('(display-mode: standalone)'), 'Détection du display-mode standalone présente')
  assert(compContent.includes('isIOS'), 'Détection spécifique iOS présente')
  assert(compContent.includes('isDesktop'), 'Détection spécifique Desktop présente')
  assert(compContent.includes('isChromium'), 'Détection Chromium présente')
  assert(compContent.includes('promptInstall'), 'Méthode promptInstall exportée')
  assert(compContent.includes('initPwaInstall'), 'Fonction initPwaInstall exportée')
  // Contrôle d'emojis bruts
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
  assert(!emojiRegex.test(compContent), 'Aucun émoji brut dans usePwaInstall.js')
}

console.log('\n--- 5. Composant PwaInstallCard ---')
const cardPath = resolve(root, 'src/components/shared/PwaInstallCard.vue')
assert(existsSync(cardPath), 'src/components/shared/PwaInstallCard.vue existe')
if (existsSync(cardPath)) {
  const cardContent = readFileSync(cardPath, 'utf8')
  assert(cardContent.includes('showDesktopGuide'), 'Prise en charge du guide pour ordinateur (desktop)')
  assert(cardContent.includes('md:col-span-2'), 'Extension md:col-span-2 pour la grille des paramètres')
  // Rayons M3 uniquement
  const nonM3Radii = (cardContent.match(/\brounded-(?:sm|md|lg|xl|2xl|3xl)\b/g) || []).filter(
    (cls) => !cls.startsWith('rounded-m3-')
  )
  assert(nonM3Radii.length === 0, `Exclusivité des tokens M3 rounded-m3-* (trouvés : ${nonM3Radii.join(', ') || 'aucun'})`)

  // Pas d'ombres agressives
  const aggressiveShadows = cardContent.match(/\bshadow-(?:md|lg|xl|2xl)\b/g) || []
  assert(aggressiveShadows.length === 0, 'Aucune ombre agressive (shadow-md/lg/xl/2xl)')

  // Cibles tactiles 44px
  const buttons = cardContent.match(/<button[^>]*>/g) || []
  const all44px = buttons.every((b) => b.includes('min-h-11'))
  assert(buttons.length > 0 && all44px, 'Toutes les cibles tactiles respectent le seuil minimal de 44px (min-h-11)')

  // Pas d'émojis bruts
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
  assert(!emojiRegex.test(cardContent), 'Aucun émoji brut dans PwaInstallCard.vue')

  // Lexique proscrit (09-ui-copy-and-tone.md)
  const forbiddenTerms = ['utilisateur', 'anomalie', 'veuillez', 'valider', 'kpi', 'sanction']
  const foundForbidden = forbiddenTerms.filter((term) => new RegExp(`\\b${term}\\b`, 'i').test(cardContent))
  assert(foundForbidden.length === 0, `Respect de la charte de tonalité (termes proscrits : ${foundForbidden.join(', ') || 'aucun'})`)
}

console.log('\n--- 6. Intégration dans SettingsView et App ---')
const settingsPath = resolve(root, 'src/views/SettingsView.vue')
if (existsSync(settingsPath)) {
  const settingsContent = readFileSync(settingsPath, 'utf8')
  assert(settingsContent.includes('<PwaInstallCard'), 'SettingsView.vue intègre PwaInstallCard')
  assert(settingsContent.includes('<!-- Application sur l\'appareil (PWA) -->'), 'Commentaire de section PWA présent')
}

const appPath = resolve(root, 'src/App.vue')
if (existsSync(appPath)) {
  const appContent = readFileSync(appPath, 'utf8')
  assert(appContent.includes('initPwaInstall'), 'App.vue importe et appelle initPwaInstall')
}

console.log('\n--- Résumé des assertions ---')
console.log(`Total assertions : ${passedCount + failedCount}`)
console.log(`Réussies : ${passedCount}`)
console.log(`Échouées : ${failedCount}`)

if (failedCount > 0) {
  process.exit(1)
} else {
  console.log('\n✓ Toutes les vérifications d\'installation PWA sont au vert.')
  process.exit(0)
}
