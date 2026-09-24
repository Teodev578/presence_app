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

