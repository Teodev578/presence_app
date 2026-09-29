# Plan de Travail Agentique

Ce fichier porte le plan de la tâche fastidieuse en cours, conformément à la règle `.agents/rules/10-planification-taches-fastidieuses.md`. Il décrit une seule tâche à la fois : remplacer son contenu à chaque nouvelle tâche fastidieuse, puis le purger une fois la tâche close.

---

## Tâche en cours

- **Tâche** : Implémenter la boucle d'apprentissage KI (P1 de l'audit `docs/audits/setup-agentique-2026-09.md`, section 10).
- **Date** : 2026-09-29
- **Critère d'arrêt** : la mémoire vit dans le dépôt (`.agents/knowledge/` + couche locale ignorée par git), le protocole de capture et l'échelle d'escalade sont documentés et reliés à `AGENTS.md`, la règle 11 et la matrice 08, un oracle déterministe (`scripts/knowledge-check.mjs`) contrôle la structure et le cycle de vie, `npm run build` en sortie 0.

### Étapes

- [x] 1. **Oracle** : `scripts/knowledge-check.mjs` avec flags `--structure`, `--frontmatter`, `--index`, `--staleness`, `--wiring`, `--gitignore`, `--all`, et `--root` pour les contrôles négatifs sur fixtures.
- [x] 2. **Socle mémoire** : `.agents/knowledge/` avec `README.md` (protocole : capture, format, escalade, métabolisme, mesure), `TEMPLATE.md`, `INDEX.md` (≤ 200 lignes).
- [x] 3. **Premières fiches réelles** : KI-0001 (dépendances de `useLiveQuery`, active, niveau 3) et KI-0002 (vues hors outbox, candidate, oracle à créer).
- [x] 4. **Câblage** : section KI d'`AGENTS.md` réécrite, règle `11-apprentissage-et-memoire.md`, ligne dans la matrice `08-skills-activation.md`, `.gitignore` pour `.agents/knowledge.local/`.
- [x] 5. **Preuves** : clauses G77 à G83 dans `GATES.md` avec contrôles négatifs (5 fixtures cassées, 5 échecs détectés au bon oracle), `npm run build` et `verify-gates.mjs --build` en sortie 0.

### Clôture

Critère d'arrêt atteint le 2026-09-29. Aucune régression : `node scripts/verify-gates.mjs --all` ne laisse que les quatre échecs pré-existants hors périmètre (G1, G3, G4 sur `ToastContainer.vue` et `SyncIndicator.vue`, G8 sur `HomeView.vue`).

### Suites à donner (hors périmètre de ce lot)

- `node .agents/skills/unlazy/scripts/gate-lint.mjs GATES.md` rapporte 26 erreurs structurelles pré-existantes : le fichier accumule 19 ledgers alors que le format unlazy attend un ledger par fichier. Déjà listé en P2 de l'audit (purge et archivage de `GATES.md`).
- Créer l'oracle de détection des `supabase.from(` dans `src/views/` pour élever KI-0002 au niveau 3.

### Tâches archivées

- `archive/2026-09-29-local-first-espace-gestionnaire.md` : lot « Espace Gestionnaire Local-First », étapes 1 à 6 livrées (G72-G76), étape 7 (migration RLS) bloquée faute de rattachement gestionnaire connu, constat hors périmètre sur `EmployeesView.vue` et `TeamsView.vue` (lectures réseau directes).
