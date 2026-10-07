#!/usr/bin/env node
/**
 * Oracle déterministe pour la fonctionnalité de changement de mot de passe dans la tuile Compte.
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

const authPath = existsSync(resolve(root, 'src/composables/auth/useAuth.js'))
  ? resolve(root, 'src/composables/auth/useAuth.js')
  : resolve(root, 'src/composables/useAuth.js')
assert(existsSync(authPath), 'src/composables/auth/useAuth.js existe')

if (existsSync(authPath)) {
  const authContent = readFileSync(authPath, 'utf8')
  assert(authContent.includes('changePassword'), 'useAuth exporte la méthode changePassword')
  assert(authContent.includes('supabase.auth.updateUser'), 'changePassword appelle supabase.auth.updateUser')
  assert(authContent.includes('cleanPassword.length < 6'), 'changePassword valide la longueur minimale (6 caractères)')
  assert(authContent.includes('formatAuthError'), 'changePassword formate les erreurs Supabase')

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
  assert(!emojiRegex.test(authContent), 'useAuth.js est exempt de tout émoji brut')
}

console.log('\n--- 2. Vérification de l\'interface dans SettingsView.vue ---')
const settingsPath = resolve(root, 'src/views/SettingsView.vue')
assert(existsSync(settingsPath), 'src/views/SettingsView.vue existe')

if (existsSync(settingsPath)) {
  const settingsContent = readFileSync(settingsPath, 'utf8')

  // Logique réactive
  assert(settingsContent.includes('changePassword'), 'SettingsView importe changePassword depuis useAuth')
  assert(settingsContent.includes('isChangingPassword'), 'Gestion de l\'état de dépliement isChangingPassword')
  assert(settingsContent.includes('newPassword'), 'Modèle newPassword présent')
  assert(settingsContent.includes('confirmPassword'), 'Modèle confirmPassword présent')
  assert(settingsContent.includes('showNewPassword'), 'Bascule de visibilité showNewPassword présente')
  assert(settingsContent.includes('showConfirmPassword'), 'Bascule de visibilité showConfirmPassword présente')
  assert(settingsContent.includes('handlePasswordSubmit'), 'Gestionnaire de soumission handlePasswordSubmit présent')

  // Éléments du formulaire
  assert(settingsContent.includes('Changer de mot de passe'), 'Bouton d\'ouverture présent')
  assert(settingsContent.includes('Nouveau mot de passe'), 'Libellé Nouveau mot de passe présent')
  assert(settingsContent.includes('Confirmer le mot de passe'), 'Libellé Confirmer le mot de passe présent')
  assert(settingsContent.includes('Enregistrer le mot de passe'), 'Action Enregistrer le mot de passe présente (ton sobre)')

  // Tokens de rayon M3
  const nonM3Radii = (settingsContent.match(/\brounded-(?:sm|md|lg|xl|2xl|3xl)\b/g) || []).filter(
    (cls) => !cls.startsWith('rounded-m3-')
  )
  assert(nonM3Radii.length === 0, `Exclusivité des tokens M3 rounded-m3-* (trouvés : ${nonM3Radii.join(', ') || 'aucun'})`)

  // Pas d'ombres agressives
  const aggressiveShadows = settingsContent.match(/\bshadow-(?:md|lg|xl|2xl)\b/g) || []
  assert(aggressiveShadows.length === 0, 'Aucune ombre agressive (shadow-md/lg/xl/2xl)')

  // Cibles tactiles 44px (min-h-11)
  const sub44Target = /\b(btn-xs|min-h-8|min-w-8|h-8(?:\s|$))\b/
  assert(!sub44Target.test(settingsContent), 'Aucune cible sous le seuil 44px (pas de btn-xs / h-8)')

  // Pas d'émojis bruts
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
  assert(!emojiRegex.test(settingsContent), 'SettingsView.vue est exempt de tout émoji brut')

  // Charte de tonalité (09-ui-copy-and-tone.md)
  const forbiddenTerms = ['utilisateur', 'anomalie', 'veuillez', 'valider', 'kpi', 'sanction']
  const foundForbidden = forbiddenTerms.filter((term) => new RegExp(`\\b${term}\\b`, 'i').test(settingsContent))
  assert(foundForbidden.length === 0, `Respect de la charte de tonalité (termes proscrits : ${foundForbidden.join(', ') || 'aucun'})`)

  // Préservation des invariants G95
  assert(settingsContent.includes('Compte'), 'Invariant G95 : Compte présent')
  assert(settingsContent.includes('Synchronisation'), 'Invariant G95 : Synchronisation présente')
  assert(settingsContent.includes('Apparence'), 'Invariant G95 : Apparence présente')
  assert(!settingsContent.includes('>Déconnexion</h2>'), 'Invariant G95 : Absence de titre h2 Déconnexion')
  assert(!settingsContent.includes('Connecté'), 'Invariant G95 : Absence du terme ambigu Connecté')
}

console.log('\n--- Résumé des assertions ---')
console.log(`Total assertions : ${passedCount + failedCount}`)
console.log(`Réussies : ${passedCount}`)
console.log(`Échouées : ${failedCount}`)

if (failedCount > 0) {
  process.exit(1)
} else {
  console.log('\n✓ Toutes les vérifications de changement de mot de passe sont au vert.')
  process.exit(0)
}
