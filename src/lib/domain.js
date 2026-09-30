import { generateUUIDv7 } from './uuidv7.js'
import { getLocalDateString } from './dateUtils.js'

/**
 * Constantes de domaine alignées sur les contraintes CHECK de PostgreSQL
 */
export const PRESENCE_STATUSES = Object.freeze(['present', 'late', 'completed'])
export const AVAILABILITY_SLOTS = Object.freeze(['full_day', 'morning', 'afternoon'])
export const USER_ROLES = Object.freeze(['employee', 'manager', 'admin'])

/**
 * Valide l'intégrité structurelle d'un enregistrement de pointage (Presence).
 * @param {Object} presence
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePresence(presence) {
  const errors = []

  if (!presence || typeof presence !== 'object') {
    return { valid: false, errors: ['Enregistrement de présence invalide (non-objet).'] }
  }

  if (!presence.id) errors.push('Identifiant (id) requis.')
  if (!presence.user_id) errors.push('Identifiant utilisateur (user_id) requis.')
  if (!presence.location_id) errors.push('Identifiant de site (location_id) requis.')
  if (!presence.client_mutation_id) errors.push('client_mutation_id requis pour l’idempotence.')
  if (!presence.work_date || !/^\d{4}-\d{2}-\d{2}$/.test(presence.work_date)) {
    errors.push('Date de travail (work_date) invalide (format YYYY-MM-DD attendu).')
  }
  if (!presence.check_in_time || isNaN(Date.parse(presence.check_in_time))) {
    errors.push('Horodatage d’arrivée (check_in_time) ISO invalide.')
  }
  if (!PRESENCE_STATUSES.includes(presence.status)) {
    errors.push(`Statut invalide : ${presence.status}. Attendu : ${PRESENCE_STATUSES.join(', ')}.`)
  }
  if (typeof presence.check_in_lat !== 'number' || isNaN(presence.check_in_lat)) {
    errors.push('Latitude d’arrivée (check_in_lat) numérique requise.')
  }
  if (typeof presence.check_in_lng !== 'number' || isNaN(presence.check_in_lng)) {
    errors.push('Longitude d’arrivée (check_in_lng) numérique requise.')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Fabrique déterministe d'un enregistrement de pointage initial (Check-In).
 * Injecte les UUIDv7, normalise les horodatages et calcule le statut d'arrivée.
 *
 * @param {Object} params
 * @param {string} params.userId - Identifiant UUID de l'utilisateur
 * @param {string} params.locationId - Identifiant UUID du site de pointage
 * @param {{ latitude: number, longitude: number }} params.coords - Coordonnées GPS
 * @param {number} [params.accuracy=10] - Précision du relevé GPS en mètres
 * @param {string} [params.expectedArrivalTime='09:00:00'] - Heure d'arrivée théorique (HH:MM:SS)
 * @param {Date} [params.now=new Date()] - Horloge de référence
 * @returns {import('../types/database.types').Presence}
 */
export function createPresenceRecord({
  userId,
  locationId,
  coords,
  accuracy = 10,
  expectedArrivalTime = '09:00:00',
  now = new Date(),
}) {
  if (!userId) throw new Error('userId requis pour créer un pointage.')
  if (!locationId) throw new Error('locationId requis pour créer un pointage.')
  if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
    throw new Error('Coordonnées GPS valides requises pour créer un pointage.')
  }

  const isoTime = now.toISOString()
  const todayStr = getLocalDateString(now)
  const id = generateUUIDv7()
  const clientMutationId = generateUUIDv7()

  // Calcul du retard vis-à-vis de l'horaire prévu
  const [expHours, expMinutes] = expectedArrivalTime.split(':').map(Number)
  const limitDate = new Date(now)
  limitDate.setHours(expHours || 9, expMinutes || 0, 0, 0)
  const status = now > limitDate ? 'late' : 'present'

  return {
    id,
    user_id: userId,
    location_id: locationId,
    client_mutation_id: clientMutationId,
    work_date: todayStr,
    check_in_time: isoTime,
    check_out_time: null,
    status,
    check_in_lat: coords.latitude,
    check_in_lng: coords.longitude,
    check_in_accuracy: accuracy,
    check_out_lat: null,
    check_out_lng: null,
    check_out_accuracy: null,
    created_at: isoTime,
    updated_at: isoTime,
    deleted_at: null,
  }
}

/**
 * Valide l'intégrité structurelle d'une déclaration de disponibilité.
 * @param {Object} availability
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAvailability(availability) {
  const errors = []

  if (!availability || typeof availability !== 'object') {
    return { valid: false, errors: ['Disponibilité invalide (non-objet).'] }
  }

  if (!availability.id) errors.push('Identifiant (id) requis.')
  if (!availability.user_id) errors.push('Identifiant utilisateur (user_id) requis.')
  if (!availability.client_mutation_id) errors.push('client_mutation_id requis.')
  if (!availability.week_start || !/^\d{4}-\d{2}-\d{2}$/.test(availability.week_start)) {
    errors.push('week_start invalide (format YYYY-MM-DD attendu).')
  }
  if (
    typeof availability.day_of_week !== 'number' ||
    availability.day_of_week < 1 ||
    availability.day_of_week > 7
  ) {
    errors.push('day_of_week doit être un entier compris entre 1 (lundi) et 7 (dimanche).')
  }
  if (!AVAILABILITY_SLOTS.includes(availability.slot)) {
    errors.push(`Créneau (slot) invalide : ${availability.slot}. Attendu : ${AVAILABILITY_SLOTS.join(', ')}.`)
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Fabrique déterministe d'une déclaration de disponibilité.
 *
 * @param {Object} params
 * @param {string} params.userId - Identifiant UUID de l'utilisateur
 * @param {string} params.weekStart - Date du lundi de la semaine (YYYY-MM-DD)
 * @param {number} params.dayOfWeek - Jour (1 à 7)
 * @param {'full_day' | 'morning' | 'afternoon'} [params.slot='full_day'] - Créneau horaire
 * @param {string|null} [params.note=null] - Note contextuelle éventuelle
 * @param {Date} [params.now=new Date()]
 * @returns {import('../types/database.types').Availability}
 */
export function createAvailabilityRecord({
  userId,
  weekStart,
  dayOfWeek,
  slot = 'full_day',
  note = null,
  now = new Date(),
}) {
  if (!userId) throw new Error('userId requis pour déclarer une disponibilité.')
  if (!weekStart) throw new Error('weekStart requis.')
  if (!dayOfWeek || dayOfWeek < 1 || dayOfWeek > 7) {
    throw new Error('dayOfWeek doit être compris entre 1 et 7.')
  }

  const isoTime = now.toISOString()
  const id = generateUUIDv7()
  const clientMutationId = generateUUIDv7()

  return {
    id,
    user_id: userId,
    client_mutation_id: clientMutationId,
    week_start: weekStart,
    day_of_week: dayOfWeek,
    slot,
    note: note || null,
    declared_at: isoTime,
    created_at: isoTime,
    updated_at: isoTime,
    deleted_at: null,
  }
}

/**
 * Fabrique unitaire d'une entrée de synchronisation outbox conforme à ADR 0002.
 *
 * @param {Object} params
 * @param {string} params.tableName - Nom de la table cible ('presences', 'availabilities', etc.)
 * @param {string} params.recordId - Identifiant UUID du record concerné
 * @param {'INSERT' | 'UPDATE' | 'DELETE'} params.operation - Type d'opération
 * @param {Object} params.payload - Données à répliquer
 * @param {string} [params.clientMutationId] - Identifiant d'idempotence (si omis, dérivé ou généré)
 * @param {Date} [params.now=new Date()]
 * @returns {Object}
 */
export function createOutboxEntry({
  tableName,
  recordId,
  operation,
  payload,
  clientMutationId = null,
  now = new Date(),
}) {
  const mutationId = clientMutationId || payload?.client_mutation_id || generateUUIDv7()

  return {
    id: generateUUIDv7(),
    client_mutation_id: mutationId,
    table_name: tableName,
    record_id: recordId,
    operation,
    payload,
    created_at: now.toISOString(),
    attempts: 0,
    status: 'pending',
  }
}
