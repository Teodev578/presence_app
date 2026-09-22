import { ref, shallowRef } from 'vue'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'

const session = shallowRef(null)
const user = shallowRef(null)
const authLoading = ref(true)
const authError = ref(null)

let authListenerInitialized = false

export function useAuth() {
  const initAuth = async () => {
    if (authListenerInitialized) return
    authListenerInitialized = true
    authLoading.value = true

    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      session.value = data.session
      user.value = data.session?.user || null
    } catch (err) {
      console.error('Erreur chargement session Supabase :', err)
      authError.value = err.message
    } finally {
      authLoading.value = false
    }

    supabase.auth.onAuthStateChange((_event, currentSession) => {
      session.value = currentSession
      user.value = currentSession?.user || null
      authLoading.value = false
    })
  }

  const signIn = async (email, password) => {
    authLoading.value = true
    authError.value = null
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      session.value = data.session
      user.value = data.user
      return { data, error: null }
    } catch (err) {
      authError.value = err.message
      return { data: null, error: err }
    } finally {
      authLoading.value = false
    }
  }

  const signUp = async (email, password, fullName, role = 'employee') => {
    authLoading.value = true
    authError.value = null
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      })
      if (error) throw error
      return { data, error: null }
    } catch (err) {
      authError.value = err.message
      return { data: null, error: err }
    } finally {
      authLoading.value = false
    }
  }

  const signOut = async () => {
    authLoading.value = true
    try {
      await supabase.auth.signOut()
      session.value = null
      user.value = null
      // Purge optionnelle de la session locale Dexie
    } catch (err) {
      console.error('Erreur déconnexion :', err)
    } finally {
      authLoading.value = false
    }
  }

  return {
    session,
    user,
    authLoading,
    authError,
    initAuth,
    signIn,
    signUp,
    signOut,
  }
}
