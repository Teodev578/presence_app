<script setup>
import { ref, computed, watch } from 'vue'
import { useAvailabilities, formatWeekLabel } from '../../composables/useAvailabilities'

const {
  currentWeekStart,
  weekAvailabilities,
  hasConfiguredWeek,
  nextWeek,
  prevWeek,
  saveWeekAvailabilities,
} = useAvailabilities()

// Par défaut : l'ensemble des 5 jours ouvrés (Lundi à Vendredi) est coché
const selectedDays = ref([1, 2, 3, 4, 5])
const note = ref('')
const isSaving = ref(false)
const saveSuccess = ref(false)

const daysConfig = [
  { id: 1, label: 'Lundi', short: 'Lun' },
  { id: 2, label: 'Mardi', short: 'Mar' },
  { id: 3, label: 'Mercredi', short: 'Mer' },
  { id: 4, label: 'Jeudi', short: 'Jeu' },
  { id: 5, label: 'Vendredi', short: 'Ven' },
]

// Calcul des dates précises pour chaque jour de la semaine sélectionnée
const daysWithDates = computed(() => {
  const base = new Date(currentWeekStart.value)
  return daysConfig.map((d, index) => {
    const dayDate = new Date(base)
    dayDate.setDate(base.getDate() + index)
    return {
      ...d,
      dateFormatted: dayDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      }),
      isToday:
        dayDate.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10),
    }
  })
})

// Synchronise l'état local du formulaire : si la semaine a été personnalisée, charge ses données ; sinon, coche tous les jours
watch(
  [weekAvailabilities, hasConfiguredWeek],
  ([items, isConfigured]) => {
    if (isConfigured) {
      selectedDays.value = items ? items.map((a) => a.day_of_week) : []
      const existingNote = items?.find((a) => a.note)?.note || ''
      note.value = existingNote
    } else {
      selectedDays.value = [1, 2, 3, 4, 5]
      note.value = ''
    }
  },
  { immediate: true }
)

const toggleDay = (dayId) => {
  const idx = selectedDays.value.indexOf(dayId)
  if (idx > -1) {
    selectedDays.value = selectedDays.value.filter((id) => id !== dayId)
  } else {
    selectedDays.value = [...selectedDays.value, dayId]
  }
}

const handleSave = async () => {
  isSaving.value = true
  saveSuccess.value = false

  try {
    await saveWeekAvailabilities({
      weekStart: currentWeekStart.value,
      selectedDays: selectedDays.value,
      note: note.value.trim(),
    })
    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 4000)
  } catch (err) {
    alert(`Erreur d’enregistrement : ${err.message}`)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 w-full">
    <!-- Barre de navigation semaine avec cibles tactiles 48dp -->
    <div class="card bg-base-200 border border-base-300/60 shadow-xs flex flex-row items-center justify-between p-2.5 sm:p-3 rounded-m3-lg">
      <button
        type="button"
        class="btn btn-circle btn-ghost min-w-12 min-h-12 w-12 h-12 rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        title="Semaine précédente"
        aria-label="Semaine précédente"
        @click="prevWeek"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div class="text-center flex flex-col items-center">
        <span class="badge badge-primary badge-xs font-bold uppercase tracking-wider mb-1 rounded-m3-xs">Planning</span>
        <h3 class="font-bold text-sm md:text-base text-base-content">{{ formatWeekLabel(currentWeekStart) }}</h3>
      </div>

      <button
        type="button"
        class="btn btn-circle btn-ghost min-w-12 min-h-12 w-12 h-12 rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        title="Semaine suivante"
        aria-label="Semaine suivante"
        @click="nextWeek"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>

    <!-- Grille adaptative des 5 jours (colonne mobile, 5 colonnes dès md: 600px) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3" role="group" aria-label="Jours de la semaine">
      <div
        v-for="d in daysWithDates"
        :key="d.id"
        role="checkbox"
        :aria-checked="selectedDays.includes(d.id)"
        :aria-label="`${d.label} ${d.dateFormatted}, ${selectedDays.includes(d.id) ? 'Disponible' : 'Non disponible'}`"
        tabindex="0"
        class="card bg-base-200 border p-4 rounded-m3-md flex flex-row md:flex-col items-center md:items-start justify-between gap-3 transition-all select-none cursor-pointer !outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        :class="[
          selectedDays.includes(d.id)
            ? 'border-primary bg-primary/10'
            : 'border-base-300/70 hover:border-base-content/30'
        ]"
        @click="toggleDay(d.id)"
        @keydown.space.prevent="toggleDay(d.id)"
        @keydown.enter.prevent="toggleDay(d.id)"
      >
        <div class="flex flex-col">
          <div class="font-bold text-sm text-base-content flex items-center gap-1.5">
            <span>{{ d.label }}</span>
            <span v-if="d.isToday" class="badge badge-primary badge-xs font-semibold rounded-m3-xs">Auj.</span>
          </div>
          <div class="text-xs text-base-content/60 mt-0.5">{{ d.dateFormatted }}</div>
        </div>

        <!-- Toggle DaisyUI synchronisé -->
        <input
          type="checkbox"
          class="toggle toggle-primary pointer-events-none md:mt-2"
          :checked="selectedDays.includes(d.id)"
          tabindex="-1"
          aria-hidden="true"
        />
      </div>
    </div>

    <!-- Champ note optionnelle -->
    <div class="fieldset">
      <label for="week-note" class="fieldset-legend text-xs font-semibold text-base-content/70">
        Note ou précision (optionnel)
      </label>
      <textarea
        id="week-note"
        v-model="note"
        rows="2"
        class="textarea textarea-bordered w-full rounded-m3-md text-sm"
        placeholder="Ex: Télétravail mercredi, déplacement externe vendredi..."
      ></textarea>
    </div>

    <!-- Message de confirmation -->
    <div v-if="saveSuccess" class="alert alert-success text-xs py-2.5 justify-center rounded-m3-md">
      Disponibilités enregistrées
    </div>

    <!-- Bouton d'enregistrement principal -->
    <button
      type="button"
      class="btn btn-primary w-full text-base font-bold min-h-14 shadow-xs rounded-m3-md active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      :disabled="isSaving"
      @click="handleSave"
    >
      <span v-if="isSaving">Enregistrement en cours...</span>
      <span v-else>Enregistrer</span>
    </button>
  </div>
</template>

<style scoped>
/* Supprime l'outline automatique externe appliqué par DaisyUI v5 sur les cartes ayant aria-checked */
.card[role="checkbox"],
.card[aria-checked] {
  outline: none !important;
  outline-offset: 0 !important;
}
</style>
