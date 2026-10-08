# Verdict Critic — Délégation de l'analyse de code à des sous-agents pour économiser des tokens

**Date** : 2026-10-08  
**Projet** : PresenceApp  
**Idée examinée** : Déléguer des tâches d'ingénierie consommatrices de contexte (analyse statique, exploration de base de code, audit de conformité) à des sous-agents autonomes éphémères dans le but déclaré de réduire la consommation globale de tokens.

---

## 1. Plaidoirie (L'Avocat)

Dans toute session de travail interactive prolongée avec un modèle de langage, la consommation de tokens obéit à une mécanique cumulative : chaque fichier lu dans la session principale demeure dans la fenêtre de contexte et se trouve refacturé à chaque tour de parole ultérieur. Si une phase d'investigation initiale ingère quarante mille tokens de code pour identifier un dysfonctionnement et que la session se poursuit durant dix tours d'échanges pour implémenter et affiner la solution, ces quarante mille tokens sont injectés dix fois, représentant quatre cent mille tokens d'entrée payés uniquement pour porter l'historique d'une exploration achevée.

Déléguer cette tâche d'exploration à un sous-agent autonome éphémère permet d'établir une cloison étanche. Le sous-agent lit le code volumineux, résout sa tâche dans son propre espace d'exécution et ne renvoie à l'agent orchestrateur qu'une synthèse décisionnelle de quelques centaines de tokens. La session principale préserve ainsi la pureté de sa fenêtre d'attention, élimine le risque d'oubli d'instructions par saturation (problème d'attention au milieu du contexte) et réduit drastiquement la taxe cumulative sur la durée de vie de la session.

- **L'argument le plus solide** : L'élimination de la récurrence tarifaire et attentionnelle des données volumineuses d'inspection sur les échanges ultérieurs de la session principale.
- **Ce qui ne peut être prouvé** : La certitude que la durée de vie moyenne des sessions de développement soit suffisante pour amortir le coût fixe d'instanciation de chaque sous-agent.
- **Ce qui invaliderait ma plaidoirie** : La démonstration que les sessions intégrant une analyse de code sont majoritairement brèves (moins de trois tours après l'analyse) ou que le prompt caching rend la réinjection d'historique négligeable face au surcoût de démarrage d'un sous-agent.

---

## 2. Réquisitoire (Le Procureur)

L'affirmation selon laquelle la sous-délégation économise des tokens relève d'une illusion comptable lorsqu'elle est énoncée sans condition de seuil. Un sous-agent ne s'exécute pas à coût nul : il exige à chaque instanciation le chargement complet de son prompt système, de la définition de ses outils et du contexte réglementaire du projet. Cet overhead d'amorçage représente un investissement fixe de huit à quinze mille tokens d'entrée avant même la première ligne de code analysée. Pour une inspection portant sur deux fichiers de composant, instancier un sous-agent pour lire trois mille tokens consomme quinze mille tokens au total, générant une surconsommation brute immédiate.

Pire, l'isolation du sous-agent crée une perte de contexte opérationnel. Dépourvu de l'historique conversationnel et de la compréhension fine des arbitrages discutés avec le développeur, le sous-agent risque de produire une analyse déconnectée ou incomplète. L'orchestrateur doit alors soit réclamer des clarifications, soit relire lui-même les fichiers, doublant la dépense globale. Cette dérive contrevient directement aux règles établies du dépôt :
1. `.agents/rules/08-skills-activation.md:32-40` interdit déjà l'escalade vers un sous-agent spécialisé pour les tâches touchant moins de deux fichiers ou de complexité simple.
2. `.agents/rules/01-engineering-standards.md:14-16` prohibe l'empilement d'abstractions prématurées et d'indirections superflues (principe YAGNI).
3. `.agents/rules/01-engineering-standards.md:42-43` met en garde contre les modules superficiels et le morcellement artificiel.

- **Ce qui est fatal** : Pour toute tâche d'analyse légère ou moyenne (inférieure à quinze mille tokens), l'overhead d'instanciation du sous-agent excède systématiquement l'économie espérée sur la session principale.
- **Ce qui est corrigeable** : Soumettre la délégation à un seuil volumétrique strict et à un indice de complexité minimal.
- **Faits vérifiés** : `.agents/rules/08-skills-activation.md:32-40`, `.agents/rules/01-engineering-standards.md:14-16`, `.agents/rules/01-engineering-standards.md:42-43`.

---

## 3. Comptes (Le Comptable)

- **Qui paierait** : L'utilisateur, à travers sa consommation de quota d'API ou son forfait d'inférence.
- **Modèle de coût** :
  - Coût fixe d'instanciation d'un sous-agent (prompt système, schémas d'outils, instructions) : `10 000 tokens [supposé]`.
  - Volume de code à inspecter : `X tokens`.
  - Synthèse retournée à la session principale : `1 000 tokens [supposé]`.
  - Nombre de tours d'échange ultérieurs dans la session principale : `N tours`.
  - Formule d'exécution in-session : `C_in = X × (N + 1)`.
  - Formule avec sous-agent : `C_sub = 11 000 + X + (1 000 × N)`.

| Scénario | Données (X, N) | Coût In-Session | Coût Sous-Agent | Bilan |
|---|---|---|---|---|
| Inspection ciblée (1-2 fichiers) | X = 3 000 [supposé], N = 2 [supposé] | 9 000 tokens | 16 000 tokens | **Déficit de 7 000 tokens (+77 %)** |
| Analyse médiane (module) | X = 15 000 [supposé], N = 4 [supposé] | 75 000 tokens | 30 000 tokens | **Gain de 45 000 tokens (-60 %)** |
| Audit d'envergure (dépôt/arborescence) | X = 50 000 [supposé], N = 6 [supposé] | 350 000 tokens | 67 000 tokens | **Gain de 283 000 tokens (-81 %)** |

- **Seuil de rentabilité** : L'opération ne devient rentable que si le volume inspecté dépasse `X ≥ 15 000 tokens` et que la session principale se poursuit sur au moins `N ≥ 3 tours` après la restitution de l'analyse.
- **Délai au premier euro / premier gain** : Immédiat dès lors que le seuil critique est dépassé lors d'un audit de grande ampleur.
- **Chiffre qui manque le plus** : Le taux effectif de mise en cache des invites (prompt caching) de l'API utilisée, qui réduit le coût des tokens d'entrée répétés de 50 % à 90 % sur la session principale sans amortir les sous-agents jetables.
- **Ce qui invaliderait mes comptes** : Un rabais supérieur à 75 % sur les tokens d'entrée répétés par prompt caching, qui repousserait le seuil de rentabilité de la sous-délégation au-delà de quarante mille tokens inspectés.

---

## 4. Verdict (Le Juge)

### Verdict : CORRIGER D'ABORD

**Raisonnement** :  
L'hypothèse selon laquelle déléguer l'analyse à des sous-agents économise des tokens est exacte à grande échelle, mais dangereusement trompeuse si elle est érigée en réflexe universel. Appliquée aux vérifications quotidiennes ou aux revues de quelques fichiers, elle augmente la facture globale en raison de la charge fixe d'amorçage et dégrade l'efficacité opérationnelle par rupture de contexte. L'idée ne peut pas être adoptée telle quelle : elle doit être encadrée par une règle de déclenchement déterministe basée sur un volume mesurable et une profondeur minimale d'investigation.

**Le plus gros risque** :  
La prolifération de micro-délégations réflexes qui multiplient les appels à froid, gaspillent les quotas et introduisent une latence inutile sur des tâches que l'agent principal résoudrait en une seule passe d'outil ciblée.

**Le test de dix minutes** :  
Prendre les trois dernières tâches d'analyse ou de recherche de bogues consignées dans `WRITING_IMPROVEMENT.md` ou l'historique du dépôt, et calculer pour chacune le nombre estimé de tokens de fichiers consultés ainsi que le nombre d'échanges ayant suivi la consultation.
- **Si j'observe** que deux tâches sur trois concernaient moins de 15 000 tokens ou se sont terminées en moins de deux échanges, le verdict passe à **ABANDONNER** pour le flux courant.
- **Si j'observe** que ces tâches portaient régulièrement sur plus de 20 000 tokens dans des sessions de plus de quatre tours, le verdict passe à **CONSTRUIRE** sous forme d'une directive d'escalade outillée.

**Correction exacte à faire** :  
Formuler une politique stricte d'activation des sous-agents d'analyse : interdiction d'invoquer un sous-agent si le volume estimé de lecture est inférieur à 15 000 tokens ou si la tâche ne constitue pas un audit transverse de plus de trois fichiers, en cohérence exacte avec le seuil déjà fixé par `.agents/rules/08-skills-activation.md:32-40`.

**La meilleure alternative** :  
Utiliser des outils d'extraction ciblés (requêtes `grep_search` ciblées, lecture par plages de lignes spécifiques avec `view_file`) directement dans la session principale, afin de ne charger en mémoire que les segments de code strictement pertinents plutôt que d'ingérer des fichiers entiers.

---

**Résultat du test** : 
