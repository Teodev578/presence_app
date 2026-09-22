<script setup>
import { ref, computed, watch } from 'vue'
import { useAvailabilities, formatWeekLabel } from '../../composables/useAvailabilities'

const {
  currentWeekStart,
  weekAvailabilities,
  nextWeek,
  prevWeek,
  saveWeekAvailabilities,
} = useAvailabilities()

const selectedDays = ref([])
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

// Synchronise l'état local du formulaire lorsque les données Dexie changent
watch(
  weekAvailabilities,
  (items) => {
    if (items) {
      selectedDays.value = items.map((a) => a.day_of_week)
      const existingNote = items.find((a) => a.note)?.note || ''
      note.value = existingNote
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
  <div class="flex flex-col gap-4 max-w-lg mx-auto">
    <!-- Barre de navigation semaine -->
    <div class="card bg-base-100 border border-base-300 shadow-xs flex flex-row items-center justify-between p-3 rounded-2xl">
      <button
        type="button"
        class="btn btn-circle btn-ghost btn-sm text-base"
        title="Semaine précédente"
        aria-label="Semaine précédente"
        @click="prevWeek"
      >
        ←
      </button>

      <div class="text-center flex flex-col items-center">
        <span class="badge badge-primary badge-xs font-bold uppercase tracking-wider mb-1">Planning</span>
        <h3 class="font-bold text-sm text-base-content">{{ formatWeekLabel(currentWeekStart) }}</h3>
      </div>

      <button
        type="button"
        class="btn btn-circle btn-ghost btn-sm text-base"
        title="Semaine suivante"
        aria-label="Semaine suivante"
        @click="nextWeek"
      >
        →
      </button>
    </div>

    <!-- Grille des 5 jours (Lundi à Vendredi) -->
    <div class="flex flex-col gap-2.5">
      <div
        v-for="d in daysWithDates"
        :key="d.id"
        class="card bg-base-100 border p-4 rounded-xl flex flex-row items-center justify-between transition-all select-none cursor-pointer"
        :class="[
          selectedDays.includes(d.id)
            ? 'border-primary bg-primary/5 shadow-xs'
            : 'border-base-300 hover:border-base-content/20',
          d.isToday ? 'ring-2 ring-primary/40' : ''
        ]"
        @click="toggleDay(d.id)"
      >
        <div>
          <div class="font-bold text-sm text-base-content flex items-center gap-2">
            {{ d.label }}
            <span v-if="d.isToday" class="badge badge-primary badge-xs font-semibold">Aujourd'hui</span>
          </div>
          <div class="text-xs text-base-content/60 mt-0.5">{{ d.dateFormatted }}</div>
        </div>

        <!-- Toggle DaisyUI -->
        <input
          type="checkbox"
          class="toggle toggle-primary pointer-events-none"
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
        class="textarea textarea-bordered w-full rounded-xl text-sm"
        placeholder="Ex: Télétravail mercredi, déplacement externe vendredi..."
      ></textarea>
    </div>

    <!-- Message de confirmation -->
    <div v-if="saveSuccess" class="alert alert-success text-xs py-2.5 justify-center rounded-xl">
      Disponibilités enregistrées
    </div>

    <!-- Bouton d'enregistrement principal -->
    <button
      type="button"
      class="btn btn-primary w-full text-base font-bold min-h-12 shadow-sm rounded-xl active:scale-98 transition-transform"
      :disabled="isSaving"
      @click="handleSave"
    >
      <span v-if="isSaving">Enregistrement en cours...</span>
      <span v-else>Enregistrer</span>
    </button>
  </div>
</template>
