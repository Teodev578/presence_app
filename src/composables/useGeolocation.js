import { ref } from 'vue'

// Calcul de la distance géodésique (formule de Haversine) en mètres
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Rayon moyen de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Formate lisiblement une distance en mètres ou kilomètres.
 * @param {number} meters
 * @returns {string}
 */
export function formatDistance(meters) {
  if (meters === null || meters === undefined || isNaN(meters)) return '--'
  const absM = Math.abs(meters)
  if (absM >= 1000) {
    const km = absM / 1000
    return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`
  }
  return `${Math.round(absM)} m`
}

/**
 * Identifie si des coordonnées GPS correspondent à un site autorisé (in-perimeter)
 * ou détermine le site le plus proche.
 *
 * @param {{ latitude: number, longitude: number } | null} coords
 * @param {Array<{ id: string, name: string, latitude: number, longitude: number, radius_meters?: number }>} locationsList
 * @returns {{
 *   matchedLocation: object | null,
 *   closestLocation: object | null,
 *   closestDistance: number,
 *   matchedDistance: number | null,
 *   inPerimeter: boolean
 * }}
 */
export function findMatchingLocation(coords, locationsList) {
  if (!coords || !locationsList || !locationsList.length) {
    return {
      matchedLocation: null,
      closestLocation: null,
      closestDistance: Infinity,
      matchedDistance: null,
      inPerimeter: false,
    }
  }

  let matchedLocation = null
  let closestLocation = null
  let closestDistance = Infinity
  let matchedDistance = Infinity

  for (const loc of locationsList) {
    if (
      loc.latitude === null ||
      loc.latitude === undefined ||
      loc.longitude === null ||
      loc.longitude === undefined
    ) {
      continue
    }

    const dist = calculateHaversineDistance(
      coords.latitude,
      coords.longitude,
      loc.latitude,
      loc.longitude
    )
    const allowedRadius = loc.radius_meters || 50

    if (dist < closestDistance) {
      closestDistance = dist
      closestLocation = loc
    }

    if (dist <= allowedRadius) {
      if (!matchedLocation || dist < matchedDistance) {
        matchedLocation = loc
        matchedDistance = dist
      }
    }
  }

  return {
    matchedLocation,
    closestLocation,
    closestDistance: Math.round(closestDistance),
    matchedDistance: matchedLocation ? Math.round(matchedDistance) : null,
    inPerimeter: Boolean(matchedLocation),
  }
}

const currentCoords = ref(null)
const gpsAccuracy = ref(null)
const gpsError = ref(null)
const isLocating = ref(false)

let watchId = null

export function useGeolocation() {
  const startWatching = () => {
    if (!navigator.geolocation) {
      gpsError.value = 'La géolocalisation n’est pas supportée par votre navigateur.'
      return
    }

    if (watchId !== null) return

    isLocating.value = true
    gpsError.value = null

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        currentCoords.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        gpsAccuracy.value = Math.round(position.coords.accuracy)
        gpsError.value = null
        isLocating.value = false
      },
      (err) => {
        isLocating.value = false
        switch (err.code) {
          case err.PERMISSION_DENIED:
            gpsError.value = 'Accès GPS refusé. Veuillez autoriser la localisation.'
            break
          case err.POSITION_UNAVAILABLE:
            gpsError.value = 'Signal GPS introuvable.'
            break
          case err.TIMEOUT:
            gpsError.value = 'Délai d’attente du signal GPS dépassé.'
            break
          default:
            gpsError.value = 'Erreur de localisation inconnue.'
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    )
  }

  const stopWatching = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
      isLocating.value = false
    }
  }

  /**
   * Vérifie si les coordonnées actuelles se situent à l'intérieur du périmètre d'un site.
   * @param {Object} location - { latitude, longitude, radius_meters }
   * @returns {{ inPerimeter: boolean, distance: number, allowedRadius: number }}
   */
  const checkPerimeter = (location) => {
    if (!currentCoords.value || !location) {
      return { inPerimeter: false, distance: Infinity, allowedRadius: location?.radius_meters || 50 }
    }

    const dist = calculateHaversineDistance(
      currentCoords.value.latitude,
      currentCoords.value.longitude,
      location.latitude,
      location.longitude
    )

    const allowedRadius = location.radius_meters || 50
    return {
      inPerimeter: dist <= allowedRadius,
      distance: Math.round(dist),
      allowedRadius,
    }
  }

  return {
    currentCoords,
    gpsAccuracy,
    gpsError,
    isLocating,
    startWatching,
    stopWatching,
    checkPerimeter,
    findMatchingLocation,
    formatDistance,
  }
}
