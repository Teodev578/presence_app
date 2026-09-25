# Gates: État des sessions ouvertes et journées révolues

OWNS: src/lib/dateUtils.js, src/components/employee/WeekSummaryCard.vue, src/composables/usePresences.js, src/views/manager/PresencesView.vue, scripts/verify-gates.mjs, scripts/test-session-state.mjs, scripts/verify-browser.mjs, .unlazy/open-session-state/**, .unlazy/evidence/**

Scope: Une session ouverte ne doit plus être présentée comme « en cours » dès lors que sa date de travail n'est plus la journée locale courante. Les trois surfaces concernées (tuile de récapitulation employé, total hebdomadaire, tableau gestionnaire) partagent une règle unique : session close, session en cours du jour, ou départ manquant sur une journée révolue, cette dernière contribuant zéro minute au total hebdomadaire.

- [x] G1: La règle d'état de session respecte la bascule sur la date de travail, y compris la frontière de minuit, et une session ouverte d'une journée révolue contribue zéro minute au total
  CHECK: node scripts/test-session-state.mjs
  EXPECT: session-state: behavior suite passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=ff02f3a85040a126000625cc5fa03bfff1d5011fc21c13be7bfda1dea2453584; exit=0; EXPECT=matched; output-sha256=6579eeae476e0ffd641c13aceae8813b40bce57db428f9475c9c107b811677a4; output-bytes=1272; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G2: Les trois surfaces consomment la règle partagée au lieu de dériver l'état du seul `check_out_time`, et le détecteur d'appels détournés réagit à un échantillon témoin
  CHECK: node scripts/verify-gates.mjs --open-session-wiring
  EXPECT: G18 passed: open-session rule wired through the three surfaces
  EVIDENCE: automatic-evidence=v1; definition-sha256=b4bd30f45c6a50865249333fe3b9ba2025b62753c95be99e640b38fa3274061e; exit=0; EXPECT=matched; output-sha256=de2b3f53aa2954e37b85fb07a55af4ecb91007da161169263db33a2224fcd9f9; output-bytes=63; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G3: Les fichiers du lot respectent les règles d'emoji, d'arrondi Material 3, d'ombre et de cible tactile
  CHECK: node scripts/verify-gates.mjs --open-session-conformance
  EXPECT: G19 passed: open-session files conform to emoji, radius, shadow and touch target rules
  EVIDENCE: automatic-evidence=v1; definition-sha256=88b663d501e84c4154aaeb4299cce03508c3af6d1304cf541ddaaed8a54143f3; exit=0; EXPECT=matched; output-sha256=abf2622a3f99485e24b6e69f9be2670473d5793b8399f757d6fc1022e20a6cfc; output-bytes=87; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G4: Non-régression sur la tuile de récapitulation, dont la structure verticale reste requise par la grille employé
  CHECK: node scripts/verify-gates.mjs --employee-desktop
  EXPECT: G7 passed: WeekSummaryCard and desktop grid properly implemented with employee navigation sanctuarized
  EVIDENCE: automatic-evidence=v1; definition-sha256=560b0e21b58856b4718778fc5b7526dd826914c5afc5e4c754956b21903fd7e1; exit=0; EXPECT=matched; output-sha256=21c79d90e1caed079fba5aa2cd961732d3e5c9e6aab0b8d893ce099715210c7a; output-bytes=103; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G5: Compilation de production Vite réussie
  CHECK: node scripts/verify-gates.mjs --build
  EXPECT: G6 passed: build succeeded with exit code 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=231dd9b32ce6131ee7e1044400956fe62366d562e32245bfa6bbc3e9bee8d6a1; exit=0; EXPECT=matched; output-sha256=7223850f796fd789ed509a33f2e02a91e0612def6eebbf3561099c1f1b1ca8c8; output-bytes=44; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G6: La tuile employé, rendue dans un navigateur, distingue la session close, la session du jour en cours et le départ manquant, et la jauge hebdomadaire exclut la session oubliée
  CHECK: node scripts/verify-browser.mjs --sessions
  EXPECT: browser-verify: session states passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=a70be8175b8532e7cd1b83141dacb706bf4d508e1394615b1d48b18366972af8; exit=0; EXPECT=matched; output-sha256=16d0171c3e04577f39fe2a96e01c95db6be50e699697f254f3e58edda35f03dc; output-bytes=851; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries
