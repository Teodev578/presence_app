<script setup>
import { ref, computed, watch } from 'vue'
import { useAvailabilities, formatWeekLabel } from '../../composables/useAvailabilities'
import { useToast } from '../../composables/useToast'

const { success: toastSuccess, error: toastError } = useToast()

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

// Date locale au format YYYY-MM-DD (sans décalage UTC)
const getLocalDateString = (d) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Calcul des dates précises pour chaque jour de la semaine sélectionnée
const daysWithDates = computed(() => {
  const base = new Date(currentWeekStart.value)
  const todayStr = getLocalDateString(new Date())
  return daysConfig.map((d, index) => {
    const dayDate = new Date(base)
    dayDate.setDate(base.getDate() + index)
    const dayStr = getLocalDateString(dayDate)
    const isToday = dayStr === todayStr
    const isPast = dayStr < todayStr
    return {
      ...d,
      dateFormatted: dayDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      }),
      isToday,
      isPast,
    }
  })
})

// Détecte si tous les jours ouvrés de la semaine affichée sont révolus
const isEntireWeekPast = computed(() => {
  return daysWithDates.value.length > 0 && daysWithDates.value.every((d) => d.isPast)
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

const toggleDay = (day) => {
  // Verrouille toute modification sur un jour déjà passé
  if (day.isPast) return

  const dayId = day.id
  const idx = selectedDays.value.indexOf(dayId)
  if (idx > -1) {
    selectedDays.value = selectedDays.value.filter((id) => id !== dayId)
  } else {
    selectedDays.value = [...selectedDays.value, dayId]
  }
}

const handleSave = async () => {
  if (isEntireWeekPast.value) return

  isSaving.value = true
  saveSuccess.value = false

  try {
    await saveWeekAvailabilities({
      weekStart: currentWeekStart.value,
      selectedDays: selectedDays.value,
      note: note.value.trim(),
    })
    saveSuccess.value = true
    toastSuccess('Vos disponibilités ont été enregistrées avec succès.')
    setTimeout(() => {
      saveSuccess.value = false
    }, 4000)
  } catch (err) {
    toastError(`Erreur d’enregistrement : ${err.message}`)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-3.5 sm:gap-4 w-full flex-1 justify-between">
    <!-- Barre de navigation semaine avec cibles tactiles conformes WCAG -->
    <div class="bg-base-100/80 border border-base-300/40 shadow-xs flex flex-row items-center justify-between p-2 sm:p-2.5 rounded-m3-lg">
      <button
        type="button"
        class="btn btn-circle btn-ghost min-w-11 min-h-11 w-11 h-11 rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        title="Semaine précédente"
        aria-label="Semaine précédente"
        @click="prevWeek"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div class="text-center flex flex-col items-center">
        <span class="badge badge-primary badge-xs font-bold uppercase tracking-wider mb-0.5 rounded-m3-xs">Semaine</span>
        <h2 class="font-bold text-xs sm:text-sm md:text-base text-base-content">{{ formatWeekLabel(currentWeekStart) }}</h2>
      </div>

      <button
        type="button"
        class="btn btn-circle btn-ghost min-w-11 min-h-11 w-11 h-11 rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3" role="group" aria-label="Jours de la semaine">
      <div
        v-for="d in daysWithDates"
        :key="d.id"
        role="checkbox"
        :aria-checked="selectedDays.includes(d.id)"
        :aria-disabled="d.isPast"
        :aria-label="`${d.label} ${d.dateFormatted}, ${selectedDays.includes(d.id) ? 'Disponible' : 'Non disponible'}${d.isPast ? ', passé et non modifiable' : ''}`"
        :tabindex="d.isPast ? -1 : 0"
        class="card border p-3.5 sm:p-4 rounded-m3-md flex flex-row md:flex-col items-center md:items-start justify-between min-h-[76px] md:min-h-[112px] gap-2.5 transition-all select-none !outline-none shadow-xs"
        :class="[
          d.isPast
            ? 'opacity-45 bg-base-300/30 border-base-300/40 cursor-not-allowed'
            : selectedDays.includes(d.id)
              ? 'border-primary bg-primary/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
              : 'border-base-300/60 bg-base-100/70 hover:bg-base-100 hover:border-base-content/25 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
        ]"
        @click="toggleDay(d)"
        @keydown.space.prevent="toggleDay(d)"
        @keydown.enter.prevent="toggleDay(d)"
      >
        <div class="flex flex-col">
          <div class="font-bold text-xs sm:text-sm text-base-content flex items-center gap-1.5">
            <span :class="d.isPast ? 'text-base-content/60' : ''">{{ d.label }}</span>
            <span v-if="d.isPast" class="badge badge-ghost badge-xs text-[10px] text-base-content/50 rounded-m3-xs py-0.5 px-1.5">Passé</span>
            <span v-else-if="d.isToday" class="badge badge-primary badge-xs font-bold rounded-m3-xs">Aujourd'hui</span>
          </div>
          <div class="text-[11px] sm:text-xs text-base-content/50 mt-0.5 capitalize">{{ d.dateFormatted }}</div>
        </div>

        <!-- Toggle DaisyUI synchronisé (grisé et inactif si passé) -->
        <input
          type="checkbox"
          class="toggle toggle-primary pointer-events-none md:mt-auto"
          :class="d.isPast ? 'opacity-40' : ''"
          :checked="selectedDays.includes(d.id)"
          :disabled="d.isPast"
          tabindex="-1"
          aria-hidden="true"
        />
      </div>
    </div>

    <!-- Champ note optionnelle dans un panneau surfacique propre -->
    <div class="bg-base-100/70 border border-base-300/40 rounded-m3-lg p-3 sm:p-3.5 flex flex-col gap-1.5 shadow-xs">
      <label for="week-note" class="text-xs font-semibold text-base-content/75 flex items-center gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Précision pour votre équipe (optionnel)
      </label>
      <textarea
        id="week-note"
        v-model="note"
        rows="2"
        class="textarea textarea-bordered w-full rounded-m3-sm text-xs sm:text-sm py-1.5 px-3 bg-base-200/60 border-base-300/50 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary"
        :disabled="isEntireWeekPast"
        :placeholder="isEntireWeekPast ? 'Semaine archivée' : 'Ex : Télétravail mercredi, déplacement client vendredi...'"
      ></textarea>
    </div>

    <!-- Bouton d'enregistrement principal avec feedback de succès intégré (zéro décalage de mise en page) -->
    <div class="pt-2 border-t border-base-300/40 mt-auto">
      <button
        type="button"
        class="btn w-full text-sm sm:text-base font-bold min-h-12 sm:min-h-13 shadow-xs rounded-m3-md active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-offset-2"
        :class="[
          saveSuccess
            ? 'btn-success text-success-content focus-visible:ring-success'
            : 'btn-primary focus-visible:ring-primary'
        ]"
        :disabled="isSaving || isEntireWeekPast"
        @click="handleSave"
      >
        <span v-if="isSaving" class="loading loading-spinner loading-sm"></span>
        <span v-if="isSaving">Enregistrement en cours...</span>
        <template v-else-if="saveSuccess">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Disponibilités enregistrées</span>
        </template>
        <span v-else-if="isEntireWeekPast">Semaine passée (non modifiable)</span>
        <span v-else>Enregistrer mes disponibilités</span>
      </button>
    </div>
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
