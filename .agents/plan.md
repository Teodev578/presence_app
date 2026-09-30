# Plan de Travail Agentique

Ce fichier porte le plan de la tâche fastidieuse en cours, conformément à la règle `.agents/rules/10-planification-taches-fastidieuses.md`. Il décrit une seule tâche à la fois : remplacer son contenu à chaque nouvelle tâche fastidieuse, puis le purger une fois la tâche close.

---

## Tâche en cours

- **Tâche** : Finitions de l'espace Paramètres.
- **Date** : 2026-09-30
- **Plan détaillé** : `.agents/plans/2026-09-30-plan-action-finitions-parametres.md`.
- **Critère d'arrêt** : les constats de l'audit traités, contrôle d'apparence lisible sur grand écran, titres conformes à la règle 07, état réseau sans ambiguïté, détails d'accessibilité corrigés ; `npm run build` en sortie 0 ; `--all` sans régression.
- **État** : livré le 2026-09-30, porté par la porte G95 étendue. Arbitrages actés : apparence bornée `max-w-md`, titres `text-base font-semibold`, état réseau « En ligne », contraste `/60`, avatar masqué, focus visible, titre de la section Déconnexion retiré, déconnexion immédiate.

### Étapes

- [x] 1. Apparence bornée et titres de section conformes.
- [x] 2. État réseau « En ligne » et contraste du texte secondaire.
- [x] 3. Accessibilité, focus, avatar décoratif.
- [x] 4. Déconnexion : immédiate.
- [x] 5. Clôture : build, suite complète, porte G95 étendue.

### Clôture

Critère d'arrêt atteint le 2026-09-30. `node scripts/verify-gates.mjs --all` ne laisse que les quatre échecs préexistants hors périmètre (G1, G3, G4, G8). G95 étendue verte, contrôle négatif compris. `npm run build` en sortie 0.

### Tâche close précédente

Navigation, retour en bandeau (2026-09-30), livrée sous la porte G97 : table de routes, flèche de retour, hamburger cédé, retours de contenu retirés, bandeau nommant l'écran. Révision : « Ma disponibilité » traitée comme écran descendant, retour à toutes les largeurs.

### Tâche close antérieure

Finitions de l'espace employé (2026-09-30), livrées sous les portes G94, G95 et G96 : typographie, contraste, vocabulaire, onepage hybride, densité bornée, page Paramètres (apparence, synchronisation, compte, déconnexion), pied de tiroir vidé, filet avant « Mon espace », transition entre espaces, passerelles inter-espace. Audit dans `docs/audits/audit-espace-employe-2026-09-30.md`.

### Tâche close ancienne

Finitions de l'espace gestionnaire (2026-09-30), livrée sous la clause G93 : icônes de rail à 22px, focus des entrées, bandeau à la marque, « Sites » seul, KPI sans tiret, matrice triable par nom. Audit dans `docs/audits/audit-espace-manager-2026-09-30.md`.

### Suites à donner (hors périmètre de ce lot)

- `node .agents/skills/unlazy/scripts/gate-lint.mjs GATES.md` rapporte 26 erreurs structurelles pré-existantes : le fichier accumule 19 ledgers alors que le format unlazy attend un ledger par fichier. Déjà listé en P2 de l'audit (purge et archivage de `GATES.md`).
- Créer l'oracle de détection des `supabase.from(` dans `src/views/` pour élever KI-0002 au niveau 3.

### Tâches archivées

- `archive/2026-09-29-local-first-espace-gestionnaire.md` : lot « Espace Gestionnaire Local-First », étapes 1 à 6 livrées (G72-G76), étape 7 (migration RLS) bloquée faute de rattachement gestionnaire connu, constat hors périmètre sur `EmployeesView.vue` et `TeamsView.vue` (lectures réseau directes).
