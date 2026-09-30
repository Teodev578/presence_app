# Plan de Travail Agentique

Ce fichier porte le plan de la tâche fastidieuse en cours, conformément à la règle `.agents/rules/10-planification-taches-fastidieuses.md`. Il décrit une seule tâche à la fois : remplacer son contenu à chaque nouvelle tâche fastidieuse, puis le purger une fois la tâche close.

---

## Tâche en cours

- **Tâche** : Finitions de l'espace gestionnaire, issues de l'audit `docs/audits/audit-espace-manager-2026-09-30.md`.
- **Date** : 2026-09-30
- **Plan détaillé** : `.agents/plans/2026-09-30-plan-action-finitions-espace-manager.md`.
- **Critère d'arrêt** : les huit propositions de l'audit sont traitées, livrées ou actées ; oracles existants verts, chaque nouvelle règle dotée d'un contrôle négatif ; `npm run build` en sortie 0 ; `verify-gates.mjs --all` vert hors échecs préexistants.
- **État** : livré le 2026-09-30, porté par la clause G93. Arbitrages actés : option A (H1 de page, bandeau à la marque), matrice triable par nom, « Sites » seul. Icônes de rail à 22px, focus visible des entrées, KPI « Taux de tenue » sans tiret, grille KPI responsive, états vides distincts.

### Étapes

- [x] 1. Finitions visuelles sûres : icônes du rail à 22px, KPI « Taux de tenue » sans tiret isolé, grille KPI responsive, focus clavier des entrées de navigation.
- [x] 2. Vocabulaire et titres : retrait de « & Lieux », bandeau gestionnaire réduit à la marque (option A).
- [x] 3. États et cohérence : états vides distincts de la matrice de disponibilités, colonne Collaborateur triable par nom avec `aria-sort`.
- [x] 4. Clôture : build sortie 0, suite complète sans nouvelle régression, suite navigateur verte.

### Clôture

Critère d'arrêt atteint le 2026-09-30. `node scripts/verify-gates.mjs --all` ne laisse que les quatre échecs préexistants hors périmètre (G1, G3, G4, G8). G93 verte, contrôle négatif compris. Suite navigateur complète verte. `npm run build` en sortie 0.

### Tâche close précédente

Refonte UI/UX de l'espace gestionnaire (2026-09-30), livrée sous les clauses G88 à G92 : composants partagés, cinq écrans réalignés, passe de finition, garde-fou d'icônes de navigation. Audit dans `docs/audits/audit-espace-manager-2026-09-30.md`.

### Suites à donner (hors périmètre de ce lot)

- `node .agents/skills/unlazy/scripts/gate-lint.mjs GATES.md` rapporte 26 erreurs structurelles pré-existantes : le fichier accumule 19 ledgers alors que le format unlazy attend un ledger par fichier. Déjà listé en P2 de l'audit (purge et archivage de `GATES.md`).
- Créer l'oracle de détection des `supabase.from(` dans `src/views/` pour élever KI-0002 au niveau 3.

### Tâches archivées

- `archive/2026-09-29-local-first-espace-gestionnaire.md` : lot « Espace Gestionnaire Local-First », étapes 1 à 6 livrées (G72-G76), étape 7 (migration RLS) bloquée faute de rattachement gestionnaire connu, constat hors périmètre sur `EmployeesView.vue` et `TeamsView.vue` (lectures réseau directes).
