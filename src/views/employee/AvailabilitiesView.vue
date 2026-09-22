<script setup>
import { useRouter } from '../../router'
import WeekGrid from '../../components/employee/WeekGrid.vue'

const { navigate } = useRouter()
</script>

<template>
  <div class="flex flex-col gap-4 max-w-lg mx-auto">
    <div class="flex items-center justify-between">
      <button type="button" class="btn btn-ghost btn-sm text-xs font-semibold gap-1" @click="navigate('/employee')">
        ← Retour
      </button>
      <h2 class="text-base font-bold text-base-content">Mes disponibilités</h2>
      <span class="w-16"></span>
    </div>

    <p class="text-xs text-base-content/60 text-center leading-relaxed">
      Indiquez vos jours de présence prévus (Lundi au Vendredi) pour la semaine choisie.
    </p>

    <!-- Grille de saisie hebdomadaire -->
    <WeekGrid />
  </div>
</template>
