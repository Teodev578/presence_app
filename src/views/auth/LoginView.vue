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
    // Redirection automatique
    if (selectedRole.value === 'manager' || selectedRole.value === 'admin') {
      navigate('/manager')
    } else {
      navigate('/employee')
    }
  }
}
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <div class="auth-header">
        <div class="app-icon">⏱️</div>
        <h1 class="auth-title">PresenceApp</h1>
        <p class="auth-subtitle">
          Pointage géolocalisé, résilience hors-ligne et gestion des disponibilités
        </p>
      </div>

      <div class="auth-tabs">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: !isRegister }"
          @click="isRegister = false; message = ''"
        >
          Connexion
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: isRegister }"
          @click="isRegister = true; message = ''"
        >
          Créer un compte
        </button>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div v-if="isRegister" class="form-group">
          <label for="reg-name" class="form-label">Nom complet :</label>
          <input
            id="reg-name"
            v-model="fullName"
            type="text"
            required
            placeholder="Ex : Jean Dupont"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="auth-email" class="form-label">Email professionnel :</label>
          <input
            id="auth-email"
            v-model="email"
            type="email"
            required
            placeholder="jean.dupont@entreprise.fr"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="auth-pwd" class="form-label">Mot de passe :</label>
          <input
            id="auth-pwd"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="form-input"
          />
        </div>

        <div v-if="isRegister" class="form-group">
          <label for="reg-role" class="form-label">Rôle d'accès :</label>
          <select id="reg-role" v-model="selectedRole" class="form-input">
            <option value="employee">Employé (Mobile PWA)</option>
            <option value="manager">Manager (Dashboard Web)</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <div v-if="authError" class="alert-error">
          {{ authError }}
        </div>

        <div v-if="message" class="alert-info">
          {{ message }}
        </div>

        <button
          type="submit"
          class="submit-btn"
          :disabled="authLoading"
        >
          <span v-if="authLoading">Traitement...</span>
          <span v-else-if="isRegister">Créer mon profil</span>
          <span v-else>Se connecter</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 1.25rem;
  padding: 2.25rem 2rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.auth-header {
  text-align: center;
}

.app-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.auth-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.auth-subtitle {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0.35rem 0 0;
  line-height: 1.4;
}

.auth-tabs {
  display: flex;
  background: #f1f5f9;
  border-radius: 0.65rem;
  padding: 0.25rem;
}

.tab-btn {
  flex: 1;
  padding: 0.55rem;
  border: none;
  background: none;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.form-input {
  padding: 0.75rem 0.95rem;
  border-radius: 0.65rem;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
  color: #1e293b;
  background: #ffffff;
  transition: border-color 0.15s;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.65rem;
  border-radius: 0.5rem;
  font-size: 0.82rem;
  text-align: center;
}

.alert-info {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 0.65rem;
  border-radius: 0.5rem;
  font-size: 0.82rem;
  text-align: center;
}

.submit-btn {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 0.9rem;
  border-radius: 0.65rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background-color 0.15s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
