/**
 * Résumé pur de la sélection hebdomadaire de disponibilités.
 *
 * La grille ne doit pas laisser l'employé enregistrer à l'aveugle : ce module dérive, à partir
 * des identifiants cochés et du calendrier affiché, un compte et des libellés courts ordonnés
 * selon la semaine. Aucune dépendance réactive, donc directement éprouvable hors navigateur.
 */

const EMPTY_LABEL = 'Aucun jour sélectionné';

/**
 * @param {number[]} selectedDays identifiants des jours cochés
 * @param {Array<{ id: number, label?: string, short?: string }>} days jours affichés, dans l'ordre de la semaine
 */
export function summarizeAvailability(selectedDays = [], days = []) {
  const selected = new Set(Array.isArray(selectedDays) ? selectedDays : []);
  const orderedDays = (Array.isArray(days) ? days : []).filter((day) => selected.has(day.id));
  const labels = orderedDays.map((day) => day.short || day.label || String(day.id));

  return {
    count: orderedDays.length,
    labels,
    isEmpty: orderedDays.length === 0,
    label: describeAvailabilityCount(orderedDays.length),
  };
}

/**
 * Formule le compte dans un libellé stable : le pluriel reste explicite plutôt que suffixé.
 */
export function describeAvailabilityCount(count) {
  if (count <= 0) return EMPTY_LABEL;
  return count > 1 ? `${count} jours sélectionnés` : '1 jour sélectionné';
}
