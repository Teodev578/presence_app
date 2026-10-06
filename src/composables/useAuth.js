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

  function logAuthError(tag, error, context = {}) {
    console.error(`[PresenceApp - ${tag}]`, {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      name: error?.name,
      context,
      rawError: error,
    })

    if (import.meta.env?.DEV) {
      try {
        fetch('/api/__terminal-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tag,
            message: error?.message || String(error),
            status: error?.status || null,
            code: error?.code || null,
            name: error?.name || null,
            context,
            raw: error
              ? {
                  message: error.message,
                  status: error.status,
                  code: error.code,
                  name: error.name,
                }
              : null,
          }),
        }).catch(() => {})
      } catch {
        // Ignorer
      }
    }
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
    if (msg.includes('Token has expired') || msg.includes('token is expired') || msg.includes('Token is invalid') || msg.includes('otp_expired') || msg.includes('invalid token')) {
      return 'Code de sécurité expiré ou invalide.'
    }
    if (msg.includes('rate limit') || msg.includes('security purposes') || msg.includes('over_email_send_rate_limit') || msg.includes('429') || msg.includes('Too Many Requests')) {
      return 'Trop de tentatives rapprochées. Veuillez patienter une minute avant de demander un nouveau code.'
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
      logAuthError('Connexion (signIn)', err, { email: cleanEmail })
      authError.value = formatAuthError(err)
      return { data: null, error: err }
    } finally {
      authLoading.value = false
    }
  }

  const signUp = async (email, password, nameInput, role = 'employee') => {
    authLoading.value = true
    authError.value = null
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanPassword = (password || '').trim()

    let firstName = ''
    let lastName = ''
    let fullName = ''

    if (nameInput && typeof nameInput === 'object') {
      firstName = (nameInput.firstName || nameInput.first_name || '').trim()
      lastName = (nameInput.lastName || nameInput.last_name || '').trim()
      fullName = (nameInput.fullName || nameInput.full_name || `${firstName} ${lastName}`).trim()
    } else if (typeof nameInput === 'string') {
      fullName = nameInput.trim()
      const parts = fullName.split(/\s+/)
      firstName = parts[0] || ''
      lastName = parts.slice(1).join(' ') || ''
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            role,
          },
        },
      })
      if (error) throw error
      return { data, error: null }
    } catch (err) {
      logAuthError('Inscription (signUp)', err, { email: cleanEmail })
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
      logAuthError('Demande OTP / Réinitialisation (resetPassword)', err, { email: cleanEmail })
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
      logAuthError('Mise à jour mot de passe (changePassword)', err)
      const formatted = formatAuthError(err)
      authError.value = formatted
      return { data: null, error: err, formattedMessage: formatted }
    } finally {
      authLoading.value = false
    }
  }

  const verifyRecoveryOtp = async (email, token, newPassword = null) => {
    authLoading.value = true
    authError.value = null
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanToken = (token || '').trim()

    if (!cleanToken || cleanToken.length < 6) {
      const msg = 'Le code de sécurité doit comporter 6 chiffres.'
      authError.value = msg
      authLoading.value = false
      return { data: null, error: new Error(msg), formattedMessage: msg }
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'recovery',
      })
      if (error) throw error

      session.value = data.session
      user.value = data.session?.user || null

      const trimmedPwd = (newPassword || '').trim()
      if (trimmedPwd) {
        if (trimmedPwd.length < 6) {
          const msg = 'Le nouveau mot de passe doit comporter au moins 6 caractères.'
          authError.value = msg
          authLoading.value = false
          return { data, error: new Error(msg), formattedMessage: msg }
        }
        const { error: pwdError } = await supabase.auth.updateUser({
          password: trimmedPwd,
        })
        if (pwdError) {
          logAuthError('Mise à jour mot de passe post-OTP (updateUser)', pwdError)
          console.warn('Erreur mise à jour mot de passe après OTP :', pwdError)
        }
      }

      return { data, error: null, formattedMessage: null }
    } catch (err) {
      logAuthError('Validation OTP (verifyRecoveryOtp)', err, {
        email: cleanEmail,
        tokenLength: cleanToken.length,
      })
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
    verifyRecoveryOtp,
    changePassword,
  }
}
