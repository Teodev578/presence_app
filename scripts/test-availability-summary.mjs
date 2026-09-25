#!/usr/bin/env node

/**
 * Vérification comportementale du résumé de disponibilités (src/lib/availabilitySummary.js).
 * La fonction est pure : les cas sont exercés directement, sans DOM ni navigateur.
 *
 * Usage :
 *   node scripts/test-availability-summary.mjs
 */

import assert from 'node:assert/strict'
import { summarizeAvailability, describeAvailabilityCount } from '../src/lib/availabilitySummary.js'

const DAYS = [
  { id: 1, label: 'Lundi', short: 'Lun' },
  { id: 2, label: 'Mardi', short: 'Mar' },
  { id: 3, label: 'Mercredi', short: 'Mer' },
  { id: 4, label: 'Jeudi', short: 'Jeu' },
  { id: 5, label: 'Vendredi', short: 'Ven' },
]

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

// Contrôle positif : la sélection complète doit être comptée. Sans ce cas, un compteur
// constamment nul passerait inaperçu derrière les assertions d'état vide.
check('sélection complète comptée et nommée dans l’ordre de la semaine', () => {
  const summary = summarizeAvailability([1, 2, 3, 4, 5], DAYS)
  assert.equal(summary.count, 5)
  assert.equal(summary.isEmpty, false)
  assert.deepEqual(summary.labels, ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'])
  assert.equal(summary.label, '5 jours sélectionnés')
})

check('sélection partielle désordonnée réordonnée selon la semaine', () => {
  const summary = summarizeAvailability([4, 1], DAYS)
  assert.equal(summary.count, 2)
  assert.deepEqual(summary.labels, ['Lun', 'Jeu'])
  assert.equal(summary.label, '2 jours sélectionnés')
})

check('jour unique accordé au singulier', () => {
  const summary = summarizeAvailability([2], DAYS)
  assert.equal(summary.count, 1)
  assert.deepEqual(summary.labels, ['Mar'])
  assert.equal(summary.label, '1 jour sélectionné')
})

// Contrôle négatif explicite : l'absence de sélection doit être distinguée, pas confondue
// avec une sélection que la grille n'aurait pas su résoudre.
check('aucune sélection signalée sans emprunter le libellé d’une sélection', () => {
  const summary = summarizeAvailability([], DAYS)
  assert.equal(summary.count, 0)
  assert.equal(summary.isEmpty, true)
  assert.deepEqual(summary.labels, [])
  assert.equal(summary.label, 'Aucun jour sélectionné')
  assert.notEqual(summary.label, summarizeAvailability([1], DAYS).label)
})

check('identifiant inconnu ignoré au lieu d’être compté', () => {
  const summary = summarizeAvailability([1, 99], DAYS)
  assert.equal(summary.count, 1)
  assert.deepEqual(summary.labels, ['Lun'])
})

check('entrées manquantes tolérées sans exception', () => {
  assert.equal(summarizeAvailability().count, 0)
  assert.equal(summarizeAvailability(undefined, undefined).label, 'Aucun jour sélectionné')
  assert.equal(summarizeAvailability([1], undefined).count, 0)
})

check('libellé de compte cohérent aux bornes', () => {
  assert.equal(describeAvailabilityCount(0), 'Aucun jour sélectionné')
  assert.equal(describeAvailabilityCount(-3), 'Aucun jour sélectionné')
  assert.equal(describeAvailabilityCount(1), '1 jour sélectionné')
  assert.equal(describeAvailabilityCount(3), '3 jours sélectionnés')
})

if (failures > 0) {
  console.error(`FAILURE availability-summary: ${failures} assertion(s) en échec`)
  process.exit(1)
}

console.log('availability-summary: logic suite passed')
