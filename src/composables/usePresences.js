import { computed } from 'vue'
import { db, useLiveQuery } from '../lib/db'
import { generateUUIDv7 } from '../lib/uuidv7'
import { getLocalDateString, getMonday } from '../lib/dateUtils'
import { useAuth } from './useAuth'
import { useSyncEngine } from './useSyncEngine'

export function usePresences() {
  const { user } = useAuth()
  const { refreshPendingCount, syncNow } = useSyncEngine()

  /**
   * Observe réactivement le pointage du jour de l'utilisateur connecté via useLiveQuery Dexie.
   * Utilise la date calendaire locale de l'appareil (sans décalage de fuseau UTC).
   */
  const todayPresence = useLiveQuery(async () => {
    if (!user.value?.id) return null
    const todayStr = getLocalDateString()
    const list = await db.presences
      .where('user_id')
      .equals(user.value.id)
      .filter((p) => p.work_date === todayStr && !p.deleted_at)
      .toArray()
    return list[0] || null
  }, null)

  /**
   * Observe les 5 derniers pointages de l'utilisateur connecté via useLiveQuery Dexie.
   */
  const recentPresences = useLiveQuery(async () => {
    if (!user.value?.id) return []
    const list = await db.presences
      .where('user_id')
      .equals(user.value.id)
      .filter((p) => !p.deleted_at)
      .toArray()
    list.sort((a, b) => (b.work_date || '').localeCompare(a.work_date || ''))
    return list.slice(0, 5)
  }, [])

  /**
   * Observe les pointages de la semaine courante (depuis le lundi).
   */
  const weekPresences = useLiveQuery(async () => {
    if (!user.value?.id) return []
    const mondayStr = getMonday()
    const list = await db.presences
      .where('user_id')
      .equals(user.value.id)
      .filter((p) => !p.deleted_at && p.work_date >= mondayStr)
      .toArray()
    return list
  }, [])

  /**
   * Calcule le total cumulé des minutes travaillées cette semaine.
   */
  const weekTotalMinutes = computed(() => {
    if (!weekPresences.value || !weekPresences.value.length) return 0
    let total = 0
    for (const p of weekPresences.value) {
      if (p.check_in_time && p.check_out_time) {
        const start = new Date(p.check_in_time).getTime()
        const end = new Date(p.check_out_time).getTime()
        if (!isNaN(start) && !isNaN(end) && end > start) {
          total += Math.floor((end - start) / 60000)
        }
      } else if (p.check_in_time && !p.check_out_time) {
        const start = new Date(p.check_in_time).getTime()
        const now = Date.now()
        if (!isNaN(start) && now > start) {
          total += Math.floor((now - start) / 60000)
        }
      }
    }
    return total
  })

  /**
   * Enregistre un pointage d'arrivée (Check-In).
   * Transaction Dexie atomique pure (Règle 03 : aucune promesse externe).
   */
  const checkIn = async ({ locationId, coords, accuracy, expectedArrivalTime = '09:00:00' }) => {
    if (!user.value?.id) throw new Error('Utilisateur non authentifié.')

    const now = new Date()
    const checkInTime = now.toISOString()
    const todayStr = getLocalDateString(now)
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
   * Transaction Dexie atomique pure avec préservation de l'historique de retard.
   */
  const checkOut = async ({ presenceId, coords, accuracy }) => {
    if (!user.value?.id) throw new Error('Utilisateur non authentifié.')

    const now = new Date()
    const checkOutTime = now.toISOString()
    const clientMutationId = generateUUIDv7()

    const currentRecord = await db.presences.get(presenceId)
    if (!currentRecord) throw new Error('Enregistrement de présence introuvable.')

    // Robustesse de l'audit trail : si l'employé était arrivé en retard, on conserve la trace avec 'completed_late'
    const finalStatus = currentRecord.status === 'late' ? 'completed_late' : 'completed'

    const updateFields = {
      check_out_time: checkOutTime,
      check_out_lat: coords.latitude,
      check_out_lng: coords.longitude,
      check_out_accuracy: accuracy || 10,
      status: finalStatus,
      updated_at: checkOutTime,
    }

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
    recentPresences,
    weekPresences,
    weekTotalMinutes,
    checkIn,
    checkOut,
  }
}
