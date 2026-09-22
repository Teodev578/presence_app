import { ref, shallowRef, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'
import { useAuth } from './useAuth'

const currentProfile = shallowRef(null)
const profileLoading = ref(false)

export function useProfile() {
  const { user } = useAuth()

  const fetchProfile = async () => {
    if (!user.value) {
      currentProfile.value = null
      return
    }

    const userId = user.value.id
    profileLoading.value = true

    // 1. Lecture locale immédiate dans Dexie (Local-First)
    try {
      const local = await db.profiles.get(userId)
      if (local) {
        currentProfile.value = local
      }
    } catch (e) {
      console.warn('Erreur lecture profil local Dexie :', e)
    }

    // 2. Rafraîchissement distant depuis Supabase si connecté
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (!error && data) {
          currentProfile.value = data
          await db.profiles.put(data)
        }
      } catch (err) {
        console.warn('Erreur rafraîchissement profil distant :', err)
      }
    }

    profileLoading.value = false
  }

  // Surveille les changements de session utilisateur
  watch(
    () => user.value?.id,
    () => {
      fetchProfile()
    },
    { immediate: true }
  )

  return {
    profile: currentProfile,
    profileLoading,
    fetchProfile,
  }
}
