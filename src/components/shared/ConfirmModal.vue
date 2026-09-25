<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Confirmer l’action',
  },
  message: {
    type: String,
    default: 'Êtes-vous certain de vouloir effectuer cette action ?',
  },
  confirmText: {
    type: String,
    default: 'Confirmer',
  },
  cancelText: {
    type: String,
    default: 'Annuler',
  },
  confirmClass: {
    type: String,
    default: 'btn-error',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['confirm', 'cancel', 'update:open'])

const handleCancel = () => {
  emit('update:open', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': open }">
    <div class="modal-box rounded-m3-xl max-w-sm sm:max-w-md p-5 sm:p-6 bg-base-100 border border-base-300 shadow-sm flex flex-col gap-4">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div class="flex flex-col gap-1 min-w-0 flex-1">
          <h3 class="font-bold text-base text-base-content leading-tight">{{ title }}</h3>
          <p class="text-xs sm:text-sm text-base-content/70 leading-relaxed">{{ message }}</p>
        </div>
      </div>

      <div class="modal-action mt-2 gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-m3-sm text-base-content/80 min-h-10 px-3.5"
          :disabled="loading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          class="btn btn-sm rounded-m3-sm font-bold shadow-xs min-h-10 px-4"
          :class="confirmClass"
          :disabled="loading"
          @click="handleConfirm"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs"></span>
          <span v-else>{{ confirmText }}</span>
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-xs" @click="handleCancel">
      <button>close</button>
    </form>
  </dialog>
</template>
