<script setup>
import { ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../composables/useToast'

const { success, error: toastError, warning } = useToast()

const todayStr = new Date().toISOString().slice(0, 10)
const firstDayOfMonth = new Date()
firstDayOfMonth.setDate(1)
const startOfMonthStr = firstDayOfMonth.toISOString().slice(0, 10)

const startDate = ref(startOfMonthStr)
const endDate = ref(todayStr)
const isExporting = ref(false)
const exportCount = ref(null)

const generateCSV = async () => {
  isExporting.value = true
  exportCount.value = null

  try {
    const { data, error } = await supabase
      .from('presences')
      .select('*, profiles(full_name, email, role, teams(name)), locations(name)')
      .gte('work_date', startDate.value)
      .lte('work_date', endDate.value)
      .is('deleted_at', null)
      .order('work_date', { ascending: true })

    if (error) throw error

    if (!data || !data.length) {
      warning('Aucun enregistrement trouvé pour la période sélectionnée.')
      return
    }

    exportCount.value = data.length

    // En-têtes CSV
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

    // Assemblage avec point-virgule et BOM UTF-8 pour Excel
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `presence_export_${startDate.value}_au_${endDate.value}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    success(`${data.length} pointage(s) exporté(s) en CSV.`)

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
  <div class="flex flex-col gap-6 max-w-xl">
    <div>
      <h2 class="text-2xl font-black tracking-tight text-base-content">Export des Données de Présence</h2>
      <p class="text-xs text-base-content/60 mt-0.5">Générez un fichier tabulaire CSV prêt pour le traitement RH ou comptable</p>
    </div>

    <!-- Carte de configuration de l'export DaisyUI -->
    <div class="card bg-base-100 border border-base-300 shadow-xs rounded-m3-lg p-5 sm:p-6 flex flex-col gap-5">
      <h3 class="text-base font-bold text-base-content">Paramètres de la période</h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="fieldset">
          <label for="exp-start" class="fieldset-legend text-xs font-semibold text-base-content/70">Date de début :</label>
          <input id="exp-start" v-model="startDate" type="date" class="input input-bordered input-sm rounded-m3-sm w-full" />
        </div>

        <div class="fieldset">
          <label for="exp-end" class="fieldset-legend text-xs font-semibold text-base-content/70">Date de fin :</label>
          <input id="exp-end" v-model="endDate" type="date" class="input input-bordered input-sm rounded-m3-sm w-full" />
        </div>
      </div>

      <div class="bg-base-200/60 border border-base-200 rounded-m3-md p-4 flex flex-col gap-2 text-xs text-base-content/80">
        <div class="flex justify-between items-center">
          <span class="text-base-content/60">Format de fichier :</span>
          <strong class="text-base-content">CSV (UTF-8 avec BOM, séparateur ;)</strong>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-base-content/60">Compatibilité :</span>
          <strong class="text-base-content">Excel, Google Sheets, Calc</strong>
        </div>
      </div>

      <button
        type="button"
        class="btn w-full text-base font-bold min-h-12 shadow-xs rounded-m3-md mt-1 active:scale-98 transition-all gap-2"
        :class="[
          exportCount !== null
            ? 'btn-success text-success-content'
            : 'btn-primary'
        ]"
        :disabled="isExporting"
        @click="generateCSV"
      >
        <span v-if="isExporting" class="loading loading-spinner loading-sm"></span>
        <span v-if="isExporting">Génération en cours...</span>
        <template v-else-if="exportCount !== null">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Export réussi ({{ exportCount }} ligne{{ exportCount > 1 ? 's' : '' }})</span>
        </template>
        <template v-else>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Télécharger l'export CSV</span>
        </template>
      </button>
    </div>
  </div>
</template>
