# Plan de Travail Agentique

Ce fichier porte le plan de la tâche fastidieuse en cours, conformément à la règle `.agents/rules/10-planification-taches-fastidieuses.md`. Il décrit une seule tâche à la fois : remplacer son contenu à chaque nouvelle tâche fastidieuse, puis le purger une fois la tâche close.

---

## Tâche en cours

- **Tâche** : Rendre l'espace gestionnaire réellement local-first (Dexie source de vérité, plus de lecture directe Supabase).
- **Date** : 2026-09-29
- **Critère d'arrêt** : les quatre vues gestionnaire lisent Dexie et rien d'autre, `npm run build` en sortie 0, aucune porte rouge nouvelle, limite RLS consignée. **Atteint sauf pour la migration RLS**, laissée en suspens faute de connaître le rattachement gestionnaire.

### Étapes livrées

- [x] **1. Élargir le pull de l'engine** (`useSyncEngine.js`) : `profiles` et `teams` ajoutés au pull ; périmètre de `presences` et `availabilities` selon le rôle lu dans le profil local, avec repli restrictif employé.
  - Vérification : `--sync-scope` verte (G73).
- [x] **2. `useLiveQuery` dépendant de la plage** (`db.js`) : paramètre `dependsOn`, réabonnement, imports morts `isRef` et `watchEffect` retirés.
  - Vérification : `--livequery-deps` verte (G74).
- [x] **3. Contrôle des Présences sur Dexie** (`PresencesView.vue`) : plus de `ref` impératif ni de requête réseau, lecture réactive bornée sur l'index `work_date`, jointures locales, correction via outbox seule, actualisation portée par l'engine.
  - Vérification : `--presences-localfirst` verte (G72), `--presences-period`, `--presences-ui`, `--presences-table` et `--presences-sort` vertes.
- [x] **4. Les trois autres vues gestionnaire sur Dexie** : tableau de bord, disponibilités d'équipe, export CSV.
  - Vérification : `--manager-dexie` verte (G75).
- [x] **5. Bouton Actualiser** : déclenche `syncNow(user?.id)`, désactivé pendant un cycle.
  - Vérification : couverte par G72.
- [x] **6. Preuves** : clauses G72 à G76 dans `GATES.md`, oracle de période réaligné sur le contrat local (plus de `gte`/`lte` distants).
  - Vérification : `node scripts/verify-gates.mjs --all` ne laisse que les quatre échecs pré-existants hors périmètre (G1, G3, G4 sur `ToastContainer.vue` et `SyncIndicator.vue`, G8 sur `HomeView.vue`), `npm run build` en sortie 0.

### Étape restante, bloquée

- [ ] **7. Migration RLS** : élargir la policy SELECT de `presences` au périmètre du gestionnaire, avec les index B-Tree exigés par l'ADR 0004.
  - **Blocage** : le rattachement gestionnaire n'est pas connu. Options non tranchées : `profiles.team_id`, table de jointure `team_managers`, ou périmètre organisation.
  - À traiter : fonction `SECURITY DEFINER` pour lire le rôle sans récursion RLS, puis policy sur `presences`.
  - Effet attendu une fois livrée : les quatre écrans gestionnaire dépassent enfin les pointages du gestionnaire, sans nouvelle modification cliente.

### Reste hors périmètre, constaté

`EmployeesView.vue` et `TeamsView.vue` conservent leur lecture réseau directe. Ils montent des requêtes `supabase.from('profiles')`, `from('teams')` et écrivent directement, sans passer par l'outbox.
