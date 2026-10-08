import assert from 'node:assert/strict'
import { resolveSchedule } from '../../src/lib/domain.js'

console.log('--- Test de la cascade de résolution d’horaires (resolveSchedule) ---')

// 1. Repli par défaut absolu
const defaultSchedule = resolveSchedule({})
assert.equal(defaultSchedule.start, '09:00')
assert.equal(defaultSchedule.end, '18:00')
assert.equal(defaultSchedule.isWorking, true)
assert.equal(defaultSchedule.isCustom, false)
assert.equal(defaultSchedule.source, 'default')

// 2. Repli vers les paramètres entreprise
const companySettings = { expected_arrival_time: '08:00:00', expected_departure_time: '17:00:00' }
const companySchedule = resolveSchedule({ companySettings })
assert.equal(companySchedule.start, '08:00')
assert.equal(companySchedule.end, '17:00')
assert.equal(companySchedule.source, 'company')

// 3. Repli vers l'horaire habituel du profil
const profile = {
  id: '018f4a2b-8a50-7000-8000-000000000001',
  expected_arrival_time: '08:30:00',
  expected_departure_time: '16:30:00',
  weekly_schedule: {
    '3': { is_working: true, start_time: '09:00', end_time: '13:00' }, // Mercredi spécifique
    '5': { is_working: false }, // Vendredi non travaillé
  },
}

// 3.a. Un jour sans configuration spécifique dans weekly_schedule (ex. Lundi = jour 1)
const mondaySchedule = resolveSchedule({ profile, dayOfWeek: 1, companySettings })
assert.equal(mondaySchedule.start, '08:30')
assert.equal(mondaySchedule.end, '16:30')
assert.equal(mondaySchedule.isWorking, true)
assert.equal(mondaySchedule.source, 'profile')

// 3.b. Un jour avec horaire spécifique dans weekly_schedule (ex. Mercredi = jour 3)
const wednesdaySchedule = resolveSchedule({ profile, dayOfWeek: 3, companySettings })
assert.equal(wednesdaySchedule.start, '09:00')
assert.equal(wednesdaySchedule.end, '13:00')
assert.equal(wednesdaySchedule.isWorking, true)
assert.equal(wednesdaySchedule.isCustom, true)
assert.equal(wednesdaySchedule.source, 'weekly_schedule')

// 3.c. Déduction du jour depuis une date textuelle (Mercredi 2026-10-07)
const wednesdayByDate = resolveSchedule({ profile, date: '2026-10-07', companySettings })
assert.equal(wednesdayByDate.start, '09:00')
assert.equal(wednesdayByDate.end, '13:00')
assert.equal(wednesdayByDate.source, 'weekly_schedule')

// 3.d. Un jour non travaillé dans weekly_schedule (ex. Vendredi = jour 5)
const fridaySchedule = resolveSchedule({ profile, dayOfWeek: 5, companySettings })
assert.equal(fridaySchedule.isWorking, false)
assert.equal(fridaySchedule.start, null)
assert.equal(fridaySchedule.end, null)
assert.equal(fridaySchedule.source, 'weekly_schedule')

// 4. Priorité absolue de la dérogation ponctuelle (availability du planning)
const availabilityOverride = {
  start_time: '10:00:00',
  end_time: '19:00:00',
}
const overrideSchedule = resolveSchedule({
  profile,
  dayOfWeek: 3,
  availability: availabilityOverride,
  companySettings,
})
assert.equal(overrideSchedule.start, '10:00')
assert.equal(overrideSchedule.end, '19:00')
assert.equal(overrideSchedule.isWorking, true)
assert.equal(overrideSchedule.isCustom, true)
assert.equal(overrideSchedule.source, 'slot')

console.log('✓ Tous les tests de résolution de la semaine type et de la cascade sont validés.')
