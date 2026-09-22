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
      // Récupère la première note non vide trouvée pour la semaine
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
  <div class="week-grid-container">
    <!-- Barre de navigation semaine -->
    <div class="week-nav">
      <button
        type="button"
        class="nav-btn"
        title="Semaine précédente"
        @click="prevWeek"
      >
        ←
      </button>

      <div class="week-title-wrapper">
        <span class="week-badge">Planning</span>
        <h3 class="week-title">{{ formatWeekLabel(currentWeekStart) }}</h3>
      </div>

      <button
        type="button"
        class="nav-btn"
        title="Semaine suivante"
        @click="nextWeek"
      >
        →
      </button>
    </div>

    <!-- Grille des 5 jours (Lundi à Vendredi) -->
    <div class="days-list">
      <div
        v-for="d in daysWithDates"
        :key="d.id"
        class="day-card"
        :class="{
          'day-selected': selectedDays.includes(d.id),
          'day-today': d.isToday
        }"
        @click="toggleDay(d.id)"
      >
        <div class="day-info">
          <div class="day-name">
            {{ d.label }}
            <span v-if="d.isToday" class="today-tag">Aujourd'hui</span>
          </div>
          <div class="day-date">{{ d.dateFormatted }}</div>
        </div>

        <!-- Toggle visuel mobile accessible (touch target) -->
        <div class="day-toggle" :class="{ active: selectedDays.includes(d.id) }">
          <span class="toggle-circle"></span>
        </div>
      </div>
    </div>

    <!-- Champ note optionnelle -->
    <div class="note-section">
      <label for="week-note" class="note-label">
        Note ou précision (optionnel)
      </label>
      <textarea
        id="week-note"
        v-model="note"
        rows="2"
        class="note-textarea"
        placeholder="Ex: Télétravail mercredi, déplacement externe vendredi..."
      ></textarea>
    </div>

    <!-- Message de confirmation -->
    <div v-if="saveSuccess" class="alert-success">
      ✓ Disponibilités enregistrées avec succès en local.
    </div>

    <!-- Bouton d'enregistrement principal -->
    <button
      type="button"
      class="save-btn"
      :disabled="isSaving"
      @click="handleSave"
    >
      <span v-if="isSaving">Enregistrement en cours...</span>
      <span v-else>Enregistrer mes disponibilités</span>
    </button>
  </div>
</template>

<style scoped>
.week-grid-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 520px;
  margin: 0 auto;
  padding: 0.5rem;
}

.week-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.nav-btn {
  background: var(--bg-subtle, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-main, #1e293b);
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: #e2e8f0;
}

.week-title-wrapper {
  text-align: center;
}

.week-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #3b82f6;
  background: #eff6ff;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  display: inline-block;
  margin-bottom: 0.2rem;
}

.week-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main, #1e293b);
}

.days-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.day-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.15rem;
  background: var(--bg-card, #ffffff);
  border: 1.5px solid var(--border-color, #e2e8f0);
  border-radius: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.day-card:hover {
  border-color: #cbd5e1;
}

.day-card.day-selected {
  border-color: #3b82f6;
  background: #f0f7ff;
}

.day-card.day-today {
  box-shadow: 0 0 0 1px #3b82f6;
}

.day-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-main, #1e293b);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.today-tag {
  font-size: 0.65rem;
  background: #dbeafe;
  color: #1e40af;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.day-date {
  font-size: 0.8rem;
  color: var(--text-muted, #64748b);
  margin-top: 0.15rem;
}

.day-toggle {
  width: 48px;
  height: 28px;
  background-color: #cbd5e1;
  border-radius: 9999px;
  padding: 2px;
  transition: background-color 0.25s ease;
  display: flex;
  align-items: center;
}

.day-toggle.active {
  background-color: #3b82f6;
}

.toggle-circle {
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s ease;
  transform: translateX(0);
}

.day-toggle.active .toggle-circle {
  transform: translateX(20px);
}

.note-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.note-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted, #64748b);
}

.note-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.65rem 0.85rem;
  border-radius: 0.65rem;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  color: var(--text-main, #1e293b);
  font-family: inherit;
  font-size: 0.85rem;
  resize: vertical;
}

.note-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.alert-success {
  background-color: #ecfdf5;
  border: 1px solid #10b981;
  color: #065f46;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.65rem 0.9rem;
  border-radius: 0.65rem;
  text-align: center;
}

.save-btn {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 0.9rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
}

.save-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.save-btn:active:not(:disabled) {
  transform: scale(0.99);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
