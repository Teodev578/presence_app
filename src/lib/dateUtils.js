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
