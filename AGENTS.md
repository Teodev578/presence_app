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

- `.agents/rules/` : Règles permanentes de qualité logicielle, de style de code et de rigueur d'ingénierie. Consulter systématiquement `01-engineering-standards.md`.
- `.agents/skills/` : Protocoles procéduraux déclenchés sur demande ou selon le besoin technique. Le périmètre des compétences actives et inactives est consigné dans [`.agents/skills-scope.md`](.agents/skills-scope.md).
  - Déclencheur hygiène (`code-hygiene`) : invoquer lors des revues de code, des nettoyages post-implémentation ou avant validation d'un composant/module.
- `.agents/plugins/presence-stack/` : Équipe de sous-agents spécialisée pour la stack technique (Lucas, Nora, Marc, Chloé, Victor). Consulter le `README.md` du plugin.

## Stratégie de délégation agentique

Deux ensembles d'agents cohabitent sur le dépôt avec une répartition stricte des responsabilités selon la phase du cycle de vie :

| Phase | Équipe responsable | Agents / Rôles actifs | Livrables attendus |
|---|---|---|---|
| **Cadrage, Idéation & PRD** | **BMAD** | Mary (Analyste), John (PM), Sally (UX), Winston (Architecte) | Product Brief, PRD, Epics & Stories, Spécifications UX |
| **Implémentation & Refactoring** | **presence-stack** | Lucas (Vue/Vite), Nora (Dexie/Local), Marc (Supabase/Sync), Chloé (DaisyUI/Tailwind) | Composants Vue 3, schémas Dexie, composables, règles RLS, intégration CSS |
| **Sprint Planning & Suivi** | **BMAD** | Équipe BMAD au complet | `sprint-status.yaml`, backlog d'itération |
| **Audit, Chaos Testing & Hygiène** | **presence-stack** | Victor (Chaos & Resilience Auditor) | Rapports d'audit, simulation de panne réseau, contrôle YAGNI, validation de build |

## Garde-fous inviolables

1. **Intégrité stricte des versions** : Interdiction absolue d'installer, mettre à jour ou modifier les versions des dépendances (`package.json`, `package-lock.json`) ou des outils système sans soumettre explicitement la motivation à l'utilisateur et obtenir son accord préalable.
2. **Plan préalable obligatoire** : Présenter une reformulation claire et un plan d'action structuré avant toute modification architecturale, création de fichier structurant ou refactorisation transverse.
3. **Validation locale** : Vérifier la compilation (`npm run build`) avant de déclarer toute tâche terminée.

## Agent skills

### Issue tracker

Local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical 5-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repository layout (`CONTEXT.md` + `docs/adr/`). See `docs/agents/domain.md`.
