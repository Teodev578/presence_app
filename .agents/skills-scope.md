# Périmètre des Skills Agentiques — PresenceApp

Ce document cartographie les compétences agentiques (skills) autorisées et mobilisables dans le cadre de ce projet, ainsi que les compétences déclarées hors-périmètre pour limiter la dispersion cognitive des agents.

---

## Skills Actifs par Domaine d'Intervention

### 1. Développement & Implémentation
- `unlazy` : grand livre de vérification déterministe (`GATES.md`), décomposition méthodique et preuve de complétion avant toute livraison.
- `bmad-build` : implémentation rigoureuse d'une tâche ou d'une story selon les conventions locales.
- `bmad-build-auto` : exécution itérative automatisée de stories balisées.
- `bmad-spec` : condensation d'exigences en spécifications opérationnelles.
- `prototype` : maquettage rapide pour valider une intuition d'interface ou de flux de données.
- `tdd` : méthodologie d'implémentation guidée par les tests (red-green-refactor).

### 2. Design Visuel, UI, Ergonomie & Animation
- `responsive-adaptive-ui` : design system adaptatif inspiré d'Encore pour grilles, navigation adaptative, seuils de bascule (600px, 840px, 1200px) et cibles tactiles 44px (56dp mobile).
- `ui-ux-pro-max` : conception visuelle, tokens de surface Material 3, composants DaisyUI v5 et conformité WCAG AA.
- `vue-animation` : orchestration de transitions légères Vue 3 (`<Transition>`) accélérées par GPU (`transform`/`opacity`) sans saccade.

### 3. Revue, Hygiène, Qualité & Résilience
- `stop-slop` : élimination du jargon artificiel d'IA, suppression des adverbes, voix active, suppression des tirets cadratins et concision de prose.
- `code-hygiene` : audit de propreté, détection de code mort et vérification des imports.
- `code-review` : double revue standards / spécification post-implémentation.
- `bmad-code-review` : revue contradictoire multicouche avant fusion ou finalisation.
- `bmad-review` : inspection multicouche approfondie (critique adversariale, cas limites, trous de vérification).
- `diagnosing-bugs` : protocole d'investigation méthodique pour anomalies de synchronisation Outbox ou de persistance Dexie.
- `bmad-walkthrough` : explication pédagogique des modifications apportées lors d'un jalon.

### 4. Cadrage Produit, Challenge & Spécifications (Équipe BMAD)
- `bmad-prd` : structuration des exigences produit et définition des cas d'usage.
- `bmad-architecture` : cadrage des invariants architecturaux haut niveau.
- `bmad-create-epics-and-stories` : découpage fonctionnel en unités de livraison incrémentales.
- `bmad-sprint-planning` : ordonnancement et statut du sprint.
- `bmad-ux` : spécifications de parcours et ergonomie d'usage.
- `grilling` : mise à l'épreuve contradictoire des plans, arbitrages et hypothèses architecturales.

### 5. Modélisation du Domaine & Architecture
- `domain-modeling` : maintien du glossaire `CONTEXT.md` et alignement sémantique du code.
- `codebase-design` : structuration modulaire des composables et des couches de données.

### 6. Git & Cycle de Vie
- `pr` : formalisation des descriptions de pull request.
- `resolving-merge-conflicts` : résolution méthodique des conflits git.
- `bmad-retrospective` : bilan contradictoire d'itération.
- `setup-pre-commit` : automatisation des contrôles qualité pré-commit.

---

## Skills Hors-Périmètre (Inactifs sur ce projet)

Ces compétences, issues de configurations globales ou d'autres contextes techniques, ne doivent pas être invoquées sur le dépôt PresenceApp :

- **Écosystème Flutter / Dart** : `dart-*`, `flutter-*` (PresenceApp est exclusivement une PWA Vue 3).
- **Exercices et Pédagogie** : `scaffold-exercises`, `teach`.
- **Rédaction littéraire / Contenu** : `writing-beats`, `writing-fragments`, `writing-shape`.
- **Outils spécifiques TypeScript étranger** : `migrate-to-shoehorn`, `setup-ts-deep-modules`.
- **Skills d'assistance tiers non pertinents** : `ask-matt`, `claude-handoff`, `handoff`, `loop-me`, `to-questionnaire`, `to-spec`, `to-tickets`, `wait-what`, `pocock-grill`, `grill-with-docs`.
