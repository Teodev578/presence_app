import Dexie from 'dexie'
import { shallowRef, watch, onScopeDispose } from 'vue'

/**
 * Base de données locale Dexie.js (IndexedDB)
 * Conforme aux directives Local-First (ADR 0001, ADR 0002)
 */
class PresenceDatabase extends Dexie {
  constructor() {
    super('presence_app_db')

    this.version(1).stores({
      teams: 'id, name, updated_at, deleted_at',
      profiles: 'id, team_id, email, role, updated_at, deleted_at',
      locations: 'id, is_active, updated_at, deleted_at',
      presences: 'id, user_id, work_date, client_mutation_id, status, updated_at, deleted_at',
      availabilities: 'id, user_id, week_start, day_of_week, client_mutation_id, updated_at, deleted_at',
      sync_outbox: '++_localId, id, client_mutation_id, table_name, record_id, operation, status, created_at',
    })

    this.version(2).stores({
      company_settings: 'id, updated_at, deleted_at',
    }).upgrade(async (tx) => {
      const existing = await tx.table('company_settings').get('00000000-0000-0000-0000-000000000001')
      if (!existing) {
        await tx.table('company_settings').add({
          id: '00000000-0000-0000-0000-000000000001',
          company_name: 'Mon Entreprise',
          expected_arrival_time: '09:00:00',
          expected_departure_time: '18:00:00',
          late_tolerance_minutes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        })
      }
    })

    this.version(3).stores({
      profiles: 'id, team_id, email, role, status, updated_at, deleted_at',
    }).upgrade(async (tx) => {
      // Rétrocompatibilité : assigner le statut 'active' par défaut aux profils locaux existants
      await tx.table('profiles').toCollection().modify((profile) => {
        if (!profile.status) {
          profile.status = 'active'
        }
      })
    })

    this.version(4).stores({
      absence_requests: 'id, user_id, week_start, status, client_mutation_id, updated_at, deleted_at',
    })

    this.version(5).stores({
      profiles: 'id, team_id, email, role, status, updated_at, deleted_at',
    }).upgrade(async (tx) => {
      // Découpage automatique de full_name pour rétrocompatibilité locale
      await tx.table('profiles').toCollection().modify((profile) => {
        if (profile.full_name && (!profile.first_name || !profile.last_name)) {
          const parts = (profile.full_name || '').trim().split(/\s+/)
          if (!profile.first_name) {
            profile.first_name = parts[0] || ''
          }
          if (!profile.last_name) {
            profile.last_name = parts.slice(1).join(' ') || ''
          }
        }
      })
    })

    this.version(6).stores({
      profiles: 'id, team_id, email, role, status, updated_at, deleted_at',
    }).upgrade(async (tx) => {
      await tx.table('profiles').toCollection().modify((profile) => {
        if (profile.weekly_schedule === undefined) {
          profile.weekly_schedule = null
        }
      })
    })
  }
}

export const COMPANY_SETTINGS_ID = '00000000-0000-0000-0000-000000000001'
export const DEFAULT_COMPANY_SETTINGS = Object.freeze({
  id: COMPANY_SETTINGS_ID,
  company_name: 'Mon Entreprise',
  expected_arrival_time: '09:00:00',
  expected_departure_time: '18:00:00',
  late_tolerance_minutes: 0,
})

// Instance unique singleton (Règle 03-local-first-and-dexie.md)
export const db = new PresenceDatabase()

let outboxListener = null

/**
 * Enregistre un écouteur déclenché à la fin de chaque transaction Dexie écrivant dans sync_outbox.
 */
export function setOutboxListener(fn) {
  outboxListener = fn
}

// Crochet réactif Dexie sur l'insertion dans la boîte d'envoi (Transactional Outbox Hook)
db.sync_outbox.hook('creating', function (primKey, obj, transaction) {
  if (transaction && typeof transaction.on === 'function') {
    transaction.on('complete', () => {
      if (typeof outboxListener === 'function') {
        outboxListener()
      }
    })
  }
})

/**
 * Composable réactif useLiveQuery natif pour Vue 3 fondé sur shallowRef
 * et onScopeDispose pour éviter toute dépendance tierce à RxJS.
 *
 * Dexie relance `liveQuery` sur écriture de table, pas sur changement de référence. Une plage de
 * dates ou un identifiant qui borne la requête doit donc être déclaré via `dependsOn` pour que la
 * souscription soit refaite quand la borne change.
 *
 * @param {Function} querier - Fonction asynchrone retournant une promesse Dexie
 * @param {any} initialValue - Valeur initiale réactive ; `null` convient pour distinguer
 *   l'absence de première émission d'un résultat vide
 * @param {Function|null} dependsOn - Getter réactif (chaîne ou valeur stable) dont le changement
 *   réabonne la requête
 * @returns {import('vue').ShallowRef}
 */
export function useLiveQuery(querier, initialValue = undefined, dependsOn = null) {
  const result = shallowRef(initialValue)
  let observableSub = null

  const cleanup = () => {
    if (observableSub && typeof observableSub.unsubscribe === 'function') {
      observableSub.unsubscribe()
      observableSub = null
    }
  }

  const subscribe = () => {
    cleanup()
    observableSub = Dexie.liveQuery(querier).subscribe({
      next: value => {
        result.value = value
      },
      error: err => {
        console.error('Erreur useLiveQuery Dexie :', err)
      },
    })
  }

  subscribe()

  if (typeof dependsOn === 'function') {
    const stop = watch(dependsOn, () => subscribe())
    onScopeDispose(stop)
  }

  // Nettoyage automatique au démontage du composant
  onScopeDispose(cleanup)

  return result
}
