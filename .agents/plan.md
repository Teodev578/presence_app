# Plan : Transformation UI/UX du Module Disponibilités (Planning d'Équipe)

Date : 2026-10-01
Déclencheur : audit comparatif du module Disponibilités — élimination de la surcharge visuelle (« océan de badges verts »), contextualisation temporelle, dates françaises, visibilité des notes collaborateur et interactivité
Statut : Terminé (Validé par les portes G88, G89, G93, G105, G106, G107 et npm run build)

## 1. Périmètre

### Fichiers lus
- `src/views/manager/AvailabilitiesView.vue`
- `src/views/manager/PresencesView.vue`
- `src/views/manager/DashboardView.vue`
- `src/components/employee/WeekGrid.vue`
- `src/lib/dateUtils.js`
- `scripts/verify-gates.mjs`
- `GATES.md`

### Fichiers à modifier
- `src/views/manager/AvailabilitiesView.vue` :
  1. **Hiérarchie temporelle et épuration cellulaire** :
     - Remplacement de l'empilement double « badge Coché + texte » par un statut cellulaire unifié et sobre.
     - Jours passés pointés : pastille subtile verte avec l'heure d'arrivée réelle (ex. `09:28`).
     - Jours passés non pointés : alerte sobre ambrée `Non pointé` (sans vert contradictoire).
     - Jours absents déclarés : badge orange épuré `✕ Absent`.
     - Jours futurs : puce sobre `Prévu` ou `Absent prévu`.
  2. **Ancrage temporel et dates françaises** :
     - En-têtes de colonnes au format français naturel : `Lun. 28 sept.`, `Mar. 29 sept.`, etc.
     - Colonne du jour courant (`Aujourd'hui`) mise en exergue par une teinte de surface dédiée (`bg-primary/5` ou bordure subtile).
  3. **Visibilité des notes collaborateur** :
     - Affichage d'une icône bulle `💬` à côté du collaborateur ou sur la cellule lorsque celui-ci a saisi une note pour sa semaine.
  4. **Interactivité et consultation détaillée (Modale / Volet)** :
     - Clic sur une cellule : ouverture d'un volet d'information compact M3 (collaborateur, date, statut, heures exactes de pointage, lieu de travail, note éventuelle de l'employé, et raccourci direct vers le journal des présences).
  5. **Alignement éditorial des KPI** :
     - `Présences attendues` au lieu de `Créneaux déclarés`.
     - Légende d'état épurée et harmonieuse.
- `GATES.md` : spécification des gates d'acceptation G105, G106, G107.

### Hors périmètre
- Schémas Dexie et Supabase (les données de pointage, d'équipe et de note sont déjà présentes localement).
- Rôles et politiques RLS : intacts.
- Dépendances logicielles : intégrité stricte sans ajout ni mise à jour de paquets.

## 2. Étapes ordonnées

1. **Formalisation des gates dans GATES.md**
   - Inscription des oracles déterministes G105 (format de date français et mise en relief du jour courant), G106 (affichage épuré des cellules, notes collaborateur et modale de détail), G107 (compilation de production).

2. **Épuration des cellules et logique temporelle (`AvailabilitiesView.vue`)**
   - Calcul de la date d'aujourd'hui et détection de la colonne active.
   - Formatage des en-têtes en français (`Lun. 28 sept.`).
   - Extraction des notes hebdomadaires depuis `availabilities`.
   - Modélisation de l'état unifié de cellule (`present` avec heure, `not_pointed`, `absent`, `future_expected`, `future_absent`).

3. **Intégration de la modale de détail et des notes**
   - Composant de dialogue natif DaisyUI (`modal`) ou panneau M3 pour consulter la fiche de pointage / note de la cellule cliquée.
   - Raccordement vers la vue Présences (`/manager/presences`).

4. **Harmonisation de la légende et des KPI**
   - Mise à jour des libellés de KPI (`Présences attendues`).
   - Refonte de la barre de légende avec symboles unifiés.

5. **Validation et conformité**
   - Vérification de la suite de tests et des oracles `verify-gates.mjs`.
   - Contrôle headless navigateur (`scripts/verify-browser.mjs`).
   - Validation du build de production (`npm run build`).

## 3. Critère d'arrêt
Confronté et vérifié : `npm run build` en code retour 0, dates en français, absence de faux vert sur les jours non pointés, affichage des notes collaborateur, modale de détail fonctionnelle, et conformité de toutes les gates.
