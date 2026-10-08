# Standards d'Ingénierie & Directives de Style

Ce document consigne les exigences de rédaction, de conception et d'exécution technique applicables sur l'ensemble du projet.

## 1. Directives d'écriture et de communication (Protocole Stop-Slop & Posture)

- **Concision et directivité** : Va droit au but sans préambule ni formules de politesse. Ne répète jamais la demande formulée. Privilégie les phrases courtes et les identifiants techniques exacts (fichiers, fonctions, colonnes).
- **Prose structurée et sobriété** : Rédige en paragraphes denses avec une logique fluide. Bannis les tirets cadratins au profit de parenthèses ou de propositions distinctes. Réserve les listes aux cas apportant un gain réel de lisibilité. Ne résume pas ce qui vient d'être fait si le résultat est directement visible.
- **Suppression des adverbes et artifices** : Élimine les adverbes d'intensité ou de remplissage, les formules d'accroche corporatives et les antithèses binaires factices.
- **Clarification unitaire** : En présence d'une demande ambiguë, pose une unique question ciblée avant toute action.
- **Cadrage avant modification structurelle** : Explique en 3 à 6 phrases maximum (1) l'action projetée, (2) sa justification, (3) les effets de bord (dépendances, migrations, code appelant) et (4) une alternative réversible ou moins risquée.
- **Garde-fous destructifs & schémas** : Audite les usages avant toute suppression (code, imports, références). Pour les schémas, explicite type, valeur par défaut, nullabilité et réversibilité de la migration. Termine chaque intervention par un bilan concis des modifications et des points à vérifier.

## 2. Règle de simplicité opérationnelle (YAGNI)

- **Refus de l'over-engineering** : N'anticipe aucun besoin hypothétique, aucune abstraction prématurée, ni aucune extensibilité spéculative. Implémente la solution minimale viable répondant strictement au cas d'usage éprouvé.
- **Cohérence idiomatique** : Utilise les conventions natives du framework (Composition API pour Vue 3, modèles Dexie typés, classes utilitaires standard). Évite l'empilement de couches d'indirection inutiles.
- **Frugalité des dépendances** : Résous les problématiques algorithmiques ou d'interface avec l'écosystème déjà présent avant de considérer un ajout externe.

## 3. Protocole d'auto-revue systématique & Grand Livre (Protocole Unlazy)

Avant toute notification de complétion ou de remise d'un changement à l'utilisateur :

- **Preuve par le grand livre (`GATES.md`)** : Pour toute intervention substantielle, valide chaque jalon déclaré via son oracle exécutable (`CHECK:`) et vérifie la correspondance stricte avec la sortie attendue (`EXPECT:`). Enregistre la trace d'exécution (`EVIDENCE:`). Aucune tâche n'est déclarée achevée sans preuve déterministe.
- **Contrôle des régressions** : Évalue l'impact direct et indirect de chaque modification sur les composants connexes, l'état réactif et les schémas de stockage local.
- **Validation du build** : Vérifie que le code compile sans avertissements bloquants via `npm run build`.
- **Élimination des artefacts résiduels** : Supprime tout `console.log` de débogage, variable orpheline ou commentaire obsolète introduit pendant le développement.

## 4. Brouillon de réflexion préalable (`WRITING_IMPROVEMENT.md`)

Toute intervention d'analyse, d'audit ou d'implémentation de complexité ≥ « Moyen » requiert la matérialisation préalable du raisonnement dans [`.agents/WRITING_IMPROVEMENT.md`](../WRITING_IMPROVEMENT.md). L'agent y agit comme un élève sur son brouillon avant de rendre sa copie :

- **Énonciation dialectique avant codage** : Poser le problème réel, identifier la contrainte critique et rejeter explicitement au moins une alternative technique avec son motif avant d'altérer le code.
- **Clôture à chaud & mémoire** : Enregistrer le résultat observable, la leçon apprise et déclencher sans délai une fiche KI (`11-apprentissage-et-memoire.md`) en cas d'erreur répétée ou de friction notable.
- **Sobriété documentaire** : Les retouches triviales, corrections de coquilles ou micro-ajustements sont exemptés d'entrée pour préserver la densité stratégique du journal.

## 5. Philosophie de conception & Réduction de la complexité (John Ousterhout)

Tout agent intervenant sur le code applique les principes d'*A Philosophy of Software Design* (Stanford University) :

- **Programmation stratégique vs Programmation tactique** : Un code qui fonctionne ne suffit pas (*Working code isn't enough*). L'agent a l'interdiction d'agir en *Tactical Tornado* (produire du code vite en accumulant des raccourcis tactiques). Il investit systématiquement 10 à 20 % de son effort dans la solidité de la conception, la simplification des abstractions et le nettoyage préventif.
- **La complexité est incrémentale** : La dette logicielle ne provient pas d'une erreur unique, mais de l'empilement de micro-compromis tolérés au fil des tâches. L'approche « zéro tolérance » s'impose pour toute rustine non refactorisée.
- **Modules profonds (*Deep Modules*)** : Concevoir des modules à interface étroite et simple dissimulant une implémentation riche et complète (*Information Hiding*). Bannir les modules superficiels (*Shallow Modules*) et le syndrome de découpage artificiel en micro-fichiers creux (*Classitis*).
- **Proscription de la décomposition temporelle (*Temporal Decomposition*)** : Ne jamais découper le code selon l'ordre chronologique d'exécution des étapes (ex: un module pour lire, un module pour traiter, un module pour sauvegarder). Regrouper les fonctions par cohésion de connaissance partagée.
- **Définir les erreurs hors de l'existence (*Define Errors Out of Existence*)** : Structurer la sémantique des opérations afin que les cas particuliers et limites (collections vides, plages tronquées, suppressions d'éléments inexistants) soient des états nominaux légitimes et absorbés par le flux normal, sans prolifération d'exceptions artificielles.
- **Catalogue des signaux d'alerte (*Red Flags d'Ousterhout*)** : Tout agent ou audit technique refuse le code présentant l'un de ces symptômes :
  1. *Shallow Module* : L'interface est presque aussi complexe que l'implémentation masquée.
  2. *Information Leakage* : Une même décision de conception ou format est dupliqué dans plusieurs modules.
  3. *Temporal Decomposition* : L'ordre d'exécution détermine la structure au détriment de l'encapsulation.
  4. *Pass-Through Method / Variable* : Une fonction ou variable traverse des couches sans être consommée ni transformée.
  5. *Special-General Mixture* : Un composant généraliste intègre du code spécialisé pour un cas d'usage unique.
  6. *Conjoined Methods* : Deux méthodes distinctes ne peuvent être comprises ou modifiées isolément.
  7. *Hard to Describe* : Une interface ou un composable dont le contrat est long et difficile à formuler en prose claire dissimule une mauvaise abstraction.


