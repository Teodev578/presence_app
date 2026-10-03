<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useProfile } from '../../composables/useProfile'
import { useSyncEngine } from '../../composables/useSyncEngine'
import { useToast } from '../../composables/useToast'
import NotificationBell from '../../components/shared/NotificationBell.vue'
import SyncAlert from '../../components/shared/SyncAlert.vue'

const { signOut, user } = useAuth()
const { profile, fetchProfile, profileLoading } = useProfile()
const { syncNow } = useSyncEngine()
const { success: toastSuccess, info: toastInfo, error: toastError } = useToast()

const isChecking = ref(false)
const isLoggingOut = ref(false)

const handleCheckStatus = async () => {
  isChecking.value = true
  try {
    if (user.value?.id) {
      await syncNow(user.value.id)
    }
    const updated = await fetchProfile()
    if (updated?.status === 'active') {
      toastSuccess('Votre profil a été réactivé.')
    } else {
      toastInfo('Profil toujours en attente de réactivation par la direction.')
    }
  } catch {
    toastError('Impossible de joindre le serveur. Connexion réseau requise.')
  } finally {
    setTimeout(() => {
      isChecking.value = false
    }, 600)
  }
}

const handleLogout = async () => {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  try {
    await signOut()
  } catch {
    toastError('Impossible de finaliser la déconnexion distante.')
  } finally {
    isLoggingOut.value = false
  }
}

const archivedAtFormatted = computed(() => {
  const d = profile.value?.archived_at || profile.value?.updated_at
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

const isDisabled = computed(() => profile.value?.status === 'disabled')

const daysRemaining = computed(() => {
  if (isDisabled.value) return 0
  const d = profile.value?.archived_at
  if (!d) return 30
  try {
    const archivedTime = new Date(d).getTime()
    const expiryTime = archivedTime + 30 * 24 * 60 * 60 * 1000
    const diffDays = Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000))
    return Math.max(0, diffDays)
  } catch {
    return 30
  }
})
</script>

<template>
  <div class="h-dvh max-h-screen bg-base-200 flex flex-col overflow-hidden">
    <!-- Barre supérieure de navigation avec statut réseau et cloche de notification -->
    <header class="navbar shrink-0 bg-base-100/90 backdrop-blur-md border-b border-base-300 px-3 sm:px-6 min-h-12 sm:min-h-14 z-30 justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-m3-sm bg-neutral/10 border border-neutral/20 flex items-center justify-center text-base-content/70">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true">
            <path d="M21 8v13H3V8" />
            <path d="M1 3h22v5H1z" />
            <path d="M10 12h4" />
          </svg>
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-sm sm:text-base tracking-tight text-base-content">PresenceApp</span>
          <span class="badge badge-neutral badge-xs uppercase font-bold tracking-wider">Espace Collaborateur</span>
        </div>
      </div>

      <div class="flex items-center gap-1.5 sm:gap-2">
        <SyncAlert />
        <NotificationBell />
      </div>
    </header>

    <!-- Conteneur principal fluide avec défilement vertical propre sur écrans étroits et logique onepage-first -->
    <main class="flex-1 min-h-0 overflow-y-auto px-2 sm:px-4 md:px-6 py-2 sm:py-4 flex flex-col items-center">
      <div class="my-auto w-full max-w-lg md:max-w-xl lg:max-w-2xl bg-base-100 rounded-m3-xl border border-base-300 p-3.5 sm:p-5 md:p-6 space-y-2.5 sm:space-y-3.5 md:space-y-4 shadow-sm">
        
        <!-- En-tête avec icône d'archive sobre -->
        <div class="flex flex-col items-center text-center space-y-1.5 sm:space-y-2">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-m3-lg bg-neutral/10 text-base-content/80 flex items-center justify-center">
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <span class="inline-block px-2 py-0.5 rounded-m3-xs text-xs font-semibold bg-neutral/15 text-base-content mb-0.5">
              {{ isDisabled ? 'Compte désactivé' : 'Compte archivé' }}
            </span>
            <h1 class="text-base sm:text-lg md:text-xl font-bold tracking-tight text-base-content">
              {{ isDisabled ? 'Profil en sommeil' : 'Profil actuellement archivé' }}
            </h1>
            <p class="text-xs sm:text-sm text-base-content/70 mt-0.5 max-w-md mx-auto leading-relaxed">
              {{ isDisabled 
                ? 'La période d\'archivage de 30 jours est arrivée à échéance. L\'accès opérationnel est clos, mais vos données historiques demeurent protégées.' 
                : 'Votre profil a été placé en archivage temporaire. Les pointages et accès opérationnels sont pour le moment suspendus.' 
              }}
            </p>
          </div>
        </div>

        <!-- Récapitulatif des informations du compte -->
        <div class="bg-base-200/70 rounded-m3-md p-2.5 sm:p-3.5 space-y-1 sm:space-y-1.5 border border-base-300/60 text-xs sm:text-sm">
          <div class="flex items-center justify-between py-0.5 border-b border-base-300/40">
            <span class="text-base-content/60">Collaborateur</span>
            <span class="font-medium text-base-content truncate ml-2">{{ profile?.full_name || 'Non renseigné' }}</span>
          </div>
          <div class="flex items-center justify-between py-0.5 border-b border-base-300/40">
            <span class="text-base-content/60">Adresse email</span>
            <span class="font-medium text-base-content truncate ml-2">{{ profile?.email || user?.email }}</span>
          </div>
          <div v-if="archivedAtFormatted" class="flex items-center justify-between py-0.5 border-b border-base-300/40">
            <span class="text-base-content/60">Date d'archivage</span>
            <span class="font-medium text-base-content ml-2">{{ archivedAtFormatted }}</span>
          </div>
          <div class="flex items-center justify-between py-0.5">
            <span class="text-base-content/60">Données historiques</span>
            <span class="inline-flex items-center gap-1 text-xs font-medium text-success">
              <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Préservées intégralement
            </span>
          </div>
        </div>

        <!-- Encart d'information sur la période de grâce des 30 jours -->
        <div v-if="!isDisabled" class="bg-info/10 border border-info/25 rounded-m3-md p-2.5 sm:p-3 flex items-start gap-2 sm:gap-2.5 text-xs text-base-content/85">
          <svg class="w-4 h-4 text-info shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="space-y-0.5">
            <p>
              Délai de rétractation : il reste
              <strong class="font-semibold text-base-content">{{ daysRemaining }} jour{{ daysRemaining > 1 ? 's' : '' }}</strong>
              avant la désactivation définitive du profil.
            </p>
            <p class="font-medium text-base-content/90">
              Pour réactiver votre profil ou si cette situation est imprévue, rapprochez-vous de votre responsable d'équipe ou de la direction.
            </p>
          </div>
        </div>

        <div v-else class="bg-base-300/40 border border-base-300 rounded-m3-md p-2.5 sm:p-3 flex items-start gap-2 sm:gap-2.5 text-xs text-base-content/85">
          <svg class="w-4 h-4 text-base-content/60 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p class="font-medium text-base-content/90">
            Votre compte est clos. Seule la direction ou un gestionnaire peut procéder à une réactivation manuelle de votre accès.
          </p>
        </div>

        <!-- Actions : Actualiser le statut & Déconnexion -->
        <div class="flex flex-col sm:flex-row gap-2 sm:gap-2.5 pt-0.5">
          <button
            type="button"
            class="btn btn-primary flex-1 min-h-11 rounded-m3-md gap-2 text-xs sm:text-sm font-medium"
            :disabled="isChecking || profileLoading"
            @click="handleCheckStatus"
          >
            <span v-if="isChecking || profileLoading" class="loading loading-spinner loading-sm" aria-hidden="true"></span>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Vérifier le statut
          </button>

          <button
            type="button"
            class="btn btn-outline btn-error min-h-11 rounded-m3-md gap-2 text-xs sm:text-sm font-medium sm:min-w-36 active:scale-95 transition-transform duration-150 motion-reduce:transform-none"
            :disabled="isLoggingOut || isChecking"
            @click="handleLogout"
          >
            <span v-if="isLoggingOut" class="loading loading-spinner loading-sm" aria-hidden="true"></span>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{{ isLoggingOut ? 'Déconnexion...' : 'Se déconnecter' }}</span>
          </button>
        </div>

      </div>
    </main>
  </div>
</template>
