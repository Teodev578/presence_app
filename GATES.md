# Gates: Inversion Mobile des Cartes et Défilement Tactile

OWNS: scripts/verify-gates.mjs, src/views/employee/HomeView.vue, src/layouts/EmployeeLayout.vue

Scope: Inverser l'ordre des cartes en format mobile (carte hebdomadaire en premier, carte journalière en second) tout en maintenant la disposition de bureau (carte journalière à gauche, carte hebdomadaire à droite) et assurer le défilement tactile fluide sur mobile sans compromettre le mode onepage sur tablette/desktop.

- [x] G1: Absence totale d'emojis bruts et caractères graphiques unicode dans src/
  CHECK: node scripts/verify-gates.mjs --emojis
  EXPECT: G1 passed: 0 raw emojis across all src files
  EVIDENCE: G1 passed: 0 raw emojis across all src files (vérifié par node scripts/verify-gates.mjs --emojis)

- [x] G2: Exclusion intégrale des arrondis non M3 au profit des tokens Material 3 (rounded-m3-*)
  CHECK: node scripts/verify-gates.mjs --radii
  EXPECT: G2 passed: all non-M3 radii converted to tokens
  EVIDENCE: G2 passed: all non-M3 radii converted to tokens (vérifié par node scripts/verify-gates.mjs --radii)

- [x] G3: Absence d'ombres opaques et agressives (shadow-md, shadow-lg, shadow-xl, shadow-2xl)
  CHECK: node scripts/verify-gates.mjs --shadows
  EXPECT: G3 passed: no aggressive shadows across all Vue files
  EVIDENCE: G3 passed: no aggressive shadows across all Vue files (vérifié par node scripts/verify-gates.mjs --shadows)

- [x] G4: Conformité de toutes les cibles tactiles interactives au seuil minimal de 44px (WCAG AA)
  CHECK: node scripts/verify-gates.mjs --targets
  EXPECT: G4 passed: all interactive buttons meet 44px touch targets
  EVIDENCE: G4 passed: all interactive buttons meet 44px touch targets (vérifié par node scripts/verify-gates.mjs --targets)

- [x] G5: Emplacement conforme du composant SyncIndicator dans les tiroirs latéraux (Manager et Employé)
  CHECK: node scripts/verify-gates.mjs --layout
  EXPECT: G5 passed: SyncIndicator correctly placed in sidebar drawers and removed from headers
  EVIDENCE: G5 passed: SyncIndicator correctly placed in sidebar drawers and removed from headers (vérifié par node scripts/verify-gates.mjs --layout)

- [x] G6: Sanctuarisation absolue de la navigation employé et intégration de la grille desktop
  CHECK: node scripts/verify-gates.mjs --employee-desktop
  EXPECT: G7 passed: WeekSummaryCard and desktop grid properly implemented with employee navigation sanctuarized
  EVIDENCE: G7 passed: WeekSummaryCard and desktop grid properly implemented with employee navigation sanctuarized (vérifié par node scripts/verify-gates.mjs --employee-desktop)

- [x] G7: Responsivité des cartes, inversion de l'ordre mobile (order-1/order-2) et couverture verticale
  CHECK: node scripts/verify-gates.mjs --responsive
  EXPECT: G8 passed: cards responsiveness, mobile order inversion, and vertical coverage validated
  EVIDENCE: G8 passed: cards responsiveness, mobile order inversion, and vertical coverage validated (vérifié par node scripts/verify-gates.mjs --responsive)

- [x] G8: Compilation de production Vite sans erreur validée par le code retour du sous-processus
  CHECK: node scripts/verify-gates.mjs --build
  EXPECT: G6 passed: build succeeded with exit code 0
  EVIDENCE: G6 passed: build succeeded with exit code 0 (vérifié par node scripts/verify-gates.mjs --build)

- [x] G9: Expansion desktop des cartes sans contraintes de largeur étroites (w-full fluide sans padding excessif)
  CHECK: node scripts/verify-gates.mjs --card-desktop
  EXPECT: G9 passed: all employee cards expand to full desktop container width
  EVIDENCE: G9 passed: all employee cards expand to full desktop container width (vérifié par node scripts/verify-gates.mjs --card-desktop)
- [x] G10: Verrouillage et grisage non-mutable des jours révolus dans la saisie des disponibilités (WeekGrid)
  CHECK: node scripts/verify-gates.mjs --past-days
  EXPECT: G10 passed: past days in WeekGrid are grayed out, disabled and non-mutable
  EVIDENCE: G10 passed: past days in WeekGrid are grayed out, disabled and non-mutable (vérifié par node scripts/verify-gates.mjs --past-days)

---

# Gates: Alignement du Tiroir Gestionnaire et Rampe Tonale M3

OWNS: scripts/verify-gates.mjs, GATES.md, src/layouts/ManagerLayout.vue, src/views/manager/*.vue, src/components/manager/StatCard.vue

Scope: Rétablir la rampe tonale Material 3 de l'espace gestionnaire (fond de vue en base-100, cartes en base-200, tiroir en base-200) et aligner le tiroir gestionnaire sur la grammaire du tiroir employé : largeur, densité, taille d'icône, bloc identité en tête, pied réduit aux réglages. La passerelle inter-espace perd sa teinte primaire permanente pour ne plus concurrencer l'entrée sélectionnée. La navigation employé reste intouchée (garde-fou AGENTS.md).

Hors périmètre, constaté avant ce lot sur des fichiers que ce lot ne touche pas : `G1`, `G3` et `G4` échouent déjà sur `src/components/shared/ToastContainer.vue` (caractère graphique brut, `shadow-md`, cible `btn-xs`) et `src/components/shared/SyncIndicator.vue` (`shadow-2xs`) ; `G8` échoue sur `src/views/employee/HomeView.vue` (inversion mobile des cartes absente). L'état de ces portes reste inchangé par ce lot.

- [x] G32: Le fond de vue gestionnaire passe en base-100 et son tiroir en base-200, conformément à la règle 07 §2
  CHECK: node scripts/verify-gates.mjs --manager-ramp
  EXPECT: G32 passed: manager page and drawer follow the M3 surface ramp
  EVIDENCE: G32 passed: manager page and drawer follow the M3 surface ramp (vérifié par node scripts/verify-gates.mjs --manager-ramp)

- [x] G33: Le tiroir gestionnaire partage les métriques du tiroir employé (largeur 72/80, padding, teinte, filet, espacement de liste)
  CHECK: node scripts/verify-gates.mjs --drawer-parity
  EXPECT: G33 passed: manager drawer metrics match the employee drawer
  EVIDENCE: G33 passed: manager drawer metrics match the employee drawer (vérifié par node scripts/verify-gates.mjs --drawer-parity)

- [x] G34: Chaque entrée de navigation gestionnaire atteint la cible tactile de 44px, icônes de 20px
  CHECK: node scripts/verify-gates.mjs --manager-nav-targets
  EXPECT: G34 passed: every manager nav entry meets the 44px touch target
  EVIDENCE: G34 passed: every manager nav entry meets the 44px touch target (vérifié par node scripts/verify-gates.mjs --manager-nav-targets)

- [x] G35: Le bloc identité vit en tête du tiroir gestionnaire et le pied se réduit à réseau, apparence et déconnexion
  CHECK: node scripts/verify-gates.mjs --drawer-identity
  EXPECT: G35 passed: manager identity sits in the drawer header and the footer keeps only settings
  EVIDENCE: G35 passed: manager identity sits in the drawer header and the footer keeps only settings (vérifié par node scripts/verify-gates.mjs --drawer-identity)

- [x] G36: La passerelle inter-espace est neutre : une seule entrée porte la pastille primaire
  CHECK: node scripts/verify-gates.mjs --manager-gateway-neutral
  EXPECT: G36 passed: the gateway no longer mimics a selected entry
  EVIDENCE: G36 passed: the gateway no longer mimics a selected entry (vérifié par node scripts/verify-gates.mjs --manager-gateway-neutral)

- [x] G37: Les cartes gestionnaire vivent en base-200 et les surfaces imbriquées restent lisibles (teintes, rayures, puces)
  CHECK: node scripts/verify-gates.mjs --manager-tonal-ramp
  EXPECT: G37 passed: manager cards and nested surfaces follow the tonal ramp
  EVIDENCE: G37 passed: manager cards and nested surfaces follow the tonal ramp (vérifié par node scripts/verify-gates.mjs --manager-tonal-ramp)

- [x] G38: La navigation employé reste intacte, octet pour octet, depuis la révision cdb558f
  CHECK: node scripts/verify-gates.mjs --employee-untouched
  EXPECT: G38 passed: employee layout is byte-identical to the baseline revision
  EVIDENCE: G38 passed: employee layout is byte-identical to the baseline revision (vérifié par node scripts/verify-gates.mjs --employee-untouched)

- [x] G39: Compilation de production Vite sans erreur validée par le code retour du sous-processus
  CHECK: node scripts/verify-gates.mjs --manager-build
  EXPECT: G39 passed: production build succeeds with exit code 0
  EVIDENCE: G39 passed: production build succeeds with exit code 0 (vérifié par node scripts/verify-gates.mjs --manager-build)
