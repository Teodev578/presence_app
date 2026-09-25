# Gates: Commutateur manuel de thème clair / sombre

OWNS: src/composables/useTheme.js, src/components/shared/ThemeToggle.vue, src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, index.html, scripts/verify-gates.mjs, scripts/test-theme-toggle.mjs, scripts/verify-browser.mjs, .unlazy/theme-toggle/**, .unlazy/evidence/**

Scope: Offrir un commutateur manuel à trois états (système, clair, sombre), persistant entre les sessions et sans flash au démarrage, accessible depuis l'en-tête et le pied du tiroir manager ainsi que depuis le pied du tiroir employé, sans introduire de rail de navigation et sans modifier les entrées de navigation des deux espaces.

- [x] G1: Le cycle des modes, la persistance et l'application de l'attribut `data-theme` respectent la spécification, y compris le retour au réglage système
  CHECK: node scripts/test-theme-toggle.mjs
  EXPECT: theme-toggle: behavior suite passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=b593df13419827c2a197b5d2c9d5d4d3ca59bef0b872bfca713ef7550d0ab17c; exit=0; EXPECT=matched; output-sha256=51aa8d1d0cdfb6198a623567b6a1c2ccca57c405ccb25c1fa8e31a9e2806a8bd; output-bytes=1268; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G2: La clé de stockage utilisée par `useTheme.js` est identique à celle lue par le script de pré-peinture de `index.html`
  CHECK: node scripts/test-theme-toggle.mjs --storage-key
  EXPECT: theme-toggle: storage key consistent with index.html
  EVIDENCE: automatic-evidence=v1; definition-sha256=f38ed72f096b43460d72ad609be0a31e6b040f4ce8876ef3285e1154bb5a2628; exit=0; EXPECT=matched; output-sha256=ba2e8b2294a86ce6dd48c1a2123097f0b0a3278d1c9f161be4fb4e17dee977ce; output-bytes=116; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G3: Le commutateur de thème est monté une seule fois par espace, dans le pied de tiroir, et jamais dans un en-tête
  CHECK: node scripts/verify-gates.mjs --theme-placement
  EXPECT: G11 passed: single theme toggle per space in the drawer
  EVIDENCE: automatic-evidence=v1; definition-sha256=385e468fd90244acb80320ce87c46101f97e00299948a892c0b05a785a7a427e; exit=0; EXPECT=matched; output-sha256=68bb81d6e99bd0667e7cbad4ad1c014aa51a55c3fa5658da43e05de09026dfbc; output-bytes=56; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G4: Le CSS construit expose les deux blocs de thème forcé avec des surfaces M3 distinctes, donc forcer un thème change effectivement le rendu
  CHECK: node scripts/verify-gates.mjs --theme-css
  EXPECT: G12 passed: built CSS exposes both forced theme blocks with distinct surfaces
  EVIDENCE: automatic-evidence=v1; definition-sha256=3aa92ca64ccab3131b32877a5991a2fa0d2994658c6d3e3a9182dc2d05fbb7e9; exit=0; EXPECT=matched; output-sha256=61b69386ed5dad61fca25424203aab4e27bb2e14bb77860b4f45c72dd7a518f9; output-bytes=169; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G5: Les fichiers du lot ne contiennent aucun emoji brut ni caractère graphique unicode
  CHECK: node scripts/verify-gates.mjs --theme-emojis
  EXPECT: G13 passed: no raw emojis in theme toggle files
  EVIDENCE: automatic-evidence=v1; definition-sha256=ba0b7934c03b24fe2900578396852d7e9bcee12acf0ca4f12cbf8d4d489f2e5a; exit=0; EXPECT=matched; output-sha256=a34c1a9e06bb031aabd9a879be8624998af1f5532b9f05d048928722818364b1; output-bytes=48; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G6: Les fichiers du lot n'emploient que les tokens d'arrondi Material 3
  CHECK: node scripts/verify-gates.mjs --theme-radii
  EXPECT: G14 passed: theme toggle files use M3 radii tokens only
  EVIDENCE: automatic-evidence=v1; definition-sha256=4e664c8e3609c5efc103fe8d1eda5be4c56e4912e8be3e8e810b3816e008ad88; exit=0; EXPECT=matched; output-sha256=05e191cd5a440dbee05fbacb7730134db8b22819601bf0e2cfa78630bbc7dfb7; output-bytes=56; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G7: Les fichiers du lot ne contiennent aucune ombre prohibée
  CHECK: node scripts/verify-gates.mjs --theme-shadows
  EXPECT: G15 passed: no prohibited shadows in theme toggle files
  EVIDENCE: automatic-evidence=v1; definition-sha256=5be73b576b12c0782319dd340ba39eacc459a68dbfc03ecaeb2b819681ac54c7; exit=0; EXPECT=matched; output-sha256=4470a93d1c250e5960285187a9db305cbf0ae8c1e1c082bb8ff12d614b6cb224; output-bytes=56; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G8: Les cibles tactiles du lot atteignent le seuil de 44px
  CHECK: node scripts/verify-gates.mjs --theme-targets
  EXPECT: G16 passed: all theme toggle touch targets meet 44px
  EVIDENCE: automatic-evidence=v1; definition-sha256=a3a0fd54e58c302a26ce5c4b3a685ee445a9c8a4f1bd17b3958126ccd23364d2; exit=0; EXPECT=matched; output-sha256=f456b82fc53aa12da53f876d1ff3fd38324acf2785323f855e52784de405d12e; output-bytes=53; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G9: Les lignes `SyncIndicator` des tiroirs sont identiques à la révision de référence antérieure au lot, et l'indicateur reste présent dans chaque tiroir
  CHECK: node scripts/verify-gates.mjs --sync-indicator-preserved
  EXPECT: G17 passed: drawer SyncIndicator unchanged since the baseline revision
  EVIDENCE: automatic-evidence=v1; definition-sha256=5ea18900dd71f324b6ecd680dd67efbf8cd8fdc4186b830ecd0fe0c29fb5a2ae; exit=0; EXPECT=matched; output-sha256=c79954581d9778f1b096ce2e48cdf76667fd73fd18e22f33d6e46b290ce79c88; output-bytes=71; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G10: Sanctuarisation de la navigation employé préservée, aucun rail introduit
  CHECK: node scripts/verify-gates.mjs --employee-desktop
  EXPECT: G7 passed: WeekSummaryCard and desktop grid properly implemented with employee navigation sanctuarized
  EVIDENCE: automatic-evidence=v1; definition-sha256=560b0e21b58856b4718778fc5b7526dd826914c5afc5e4c754956b21903fd7e1; exit=0; EXPECT=matched; output-sha256=21c79d90e1caed079fba5aa2cd961732d3e5c9e6aab0b8d893ce099715210c7a; output-bytes=103; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G11: Compilation de production Vite réussie
  CHECK: node scripts/verify-gates.mjs --build
  EXPECT: G6 passed: build succeeded with exit code 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=231dd9b32ce6131ee7e1044400956fe62366d562e32245bfa6bbc3e9bee8d6a1; exit=0; EXPECT=matched; output-sha256=7223850f796fd789ed509a33f2e02a91e0612def6eebbf3561099c1f1b1ca8c8; output-bytes=44; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries

- [x] G12: La bascule de thème, pilotée par des clics réels dans un navigateur, applique les surfaces M3 claires et sombres, persiste la préférence, respecte le seuil de 44px et suit le réglage système émulé
  CHECK: node scripts/verify-browser.mjs --theme
  EXPECT: browser-verify: theme toggle passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=c8d1610809bae970a54a58f99e93e9c2472345342c7da5e69ccaa6cb46827773; exit=0; EXPECT=matched; output-sha256=e760600bf2aad35caca9c47dc4d533b06e664a32794dcee272917cfe2d2bb7c8; output-bytes=1337; shell=/bin/sh; cwd=/home/fabien/Documents/Projets/Pro/PresenceApp/presence-app; path=e20d6bfe21da/22 entries
