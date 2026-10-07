import { ref } from 'vue'

const toasts = ref([])

export function useToast() {
  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    toasts.value.push({
      id,
      message,
      type,
    })

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, duration)
    }

    return id
  }

  const dismissToast = (id) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const success = (message, duration = 4000) => showToast(message, 'success', duration)
  const error = (message, duration = 5000) => showToast(message, 'error', duration)
  const warning = (message, duration = 4500) => showToast(message, 'warning', duration)
  const info = (message, duration = 4000) => showToast(message, 'info', duration)

  return {
    toasts,
    showToast,
    dismissToast,
    success,
    error,
    warning,
    info,
  }
}
