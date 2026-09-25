# Gates: Contrôle d'apparence du pied de tiroir

OWNS: src/components/shared/ThemeToggle.vue, src/components/shared/SyncIndicator.vue, src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, scripts/verify-gates.mjs, scripts/verify-browser.mjs, .unlazy/drawer-appearance-control/**, .unlazy/evidence/**

Scope: Le pied de tiroir sépare le statut réseau et le contrôle d'apparence en deux rangées, de sorte que le badge de synchronisation ne puisse plus comprimer ni pousser le commutateur de thème. Ce dernier devient un unique bouton contourné, pleine largeur, qui nomme son action et atteint 44px de hauteur. La variante icône, devenue morte depuis le dédoublonnage des en-têtes, est retirée.

- [x] G1: Les deux mises en page séparent le statut réseau et le contrôle d'apparence en deux rangées, le badge n'étant plus le voisin compressible du commutateur
  CHECK: node scripts/verify-gates.mjs --drawer-settings-layout
  EXPECT: G22 passed: drawer settings split network status and appearance control
  EVIDENCE: automatic-evidence=v1; definition-sha256=a8366d71b641c141fbd31ced8a071c206f4424ea1a5e820d2976386e25ec2f5b; exit=0; EXPECT=matched; output-sha256=57e1bb13907b2bb60e46241cb7e8d97b950ce1eb868805e2bdd884affdca5ac6; output-bytes=72; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G2: Le commutateur de thème n'est plus qu'un bouton unique, contourné, pleine largeur, nommant son action, sans variante icône résiduelle
  CHECK: node scripts/verify-gates.mjs --appearance-control-markup
  EXPECT: G23 passed: appearance control is a single full-width outlined button
  EVIDENCE: automatic-evidence=v1; definition-sha256=94dbf84acb92242a09b6a7012b0a292f204be7f4860a378093a3d8176ef489e8; exit=0; EXPECT=matched; output-sha256=7185d6cbbb79892a941caab2554b825fd8195f247eccb894951ecba2f2efa64d; output-bytes=70; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G3: Le badge de synchronisation se tronque au lieu de pousser ses voisins hors du tiroir
  CHECK: node scripts/verify-gates.mjs --sync-badge-truncation
  EXPECT: G24 passed: sync badge truncates instead of overflowing
  EVIDENCE: automatic-evidence=v1; definition-sha256=11d32a1b17b44aca3c07bd146151b149b3ec242889d49442e73a67337a7a949f; exit=0; EXPECT=matched; output-sha256=2024d28c0d35c5980cf068db81d5fa470825716f4052a82571dd2c52cca3eac0; output-bytes=56; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G4: Rendu réel à 375px : aucun débordement horizontal, badge tronqué, bouton d'apparence entièrement contenu dans le tiroir, bordure visible et cible de 44px
  CHECK: node scripts/verify-browser.mjs --appearance-control
  EXPECT: browser-verify: appearance control passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=1819032f7b6046d7b97838df6f266ab64e401ce9be94a62e511954b1f6e64e43; exit=0; EXPECT=matched; output-sha256=7575bfb1916002fa6fd9a2bce4b5661c532f8b9f4228d2021bdf9539e8d165ca; output-bytes=868; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G5: Non-régression du thème après retrait de la variante icône
  CHECK: node scripts/verify-browser.mjs --theme
  EXPECT: browser-verify: theme toggle passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=c8d1610809bae970a54a58f99e93e9c2472345342c7da5e69ccaa6cb46827773; exit=0; EXPECT=matched; output-sha256=220fcdf4c3b2f3e5de1df882d2ec70550dd22eb2443a4d9894d5fda141768ac7; output-bytes=1298; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G6: Les fichiers du lot respectent les règles d'emoji, d'arrondi Material 3, d'ombre et de cible tactile
  CHECK: node scripts/verify-gates.mjs --ux-conformance
  EXPECT: G21 passed: ux files conform to emoji, radius, shadow and touch target rules
  EVIDENCE: automatic-evidence=v1; definition-sha256=119bcc5b6205f37a45ee8caeeb525050458cf2f86fe899524a2b6495541b48df; exit=0; EXPECT=matched; output-sha256=d7e3b00d1851660501d40e5571ab5265cd8425b58f5926b666cc803f379e5da3; output-bytes=77; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G7: Compilation de production Vite réussie
  CHECK: node scripts/verify-gates.mjs --build
  EXPECT: G6 passed: build succeeded with exit code 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=231dd9b32ce6131ee7e1044400956fe62366d562e32245bfa6bbc3e9bee8d6a1; exit=0; EXPECT=matched; output-sha256=7223850f796fd789ed509a33f2e02a91e0612def6eebbf3561099c1f1b1ca8c8; output-bytes=44; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries
