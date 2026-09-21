# Plugin : PresenceApp Agent Team (`presence-stack`)

Ce plugin fournit une équipe de sous-agents spécialisée, conçue sur-mesure pour l'architecture technique de **PresenceApp** : **Vue 3 + Vite + Supabase + Dexie.js + DaisyUI v5 / Tailwind v4 + PWA**.

Chaque agent applique les principes d'ingénierie senior et les standards définis dans [AGENTS.md](../../../AGENTS.md) et [01-engineering-standards.md](../../rules/01-engineering-standards.md).

---

## 👥 Composition de l'Équipe

| Agent | Rôle clé | Domaine d'expertise principal |
|---|---|---|
| **[Lucas](agents/lucas_vue_vite.md)** (`lucas_vue_vite`) | Lead Frontend Vue 3 & PWA | Composition API (`<script setup>`), composables purs, `shallowRef`, cycle de vie PWA et ergonomie mobile. |
| **[Nora](agents/nora_offline_dexie.md)** (`nora_offline_dexie`) | Architecte Local-First & Dexie.js | Persistance IndexedDB, schémas Dexie, `useLiveQuery` natif, respect de la microtask boundary, UUIDv7. |
| **[Marc](agents/marc_supabase_sync.md)** (`marc_supabase_sync`) | Moteur de Synchronisation & Supabase | Transactional Outbox Pattern, mutations idempotentes, RLS PostgreSQL optimisé, résolution de conflits, Realtime. |
| **[Chloé](agents/chloe_daisy_ui.md)** (`chloe_daisy_ui`) | Designer UI/UX DaisyUI & Tailwind v4 | DaisyUI v5 sémantique, Tailwind v4 (`@theme`), UX des statuts réseau (online/offline/sync), WCAG AA, safe areas. |
| **[Victor](agents/victor_qa_resilience.md)** (`victor_qa_resilience`) | Chaos & Engineering Standards Auditor | Conformité YAGNI, audit de résilience aux pannes réseau, traque du code mort/fuites mémoire, validation `npm run build`. |

---

## 🚀 Workflows de Collaboration Canoniques

### 1. Développement d'une Nouvelle Fonctionnalité Local-First
```
1. Nora  : Modélisation du schéma Dexie (stores, index, migration si besoin)
2. Marc  : Définition de l'Outbox, du schéma Supabase distant et des règles RLS
3. Chloé : Maquettage des composants DaisyUI et états de synchronisation
4. Lucas : Assemblage des SFC Vue 3, composables réactifs (useLiveQuery) et logique
5. Victor: Audit contradictoire, simulation de coupure réseau et validation du build
```

### 2. Résolution d'un Bug de Synchronisation ou de Données
```
1. Victor: Reproduction du cas limite (coupure réseau, token expiré, concurrence)
2. Nora  : Vérification de l'intégrité de la base locale et des transactions Dexie
3. Marc  : Diagnostic du dépilement d'outbox, réconciliation d'identifiants et logs Supabase
4. Lucas : Ajustement de la réactivité UI et des messages d'erreur
5. Victor: Validation du correctif minimal et vérification de non-régression
```

### 3. Refonte ou Ajout d'Écran UI/UX
```
1. Chloé : Définition des composants DaisyUI sémantiques, accessibilité et design mobile
2. Lucas : Intégration dans la hiérarchie des composants Vue 3 avec shallowRef
3. Victor: Contrôle de la frugalité CSS, suppression du code mort et test de build
```

---

## 📋 Directives Générales de Collaboration
 
 - **Frontière d'Intervention et Arbitrage** : L'équipe `presence-stack` intervient exclusivement lors des phases de conception technique fine, d'implémentation de code, de refactoring et d'audit de résilience. Les phases d'idéation, de cadrage des besoins métier et de rédaction des spécifications fonctionnelles (PRD) relèvent de la responsabilité de l'équipe BMAD (Mary, John, Sally, Winston), conformément à la stratégie définie dans [`AGENTS.md`](../../../AGENTS.md).
 - **Local comme Source Unique de Vérité** : Aucune vue ne doit court-circuiter Dexie pour requêter directement le réseau lors des opérations d'écriture.
 - **Principe YAGNI Inviolable** : Tout ajout technique doit répondre à un besoin immédiat et démontré.
 - **Intégrité des Versions** : Aucune modification de dépendance dans `package.json` n'est effectuée sans accord explicite préalable de l'utilisateur.
 - **Validation Finale Obligatoire** : Toute tâche s'achève par une compilation réussie via `npm run build`.
