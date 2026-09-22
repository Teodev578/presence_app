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

  const formatAuthError = (err) => {
    if (!err) return null
    const msg = err.message || ''
    if (msg.includes('Invalid login credentials')) {
      return 'Email ou mot de passe incorrect. Vérifiez vos identifiants.'
    }
    if (msg.includes('Email not confirmed')) {
      return "Cette adresse email n'a pas encore été confirmée."
    }
    if (msg.includes('User already registered')) {
      return 'Un compte existe déjà avec cette adresse email.'
    }
    if (msg.includes('Password should be at least')) {
      return 'Le mot de passe doit comporter au moins 6 caractères.'
    }
    return msg || 'Une erreur est survenue lors de la connexion.'
  }

  const signIn = async (email, password) => {
    authLoading.value = true
    authError.value = null
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanPassword = (password || '').trim()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })
      if (error) throw error
      session.value = data.session
      user.value = data.user
      return { data, error: null }
    } catch (err) {
      authError.value = formatAuthError(err)
      return { data: null, error: err }
    } finally {
      authLoading.value = false
    }
  }

  const signUp = async (email, password, fullName, role = 'employee') => {
    authLoading.value = true
    authError.value = null
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanPassword = (password || '').trim()
    const cleanName = (fullName || '').trim()

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            full_name: cleanName,
            role,
          },
        },
      })
      if (error) throw error
      return { data, error: null }
    } catch (err) {
      authError.value = formatAuthError(err)
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
