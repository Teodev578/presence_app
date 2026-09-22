<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from './router'
import { useAuth } from './composables/useAuth'
import { useProfile } from './composables/useProfile'
import { useSyncEngine } from './composables/useSyncEngine'

// Layouts
import EmployeeLayout from './layouts/EmployeeLayout.vue'
import ManagerLayout from './layouts/ManagerLayout.vue'

// Vues
import LoginView from './views/auth/LoginView.vue'
import HomeView from './views/employee/HomeView.vue'
import CheckInView from './views/employee/CheckInView.vue'
import CheckOutView from './views/employee/CheckOutView.vue'
import EmployeeAvailabilitiesView from './views/employee/AvailabilitiesView.vue'

import DashboardView from './views/manager/DashboardView.vue'
import PresencesView from './views/manager/PresencesView.vue'
import ManagerAvailabilitiesView from './views/manager/AvailabilitiesView.vue'
import EmployeesView from './views/manager/EmployeesView.vue'
import TeamsView from './views/manager/TeamsView.vue'
import ExportView from './views/manager/ExportView.vue'

const { route, navigate } = useRouter()
const { session, user, authLoading, initAuth } = useAuth()
const { profile } = useProfile()
const { startSyncWatcher } = useSyncEngine()

onMounted(async () => {
  await initAuth()
  startSyncWatcher(() => user.value?.id)

  // Redirection initiale intelligente
  if (session.value) {
    if (route.value.path === '/' || route.value.path === '/login') {
      if (profile.value?.role === 'manager' || profile.value?.role === 'admin') {
        navigate('/manager')
      } else {
        navigate('/employee')
      }
    }
  }
})

// Détermination de la vue active
const isManagerRoute = computed(() => route.value.path.startsWith('/manager'))
const isAuthenticated = computed(() => !!session.value)
</script>

<template>
  <div v-if="authLoading" class="min-h-screen flex flex-col items-center justify-center gap-3 bg-base-200 text-base-content/70 font-medium">
    <span class="loading loading-spinner loading-lg text-primary"></span>
    <p class="text-sm">Chargement de PresenceApp...</p>
  </div>

  <!-- Cas 1 : Non authentifié ou page de login explicite -->
  <LoginView v-else-if="!isAuthenticated || route.path === '/login'" />

  <!-- Cas 2 : Espace Manager / Admin -->
  <ManagerLayout v-else-if="isManagerRoute">
    <Transition name="fade-slide" mode="out-in">
      <DashboardView v-if="route.path === '/manager'" />
      <PresencesView v-else-if="route.path === '/manager/presences'" />
      <ManagerAvailabilitiesView v-else-if="route.path === '/manager/availabilities'" />
      <EmployeesView v-else-if="route.path === '/manager/employees'" />
      <TeamsView v-else-if="route.path === '/manager/teams'" />
      <ExportView v-else-if="route.path === '/manager/export'" />
      <DashboardView v-else />
    </Transition>
  </ManagerLayout>

  <!-- Cas 3 : Espace Employé Mobile PWA -->
  <EmployeeLayout v-else>
    <Transition name="fade-slide" mode="out-in">
      <HomeView v-if="route.path === '/employee' || route.path === '/'" />
      <CheckInView v-else-if="route.path === '/employee/check-in'" />
      <CheckOutView v-else-if="route.path === '/employee/check-out'" />
      <EmployeeAvailabilitiesView v-else-if="route.path === '/employee/availabilities'" />
      <HomeView v-else />
    </Transition>
  </EmployeeLayout>
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
</style>
