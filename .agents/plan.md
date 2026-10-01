# Plan : Gestion des Jours Fériés dans PresenceApp (Option 1 : Moteur Local-First)

Date : 2026-10-01
Déclencheur : Prise en charge des jours fériés légaux français (11 jours fériés + Alsace-Moselle) pour éliminer les fausses anomalies « Non pointé » et assainir les présences attendues
Statut : Terminé (Validé par les portes G88, G89, G93, G108, G109, G110 et npm run build)

## 1. Périmètre

### Fichiers lus
- `src/lib/dateUtils.js`
- `src/views/manager/AvailabilitiesView.vue`
- `src/views/manager/PresencesView.vue`
- `src/components/employee/WeekGrid.vue`
- `GATES.md`

### Fichiers à modifier
1. `src/lib/dateUtils.js` :
   - Algorithme canonique de calcul de Pâques (formule de Butcher/Meeus).
   - Génération de la table des jours fériés d'une année donnée (`getFrenchHolidays(year, options)`).
   - Prise en charge du régime général (11 jours) et de l'Alsace-Moselle (Vendredi saint, Saint-Étienne).
   - Prédicats d'aide `getPublicHoliday(dateStr, options)` et `isPublicHoliday(dateStr, options)`.

2. `src/views/manager/AvailabilitiesView.vue` :
   - Qualification des cellules : un jour férié chômé (sans pointage) n'est plus marqué en anomalie `Non pointé` mais reçoit un état apaisant `holiday` (« Férié »).
   - Si un collaborateur effectue un pointage effectif un jour férié, le badge de succès `present` est conservé avec mention du caractère férié.
   - En-tête des jours : mise en valeur du nom du jour férié (ex. `Lun. 6 avr. (L. Pâques)`).
   - Calcul des `Présences attendues` : les jours fériés chômés ne sont pas comptés comme attendus manquants.
   - Modale de détail et légende enrichies avec la mention du jour férié.

3. `GATES.md` :
   - Spécification des portes d'acceptation G108, G109, G110.

### Hors périmètre
- Dépendances logicielles : interdiction stricte d'installer des paquets npm externes.
- Requêtes réseau : pas d'API distante pour préserver le fonctionnement 100% hors-ligne.

## 2. Étapes ordonnées

1. **Formalisation des gates dans GATES.md**
   - Inscription des oracles déterministes G108 (moteur `dateUtils.js`), G109 (intégration dans `AvailabilitiesView.vue`), G110 (compilation Vite).

2. **Implémentation du moteur algorithmique dans `dateUtils.js`**
   - Fonctions `getEasterDate`, `getFrenchHolidays`, `getPublicHoliday`, `isPublicHoliday`.
   - Tests de régression sur les années 2025, 2026, 2027 et le régime d'Alsace-Moselle.

3. **Intégration dans `AvailabilitiesView.vue`**
   - Enrichissement du modèle d'état `dayState` avec le type `holiday`.
   - Ajustement de l'indicateur d'en-tête pour afficher le libellé du férié.
   - Ajustement de la formule de calcul de `stats` (présences attendues).
   - Mise à jour de la légende et de la modale de détail (sans émojis bruts, conformité G1/G88).

4. **Vérification et oracles déterministes**
   - Exécution des oracles G108, G109, G110 et vérification des gates gestionnaires (G88, G89, G93).
   - Validation du build de production (`npm run build`).

## 3. Critère d'arrêt
Toutes les portes G108, G109, G110 satisfaites, build Vite sans erreur, et absence d'anomalie injustifiée sur les jours fériés.
