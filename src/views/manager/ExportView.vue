<script setup>
import { ref, computed } from 'vue'
import { db, useLiveQuery } from '../../lib/db'
import { getLocalDateString, getMonday, formatWorkDate } from '../../lib/dateUtils'
import { useToast } from '../../composables/useToast'
import ManagerPageHeader from '../../components/manager/ManagerPageHeader.vue'
import ManagerKpiCard from '../../components/manager/ManagerKpiCard.vue'

const { success, error: toastError, warning } = useToast()

const todayStr = getLocalDateString()

// Filtre de période : mêmes presets que la vue des pointages, pour une seule grammaire de dates.
const filterPeriod = ref('month') // 'day' | 'week' | 'month' | 'custom'
const filterDate = ref(getLocalDateString())
const customStart = ref(getLocalDateString())
const customEnd = ref(getLocalDateString())

const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + days)
  return getLocalDateString(d)
}

const shiftAnchor = (unit, direction) => {
  const anchor = filterDate.value || getLocalDateString()
  if (unit === 'month') {
    const d = new Date(`${anchor}T12:00:00`)
    d.setDate(1)
    d.setMonth(d.getMonth() + direction)
    filterDate.value = getLocalDateString(d)
    return
  }
  filterDate.value = addDays(anchor, 7 * direction)
}

const dateRange = computed(() => {
  const anchor = filterDate.value || getLocalDateString()

  if (filterPeriod.value === 'custom') {
    const start = customStart.value || anchor
    const end = customEnd.value || start
    return start <= end ? { start, end } : { start: end, end: start }
  }
  if (filterPeriod.value === 'week') {
    const monday = getMonday(new Date(`${anchor}T12:00:00`))
    return { start: monday, end: addDays(monday, 6) }
  }
  if (filterPeriod.value === 'month') {
    const d = new Date(`${anchor}T12:00:00`)
    return {
      start: getLocalDateString(new Date(d.getFullYear(), d.getMonth(), 1)),
      end: getLocalDateString(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
    }
  }
  return { start: anchor, end: anchor }
})

const periodLabel = computed(() => {
  const { start, end } = dateRange.value
  if (filterPeriod.value === 'day') return formatWorkDate(start, { long: true }) || start
  if (filterPeriod.value === 'month') {
    const d = new Date(`${start}T12:00:00`)
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }
  return `${formatWorkDate(start) || start} → ${formatWorkDate(end) || end}`
})

// Aperçu du volume : lecture locale, bornée sur l'index `work_date`, sans requête réseau.
const previewRows = useLiveQuery(async () => {
  const { start, end } = dateRange.value
  if (!start || !end) return []
  return db.presences
    .where('work_date')
    .between(start, end, true, true)
    .filter((p) => !p.deleted_at)
    .toArray()
}, null, () => `${dateRange.value.start}|${dateRange.value.end}`)

const previewCount = computed(() => (previewRows.value ? previewRows.value.length : null))

const isExporting = ref(false)
const exportCount = ref(null)

const generateCSV = async () => {
  isExporting.value = true
  exportCount.value = null

  try {
    // L'export lit le cache local, donc exactement ce que l'écran peut voir.
    const { start, end } = dateRange.value
    const presenceRows = await db.presences
      .where('work_date')
      .between(start, end, true, true)
      .filter((p) => !p.deleted_at)
      .toArray()

    if (!presenceRows.length) {
      warning('Aucun enregistrement trouvé pour la période sélectionnée.')
      return
    }

    const profilesMap = new Map((await db.profiles.toArray()).map((p) => [p.id, p]))
    const teamsMap = new Map((await db.teams.toArray()).map((t) => [t.id, t]))
    const locationsMap = new Map((await db.locations.toArray()).map((l) => [l.id, l]))

    const data = presenceRows.map((p) => {
      const profile = profilesMap.get(p.user_id) || null
      return {
        ...p,
        profiles: profile
          ? { ...profile, teams: teamsMap.get(profile.team_id) || null }
          : null,
        locations: locationsMap.get(p.location_id) || null,
      }
    })

    exportCount.value = data.length

    const headers = [
      'Date',
      'Collaborateur',
      'Email',
      'Équipe',
      'Site',
      'Heure Arrivée',
      'Heure Départ',
      'Statut',
      'Latitude Arrivée',
      'Longitude Arrivée',
      'Précision GPS (m)',
    ]

    const rows = data.map((p) => {
      const formatTime = (iso) => (iso ? new Date(iso).toLocaleTimeString('fr-FR') : '')
      return [
        p.work_date,
        `"${(p.profiles?.full_name || '').replace(/"/g, '""')}"`,
        `"${(p.profiles?.email || '').replace(/"/g, '""')}"`,
        `"${(p.profiles?.teams?.name || 'Sans équipe').replace(/"/g, '""')}"`,
        `"${(p.locations?.name || '').replace(/"/g, '""')}"`,
        formatTime(p.check_in_time),
        formatTime(p.check_out_time),
        p.status,
        p.check_in_lat ?? '',
        p.check_in_lng ?? '',
        p.check_in_accuracy ? Math.round(p.check_in_accuracy) : '',
      ]
    })

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `presence_export_${start}_au_${end}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    success(data.length > 1 ? `${data.length} pointages exportés en CSV.` : '1 pointage exporté en CSV.')

    setTimeout(() => {
      exportCount.value = null
    }, 4000)
  } catch (err) {
    toastError(`Erreur lors de l'export CSV : ${err.message}`)
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <ManagerPageHeader
      title="Export des pointages"
      subtitle="Téléchargez un fichier CSV pour votre tableur ou vos fiches de paie"
    >
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </template>
    </ManagerPageHeader>

    <!-- Aperçu du volume avant export -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      <ManagerKpiCard
        :label="filterPeriod === 'day' ? 'Journée' : filterPeriod === 'month' ? 'Mois' : filterPeriod === 'week' ? 'Semaine' : 'Période'"
        :value="periodLabel"
      />
      <ManagerKpiCard
        label="Pointages"
        :value="previewCount === null ? '…' : previewCount"
        caption="Enregistrements de la période"
        tone="primary"
      />
      <ManagerKpiCard
        label="Format"
        value="CSV"
        caption="UTF-8, séparateur point-virgule"
        tone="info"
      />
    </div>

    <!-- Configuration de l'export -->
    <div class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 flex flex-col gap-4">
      <fieldset class="fieldset">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Période</legend>
        <div class="join w-full overflow-x-auto sm:w-auto">
          <button type="button" class="btn join-item min-h-11 px-3 shrink-0" :class="{ 'btn-primary': filterPeriod === 'day' }" @click="filterPeriod = 'day'">Jour</button>
          <button type="button" class="btn join-item min-h-11 px-3 shrink-0" :class="{ 'btn-primary': filterPeriod === 'week' }" @click="filterPeriod = 'week'">Semaine</button>
          <button type="button" class="btn join-item min-h-11 px-3 shrink-0" :class="{ 'btn-primary': filterPeriod === 'month' }" @click="filterPeriod = 'month'">Mois</button>
          <button type="button" class="btn join-item min-h-11 px-3 shrink-0" :class="{ 'btn-primary': filterPeriod === 'custom' }" @click="filterPeriod = 'custom'">Personnalisé</button>
        </div>
      </fieldset>

      <fieldset v-if="filterPeriod === 'day'" class="fieldset sm:w-auto">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Date</legend>
        <input v-model="filterDate" type="date" class="input input-bordered min-h-11 rounded-m3-sm w-full sm:w-auto" />
      </fieldset>

      <fieldset v-else-if="filterPeriod === 'week'" class="fieldset">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Semaine</legend>
        <div class="inline-flex items-center rounded-m3-md border border-base-300 bg-base-300/50">
          <button type="button" class="btn btn-ghost min-h-11 min-w-11 p-0 rounded-l-m3-md" aria-label="Semaine précédente" @click="shiftAnchor('week', -1)">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
          </button>
          <span class="px-3 min-h-11 flex items-center text-sm font-semibold text-base-content tabular-nums">{{ periodLabel }}</span>
          <button type="button" class="btn btn-ghost min-h-11 min-w-11 p-0 rounded-r-m3-md" aria-label="Semaine suivante" @click="shiftAnchor('week', 1)">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
          </button>
        </div>
      </fieldset>

      <fieldset v-else-if="filterPeriod === 'month'" class="fieldset">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Mois</legend>
        <div class="inline-flex items-center rounded-m3-md border border-base-300 bg-base-300/50">
          <button type="button" class="btn btn-ghost min-h-11 min-w-11 p-0 rounded-l-m3-md" aria-label="Mois précédent" @click="shiftAnchor('month', -1)">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
          </button>
          <span class="px-3 min-h-11 flex items-center text-sm font-semibold text-base-content">{{ periodLabel }}</span>
          <button type="button" class="btn btn-ghost min-h-11 min-w-11 p-0 rounded-r-m3-md" aria-label="Mois suivant" @click="shiftAnchor('month', 1)">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
          </button>
        </div>
      </fieldset>

      <div v-else class="flex flex-col sm:flex-row gap-3">
        <fieldset class="fieldset sm:flex-1 min-w-0">
          <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Du</legend>
          <input v-model="customStart" type="date" :max="customEnd" class="input input-bordered min-h-11 rounded-m3-sm w-full" />
        </fieldset>
        <fieldset class="fieldset sm:flex-1 min-w-0">
          <legend class="fieldset-legend text-xs font-semibold text-base-content/70">Au</legend>
          <input v-model="customEnd" type="date" :min="customStart" class="input input-bordered min-h-11 rounded-m3-sm w-full" />
        </fieldset>
      </div>

      <div class="bg-base-300/60 border border-base-300/60 rounded-m3-md p-4 flex flex-col gap-2 text-xs text-base-content/80">
        <div class="flex justify-between items-center gap-3">
          <span class="text-base-content/60">Compatibilité</span>
          <strong class="text-base-content text-right">Excel, Google Sheets, Calc</strong>
        </div>
        <div class="flex justify-between items-center gap-3">
          <span class="text-base-content/60">Pointages de la période</span>
          <strong class="text-base-content">{{ previewCount === null ? '…' : previewCount }}</strong>
        </div>
      </div>

      <button
        type="button"
        class="btn w-full text-base font-bold min-h-12 shadow-xs rounded-m3-md active:scale-98 transition-all gap-2"
        :class="exportCount !== null ? 'btn-success text-success-content' : 'btn-primary'"
        :disabled="isExporting || previewCount === 0"
        @click="generateCSV"
      >
        <span v-if="isExporting" class="loading loading-spinner loading-sm"></span>
        <span v-if="isExporting">Génération du fichier CSV...</span>
        <template v-else-if="exportCount !== null">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Export terminé ({{ exportCount > 1 ? `${exportCount} pointages` : '1 pointage' }})</span>
        </template>
        <template v-else>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Télécharger le fichier CSV</span>
        </template>
      </button>
    </div>
  </div>
</template>
