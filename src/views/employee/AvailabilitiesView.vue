<script setup>
import { useRouter } from '../../router'
import WeekGrid from '../../components/employee/WeekGrid.vue'

const { navigate } = useRouter()
</script>

<template>
  <div class="flex-1 flex flex-col w-full h-full min-h-0 overflow-y-auto md:overflow-hidden py-1 md:py-1.5">
    <div class="card bg-base-200 border border-base-300/60 shadow-xs rounded-m3-xl p-3.5 sm:p-5 lg:p-6 w-full flex-1 flex flex-col justify-between gap-3 sm:gap-4">
      <!-- En-tête navigation avec touch target 44px+ -->
      <div class="flex items-center justify-between border-b border-base-300/40 pb-2.5 sm:pb-3 shrink-0">
        <button
          type="button"
          class="btn btn-ghost btn-sm min-h-11 px-3 text-xs font-semibold gap-1.5 rounded-m3-sm text-base-content/75 hover:text-base-content focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          @click="navigate('/employee')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Retour</span>
        </button>
        <div class="text-right">
          <h1 class="text-base sm:text-xl font-extrabold text-base-content tracking-tight">Mes disponibilités</h1>
          <p class="text-xs text-base-content/60">Organisation de votre semaine</p>
        </div>
      </div>

      <p class="text-xs sm:text-sm text-base-content/65 leading-relaxed shrink-0">
        Indiquez vos jours de présence prévus sur site pour faciliter la coordination avec votre équipe.
      </p>

      <!-- Grille de saisie hebdomadaire -->
      <WeekGrid />
    </div>
  </div>
</template>

