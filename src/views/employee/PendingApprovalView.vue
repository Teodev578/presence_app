<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useProfile } from '../../composables/useProfile'
import ConfirmModal from '../../components/shared/ConfirmModal.vue'
import NotificationBell from '../../components/shared/NotificationBell.vue'
import SyncAlert from '../../components/shared/SyncAlert.vue'

const { signOut, user } = useAuth()
const { profile, fetchProfile, profileLoading } = useProfile()

const isChecking = ref(false)
const showLogoutModal = ref(false)

const handleCheckStatus = async () => {
  isChecking.value = true
  try {
    await fetchProfile()
  } finally {
    setTimeout(() => {
      isChecking.value = false
    }, 600)
  }
}

const confirmLogout = async () => {
  showLogoutModal.value = false
  await signOut()
}

const createdAtFormatted = computed(() => {
  const d = profile.value?.created_at || user.value?.created_at
  if (!d) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(d))
  } catch {
    return ''
  }
})

const daysRemaining = computed(() => {
  const d = profile.value?.created_at || user.value?.created_at
  if (!d) return 7
  try {
    const createdTime = new Date(d).getTime()
    const expiryTime = createdTime + 7 * 24 * 60 * 60 * 1000
    const diffDays = Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000))
    return Math.max(0, diffDays)
  } catch {
    return 7
  }
})
</script>

<template>
  <div class="min-h-screen bg-base-200 flex flex-col justify-between">
    <!-- Barre supérieure de navigation avec statut réseau et cloche de notification -->
    <header class="navbar bg-base-100/90 backdrop-blur-md border-b border-base-300 px-4 sm:px-6 min-h-14 lg:min-h-16 sticky top-0 z-30 justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M14 11l2 2 4-4" />
          </svg>
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-base tracking-tight text-base-content">PresenceApp</span>
          <span class="badge badge-primary badge-xs uppercase font-bold tracking-wider">Espace Collaborateur</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <SyncAlert />
        <NotificationBell />
      </div>
    </header>

    <!-- Conteneur centré de la carte d'attente d'activation -->
    <main class="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div class="w-full max-w-lg bg-base-100 rounded-m3-xl border border-base-300 p-6 sm:p-8 space-y-6">
        
        <!-- En-tête avec icône d'horloge / sablier sobre -->
        <div class="flex flex-col items-center text-center space-y-3">
          <div class="w-16 h-16 rounded-m3-lg bg-primary/10 text-primary flex items-center justify-center">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span class="inline-block px-3 py-1 rounded-m3-xs text-xs font-semibold bg-warning/15 text-warning mb-2">
              Compte en attente de confirmation
            </span>
            <h1 class="text-xl sm:text-2xl font-bold text-base-content">
              Bienvenue dans PresenceApp
            </h1>
            <p class="text-sm text-base-content/70 mt-1 max-w-sm mx-auto">
              Votre inscription a bien été enregistrée. Un responsable d'équipe doit confirmer votre profil avant que vous ne puissiez commencer vos pointages.
            </p>
          </div>
        </div>

        <!-- Récapitulatif des informations du compte -->
        <div class="bg-base-200 rounded-m3-md p-4 space-y-2 border border-base-300/60 text-sm">
          <div class="flex items-center justify-between py-1 border-b border-base-300/40">
            <span class="text-base-content/60">Collaborateur</span>
            <span class="font-medium text-base-content">{{ profile?.full_name || 'Non renseigné' }}</span>
          </div>
          <div class="flex items-center justify-between py-1 border-b border-base-300/40">
            <span class="text-base-content/60">Adresse email</span>
            <span class="font-medium text-base-content">{{ profile?.email || user?.email }}</span>
          </div>
          <div v-if="createdAtFormatted" class="flex items-center justify-between py-1">
            <span class="text-base-content/60">Date d'inscription</span>
            <span class="font-medium text-base-content">{{ createdAtFormatted }}</span>
          </div>
        </div>

        <!-- Encart d'information sur la règle des 7 jours et sollicitation des supérieurs -->
        <div class="bg-warning/10 border border-warning/30 rounded-m3-md p-3.5 flex items-start gap-3 text-xs text-base-content/80">
          <svg class="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="space-y-1">
            <p>
              Si votre compte n'est pas activé dans un délai de
              <strong class="font-semibold text-base-content">{{ daysRemaining }} jour{{ daysRemaining > 1 ? 's' : '' }}</strong>,
              il sera automatiquement supprimé par mesure de sécurité.
            </p>
            <p class="font-medium text-base-content/90">
              Pensez à solliciter vos supérieurs pour l'activation de votre compte.
            </p>
          </div>
        </div>

        <!-- Actions : Actualiser le statut & Déconnexion -->
        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            class="btn btn-primary flex-1 min-h-11 rounded-m3-md gap-2"
            :disabled="isChecking || profileLoading"
            @click="handleCheckStatus"
          >
            <span v-if="isChecking || profileLoading" class="loading loading-spinner loading-sm" aria-hidden="true"></span>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{{ isChecking ? 'Vérification...' : 'Actualiser le statut' }}</span>
          </button>

          <button
            type="button"
            class="btn btn-outline min-h-11 rounded-m3-md gap-2"
            @click="showLogoutModal = true"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>
    </main>

    <!-- Pied de page minimaliste -->
    <footer class="py-3 text-center text-xs text-base-content/50">
      PresenceApp · Gestion des présences d'équipe
    </footer>

    <!-- Modale de confirmation de déconnexion -->
    <ConfirmModal
      :open="showLogoutModal"
      title="Déconnexion"
      message="Souhaitez-vous fermer votre session ? Vous pourrez vous reconnecter pour vérifier l'état de confirmation de votre profil."
      confirm-text="Se déconnecter"
      cancel-text="Annuler"
      @confirm="confirmLogout"
      @cancel="showLogoutModal = false"
    />
  </div>
</template>
