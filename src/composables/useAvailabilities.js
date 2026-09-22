import { ref, computed } from 'vue'
import { db, useLiveQuery } from '../lib/db'
import { generateUUIDv7 } from '../lib/uuidv7'
import { useAuth } from './useAuth'
import { useSyncEngine } from './useSyncEngine'

/**
 * Calcule la date du lundi correspondant à une date donnée (ISO string YYYY-MM-DD).
 */
export function getMonday(d = new Date()) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // ajustement si dimanche (0)
  date.setDate(diff)
  return date.toISOString().slice(0, 10)
}

/**
 * Formate une date YYYY-MM-DD en libellé lisible (ex: "Semaine du 22 septembre").
 */
export function formatWeekLabel(weekStartStr) {
  if (!weekStartStr) return ''
  const date = new Date(weekStartStr)
  return `Semaine du ${date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`
}

export function useAvailabilities() {
  const { user } = useAuth()
  const { refreshPendingCount, syncNow } = useSyncEngine()

  const currentWeekStart = ref(getMonday())

  const nextWeek = () => {
    const d = new Date(currentWeekStart.value)
    d.setDate(d.getDate() + 7)
    currentWeekStart.value = d.toISOString().slice(0, 10)
  }

  const prevWeek = () => {
    const d = new Date(currentWeekStart.value)
    d.setDate(d.getDate() - 7)
    currentWeekStart.value = d.toISOString().slice(0, 10)
  }

  /**
   * Observe les disponibilités de la semaine sélectionnée pour l'utilisateur connecté.
   */
  const weekAvailabilities = useLiveQuery(async () => {
    if (!user.value?.id) return []
    const week = currentWeekStart.value
    return await db.availabilities
      .where('user_id')
      .equals(user.value.id)
      .filter((a) => a.week_start === week && !a.deleted_at)
      .toArray()
  }, [])

  /**
   * Indique si l'utilisateur a déjà effectué un enregistrement pour la semaine sélectionnée.
   */
  const hasConfiguredWeek = useLiveQuery(async () => {
    if (!user.value?.id) return false
    const week = currentWeekStart.value
    const count = await db.availabilities
      .where('user_id')
      .equals(user.value.id)
      .filter((a) => a.week_start === week)
      .count()
    return count > 0
  }, false)

  /**
   * Enregistre l'ensemble des jours cochés (1 à 5) et la note pour la semaine sélectionnée.
   * Transaction Dexie atomique pure avec gestion des ajouts et des tombstones.
   *
   * @param {Object} options
   * @param {string} options.weekStart - Date du lundi (YYYY-MM-DD)
   * @param {number[]} options.selectedDays - Tableau d'entiers [1..5] représentant les jours sélectionnés
   * @param {string} options.note - Commentaire libre optionnel
   */
  const saveWeekAvailabilities = async ({ weekStart, selectedDays, note = '' }) => {
    if (!user.value?.id) throw new Error('Utilisateur non authentifié.')

    const userId = user.value.id
    const nowIso = new Date().toISOString()

    // 1. Récupérer les déclarations locales existantes pour cette semaine
    const existing = await db.availabilities
      .where('user_id')
      .equals(userId)
      .filter((a) => a.week_start === weekStart)
      .toArray()

    const existingByDay = new Map()
    for (const item of existing) {
      existingByDay.set(item.day_of_week, item)
    }

    // 2. Préparation des opérations dans une transaction atomique Dexie
    await db.transaction('rw', db.availabilities, db.sync_outbox, async () => {
      // Jours ouvrés du lundi (1) au vendredi (5)
      for (let day = 1; day <= 5; day++) {
        const isSelected = selectedDays.includes(day)
        const currentRecord = existingByDay.get(day)

        if (isSelected) {
          if (!currentRecord || currentRecord.deleted_at) {
            // Création d'une nouvelle disponibilité
            const id = generateUUIDv7()
            const clientMutationId = generateUUIDv7()
            const newRecord = {
              id,
              user_id: userId,
              client_mutation_id: clientMutationId,
              week_start: weekStart,
              day_of_week: day,
              slot: 'full_day',
              note: note || null,
              declared_at: nowIso,
              created_at: nowIso,
              updated_at: nowIso,
              deleted_at: null,
            }

            await db.availabilities.put(newRecord)
            await db.sync_outbox.add({
              id: generateUUIDv7(),
              client_mutation_id: clientMutationId,
              table_name: 'availabilities',
              record_id: id,
              operation: 'INSERT',
              payload: newRecord,
              created_at: nowIso,
              attempts: 0,
              status: 'pending',
            })
          } else {
            // Mise à jour de la note si existant et actif
            if (currentRecord.note !== note) {
              const clientMutationId = generateUUIDv7()
              const updated = {
                ...currentRecord,
                note: note || null,
                updated_at: nowIso,
              }
              await db.availabilities.put(updated)
              await db.sync_outbox.add({
                id: generateUUIDv7(),
                client_mutation_id: clientMutationId,
                table_name: 'availabilities',
                record_id: currentRecord.id,
                operation: 'UPDATE',
                payload: updated,
                created_at: nowIso,
                attempts: 0,
                status: 'pending',
              })
            }
          }
        } else {
          // Jour non sélectionné : appliquer un tombstone si actif
          if (currentRecord && !currentRecord.deleted_at) {
            const clientMutationId = generateUUIDv7()
            const tombstoned = {
              ...currentRecord,
              deleted_at: nowIso,
              updated_at: nowIso,
            }
            await db.availabilities.put(tombstoned)
            await db.sync_outbox.add({
              id: generateUUIDv7(),
              client_mutation_id: clientMutationId,
              table_name: 'availabilities',
              record_id: currentRecord.id,
              operation: 'DELETE',
              payload: { deleted_at: nowIso },
              created_at: nowIso,
              attempts: 0,
              status: 'pending',
            })
          }
        }
      }
    })

    await refreshPendingCount()

    // Déclenchement de la synchronisation asynchrone si réseau présent
    if (navigator.onLine) {
      syncNow(userId)
    }
  }

  return {
    currentWeekStart,
    weekAvailabilities,
    hasConfiguredWeek,
    nextWeek,
    prevWeek,
    saveWeekAvailabilities,
  }
}
