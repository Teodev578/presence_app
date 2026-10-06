<script setup>
import { onMounted, computed, watch, defineAsyncComponent } from 'vue'
import { useRouter } from './router'
import { useAuth } from './composables/useAuth'
import { useProfile } from './composables/useProfile'
import { useSyncEngine } from './composables/useSyncEngine'
import { useNotifications } from './composables/useNotifications'
import { initPwaInstall } from './composables/usePwaInstall'

// Layouts statiques pour fondation immédiate
import EmployeeLayout from './layouts/EmployeeLayout.vue'
import ManagerLayout from './layouts/ManagerLayout.vue'
import ToastContainer from './components/shared/ToastContainer.vue'

// Vues asynchrones avec code-splitting automatique (chargées à la demande)
const LoginView = defineAsyncComponent(() => import('./views/auth/LoginView.vue'))
const HomeView = defineAsyncComponent(() => import('./views/employee/HomeView.vue'))
const CheckInView = defineAsyncComponent(() => import('./views/employee/CheckInView.vue'))
const CheckOutView = defineAsyncComponent(() => import('./views/employee/CheckOutView.vue'))
const EmployeeAvailabilitiesView = defineAsyncComponent(() => import('./views/employee/AvailabilitiesView.vue'))
const PendingApprovalView = defineAsyncComponent(() => import('./views/employee/PendingApprovalView.vue'))
const ArchivedAccountView = defineAsyncComponent(() => import('./views/employee/ArchivedAccountView.vue'))

const DashboardView = defineAsyncComponent(() => import('./views/manager/DashboardView.vue'))
const LocationsView = defineAsyncComponent(() => import('./views/manager/LocationsView.vue'))
const PresencesView = defineAsyncComponent(() => import('./views/manager/PresencesView.vue'))
const ManagerAvailabilitiesView = defineAsyncComponent(() => import('./views/manager/AvailabilitiesView.vue'))
const EmployeesView = defineAsyncComponent(() => import('./views/manager/EmployeesView.vue'))
const TeamsView = defineAsyncComponent(() => import('./views/manager/TeamsView.vue'))
const ExportView = defineAsyncComponent(() => import('./views/manager/ExportView.vue'))
const SettingsView = defineAsyncComponent(() => import('./views/SettingsView.vue'))

const { route, navigate } = useRouter()
const { session, user, authInitializing, initAuth } = useAuth()
const { profile, profileLoading, fetchProfile } = useProfile()
const { startSyncWatcher } = useSyncEngine()
const { unreadCount } = useNotifications()

// Titre d'onglet dynamique : Présence sobre sans description, enrichi du décompte des notifications non lues façon YouTube
watch(unreadCount, (count) => {
  const n = Number(count) || 0
  if (n > 0) {
    document.title = `(${n}) PresenceApp`
  } else {
    document.title = 'PresenceApp'
  }
}, { immediate: true })

onMounted(async () => {
  initPwaInstall()
  await initAuth()
  startSyncWatcher(() => user.value?.id)

  // Redirection initiale intelligente une fois la session et le profil résolus
  if (session.value) {
    const resolvedProfile = await fetchProfile()
    const role = resolvedProfile?.role || user.value?.user_metadata?.role

    if (route.value.path === '/' || route.value.path === '/login') {
      if (role === 'manager' || role === 'admin') {
        navigate('/manager')
      } else {
        navigate('/employee')
      }
    }
  } else {
    // Normalisation proactive : diriger immédiatement un visiteur non authentifié vers /login
    if (route.value.path === '/') {
      navigate('/login')
    }
  }
})

const isManager = computed(() => {
  const role = profile.value?.role || user.value?.user_metadata?.role
  return role === 'manager' || role === 'admin'
})
const isManagerRoute = computed(() => route.value.path.startsWith('/manager') && isManager.value)
const isAuthenticated = computed(() => !!session.value)
const isArchived = computed(() => {
  return profile.value?.status === 'archived' || profile.value?.status === 'disabled'
})
const isPendingApproval = computed(() => {
  if (isManager.value) return false
  return profile.value?.status === 'pending_validation'
})

// Garde de navigation : interdit l'accès manager/dashboard aux employés seulement après confirmation du profil
watch([() => route.value.path, isManager, () => profile.value, profileLoading], () => {
  if (
    route.value.path.startsWith('/manager') &&
    !profileLoading.value &&
    profile.value &&
    !isManager.value
  ) {
    navigate('/employee')
  }
})
</script>

<template>
  <!-- Transition entre espaces et états d'authentification (GPU : opacity + transform) -->
  <Transition name="space" mode="out-in">
  <!-- Écran de chargement pendant l'authentification initiale et la résolution du profil -->
  <div
    v-if="authInitializing || (isAuthenticated && !profile && profileLoading)"
    key="loading"
    class="w-full min-h-screen min-h-dvh flex flex-col items-center justify-center gap-4 bg-base-100 text-base-content font-medium p-4 select-none"
  >
    <div class="w-16 h-16 rounded-m3-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-8 h-8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    </div>
    <div class="flex flex-col items-center gap-1 text-center">
      <h1 class="text-xl font-black tracking-tight text-base-content">PresenceApp</h1>
      <p class="text-xs text-base-content/60">Initialisation de votre espace sécurisé...</p>
    </div>
    <span class="loading loading-spinner loading-md text-primary mt-1"></span>
  </div>

  <!-- Cas 1 : Non authentifié ou page de login explicite -->
  <LoginView v-else-if="!isAuthenticated || route.path === '/login'" key="login" />

  <!-- Cas 2 : Compte archivé ou désactivé (accès opérationnel hermétiquement suspendu) -->
  <ArchivedAccountView v-else-if="isArchived" key="archived" />

  <!-- Cas 3 : Page explicite de récapitulatif de validation (accès direct à l'espace par défaut) -->
  <PendingApprovalView v-else-if="route.path === '/pending-approval'" key="pending" />

  <!-- Cas 4 : Espace Manager / Admin actif -->
  <ManagerLayout v-else-if="isManagerRoute" key="manager">
    <Transition name="fade-slide" mode="out-in">
      <DashboardView v-if="route.path === '/manager'" />
      <LocationsView v-else-if="route.path === '/manager/locations'" />
      <PresencesView v-else-if="route.path === '/manager/presences'" />
      <ManagerAvailabilitiesView v-else-if="route.path === '/manager/availabilities'" />
      <EmployeesView v-else-if="route.path === '/manager/employees'" />
      <TeamsView v-else-if="route.path === '/manager/teams'" />
      <ExportView v-else-if="route.path === '/manager/export'" />
      <SettingsView v-else-if="route.path === '/manager/settings'" />
      <DashboardView v-else />
    </Transition>
  </ManagerLayout>

  <!-- Cas 5 : Espace Collaborateur Mobile PWA validé et actif -->
  <EmployeeLayout v-else key="employee">
    <Transition name="fade-slide" mode="out-in">
      <HomeView v-if="route.path === '/employee' || route.path === '/'" />
      <CheckInView v-else-if="route.path === '/employee/check-in'" />
      <CheckOutView v-else-if="route.path === '/employee/check-out'" />
      <EmployeeAvailabilitiesView v-else-if="route.path === '/employee/availabilities'" />
      <SettingsView v-else-if="route.path === '/employee/settings'" />
      <HomeView v-else />
    </Transition>
  </EmployeeLayout>
  </Transition>

  <!-- Conteneur global de notifications Toast -->
  <ToastContainer />
</template>

<style>
/* Transition fluide entre les routes (GPU accelerated: opacity + transform) */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Transition entre les espaces : fondu court et glissement vertical léger, sur la courbe
   Emphasized de Material 3. Seules opacity et transform sont animées, la réduction de
   mouvement du système neutralise la durée. */
.space-enter-active,
.space-leave-active {
  transition: opacity 250ms cubic-bezier(0.2, 0, 0, 1), transform 250ms cubic-bezier(0.2, 0, 0, 1);
  will-change: opacity, transform;
}

.space-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.space-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
