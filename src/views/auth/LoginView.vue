<script setup>
import { ref } from 'vue'
import { useRouter } from '../../router'
import { useAuth } from '../../composables/useAuth'
import { useProfile } from '../../composables/useProfile'

const { navigate } = useRouter()
const { signIn, signUp, authLoading, authError } = useAuth()
const { fetchProfile } = useProfile()

const isRegister = ref(false)
const email = ref('')
const password = ref('')
const fullName = ref('')
const selectedRole = ref('employee')
const message = ref('')

const handleSubmit = async () => {
  message.value = ''

  if (isRegister.value) {
    if (!fullName.value.trim()) {
      message.value = 'Veuillez saisir votre nom complet.'
      return
    }
    const { data, error } = await signUp(
      email.value,
      password.value,
      fullName.value.trim(),
      selectedRole.value
    )
    if (error) return

    message.value = 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.'
    isRegister.value = false
  } else {
    const { data, error } = await signIn(email.value, password.value)
    if (error) return

    await fetchProfile()
    if (selectedRole.value === 'manager' || selectedRole.value === 'admin') {
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
        <!-- Logo et Titre -->
        <div class="text-center flex flex-col items-center">
          <span class="text-4xl mb-1">⏱️</span>
          <h1 class="text-2xl font-black tracking-tight text-base-content">PresenceApp</h1>
          <p class="text-xs text-base-content/60 mt-1 max-w-xs">
            Pointage géolocalisé, résilience hors-ligne et gestion des disponibilités
          </p>
        </div>

        <!-- Onglets Connexion / Inscription -->
        <div class="tabs tabs-box grid grid-cols-2 p-1 bg-base-200 rounded-xl">
          <button
            type="button"
            class="tab text-xs font-bold rounded-lg transition-all"
            :class="{ 'tab-active bg-base-100 shadow-xs text-primary': !isRegister }"
            @click="isRegister = false; message = ''"
          >
            Connexion
          </button>
          <button
            type="button"
            class="tab text-xs font-bold rounded-lg transition-all"
            :class="{ 'tab-active bg-base-100 shadow-xs text-primary': isRegister }"
            @click="isRegister = true; message = ''"
          >
            Créer un compte
          </button>
        </div>

        <!-- Formulaire -->
        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <div v-if="isRegister" class="fieldset">
            <label for="reg-name" class="fieldset-legend text-xs font-semibold text-base-content/70">
              Nom complet :
            </label>
            <input
              id="reg-name"
              v-model="fullName"
              type="text"
              required
              placeholder="Ex : Jean Dupont"
              class="input input-bordered w-full rounded-xl text-sm"
            />
          </div>

          <div class="fieldset">
            <label for="auth-email" class="fieldset-legend text-xs font-semibold text-base-content/70">
              Email professionnel :
            </label>
            <input
              id="auth-email"
              v-model="email"
              type="email"
              required
              placeholder="jean.dupont@entreprise.fr"
              class="input input-bordered w-full rounded-xl text-sm"
            />
          </div>

          <div class="fieldset">
            <label for="auth-pwd" class="fieldset-legend text-xs font-semibold text-base-content/70">
              Mot de passe :
            </label>
            <input
              id="auth-pwd"
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="input input-bordered w-full rounded-xl text-sm"
            />
          </div>

          <div v-if="isRegister" class="fieldset">
            <label for="reg-role" class="fieldset-legend text-xs font-semibold text-base-content/70">
              Rôle d'accès :
            </label>
            <select id="reg-role" v-model="selectedRole" class="select select-bordered w-full rounded-xl text-sm">
              <option value="employee">Employé (Mobile PWA)</option>
              <option value="manager">Manager (Dashboard Web)</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <div v-if="authError" class="alert alert-error text-xs py-2.5 rounded-xl">
            <span>{{ authError }}</span>
          </div>

          <div v-if="message" class="alert alert-info text-xs py-2.5 rounded-xl">
            <span>{{ message }}</span>
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full text-base font-bold min-h-12 shadow-md rounded-xl mt-2 active:scale-98 transition-transform"
            :disabled="authLoading"
          >
            <span v-if="authLoading" class="loading loading-spinner loading-sm"></span>
            <span v-if="authLoading">Traitement...</span>
            <span v-else-if="isRegister">Créer mon profil</span>
            <span v-else>Se connecter</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
