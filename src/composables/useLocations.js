import { db, useLiveQuery } from '../lib/db'
import { generateUUIDv7 } from '../lib/uuidv7'
import { useAuth } from './useAuth'
import { useSyncEngine } from './useSyncEngine'
import { supabase } from '../lib/supabase'

export function useLocations() {
  const { user } = useAuth()
  const { refreshPendingCount, syncNow } = useSyncEngine()

  /**
   * Observe réactivement la liste de tous les sites non supprimés via useLiveQuery Dexie.
   * Triés par nom.
   */
  const locations = useLiveQuery(async () => {
    const list = await db.locations
      .filter((loc) => !loc.deleted_at)
      .toArray()
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [])

  /**
   * Initialise ou synchronise les sites depuis Supabase si la table locale est vide.
   */
  const ensureLoaded = async () => {
    try {
      const count = await db.locations.count()
      if (count === 0 && navigator.onLine) {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .order('name')
        if (!error && data?.length) {
          await db.locations.bulkPut(data)
        }
      }
    } catch (err) {
      console.warn('Erreur initialisation locale des sites :', err)
    }
  }

  /**
   * Crée un nouveau site de référence.
   * Transaction atomique locale Dexie + empilement dans la sync_outbox.
   */
  const createLocation = async ({ name, latitude, longitude, radius_meters = 50, is_active = true }) => {
    if (!name || name.trim() === '') {
      throw new Error('Le nom du site est obligatoire.')
    }
    if (latitude === null || latitude === undefined || isNaN(Number(latitude))) {
      throw new Error('La latitude est invalide.')
    }
    if (longitude === null || longitude === undefined || isNaN(Number(longitude))) {
      throw new Error('La longitude est invalide.')
    }

    const now = new Date().toISOString()
    const id = generateUUIDv7()
    const clientMutationId = generateUUIDv7()

    const locationData = {
      id,
      name: name.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius_meters: Math.max(10, Number(radius_meters) || 50),
      is_active: Boolean(is_active),
      created_at: now,
      updated_at: now,
      deleted_at: null,
    }

    const outboxEntry = {
      id: generateUUIDv7(),
      client_mutation_id: clientMutationId,
      table_name: 'locations',
      record_id: id,
      operation: 'INSERT',
      payload: locationData,
      created_at: now,
      attempts: 0,
      status: 'pending',
    }

    await db.transaction('rw', db.locations, db.sync_outbox, async () => {
      await db.locations.add(locationData)
      await db.sync_outbox.add(outboxEntry)
    })

    await refreshPendingCount()

    if (navigator.onLine && user.value?.id) {
      syncNow(user.value.id)
    }

    return locationData
  }

  /**
   * Met à jour un site existant.
   * Transaction atomique locale Dexie + outbox.
   */
  const updateLocation = async (id, updates) => {
    const existing = await db.locations.get(id)
    if (!existing) {
      throw new Error('Site introuvable.')
    }

    const now = new Date().toISOString()
    const clientMutationId = generateUUIDv7()

    const updatedData = {
      ...existing,
      ...updates,
      name: updates.name !== undefined ? updates.name.trim() : existing.name,
      latitude: updates.latitude !== undefined ? Number(updates.latitude) : existing.latitude,
      longitude: updates.longitude !== undefined ? Number(updates.longitude) : existing.longitude,
      radius_meters: updates.radius_meters !== undefined ? Math.max(10, Number(updates.radius_meters)) : existing.radius_meters,
      is_active: updates.is_active !== undefined ? Boolean(updates.is_active) : existing.is_active,
      updated_at: now,
    }

    const outboxEntry = {
      id: generateUUIDv7(),
      client_mutation_id: clientMutationId,
      table_name: 'locations',
      record_id: id,
      operation: 'UPDATE',
      payload: updatedData,
      created_at: now,
      attempts: 0,
      status: 'pending',
    }

    await db.transaction('rw', db.locations, db.sync_outbox, async () => {
      await db.locations.put(updatedData)
      await db.sync_outbox.add(outboxEntry)
    })

    await refreshPendingCount()

    if (navigator.onLine && user.value?.id) {
      syncNow(user.value.id)
    }

    return updatedData
  }

  /**
   * Supprime un site (soft-delete avec deleted_at).
   * Transaction atomique locale Dexie + outbox.
   */
  const deleteLocation = async (id) => {
    const existing = await db.locations.get(id)
    if (!existing) return

    const now = new Date().toISOString()
    const clientMutationId = generateUUIDv7()

    const softDeletedData = {
      ...existing,
      deleted_at: now,
      updated_at: now,
    }

    const outboxEntry = {
      id: generateUUIDv7(),
      client_mutation_id: clientMutationId,
      table_name: 'locations',
      record_id: id,
      operation: 'DELETE',
      payload: { deleted_at: now },
      created_at: now,
      attempts: 0,
      status: 'pending',
    }

    await db.transaction('rw', db.locations, db.sync_outbox, async () => {
      await db.locations.put(softDeletedData)
      await db.sync_outbox.add(outboxEntry)
    })

    await refreshPendingCount()

    if (navigator.onLine && user.value?.id) {
      syncNow(user.value.id)
    }
  }

  return {
    locations,
    ensureLoaded,
    createLocation,
    updateLocation,
    deleteLocation,
  }
}
