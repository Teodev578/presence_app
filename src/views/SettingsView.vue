<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from '../router'
import { useAuth } from '../composables/useAuth'
import { useProfile } from '../composables/useProfile'
import { useSyncEngine } from '../composables/useSyncEngine'

const { currentPath, navigate } = useRouter()
const { user, signOut } = useAuth()
const { profile } = useProfile()
const { isSyncing, pendingCount, lastSyncTime, refreshPendingCount, syncNow } = useSyncEngine()

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

const isManagerSpace = computed(() => currentPath.value.startsWith('/manager'))
const homePath = computed(() => (isManagerSpace.value ? '/manager' : '/employee'))

const ROLE_LABELS = { employee: 'Employé', manager: 'Manager', admin: 'Administrateur' }
const roleLabel = computed(() => ROLE_LABELS[profile.value?.role] || 'Employé')

const lastSyncLabel = computed(() => {
  if (!lastSyncTime.value) return 'Jamais synchronisé'
  const date = new Date(lastSyncTime.value)
  if (Number.isNaN(date.getTime())) return 'Jamais synchronisé'
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
  <div class="flex flex-col gap-6 max-w-2xl">
    <!-- En-tête -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black tracking-tight text-base-content flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </div>
          <span>Paramètres</span>
        </h1>
        <p class="text-xs text-base-content/60 mt-0.5">Synchronisation, compte et déconnexion</p>
      </div>

      <button
        type="button"
        class="btn btn-outline rounded-m3-sm font-bold min-h-11 gap-2 px-3"
        @click="navigate(homePath)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Retour</span>
      </button>
    </div>

    <!-- Synchronisation -->
    <section class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 flex flex-col gap-4">
      <h2 class="text-sm font-bold text-base-content">Synchronisation</h2>

      <div class="flex items-start gap-3">
        <span class="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" :class="isOnline ? 'bg-success' : 'bg-warning'"></span>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-base-content">{{ isOnline ? 'Connecté' : 'Hors ligne' }}</p>
          <p class="text-xs text-base-content/60 mt-0.5">{{ syncLabel }}</p>
          <p class="text-xs text-base-content/50 mt-1">Dernière synchronisation : {{ lastSyncLabel }}</p>
        </div>
      </div>

      <button
        type="button"
        class="btn btn-primary rounded-m3-sm font-bold shadow-xs min-h-11 gap-2 self-start"
        :disabled="isSyncing || !isOnline"
        @click="runSync"
      >
        <span v-if="isSyncing" class="loading loading-spinner loading-xs"></span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
        <span>Synchroniser maintenant</span>
      </button>
    </section>

    <!-- Compte -->
    <section class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 flex flex-col gap-4">
      <h2 class="text-sm font-bold text-base-content">Compte</h2>

      <div class="flex items-center gap-3">
        <div class="avatar placeholder shrink-0">
          <div class="bg-primary/15 text-primary rounded-full w-12 h-12 font-bold text-base flex items-center justify-center">
            <span>{{ (profile?.full_name || 'U').trim()[0].toUpperCase() }}</span>
          </div>
        </div>
        <div class="min-w-0">
          <p class="font-bold text-sm text-base-content truncate">{{ profile?.full_name || 'Mon compte' }}</p>
          <p class="text-xs text-base-content/60 truncate">{{ profile?.email || user?.email || 'Adresse inconnue' }}</p>
        </div>
      </div>

      <dl class="flex flex-col gap-2 text-sm border-t border-base-300/60 pt-4">
        <div class="flex items-center justify-between gap-3">
          <dt class="text-base-content/60">Rôle</dt>
          <dd class="font-semibold text-base-content">{{ roleLabel }}</dd>
        </div>
        <div class="flex items-center justify-between gap-3">
          <dt class="text-base-content/60">Espace</dt>
          <dd class="font-semibold text-base-content">{{ isManagerSpace ? 'Gestionnaire' : 'Collaborateur' }}</dd>
        </div>
      </dl>
    </section>

    <!-- Déconnexion -->
    <section class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 flex flex-col gap-3">
      <h2 class="text-sm font-bold text-base-content">Déconnexion</h2>
      <p class="text-xs text-base-content/60">Vous devrez saisir vos identifiants pour revenir.</p>
      <button
        type="button"
        class="btn btn-error btn-outline rounded-m3-sm font-bold min-h-11 gap-2 self-start"
        :disabled="isSigningOut"
        @click="handleLogout"
      >
        <span v-if="isSigningOut" class="loading loading-spinner loading-xs"></span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Se déconnecter</span>
      </button>
    </section>
  </div>
</template>
