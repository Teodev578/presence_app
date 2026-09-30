# Plan de Travail Agentique

Ce fichier porte le plan de la tâche fastidieuse en cours, conformément à la règle `.agents/rules/10-planification-taches-fastidieuses.md`. Il décrit une seule tâche à la fois : remplacer son contenu à chaque nouvelle tâche fastidieuse, puis le purger une fois la tâche close.

---

## Tâche en cours

- **Tâche** : Finitions de l'espace employé, issues de l'audit `docs/audits/audit-espace-employe-2026-09-30.md`.
- **Date** : 2026-09-30
- **Plan détaillé** : `.agents/plans/2026-09-30-plan-action-finitions-espace-employe.md`.
- **Critère d'arrêt** : les constats de l'audit sont traités, livrés ou actés ; aucune taille de police arbitraire ni date capitalisée à tort ; cibles du pointage à 44 px ; oracles verts ; `npm run build` en sortie 0.
- **État** : livré le 2026-09-30 pour les lots 1 à 6, porté par les portes G94, G95 et G96, avec révision du pied de tiroir. Arbitrages actés : vocabulaire « Arrivée / Départ », « Pointage », « En cours », « Ma disponibilité » ; bandeau nommant l'espace et le module dans les deux espaces ; onepage hybride sous 760px de haut ; cartes étirées au contenu borné ; page Paramètres dédiée (apparence, synchronisation, compte, déconnexion) par engrenage ; pied de tiroir vidé de ses réglages au profit de la page. Correctif : l'import `useProfile` d'`EmployeeLayout` manquait, la passerelle « Espace Gestionnaire » avait disparu pour les rôles autorisés ; G96 verrouille le cas. Portes G11, G20, G22, G35 réécrites.

### Étapes

- [x] 1. Typographie et contraste : retrait de `capitalize`, tailles dans l'échelle, jours révolus lisibles, placeholders contrastés.
- [x] 2. Densité, libellés et cibles : semaine équilibrée, tuile Départs sans troncature, panneaux bornés, sélecteur à 44 px.
- [x] 3. Vocabulaire : termes uniques par notion, « Ma disponibilité ».
- [x] 4. Bandeau nommant l'espace et le module dans les deux espaces. Icône de paramètres en attente.
- [x] 5. Repli onepage sous 760px de haut.
- [x] 6. Clôture : build, suite complète, G94.

### Clôture

Critère d'arrêt atteint pour les lots 1 à 3 et 5. `node scripts/verify-gates.mjs --all` ne laisse que les quatre échecs préexistants hors périmètre (G1, G3, G4, G8). G94 verte, contrôle négatif compris. `npm run build` en sortie 0. Reste l'icône de paramètres du bandeau à préciser.

### Tâche close précédente

Finitions de l'espace gestionnaire (2026-09-30), livrée sous la clause G93 : icônes de rail à 22px, focus des entrées, bandeau à la marque, « Sites » seul, KPI sans tiret, matrice triable par nom. Audit dans `docs/audits/audit-espace-manager-2026-09-30.md`.

### Suites à donner (hors périmètre de ce lot)

- `node .agents/skills/unlazy/scripts/gate-lint.mjs GATES.md` rapporte 26 erreurs structurelles pré-existantes : le fichier accumule 19 ledgers alors que le format unlazy attend un ledger par fichier. Déjà listé en P2 de l'audit (purge et archivage de `GATES.md`).
- Créer l'oracle de détection des `supabase.from(` dans `src/views/` pour élever KI-0002 au niveau 3.

### Tâches archivées

- `archive/2026-09-29-local-first-espace-gestionnaire.md` : lot « Espace Gestionnaire Local-First », étapes 1 à 6 livrées (G72-G76), étape 7 (migration RLS) bloquée faute de rattachement gestionnaire connu, constat hors périmètre sur `EmployeesView.vue` et `TeamsView.vue` (lectures réseau directes).
