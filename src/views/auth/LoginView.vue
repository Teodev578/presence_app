<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from '../../router'
import { useAuth } from '../../composables/useAuth'
import { useProfile } from '../../composables/useProfile'

const { navigate } = useRouter()
const { signIn, signUp, authLoading, authError } = useAuth()
const { profile, fetchProfile } = useProfile()

const isRegister = ref(false)
const email = ref('')
const password = ref('')
const fullName = ref('')
const showPassword = ref(false)
const message = ref('')
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const isDev = import.meta.env.DEV

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})

const fillAdminCredentials = () => {
  email.value = 'ultimateadmin@email.com'
  password.value = 'AdminPresence2026!'
  message.value = 'Identifiants Administrateur appliqués.'
}

const handleSubmit = async () => {
  message.value = ''

  if (!navigator.onLine) {
    message.value = 'Connexion impossible : vous êtes actuellement hors-ligne. Une connexion Internet est requise pour vous authentifier.'
    return
  }

  const cleanEmail = email.value.trim().toLowerCase()
  const cleanPassword = password.value.trim()

  if (isRegister.value) {
    if (!fullName.value.trim()) {
      message.value = 'Veuillez saisir votre nom complet.'
      return
    }
    const { error } = await signUp(
      cleanEmail,
      cleanPassword,
      fullName.value.trim(),
      'employee'
    )
    if (error) return

    message.value = 'Compte créé avec succès. Vous pouvez maintenant vous connecter.'
    isRegister.value = false
  } else {
    const { data, error } = await signIn(cleanEmail, cleanPassword)
    if (error) return

    const userProfile = await fetchProfile()
    const role = userProfile?.role || profile.value?.role || data?.user?.user_metadata?.role

    // Routage strict et automatique fondé sur le rôle résolu
    if (role === 'admin' || role === 'manager') {
      navigate('/manager')
    } else {
      navigate('/employee')
    }
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-base-200">
    <div class="card bg-base-100 shadow-xl border border-base-300 w-full max-w-md">
      <div class="card-body p-6 sm:p-8 gap-5">
        <!-- Logo vectoriel et En-tête de marque -->
        <div class="text-center flex flex-col items-center">
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
            Pointage géolocalisé, résilience hors-ligne et gestion des disponibilités
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
          <span>Vous êtes hors-ligne. Une connexion Internet est requise pour vous authentifier la première fois.</span>
        </div>

        <!-- Onglets Connexion / Inscription -->
        <div class="tabs tabs-box grid grid-cols-2 p-1 bg-base-200 rounded-xl">
          <button
            type="button"
            class="tab text-xs font-bold rounded-lg transition-all"
            :class="{ 'tab-active bg-base-100 shadow-xs text-primary': !isRegister }"
            @click="isRegister = false; message = ''; authError = null"
          >
            Connexion
          </button>
          <button
            type="button"
            class="tab text-xs font-bold rounded-lg transition-all"
            :class="{ 'tab-active bg-base-100 shadow-xs text-primary': isRegister }"
            @click="isRegister = true; message = ''; authError = null"
          >
            Créer un compte
          </button>
        </div>

        <!-- Formulaire principal -->
        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <!-- Nom complet uniquement lors de la création de compte -->
          <fieldset v-if="isRegister" class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold text-base-content/70">
              Nom complet :
            </legend>
            <input
              id="reg-name"
              v-model="fullName"
              type="text"
              required
              autocomplete="name"
              autocapitalize="words"
              spellcheck="false"
              placeholder="Ex : Jean Dupont"
              class="input input-bordered w-full rounded-xl text-sm"
            />
          </fieldset>

          <!-- Email professionnel -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold text-base-content/70">
              Email professionnel :
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
              placeholder="jean.dupont@entreprise.fr"
              class="input input-bordered w-full rounded-xl text-sm"
            />
          </fieldset>

          <!-- Mot de passe avec bascule de visibilité -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold text-base-content/70">
              Mot de passe :
            </legend>
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
                class="input input-bordered w-full rounded-xl text-sm pr-11"
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
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </fieldset>

          <!-- Erreur d'authentification -->
          <div v-if="authError" class="alert alert-error text-xs py-2.5 rounded-xl">
            <span>{{ authError }}</span>
          </div>

          <!-- Message d'information -->
          <div v-if="message" class="alert alert-info text-xs py-2.5 rounded-xl">
            <span>{{ message }}</span>
          </div>

          <!-- Bouton de soumission principal -->
          <button
            type="submit"
            class="btn btn-primary w-full text-base font-bold min-h-12 shadow-md rounded-xl mt-2 active:scale-98 transition-transform"
            :disabled="authLoading"
          >
            <span v-if="authLoading" class="loading loading-spinner loading-sm"></span>
            <span v-if="authLoading">Authentification...</span>
            <span v-else-if="isRegister">Créer mon compte employé</span>
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
              <span>Pré-remplir avec le compte Administrateur (Dev)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
