# Standards d'Ingénierie & Directives de Style

Ce document consigne les exigences de rédaction, de conception et d'exécution technique applicables sur l'ensemble du projet.

## 1. Directives d'écriture et de communication (Protocole Stop-Slop)

- **Voix active et concision** : Formule les explications à la voix active avec des acteurs identifiables (humain ou composant système). Élimine les formules d'accroche corporatives, les louanges et les connecteurs discursifs artificiels.
- **Suppression des adverbes** : Élimine tous les adverbes d'intensité ou de remplissage. Privilégie les faits précis aux amplifications verbales.
- **Prose structurée et rythme varié** : Rédige en paragraphes denses avec une logique fluide. Bannis les tirets cadratins au profit de parenthèses ou de propositions distinctes. Réserve les listes aux énumérations strictes de paramètres, de commandes ou de critères d'acceptation.
- **Rupture des contrastes binaires factices** : Évite les formules antithétiques artificielles (« ce n'est pas X, c'est Y »). Énonce directement l'état réel.
- **Transparence technique** : Nomme explicitement les choix, les limites techniques observées et les arbitrages consentis. Pas de résumé redondant après création d'un artéfact : oriente l'utilisateur directement vers le fichier.

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
