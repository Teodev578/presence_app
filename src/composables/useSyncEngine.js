import { ref } from 'vue'
import { db } from '../lib/db'
import { supabase } from '../lib/supabase'

const isSyncing = ref(false)
const pendingCount = ref(0)
const lastSyncTime = ref(localStorage.getItem('last_sync_time') || null)

let syncInterval = null

export function useSyncEngine() {
  /**
   * Met à jour le compteur d'éléments en attente dans la boîte d'envoi.
   */
  const refreshPendingCount = async () => {
    try {
      const count = await db.sync_outbox.where('status').equals('pending').count()
      pendingCount.value = count
    } catch (e) {
      console.warn('Erreur comptage outbox :', e)
    }
  }

  /**
   * Traitement d'une entrée unique de l'outbox avec garantie d'idempotence.
   */
  const processOutboxItem = async (item) => {
    const { table_name, operation, payload, record_id } = item

    if (operation === 'INSERT' || operation === 'UPDATE') {
      // Upsert déterministe s'appuyant sur l'id (UUIDv7) et le client_mutation_id
      const { error } = await supabase.from(table_name).upsert(payload, {
        onConflict: 'id',
      })
      if (error) throw error
    } else if (operation === 'DELETE') {
      // Propagation du tombstone
      const { error } = await supabase
        .from(table_name)
        .update({ deleted_at: payload?.deleted_at || new Date().toISOString() })
        .eq('id', record_id)
      if (error) throw error
    }
  }

  /**
   * Cycle de synchronisation montante (Push) : dépile sync_outbox.
   */
  const pushOutbox = async () => {
    if (!navigator.onLine) return
    const pendingItems = await db.sync_outbox
      .where('status')
      .equals('pending')
      .sortBy('created_at')

    if (!pendingItems.length) return

    for (const item of pendingItems) {
      try {
        await db.sync_outbox.update(item._localId, { status: 'syncing' })
        await processOutboxItem(item)
        // Succès confirmé par Supabase : purge de l'entrée outbox
        await db.sync_outbox.delete(item._localId)
      } catch (err) {
        console.error(`Échec synchronisation mutation [${item.client_mutation_id}] :`, err)
        const isNetworkError = !navigator.onLine || err.message?.includes('network') || err.status >= 500

        if (isNetworkError) {
          await db.sync_outbox.update(item._localId, {
            status: 'pending',
            attempts: (item.attempts || 0) + 1,
          })
          break // Interrompt la file pour respecter l'ordre séquentiel
        } else {
          // Erreur permanente (4xx, RLS, rejet de schéma) -> bascule en 'failed'
          await db.sync_outbox.update(item._localId, {
            status: 'failed',
            attempts: (item.attempts || 0) + 1,
            last_error: err.message,
          })
        }
      }
    }

    await refreshPendingCount()
  }

  /**
   * Cycle de synchronisation descendante (Pull incrémental) :
   * Rapatrie les modifications distantes depuis lastSyncTime.
   */
  const pullChanges = async (userId) => {
    if (!navigator.onLine || !userId) return

    const cursor = lastSyncTime.value || '1970-01-01T00:00:00Z'
    const newCursor = new Date().toISOString()

    try {
      // 1. Pull des présences
      const { data: presences, error: presErr } = await supabase
        .from('presences')
        .select('*')
        .eq('user_id', userId)
        .gt('updated_at', cursor)

      if (!presErr && presences?.length) {
        await db.presences.bulkPut(presences)
      }

      // 2. Pull des disponibilités
      const { data: avails, error: avErr } = await supabase
        .from('availabilities')
        .select('*')
        .eq('user_id', userId)
        .gt('updated_at', cursor)

      if (!avErr && avails?.length) {
        await db.availabilities.bulkPut(avails)
      }

      // 3. Pull des sites (locations)
      const { data: locs, error: locErr } = await supabase
        .from('locations')
        .select('*')
        .gt('updated_at', cursor)

      if (!locErr && locs?.length) {
        await db.locations.bulkPut(locs)
      }

      lastSyncTime.value = newCursor
      localStorage.setItem('last_sync_time', newCursor)
    } catch (err) {
      console.warn('Erreur pull incrémental :', err)
    }
  }

  /**
   * Exécute un cycle complet de synchronisation.
   */
  const syncNow = async (userId) => {
    if (isSyncing.value || !navigator.onLine) return
    isSyncing.value = true

    try {
      await pushOutbox()
      if (userId) {
        await pullChanges(userId)
      }
    } finally {
      isSyncing.value = false
      await refreshPendingCount()
    }
  }

  /**
   * Initialise les écouteurs d'événements réseau et l'intervalle régulier.
   */
  const startSyncWatcher = (getUserId) => {
    if (syncInterval) return

    refreshPendingCount()

    const onOnline = () => {
      const uid = typeof getUserId === 'function' ? getUserId() : null
      syncNow(uid)
    }

    window.addEventListener('online', onOnline)

    // Surveillance périodique toutes les 30 secondes
    syncInterval = setInterval(() => {
      const uid = typeof getUserId === 'function' ? getUserId() : null
      syncNow(uid)
    }, 30000)

    // Premier déclenchement immédiat
    onOnline()
  }

  return {
    isSyncing,
    pendingCount,
    lastSyncTime,
    refreshPendingCount,
    syncNow,
    startSyncWatcher,
  }
}
