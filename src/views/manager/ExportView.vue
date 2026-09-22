<script setup>
import { ref } from 'vue'
import { supabase } from '../../lib/supabase'

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
      alert('Aucun enregistrement trouvé pour la période sélectionnée.')
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
  } catch (err) {
    alert(`Erreur lors de l'export CSV : ${err.message}`)
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="export-view">
    <div class="view-header">
      <div>
        <h2 class="section-title">Export des Données de Présence</h2>
        <p class="section-desc">Générez un fichier tabulaire CSV prêt pour le traitement RH ou comptable</p>
      </div>
    </div>

    <div class="export-card">
      <h3 class="card-subtitle">Paramètres de la période</h3>

      <div class="dates-row">
        <div class="date-field">
          <label for="exp-start" class="field-label">Date de début :</label>
          <input id="exp-start" v-model="startDate" type="date" class="input-date" />
        </div>

        <div class="date-field">
          <label for="exp-end" class="field-label">Date de fin :</label>
          <input id="exp-end" v-model="endDate" type="date" class="input-date" />
        </div>
      </div>

      <div class="csv-details">
        <div class="detail-item">
          <span>Format de fichier :</span>
          <strong>CSV (encodage UTF-8, séparateur point-virgule)</strong>
        </div>
        <div class="detail-item">
          <span>Compatibilité :</span>
          <strong>Microsoft Excel, Google Sheets, LibreOffice Calc</strong>
        </div>
      </div>

      <div v-if="exportCount !== null" class="success-alert">
        ✓ Export réussi : <strong>{{ exportCount }}</strong> ligne(s) exportée(s).
      </div>

      <button
        type="button"
        class="btn-export"
        :disabled="isExporting"
        @click="generateCSV"
      >
        <span v-if="isExporting">Génération en cours...</span>
        <span v-else>📥 Télécharger l'export CSV</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.export-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 650px;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  color: #0f172a;
}

.section-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.2rem 0 0;
}

.export-card {
  background: #ffffff;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 1rem;
  padding: 1.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-subtitle {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.dates-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.input-date {
  padding: 0.65rem 0.85rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
}

.csv-details {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.65rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: #475569;
}

.detail-item {
  display: flex;
  justify-content: space-between;
}

.btn-export {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 0.95rem;
  border-radius: 0.65rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.2);
  transition: all 0.2s;
}

.btn-export:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-alert {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
}
</style>
