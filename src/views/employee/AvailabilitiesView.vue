<script setup>
import { useRouter } from '../../router'
import WeekGrid from '../../components/employee/WeekGrid.vue'

const { navigate } = useRouter()
</script>

<template>
  <div class="availabilities-view">
    <div class="header-nav">
      <button type="button" class="back-link" @click="navigate('/employee')">
        ← Retour
      </button>
      <h2 class="view-title">Mes disponibilités</h2>
      <span style="width: 40px"></span>
    </div>

    <p class="subtitle">
      Indiquez vos jours de présence prévus (Lundi au Vendredi) pour la semaine choisie.
    </p>

    <!-- Grille de saisie hebdomadaire -->
    <WeekGrid />
  </div>
</template>

<style scoped>
.availabilities-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 520px;
  margin: 0 auto;
}

.header-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-link {
  background: none;
  border: none;
  color: var(--text-muted, #64748b);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem;
}

.view-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-main, #1e293b);
}

.subtitle {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-muted, #64748b);
  margin: 0;
  line-height: 1.4;
}
</style>
