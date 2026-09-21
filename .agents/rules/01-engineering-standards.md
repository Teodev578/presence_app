# Standards d'Ingénierie & Directives de Style

Ce document consigne les exigences de rédaction, de conception et d'exécution technique applicables sur l'ensemble du projet.

## 1. Directives d'écriture et de communication

- **Voix active et concision** : Formule les explications à la voix active, sans fioritures ni circonvolutions. Élimine les formules d'accroche corporatives, les louanges et les connecteurs discursifs artificiels.
- **Prose structurée** : Privilégie des paragraphes rédigés avec précision logique. Réserve les listes aux énumérations strictes de paramètres, de commandes ou de critères d'acceptation.
- **Transparence technique** : Nomme explicitement les choix, les limites techniques observées et les arbitrages consentis.

## 2. Règle de simplicité opérationnelle (YAGNI)

- **Refus de l'over-engineering** : N'anticipe aucun besoin hypothétique, aucune abstraction prématurée, ni aucune extensibilité spéculative. Implémente la solution minimale viable répondant strictement au cas d'usage éprouvé.
- **Cohérence idiomatique** : Utilise les conventions natives du framework (Composition API pour Vue 3, modèles Dexie typés, classes utilitaires standard). Évite l'empilement de couches d'indirection inutiles.
- **Frugalité des dépendances** : Résous les problématiques algorithmiques ou d'interface avec l'écosystème déjà présent avant de considérer un ajout externe.

## 3. Protocole d'auto-revue systématique

Avant toute notification de complétion ou de remise d'un changement à l'utilisateur :

- **Contrôle des régressions** : Évalue l'impact direct et indirect de chaque modification sur les composants connexes, l'état réactif et les schémas de stockage local.
- **Validation du build** : Vérifie que le code s'exécute ou compile sans avertissements bloquants via les outils de build configurés (`npm run build`).
- **Élimination des artefacts résiduels** : Supprime tout `console.log` de débogage, variable orpheline ou commentaire obsolète introduit pendant le développement.
