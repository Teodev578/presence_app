---
id: KI-0002
date: 2026-09-29
auteur: agent (constat hors périmètre du lot local-first)
statut: candidate
domaine: sync
triggers: ["supabase.from", "lecture réseau directe", "écriture directe", "hors outbox"]
source: constat hors périmètre du lot Espace Gestionnaire Local-First (plan archivé 2026-09-29)
revalider-avant: 2026-11-28
---

## Situation

Le 29/09/2026, en conclusion du lot local-first, deux vues restaient hors de la boucle : `EmployeesView.vue` et `TeamsView.vue` montent leurs propres requêtes `supabase.from('profiles')` et `from('teams')`, et écrivent directement, sans passer par l'outbox. Chaque vue qui travaille ainsi contredit l'ADR 0001 (Dexie source unique de vérité) et échappe au moteur de sync.

## Règle

Quand une vue affiche ou modifie des données métier, la lire par `useLiveQuery` sur Dexie et faire passer toute écriture par l'outbox. Ne jamais monter de `supabase.from()` dans un composant de vue : la donnée arrive par le pull de l'engine, la correction repart par la file.

## Vérification

aucune (statut candidate). Oracle à créer : un flag qui détecte `supabase.from(` dans `src/views/` et distingue les lectures de l'engine des lectures de vues.

## Élévation

Niveau 1. Passer au niveau 3 dès que l'oracle existe, puis évaluer la montée en règle `.agents/rules/04-sync-engine-and-outbox.md` si le motif se répète.
