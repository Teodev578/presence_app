import { ref, onMounted, onUnmounted } from 'vue'

const geoStatus = ref('prompt')
const isRequestingGeo = ref(false)
const storagePersisted = ref(null)
const isRequestingStorage = ref(false)

let permissionStatusObj = null
let permissionListener = null

export function useDevicePermissions() {
  const hasNavigator = typeof navigator !== 'undefined'
  const canPersistStorage = hasNavigator && !!(navigator.storage && navigator.storage.persist)

  const updateGeoStatus = (state) => {
    geoStatus.value = state
  }

  const checkPermissions = async () => {
    if (!hasNavigator) return

    // 1. Vérification de la permission de géolocalisation
    if ('permissions' in navigator && typeof navigator.permissions.query === 'function') {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' })
        permissionStatusObj = status
        updateGeoStatus(status.state)

        if (!permissionListener) {
          permissionListener = () => {
            updateGeoStatus(status.state)
          }
          if (typeof status.addEventListener === 'function') {
            status.addEventListener('change', permissionListener)
          } else {
            status.onchange = permissionListener
          }
        }
      } catch {
        // Fallback si la requête de permission échoue sur certains navigateurs
        if ('geolocation' in navigator) {
          geoStatus.value = 'prompt'
        } else {
          geoStatus.value = 'unsupported'
        }
      }
    } else if ('geolocation' in navigator) {
      geoStatus.value = 'prompt'
    } else {
      geoStatus.value = 'unsupported'
    }

    // 2. Vérification du stockage persistant
    if (hasNavigator && navigator.storage && typeof navigator.storage.persisted === 'function') {
      try {
        storagePersisted.value = await navigator.storage.persisted()
      } catch {
        storagePersisted.value = false
      }
    }
  }

  const requestGeoPermission = () => {
    if (!hasNavigator || !('geolocation' in navigator)) {
      geoStatus.value = 'unsupported'
      return
    }

    isRequestingGeo.value = true
    navigator.geolocation.getCurrentPosition(
      () => {
        geoStatus.value = 'granted'
        isRequestingGeo.value = false
      },
      (err) => {
        isRequestingGeo.value = false
        if (err.code === err.PERMISSION_DENIED) {
          geoStatus.value = 'denied'
        }
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
      }
    )
  }

  const requestStoragePersistence = async () => {
    if (!canPersistStorage) return

    isRequestingStorage.value = true
    try {
      const persisted = await navigator.storage.persist()
      storagePersisted.value = persisted
    } catch {
      storagePersisted.value = false
    } finally {
      isRequestingStorage.value = false
    }
  }

  onMounted(() => {
    checkPermissions()
  })

  onUnmounted(() => {
    if (permissionStatusObj && permissionListener) {
      if (typeof permissionStatusObj.removeEventListener === 'function') {
        permissionStatusObj.removeEventListener('change', permissionListener)
      } else {
        permissionStatusObj.onchange = null
      }
      permissionListener = null
    }
  })

  return {
    geoStatus,
    isRequestingGeo,
    storagePersisted,
    canPersistStorage,
    isRequestingStorage,
    checkPermissions,
    requestGeoPermission,
    requestStoragePersistence,
  }
}
