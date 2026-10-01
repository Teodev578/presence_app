---
id: KI-0002
date: 2026-09-29
auteur: agent (constat hors périmètre du lot local-first)
statut: active
domaine: sync
triggers: ["supabase.from", "lecture réseau directe", "écriture directe", "hors outbox"]
source: résolution intégrale du lot éradication des temps de chargement (plan 2026-10-01)
revalider-avant: 2026-11-28
---

## Situation

Le 29/09/2026, deux vues restaient hors de la boucle : `EmployeesView.vue` et `TeamsView.vue` montaient leurs propres requêtes `supabase.from('profiles')` et `from('teams')`.
Le 01/10/2026, ces deux vues ainsi que `CheckInView.vue` et `CheckOutView.vue` ont été intégralement migrées vers la réactivité Dexie `useLiveQuery` et les transactions atomiques `sync_outbox`.

## Règle

Quand une vue affiche ou modifie des données métier, la lire par `useLiveQuery` sur Dexie et faire passer toute écriture par l'outbox. Ne jamais monter de `supabase.from()` dans un composant de vue : la donnée arrive par le pull de l'engine, la correction repart par la file.

## Vérification

Oracle G111 dans GATES.md : détection de l'absence totale de `supabase.from` et d'import de Supabase dans les vues.

## Élévation

Niveau 1. Passer au niveau 3 dès que l'oracle existe, puis évaluer la montée en règle `.agents/rules/04-sync-engine-and-outbox.md` si le motif se répète.
