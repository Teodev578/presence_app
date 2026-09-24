# Gates: Optimisation Desktop Espace Employé & Carte Compagnon (Option A)

OWNS: scripts/verify-gates.mjs, src/components/employee/WeekSummaryCard.vue, src/views/employee/HomeView.vue, src/layouts/EmployeeLayout.vue, src/lib/dateUtils.js, src/composables/usePresences.js

Scope: Intégration de la carte compagnon WeekSummaryCard.vue affichant le total des heures de la semaine et l'historique des 5 derniers jours, mise en place d'une grille réactive asymétrique (lg:grid-cols-12) dans HomeView.vue, élargissement du conteneur desktop dans EmployeeLayout.vue (lg:max-w-5xl xl:max-w-6xl) et sanctuarisation absolue de la navigation employé (aucun navigation rail).

- [x] G1: Absence totale d'emojis bruts et caractères graphiques unicode dans src/
  CHECK: node scripts/verify-gates.mjs --emojis
  EXPECT: G1 passed: 0 raw emojis across all src files
  EVIDENCE: G1 passed: 0 raw emojis across all src files (Code retour 0)

- [x] G2: Exclusion intégrale des arrondis non M3 au profit des tokens Material 3 (rounded-m3-*)
  CHECK: node scripts/verify-gates.mjs --radii
  EXPECT: G2 passed: all non-M3 radii converted to tokens
  EVIDENCE: G2 passed: all non-M3 radii converted to tokens (Code retour 0)

- [x] G3: Absence d'ombres opaques et agressives (shadow-md, shadow-lg, shadow-xl, shadow-2xl)
  CHECK: node scripts/verify-gates.mjs --shadows
  EXPECT: G3 passed: no aggressive shadows across all Vue files
  EVIDENCE: G3 passed: no aggressive shadows across all Vue files (Code retour 0)

- [x] G4: Conformité de toutes les cibles tactiles interactives au seuil minimal de 44px (WCAG AA)
  CHECK: node scripts/verify-gates.mjs --targets
  EXPECT: G4 passed: all interactive buttons meet 44px touch targets
  EVIDENCE: G4 passed: all interactive buttons meet 44px touch targets (Code retour 0)

- [x] G5: Emplacement conforme du composant SyncIndicator dans les tiroirs latéraux (Manager et Employé)
  CHECK: node scripts/verify-gates.mjs --layout
  EXPECT: G5 passed: SyncIndicator correctly placed in sidebar drawers and removed from headers
  EVIDENCE: G5 passed: SyncIndicator correctly placed in sidebar drawers and removed from headers (Code retour 0)

- [x] G7: Implémentation de WeekSummaryCard.vue, de la grille desktop lg:grid-cols-12 et sanctuarisation de la navigation employé
  CHECK: node scripts/verify-gates.mjs --employee-desktop
  EXPECT: G7 passed: WeekSummaryCard and desktop grid properly implemented with employee navigation sanctuarized
  EVIDENCE: G7 passed: WeekSummaryCard and desktop grid properly implemented with employee navigation sanctuarized (Code retour 0)

- [x] G8: Compilation de production Vite sans erreur validée par le code retour du sous-processus
  CHECK: node scripts/verify-gates.mjs --build
  EXPECT: G6 passed: build succeeded with exit code 0
  EVIDENCE: G6 passed: build succeeded with exit code 0 (Code retour 0)

