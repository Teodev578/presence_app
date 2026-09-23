/**
 * Analyseur d'URL et de coordonnées géographiques (Google Maps, Apple Maps, OpenStreetMap, coordonnées brutes).
 * Combine un parsing synchrone local (0ms, 100% hors-ligne) et une résolution asynchrone des liens courts
 * (maps.app.goo.gl, goo.gl) via la fonction Edge Supabase dédiée.
 */

/**
 * Valide si les coordonnées sont dans les bornes terrestres valides.
 * @param {number} lat
 * @param {number} lng
 * @returns {boolean}
 */
export function isValidLatLng(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

/**
 * Convertit des coordonnées DMS (Degrés Minutes Secondes) en degrés décimaux.
 * @param {number} deg
 * @param {number} min
 * @param {number} sec
 * @param {'N'|'S'|'E'|'W'} dir
 * @returns {number}
 */
function dmsToDecimal(deg, min, sec, dir) {
  const dec = deg + min / 60 + sec / 3600
  return dir === 'S' || dir === 'W' ? -dec : dec
}

/**
 * Nettoie et extrait un nom de lieu à partir d'une chaîne URL.
 * @param {string} rawPlace
 * @returns {string|null}
 */
function cleanPlaceName(rawPlace) {
  if (!rawPlace) return null
  try {
    const decoded = decodeURIComponent(rawPlace.replace(/\+/g, ' ')).trim()
    // Si le nom ressemble uniquement à des coordonnées numériques ou DMS, on ne l'utilise pas comme nom de site
    if (/^[-+]?[\d.,\s°'"′″NSEW]+$/i.test(decoded)) {
      return null
    }
    return decoded
  } catch {
    return null
  }
}

/**
 * Parse de manière synchrone une saisie utilisateur (URL ou texte) pour en extraire des coordonnées géographiques.
 *
 * @param {string} rawInput
 * @returns {{
 *   success: boolean,
 *   latitude?: number,
 *   longitude?: number,
 *   name?: string,
 *   source?: string,
 *   isShortUrl?: boolean,
 *   error?: string
 * }}
 */
export function parseGeoInput(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { success: false, error: 'Saisie vide.' }
  }

  const input = rawInput.trim()

  // 1. Détection des liens courts (Google Maps mobile ou Apple share)
  if (/(?:maps\.app\.goo\.gl|goo\.gl\/maps|apple\.co)\//i.test(input)) {
    return {
      success: false,
      isShortUrl: true,
      error: "Ce lien est raccourci (maps.app.goo.gl). Résolution automatique en cours ou ouvrez-le dans votre navigateur.",
    }
  }

  // 2. Coordonnées brutes au format Degrés Minutes Secondes (DMS)
  // Ex: 48°51'29.8"N 2°17'40.2"E ou 48°51'29.8" N, 2°17'40.2" E
  const dmsRegex = /(\d{1,2})°\s*(\d{1,2})['′]\s*([\d.]+)["″]?\s*([NS])[\s,;]+(\d{1,3})°\s*(\d{1,2})['′]\s*([\d.]+)["″]?\s*([EW])/i
  const dmsMatch = input.match(dmsRegex)
  if (dmsMatch) {
    const lat = dmsToDecimal(
      parseFloat(dmsMatch[1]),
      parseFloat(dmsMatch[2]),
      parseFloat(dmsMatch[3]),
      dmsMatch[4].toUpperCase()
    )
    const lng = dmsToDecimal(
      parseFloat(dmsMatch[5]),
      parseFloat(dmsMatch[6]),
      parseFloat(dmsMatch[7]),
      dmsMatch[8].toUpperCase()
    )
    if (isValidLatLng(lat, lng)) {
      return {
        success: true,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        source: 'Coordonnées DMS',
      }
    }
  }

  // 3. Coordonnées brutes décimales
  // Ex: 48.858370, 2.294481 ou 48.858370;2.294481 ou 48.858370 2.294481
  const decimalRegex = /^[-+]?(\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*[-+]?(\d{1,3}(?:\.\d+)?)$/
  const decimalMatch = input.match(decimalRegex)
  if (decimalMatch) {
    const lat = parseFloat(decimalMatch[1])
    const lng = parseFloat(decimalMatch[2])
    if (isValidLatLng(lat, lng)) {
      return {
        success: true,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        source: 'Coordonnées décimales',
      }
    }
  }

  // 4. Geo URI standard (geo:48.858370,2.294481)
  const geoUriMatch = input.match(/^geo:([-+]?\d{1,2}(?:\.\d+)?),([-+]?\d{1,3}(?:\.\d+)?)/i)
  if (geoUriMatch) {
    const lat = parseFloat(geoUriMatch[1])
    const lng = parseFloat(geoUriMatch[2])
    if (isValidLatLng(lat, lng)) {
      return {
        success: true,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        source: 'Geo URI',
      }
    }
  }

  // 5. OpenStreetMap
  // Ex: https://www.openstreetmap.org/#map=19/48.85837/2.29448 ou ?mlat=48.85837&mlon=2.29448
  if (/openstreetmap\.org/i.test(input)) {
    const osmHashMap = input.match(/#map=\d+\/([-+]?\d{1,2}\.\d+)\/([-+]?\d{1,3}\.\d+)/i)
    if (osmHashMap) {
      const lat = parseFloat(osmHashMap[1])
      const lng = parseFloat(osmHashMap[2])
      if (isValidLatLng(lat, lng)) {
        return {
          success: true,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          source: 'OpenStreetMap',
        }
      }
    }
    const osmMlat = input.match(/[?&]mlat=([-+]?\d{1,2}\.\d+)&mlon=([-+]?\d{1,3}\.\d+)/i)
    if (osmMlat) {
      const lat = parseFloat(osmMlat[1])
      const lng = parseFloat(osmMlat[2])
      if (isValidLatLng(lat, lng)) {
        return {
          success: true,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          source: 'OpenStreetMap',
        }
      }
    }
  }

  // 6. Apple Maps
  // Ex: https://maps.apple.com/?ll=48.858370,2.294481&q=Tour+Eiffel
  if (/maps\.apple\.com/i.test(input)) {
    let siteName = null
    const nameMatch = input.match(/[?&]q=([^&]+)/i)
    if (nameMatch) {
      siteName = cleanPlaceName(nameMatch[1])
    }

    const llMatch = input.match(/[?&](?:ll|sll)=([-+]?\d{1,2}\.\d+)(?:,|%2C|\+)([-+]?\d{1,3}\.\d+)/i)
    if (llMatch) {
      const lat = parseFloat(llMatch[1])
      const lng = parseFloat(llMatch[2])
      if (isValidLatLng(lat, lng)) {
        return {
          success: true,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          name: siteName || undefined,
          source: 'Apple Maps',
        }
      }
    }

    // Si pas de paramètre ll, tester si q contient directement les coordonnées
    const qCoordsMatch = input.match(/[?&]q=([-+]?\d{1,2}\.\d+)(?:,|%2C|\+)([-+]?\d{1,3}\.\d+)/i)
    if (qCoordsMatch) {
      const lat = parseFloat(qCoordsMatch[1])
      const lng = parseFloat(qCoordsMatch[2])
      if (isValidLatLng(lat, lng)) {
        return {
          success: true,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          source: 'Apple Maps',
        }
      }
    }
  }

  // 7. Google Maps
  // Exemples :
  // https://www.google.com/maps/@48.8583701,2.2944813,17z
  // https://www.google.com/maps/place/Tour+Eiffel/@48.8583701,2.2944813,17z
  // https://www.google.com/maps/place/6.175193,1.199260/data=...
  // https://maps.google.com/?q=48.858370,2.294481
  // https://maps.google.com/maps?ll=48.858370,2.294481
  if (/(?:google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)/i.test(input)) {
    let siteName = null
    const placeMatch = input.match(/\/maps\/place\/([^/@]+)/i)
    if (placeMatch) {
      siteName = cleanPlaceName(placeMatch[1])
    }

    // Recherche de coordonnées directes dans le path /place/lat,lng
    const placeCoordsMatch = input.match(/\/maps\/place\/([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/i)
    if (placeCoordsMatch) {
      const lat = parseFloat(placeCoordsMatch[1])
      const lng = parseFloat(placeCoordsMatch[2])
      if (isValidLatLng(lat, lng)) {
        return {
          success: true,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          name: siteName || undefined,
          source: 'Google Maps',
        }
      }
    }

    // Recherche de @latitude,longitude
    const atMatch = input.match(/@([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/)
    if (atMatch) {
      const lat = parseFloat(atMatch[1])
      const lng = parseFloat(atMatch[2])
      if (isValidLatLng(lat, lng)) {
        return {
          success: true,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          name: siteName || undefined,
          source: 'Google Maps',
        }
      }
    }

    // Recherche dans le paramètre protobuf interne Google data=!3dLAT!4dLNG
    const protoDataMatch = input.match(/!3d([-+]?\d{1,2}\.\d+)!4d([-+]?\d{1,3}\.\d+)/)
    if (protoDataMatch) {
      const lat = parseFloat(protoDataMatch[1])
      const lng = parseFloat(protoDataMatch[2])
      if (isValidLatLng(lat, lng)) {
        return {
          success: true,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          name: siteName || undefined,
          source: 'Google Maps',
        }
      }
    }

    // Recherche dans les paramètres de requête q, query, ll, daddr
    const queryParamMatch = input.match(
      /[?&](?:query|q|ll|daddr|sll)=([-+]?\d{1,2}\.\d+)(?:,|%2C|\+)([-+]?\d{1,3}\.\d+)/i
    )
    if (queryParamMatch) {
      const lat = parseFloat(queryParamMatch[1])
      const lng = parseFloat(queryParamMatch[2])
      if (isValidLatLng(lat, lng)) {
        return {
          success: true,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          name: siteName || undefined,
          source: 'Google Maps',
        }
      }
    }
  }

  // 8. Recherche générique de motif @lat,lng ou coords dans n'importe quelle URL
  const genericAtMatch = input.match(/@([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/)
  if (genericAtMatch) {
    const lat = parseFloat(genericAtMatch[1])
    const lng = parseFloat(genericAtMatch[2])
    if (isValidLatLng(lat, lng)) {
      return {
        success: true,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        source: 'Lien cartographique',
      }
    }
  }

  return {
    success: false,
    error: 'Format non reconnu. Collez un lien complet (Google Maps, Apple Maps) ou des coordonnées GPS.',
  }
}

/**
 * Analyse et résout une saisie cartographique (synchronement pour les URL complètes et coordonnées,
 * ou asynchronement via Supabase Edge Function pour les liens courts maps.app.goo.gl).
 *
 * @param {string} rawInput
 * @param {object} [options]
 * @param {string} [options.supabaseUrl]
 * @param {string} [options.supabaseKey]
 * @returns {Promise<{
 *   success: boolean,
 *   latitude?: number,
 *   longitude?: number,
 *   name?: string,
 *   source?: string,
 *   isShortUrl?: boolean,
 *   error?: string
 * }>}
 */
export async function parseAndResolveGeoInput(rawInput, options = {}) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { success: false, error: 'Saisie vide.' }
  }

  // 1. Analyse locale synchrone en première intention (0ms, 100% hors-ligne)
  const syncResult = parseGeoInput(rawInput)
  if (syncResult.success) {
    return syncResult
  }

  // 2. Si c'est un lien court (ex: maps.app.goo.gl) et qu'on a du réseau
  if (syncResult.isShortUrl && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
    try {
      const supabaseUrl =
        options.supabaseUrl ||
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
        process?.env?.VITE_SUPABASE_URL
      const supabaseKey =
        options.supabaseKey ||
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
        process?.env?.VITE_SUPABASE_PUBLISHABLE_KEY

      if (supabaseUrl && supabaseKey) {
        const response = await fetch(`${supabaseUrl}/functions/v1/resolve-map-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
          },
          body: JSON.stringify({ url: rawInput.trim() }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.expandedUrl) {
            const resolved = parseGeoInput(data.expandedUrl)
            if (resolved.success) {
              return {
                ...resolved,
                source: `${resolved.source} (Lien court résolu)`,
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Erreur lors de la résolution du lien court :', err)
    }
  }

  return syncResult
}
