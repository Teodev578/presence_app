---
id: KI-0001
date: 2026-09-29
auteur: agent (lot Espace Gestionnaire Local-First)
statut: active
domaine: dexie
triggers: ["useLiveQuery", "dependsOn", "réabonnement", "plage de dates"]
source: GATES.md G74 (lot Espace Gestionnaire Local-First)
revalider-avant: 2026-11-28
---

## Situation

Le 29/09/2026, les vues gestionnaire qui filtrent sur une plage de dates ne se rafraîchissaient pas quand la plage changeait. `Dexie.liveQuery` gardait son abonnement initial : la requête restait calée sur la première plage lue. Cause : `useLiveQuery` n'acceptait aucune dépendance réactive et ne réabonnait jamais.

## Règle

Quand un composable expose `useLiveQuery` sur une requête qui dépend d'un état réactif (plage de dates, rôle, filtre), déclarer cette dépendance dans le second argument `dependsOn` pour que le réabonnement parte. Ne jamais appeler `useLiveQuery` sur une requête paramétrée sans passer par ce mécanisme.

## Vérification

`node scripts/verify-gates.mjs --livequery-deps`

## Élévation

Niveau 3 : l'oracle `--livequery-deps` refuse un `useLiveQuery` sans dépendance explicite. La fiche garde la trace du pourquoi, l'oracle tient la ligne.
