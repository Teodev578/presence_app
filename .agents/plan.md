# Plan de Travail Agentique

Ce fichier porte le plan de la tâche fastidieuse en cours, conformément à la règle `.agents/rules/10-planification-taches-fastidieuses.md`. Il décrit une seule tâche à la fois : remplacer son contenu à chaque nouvelle tâche fastidieuse, puis le purger une fois la tâche close.

---

## Tâche en cours

- **Tâche** : Refonte UI/UX de l'espace gestionnaire, uniformisation des modules sur la grammaire de `LocationsView.vue` et `PresencesView.vue`.
- **Date** : 2026-09-30
- **Plan détaillé** : `.agents/plans/2026-09-30-refonte-ui-ux-espace-gestionnaire.md`.
- **Critère d'arrêt** : les cinq écrans partagent en-tête, carte de filtres à comptes, états chargement/vide/erreur explicites, présentation responsive (fiches sous 640px, tableau ou matrice au-delà) et modales à cibles 44px ; KPI unifiés entre tableau de bord et présences ; `npm run build` en sortie 0 ; `verify-gates.mjs --all` vert hors échecs préexistants.
- **État** : livré le 2026-09-30, porté par les clauses G88 à G91. Arbitrages retenus : option B (trois composants partagés), remplacement de `StatCard` par `ManagerKpiCard`, UI seule sans bascule local-first pour Collaborateurs et Équipes, bascule fiches/tableau à 640px, export pleine largeur, tableau de bord sans filtre, renommage d'équipe exposé.

### Étapes

- [x] 0. Arbitrages retenus (option B, remplacement de `StatCard`, UI seule, bascule 640px, export pleine largeur, dashboard sans filtre, renommage d'équipe) puis grammaire figée dans la règle 07 et ledger `GATES.md` (G88-G91).
- [x] 1. Tableau de bord (`DashboardView.vue`).
- [x] 2. Collaborateurs (`EmployeesView.vue`).
- [x] 3. Équipes (`TeamsView.vue`).
- [x] 4. Disponibilités (`AvailabilitiesView.vue`).
- [x] 5. Export (`ExportView.vue`).
- [x] 6. Audit, suppression de `StatCard`, `--manager-grammar`/`--manager-responsive`, build et suite complète.

### Clôture

Critère d'arrêt atteint le 2026-09-30. `node scripts/verify-gates.mjs --all` ne laisse que les quatre échecs préexistants hors périmètre (G1, G3, G4 sur `ToastContainer.vue` et `SyncIndicator.vue`, G8 sur `HomeView.vue`). G88, G89, G90, G91 vertes ; `npm run build` en sortie 0 ; suite navigateur verte.

### Tâche close précédente

Boucle d'apprentissage KI (2026-09-29), critère d'arrêt atteint, portée par les clauses G77 à G83.

### Suites à donner (hors périmètre de ce lot)

- `node .agents/skills/unlazy/scripts/gate-lint.mjs GATES.md` rapporte 26 erreurs structurelles pré-existantes : le fichier accumule 19 ledgers alors que le format unlazy attend un ledger par fichier. Déjà listé en P2 de l'audit (purge et archivage de `GATES.md`).
- Créer l'oracle de détection des `supabase.from(` dans `src/views/` pour élever KI-0002 au niveau 3.

### Tâches archivées

- `archive/2026-09-29-local-first-espace-gestionnaire.md` : lot « Espace Gestionnaire Local-First », étapes 1 à 6 livrées (G72-G76), étape 7 (migration RLS) bloquée faute de rattachement gestionnaire connu, constat hors périmètre sur `EmployeesView.vue` et `TeamsView.vue` (lectures réseau directes).
