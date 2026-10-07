import { ref } from 'vue'
import { db, useLiveQuery } from '../../lib/db'
import { generateUUIDv7 } from '../../lib/uuidv7'
import { useAuth } from '../auth/useAuth'
import { useSyncEngine } from '../infra/useSyncEngine'

export function useAbsenceRequests(weekStartRef = null) {
  const { user } = useAuth()
  const { refreshPendingCount, syncNow } = useSyncEngine()

  /**
   * Observe la demande d'absence de la semaine affichée pour l'utilisateur connecté.
   * Réactive automatiquement aux changements de semaine grâce au hook dependsOn.
   */
  const currentWeekRequest = useLiveQuery(async () => {
    if (!user.value?.id || !weekStartRef?.value) return null
    const week = weekStartRef.value
    const requests = await db.absence_requests
      .where('user_id')
      .equals(user.value.id)
      .filter((r) => r.week_start === week && !r.deleted_at && r.status !== 'cancelled')
      .toArray()

    // En cas de plusieurs demandes résiduelles, prendre la plus récente
    if (!requests.length) return null
    return requests.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0]
  }, null, () => `${user.value?.id || ''}|${weekStartRef?.value || ''}`)

  /**
   * Demandes d'absence en attente d'arbitrage pour les gestionnaires et administrateurs.
   */
  const pendingRequests = useLiveQuery(async () => {
    return await db.absence_requests
      .where('status')
      .equals('submitted')
      .filter((r) => !r.deleted_at)
      .reverse()
      .sortBy('created_at')
  }, [])

  /**
   * Toutes les demandes de la semaine affichée pour les gestionnaires.
   */
  const weekAbsenceRequests = useLiveQuery(async () => {
    if (!weekStartRef?.value) return []
    const week = weekStartRef.value
    return await db.absence_requests
      .where('week_start')
      .equals(week)
      .filter((r) => !r.deleted_at)
      .toArray()
  }, [], () => weekStartRef?.value || '')

  /**
   * Soumet une nouvelle demande d'absence pour une semaine donnée.
   *
   * @param {Object} params
   * @param {string} params.weekStart - Lundi de la semaine (YYYY-MM-DD)
   * @param {number[]} params.days - Jours demandés [1..5]
   * @param {string} [params.note] - Note explicative
   */
  const submitRequest = async ({ weekStart, days, note = '' }) => {
    if (!user.value?.id) throw new Error('Utilisateur non authentifié.')
    if (!days || !days.length) throw new Error('Sélectionnez au moins un jour.')
    if (!note || !note.trim()) throw new Error('Indiquez le motif de votre absence.')

    const userId = user.value.id
    const nowIso = new Date().toISOString()
    const id = generateUUIDv7()
    const clientMutationId = generateUUIDv7()

    const newRequest = {
      id,
      user_id: userId,
      client_mutation_id: clientMutationId,
      week_start: weekStart,
      days: [...days].sort((a, b) => a - b),
      note: note.trim() || null,
      status: 'submitted',
      decided_by: null,
      decided_at: null,
      decision_note: null,
      created_at: nowIso,
      updated_at: nowIso,
      deleted_at: null,
    }

    await db.transaction('rw', db.absence_requests, db.sync_outbox, async () => {
      // Annule localement les éventuelles demandes précédentes non traitées pour la même semaine
      const existing = await db.absence_requests
        .where('user_id')
        .equals(userId)
        .filter((r) => r.week_start === weekStart && !r.deleted_at && r.status === 'submitted')
        .toArray()

      for (const req of existing) {
        const cancelMutationId = generateUUIDv7()
        const cancelledRecord = {
          ...req,
          status: 'cancelled',
          updated_at: nowIso,
        }
        await db.absence_requests.put(cancelledRecord)
        await db.sync_outbox.add({
          id: generateUUIDv7(),
          client_mutation_id: cancelMutationId,
          table_name: 'absence_requests',
          record_id: req.id,
          operation: 'UPDATE',
          payload: cancelledRecord,
          created_at: nowIso,
          attempts: 0,
          status: 'pending',
        })
      }

      await db.absence_requests.put(newRequest)
      await db.sync_outbox.add({
        id: generateUUIDv7(),
        client_mutation_id: clientMutationId,
        table_name: 'absence_requests',
        record_id: id,
        operation: 'INSERT',
        payload: newRequest,
        created_at: nowIso,
        attempts: 0,
        status: 'pending',
      })
    })

    await refreshPendingCount()
    if (navigator.onLine) {
      syncNow(userId)
    }
    return newRequest
  }

  /**
   * Annule une demande d'absence existante.
   *
   * @param {string} requestId
   */
  const cancelRequest = async (requestId) => {
    if (!user.value?.id) throw new Error('Utilisateur non authentifié.')
    const existing = await db.absence_requests.get(requestId)
    if (!existing) throw new Error('Demande introuvable.')

    const nowIso = new Date().toISOString()
    const clientMutationId = generateUUIDv7()
    const updated = {
      ...existing,
      status: 'cancelled',
      updated_at: nowIso,
    }

    await db.transaction('rw', db.absence_requests, db.sync_outbox, async () => {
      await db.absence_requests.put(updated)
      await db.sync_outbox.add({
        id: generateUUIDv7(),
        client_mutation_id: clientMutationId,
        table_name: 'absence_requests',
        record_id: requestId,
        operation: 'UPDATE',
        payload: updated,
        created_at: nowIso,
        attempts: 0,
        status: 'pending',
      })
    })

    await refreshPendingCount()
    if (navigator.onLine) {
      syncNow(user.value.id)
    }
    return updated
  }

  /**
   * Valide une demande d'absence (action gestionnaire/administrateur).
   *
   * @param {Object} params
   * @param {string} params.requestId
   * @param {string} [params.decisionNote]
   */
  const validateRequest = async ({ requestId, decisionNote = '' }) => {
    if (!user.value?.id) throw new Error('Utilisateur non authentifié.')
    const existing = await db.absence_requests.get(requestId)
    if (!existing) throw new Error('Demande introuvable.')

    const nowIso = new Date().toISOString()
    const clientMutationId = generateUUIDv7()
    const updated = {
      ...existing,
      status: 'validated',
      decided_by: user.value.id,
      decided_at: nowIso,
      decision_note: decisionNote.trim() || null,
      updated_at: nowIso,
    }

    await db.transaction('rw', db.absence_requests, db.sync_outbox, async () => {
      await db.absence_requests.put(updated)
      await db.sync_outbox.add({
        id: generateUUIDv7(),
        client_mutation_id: clientMutationId,
        table_name: 'absence_requests',
        record_id: requestId,
        operation: 'UPDATE',
        payload: updated,
        created_at: nowIso,
        attempts: 0,
        status: 'pending',
      })
    })

    await refreshPendingCount()
    if (navigator.onLine) {
      syncNow(user.value.id)
    }
    return updated
  }

  /**
   * Refuse une demande d'absence (action gestionnaire/administrateur).
   *
   * @param {Object} params
   * @param {string} params.requestId
   * @param {string} [params.decisionNote]
   */
  const refuseRequest = async ({ requestId, decisionNote = '' }) => {
    if (!user.value?.id) throw new Error('Utilisateur non authentifié.')
    const existing = await db.absence_requests.get(requestId)
    if (!existing) throw new Error('Demande introuvable.')

    const nowIso = new Date().toISOString()
    const clientMutationId = generateUUIDv7()
    const updated = {
      ...existing,
      status: 'refused',
      decided_by: user.value.id,
      decided_at: nowIso,
      decision_note: decisionNote.trim() || null,
      updated_at: nowIso,
    }

    await db.transaction('rw', db.absence_requests, db.sync_outbox, async () => {
      await db.absence_requests.put(updated)
      await db.sync_outbox.add({
        id: generateUUIDv7(),
        client_mutation_id: clientMutationId,
        table_name: 'absence_requests',
        record_id: requestId,
        operation: 'UPDATE',
        payload: updated,
        created_at: nowIso,
        attempts: 0,
        status: 'pending',
      })
    })

    await refreshPendingCount()
    if (navigator.onLine) {
      syncNow(user.value.id)
    }
    return updated
  }

  return {
    currentWeekRequest,
    pendingRequests,
    weekAbsenceRequests,
    submitRequest,
    cancelRequest,
    validateRequest,
    refuseRequest,
  }
}
