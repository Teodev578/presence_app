<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from '../../router'
import { useAuth } from '../../composables/useAuth'
import { useProfile } from '../../composables/useProfile'

const { navigate } = useRouter()
const { signIn, signUp, resetPassword, authLoading, authError } = useAuth()
const { profile, fetchProfile } = useProfile()

const isRegister = ref(false)
const isForgotPassword = ref(false)
const email = ref('')
const password = ref('')
const fullName = ref('')
const showPassword = ref(false)
const message = ref('')
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const isDev = import.meta.env.DEV

let messageTimer = null

// Disparition automatique des messages de notification après 4,5 secondes
watch(message, (newVal) => {
  if (messageTimer) {
    clearTimeout(messageTimer)
    messageTimer = null
  }
  if (newVal) {
    messageTimer = setTimeout(() => {
      message.value = ''
    }, 4500)
  }
})

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  if (messageTimer) {
    clearTimeout(messageTimer)
    messageTimer = null
  }
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})

const fillAdminCredentials = () => {
  email.value = 'ultimateadmin@email.com'
  password.value = 'AdminPresence2026!'
  message.value = 'Identifiants administrateur remplis.'
}

const handleSubmit = async () => {
  message.value = ''

  if (!navigator.onLine) {
    message.value = 'Vous êtes hors ligne. Connexion Internet requise pour vous identifier.'
    return
  }

  const cleanEmail = email.value.trim().toLowerCase()
  const cleanPassword = password.value.trim()

  if (isRegister.value) {
    if (!fullName.value.trim()) {
      message.value = 'Indiquez votre nom et prénom.'
      return
    }
    const { error } = await signUp(
      cleanEmail,
      cleanPassword,
      fullName.value.trim(),
      'employee'
    )
    if (error) return

    message.value = 'Compte créé. Vous pouvez vous connecter.'
    isRegister.value = false
  } else {
    const { data, error } = await signIn(cleanEmail, cleanPassword)
    if (error) return

    const userProfile = await fetchProfile()
    const role = userProfile?.role || profile.value?.role || data?.user?.user_metadata?.role

    // Routage direct selon le rôle
    if (role === 'admin' || role === 'manager') {
      navigate('/manager')
    } else {
      navigate('/employee')
    }
  }
}

const handleForgotPassword = async () => {
  message.value = ''
  authError.value = null

  if (!navigator.onLine) {
    message.value = 'Connexion Internet requise pour cette action.'
    return
  }

  const cleanEmail = email.value.trim().toLowerCase()
  if (!cleanEmail) {
    message.value = 'Entrez votre adresse email.'
    return
  }

  const { error } = await resetPassword(cleanEmail)
  if (!error) {
    message.value = "Si un compte existe pour cet email, le lien vient d'être envoyé."
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-base-200">
    <div class="card bg-base-100 shadow-xl border border-base-300 w-full max-w-md">
      <div class="card-body p-6 sm:p-8 gap-5">
        <!-- Logo vectoriel et En-tête de marque (uniquement sur la connexion / inscription) -->
        <div v-if="!isForgotPassword" class="text-center flex flex-col items-center">
          <div class="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs mb-3">
            <!-- Horloge / Pointage SVG moderne -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-7 h-7"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1 class="text-2xl font-black tracking-tight text-base-content">PresenceApp</h1>
          <p class="text-xs text-base-content/60 mt-1 max-w-xs">
            Pointage des présences et suivi des plannings
          </p>
        </div>

        <!-- Avertissement si le terminal est hors-ligne -->
        <div
          v-if="!isOnline"
          class="alert alert-warning text-xs py-2.5 px-3 rounded-xl flex items-start gap-2"
          role="status"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-4 h-4 shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          <span>Vous êtes hors ligne. Connectez-vous à Internet pour vous identifier.</span>
        </div>

        <!-- Mode Réinitialisation de mot de passe oublié -->
        <div v-if="isForgotPassword" class="flex flex-col gap-5">
          <div class="flex items-center justify-between">
            <button
              type="button"
              class="btn btn-ghost btn-xs gap-1.5 text-base-content/70 hover:text-base-content -ml-2 rounded-lg cursor-pointer"
              @click="isForgotPassword = false; message = ''; authError = null"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Retour</span>
            </button>
            <span class="text-xs font-semibold text-base-content/40 tracking-wider">PresenceApp</span>
          </div>

          <div>
            <h1 class="text-xl font-bold tracking-tight text-base-content">Mot de passe oublié</h1>
            <p class="text-xs text-base-content/60 mt-1">
              Entrez votre email pour recevoir le lien de réinitialisation.
            </p>
          </div>

          <form class="flex flex-col gap-4" @submit.prevent="handleForgotPassword">
            <!-- Email professionnel pour réinitialisation -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold text-base-content/70">
                Adresse email
              </legend>
              <input
                id="reset-email"
                v-model="email"
                type="email"
                autocomplete="email"
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                inputmode="email"
                required
                placeholder="jean.dupont@exemple.com"
                class="input input-bordered w-full rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </fieldset>

            <!-- Erreur d'authentification / envoi -->
            <Transition name="alert-fade">
              <div v-if="authError" class="alert alert-error text-xs py-2.5 rounded-xl flex items-center justify-between gap-2" role="alert">
                <span>{{ authError }}</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-circle shrink-0 hover:bg-black/10 text-error-content"
                  aria-label="Fermer le message d'erreur"
                  @click="authError = null"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </Transition>

            <!-- Message d'information / confirmation -->
            <Transition name="alert-fade">
              <div v-if="message" class="alert alert-info text-xs py-2.5 rounded-xl flex items-center justify-between gap-2" role="status">
                <span>{{ message }}</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-circle shrink-0 hover:bg-black/10 text-info-content"
                  aria-label="Fermer la notification"
                  @click="message = ''"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </Transition>

            <!-- Bouton d'action réinitialisation -->
            <button
              type="submit"
              class="btn btn-primary w-full text-base font-bold min-h-12 shadow-md rounded-xl mt-1 active:scale-98 transition-transform"
              :disabled="authLoading"
            >
              <span v-if="authLoading" class="loading loading-spinner loading-sm"></span>
              <span v-if="authLoading">Envoi en cours...</span>
              <span v-else>Envoyer le lien</span>
            </button>
          </form>
        </div>

        <!-- Mode standard : Onglets Connexion / Inscription -->
        <!-- Mode standard : Onglets Connexion / Inscription (Segmented Button M3) -->
        <template v-else>
          <div
            role="tablist"
            aria-label="Mode d'authentification"
            class="grid grid-cols-2 p-1 bg-base-200 border border-base-300 rounded-xl gap-1.5"
          >
            <button
              type="button"
              role="tab"
              :aria-selected="!isRegister"
              class="py-2.5 px-3 text-xs font-bold rounded-lg flex items-center justify-center cursor-pointer border border-transparent outline-none focus:outline-hidden focus-visible:ring-1 focus-visible:ring-primary/40 select-none transition-colors duration-150"
              :class="!isRegister
                ? 'bg-base-300 text-primary border-base-content/10 shadow-xs'
                : 'text-base-content/75 hover:text-base-content hover:bg-base-300/40 font-medium'"
              @click="isRegister = false; message = ''; authError = null"
            >
              Connexion
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="isRegister"
              class="py-2.5 px-3 text-xs font-bold rounded-lg flex items-center justify-center cursor-pointer border border-transparent outline-none focus:outline-hidden focus-visible:ring-1 focus-visible:ring-primary/40 select-none transition-colors duration-150"
              :class="isRegister
                ? 'bg-base-300 text-primary border-base-content/10 shadow-xs'
                : 'text-base-content/75 hover:text-base-content hover:bg-base-300/40 font-medium'"
              @click="isRegister = true; message = ''; authError = null"
            >
              Créer un compte
            </button>
          </div>

          <!-- Formulaire principal avec transition fluide -->
          <Transition name="auth-slide" mode="out-in">
            <form
              :key="isRegister ? 'register' : 'login'"
              class="flex flex-col gap-4"
              @submit.prevent="handleSubmit"
            >
            <!-- Nom complet uniquement lors de la création de compte -->
            <fieldset v-if="isRegister" class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold text-base-content/70">
                Nom et prénom
              </legend>
              <input
                id="reg-name"
                v-model="fullName"
                type="text"
                required
                autocomplete="name"
                autocapitalize="words"
                spellcheck="false"
                placeholder="Jean Dupont"
                class="input input-bordered w-full rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </fieldset>

            <!-- Email professionnel -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold text-base-content/70">
                Adresse email
              </legend>
              <input
                id="auth-email"
                v-model="email"
                type="email"
                autocomplete="email"
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                inputmode="email"
                required
                placeholder="jean.dupont@exemple.com"
                class="input input-bordered w-full rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </fieldset>

            <!-- Mot de passe avec bascule de visibilité -->
            <fieldset class="fieldset">
              <div class="flex items-center justify-between mb-1">
                <legend class="fieldset-legend text-xs font-semibold text-base-content/70 m-0 p-0">
                  Mot de passe
                </legend>
                <button
                  v-if="!isRegister"
                  type="button"
                  class="text-xs text-primary hover:underline font-medium transition-colors"
                  @click="isForgotPassword = true; message = ''; authError = null"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div class="relative flex items-center">
                <input
                  id="auth-pwd"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  :autocomplete="isRegister ? 'new-password' : 'current-password'"
                  autocapitalize="none"
                  autocorrect="off"
                  spellcheck="false"
                  required
                  placeholder="••••••••"
                  class="input input-bordered w-full rounded-xl text-sm pr-11 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  class="absolute right-3 p-1.5 text-base-content/50 hover:text-base-content transition-colors rounded-lg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
                  :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                  tabindex="-1"
                  @click="showPassword = !showPassword"
                >
                  <!-- Icône œil masqué -->
                  <svg
                    v-if="showPassword"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-4 h-4"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <!-- Icône œil visible -->
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-4 h-4"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </fieldset>

            <!-- Erreur d'authentification -->
            <Transition name="alert-fade">
              <div v-if="authError" class="alert alert-error text-xs py-2.5 rounded-xl flex items-center justify-between gap-2" role="alert">
                <span>{{ authError }}</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-circle shrink-0 hover:bg-black/10 text-error-content"
                  aria-label="Fermer le message d'erreur"
                  @click="authError = null"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </Transition>

            <!-- Message d'information -->
            <Transition name="alert-fade">
              <div v-if="message" class="alert alert-info text-xs py-2.5 rounded-xl flex items-center justify-between gap-2" role="status">
                <span>{{ message }}</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-circle shrink-0 hover:bg-black/10 text-info-content"
                  aria-label="Fermer la notification"
                  @click="message = ''"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </Transition>

            <!-- Bouton de soumission principal -->
            <button
              type="submit"
              class="btn btn-primary w-full text-base font-bold min-h-12 shadow-md rounded-xl mt-2 active:scale-98 transition-transform"
              :disabled="authLoading"
            >
              <span v-if="authLoading" class="loading loading-spinner loading-sm"></span>
              <span v-if="authLoading">Connexion en cours...</span>
              <span v-else-if="isRegister">Créer le compte</span>
              <span v-else>Se connecter</span>
            </button>

            <!-- Raccourci environnement de développement / démonstration -->
            <div v-if="isDev && !isRegister" class="text-center pt-2 border-t border-base-200 mt-1">
              <button
                type="button"
                class="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-primary/5 transition-colors"
                @click="fillAdminCredentials"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-3.5 h-3.5"
                  aria-hidden="true"
                >
                  <circle cx="7.5" cy="15.5" r="5.5" />
                  <path d="m21 2-9.6 9.6" />
                  <path d="m15.5 7.5 3 3L22 7l-3-3" />
                </svg>
                <span>Remplir avec le compte admin (test)</span>
              </button>
            </div>
          </form>
        </Transition>
      </template>
    </div>
  </div>
</div>
</template>

<style scoped>
/* Transition douce GPU-composited entre Connexion et Inscription */
.auth-slide-enter-active,
.auth-slide-leave-active {
  transition: opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1), transform 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.auth-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.auth-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Transition douce d'apparition et disparition des alertes (GPU-composited) */
.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.alert-fade-enter-from,
.alert-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
