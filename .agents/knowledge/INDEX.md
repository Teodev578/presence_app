# INDEX des Knowledge Items

Porte d'entrée de la mémoire d'équipe. Une ligne par fiche candidate ou active, 200 lignes au maximum. Le détail se lit à la demande dans les fiches. Protocole complet : `README.md` dans ce dossier.

Lecture en tête de session, avant toute conception. Une fiche `a-verifier` se confirme ou se reclasse avant de servir de base à un travail.

## Fiches actives

| Id | Règle | Domaine | Vérification | Revalider avant |
|---|---|---|---|---|
| KI-0001 | `useLiveQuery` sur requête paramétrée : déclarer la dépendance `dependsOn` pour réabonner | dexie | `verify-gates.mjs --livequery-deps` | 2026-11-28 |
| KI-0002 | Vue = lecture Dexie + écriture outbox, jamais de `supabase.from()` dans `src/views/` | sync | oracle G111 (`node -e ...`) | 2026-11-28 |

## Fiches candidates

| Id | Règle | Domaine | Vérification | Revalider avant |
|---|---|---|---|---|
| (aucune) | | | | |

## Compteur de récurrence

Chaque reproduction d'une erreur déjà fichée s'inscrit ici, datée. Deux récurrences sur une même fiche déclenchent l'escalade (niveau 2 ou 3).

| Id | Réoccurrences | Dates |
|---|---|---|
| (aucune) | | |

## Rituel bimensuel

Suivi de la santé de la mémoire agentique (nettoyage, obsolescence, récurrences).
Dernière exécution : 2026-10-01
Prochaine échéance : 2026-10-15
Statut : conforme (cadence bimensuelle ≤ 14 jours, alerte automatique si > 21 jours)
