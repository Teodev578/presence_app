import { ref, computed } from 'vue'
import { db, useLiveQuery } from '../lib/db'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'

const dismissedNotificationIds = ref(new Set())

export function useNotifications() {
  const { user } = useAuth()
  const { profile } = useProfile()

  const isManager = computed(() => {
    const role = profile.value?.role || user.value?.user_metadata?.role
    return role === 'manager' || role === 'admin'
  })

  // 1. Pour les managers & administrateurs : lecture réactive Local-First des profils en attente
  const pendingProfiles = useLiveQuery(async () => {
    if (!isManager.value) return []
    try {
      return await db.profiles
        .filter((p) => !p.deleted_at && p.status === 'pending_validation')
        .toArray()
    } catch (e) {
      console.warn('Erreur lecture notifications Dexie :', e)
      return []
    }
  }, [isManager])

  // 2. Calcul des notifications actives
  const notifications = computed(() => {
    const items = []

    if (isManager.value) {
      const list = pendingProfiles.value || []
      for (const p of list) {
        const d = p.created_at || Date.now()
        const createdTime = new Date(d).getTime()
        const expiryTime = createdTime + 7 * 24 * 60 * 60 * 1000
        const diffDays = Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000))
        const daysRemaining = Math.max(0, diffDays)

        const notifId = `pending-account-${p.id}`
        items.push({
          id: notifId,
          type: 'account_pending_validation',
          title: 'Nouveau compte en attente de validation',
          subtitle: p.full_name ? `${p.full_name} (${p.email})` : p.email,
          message: `${p.full_name || p.email} a créé son compte. Ce compte sera automatiquement supprimé dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} sans validation.`,
          daysRemaining,
          targetRoute: '/manager/employees?status=pending_validation',
          actionLabel: 'Examiner dans l’équipe',
          profileId: p.id,
          createdAt: p.created_at,
          unread: !dismissedNotificationIds.value.has(notifId),
        })
      }
    } else {
      // Pour les collaborateurs : alerte si le compte personnel est en attente d'activation
      if (profile.value?.status === 'pending_validation') {
        const d = profile.value?.created_at || user.value?.created_at || Date.now()
        const createdTime = new Date(d).getTime()
        const expiryTime = createdTime + 7 * 24 * 60 * 60 * 1000
        const diffDays = Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000))
        const daysRemaining = Math.max(0, diffDays)

        const notifId = `pending-self-${profile.value.id || user.value?.id}`
        items.push({
          id: notifId,
          type: 'account_activation_required',
          title: 'Compte en attente d’activation',
          subtitle: 'Accès opérationnel suspendu',
          message: `Votre compte n'est pas encore activé. Il sera supprimé dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} sans confirmation. Pensez à solliciter vos supérieurs pour l'activation de votre compte.`,
          daysRemaining,
          actionLabel: null,
          createdAt: d,
          unread: !dismissedNotificationIds.value.has(notifId),
        })
      } else if (profile.value?.status === 'archived') {
        const d = profile.value?.archived_at || Date.now()
        const archivedTime = new Date(d).getTime()
        const expiryTime = archivedTime + 30 * 24 * 60 * 60 * 1000
        const diffDays = Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000))
        const daysRemaining = Math.max(0, diffDays)

        const notifId = `archived-self-${profile.value.id || user.value?.id}`
        items.push({
          id: notifId,
          type: 'account_archived',
          title: 'Compte archivé',
          subtitle: 'Période de rétractation (30 jours)',
          message: `Votre compte a été archivé. Il sera désactivé dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}. Vos données historiques restent conservées.`,
          daysRemaining,
          actionLabel: null,
          createdAt: d,
          unread: !dismissedNotificationIds.value.has(notifId),
        })
      } else if (profile.value?.status === 'disabled') {
        const notifId = `disabled-self-${profile.value.id || user.value?.id}`
        items.push({
          id: notifId,
          type: 'account_disabled',
          title: 'Compte désactivé',
          subtitle: 'Accès clos',
          message: 'La période d’archivage est arrivée à échéance. Votre compte est désactivé et vos données historiques sont scrupuleusement conservées.',
          daysRemaining: 0,
          actionLabel: null,
          createdAt: profile.value?.updated_at || Date.now(),
          unread: !dismissedNotificationIds.value.has(notifId),
        })
      }
    }

    return items
  })

  const unreadCount = computed(() => {
    return notifications.value.filter((n) => n.unread).length
  })

  const markAsRead = (id) => {
    dismissedNotificationIds.value.add(id)
  }

  const markAllAsRead = () => {
    for (const n of notifications.value) {
      dismissedNotificationIds.value.add(n.id)
    }
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  }
}
