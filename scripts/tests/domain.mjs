import assert from 'node:assert/strict'
import {
  PRESENCE_STATUSES,
  AVAILABILITY_SLOTS,
  createPresenceRecord,
  validatePresence,
  createAvailabilityRecord,
  validateAvailability,
  createOutboxEntry,
} from '../../src/lib/domain.js'

console.log('--- Test du module de domaine PresenceApp ---')

// 1. Test fabrique et validation de Presence
const presence = createPresenceRecord({
  userId: '018f4a2b-8a50-7000-8000-000000000001',
  locationId: '018f4a2b-8a50-7000-8000-000000000002',
  coords: { latitude: 48.8566, longitude: 2.3522 },
  accuracy: 8,
  expectedArrivalTime: '09:00:00',
  now: new Date('2026-09-30T08:45:00Z'),
})

assert.equal(presence.status, 'present')
assert.ok(presence.id)
assert.ok(presence.client_mutation_id)
assert.equal(presence.work_date, '2026-09-30')

const presenceCheck = validatePresence(presence)
assert.equal(presenceCheck.valid, true, 'La présence générée doit être valide')
assert.equal(presenceCheck.errors.length, 0)

// Test détection retard
const latePresence = createPresenceRecord({
  userId: '018f4a2b-8a50-7000-8000-000000000001',
  locationId: '018f4a2b-8a50-7000-8000-000000000002',
  coords: { latitude: 48.8566, longitude: 2.3522 },
  accuracy: 12,
  expectedArrivalTime: '09:00:00',
  now: new Date('2026-09-30T09:15:00Z'),
})
assert.equal(latePresence.status, 'late', 'Une arrivée après 09:00 doit être marquée late')

// 2. Test fabrique et validation de Disponibilité
const avail = createAvailabilityRecord({
  userId: '018f4a2b-8a50-7000-8000-000000000001',
  weekStart: '2026-09-28',
  dayOfWeek: 1,
  slot: 'morning',
  note: 'Disponible le matin uniquement',
})

assert.ok(avail.id)
assert.equal(avail.slot, 'morning')
const availCheck = validateAvailability(avail)
assert.equal(availCheck.valid, true, 'La disponibilité générée doit être valide')

// 3. Test outbox entry
const outbox = createOutboxEntry({
  tableName: 'presences',
  recordId: presence.id,
  operation: 'INSERT',
  payload: presence,
})

assert.equal(outbox.status, 'pending')
assert.equal(outbox.table_name, 'presences')
assert.equal(outbox.record_id, presence.id)
assert.equal(outbox.client_mutation_id, presence.client_mutation_id)

console.log('✓ Tous les tests de domaine et de fabrique ont réussi.')
