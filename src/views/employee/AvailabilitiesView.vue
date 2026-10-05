<script setup>
import { useRouter } from '../../router'
import WeekGrid from '../../components/employee/WeekGrid.vue'

const { navigate } = useRouter()
</script>

<template>
  <div class="flex-1 flex flex-col w-full min-h-0 py-1 md:py-1.5">
    <div class="card bg-base-200 border border-base-300/60 shadow-xs rounded-m3-xl p-3.5 sm:p-5 lg:p-6 w-full flex-1 flex flex-col justify-between gap-3 sm:gap-4">
      <!-- En-tête de contexte : le retour vit désormais dans le bandeau -->
      <div class="border-b border-base-300/40 pb-2.5 sm:pb-3 shrink-0">
        <h1 class="text-base sm:text-xl font-extrabold text-base-content tracking-tight">Ma disponibilité</h1>
        <p class="text-xs text-base-content/60">Organisation de votre semaine</p>
      </div>

      <p class="text-xs sm:text-sm text-base-content/65 leading-relaxed shrink-0">
        Indiquez vos jours d'absence prévus pour transmettre votre demande à votre responsable. Les jours validés apparaîtront en vert sur votre planning.
      </p>

      <!-- Grille de saisie hebdomadaire -->
      <WeekGrid />
    </div>
  </div>
</template>

