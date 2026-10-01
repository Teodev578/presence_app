<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from '../router'
import { useAuth } from '../composables/useAuth'
import { useProfile } from '../composables/useProfile'
import { useSyncEngine } from '../composables/useSyncEngine'
import { useToast } from '../composables/useToast'
import ThemeToggle from '../components/shared/ThemeToggle.vue'
import PwaInstallCard from '../components/shared/PwaInstallCard.vue'
import { useDevicePermissions } from '../composables/useDevicePermissions'

const { navigate } = useRouter()
const { user, signOut, changePassword } = useAuth()
const { success: toastSuccess, error: toastError } = useToast()
const { profile } = useProfile()
const { isSyncing, pendingCount, lastSyncTime, refreshPendingCount, syncNow } = useSyncEngine()
const {
  geoStatus,
  isRequestingGeo,
  storagePersisted,
  canPersistStorage,
  isRequestingStorage,
  requestGeoPermission,
  requestStoragePersistence,
} = useDevicePermissions()

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const isSigningOut = ref(false)

const setOnline = () => { isOnline.value = navigator.onLine }
onMounted(() => {
  window.addEventListener('online', setOnline)
  window.addEventListener('offline', setOnline)
  refreshPendingCount()
})
onUnmounted(() => {
  window.removeEventListener('online', setOnline)
  window.removeEventListener('offline', setOnline)
})

const ROLE_LABELS = { employee: 'Employé', manager: 'Manager', admin: 'Administrateur' }
const roleLabel = computed(() => ROLE_LABELS[profile.value?.role] || 'Employé')

const geoLabel = computed(() => {
  switch (geoStatus.value) {
    case 'granted': return 'Autorisé'
    case 'denied': return 'Bloqué'
    case 'unsupported': return 'Non supporté'
    default: return 'En attente'
  }
})

const geoBadgeClass = computed(() => {
  switch (geoStatus.value) {
    case 'granted': return 'badge-success'
    case 'denied': return 'badge-error'
    case 'unsupported': return 'badge-neutral'
    default: return 'badge-warning'
  }
})

const lastSyncLabel = computed(() => {
  if (!lastSyncTime.value) return 'Aucune synchronisation enregistrée'
  const date = new Date(lastSyncTime.value)
  if (Number.isNaN(date.getTime())) return 'Aucune synchronisation enregistrée'
  return date.toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
})

const syncLabel = computed(() => {
  if (isSyncing.value) return 'Synchronisation en cours...'
  if (!isOnline.value) return 'Hors ligne : les modifications seront envoyées au retour du réseau.'
  if (pendingCount.value > 0) return `${pendingCount.value} modification${pendingCount.value > 1 ? 's' : ''} en attente d'envoi.`
  return 'Tout est synchronisé.'
})

const runSync = () => {
  if (!isOnline.value || isSyncing.value) return
  syncNow(user.value?.id)
}

const isChangingPassword = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordError = ref('')
const isSubmittingPassword = ref(false)

const openPasswordChange = () => {
  newPassword.value = ''
  confirmPassword.value = ''
  passwordError.value = ''
  showNewPassword.value = false
  showConfirmPassword.value = false
  isChangingPassword.value = true
}

const cancelPasswordChange = () => {
  newPassword.value = ''
  confirmPassword.value = ''
  passwordError.value = ''
  showNewPassword.value = false
  showConfirmPassword.value = false
  isChangingPassword.value = false
}

const handlePasswordSubmit = async () => {
  passwordError.value = ''
  const trimmed = newPassword.value.trim()

  if (trimmed.length < 6) {
    passwordError.value = 'Le mot de passe doit comporter au moins 6 caractères.'
    return
  }

  if (trimmed !== confirmPassword.value.trim()) {
    passwordError.value = 'Les deux mots de passe ne correspondent pas.'
    return
  }

  isSubmittingPassword.value = true
  try {
    const { error, formattedMessage } = await changePassword(trimmed)
    if (error) {
      passwordError.value = formattedMessage || error.message || 'Impossible de mettre à jour le mot de passe.'
      toastError(passwordError.value)
      return
    }

    toastSuccess('Mot de passe mis à jour avec succès.')
    cancelPasswordChange()
  } finally {
    isSubmittingPassword.value = false
  }
}

const handleLogout = async () => {
  isSigningOut.value = true
  try {
    await signOut()
    navigate('/login')
  } finally {
    isSigningOut.value = false
  }
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
    <!-- Compte -->
    <section class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 flex flex-col gap-4">
      <h2 class="text-base font-semibold text-base-content">Compte</h2>

      <div class="flex items-center gap-3">
        <div class="avatar placeholder shrink-0" aria-hidden="true">
          <div class="bg-primary/15 text-primary rounded-full w-14 h-14 font-bold text-lg flex items-center justify-center ring-1 ring-primary/20">
            <span>{{ (profile?.full_name || 'U').trim()[0].toUpperCase() }}</span>
          </div>
        </div>
        <div class="min-w-0">
          <p class="text-base font-semibold text-base-content truncate">{{ profile?.full_name || 'Mon compte' }}</p>
          <p class="text-sm text-base-content/60 truncate">{{ profile?.email || user?.email || 'Adresse inconnue' }}</p>
        </div>
      </div>

      <dl class="border-t border-base-300/60 pt-4 flex flex-col gap-2.5">
        <div class="flex items-center justify-between rounded-m3-md bg-base-100 border border-base-300/60 px-3.5 py-2.5 min-h-11">
          <dt class="text-xs font-medium uppercase tracking-wide text-base-content/60">Rôle</dt>
          <dd class="text-sm font-semibold text-base-content">{{ roleLabel }}</dd>
        </div>
      </dl>

      <!-- Volet de modification du mot de passe -->
      <div
        v-if="isChangingPassword"
        class="rounded-m3-md bg-base-100 border border-base-300/60 p-3.5 flex flex-col gap-3 mt-auto"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span class="text-sm font-semibold text-base-content">Nouveau mot de passe</span>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-m3-xs text-base-content/60 hover:text-base-content min-h-11 px-2.5"
            @click="cancelPasswordChange"
          >
            Fermer
          </button>
        </div>

        <form class="flex flex-col gap-3" @submit.prevent="handlePasswordSubmit">
          <div class="form-control flex flex-col gap-1">
            <label class="text-xs font-medium text-base-content/70" for="settings-new-password">Nouveau mot de passe</label>
            <div class="relative flex items-center">
              <input
                id="settings-new-password"
                v-model="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                minlength="6"
                required
                autocomplete="new-password"
                placeholder="6 caractères minimum"
                class="input input-bordered w-full rounded-m3-sm min-h-11 pr-11 text-sm bg-base-200/50 border-base-300 focus-visible:outline-2 focus-visible:outline-primary"
              />
              <button
                type="button"
                class="btn btn-ghost btn-circle btn-sm absolute right-1 min-h-11 min-w-11 text-base-content/60 hover:text-base-content"
                :aria-label="showNewPassword ? 'Masquer le nouveau mot de passe' : 'Afficher le nouveau mot de passe'"
                @click="showNewPassword = !showNewPassword"
              >
                <svg v-if="showNewPassword" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                  <line x1="2" x2="22" y1="2" y2="22"></line>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-control flex flex-col gap-1">
            <label class="text-xs font-medium text-base-content/70" for="settings-confirm-password">Confirmer le mot de passe</label>
            <div class="relative flex items-center">
              <input
                id="settings-confirm-password"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                minlength="6"
                required
                autocomplete="new-password"
                placeholder="Répétez le mot de passe"
                class="input input-bordered w-full rounded-m3-sm min-h-11 pr-11 text-sm bg-base-200/50 border-base-300 focus-visible:outline-2 focus-visible:outline-primary"
              />
              <button
                type="button"
                class="btn btn-ghost btn-circle btn-sm absolute right-1 min-h-11 min-w-11 text-base-content/60 hover:text-base-content"
                :aria-label="showConfirmPassword ? 'Masquer la confirmation du mot de passe' : 'Afficher la confirmation du mot de passe'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                  <line x1="2" x2="22" y1="2" y2="22"></line>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>

          <p v-if="passwordError" class="text-xs text-error font-medium">
            {{ passwordError }}
          </p>

          <div class="flex items-center gap-2 pt-1">
            <button
              type="submit"
              class="btn btn-primary rounded-m3-sm font-bold min-h-11 flex-1 gap-2 focus-visible:outline-2 focus-visible:outline-primary"
              :disabled="isSubmittingPassword"
            >
              <span v-if="isSubmittingPassword" class="loading loading-spinner loading-xs"></span>
              <span>Enregistrer le mot de passe</span>
            </button>
            <button
              type="button"
              class="btn btn-ghost rounded-m3-sm font-semibold min-h-11 px-4"
              :disabled="isSubmittingPassword"
              @click="cancelPasswordChange"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>

      <!-- Bouton d'ouverture replié -->
      <button
        v-else
        type="button"
        class="btn btn-outline btn-primary rounded-m3-sm font-semibold min-h-11 gap-2 w-full mt-auto active:scale-95 transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-primary"
        @click="openPasswordChange"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Changer de mot de passe</span>
      </button>
    </section>

    <!-- Synchronisation -->
    <section class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 flex flex-col gap-4">
      <h2 class="text-base font-semibold text-base-content">Synchronisation</h2>

      <div class="rounded-m3-md bg-base-100 border border-base-300/60 p-3.5 flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="isOnline ? 'bg-success' : 'bg-warning'"></span>
            <span class="text-sm font-semibold text-base-content">{{ isOnline ? 'En ligne' : 'Hors ligne' }}</span>
          </div>
          <span
            class="badge badge-sm font-semibold"
            :class="isOnline ? (pendingCount > 0 ? 'badge-warning' : 'badge-success') : 'badge-neutral'"
          >
            {{ isOnline ? (pendingCount > 0 ? `${pendingCount} en attente` : 'À jour') : 'Hors ligne' }}
          </span>
        </div>
        <p class="text-xs text-base-content/60">{{ syncLabel }}</p>
        <p class="text-xs text-base-content/60">Dernière synchronisation : {{ lastSyncLabel }}</p>
      </div>

      <button
        type="button"
        class="btn btn-primary rounded-m3-sm font-bold shadow-xs min-h-11 w-full gap-2 mt-auto active:scale-95 transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-primary"
        :disabled="isSyncing || !isOnline"
        @click="runSync"
      >
        <span v-if="isSyncing" class="loading loading-spinner loading-xs"></span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
        <span>Synchroniser maintenant</span>
      </button>
    </section>

    <!-- Autorisations -->
    <section class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 flex flex-col gap-4">
      <h2 class="text-base font-semibold text-base-content">Autorisations</h2>

      <div class="flex flex-col gap-2.5">
        <!-- Position / GPS -->
        <div class="flex flex-col gap-2 rounded-m3-md bg-base-100 border border-base-300/60 p-3">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span class="text-sm font-semibold text-base-content">Votre position</span>
            </div>
            <span class="badge badge-sm font-semibold" :class="geoBadgeClass">
              {{ geoLabel }}
            </span>
          </div>

          <p class="text-xs text-base-content/60">
            <template v-if="geoStatus === 'granted'">
              Votre position est partagée pour détecter automatiquement votre lieu de pointage.
            </template>
            <template v-else-if="geoStatus === 'denied'">
              Accès bloqué. Pour réactiver, touchez l'icône de site dans la barre d'adresse du navigateur.
            </template>
            <template v-else-if="geoStatus === 'unsupported'">
              Votre appareil ne prend pas en charge la géolocalisation.
            </template>
            <template v-else>
              Utilisée pour vous situer automatiquement lors du pointage.
            </template>
          </p>

          <button
            v-if="geoStatus === 'prompt'"
            type="button"
            class="btn btn-primary rounded-m3-sm font-bold min-h-11 gap-2 w-full active:scale-95 transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-primary"
            :disabled="isRequestingGeo"
            @click="requestGeoPermission"
          >
            <span v-if="isRequestingGeo" class="loading loading-spinner loading-xs"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>Partager ma position</span>
          </button>
        </div>

        <!-- Stockage local persistant -->
        <div class="flex flex-col gap-2 rounded-m3-md bg-base-100 border border-base-300/60 p-3">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
                <path d="M3 12A9 3 0 0 0 21 12"></path>
              </svg>
              <span class="text-sm font-semibold text-base-content">Données hors connexion</span>
            </div>
            <span
              class="badge badge-sm font-semibold"
              :class="storagePersisted ? 'badge-success' : 'badge-neutral'"
            >
              {{ storagePersisted ? 'Protégé' : 'Basique' }}
            </span>
          </div>

          <p class="text-xs text-base-content/60">
            {{ storagePersisted ? 'Vos données restent sur l\'appareil même sans connexion prolongée.' : 'Le navigateur peut libérer de l\'espace si nécessaire.' }}
          </p>

          <button
            v-if="storagePersisted === false && canPersistStorage"
            type="button"
            class="btn btn-neutral btn-outline rounded-m3-sm font-semibold min-h-11 gap-2 w-full active:scale-95 transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-neutral"
            :disabled="isRequestingStorage"
            @click="requestStoragePersistence"
          >
            <span v-if="isRequestingStorage" class="loading loading-spinner loading-xs"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
              <path d="M3 12A9 3 0 0 0 21 12"></path>
            </svg>
            <span>Protéger mes données</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Apparence -->
    <section class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 flex flex-col gap-4">
      <div>
        <h2 class="text-base font-semibold text-base-content">Apparence</h2>
        <p class="text-xs text-base-content/60 mt-0.5">Suivez le réglage du système ou forcez un thème clair ou sombre.</p>
      </div>
      <div class="flex-1 max-w-md">
        <ThemeToggle inline />
      </div>
    </section>

    <!-- Application sur l'appareil (PWA) -->
    <PwaInstallCard />

    <!-- Déconnexion -->
    <section class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 flex flex-col gap-3 md:col-span-2">
      <p class="text-xs text-base-content/60">Vous devrez saisir vos identifiants pour revenir.</p>
      <button
        type="button"
        class="btn btn-error btn-outline rounded-m3-sm font-bold min-h-11 gap-2 w-full active:scale-95 transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-error"
        :disabled="isSigningOut"
        @click="handleLogout"
      >
        <span v-if="isSigningOut" class="loading loading-spinner loading-xs"></span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Se déconnecter</span>
      </button>
    </section>
  </div>
</template>
