# Gates: Dédoublonnage des en-têtes et densité de la tuile hebdomadaire

OWNS: src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, src/components/shared/SyncAlert.vue, src/components/shared/ThemeToggle.vue, src/components/shared/StatusBadge.vue, src/components/employee/WeekSummaryCard.vue, src/views/employee/CheckInView.vue, .agents/rules/09-ui-copy-and-tone.md, AGENTS.md, scripts/verify-gates.mjs, scripts/verify-browser.mjs, .unlazy/ux-headers-and-density/**, .unlazy/evidence/**

Scope: Appliquer le principe « une action, un emplacement » aux deux espaces : conserver une seule occurrence de l'indicateur réseau, de la passerelle inter-espace et du commutateur de thème, toutes logées dans le tiroir, et ne laisser dans l'en-tête qu'une alerte réseau muette tant que tout va bien. Densifier la tuile hebdomadaire en remplaçant la métrique redondante par un compteur d'anomalies actionnable, rendre la jauge lisible sous 5 %, corriger le libellé des pointages récents et neutraliser le statut d'une journée close.

- [x] G1: Chaque espace ne conserve qu'une occurrence de l'indicateur de synchronisation, de la passerelle inter-espace et du commutateur de thème, et chaque en-tête porte l'alerte réseau
  CHECK: node scripts/verify-gates.mjs --header-deduplication
  EXPECT: G20 passed: each space keeps a single instance of each control
  EVIDENCE: automatic-evidence=v1; definition-sha256=55600ea0618ea68c37222a08ca8f8ed57da49c123c4e755486a4ce978877b01b; exit=0; EXPECT=matched; output-sha256=4e6c74de2eaa41a6314076f5b689929063c5d7969f90c5798a2f6f5549492215; output-bytes=63; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G2: Le placement d'origine de l'indicateur est respecté : présent dans les tiroirs, absent des en-têtes
  CHECK: node scripts/verify-gates.mjs --layout
  EXPECT: G5 passed: SyncIndicator correctly placed in sidebar drawers and removed from headers
  EVIDENCE: automatic-evidence=v1; definition-sha256=405811cddfb1a31b457331903acd0d7b25abe7710ac4077d1a7d46b963e008cc; exit=0; EXPECT=matched; output-sha256=deb11df51022834d436a9e3daad5e56a4178fa400df539ef7e9fbd1668f8e065; output-bytes=86; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G3: L'alerte réseau reste muette quand tout va bien et n'apparaît que hors ligne ou avec des mutations en attente
  CHECK: node scripts/verify-browser.mjs --sync-alert
  EXPECT: browser-verify: sync alert states passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=ebd0c78d1d411e6e91c9287ed7489627a9b207e3c4dc278aff0dcf34354a0705; exit=0; EXPECT=matched; output-sha256=55b6349fc1e5bf29c485a19152c7595d372dbd5b2d2478a9d7ee68afb2533798; output-bytes=406; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G4: La tuile hebdomadaire constate les départs manquants sans injonction ni terme administratif, garde un segment visible sous 5 % de progression, annonce l'état sain sans réserve et libelle ses pointages récents sans ambiguïté
  CHECK: node scripts/verify-browser.mjs --week-tile
  EXPECT: browser-verify: week tile passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=a3c71bb98fa9de1b76c00b00e4e6fcd13db574687e92e4c2ba14868a007d6663; exit=0; EXPECT=matched; output-sha256=575a94292d3ea3c351b8f8f1d9230de452cd465bd670df932b6c2e45f4d2e537; output-bytes=552; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G5: Une journée close n'est plus signalée en alerte, tout en conservant la trace du retard
  CHECK: node scripts/verify-browser.mjs --status-badge
  EXPECT: browser-verify: status badge passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=14d7d2388226bc1716f61515a69408bc5986030b65596e917a4c02c804c1c5fe; exit=0; EXPECT=matched; output-sha256=51dad26126b453bfe7ee190fb697d3b7d0543dfb00e0c86b67a61e591d799dc5; output-bytes=400; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G6: Le commutateur de thème conserve ses garanties au format compact, à une instance par espace
  CHECK: node scripts/verify-browser.mjs --theme
  EXPECT: browser-verify: theme toggle passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=c8d1610809bae970a54a58f99e93e9c2472345342c7da5e69ccaa6cb46827773; exit=0; EXPECT=matched; output-sha256=220fcdf4c3b2f3e5de1df882d2ec70550dd22eb2443a4d9894d5fda141768ac7; output-bytes=1298; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G7: Les fichiers du lot respectent les règles d'emoji, d'arrondi Material 3, d'ombre et de cible tactile
  CHECK: node scripts/verify-gates.mjs --ux-conformance
  EXPECT: G21 passed: ux files conform to emoji, radius, shadow and touch target rules
  EVIDENCE: automatic-evidence=v1; definition-sha256=119bcc5b6205f37a45ee8caeeb525050458cf2f86fe899524a2b6495541b48df; exit=0; EXPECT=matched; output-sha256=d7e3b00d1851660501d40e5571ab5265cd8425b58f5926b666cc803f379e5da3; output-bytes=77; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G8: Non-régression sur câblage de la règle d'état des sessions, après retrait du compteur redondant de la tuile
  CHECK: node scripts/verify-gates.mjs --open-session-wiring
  EXPECT: G18 passed: open-session rule wired through the three surfaces
  EVIDENCE: automatic-evidence=v1; definition-sha256=b4bd30f45c6a50865249333fe3b9ba2025b62753c95be99e640b38fa3274061e; exit=0; EXPECT=matched; output-sha256=de2b3f53aa2954e37b85fb07a55af4ecb91007da161169263db33a2224fcd9f9; output-bytes=63; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G9: Non-régression navigateur sur les états de session après modification de la tuile
  CHECK: node scripts/verify-browser.mjs --sessions
  EXPECT: browser-verify: session states passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=a70be8175b8532e7cd1b83141dacb706bf4d508e1394615b1d48b18366972af8; exit=0; EXPECT=matched; output-sha256=16d0171c3e04577f39fe2a96e01c95db6be50e699697f254f3e58edda35f03dc; output-bytes=851; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G11: Les textes de l'espace employé n'emploient aucun terme du lexique administratif proscrit par la consigne de ton
  CHECK: node scripts/verify-gates.mjs --voice-conformance
  EXPECT: G30 passed: employee-facing copy avoids administrative tone
  EVIDENCE: automatic-evidence=v1; definition-sha256=f25a4b359ccc6b047bfd97522797d8dcbe0aa3ff21ed8b60d0ccab8213aa7b28; exit=0; EXPECT=matched; output-sha256=f740a3119eb664a511d8d9a001ad9c29b2d65c400b13fee5f2744a58aa14c8ef; output-bytes=60; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G12: La consigne de ton est consignée, cite son garde-fou exécutable et reste référencée par la carte des directives
  CHECK: node scripts/verify-gates.mjs --tone-rule-registered
  EXPECT: G31 passed: tone rule is registered and wired to its oracle
  EVIDENCE: automatic-evidence=v1; definition-sha256=9efada0bd5e3eafb026caf8245bebf3108763d17451baaa1ebd30a83a5457785; exit=0; EXPECT=matched; output-sha256=658a8813527d5ba00a86164c3f9b8a32b680dc273cda7a66e4202427c118e766; output-bytes=60; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G10: Compilation de production Vite réussie
  CHECK: node scripts/verify-gates.mjs --build
  EXPECT: G6 passed: build succeeded with exit code 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=231dd9b32ce6131ee7e1044400956fe62366d562e32245bfa6bbc3e9bee8d6a1; exit=0; EXPECT=matched; output-sha256=7223850f796fd789ed509a33f2e02a91e0612def6eebbf3561099c1f1b1ca8c8; output-bytes=44; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries
