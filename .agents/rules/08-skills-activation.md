# Règle Permanente : Matrice d'Activation Déterministe des Compétences

Ce document fixe les conditions d'activation obligatoire des compétences agentiques du projet. Tout agent intervenant sur ce dépôt doit appliquer cette matrice dès la réception d'une instruction.

---

## 1. Principes d'Activation Invariables

1. **Priorité aux directives locales** : L'équipe locale `presence-stack` (Lucas, Nora, Marc, Chloé, Victor) et les compétences de ce dépôt prévalent sur toute configuration ou persona global.
2. **Consultation préalable obligatoire** : Dès qu'une condition de la matrice est remplie, l'agent lit le fichier `SKILL.md` correspondant avant toute modification de fichier.
3. **Preuve par ledger** : Aucune intervention structurante ne s'achève sans enregistrement de résultats vérifiables dans le fichier `GATES.md`.

---

## 2. Seuils d'Activation et d'Escalade

Ces seuils quantifient les conditions d'activation. En cas d'ambiguïté, le seuil le plus restrictif s'applique.

### `unlazy` — Grand livre de vérification

Déclenchement **obligatoire** si au moins une condition est vraie :

| Condition | Seuil |
|---|---|
| Nombre de fichiers modifiés | ≥ 3 |
| Nombre de stories ou composables dépendants | ≥ 2 |
| Modification d'une API publique (composable, store, type partagé) | toute modification |
| Présence d'une migration Dexie ou Supabase | toute migration |
| Tâche qualifiée « Élevée » dans `WRITING_IMPROVEMENT.md` | systématique |
| Série répétitive de > 5 étapes mécaniques (passe mécanique) | systématique |

### Escalade vers un sous-agent `presence-stack`

Préférer un sous-agent spécialisé (Lucas / Nora / Marc / Chloé / Victor) à une intervention généraliste si :

- La tâche touche exclusivement un domaine technique de l'un d'eux (Dexie → Nora, Supabase/RLS → Marc, Vue SFC → Lucas, DaisyUI/Tailwind → Chloé) **et** la complexité est ≥ « Moyen » ;
- Le contexte de la tâche dépasse 2 fichiers appartenant au même domaine ;
- Une revue contradictoire est demandée (Victor ou `bmad-review`).

L'agent généraliste reste légitime pour les retouches isolées (< 2 fichiers, complexité « Simple »).

### `diagnosing-bugs` — Seuil d'auto-déclenchement

| Condition | Seuil |
|---|---|
| Bugrate sur le périmètre | ≥ 3 anomalies / semaine glissante |
| Même motif de régression détecté | 2× ou plus, même périmètre |
| Désynchronisation Outbox non résolue | > 10 min en test local |
| Anomalie Dexie sans explication dans les logs | dès la 1re occurrence si livequery impliquée |

**Output obligatoire** à chaque déclenchement : root cause analysis + vérification de déclencheur KI (`11-apprentissage-et-memoire.md`).

---

## 3. Matrice d'Activation par Nature de Tâche

| Domaine ou Signal détecté | Compétence obligatoire | Protocole d'application |
|---|---|---|
| Rédaction, documentation, prose, rapport d'analyse ou message utilisateur | `stop-slop` | Voix active, zéro adverbe, suppression des tirets cadratins, élimination des contrastes binaires artificiels, pas de résumé de contenu d'artéfact. |
| Tâche substantielle, refactoring transverse, création de composable ou modification multi-fichiers | `unlazy` | Rédaction préalable de `GATES.md` avec clause `OWNS:`, périmètre `Scope:`, commandes `CHECK:`, sorties exactes `EXPECT:` et preuves `EVIDENCE:`. |
| Nouveau composant Vue, carte de contenu, grille, refonte de navigation ou adaptation multi-écrans | `responsive-adaptive-ui` + `ui-ux-pro-max` | Respect des seuils de bascule (600px carrousel vers grille, 840px navigation basse vers rail, 1200px tiroir déployé), cibles tactiles de 44x44px minimum (56dp mobile), tokens Material 3. |
| Animation d'interface, volet accordéon, modale ou transition de route | `vue-animation` | Accélération GPU exclusive (`transform`, `opacity`), 60 images par seconde, respect strict de la directive `prefers-reduced-motion`. |
| Anomalie de persistance locale, bogue réseau ou désynchronisation de l'Outbox | `diagnosing-bugs` | Reproduction séquentielle du cas limite, inspection des transactions Dexie et contrôle de l'idempotence Supabase avant toute correction. |
| Nettoyage final, contrôle pré-fusion ou audit de propreté | `code-hygiene` | Traque du code mort, élimination des journaux de débogage console et validation par `npm run build`. |
| Nouvelle fonctionnalité complète ou découpage fonctionnel complexe | `bmad-spec` → `bmad-build` | Formalisation du contrat machine avant écriture du code, puis implémentation pas à pas. |
| Tâche fastidieuse ou longue sans enjeu architectural (série de retouches répétitives, passe mécanique multi-fichiers, chaînement de plus de cinq étapes) | `unlazy` | Application de `10-planification-taches-fastidieuses.md` : rédaction préalable du plan dans `.agents/plan.md` (périmètre, étapes ordonnées, critère d'arrêt, vérification par étape), tenu à jour jusqu'à clôture puis purgé, en complément des clauses `OWNS:` de `GATES.md`. |
| Modification de tout fichier `.vue` dans `src/views/` ou `src/components/` contenant du texte visible (libellés, placeholders, messages d'état, tooltips, aria-label) | Oracle copy (`09-ui-copy-and-tone.md`) | Lire le lexique proscrit **avant** d'écrire. Exécuter `node scripts/verify-gates.mjs --voice-conformance` et produire la sortie comme `EVIDENCE:` avant de déclarer la tâche terminée. Une reformulation de libellé met aussi à jour `scripts/verify-browser.mjs` si un oracle y était asservi. |
| Passe de cohérence sémantique inter-vues (une fois par sprint, ou après toute fonctionnalité majeure) | Victor (sous-agent `presence-stack`) | Balayage de tous les `.vue` de `src/views/` et `src/components/` : uniformité du lexique, respect de la règle `09`, cohérence des libellés d'état entre vues, pas de terme proscrit dans `aria-label` ni `title`. Rapport déposé dans `.agents/knowledge/` si récurrence détectée. |
| Même erreur une deuxième fois, même commentaire de revue une deuxième fois, correction utilisateur répétée, clôture de lot ou rétrospective d'epic | Protocole KI (`11-apprentissage-et-memoire.md`), avec `bmad-retrospective` pour les rétrospectives d'epic | Acte unique « corriger + enregistrer » : fiche datée dans `.agents/knowledge/` au moment où la correction atterrit, ligne de récurrence dans `INDEX.md`, escalade vers une règle ou un oracle si la récurrence persiste. |
| Audit visuel ou UX global, manque de cohérence inter-vues, friction dans les parcours utilisateur signalée, ou mention de "next-level-ui", "audit UI", "audit UX", "revue visuelle", "friction utilisateur" | `next-level-ui` | Audit en 6 phases : inventaire, 6 axes UI (tokens M3, WCAG AA, états, responsive, copy/tone, cohérence inter-vues) + 3 axes UX (parcours employé/manager, architecture d'information, feedback & micro-interactions), rapport dans `WRITING_IMPROVEMENT.md`, validation Fabien avant correctifs, `unlazy` si ≥ 3 fichiers, remontée Sally (BMAD) si modification de flux validé. |
| Audit backend global, suspicion de violation de frontière local-first, problème de sync Outbox, régression RLS ou schéma, ou mention de "next-level-backend", "audit backend", "audit sync", "audit Dexie", "audit RLS" | `next-level-backend` | Audit en 8 phases : 13 axes couvrant composables, Dexie, Outbox/sync et Supabase RLS/schéma ; rapport dans `WRITING_IMPROVEMENT.md`, validation Fabien avant toute migration ; `unlazy` si ≥ 3 fichiers ; délégation Nora (Dexie), Marc (Supabase), Lucas (composables). |

---

## 3. Compétences Prohibées

Toute invocation des compétences suivantes est interdite sur ce dépôt :
- Compétences de l'écosystème Flutter et Dart (`flutter-*`, `dart-*`).
- Outils spécifiques à React (`react-doctor`).
- Modules pédagogiques ou de rédaction de fiction (`scaffold-exercises`, `teach`, `writing-*`).
- Outils tiers redondants (`ask-matt`, `claude-handoff`, `handoff`, `loop-me`, `pocock-grill`, `grill-with-docs`, `wait-what`, `wayfinder`, `wizard`).
