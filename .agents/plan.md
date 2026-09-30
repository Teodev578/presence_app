# Plan de Travail Agentique

Ce fichier porte le plan de la tâche fastidieuse en cours, conformément à la règle `.agents/rules/10-planification-taches-fastidieuses.md`. Il décrit une seule tâche à la fois : remplacer son contenu à chaque nouvelle tâche fastidieuse, puis le purger une fois la tâche close.

---

## Tâche en cours

- **Tâche** : Navigation, retour en bandeau.
- **Date** : 2026-09-30
- **Plan détaillé** : `.agents/plans/2026-09-30-plan-navigation-retour-bandeau.md`.
- **Critère d'arrêt** : commande de navigation cohérente dans le bandeau (retour sur les écrans hors tiroir, hamburger sur les destinations de tiroir sous 840 px), aucun nom d'espace dans le bandeau, aucun retour en double dans le contenu, cible de 44 px et nom accessible, `npm run build` en sortie 0, `--all` sans régression.
- **État** : livré le 2026-09-30, porté par la porte G97. Arbitrages actés : retour sur les écrans hors tiroir à toute largeur et sur les destinations du tiroir sur mobile ; en-tête de la page Paramètres retiré ; flèche remplaçant le hamburger ; « Ma disponibilité » avec retour mobile seulement ; flèche seule nommée `Retour`.

### Étapes

- [x] 1. Table de routes et bandeau unifié (titre par écran, plus de nom d'espace).
- [x] 2. Commande de retour en tête du bandeau, cible 44 px et nom accessible.
- [x] 3. Retrait des boutons de retour de contenu et de l'en-tête des paramètres.
- [x] 4. Clôture : build, suite complète, porte G97.

### Clôture

Critère d'arrêt atteint le 2026-09-30. `node scripts/verify-gates.mjs --all` ne laisse que les quatre échecs préexistants hors périmètre (G1, G3, G4, G8). G97 verte, contrôle négatif compris. `npm run build` en sortie 0.

### Tâche close précédente

Finitions de l'espace employé (2026-09-30), livrées sous les portes G94, G95 et G96 : typographie, contraste, vocabulaire, onepage hybride, densité bornée, page Paramètres (apparence, synchronisation, compte, déconnexion), pied de tiroir vidé, filet avant « Mon espace », transition entre espaces, passerelles inter-espace. Audit dans `docs/audits/audit-espace-employe-2026-09-30.md`.

### Tâche close antérieure

Finitions de l'espace gestionnaire (2026-09-30), livrée sous la clause G93 : icônes de rail à 22px, focus des entrées, bandeau à la marque, « Sites » seul, KPI sans tiret, matrice triable par nom. Audit dans `docs/audits/audit-espace-manager-2026-09-30.md`.

### Suites à donner (hors périmètre de ce lot)

- `node .agents/skills/unlazy/scripts/gate-lint.mjs GATES.md` rapporte 26 erreurs structurelles pré-existantes : le fichier accumule 19 ledgers alors que le format unlazy attend un ledger par fichier. Déjà listé en P2 de l'audit (purge et archivage de `GATES.md`).
- Créer l'oracle de détection des `supabase.from(` dans `src/views/` pour élever KI-0002 au niveau 3.

### Tâches archivées

- `archive/2026-09-29-local-first-espace-gestionnaire.md` : lot « Espace Gestionnaire Local-First », étapes 1 à 6 livrées (G72-G76), étape 7 (migration RLS) bloquée faute de rattachement gestionnaire connu, constat hors périmètre sur `EmployeesView.vue` et `TeamsView.vue` (lectures réseau directes).
