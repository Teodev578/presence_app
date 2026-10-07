<script setup>
import { ref, computed, watch } from 'vue'
import { useAvailabilities, formatWeekLabel } from '../../composables'
import { useAbsenceRequests } from '../../composables'
import { useToast } from '../../composables'
import { summarizeAvailability } from '../../lib/availabilitySummary'
import AvailabilitySummary from './AvailabilitySummary.vue'

const { success: toastSuccess, error: toastError } = useToast()

const {
  currentWeekStart,
  nextWeek,
  prevWeek,
} = useAvailabilities()

const {
  currentWeekRequest,
  submitRequest,
  cancelRequest,
} = useAbsenceRequests(currentWeekStart)

// Jours sélectionnés pour la demande d'absence
const selectedDays = ref([])
const note = ref('')
const isSubmitting = ref(false)
const isCancelling = ref(false)
const actionSuccess = ref(false)

const daysConfig = [
  { id: 1, label: 'Lundi', short: 'Lun' },
  { id: 2, label: 'Mardi', short: 'Mar' },
  { id: 3, label: 'Mercredi', short: 'Mer' },
  { id: 4, label: 'Jeudi', short: 'Jeu' },
  { id: 5, label: 'Vendredi', short: 'Ven' },
]

// Date locale au format YYYY-MM-DD
const getLocalDateString = (d) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Dates précises pour chaque jour de la semaine sélectionnée
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

// Détecte si tous les jours ouvrés de la semaine sont passés
const isEntireWeekPast = computed(() => {
  return daysWithDates.value.length > 0 && daysWithDates.value.every((d) => d.isPast)
})

// Statut de la demande active
const hasActiveRequest = computed(() => {
  const r = currentWeekRequest.value
  return !!r && (r.status === 'submitted' || r.status === 'validated')
})

const isRequestSubmitted = computed(() => currentWeekRequest.value?.status === 'submitted')
const isRequestValidated = computed(() => currentWeekRequest.value?.status === 'validated')
const isRequestRefused = computed(() => currentWeekRequest.value?.status === 'refused')

// Synchronise l'état local du formulaire selon la demande active ou réinitialise
watch(
  currentWeekRequest,
  (req) => {
    if (req && (req.status === 'submitted' || req.status === 'validated')) {
      selectedDays.value = [...(req.days || [])]
      note.value = req.note || ''
    } else if (req && req.status === 'refused') {
      selectedDays.value = [...(req.days || [])]
      note.value = req.note || ''
    } else {
      selectedDays.value = []
      note.value = ''
    }
  },
  { immediate: true }
)

const toggleDay = (day) => {
  // Verrouille toute modification sur un jour déjà passé, sur le jour en cours ou si la demande est déjà validée
  if (day.isPast) return
  if (day.isToday) return
  if (isRequestValidated.value) return

  const dayId = day.id
  const idx = selectedDays.value.indexOf(dayId)
  if (idx > -1) {
    selectedDays.value = selectedDays.value.filter((id) => id !== dayId)
  } else {
    selectedDays.value = [...selectedDays.value, dayId]
  }
}

// Résumé de la sélection
const availabilitySummary = computed(() =>
  summarizeAvailability(selectedDays.value, daysWithDates.value)
)

const isDayRequested = (dayId) => selectedDays.value.includes(dayId)

// Dialogues de confirmation
const showConfirmSubmitModal = ref(false)
const showConfirmCancelModal = ref(false)

// Jours sélectionnés lisibles pour le récapitulatif
const selectedDaysFormatted = computed(() => {
  return daysWithDates.value
    .filter((d) => selectedDays.value.includes(d.id))
    .map((d) => `${d.label} ${d.dateFormatted}`)
})

// Déclenchement de la demande : ouverture du dialogue de confirmation
const handleSubmit = () => {
  if (isEntireWeekPast.value) return
  if (!selectedDays.value.length) {
    toastError('Sélectionnez au moins une journée d’absence.')
    return
  }
  if (!note.value.trim()) {
    toastError('Indiquez le motif de votre absence.')
    return
  }
  showConfirmSubmitModal.value = true
}

// Exécution confirmée de la soumission de la demande
const executeSubmit = async () => {
  isSubmitting.value = true
  actionSuccess.value = false

  try {
    await submitRequest({
      weekStart: currentWeekStart.value,
      days: selectedDays.value,
      note: note.value.trim(),
    })
    actionSuccess.value = true
    showConfirmSubmitModal.value = false
    toastSuccess('Votre demande d’absence a été transmise à votre responsable.')
    setTimeout(() => {
      actionSuccess.value = false
    }, 4000)
  } catch (err) {
    toastError(`Erreur lors de la transmission : ${err.message}`)
  } finally {
    isSubmitting.value = false
  }
}

// Déclenchement de l'annulation : ouverture du dialogue de confirmation
const handleCancel = () => {
  if (!currentWeekRequest.value) return
  showConfirmCancelModal.value = true
}

// Exécution confirmée de l'annulation de la demande
const executeCancel = async () => {
  if (!currentWeekRequest.value) return

  isCancelling.value = true
  try {
    await cancelRequest(currentWeekRequest.value.id)
    showConfirmCancelModal.value = false
    toastSuccess('Votre demande d’absence a été annulée.')
    selectedDays.value = []
    note.value = ''
  } catch (err) {
    toastError(`Erreur lors de l’annulation : ${err.message}`)
  } finally {
    isCancelling.value = false
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
        <h2 class="font-bold text-xs sm:text-sm md:text-base text-base-content text-balance">{{ formatWeekLabel(currentWeekStart) }}</h2>
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

    <!-- Bandeau de statut contextuel -->
    <div
      v-if="isRequestValidated"
      class="p-3.5 sm:p-4 rounded-m3-md border border-success/50 bg-base-200 text-base-content flex items-center justify-between gap-3 shadow-xs"
    >
      <div class="flex items-center gap-3">
        <span class="w-8 h-8 rounded-full bg-success text-success-content flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <div class="flex flex-col">
          <span class="font-bold text-xs sm:text-sm text-base-content">Demande accordée</span>
          <span class="text-xs text-base-content/75">
            Vos jours d’absence ont été validés par votre responsable.
          </span>
          <span v-if="currentWeekRequest?.decision_note" class="text-xs text-base-content/90 font-medium italic mt-0.5">
            Message du responsable : « {{ currentWeekRequest.decision_note }} »
          </span>
        </div>
      </div>
      <span class="badge badge-success text-success-content badge-sm font-semibold rounded-m3-xs shrink-0">Validée</span>
    </div>

    <div
      v-else-if="isRequestSubmitted"
      class="p-3.5 sm:p-4 rounded-m3-md border border-warning/50 bg-base-200 text-base-content flex items-center justify-between gap-3 shadow-xs"
    >
      <div class="flex items-center gap-3">
        <span class="w-8 h-8 rounded-full bg-warning text-warning-content flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </span>
        <div class="flex flex-col">
          <span class="font-bold text-xs sm:text-sm text-base-content">Demande en cours d’examen</span>
          <span class="text-xs text-base-content/75">Votre demande d’absence a été transmise à votre responsable.</span>
        </div>
      </div>
      <span class="badge badge-warning text-warning-content badge-sm font-semibold rounded-m3-xs shrink-0">En attente</span>
    </div>

    <div
      v-else-if="isRequestRefused"
      class="p-3.5 sm:p-4 rounded-m3-md border border-error/50 bg-base-200 text-base-content flex items-center justify-between gap-3 shadow-xs"
    >
      <div class="flex items-center gap-3">
        <span class="w-8 h-8 rounded-full bg-error text-error-content flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </span>
        <div class="flex flex-col">
          <span class="font-bold text-xs sm:text-sm text-base-content">Demande non accordée</span>
          <span class="text-xs text-base-content/75">
            <template v-if="currentWeekRequest?.decision_note">
              Motif du responsable : « {{ currentWeekRequest.decision_note }} »
            </template>
            <template v-else>
              Vous pouvez formuler une nouvelle proposition.
            </template>
          </span>
        </div>
      </div>
      <span class="badge badge-error text-error-content badge-sm font-semibold rounded-m3-xs shrink-0">Refusée</span>
    </div>

    <!-- Grille adaptative des 5 jours ouvrés -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3" role="group" aria-label="Jours de la semaine">
      <div
        v-for="d in daysWithDates"
        :key="d.id"
        role="checkbox"
        :aria-checked="isDayRequested(d.id)"
        :aria-disabled="d.isPast || d.isToday || isRequestValidated"
        :aria-label="`${d.label} ${d.dateFormatted}, ${isDayRequested(d.id) ? 'Jour d’absence sélectionné' : 'Jour ordinaire'}${d.isPast ? ', passé et non modifiable' : d.isToday ? ', aujourd’hui et non modifiable' : ''}`"
        :tabindex="d.isPast || d.isToday || isRequestValidated ? -1 : 0"
        class="card border p-3.5 sm:p-4 rounded-m3-md flex flex-row md:flex-col items-center md:items-start justify-between min-h-[76px] md:min-h-[112px] gap-2.5 transition-all select-none !outline-none shadow-xs"
        :class="[
          d.isPast || d.isToday
            ? 'bg-base-300/40 border-base-300/40 cursor-not-allowed opacity-60'
            : isRequestValidated && isDayRequested(d.id)
              ? 'border-success border-2 bg-success/15 ring-2 ring-success/30 shadow-xs cursor-default'
              : isRequestSubmitted && isDayRequested(d.id)
                ? 'border-warning border-2 bg-base-200 ring-2 ring-warning/20 cursor-default'
                : isDayRequested(d.id)
                  ? 'border-primary bg-primary/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                  : 'border-base-300/60 bg-base-100/70 hover:bg-base-100 hover:border-base-content/25 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
        ]"
        @click="toggleDay(d)"
        @keydown.space.prevent="toggleDay(d)"
        @keydown.enter.prevent="toggleDay(d)"
      >
        <div class="flex flex-col">
          <div class="font-bold text-xs sm:text-sm text-base-content flex items-center gap-1.5">
            <span :class="d.isPast || d.isToday ? 'text-base-content/60' : ''">{{ d.label }}</span>
            <span v-if="d.isPast" class="badge badge-ghost badge-xs text-xs text-base-content/50 rounded-m3-xs py-0.5 px-1.5">Passé</span>
            <span v-else-if="d.isToday" class="badge badge-ghost badge-xs text-xs text-base-content/60 font-semibold rounded-m3-xs py-0.5 px-1.5">Aujourd'hui</span>
            <span v-else-if="isRequestValidated && isDayRequested(d.id)" class="badge badge-success text-success-content badge-xs font-bold rounded-m3-xs">Validé</span>
            <span v-else-if="isRequestSubmitted && isDayRequested(d.id)" class="badge badge-warning text-warning-content badge-xs font-semibold rounded-m3-xs">En attente</span>
          </div>
          <div class="text-xs text-base-content/50 mt-0.5">{{ d.dateFormatted }}</div>
        </div>

        <!-- Indicateur visuel : vert naturel si validé, ambré si en attente, toggle si sélection libre -->
        <div v-if="isRequestValidated && isDayRequested(d.id)" class="w-6 h-6 rounded-full bg-success text-success-content flex items-center justify-center shrink-0 md:mt-auto">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div v-else-if="isRequestSubmitted && isDayRequested(d.id)" class="w-6 h-6 rounded-full bg-warning text-warning-content flex items-center justify-center shrink-0 md:mt-auto">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <input
          v-else
          type="checkbox"
          class="toggle toggle-primary pointer-events-none md:mt-auto"
          :class="d.isPast || d.isToday ? 'opacity-40' : ''"
          :checked="isDayRequested(d.id)"
          :disabled="d.isPast || d.isToday"
          tabindex="-1"
          aria-hidden="true"
        />
      </div>
    </div>

    <!-- Motif obligatoire pour le responsable -->
    <div class="bg-base-100/70 border border-base-300/40 rounded-m3-lg p-3 sm:p-3.5 flex flex-col gap-1.5 shadow-xs">
      <div class="flex items-center justify-between">
        <label for="week-note" class="text-xs font-semibold text-base-content/75 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Motif de votre absence</span>
          <span class="text-error font-bold" aria-hidden="true">*</span>
        </label>
        <span class="badge badge-xs badge-neutral rounded-m3-xs font-semibold">Obligatoire</span>
      </div>
      <textarea
        id="week-note"
        v-model="note"
        rows="2"
        required
        class="textarea textarea-bordered w-full rounded-m3-sm text-xs sm:text-sm py-2 px-3 bg-base-200 border-base-300 text-base-content placeholder:text-base-content/50 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary"
        :disabled="isEntireWeekPast || isRequestValidated"
        :placeholder="isEntireWeekPast ? 'Semaine archivée' : 'Indiquez le motif de votre absence (congés, impératif familial, formation...)'"
      ></textarea>
    </div>

    <!-- Résumé avant soumission -->
    <AvailabilitySummary :count="availabilitySummary.count" :labels="availabilitySummary.labels" />

    <!-- Actions principales : Soumettre une demande d'absence ou Annuler la demande -->
    <div class="pt-2 border-t border-base-300/40 mt-auto flex flex-col sm:flex-row gap-2.5">
      <!-- Bouton d'annulation contextuel si demande en cours ou validée -->
      <button
        v-if="hasActiveRequest"
        type="button"
        class="btn btn-outline border-warning text-warning hover:bg-warning hover:text-warning-content w-full text-sm sm:text-base font-bold min-h-12 sm:min-h-13 shadow-xs rounded-m3-md active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2"
        :disabled="isCancelling || isEntireWeekPast"
        @click="handleCancel"
      >
        <span v-if="isCancelling" class="loading loading-spinner loading-sm"></span>
        <span v-if="isCancelling">Annulation en cours...</span>
        <template v-else>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <span>Annuler ma demande</span>
        </template>
      </button>

      <!-- Bouton principal : Demande d'absence si aucune demande en cours -->
      <button
        v-else
        type="button"
        class="btn w-full text-sm sm:text-base font-bold min-h-12 sm:min-h-13 shadow-xs rounded-m3-md active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-offset-2"
        :class="[
          actionSuccess
            ? 'btn-success text-success-content focus-visible:ring-success'
            : 'btn-primary focus-visible:ring-primary'
        ]"
        :disabled="isSubmitting || isEntireWeekPast || selectedDays.length === 0 || !note.trim()"
        :aria-label="`Demande d'absence : ${availabilitySummary.label}`"
        @click="handleSubmit"
      >
        <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
        <span v-if="isSubmitting">Transmission en cours...</span>
        <template v-else-if="actionSuccess">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Demande transmise</span>
        </template>
        <span v-else-if="isEntireWeekPast">Semaine passée (non modifiable)</span>
        <span v-else>Demande d'absence</span>
      </button>
    </div>

    <!-- Dialogue de confirmation : transmission de la demande d'absence -->
    <div
      v-if="showConfirmSubmitModal"
      class="modal modal-open modal-middle"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-submit-title"
    >
      <div class="modal-box rounded-m3-xl p-5 sm:p-6 bg-base-100 border border-base-300 shadow-sm w-11/12 max-w-md flex flex-col gap-4">
        <div class="flex items-center justify-between pb-3 border-b border-base-200">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 id="confirm-submit-title" class="font-bold text-base text-base-content">
              Confirmer votre demande d’absence
            </h3>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-circle min-h-11 min-w-11"
            aria-label="Fermer"
            @click="showConfirmSubmitModal = false"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <p class="text-xs sm:text-sm text-base-content/80 leading-relaxed">
          Vous êtes sur le point de transmettre une demande d’absence à votre responsable :
        </p>

        <div class="bg-base-200/70 border border-base-300/50 rounded-m3-md p-3.5 flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-base-content/70">Période concernée</span>
            <span class="font-bold text-base-content">{{ formatWeekLabel(currentWeekStart, { short: true }) }}</span>
          </div>

          <div class="flex flex-col gap-1 text-xs">
            <span class="text-base-content/70">Jours sollicités ({{ selectedDays.length }}) :</span>
            <div class="flex flex-wrap gap-1.5 mt-0.5">
              <span
                v-for="dLabel in selectedDaysFormatted"
                :key="dLabel"
                class="badge badge-primary text-primary-content font-medium rounded-m3-xs py-1 px-2 text-xs"
              >
                {{ dLabel }}
              </span>
            </div>
          </div>

          <div v-if="note.trim()" class="text-xs pt-1.5 border-t border-base-300/40">
            <span class="text-base-content/70 block mb-0.5">Précision apportée :</span>
            <span class="italic text-base-content/90 font-medium">« {{ note.trim() }} »</span>
          </div>
        </div>

        <p class="text-xs text-base-content/65">
          Dès accord de votre responsable, les journées retenues s’afficheront en vert sur votre planning.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-base-200">
          <button
            type="button"
            class="btn btn-ghost min-h-11 px-4 text-xs font-semibold rounded-m3-sm active:scale-95 transition-transform"
            :disabled="isSubmitting"
            @click="showConfirmSubmitModal = false"
          >
            Modifier
          </button>
          <button
            type="button"
            class="btn btn-primary text-primary-content min-h-11 px-5 text-xs font-bold rounded-m3-sm active:scale-95 transition-transform"
            :disabled="isSubmitting"
            @click="executeSubmit"
          >
            <span v-if="isSubmitting" class="loading loading-spinner loading-xs mr-1"></span>
            <span>Transmettre ma demande</span>
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showConfirmSubmitModal = false"></div>
    </div>

    <!-- Dialogue de confirmation : annulation de la demande d'absence -->
    <div
      v-if="showConfirmCancelModal"
      class="modal modal-open modal-middle"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-cancel-title"
    >
      <div class="modal-box rounded-m3-xl p-5 sm:p-6 bg-base-100 border border-base-300 shadow-sm w-11/12 max-w-md flex flex-col gap-4">
        <div class="flex items-center justify-between pb-3 border-b border-base-200">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-full bg-warning text-warning-content flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h3 id="confirm-cancel-title" class="font-bold text-base text-base-content">
              Annuler votre demande d’absence
            </h3>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-circle min-h-11 min-w-11"
            aria-label="Fermer"
            @click="showConfirmCancelModal = false"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <p class="text-xs sm:text-sm text-base-content/80 leading-relaxed">
          Souhaitez-vous vraiment annuler votre demande d’absence pour la semaine du
          <strong>{{ formatWeekLabel(currentWeekStart, { short: true }) }}</strong> ?
        </p>

        <p class="text-xs text-base-content/65">
          Cette annulation mettra un terme à l’examen en cours et libérera les journées sélectionnées.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-base-200">
          <button
            type="button"
            class="btn btn-ghost min-h-11 px-4 text-xs font-semibold rounded-m3-sm active:scale-95 transition-transform"
            :disabled="isCancelling"
            @click="showConfirmCancelModal = false"
          >
            Conserver ma demande
          </button>
          <button
            type="button"
            class="btn btn-warning text-warning-content min-h-11 px-5 text-xs font-bold rounded-m3-sm active:scale-95 transition-transform"
            :disabled="isCancelling"
            @click="executeCancel"
          >
            <span v-if="isCancelling" class="loading loading-spinner loading-xs mr-1"></span>
            <span>Confirmer l’annulation</span>
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showConfirmCancelModal = false"></div>
    </div>
  </div>
</template>

<style scoped>
.card[role="checkbox"],
.card[aria-checked] {
  outline: none !important;
  outline-offset: 0 !important;
}
</style>
