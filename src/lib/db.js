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
  }
}

// Instance unique singleton (Règle 03-local-first-and-dexie.md)
export const db = new PresenceDatabase()

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
