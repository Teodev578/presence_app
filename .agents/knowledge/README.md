# Boucle d'Apprentissage KI

Ce dossier est la mémoire de travail des agents sur PresenceApp. Il remplace l'ancien stockage hors dépôt `<appDataDir>/knowledge/` : versionné, revu en pull request, partagé entre machines.

Un agent n'apprend pas dans ses poids. Tout ce qui doit survivre à une session vit ici, sous forme de fichiers revus. La conception complète et ses sources sont dans `docs/audits/setup-agentique-2026-09.md` (section 10).

## Principes

1. Écrire ne suffit pas. Une règle violée malgré sa fiche monte vers un contrôle exécutable.
2. La mémoire pourrit sans cycle de vie. Chaque fiche porte une date, un statut et une échéance de revalidation.
3. Ce qui n'est pas mesuré n'est pas de l'apprentissage. Le taux de récurrence d'erreur se suit.
4. Rien de dérivable du code ne se stocke ici. Un chemin, une signature ou une commande déjà lisibles dans le dépôt ne méritent pas de fiche.

## Deux couches

| Couche | Emplacement | Partagée | Usage |
|---|---|---|---|
| Équipe | `.agents/knowledge/` (commitée) | oui, via git | leçons, patterns et pièges qui engagent tout le monde |
| Personnelle | `.agents/knowledge.local/` (gitignorée) | non | préférences de travail, notes de session |

Ne jamais écrire de préférence personnelle dans la couche équipe : elle se mettrait à gouverner les sessions de tous.

## Cycle de vie d'une fiche

| Statut | Sens |
|---|---|
| `candidate` | constaté, pas encore vérifiable par une commande |
| `active` | validé, avec un moyen de vérification |
| `a-verifier` | dépassé par son échéance de revalidation, à confirmer ou à reclasser |
| `superseded` | remplacé par une fiche plus récente |
| `retired` | tombé en désuétude, conservé pour l'historique |

`INDEX.md` est la porte d'entrée : 200 lignes au maximum, une ligne par fiche candidate ou active, chargée en tête de session. Le détail des fiches se lit à la demande.

## Capture : l'acte unique

La correction et l'enregistrement forment un seul acte. Le moment où une correction atterrit, l'agent écrit la fiche datée et signée. Une leçon consignée le lendemain est une leçon perdue.

Déclencheurs officiels :

- la même erreur se produit une deuxième fois ;
- le même commentaire de revue revient une deuxième fois ;
- l'utilisateur répète la même correction ;
- un bug sorti de `.scratch/` ou d'un ledger `GATES.md` a coûté plus d'une heure.

Formulation : une règle en action, datée et reliée à son incident. « Quand X arrive, faire Z, parce que le [date] tel composant a coûté telle chose ». Une note factuelle non datée se lit comme une suggestion.

## Échelle d'escalade

Une règle qui reste violée n'a pas sa place dans la mémoire. Elle monte :

| Niveau | Support | Quand |
|---|---|---|
| 1 | fiche KI (conseil) | le constat est fait, la vérification manuelle |
| 2 | règle `.agents/rules/` (contexte permanent) | la leçon engage toutes les sessions |
| 3 | oracle ou hook (application) | la règle est violée une fois de plus |

Niveau 3 type : un flag de `scripts/verify-gates.mjs`, un contrôle de `scripts/knowledge-check.mjs`, un hook pre-commit. La mémoire conseille, l'oracle applique.

## Métabolisme

Quatre opérations, chacune en revue, en diff : `ADD`, `NARROW` (restreindre le domaine), `REPLACE` (remplacer une version), `RETIRE`. On ne réécrit pas l'historique, on le survit. Une fiche remplacée passe en `superseded` avec la référence de sa remplaçante.

Chaque fiche porte `revalider-avant` (date + 60 jours par défaut). L'oracle `node scripts/knowledge-check.mjs --staleness` refuse une fiche active périmée.

## Rituel planifié

Le rituel bimensuel maintient la vivacité et la salubrité de la base de connaissances.
Cadence : toutes les deux semaines (14 jours).
Commandes d'inspection :
- `npm run knowledge:check` (structure, validité, liaisons et récurrences)
- `npm run knowledge:staleness` (fraîcheur des fiches actives)
- `npm run knowledge:recurrence` (détection d'erreurs récurrentes)
- `npm run knowledge:ritual` (contrôle d'échéance du rituel)

Points de contrôle du rituel :
1. Contradictions éventuelles entre fiches ;
2. Doublons à fusionner ;
3. Fiches dépassées (`a-verifier`) à confirmer ou reclasser ;
4. Contenu dérivable du code à supprimer ;
5. Analyse des récurrences signalées par `--recurrence`.

Garde-fou automatique : si le délai depuis le dernier rituel enregistré dans `INDEX.md` excède 21 jours, l'oracle `knowledge:ritual` lève une erreur bloquante. La date du dernier rituel dans `INDEX.md` est actualisée à chaque clôture de rituel, et les conclusions sont consignées dans `.agents/WRITING_IMPROVEMENT.md`.

## Clôture de tâche (protocole de fin de session)

À l'achèvement de toute tâche d'implémentation de complexité ≥ « Moyen » :
1. L'agent principal consulte les déclencheurs officiels (même erreur deux fois, bug > 1h, remarque répétée).
2. L'agent formule obligatoirement dans son rapport ou ses évidences de validation :
   - soit l'attestation explicite : `Déclencheur KI : N (aucun motif répété ni coût > 1h)` ;
   - soit l'enregistrement immédiat : création de la fiche `KI-XXXX` avec son frontmatter et inscription dans `INDEX.md`.
3. Cette conformité garantit que l'apprentissage ne s'érode pas au fil des sessions.

## Frontière de promotion

```
expérience → fiche candidate → revue humaine → fiche active → règle → skill
```

Une procédure réutilisable par tâche mérite un skill. Une règle d'équipe stable mérite `.agents/rules/`. Tout le reste reste ici. Aucun palier ne se franchit sans revue.

## Mesure

- **Taux de récurrence** : même signature d'erreur dans `.scratch/`, `GATES.md` ou les fiches. Doit tendre vers zéro par fiche active.
- **Inventaire vivant** : fiches actives, périmées, escaladées. Une mémoire qui ne fait que grossir se dégrade.
- **Replay** : rejouer périodiquement les scénarios de bug passés, en suite de non-régression.
- **Oracles** : `node scripts/knowledge-check.mjs --all` pour la santé de la base, `node scripts/verify-gates.mjs --all` pour les règles escaladées.

## Règles pour les sous-agents

Un sous-agent lit `INDEX.md` en début de tâche et travaille en lecture seule sur la mémoire. Il dépose ses constats dans ses propres artefacts ; l'agent principal porte la fiche candidate. Aucun sous-agent n'écrit dans `.agents/knowledge/` ni dans `.agents/rules/`.

Ses conditions de travail restent : brief auto-portant, artefacts sortis sur disque (des chemins, pas des résumés), revue portée par un agent sans historique partagé avec l'auteur.
