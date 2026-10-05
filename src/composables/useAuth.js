import { ref, shallowRef } from 'vue'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'

const session = shallowRef(null)
const user = shallowRef(null)
const authInitializing = ref(true)
const authLoading = ref(false)
const authError = ref(null)

let authListenerInitialized = false

export function useAuth() {
  const initAuth = async () => {
    if (authListenerInitialized) return
    authListenerInitialized = true
    authInitializing.value = true

    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      session.value = data.session
      user.value = data.session?.user || null
    } catch (err) {
      console.error('Erreur chargement session Supabase :', err)
      authError.value = err.message
    } finally {
      authInitializing.value = false
    }

    supabase.auth.onAuthStateChange((_event, currentSession) => {
      session.value = currentSession
      user.value = currentSession?.user || null
      authInitializing.value = false
    })
  }

  const formatAuthError = (err) => {
    if (!err) return null
    const msg = err.message || ''
    if (msg.includes('Invalid login credentials')) {
      return 'Email ou mot de passe incorrect.'
    }
    if (msg.includes('Email not confirmed')) {
      return 'Adresse email non confirmée.'
    }
    if (msg.includes('User already registered')) {
      return 'Un compte utilise déjà cette adresse email.'
    }
    if (msg.includes('Password should be at least')) {
      return 'Le mot de passe doit faire au moins 6 caractères.'
    }
    if (msg.includes('Failed to fetch') || !navigator.onLine) {
      return 'Impossible de joindre le serveur. Vérifiez votre accès Internet.'
    }
    return msg || 'Erreur de connexion.'
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

  const resetPassword = async (email) => {
    authLoading.value = true
    authError.value = null
    const cleanEmail = (email || '').trim().toLowerCase()

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/`,
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

  const changePassword = async (newPassword) => {
    authLoading.value = true
    authError.value = null
    const cleanPassword = (newPassword || '').trim()

    if (cleanPassword.length < 6) {
      const msg = 'Le mot de passe doit comporter au moins 6 caractères.'
      authError.value = msg
      authLoading.value = false
      return { data: null, error: new Error(msg), formattedMessage: msg }
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: cleanPassword,
      })
      if (error) throw error
      return { data, error: null }
    } catch (err) {
      const formatted = formatAuthError(err)
      authError.value = formatted
      return { data: null, error: err, formattedMessage: formatted }
    } finally {
      authLoading.value = false
    }
  }

  const signOut = async () => {
    authLoading.value = true
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Erreur déconnexion distante Supabase :', err)
    } finally {
      session.value = null
      user.value = null
      authLoading.value = false
    }
  }

  return {
    session,
    user,
    authLoading,
    authInitializing,
    authError,
    initAuth,
    signIn,
    signUp,
    signOut,
    resetPassword,
    changePassword,
  }
}
