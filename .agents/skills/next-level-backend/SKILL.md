---
name: next-level-backend
description: >
  Audit backend complet du projet PresenceApp : intégrité des composables (frontière Vue / logique),
  cohérence du schéma Dexie (versions, index, singleton), robustesse du moteur de synchronisation
  (Outbox, idempotence, tombstones, résilience réseau), sécurité RLS Supabase (politiques, index,
  colonnes système), et qualité des migrations SQL. Produit un rapport structuré de findings triés
  par sévérité dans WRITING_IMPROVEMENT.md avant tout correctif.
  Déclencheurs : "next-level-backend", "audit backend", "audit sync", "audit Dexie", "audit RLS",
  "audit sécurité", "revue schéma".
---

# next-level-backend — Audit Backend & Intégrité des Données

Ce skill audite les quatre couches backend de PresenceApp : composables, persistance Dexie, moteur de synchronisation Outbox, et Supabase (RLS + schéma). Il diagnostique d'abord, priorise, puis propose des correctifs ciblés pour validation. Aucune migration ni modification de schéma ne s'exécute sans accord explicite de Fabien.

**Avant tout travail**, lire :
- `.agents/rules/03-local-first-and-dexie.md` (frontière microtask, UUIDv7, versioning schéma, singleton)
- `.agents/rules/04-sync-engine-and-outbox.md` (Outbox structure, idempotence, tombstones, Dead Letter Queue)
- `.agents/rules/05-supabase-rls-and-schema.md` (RLS activation, indexation, colonnes système, pull incrémental)
- `.agents/rules/01-engineering-standards.md` (YAGNI, sobriété, hygiène)

---

## Phase 1 — Inventaire du périmètre

Cartographier les fichiers à inspecter :

```
src/composables/        (useAuth, useAvailabilities, useLocations, usePresences,
                         useProfile, useSyncEngine, useGeolocation, useDevicePermissions)
src/lib/
  db.js                 (schéma Dexie, versions, singleton)
  domain.js             (logique métier pure)
  supabase.js           (client Supabase, configuration)
  uuidv7.js             (génération UUIDv7)

supabase/migrations/    (tous les fichiers .sql)
```

Pour chaque composable, noter :
- Taille en octets (proxy de complexité)
- Présence d'appels Supabase directs (violation de la frontière local-first)

Commande d'inventaire rapide :
```bash
grep -rn "supabase\.from\|supabase\.auth\|supabase\.rpc" src/composables/ src/views/ src/components/ --include="*.js" --include="*.vue"
```

---

## Phase 2 — Audit Couche 1 : Composables & Frontière Vue/Logique

### Axe 1 : Frontière Local-First (règle `04`)

La règle est absolue : aucun composant Vue, aucune vue, aucun composable d'interface ne doit appeler directement `supabase.from(...).insert()`, `.update()` ou `.delete()`.

- Détecter tout appel Supabase de mutation hors de `useSyncEngine.js` :
```bash
grep -rn "\.insert\|\.update\|\.delete\|\.upsert" src/composables/ src/views/ src/components/ --include="*.js" --include="*.vue" | grep -v "useSyncEngine"
```

- Vérifier que chaque écriture passe par la double transaction Dexie (entité + outbox) avant toute sortie réseau.

### Axe 2 : Pureté des composables

- Un composable doit avoir une responsabilité unique. Signaler tout composable qui mélange lecture locale (Dexie) et logique de sync (useSyncEngine).
- `useLiveQuery` avec dépendances paramétrées : vérifier que `dependsOn` est déclaré pour chaque requête paramétrée (KI-0001).
- Pas de `supabase.from()` dans `src/views/` (KI-0002).

```bash
grep -rn "useLiveQuery" src/composables/ --include="*.js" | grep -v "dependsOn"
```

---

## Phase 3 — Audit Couche 2 : Schéma Dexie & Persistance Locale

### Axe 3 : Versionnement du schéma (règle `03`)

Inspecter `src/lib/db.js` :
- Aucune version historique `db.version(n)` ne doit être modifiée rétroactivement.
- Toute nouvelle colonne ou index passe par un `db.version(n+1)` avec `.upgrade()` si besoin.
- Vérifier qu'aucun `++id` n'est utilisé pour les entités métier synchronisées.

```bash
grep -n "++id\|++\[" src/lib/db.js
```

### Axe 4 : Index Dexie minimaux

- N'indexer que les propriétés explicitement filtrées dans les requêtes composables.
- Signaler tout index déclaré dans `db.version().stores()` sans requête filtrante correspondante dans les composables.

### Axe 5 : Singleton Dexie

- Vérifier qu'une seule instance `new Dexie()` existe dans tout le codebase.

```bash
grep -rn "new Dexie(" src/ --include="*.js" --include="*.vue"
```

---

## Phase 4 — Audit Couche 3 : Moteur de Synchronisation & Outbox

### Axe 6 : Structure de la table `sync_outbox` (règle `04`)

Chaque entrée d'outbox doit comporter les champs obligatoires :
`id`, `client_mutation_id`, `table_name`, `record_id`, `operation`, `payload`, `created_at`, `attempts`, `status`.

Inspecter `src/lib/db.js` et `useSyncEngine.js` :
- Vérifier que tous les champs sont présents et correctement typés.
- Vérifier que `status` couvre les trois états `'pending' | 'syncing' | 'failed'`.

### Axe 7 : Idempotence & Tombstones (règle `04`)

- Confirmer que `client_mutation_id` est propagé jusqu'à Supabase (upsert déterministe ou contrainte d'unicité côté serveur).
- Vérifier que les suppressions utilisent `deleted_at = new Date().toISOString()` et non un `DELETE` physique.

```bash
grep -rn "\.delete()\|\.delete(" src/composables/ src/lib/ --include="*.js" | grep -v "// tombstone\|deleted_at"
```

### Axe 8 : Résilience réseau & Dead Letter Queue

- Les erreurs transitoires (5xx, timeout) laissent l'entrée en `status: 'pending'` avec backoff exponentiel.
- Les erreurs permanentes (4xx, rejet RLS) basculent en `status: 'failed'` et ne bloquent pas les mutations suivantes.
- Vérifier que `useSyncEngine.js` implémente la séparation des types d'erreurs.
- Y a-t-il une Dead Letter Queue ou un mécanisme d'alerte utilisateur pour les entrées `failed` ?

---

## Phase 5 — Audit Couche 4 : Supabase RLS & Schéma Distant

### Axe 9 : Activation RLS sur toutes les tables (règle `05`)

Vérifier dans les migrations que chaque table créée active RLS :
```bash
grep -rn "CREATE TABLE" supabase/migrations/ | grep -v "-- " | while read line; do
  table=$(echo "$line" | grep -o "public\.[a-z_]*")
  grep -rn "ENABLE ROW LEVEL SECURITY" supabase/migrations/ | grep "$table" || echo "⚠️  RLS manquant : $table"
done
```

Ou via MCP Supabase : `list_tables` + `get_advisors` pour détecter les tables sans RLS.

### Axe 10 : Indexation des colonnes de filtrage RLS (règle `05`)

Chaque colonne dans une clause `USING` ou `WITH CHECK` doit avoir un index B-Tree.
Vérifier notamment `user_id`, `organization_id`, `deleted_at`, `updated_at`.

```bash
grep -rn "USING\|WITH CHECK" supabase/migrations/ --include="*.sql"
```

Comparer avec les `CREATE INDEX` présents dans les migrations.

### Axe 11 : Optimisation `(select auth.uid())` (règle `05`)

```bash
grep -rn "auth\.uid()" supabase/migrations/ --include="*.sql" | grep -v "(select auth.uid())"
```

Toute occurrence sans sous-requête scalaire est un finding.

### Axe 12 : Colonnes système obligatoires (règle `05`)

Chaque table métier doit comporter `id UUID PRIMARY KEY`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `deleted_at TIMESTAMPTZ`.

```bash
grep -A 20 "CREATE TABLE" supabase/migrations/ --include="*.sql" -rn | grep -v "updated_at\|deleted_at\|created_at"
```

### Axe 13 : Pull incrémental (règle `05`)

- Vérifier que les requêtes de pull dans `useSyncEngine.js` utilisent `updated_at > :curseur` et non un fetch complet.
- Vérifier l'existence d'un index composite `(user_id, updated_at)` dans les migrations.

```bash
grep -rn "updated_at" src/composables/useSyncEngine.js
grep -rn "idx_.*sync\|user_id.*updated_at" supabase/migrations/ --include="*.sql"
```

---

## Phase 6 — Rapport de findings

Produire un rapport dans `.agents/WRITING_IMPROVEMENT.md` sous "Tâches actives" :

```markdown
### Tâche : Audit next-level-backend — [date]
**Date** : AAAA-MM-JJ
**Complexité** : Élevée
**Proposant** : next-level-backend skill

#### Findings triés par sévérité

| # | Sévérité | Axe | Fichier(s) | Description | Correctif proposé |
|---|----------|-----|-----------|-------------|-------------------|
| 1 | 🔴 Critique | Axe 1 — Frontière | usePresences.js | Appel `.update()` direct sur Supabase | Passer par useSyncEngine + outbox |
| 2 | 🟡 Moyen | Axe 8 — DLQ | useSyncEngine.js | Pas de DLQ pour les failed | Ajouter table dead_letter_queue |
| 3 | 🟢 Mineur | Axe 11 — RLS | 004_create_presences.sql | auth.uid() sans sous-requête scalaire | Remplacer par (select auth.uid()) |

#### Décision
**Findings retenus pour correction** : (en attente de Fabien)
**Trade-offs acceptés** : …
**Engagement KI** : O/N

#### Résultat
- Implémenté ? N (en attente de validation Fabien)
```

**Règle de sévérité** :
- 🔴 Critique : violation de frontière local-first, RLS désactivé sur une table, `DELETE` physique sans tombstone, entré d'outbox bloquant la queue
- 🟡 Moyen : idempotence non garantie, absence de DLQ, index RLS manquant, `useLiveQuery` sans `dependsOn`, versioning Dexie incorrectement modifié
- 🟢 Mineur : `auth.uid()` sans scalaire, index composite pull absent, colonnes système incomplètes, composable à responsabilité mixte

---

## Phase 7 — Validation obligatoire avant correctifs

1. Présenter le rapport complet à Fabien.
2. Fabien valide les findings à corriger (🔴 en priorité absolue).
3. Tout correctif touchant les migrations Supabase : formuler le script réversible (up + down), validation Fabien obligatoire avant `apply_migration`.
4. Tout correctif de complexité ≥ Moyen déclenche `unlazy` (GATES.md obligatoire).
5. Correctifs Dexie (schéma, versioning) → Nora. Correctifs Supabase (RLS, migrations) → Marc. Correctifs composables → Lucas.

---

## Phase 8 — Correctifs ciblés

Pour chaque finding validé :
- Ouvrir une entrée dans `.agents/WRITING_IMPROVEMENT.md`
- Migrations SQL : rédiger up + down avant exécution, `apply_migration` via MCP Supabase uniquement après validation
- `npm run build` obligatoire avant de déclarer terminé
- Si le finding correspond à un déclencheur KI, écrire la fiche immédiatement dans `.agents/knowledge/`

---

## Checklist de clôture

- [ ] Tous les findings 🔴 adressés ou repoussés avec justification écrite
- [ ] Aucun appel mutation Supabase hors `useSyncEngine.js`
- [ ] RLS activé sur toutes les tables (`get_advisors` MCP confirme zéro alerte RLS)
- [ ] `npm run build` passe sans erreur
- [ ] `node scripts/verify-gates.mjs --all` passe
- [ ] Rapport final dans `WRITING_IMPROVEMENT.md` avec statut "Implémenté"
- [ ] Fiche KI créée si pattern récurrent identifié
