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
 * Formate une date ISO ou string 'YYYY-MM-DD' en libellé français.
 * Par défaut le libellé est court (ex: "Lun. 21 sept.") ; le variant long
 * écrit le mois en toutes lettres et ajoute l'année (ex: "21 septembre 2026").
 *
 * @param {string|Date} dateVal
 * @param {{ long?: boolean }} [options]
 * @returns {string}
 */
export function formatWorkDate(dateVal, { long = false } = {}) {
  if (!dateVal) return ''
  const d = typeof dateVal === 'string' && dateVal.length === 10
    ? new Date(`${dateVal}T12:00:00`)
    : new Date(dateVal)
  if (isNaN(d.getTime())) return ''
  const formatted = d.toLocaleDateString('fr-FR', long
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { weekday: 'short', day: 'numeric', month: 'short' })
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

/**
 * Calcule la date du dimanche de Pâques pour une année donnée selon l'algorithme de Butcher (comput ecclésiastique).
 * Valide pour le calendrier grégorien.
 *
 * @param {number} year
 * @returns {Date} Date UTC positionnée sur le jour de Pâques
 */
export function getEasterDate(year) {
  const y = typeof year === 'number' ? year : parseInt(year, 10)
  const a = y % 19
  const b = Math.floor(y / 100)
  const c = y % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 3 = mars, 4 = avril
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(y, month - 1, day))
}

/**
 * Retourne la table des jours fériés légaux en France pour une année donnée sous forme de dictionnaire { 'YYYY-MM-DD': 'Nom du jour férié' }.
 * Prend en charge les 11 jours fériés du droit commun métropolitain ainsi que le droit local d'Alsace-Moselle (13 jours).
 *
 * @param {number} year
 * @param {object} [options={}]
 * @param {boolean} [options.alsaceMoselle=false] Inclut le Vendredi saint et la Saint-Étienne
 * @returns {Record<string, string>}
 */
export function getFrenchHolidays(year, { alsaceMoselle = false } = {}) {
  const y = typeof year === 'number' ? year : parseInt(year, 10)
  if (isNaN(y)) return {}

  const easter = getEasterDate(y)

  const offsetEaster = (days) => {
    const d = new Date(easter)
    d.setUTCDate(d.getUTCDate() + days)
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const holidays = {
    [`${y}-01-01`]: "Jour de l'An",
    [offsetEaster(1)]: 'Lundi de Pâques',
    [`${y}-05-01`]: 'Fête du Travail',
    [`${y}-05-08`]: 'Victoire 1945',
    [offsetEaster(39)]: 'Ascension',
    [offsetEaster(50)]: 'Lundi de Pentecôte',
    [`${y}-07-14`]: 'Fête Nationale',
    [`${y}-08-15`]: 'Assomption',
    [`${y}-11-01`]: 'Toussaint',
    [`${y}-11-11`]: 'Armistice 1918',
    [`${y}-12-25`]: 'Noël',
  }

  if (alsaceMoselle) {
    holidays[offsetEaster(-2)] = 'Vendredi saint'
    holidays[`${y}-12-26`] = 'Saint-Étienne'
  }

  return holidays
}

/**
 * Détermine si une date donnée ('YYYY-MM-DD') correspond à un jour férié légal français et retourne son libellé, ou null.
 *
 * @param {string} dateStr Format 'YYYY-MM-DD'
 * @param {object} [options={}]
 * @param {boolean} [options.alsaceMoselle=false]
 * @returns {string|null} Libellé du jour férié ou null
 */
export function getPublicHoliday(dateStr, options = {}) {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.length < 10) return null
  const year = parseInt(dateStr.slice(0, 4), 10)
  if (isNaN(year)) return null
  const holidays = getFrenchHolidays(year, options)
  return holidays[dateStr.slice(0, 10)] || null
}

/**
 * Prédicat booléen indiquant si une date est un jour férié.
 *
 * @param {string} dateStr Format 'YYYY-MM-DD'
 * @param {object} [options={}]
 * @returns {boolean}
 */
export function isPublicHoliday(dateStr, options = {}) {
  return !!getPublicHoliday(dateStr, options)
}


