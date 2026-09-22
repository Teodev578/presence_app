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
  <div v-if="authLoading" class="global-loader">
    <div class="spinner"></div>
    <p>Chargement de PresenceApp...</p>
  </div>

  <!-- Cas 1 : Non authentifié ou page de login explicite -->
  <LoginView v-else-if="!isAuthenticated || route.path === '/login'" />

  <!-- Cas 2 : Espace Manager / Admin -->
  <ManagerLayout v-else-if="isManagerRoute">
    <DashboardView v-if="route.path === '/manager'" />
    <PresencesView v-else-if="route.path === '/manager/presences'" />
    <ManagerAvailabilitiesView v-else-if="route.path === '/manager/availabilities'" />
    <EmployeesView v-else-if="route.path === '/manager/employees'" />
    <TeamsView v-else-if="route.path === '/manager/teams'" />
    <ExportView v-else-if="route.path === '/manager/export'" />
    <DashboardView v-else />
  </ManagerLayout>

  <!-- Cas 3 : Espace Employé Mobile PWA -->
  <EmployeeLayout v-else>
    <HomeView v-if="route.path === '/employee' || route.path === '/'" />
    <CheckInView v-else-if="route.path === '/employee/check-in'" />
    <CheckOutView v-else-if="route.path === '/employee/check-out'" />
    <EmployeeAvailabilitiesView v-else-if="route.path === '/employee/availabilities'" />
    <HomeView v-else />
  </EmployeeLayout>
</template>

<style>
/* Reset global et tokens visuels */
:root {
  --bg-app: #f8fafc;
  --bg-card: #ffffff;
  --bg-subtle: #f1f5f9;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  background-color: var(--bg-app);
  color: var(--text-main);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button, input, select, textarea {
  font-family: inherit;
}

.global-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1rem;
  color: #64748b;
  font-weight: 500;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
