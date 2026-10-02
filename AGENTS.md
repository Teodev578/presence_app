# Directives Agentiques : PresenceApp

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
  - `09-ui-copy-and-tone.md` : ton des textes d'interface, lexique proscrit et étiquette des libellés d'état.
  - `10-planification-taches-fastidieuses.md` : deux niveaux de protocole selon la complexité — pre-flight de 10 min (5 questions, dans `WRITING_IMPROVEMENT.md`) pour les tâches « Moyen » ; plan écrit complet dans `.agents/plan.md` pour les tâches longues, répétitives ou mécaniques de complexité « Élevée ». Escalade automatique vers `unlazy` si un troisième fichier ou une dépendance non anticipée est découvert en cours d'exécution.

- `.agents/skills/` : Protocoles procéduraux déclenchés sur demande ou selon le besoin technique. Le périmètre des compétences actives et inactives est consigné dans [`.agents/skills-scope.md`](.agents/skills-scope.md).
  - Déclencheur discipline & grand livre (`unlazy`) : invoquer obligatoirement avant toute intervention substantielle, refactoring transverse ou correctif multi-fichiers pour établir et prouver les gates d'acceptation dans `GATES.md`.
  - Déclencheur communication & prose (`stop-slop`) : invoquer pour tout texte rédigé, commentaire de code, documentation ou réponse utilisateur afin de bannir le jargon artificiel, les adverbes superflus et les tirets cadratins.
  - Déclencheur responsive & adaptatif (`responsive-adaptive-ui`) : invoquer pour tout composant Card/List Item/Grid, toute navigation (Bottom Nav, Sidebar), les règles de breakpoints (600px, 840px, 1200px), de zones tactiles (44x44px min / 56dp mobile) et de typographie fluide.
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

## Liaison BMAD → Stack (convention de passage de relais)

La transition entre la phase de cadrage (BMAD) et la phase d'implémentation (presence-stack) suit ces règles pour éviter les dérives silencieuses.

### Lecture obligatoire avant implémentation

Avant d'ouvrir un fichier source, tout agent d'implémentation vérifie :

1. La story ou la fiche issue (`.scratch/<feature>/`) existe et porte le statut `ready-for-agent`.
2. Les critères d'acceptance sont présents et non ambigus.
3. Les dépendances inter-stories sont listées (autre story bloquante ou bloquée).

Si l'un des trois points manque, l'agent passe le statut en `needs-info` et remonte vers Fabien — il n'improvise pas.

### Traces des trade-offs refusés

Toute alternative technique examinée et rejetée pendant l'implémentation (pas seulement pendant le cadrage) est consignée dans `.agents/WRITING_IMPROVEMENT.md` sous la section "Tâches actives", champ "Alternatives envisagées". La raison du rejet doit être explicite.

Ce n'est pas optionnel pour les tâches de complexité ≥ « Moyen ».

### Signaux remontant vers BMAD (feedback loop)

Un agent d'implémentation remonte un signal vers BMAD (John ou Winston) dans les cas suivants :

| Situation | Signal à remonter | Moyen |
|---|---|---|
| Estimation initiale dépassée de > 50 % | Révision d'estimation + cause | Commentaire dans la fiche issue |
| Contrainte technique non anticipée au cadrage | Risk flag + mitigation | `.agents/WRITING_IMPROVEMENT.md` + statut `needs-info` |
| Scope creep détecté pendant l'implémentation | Description de la dérive | Statut `needs-info`, ne pas implémenter sans accord |
| Décision architecturale impliquant un invariant | ADR à créer | `docs/adr/` via `domain-modeling` |

Un agent ne prend pas de décision de périmètre seul. La règle est : si ça change ce qui a été validé, ça se remonte.

## Mémoire d'apprentissage & Knowledge Items (KI)

Pour éviter la perte de contexte entre sessions de travail :

- La mémoire des agents vit dans le dépôt : `.agents/knowledge/` pour l'équipe (commitée, revue en diff) et `.agents/knowledge.local/` pour le personnel (ignorée par git). Le protocole fait foi dans `.agents/knowledge/README.md`, les règles permanentes dans `.agents/rules/11-apprentissage-et-memoire.md`.
- **Acte unique** : le moment où une correction atterrit, l'agent écrit la fiche KI datée et signée. Déclencheurs obligatoires : même erreur deux fois, même commentaire de revue deux fois, correction utilisateur répétée, bug ayant coûté plus d'une heure.
- Toute fiche candidate ou active figure dans `.agents/knowledge/INDEX.md`, lu en tête de session avant toute conception. Rien de dérivable du code ne s'y consigne.
- **Échelle d'escalade** : une règle violée malgré sa fiche monte de la fiche KI vers une règle `.agents/rules/`, puis vers un oracle exécutable (`scripts/verify-gates.mjs` ou `scripts/knowledge-check.mjs`). La mémoire conseille, l'oracle applique.
- Santé de la mémoire : `node scripts/knowledge-check.mjs --all`. Les sous-agents lisent `INDEX.md`, travaillent en lecture seule sur la mémoire et n'écrivent ni dans `.agents/knowledge/` ni dans `.agents/rules/`.

## Garde-fous inviolables

1. **Intégrité stricte des versions** : Interdiction absolue d'installer, mettre à jour ou modifier les versions des dépendances (`package.json`, `package-lock.json`) ou des outils système sans soumettre explicitement la motivation à l'utilisateur et obtenir son accord préalable.
2. **Grand livre de vérification déterministe (`unlazy`)** : Toute tâche substantielle ou multi-fichiers exige la rédaction préalable d'un fichier `GATES.md` doté d'oracles exécutables (`CHECK:`) et de sorties attendues (`EXPECT:`). Aucune tâche n'est déclarée achevée sans preuve concrète d'exécution (`EVIDENCE:`).
3. **Plan préalable obligatoire** : Présenter une reformulation claire et un plan d'action structuré avant toute modification architecturale, création de fichier structurant ou refactorisation transverse. Une tâche fastidieuse ou longue y est également soumise, son plan étant écrit dans `.agents/plan.md` selon la règle `10-planification-taches-fastidieuses.md`.
4. **Validation locale systématique** : Vérifier la compilation (`npm run build`) avant de déclarer toute tâche terminée.
5. **Navigation : parité de grammaire, repli volontaire en rail** : La sanctuarisation de la navigation employé est levée par autorisation explicite de l'utilisateur (consignée dans `GATES.md`, lots « Grammaire de Tiroir Commune », « Ancrage à 840px » et « Repli en Rail d'Icônes »). Les deux espaces partagent une seule grammaire : marque et badge d'espace en tête, sections « Navigation » et « Mon espace », barre d'accent sur l'entrée sélectionnée, passerelle neutre, pied ordonné en statut réseau, contrôle d'apparence, identité et déconnexion en icône. Sous 840px, les deux espaces naviguent par tiroir superposé, libellés complets ; à partir de 840px, la barre latérale s'ancre dans la mise en page et une poignée la replie en rail d'icônes : repli automatique entre 840px et 1024px, déploiement au delà, un clic sur la poignée ne valant que pour la bande courante et tout franchissement de seuil le révoquant au profit du seuil. Interdiction formelle d'introduire un rail sous 840px ou une barre de navigation basse. La fonctionnalité de pointage de l'espace employé ne doit pas être altérée : elle conserve sa pleine largeur sous 840px et son verrouillage onepage.

## Agent skills

### Issue tracker

Local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical 5-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repository layout (`CONTEXT.md` + `docs/adr/`). See `docs/agents/domain.md`.
