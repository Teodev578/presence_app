#!/usr/bin/env node

/**
 * Vérification comportementale des états de session (src/lib/dateUtils.js).
 * Module pur, sans DOM : les instants de référence sont injectés pour que le test soit déterministe.
 *
 * Usage : node scripts/test-session-state.mjs
 */

import assert from 'node:assert/strict'
import {
  isSessionInProgress,
  resolveSessionState,
  resolveSessionMinutes,
  formatSessionDuration,
} from '../src/lib/dateUtils.js'

let assertionCount = 0

const check = (description, assertion) => {
  assertion()
  assertionCount += 1
  console.log(`  ok ${description}`)
}

// Instants locaux de référence : vendredi 25 septembre 2026
const FRIDAY_EVENING = new Date(2026, 8, 25, 21, 27, 0)
const FRIDAY_LATE = new Date(2026, 8, 25, 23, 59, 0)
const SATURDAY_EARLY = new Date(2026, 8, 26, 0, 1, 0)

const closedSession = {
  work_date: '2026-09-24',
  check_in_time: new Date(2026, 8, 24, 8, 0, 0).toISOString(),
  check_out_time: new Date(2026, 8, 24, 16, 30, 0).toISOString(),
}

const openToday = {
  work_date: '2026-09-25',
  check_in_time: new Date(2026, 8, 25, 21, 10, 0).toISOString(),
  check_out_time: null,
}

// Session ouverte la veille au soir, jamais clôturée : reproduit le défaut signalé
const staleSession = {
  work_date: '2026-09-24',
  check_in_time: new Date(2026, 8, 24, 23, 6, 0).toISOString(),
  check_out_time: null,
}

console.log('session-state: suite comportementale')

// 1. Session close : durée réelle
check('session close reconnue', () => assert.equal(resolveSessionState(closedSession, FRIDAY_EVENING), 'closed'))
check('durée réelle de la session close', () => assert.equal(resolveSessionMinutes(closedSession, FRIDAY_EVENING), 510))
check('durée formatée de la session close', () => assert.equal(formatSessionDuration(closedSession, FRIDAY_EVENING), '8h 30min'))

// 2. Session ouverte du jour : en cours, temps écoulé
check('session ouverte du jour en cours', () => assert.equal(resolveSessionState(openToday, FRIDAY_EVENING), 'in_progress'))
check('minutes écoulées de la session du jour', () => assert.equal(resolveSessionMinutes(openToday, FRIDAY_EVENING), 17))
check('durée formatée de la session du jour', () => assert.equal(formatSessionDuration(openToday, FRIDAY_EVENING), '17 min'))

// 3. Session ouverte d'une journée révolue : départ manquant, aucune durée
check('session ouverte de la veille : départ manquant', () =>
  assert.equal(resolveSessionState(staleSession, FRIDAY_EVENING), 'missing_checkout')
)
check('une journée révolue ne compte aucune minute', () => assert.equal(resolveSessionMinutes(staleSession, FRIDAY_EVENING), 0))
check('la durée affichée reste indisponible au lieu de croître', () =>
  assert.equal(formatSessionDuration(staleSession, FRIDAY_EVENING), '--')
)
check('le total ne gonfle plus de 22h20min sur une session oubliée', () => {
  assert.notEqual(formatSessionDuration(staleSession, FRIDAY_EVENING), '22h 20min')
})

// 4. Travail de nuit à cheval sur minuit : limite assumée de la règle retenue
const overnight = {
  work_date: '2026-09-24',
  check_in_time: new Date(2026, 8, 24, 23, 30, 0).toISOString(),
  check_out_time: null,
}
check('service de nuit à cheval sur minuit basculé en départ manquant', () =>
  assert.equal(resolveSessionState(overnight, SATURDAY_EARLY), 'missing_checkout')
)

// 5. Frontière de minuit, à la minute près
check('dernière minute du jour de travail : encore en cours', () =>
  assert.equal(resolveSessionState(openToday, FRIDAY_LATE), 'in_progress')
)
check('première minute du jour suivant : départ manquant', () =>
  assert.equal(resolveSessionState(openToday, SATURDAY_EARLY), 'missing_checkout')
)

// 6. Pointage sans arrivée ou vide
check('pointage vide reconnu', () => assert.equal(resolveSessionState(null, FRIDAY_EVENING), 'empty'))
check('pointage sans arrivée reconnu', () =>
  assert.equal(resolveSessionState({ work_date: '2026-09-25', check_in_time: null }, FRIDAY_EVENING), 'empty')
)
check('pointage vide : aucune minute', () => assert.equal(resolveSessionMinutes(null, FRIDAY_EVENING), 0))
check('pointage vide : durée indisponible', () => assert.equal(formatSessionDuration(null, FRIDAY_EVENING), '--'))

// 7. Date de travail absente ou incohérente
check('date de travail absente : jamais en cours', () => assert.equal(isSessionInProgress(null, FRIDAY_EVENING), false))
check('session ouverte sans date de travail : départ manquant', () =>
  assert.equal(resolveSessionState({ check_in_time: new Date(2026, 8, 25, 10, 0, 0).toISOString(), check_out_time: null }, FRIDAY_EVENING), 'missing_checkout')
)
check('journée courante reconnue par la bascule', () => assert.equal(isSessionInProgress('2026-09-25', FRIDAY_EVENING), true))

// 8. Horodatages incohérents
check('départ antérieur à l\u2019arrivée : aucune minute', () =>
  assert.equal(
    resolveSessionMinutes(
      {
        work_date: '2026-09-24',
        check_in_time: new Date(2026, 8, 24, 16, 0, 0).toISOString(),
        check_out_time: new Date(2026, 8, 24, 8, 0, 0).toISOString(),
      },
      FRIDAY_EVENING
    ),
    0
  )
)
check('horodatage d\u2019arrivée illisible : aucune minute', () =>
  assert.equal(resolveSessionMinutes({ work_date: '2026-09-24', check_in_time: 'invalide', check_out_time: null }, FRIDAY_EVENING), 0)
)
check('arrivée illisible sur une session du jour : aucune minute', () =>
  assert.equal(resolveSessionMinutes({ work_date: '2026-09-25', check_in_time: 'invalide', check_out_time: null }, FRIDAY_EVENING), 0)
)

// 9. Agrégation hebdomadaire : ce que consomme weekTotalMinutes
check('total hebdomadaire excluant la session oubliée', () => {
  const week = [closedSession, staleSession, openToday]
  const total = week.reduce((sum, presence) => sum + resolveSessionMinutes(presence, FRIDAY_EVENING), 0)
  assert.equal(total, 527)
})

console.log(`  assertions: ${assertionCount}`)
console.log('session-state: behavior suite passed')
