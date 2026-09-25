/**
 * Utilitaires canoniques pour la gestion des dates, heures et calculs de durée de travail.
 * Conforme aux exigences de fuseaux horaires locaux et à la robustesse des feuilles de temps.
 */

/**
 * Retourne la date calendaire locale sous forme 'YYYY-MM-DD',
 * sans risque de décalage induit par l'heure UTC de toISOString().
 *
 * @param {Date|string|number} [date=new Date()]
 * @returns {string}
 */
export function getLocalDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formate un timestamp ISO en heure lisible 'HH:mm'.
 *
 * @param {string|Date} isoStr
 * @returns {string}
 */
export function formatTime(isoStr) {
  if (!isoStr) return '--:--'
  const d = isoStr instanceof Date ? isoStr : new Date(isoStr)
  if (isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Calcule et formate la durée de travail effectuée entre deux timestamps.
 *
 * @param {string|Date} startTime
 * @param {string|Date} endTime
 * @returns {string|null} ex: "7h 45min" ou "45 min"
 */
export function calculateWorkDuration(startTime, endTime) {
  if (!startTime || !endTime) return null
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  if (isNaN(start) || isNaN(end) || end < start) return null

  const diffMinutes = Math.floor((end - start) / 60000)
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours}h ${String(minutes).padStart(2, '0')}min`
}

/**
 * Calcule le temps écoulé depuis un timestamp d'arrivée jusqu'à maintenant.
 *
 * @param {string|Date} startTime
 * @param {Date} [now=new Date()]
 * @returns {string|null} ex: "3h 15min"
 */
export function calculateElapsedTime(startTime, now = new Date()) {
  if (!startTime) return null
  const start = new Date(startTime).getTime()
  const current = (now instanceof Date ? now : new Date(now)).getTime()
  if (isNaN(start) || isNaN(current) || current < start) return '0 min'

  const diffMinutes = Math.floor((current - start) / 60000)
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  if (hours === 0) return `${minutes} min`
  return `${hours}h ${String(minutes).padStart(2, '0')}min`
}

/**
 * Calcule la date du lundi correspondant à une date donnée sous forme 'YYYY-MM-DD'.
 *
 * @param {Date|string|number} [d=new Date()]
 * @returns {string} ex: "2026-09-21"
 */
export function getMonday(d = new Date()) {
  const date = d instanceof Date ? new Date(d) : new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // ajustement si dimanche (0)
  date.setDate(diff)
  return getLocalDateString(date)
}

/**
 * Formate un nombre total de minutes en chaîne 'Xh YYmin' ou '0h 00min'.
 *
 * @param {number} totalMinutes
 * @returns {string}
 */
export function formatHoursMinutes(totalMinutes) {
  if (!totalMinutes || isNaN(totalMinutes) || totalMinutes <= 0) return '0h 00min'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.floor(totalMinutes % 60)
  return `${hours}h ${String(minutes).padStart(2, '0')}min`
}

/**
 * Formate une date ISO ou string 'YYYY-MM-DD' en libellé court français (ex: "Lun. 21 sept.").
 *
 * @param {string|Date} dateVal
 * @returns {string}
 */
export function formatWorkDate(dateVal) {
  if (!dateVal) return ''
  const d = typeof dateVal === 'string' && dateVal.length === 10
    ? new Date(`${dateVal}T12:00:00`)
    : new Date(dateVal)
  if (isNaN(d.getTime())) return ''
  const formatted = d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/* ---------------------------------------------------------------------------
   États d'une session de pointage
   ---------------------------------------------------------------------------
   Une session ouverte n'est « en cours » que si sa date de travail est la journée locale
   courante. Au-delà, le départ manque : la durée reste inconnue et ne doit plus être mesurée
   contre l'instant présent, sinon le total croît indéfiniment (règle 03, intégrité locale).
*/

/**
 * Indique si une date de travail correspond à la journée locale courante.
 *
 * @param {string} workDate 'YYYY-MM-DD'
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export function isSessionInProgress(workDate, now = new Date()) {
  if (!workDate) return false
  return workDate === getLocalDateString(now)
}

/**
 * Détermine l'état d'un pointage : 'empty', 'closed', 'in_progress' ou 'missing_checkout'.
 *
 * @param {object} presence
 * @param {Date} [now=new Date()]
 * @returns {'empty'|'closed'|'in_progress'|'missing_checkout'}
 */
export function resolveSessionState(presence, now = new Date()) {
  if (!presence || !presence.check_in_time) return 'empty'
  if (presence.check_out_time) return 'closed'
  return isSessionInProgress(presence.work_date, now) ? 'in_progress' : 'missing_checkout'
}

/**
 * Minutes exploitables d'un pointage. Une session close compte sa durée réelle, une session
 * du jour en cours compte le temps écoulé, un départ manquant ou une arrivée absente compte zéro.
 *
 * @param {object} presence
 * @param {Date} [now=new Date()]
 * @returns {number}
 */
export function resolveSessionMinutes(presence, now = new Date()) {
  const state = resolveSessionState(presence, now)
  if (state !== 'closed' && state !== 'in_progress') return 0

  const start = new Date(presence.check_in_time).getTime()
  if (isNaN(start)) return 0

  const end = state === 'closed' ? new Date(presence.check_out_time).getTime() : new Date(now).getTime()
  if (isNaN(end) || end <= start) return 0

  return Math.floor((end - start) / 60000)
}

/**
 * Formate la durée affichable d'un pointage, ou '--' quand la durée n'est pas connaissable.
 *
 * @param {object} presence
 * @param {Date} [now=new Date()]
 * @returns {string}
 */
export function formatSessionDuration(presence, now = new Date()) {
  const state = resolveSessionState(presence, now)
  if (state === 'closed') return calculateWorkDuration(presence.check_in_time, presence.check_out_time) || '--'
  if (state === 'in_progress') return calculateElapsedTime(presence.check_in_time, now) || '--'
  return '--'
}

