# Journal d'Arbitrages — PresenceApp

Ce fichier enregistre le raisonnement derrière les décisions non triviales : hypothèses, alternatives refusées, trade-offs acceptés, leçons tirées. Il ne remplace pas `AGENTS.md` (invariants figés) ni les fiches `.agents/knowledge/` (leçons généralisées). Il documente ce qui est *en cours de décider*.

**Règle d'escalade** : une décision qui revient à l'identique dans deux tâches distinctes monte dans une règle `.agents/rules/`. Une leçon tirée qui répond aux déclencheurs KI (`11-apprentissage-et-memoire.md`) alimente une fiche `.agents/knowledge/` au moment de la correction, pas le lendemain.

**Portée** : tâches de complexité « Moyen » ou « Élevée » uniquement. Les tâches simples (correctif ponctuel, retouche isolée) ne génèrent pas d'entrée.

**Gouvernance** : Fabien valide les décisions consignées ici. Pour les arbitrages impliquant un couplage PRD↔implémentation, la validation requiert aussi confirmation de l'agent propriétaire de la story (Lucas / Nora / Marc selon domaine).

---

## Template — Complexité « Moyen » (pre-flight 10 min)

```markdown
### Tâche : [Nom court]
**Date** : AAAA-MM-JJ
**Complexité** : Moyen
**Proposant** : [Agent ou Fabien]
**Story liée** : [référence ou —]

#### Pre-flight (10 min)
1. Problème réel : …
2. Contrainte principale : …
3. Alternative rejetée : … — rejetée parce que …
4. Signal de fin : …
5. Déclencheur KI : O/N

#### Résultat
- Implémenté ? O/N — [date si oui]
- Leçon tirée : …
- Escalade déclenchée ? (si ≥ 3 fichiers découverts en cours de route → unlazy)
```

**Règle d'escalade** : si l'exécution révèle un troisième fichier ou une dépendance non anticipée, la tâche bascule en « Élevée » et déclenche `unlazy` (GATES.md obligatoire). Compléter le template ci-dessous.

---

## Template — Complexité « Élevée » (unlazy + plan.md)

```markdown
### Tâche : [Nom court]
**Date** : AAAA-MM-JJ
**Complexité** : Élevée
**Proposant** : [Agent ou Fabien]
**Story liée** : [référence ou —]

#### Analyse
- **Hypothèse initiale** : …
- **Contraintes identifiées** : …
- **Alternatives envisagées** :
  - Option A — [description] → rejetée parce que …
  - Option B — [description] → rejetée parce que …

#### Décision
**Choix retenu** : …
**Justification** : …
**Trade-offs acceptés** : …
**Engagement KI** : déclencheur KI applicable ? O/N — si O, fiche à écrire immédiatement.

#### Résultat
- Implémenté ? O/N — [date si oui]
- Leçon tirée : …
- Escalade : → `rules/` | → `knowledge/` | aucune
```


---

## Tâches actives

### Tâche : Audit next-level-ui — 2026-10-02
**Date** : 2026-10-02
**Complexité** : Élevée
**Proposant** : next-level-ui skill
**Story liée** : —

#### Findings triés par sévérité

| # | Sévérité | Axe | Fichier(s) / Périmètre | Description | Correctif proposé |
|---|----------|-----|----------------------|-------------|-------------------|
| 1 | 🔴 Critique | Axe 2 (A11y WCAG) & Axe 9 | `src/components/shared/ToastContainer.vue` | Cible de fermeture à 24px (`btn-xs`), glyphe brut `✕`, `shadow-md` prohibé M3 et `transition: all` non GPU | Remplacer par `min-h-11 min-w-11`, icône SVG avec `aria-hidden="true"`, tokens d'élévation M3 et transition GPU `opacity`/`transform` |
| 2 | 🔴 Critique | Axe 9 (Feedback) & Axe 7 | `src/views/SettingsView.vue` | Déconnexion destructive exécutée immédiatement au clic sans modale de confirmation, et bouton pleine largeur sur desktop sans friction `sm:max-w-64` | Encapsuler la déconnexion dans `ConfirmModal` et borner la largeur avec `sm:max-w-64` selon règle 10 |
| 3 | 🔴 Critique | Axe 2 (A11y WCAG) & Axe 4 | `src/layouts/ManagerLayout.vue`, `src/layouts/EmployeeLayout.vue` | Bouton hamburger de tiroir réduit sous 44px entre 640px et 840px (`btn-sm sm:min-h-10 sm:min-w-10`) | Supprimer `btn-sm` et fixer `min-h-11 min-w-11` invariable sous 840px |
| 4 | 🟡 Moyen | Axe 7 (Parcours) & Axe 9 | `src/views/employee/CheckInView.vue`, `CheckOutView.vue` | Absence d'indication ou de réassurance visuelle sur la persistance locale lorsque l'appareil est hors réseau | Intégrer un encart d'information contextuel signalant la prise en charge locale et la synchronisation différée |
| 5 | 🟡 Moyen | Axe 3 (États vides/charge) | `src/views/manager/DashboardView.vue`, `EmployeesView.vue`, `TeamsView.vue` | Flash d'état vide (FOUC) pendant le microtask initial de Dexie (`!data.length` vrai avant réception des données) | Définir un état de chargement explicite (skeleton/spinner) tant que le premier résultat Dexie n'a pas été émis |
| 6 | 🟡 Moyen | Axe 8 (Information & Nav) | `src/layouts/ManagerLayout.vue` | Ambiguïté cognitive entre les entrées de navigation consécutives « Équipe » (`/manager/employees`) et « Équipes » (`/manager/teams`) | Renommer `/manager/employees` en « Collaborateurs » ou « Membres » pour clarifier la distinction |
| 7 | 🟡 Moyen | Axe 6 (Cohérence) & Axe 9 | `src/views/manager/PresencesView.vue` | Bouton d'actualisation absent du slot `#actions` de l'en-tête (échec G63) et appel `syncNow` désaccordé du contrat local-first (échec G72) | Ajouter le bouton « Actualiser » dans `ManagerPageHeader` et harmoniser l'appel `syncNow(user?.id)` |
| 8 | 🟡 Moyen | Axe 6 (Cohérence) & Axe 8 | `src/views/SettingsView.vue` | Absence totale d'en-tête de page (`h1` sémantique), entrée abrupte dans la grille de réglages | Introduire un en-tête sobre avec titre `h1` et sous-titre contextualisé selon l'espace |
| 9 | 🟢 Mineur | Axe 1 (Tokens M3) | `src/views/manager/AvailabilitiesView.vue` | Boîte de dialogue de créneau utilisant l'ombre agressive `shadow-lg` interdite par Material 3 | Aligner sur `bg-base-100 border border-base-300 shadow-sm` |
| 10 | 🟢 Mineur | Axe 1 (Typographie) | `AvailabilitiesView.vue`, `SyncAlert.vue`, `SyncIndicator.vue` | Tailles de police arbitraires `text-[11px]` rompant la rigueur typographique (échec G88) | Convertir vers le jeton standard `text-xs` |
| 11 | 🟢 Mineur | Axe 5 (Copy & Tone) | `LocationsView.vue`, `SyncIndicator.vue`, `SyncAlert.vue` | Emploi de "valider son arrivée" (règle 09 §2) et de pluriels entre parenthèses `mutation(s)` (règle 09 §3) | Formuler « enregistrer son arrivée » et écrire les pluriels en clair |
| 12 | 🟢 Mineur | Axe 6 & Axe 10 (Boutons) | `src/views/manager/AvailabilitiesView.vue` | Boutons de pied de modale sans `min-h-11`, sans feedback `active:scale-95` et flèche unicode `→` | Appliquer `min-h-11`, le feedback tactile universel et une icône SVG dédiée |
| 13 | 🟢 Mineur | Axe 1 (Tokens M3) | `src/components/shared/SyncIndicator.vue` | Emploi de `shadow-2xs` non conforme à la hiérarchie M3 (échec G3) | Retirer la classe ou basculer en bordure surfacique nette |
| 14 | 🟢 Mineur | Axe 4 (Responsive) | `src/views/employee/HomeView.vue` | Classes d'inversion d'ordre absentes sur mobile/tablette (échec G8) | Ajuster l'ordonnancement responsive pour respecter le contrat du pointage prioritaire |
| 15 | 🟢 Mineur | Axe 6 (Cohérence) & Axe 8 | `src/views/manager/LocationsView.vue` | Titre d'en-tête « Lieux de travail » en divergence avec l'oracle G93 (« Gestion des Sites ») | Harmoniser le titre avec le contrat de navigation |

#### Décision
**Findings retenus pour correction** : Les 15 findings retenus, validés et implémentés (Lots 1 à 4).
**Trade-offs acceptés** : Préservation du titre de navigation en bandeau barTitle sur la vue Paramètres conformément à G97 (pas de doublon h1).
**Engagement KI** : Pattern d'anti-FOUC sur useLiveQuery documenté (vérification `=== undefined` avec skeleton au montage).

#### Résultat
- Implémenté ? O (Portes G131 à G136 validées, 100% de succès sur node scripts/verify-gates.mjs --all, compilation Vite sans erreur)

---

## Archives

*(Les tâches fermées migrent ici. Elles restent visibles pour la traçabilité ; aucune rotation temporelle.)*
