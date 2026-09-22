import { ref, computed } from 'vue'

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
   * @returns {{ inPerimeter: boolean, distance: number }}
   */
  const checkPerimeter = (location) => {
    if (!currentCoords.value || !location) {
      return { inPerimeter: false, distance: Infinity }
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
  }
}
