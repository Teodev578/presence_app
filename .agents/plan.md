# Plan : Élimination du padding excessif et passage en pleine largeur fluide

Date : 2026-10-01
Déclencheur : demande utilisateur d'audit et résolution du padding vide sur grand écran (ultrawide / desktop étiré)
Statut : Planification

## 1. Périmètre

### Fichiers lus
- `src/layouts/ManagerLayout.vue`
- `src/layouts/EmployeeLayout.vue`
- `src/views/SettingsView.vue`
- `src/views/manager/DashboardView.vue`
- `src/views/manager/LocationsView.vue`
- `src/views/manager/PresencesView.vue`
- `src/views/manager/AvailabilitiesView.vue`
- `src/views/manager/EmployeesView.vue`
- `src/views/manager/TeamsView.vue`
- `src/views/manager/ExportView.vue`
- `src/views/employee/HomeView.vue`
- `scripts/verify-gates.mjs`

### Fichiers à modifier
- `src/layouts/ManagerLayout.vue` : libération du conteneur `main` vers la pleine largeur fluide.
- `src/layouts/EmployeeLayout.vue` : extension ultra-large tout en préservant le token oracle `max-w-6xl`.
- `src/views/manager/LocationsView.vue` : passage de la grille de sites en 4 colonnes sur très grand écran (`2xl:grid-cols-4`).
- `src/views/manager/TeamsView.vue` : passage de la grille d'équipes en 4 colonnes sur très grand écran (`2xl:grid-cols-4`).
- `src/views/SettingsView.vue` : adaptation de la grille en 3 colonnes sur grand écran (`xl:grid-cols-3`).
- `GATES.md` : consignation des gates d'acceptation et des preuves d'exécution unlazy.

### Hors périmètre
- `src/views/auth/LoginView.vue` : conserve son centrage `max-w-md` adapté à un formulaire de connexion.
- Schémas de base de données et tables Dexie : intacts.
- Dépendances du projet : intégrité stricte sans modification de version.

## 2. Étapes ordonnées

1. **Audit d'impact et validation des contrats d'oracles** [FAIT]
   - Absence d'oracle bloquant sur `max-w-7xl` vérifiée dans `ManagerLayout.vue`.
   - Présence du token `max-w-6xl` préservée pour `EmployeeLayout.vue` dans `scripts/verify-gates.mjs`.

2. **Rédaction du grand livre GATES.md** [FAIT]
   - Définition des gates G98, G99, G100, G101 avec commandes exécutables `CHECK:`.

3. **Mise à niveau du layout Manager (`ManagerLayout.vue`)** [FAIT]
   - Remplacement de `max-w-7xl mx-auto` par `xl:px-10 w-full max-w-none`.

4. **Mise à niveau du layout Employé (`EmployeeLayout.vue`)** [FAIT]
   - Remplacement de `2xl:max-w-[1600px]` par `2xl:max-w-none` avec maintien de `max-w-6xl`.

5. **Optimisation des grilles pour grand écran (`LocationsView.vue`, `TeamsView.vue`, `SettingsView.vue`)** [FAIT]
   - Grilles de cartes de sites et d'équipes passées en `2xl:grid-cols-4`.
   - Section Apparence de `SettingsView.vue` bornée à `max-w-md` conformément à G95.

6. **Validation et clôture** [FAIT]
   - Compilation de production réussie (`npm run build` en 1.06s).
   - Tests de domaine validés (`node scripts/test-domain.mjs`).
   - Gates G98, G99, G100, G101 validés et preuves enregistrées dans `GATES.md`.

## 3. Critère d'arrêt
Confronté et vérifié : `npm run build` en sortie 0, suppression totale de `max-w-7xl mx-auto`, et conformité de tous les tests. Tâche close.
