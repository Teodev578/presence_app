<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from '../router'
import { useAuth } from '../composables/useAuth'
import { useProfile } from '../composables/useProfile'
import { useSyncEngine } from '../composables/useSyncEngine'
import ThemeToggle from '../components/shared/ThemeToggle.vue'

const { navigate } = useRouter()
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

const ROLE_LABELS = { employee: 'Employé', manager: 'Manager', admin: 'Administrateur' }
const roleLabel = computed(() => ROLE_LABELS[profile.value?.role] || 'Employé')

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

      <dl class="border-t border-base-300/60 pt-4">
        <div class="flex items-center justify-between rounded-m3-md bg-base-100 border border-base-300/60 px-3.5 py-2.5 min-h-11">
          <dt class="text-xs font-medium uppercase tracking-wide text-base-content/60">Rôle</dt>
          <dd class="text-sm font-semibold text-base-content">{{ roleLabel }}</dd>
        </div>
      </dl>
    </section>

    <!-- Synchronisation -->
    <section class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 flex flex-col gap-4">
      <h2 class="text-base font-semibold text-base-content">Synchronisation</h2>

      <div class="flex gap-3">
        <span class="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" :class="isOnline ? 'bg-success' : 'bg-warning'"></span>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-base-content">{{ isOnline ? 'En ligne' : 'Hors ligne' }}</p>
          <p class="text-xs text-base-content/60 mt-0.5">{{ syncLabel }}</p>
          <p class="text-xs text-base-content/60 mt-1">Dernière synchronisation : {{ lastSyncLabel }}</p>
        </div>
      </div>

      <button
        type="button"
        class="btn btn-primary rounded-m3-sm font-bold shadow-xs min-h-11 gap-2 self-start focus-visible:outline-2 focus-visible:outline-primary"
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

    <!-- Apparence -->
    <section class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 flex flex-col gap-4 md:col-span-2">
      <div>
        <h2 class="text-base font-semibold text-base-content">Apparence</h2>
        <p class="text-xs text-base-content/60 mt-0.5">Suivez le réglage du système ou forcez un thème clair ou sombre.</p>
      </div>
      <div class="max-w-md w-full">
        <ThemeToggle inline />
      </div>
    </section>

    <!-- Déconnexion -->
    <section class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 flex flex-col gap-3 md:col-span-2">
      <p class="text-xs text-base-content/60">Vous devrez saisir vos identifiants pour revenir.</p>
      <button
        type="button"
        class="btn btn-error btn-outline rounded-m3-sm font-bold min-h-11 gap-2 self-start focus-visible:outline-2 focus-visible:outline-error"
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
