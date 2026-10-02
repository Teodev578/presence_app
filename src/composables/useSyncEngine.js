import { ref } from 'vue'
import { db, setOutboxListener } from '../lib/db'
import { supabase } from '../lib/supabase'

const isSyncing = ref(false)
const pendingCount = ref(0)
const lastSyncTime = ref(localStorage.getItem('last_sync_time') || null)

let syncInterval = null
let realtimeChannel = null
let currentUserIdGetter = null
let pushDebounceTimer = null
let pullDebounceTimer = null
let watcherStarted = false

/**
 * Encadre une tâche critique avec la Web Locks API pour éviter les conflits
 * d'accès concurrents entre plusieurs onglets ouverts en parallèle.
 */
const withSyncLock = async (taskName, task) => {
  if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
    try {
      return await navigator.locks.request(taskName, task)
    } catch (err) {
      console.warn(`[WebLocks] Repli direct pour ${taskName} :`, err)
      return await task()
    }
  }
  return await task()
}

/**
 * Sollicite l'enregistrement d'une tâche auprès de la Background Sync API du Service Worker.
 * Garantit la reprise d'envoi en arrière-plan en cas de coupure ou fermeture impromptue.
 */
const requestBackgroundSync = async () => {
  if (typeof window === 'undefined') return
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready
      if (reg && reg.sync && typeof reg.sync.register === 'function') {
        await reg.sync.register('presence-outbox-sync')
      }
    } catch {
      // Tolérance gracieuse si non supporté ou refusé
    }
  }
}

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
   * Cycle de synchronisation montante (Push) : dépile sync_outbox avec verrouillage Web Locks.
   */
  const pushOutbox = async () => {
    if (!navigator.onLine) return

    await withSyncLock('presence_push_lock', async () => {
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
            // Enregistre un ordre de synchronisation d'arrière-plan
            requestBackgroundSync()
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
    })
  }

  /**
   * Cycle de synchronisation descendante (Pull incrémental) :
   * Rapatrie les modifications distantes depuis lastSyncTime avec verrouillage Web Locks.
   *
   * Le périmètre suit le rôle lu dans le profil local : un employé ne rapatrie que ses propres
   * lignes, un gestionnaire ou un admin s'en remet à la RLS pour son équipe ou son organisation.
   * Un profil local absent est traité comme un employé, donc en repli restrictif.
   */
  const pullChanges = async (userId) => {
    if (!navigator.onLine || !userId) return

    await withSyncLock('presence_pull_lock', async () => {
      const cursor = lastSyncTime.value || '1970-01-01T00:00:00Z'
      const newCursor = new Date().toISOString()

      let isSupervisor = false
      try {
        const localProfile = await db.profiles.get(userId)
        isSupervisor = localProfile?.role === 'manager' || localProfile?.role === 'admin'
      } catch (err) {
        console.warn('Erreur lecture du rôle local :', err)
      }

      try {
        // 1. Pull des présences
        let presenceQuery = supabase.from('presences').select('*').gt('updated_at', cursor)
        if (!isSupervisor) presenceQuery = presenceQuery.eq('user_id', userId)
        const { data: presences, error: presErr } = await presenceQuery

        if (!presErr && presences?.length) {
          await db.presences.bulkPut(presences)
        }

        // 2. Pull des disponibilités
        let availabilityQuery = supabase.from('availabilities').select('*').gt('updated_at', cursor)
        if (!isSupervisor) availabilityQuery = availabilityQuery.eq('user_id', userId)
        const { data: avails, error: avErr } = await availabilityQuery

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

        // 4. Pull des profils et des équipes : sans eux, toute jointure locale rend un nom vide
        const { data: profs, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .gt('updated_at', cursor)

        if (!profErr && profs?.length) {
          await db.profiles.bulkPut(profs)
        }

        const { data: teams, error: teamErr } = await supabase
          .from('teams')
          .select('*')
          .gt('updated_at', cursor)

        if (!teamErr && teams?.length) {
          await db.teams.bulkPut(teams)
        }

        // 5. Pull des paramètres d'organisation (company_settings)
        const { data: settings, error: settingsErr } = await supabase
          .from('company_settings')
          .select('*')
          .gt('updated_at', cursor)

        if (!settingsErr && settings?.length) {
          await db.company_settings.bulkPut(settings)
        }

        lastSyncTime.value = newCursor
        localStorage.setItem('last_sync_time', newCursor)
      } catch (err) {
        console.warn('Erreur pull incrémental :', err)
      }
    })
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
   * Déclenche un pull incrémental avec détection et regroupement anti-rebond.
   */
  const scheduleRealtimePull = (userId) => {
    if (pullDebounceTimer) clearTimeout(pullDebounceTimer)
    pullDebounceTimer = setTimeout(() => {
      if (navigator.onLine) {
        syncNow(userId)
      }
    }, 100)
  }

  /**
   * Initialise l'abonnement réactif Supabase Realtime (CDC WebSocket).
   */
  const initRealtimeSubscription = (getUserId) => {
    if (realtimeChannel || typeof window === 'undefined') return

    try {
      realtimeChannel = supabase
        .channel('presence-cdc-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'presences' }, () => {
          const uid = typeof getUserId === 'function' ? getUserId() : null
          scheduleRealtimePull(uid)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'availabilities' }, () => {
          const uid = typeof getUserId === 'function' ? getUserId() : null
          scheduleRealtimePull(uid)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () => {
          const uid = typeof getUserId === 'function' ? getUserId() : null
          scheduleRealtimePull(uid)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          const uid = typeof getUserId === 'function' ? getUserId() : null
          scheduleRealtimePull(uid)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
          const uid = typeof getUserId === 'function' ? getUserId() : null
          scheduleRealtimePull(uid)
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Rattrapage immédiat des changements survenus pendant la déconnexion
            const uid = typeof getUserId === 'function' ? getUserId() : null
            scheduleRealtimePull(uid)
          }
        })
    } catch (err) {
      console.warn('[Realtime] Erreur initialisation du canal Supabase :', err)
    }
  }

  /**
   * Initialise les écouteurs d'événements réseau, la réactivité WebSocket,
   * les hooks Dexie et le filet de sécurité périodique.
   */
  const startSyncWatcher = (getUserId) => {
    currentUserIdGetter = getUserId
    if (watcherStarted) return
    watcherStarted = true

    refreshPendingCount()

    // 1. Branchement du crochet Dexie pour vidange automatique de l'outbox
    setOutboxListener(() => {
      refreshPendingCount()
      requestBackgroundSync()
      if (pushDebounceTimer) clearTimeout(pushDebounceTimer)
      pushDebounceTimer = setTimeout(() => {
        if (navigator.onLine) {
          const uid = typeof currentUserIdGetter === 'function' ? currentUserIdGetter() : null
          syncNow(uid)
        }
      }, 50)
    })

    const onOnline = () => {
      const uid = typeof getUserId === 'function' ? getUserId() : null
      syncNow(uid)
    }

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const uid = typeof getUserId === 'function' ? getUserId() : null
        syncNow(uid)
      }
    }

    window.addEventListener('online', onOnline)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }

    // 2. Enregistrement du Service Worker PWA pour Background Sync (Option 2)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'TRIGGER_SYNC') {
          const uid = typeof currentUserIdGetter === 'function' ? currentUserIdGetter() : null
          syncNow(uid)
        }
      })
    }

    // 3. Initialisation du canal réactif Supabase Realtime (Option 1)
    initRealtimeSubscription(getUserId)

    // 4. Filet de sécurité à basse fréquence (2 minutes) au lieu du polling agressif à 30 secondes
    syncInterval = setInterval(() => {
      const uid = typeof getUserId === 'function' ? getUserId() : null
      syncNow(uid)
    }, 120000)

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
