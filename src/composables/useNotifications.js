import { ref, computed } from 'vue'
import { db, useLiveQuery } from '../lib/db'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { formatWeekLabel } from './useAvailabilities'

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

  // 1bis. Demandes d'absence en attente pour les superviseurs
  const pendingAbsenceRequests = useLiveQuery(async () => {
    if (!isManager.value) return []
    try {
      return await db.absence_requests
        .where('status')
        .equals('submitted')
        .filter((r) => !r.deleted_at)
        .toArray()
    } catch (e) {
      console.warn('Erreur lecture demandes absence Dexie :', e)
      return []
    }
  }, [isManager])

  // 1ter. Profils pour joindre le nom du demandeur
  const allProfiles = useLiveQuery(async () => {
    try {
      return await db.profiles.toArray()
    } catch {
      return []
    }
  }, [])

  // 1quater. Demandes d'absence personnelles du collaborateur connecté
  const myAbsenceRequests = useLiveQuery(async () => {
    if (!user.value?.id) return []
    try {
      return await db.absence_requests
        .where('user_id')
        .equals(user.value.id)
        .filter((r) => !r.deleted_at && (r.status === 'submitted' || r.status === 'validated' || r.status === 'refused'))
        .toArray()
    } catch (e) {
      console.warn('Erreur lecture demandes personnelles Dexie :', e)
      return []
    }
  }, [() => user.value?.id])

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

      // Demandes d'absence soumises par l'équipe
      const profilesMap = new Map((allProfiles.value || []).map((p) => [p.id, p]))
      const absenceList = pendingAbsenceRequests.value || []
      for (const req of absenceList) {
        const p = profilesMap.get(req.user_id)
        const notifId = `pending-absence-${req.id}`
        const daysCount = (req.days || []).length
        const daysLabel = daysCount > 1 ? `${daysCount} jours` : '1 jour'
        items.push({
          id: notifId,
          type: 'absence_request_pending',
          title: 'Demande d’absence en attente',
          subtitle: p?.full_name ? `${p.full_name}` : 'Collaborateur',
          badge: 'À traiter',
          badgeClass: 'badge-warning text-warning-content',
          message: `${p?.full_name || 'Un collaborateur'} sollicite une absence pour la semaine du ${formatWeekLabel(req.week_start, { short: true })} (${daysLabel}).`,
          targetRoute: '/manager/availabilities',
          actionLabel: 'Examiner les demandes',
          createdAt: req.created_at,
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
          title: 'Compte en attente de confirmation',
          subtitle: `Confirmation requise d'ici ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`,
          message: `Votre compte est bien enregistré. Pensez à contacter votre supérieur d'ici ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} afin de confirmer votre compte. Sinon, il sera supprimé.`,
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
      } else if (profile.value?.status === 'active' && profile.value?.confirmed_at) {
        // Notification de confirmation lorsque le profil a été validé par un responsable (pendant 30 jours)
        const confirmedTime = new Date(profile.value.confirmed_at).getTime()
        const isRecent = Date.now() - confirmedTime < 30 * 24 * 60 * 60 * 1000
        if (isRecent) {
          const notifId = `active-self-${profile.value.id || user.value?.id}`
          items.push({
            id: notifId,
            type: 'account_activated',
            title: 'Compte confirmé et actif',
            subtitle: 'Accès opérationnel débloqué',
            badge: 'Actif',
            badgeClass: 'badge-success text-success-content',
            message: 'Votre profil a été confirmé par votre responsable. Vous pouvez dès à présent pointer votre présence sur site et déclarer vos disponibilités.',
            targetRoute: '/employee/check-in',
            actionLabel: 'Pointer ma présence',
            createdAt: profile.value.confirmed_at,
            unread: !dismissedNotificationIds.value.has(notifId),
          })
        }
      }

      // Notifications relatives aux demandes d'absence de l'employé
      const myAbsences = myAbsenceRequests.value || []
      for (const req of myAbsences) {
        const notifId = `my-absence-${req.id}-${req.status}`
        const daysCount = (req.days || []).length
        const daysLabel = daysCount > 1 ? `${daysCount} jours` : '1 jour'
        const weekLabel = formatWeekLabel(req.week_start, { short: true })

        if (req.status === 'submitted') {
          items.push({
            id: notifId,
            type: 'absence_request_submitted',
            title: 'Demande d’absence transmise',
            subtitle: `Semaine du ${weekLabel}`,
            badge: 'En attente',
            badgeClass: 'badge-warning text-warning-content',
            message: `Votre demande d’absence (${daysLabel}) a été transmise à votre responsable et est en cours d’examen.`,
            targetRoute: '/employee/availabilities',
            actionLabel: 'Consulter ma demande',
            createdAt: req.created_at,
            unread: !dismissedNotificationIds.value.has(notifId),
          })
        } else if (req.status === 'validated') {
          const noteText = req.decision_note ? ` Message du responsable : « ${req.decision_note} »` : ''
          items.push({
            id: notifId,
            type: 'absence_request_response',
            title: 'Demande d’absence accordée',
            subtitle: `Semaine du ${weekLabel}`,
            badge: 'Accordée',
            badgeClass: 'badge-success text-success-content',
            message: `Votre responsable a validé votre absence pour la semaine (${daysLabel}). Les jours accordés sont signalés en vert sur votre planning.${noteText}`,
            targetRoute: '/employee/availabilities',
            actionLabel: 'Consulter mon planning',
            createdAt: req.decided_at || req.updated_at,
            unread: !dismissedNotificationIds.value.has(notifId),
          })
        } else if (req.status === 'refused') {
          const noteText = req.decision_note ? ` Motif : « ${req.decision_note} »` : ''
          items.push({
            id: notifId,
            type: 'absence_request_response',
            title: 'Demande d’absence refusée',
            subtitle: `Semaine du ${weekLabel}`,
            badge: 'Refusée',
            badgeClass: 'badge-error text-error-content',
            message: `Votre demande d’absence pour la semaine (${daysLabel}) n’a pas été accordée.${noteText}`,
            targetRoute: '/employee/availabilities',
            actionLabel: 'Consulter mon planning',
            createdAt: req.decided_at || req.updated_at,
            unread: !dismissedNotificationIds.value.has(notifId),
          })
        }
      }
    }

    return items
  })

  const unreadCount = computed(() => {
    return notifications.value.filter((n) => n.unread).length
  })

  const pendingAccountsCount = computed(() => {
    return (pendingProfiles.value || []).length
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
    pendingAccountsCount,
    markAsRead,
    markAllAsRead,
  }
}
