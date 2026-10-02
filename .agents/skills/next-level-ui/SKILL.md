---
name: next-level-ui
description: >
  Audit UI/UX complet du projet PresenceApp : cohérence avec le design system M3 + DaisyUI v5,
  accessibilité WCAG AA, cohérence de copy/tone, responsive adaptatif, qualité des états vides/erreur/chargement,
  parcours utilisateur (flows employé et manager), architecture d'information et friction de navigation.
  Produit un rapport structuré de findings triés par sévérité, avec une liste de correctifs actionnables
  et une entrée dans WRITING_IMPROVEMENT.md. Invoquer quand le projet souffre de régression visuelle,
  de manque de cohérence inter-vues, de friction dans les parcours, ou après une phase d'implémentation rapide.
  Déclencheurs : "next-level-ui", "audit UI", "audit UX", "revue visuelle", "cohérence interface", "friction utilisateur".
---

# next-level-ui — Audit UI/UX & Cohérence

Ce skill produit un audit structuré de l'interface et de l'expérience utilisateur de PresenceApp. Il couvre deux dimensions complémentaires : la **couche visuelle** (tokens, accessibilité, responsive, copy) et la **couche comportementale** (parcours, architecture d'information, feedback, friction). Il ne génère pas de code à l'aveugle : il **diagnostique d'abord**, **priorise**, puis **propose des correctifs ciblés** pour validation.

**Avant tout travail**, lire :
- `.agents/rules/07-design-system.md` (tokens M3, élévation, formes, typographie)
- `.agents/rules/09-ui-copy-and-tone.md` (lexique proscrit, libellés d'état)
- `.agents/rules/06-animation-standards.md` (GPU-only, prefers-reduced-motion)
- `.agents/rules/02-frontend-conventions.md` (SFC Vue 3, Composition API)

---

## Phase 1 — Inventaire du périmètre

Avant l'audit, dresser la liste exhaustive des fichiers à inspecter :

```
src/views/
  auth/
  employee/  (HomeView, CheckInView, CheckOutView, AvailabilitiesView)
  manager/   (DashboardView, EmployeesView, TeamsView, PresencesView, LocationsView, AvailabilitiesView, ExportView)
  SettingsView.vue

src/components/
  shared/   (ConfirmModal, PwaInstallCard, StatusBadge, SyncAlert, SyncIndicator, ThemeToggle, ToastContainer)
  employee/ (tous)
  manager/  (ManagerEmptyState, ManagerKpiCard, ManagerPageHeader)
```

Pour chaque fichier, noter :
- Taille (proxy de complexité)
- Vues liées dans le router

---

## Phase 2 — Audit UI (couche visuelle)

Inspecter chaque vue selon les **six axes visuels** ci-dessous.

### Axe 1 : Cohérence des tokens M3 (règle `07`)

Chercher les violations suivantes dans chaque `.vue` :
- Usage de couleurs arbitraires (`#`, `rgb(`, `hsl(`) hors tokens CSS vars
- `box-shadow` ou `shadow-lg` / `shadow-xl` (interdit par M3)
- Arrondis hors échelle M3 (`rounded-full` sur card, `rounded-none` non justifié)
- Mélange de `bg-white` / `bg-gray-*` avec les tokens `bg-base-*`

Commande de détection rapide :
```bash
grep -rn "box-shadow\|shadow-lg\|shadow-xl\|shadow-2xl\|bg-white\|bg-gray\|#[0-9a-fA-F]\{3,6\}" src/views/ src/components/ --include="*.vue"
```

### Axe 2 : Accessibilité WCAG AA

Vérifier pour chaque composant interactif :
- Présence de `aria-label` ou `aria-labelledby` sur les boutons icon-only
- Focus visible (`:focus-visible` non supprimé par `outline-none` sans alternative)
- `role` correct sur les composants custom (modal, badge d'état, alert)

```bash
grep -rn "outline-none\|outline-0" src/views/ src/components/ --include="*.vue"
```

### Axe 3 : États vides / erreur / chargement

Chaque vue affichant des données distantes doit couvrir trois états :
- **Chargement** : skeleton ou spinner M3 (pas de flash de contenu vide)
- **Vide** : composant `ManagerEmptyState` ou équivalent employé, avec CTA
- **Erreur** : `SyncAlert` ou message contextuel, pas de page blanche

Signaler toute vue où l'un de ces trois états est absent ou traité avec un `v-if` nu sans UI dédiée.

### Axe 4 : Responsive adaptatif (skill `responsive-adaptive-ui`)

Vérifications par seuil :
- **< 600px** : pas de grille multi-colonnes, navigation par tiroir uniquement
- **600–840px** : bascule grille → carousel ou liste
- **≥ 840px** : barre latérale ancrée, rail d'icônes disponible
- Zones tactiles ≥ 44px (`min-h-11 min-w-11` ou équivalent)

```bash
grep -rn "grid-cols-[3-9]\|grid-cols-1[0-9]" src/views/ src/components/ --include="*.vue"
```

### Axe 5 : Copy & Tone (règle `09`)

Exécuter l'oracle de conformité si disponible :
```bash
node scripts/verify-gates.mjs --voice-conformance
```

Sinon, inspecter manuellement :
- Libellés en verbe d'action à l'infinitif sur les boutons primaires
- Pas de termes proscrits selon `09-ui-copy-and-tone.md`
- États d'erreur en langage humain (pas de codes HTTP bruts exposés)
- Cohérence des libellés identiques entre vues employé et manager pour un même concept

### Axe 6 : Cohérence inter-vues

Comparer les patterns répétés entre les vues :
- En-têtes de page : usage uniforme de `ManagerPageHeader` / équivalent employé ?
- KPI cards : même structure partout (icône, valeur, label) ?
- Modales de confirmation : toutes via `ConfirmModal` partagé ?
- Toasts et alertes : tous via `ToastContainer` ou divergence locale ?

Signaler tout composant "réinventé" localement alors qu'un composant partagé existe.

---

## Phase 3 — Audit UX (couche comportementale)

Inspecter les deux **espaces utilisateurs** (employé et manager) selon trois axes comportementaux.

### Axe 7 : Parcours utilisateur critiques

Pour chaque espace, cartographier les flux principaux et détecter les ruptures :

**Espace Employé :**
- Flux de pointage (arrivée) : `HomeView` → `CheckInView` → confirmation → retour — y a-t-il un feedback clair de succès ? Peut-on se retrouver bloqué hors connexion ?
- Flux de départ : `CheckOutView` — symétrique au check-in ? Même feedback ?
- Flux de disponibilités : `AvailabilitiesView` — peut-on modifier sans régresser vers la page d'accueil involontairement ?

**Espace Manager :**
- Flux de consultation des présences : `DashboardView` → `PresencesView` — la navigation est-elle directe ou requiert-elle plusieurs étapes ?
- Flux de gestion des équipes : `TeamsView` / `EmployeesView` — les actions CRUD sont-elles accessibles en moins de 3 clics ?
- Flux d'export : `ExportView` — les filtres sont-ils mémorisés entre sessions ou réinitialisés ?

Pour chaque rupture identifiée : noter l'étape bloquante, la cause probable (navigation, état, feedback manquant) et une correction proposée.

### Axe 8 : Architecture d'information & navigation

Évaluer la lisibilité de la structure depuis le point de vue d'un utilisateur non-expert :

- **Hiérarchie des entrées de navigation** : les items sont-ils ordonnés par fréquence d'usage réelle (pas par ordre technique) ?
- **Profondeur de navigation** : aucun contenu critique ne devrait nécessiter plus de 2 niveaux d'accès depuis la vue principale
- **Étiquettes de navigation** : correspondent-elles aux verbes ou concepts du métier (pas aux noms techniques des vues) ?
- **Passerelle entre espaces** (employé ↔ manager pour les utilisateurs à double rôle) : est-elle visible et sans friction ?
- **Fil d'Ariane implicite** : l'utilisateur sait-il toujours où il est dans l'application (titre de page, état de navigation actif) ?

### Axe 9 : Feedback & micro-interactions

Vérifier que chaque action utilisateur génère un retour sensoriel adapté :

- **Actions destructives** (suppression, déconnexion) : confirmation obligatoire via `ConfirmModal`, libellé du bouton de confirmation en rouge ou avec icône de danger
- **Actions asynchrones** (sync Supabase, pointage) : indicateur de progression visible dès le déclenchement, pas seulement à la fin
- **Actions réussies** : toast de confirmation (via `ToastContainer`) avec durée adaptée (pas de toast qui disparaît avant d'être lu)
- **Gestion du mode hors-ligne** : `SyncIndicator` ou `SyncAlert` visibles et explicites — l'utilisateur sait-il que ses actions sont mises en file d'attente ?
- **Transitions de vue** : bascule entre vues sans saut visuel brutal (absence de flash, animation de route si applicable)

---

## Phase 4 — Rapport de findings

Produire un rapport dans `.agents/WRITING_IMPROVEMENT.md` sous "Tâches actives" :

```markdown
### Tâche : Audit next-level-ui — [date]
**Date** : AAAA-MM-JJ
**Complexité** : Élevée
**Proposant** : next-level-ui skill

#### Findings triés par sévérité

| # | Sévérité | Axe | Fichier(s) / Périmètre | Description | Correctif proposé |
|---|----------|-----|----------------------|-------------|-------------------|
| 1 | 🔴 Critique | UX — Axe 9 | CheckInView | Aucun feedback hors-ligne | Afficher SyncAlert dès détection offline |
| 2 | 🟡 Moyen | UI — Axe 6 | PresencesView | En-tête réinventé localement | Migrer vers ManagerPageHeader |
| 3 | 🟢 Mineur | UI — Axe 5 | TeamsView | Bouton "Enregistrer" → "Valider" | Renommer selon règle 09 |

#### Décision
**Findings retenus pour correction** : (en attente de Fabien)
**Trade-offs acceptés** : …
**Engagement KI** : O/N

#### Résultat
- Implémenté ? N (en attente de validation Fabien)
```

**Règle de sévérité** :
- 🔴 Critique : violation WCAG AA, état crash (pas d'état erreur), parcours bloqué hors connexion, feedback absent sur action destructive
- 🟡 Moyen : rupture de parcours non bloquante, composant réinventé localement, état vide absent, navigation profonde inutile
- 🟢 Mineur : copy non conforme, arrondi hors échelle, transition brusque, libellé de navigation sous-optimal

---

## Phase 5 — Validation obligatoire avant correctifs

1. Présenter le rapport complet à Fabien.
2. Fabien valide la liste des findings à corriger (🔴 en priorité systématique).
3. Les correctifs de complexité ≥ Moyen déclenchent `unlazy` (GATES.md obligatoire).
4. Les correctifs UI (≥ 3 fichiers) sont délégués à Chloé (DaisyUI/Tailwind) ou Lucas (Vue SFC).
5. Les correctifs UX impliquant des changements de navigation ou de flux remontent à Sally (BMAD UX) si le changement modifie ce qui a été validé dans le PRD.

Aucun correctif n'est implémenté sans validation explicite.

---

## Phase 6 — Correctifs ciblés

Pour chaque finding validé :
- Ouvrir une entrée dans `.agents/WRITING_IMPROVEMENT.md`
- Appliquer le correctif avec `unlazy` si le seuil est atteint (voir `08-skills-activation.md`)
- Exécuter `npm run build` avant de déclarer terminé
- Si le finding correspond à un déclencheur KI, écrire la fiche immédiatement dans `.agents/knowledge/`

---

## Checklist de clôture

- [ ] Tous les findings 🔴 adressés ou repoussés avec justification écrite
- [ ] Parcours critiques (check-in, check-out, export) testés manuellement après correctifs
- [ ] `npm run build` passe sans erreur ni warning de composant
- [ ] `node scripts/verify-gates.mjs --voice-conformance` passe (si oracle disponible)
- [ ] Rapport final dans `WRITING_IMPROVEMENT.md` avec statut "Implémenté"
- [ ] Fiche KI créée si un pattern récurrent a été identifié
