# Gates: Refonte Responsive et Harmonisation Stylistique Complète de l'Espace Manager & Global

OWNS: src/views/manager/**, src/components/manager/**, src/layouts/**, src/views/auth/LoginView.vue, src/components/employee/GpsRing.vue

Scope: Éliminer tous les emojis bruts résiduels et caractères graphiques unicode, harmoniser les tokens Material 3 (arrondis, élévations), déplacer le statut réseau et déconnexion dans le Navigation Drawer, sécuriser l'adaptabilité mobile et valider la compilation.

- [x] G1: Absence totale d'emojis bruts et caractères unicode graphiques résiduels
  CHECK: node scripts/verify-gates.mjs --emojis
  EXPECT: CLEAN: 0 raw emojis across all src files
  EVIDENCE: CLEAN: 0 raw emojis across all src files (Exécuté avec code retour 0)

- [x] G2: Remplacement des arrondis arbitraires par les tokens Material 3 (rounded-m3-*)
  CHECK: node scripts/verify-gates.mjs --radii
  EXPECT: G2 passed: all non-M3 radii converted to tokens
  EVIDENCE: G2 passed: all non-M3 radii converted to tokens (Exécuté avec code retour 0)

- [x] G3: Élimination des ombres agressives prohibées (shadow-md, shadow-lg, shadow-xl, shadow-2xl)
  CHECK: node scripts/verify-gates.mjs --shadows
  EXPECT: G3 passed: no aggressive shadows across all Vue files
  EVIDENCE: G3 passed: no aggressive shadows across all Vue files (Exécuté avec code retour 0)

- [x] G4: Déplacement du statut réseau et déconnexion dans le Navigation Drawer
  CHECK: node scripts/verify-gates.mjs --layout
  EXPECT: G4 passed: SyncIndicator properly located in drawer footer and removed from header
  EVIDENCE: G4 passed: SyncIndicator properly located in drawer footer and removed from header (Exécuté avec code retour 0)

- [x] G5: Compilation de production Vite sans erreur
  CHECK: node scripts/verify-gates.mjs --build
  EXPECT: G5 passed: build succeeded
  EVIDENCE: G5 passed: build succeeded (Exécuté avec code retour 0)
