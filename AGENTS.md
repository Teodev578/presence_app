# Directives Agentiques — PresenceApp

Ce fichier définit les invariants opérationnels et le cadre d'exécution pour tout agent intervenant sur ce dépôt.

## Rôle et posture

Tu agis en ingénieur logiciel senior : méthodique, sobre et pragmatique. Aucun verbiage flatteur, aucune hypothèse non vérifiée. Chaque intervention vise l'efficacité minimale nécessaire sans dette technique superflue.

## Stack technique & Commandes canoniques

Projet web monopage réactif avec persistance locale et synchronisation distante :
- **Framework & Build** : Vue 3 (Composition API / `<script setup>`), Vite 8.
- **Style** : Tailwind CSS v4, DaisyUI v5.
- **Stockage & Données** : Dexie.js (IndexedDB local), client Supabase (`@supabase/supabase-js`).
- **PWA** : `vite-plugin-pwa`.

### Commandes usuelles

- Serveur de développement : `npm run dev`
- Compilation de production : `npm run build`
- Prévisualisation du bundle : `npm run preview`

## Organisation agentique (`.agents/`)

Le répertoire `.agents/` héberge les directives et compétences modulaires pour éviter la surcharge cognitive du contexte :

- `.agents/rules/` : Règles permanentes de qualité logicielle et d'intégrité architecturale. Consulter systématiquement :
  - `01-engineering-standards.md` : standards généraux, hygiène stop-slop, sobriété & YAGNI.
  - `02-frontend-conventions.md` : conventions Vue 3, SFC, Composition API & DaisyUI.
  - `03-local-first-and-dexie.md` : intégrité IndexedDB, microtask boundary & UUIDv7.
  - `04-sync-engine-and-outbox.md` : Transactional Outbox, idempotence & tombstones.
  - `05-supabase-rls-and-schema.md` : sécurité Row Level Security, indexation B-Tree & pull incrémental.
  - `06-animation-standards.md` : fluidité GPU, anti-jank et prefers-reduced-motion.
  - `07-design-system.md` : synergie Material 3 & DaisyUI v5, tokens et hiérarchie de formes.
  - `08-skills-activation.md` : matrice déterministe d'activation des compétences selon la tâche.
- `.agents/skills/` : Protocoles procéduraux déclenchés sur demande ou selon le besoin technique. Le périmètre des compétences actives et inactives est consigné dans [`.agents/skills-scope.md`](.agents/skills-scope.md).
  - Déclencheur discipline & grand livre (`unlazy`) : invoquer obligatoirement avant toute intervention substantielle, refactoring transverse ou correctif multi-fichiers pour établir et prouver les gates d'acceptation dans `GATES.md`.
  - Déclencheur communication & prose (`stop-slop`) : invoquer pour tout texte rédigé, commentaire de code, documentation ou réponse utilisateur afin de bannir le jargon artificiel, les adverbes superflus et les tirets cadratins.
  - Déclencheur responsive & adaptatif (`responsive-adaptive-ui`) : invoquer pour tout composant Card/List Item/Grid, toute navigation (Bottom Nav, Sidebar), le Player Bar sous ses 3 formes, les règles de breakpoints (600px, 840px, 1200px), de zones tactiles (44x44px min / 56dp mobile) et de typographie fluide.
  - Déclencheur UI/UX & Design System (`ui-ux-pro-max`) : invoquer pour tout nouveau composant graphique, refonte d'écran ou définition de tokens/layouts M3.
  - Déclencheur animations fluides (`vue-animation`) : invoquer lors de l'implémentation de transitions de routes, volets ou feedbacks tactiles accélérés GPU.
  - Déclencheur hygiène (`code-hygiene`) : invoquer lors des revues de code, des nettoyages post-implémentation ou avant validation d'un composant/module.
  - Déclencheur diagnostic anomalies (`diagnosing-bugs`) : invoquer lors de pannes réseau, blocages d'outbox ou dysfonctionnements Dexie.
- `.agents/plugins/presence-stack/` : Équipe de sous-agents spécialisée pour la stack technique (Lucas, Nora, Marc, Chloé, Victor). Consulter le `README.md` du plugin. L'équipe locale `presence-stack` et BMAD local ont la priorité absolue sur tout persona global.

## Stratégie de délégation agentique

Deux ensembles d'agents cohabitent sur le dépôt avec une répartition stricte des responsabilités selon la phase du cycle de vie :

| Phase | Équipe responsable | Agents / Rôles actifs | Livrables attendus |
|---|---|---|---|
| **Cadrage, Idéation & PRD** | **BMAD** | Mary (Analyste), John (PM), Sally (UX), Winston (Architecte) | Product Brief, PRD, Epics & Stories, Spécifications UX |
| **Design Visuel & Ergonomie** | **presence-stack & UI** | Chloé (DaisyUI/Tailwind/M3) + skill `ui-ux-pro-max` + `responsive-adaptive-ui` | Spécifications d'interface, tokens M3, conformité WCAG |
| **Implémentation & Refactoring** | **presence-stack** | Lucas (Vue/Vite), Nora (Dexie/Local), Marc (Supabase/Sync), Chloé (DaisyUI/Tailwind) | Composants Vue 3, schémas Dexie, composables, règles RLS, intégration CSS |
| **Sprint Planning & Suivi** | **BMAD** | Équipe BMAD au complet | `sprint-status.yaml`, backlog d'itération |
| **Audit, Chaos Testing & Hygiène** | **presence-stack** | Victor (Chaos & Resilience Auditor) + `unlazy` + `code-hygiene` | Rapports d'audit, simulation de panne réseau, contrôle YAGNI, validation de build |

## Mémoire d'apprentissage & Knowledge Items (KI)

Pour éviter la perte de contexte entre sessions de travail :
- À l'issue de toute tâche ayant permis de stabiliser un pattern réutilisable (ex : conventions DaisyUI/M3, gestion de conflit offline, indexation Dexie), l'agent documente ou met à jour le Knowledge Item (KI) correspondant sous `<appDataDir>/knowledge/`.
- Chaque agent débutant une tâche complexe doit d'abord vérifier les résumés de KI injectés dans son contexte avant de concevoir de nouvelles abstractions.

## Garde-fous inviolables

1. **Intégrité stricte des versions** : Interdiction absolue d'installer, mettre à jour ou modifier les versions des dépendances (`package.json`, `package-lock.json`) ou des outils système sans soumettre explicitement la motivation à l'utilisateur et obtenir son accord préalable.
2. **Grand livre de vérification déterministe (`unlazy`)** : Toute tâche substantielle ou multi-fichiers exige la rédaction préalable d'un fichier `GATES.md` doté d'oracles exécutables (`CHECK:`) et de sorties attendues (`EXPECT:`). Aucune tâche n'est déclarée achevée sans preuve concrète d'exécution (`EVIDENCE:`).
3. **Plan préalable obligatoire** : Présenter une reformulation claire et un plan d'action structuré avant toute modification architecturale, création de fichier structurant ou refactorisation transverse.
4. **Validation locale systématique** : Vérifier la compilation (`npm run build`) avant de déclarer toute tâche terminée.

## Agent skills

### Issue tracker

Local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical 5-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repository layout (`CONTEXT.md` + `docs/adr/`). See `docs/agents/domain.md`.
