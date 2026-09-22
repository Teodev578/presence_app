import { computed } from 'vue'
import { db, useLiveQuery } from '../lib/db'
import { generateUUIDv7 } from '../lib/uuidv7'
import { useAuth } from './useAuth'
import { useSyncEngine } from './useSyncEngine'

export function usePresences() {
  const { user } = useAuth()
  const { refreshPendingCount, syncNow } = useSyncEngine()

  const todayStr = new Date().toISOString().slice(0, 10)

  /**
   * Observe réactivement le pointage du jour de l'utilisateur connecté via useLiveQuery Dexie.
   */
  const todayPresence = useLiveQuery(async () => {
    if (!user.value?.id) return null
    const list = await db.presences
      .where('user_id')
      .equals(user.value.id)
      .filter((p) => p.work_date === todayStr && !p.deleted_at)
      .toArray()
    return list[0] || null
  }, null)

  /**
   * Enregistre un pointage d'arrivée (Check-In).
   * Transaction Dexie atomique pure (Règle 03 : aucune promesse externe).
   */
  const checkIn = async ({ locationId, coords, accuracy, expectedArrivalTime = '09:00:00' }) => {
    if (!user.value?.id) throw new Error('Utilisateur non authentifié.')

    const now = new Date()
    const checkInTime = now.toISOString()
    const id = generateUUIDv7()
    const clientMutationId = generateUUIDv7()

    // Évaluation du statut (présent à l'heure ou en retard)
    const [expHours, expMinutes] = expectedArrivalTime.split(':').map(Number)
    const limitDate = new Date(now)
    limitDate.setHours(expHours, expMinutes, 0, 0)
    const status = now > limitDate ? 'late' : 'present'

    const presenceData = {
      id,
      user_id: user.value.id,
      location_id: locationId,
      client_mutation_id: clientMutationId,
      work_date: todayStr,
      check_in_time: checkInTime,
      check_out_time: null,
      status,
      check_in_lat: coords.latitude,
      check_in_lng: coords.longitude,
      check_in_accuracy: accuracy || 10,
      check_out_lat: null,
      check_out_lng: null,
      check_out_accuracy: null,
      created_at: checkInTime,
      updated_at: checkInTime,
      deleted_at: null,
    }

    const outboxEntry = {
      id: generateUUIDv7(),
      client_mutation_id: clientMutationId,
      table_name: 'presences',
      record_id: id,
      operation: 'INSERT',
      payload: presenceData,
      created_at: checkInTime,
      attempts: 0,
      status: 'pending',
    }

    // Transaction atomique locale Dexie
    await db.transaction('rw', db.presences, db.sync_outbox, async () => {
      await db.presences.add(presenceData)
      await db.sync_outbox.add(outboxEntry)
    })

    await refreshPendingCount()

    // Tentative de synchronisation réseau asynchrone hors de la transaction
    if (navigator.onLine) {
      syncNow(user.value.id)
    }

    return presenceData
  }

  /**
   * Enregistre un pointage de départ (Check-Out).
   * Transaction Dexie atomique pure.
   */
  const checkOut = async ({ presenceId, coords, accuracy }) => {
    if (!user.value?.id) throw new Error('Utilisateur non authentifié.')

    const now = new Date()
    const checkOutTime = now.toISOString()
    const clientMutationId = generateUUIDv7()

    const updateFields = {
      check_out_time: checkOutTime,
      check_out_lat: coords.latitude,
      check_out_lng: coords.longitude,
      check_out_accuracy: accuracy || 10,
      status: 'completed',
      updated_at: checkOutTime,
    }

    const currentRecord = await db.presences.get(presenceId)
    if (!currentRecord) throw new Error('Enregistrement de présence introuvable.')

    const payload = {
      ...currentRecord,
      ...updateFields,
    }

    const outboxEntry = {
      id: generateUUIDv7(),
      client_mutation_id: clientMutationId,
      table_name: 'presences',
      record_id: presenceId,
      operation: 'UPDATE',
      payload,
      created_at: checkOutTime,
      attempts: 0,
      status: 'pending',
    }

    // Transaction atomique locale Dexie
    await db.transaction('rw', db.presences, db.sync_outbox, async () => {
      await db.presences.update(presenceId, updateFields)
      await db.sync_outbox.add(outboxEntry)
    })

    await refreshPendingCount()

    if (navigator.onLine) {
      syncNow(user.value.id)
    }

    return payload
  }

  return {
    todayPresence,
    todayStr,
    checkIn,
    checkOut,
  }
}
