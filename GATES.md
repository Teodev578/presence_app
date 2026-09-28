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

---

# Gates: Grammaire de Tiroir Commune, Sections et Contrôle Segmenté

OWNS: src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, src/components/shared/ThemeToggle.vue, src/composables/useTheme.js, scripts/verify-gates.mjs, scripts/verify-browser.mjs, scripts/test-theme-toggle.mjs, GATES.md, AGENTS.md

Scope: Transposer la grammaire de la maquette dans les deux tiroirs, sans panneau flottant : marque et badge d'espace en tête, libellés de section Navigation puis Mon espace, barre d'accent sur l'entrée sélectionnée, passagère neutre, pied ordonné en statut réseau, apparence, identité et déconnexion en icône. Le contrôle d'apparence devient un groupe segmenté à trois états. Le seuil de déploiement reste à 1024 px dans ce lot, avant d'être porté à 840 px par le lot « Ancrage de la Barre Latérale ». Ni compteurs ni recherche ne sont ajoutés.

- [x] G23 (réécrite): Le contrôle d'apparence est un groupe segmenté à trois états nommés, chacun doté d'un libellé visible, d'un état aria-pressed et d'une cible de 44px
  CHECK: node scripts/verify-gates.mjs --appearance-control-markup
  EXPECT: G23 passed: appearance control is a three-state segmented group
  EVIDENCE: G23 passed: appearance control is a three-state segmented group (vérifié par node scripts/verify-gates.mjs --appearance-control-markup)

- [x] G35 (réécrite): Les deux pieds de tiroir ordonnent statut réseau, apparence, identité puis déconnexion en icône, la marque restant en tête
  CHECK: node scripts/verify-gates.mjs --drawer-footer
  EXPECT: G35 passed: both drawers end with settings, identity and an icon logout
  EVIDENCE: G35 passed: both drawers end with settings, identity and an icon logout (vérifié par node scripts/verify-gates.mjs --drawer-footer)

- [x] G36 (étendue): Aucune passerelle inter-espace ne singe une entrée sélectionnée, dans l'un ou l'autre espace
  CHECK: node scripts/verify-gates.mjs --gateway-neutral
  EXPECT: G36 passed: no gateway entry mimics a selected destination
  EVIDENCE: G36 passed: no gateway entry mimics a selected destination (vérifié par node scripts/verify-gates.mjs --gateway-neutral)

- [x] G40: Les deux tiroirs partagent une seule grammaire (marque, badge d'espace, sections libellées, barre d'accent masquée aux lecteurs d'écran) et n'introduisent aucun rail en icônes
  CHECK: node scripts/verify-gates.mjs --drawer-shared-grammar
  EXPECT: G40 passed: both drawers share one navigation grammar
  EVIDENCE: G40 passed: both drawers share one navigation grammar (vérifié par node scripts/verify-gates.mjs --drawer-shared-grammar)

- [x] G41: Le contrôle segmenté tient dans la cascade CSS réelle : nom de groupe, aria-pressed, cibles de 44px, bordure visible et troncature sous contrainte extrême
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --theme --appearance-control
  EXPECT: browser-verify: theme toggle passed
  EVIDENCE: browser-verify: theme toggle passed et browser-verify: appearance control passed, 38 assertions vertes, aucune exception de page (vérifié par le parcours Chrome headless, copies dans .unlazy/evidence)

- [x] G42: La suite comportementale du compositeur d'apparence couvre la sélection explicite de chaque état et le rejet d'un état inconnu
  CHECK: node scripts/test-theme-toggle.mjs
  EXPECT: theme-toggle: behavior suite passed
  EVIDENCE: theme-toggle: behavior suite passed, 28 assertions vertes (vérifié par node scripts/test-theme-toggle.mjs)

- [x] G38 (retirée): La porte qui exigeait un EmployeeLayout.vue identique octet pour octet à la révision cdb558f perd son objet, la sanctuarisation de la navigation employé ayant été levée par autorisation explicite de l'utilisateur. G40 la remplace et vérifie la parité de grammaire au lieu de l'immobilité.

- [x] G39: Compilation de production Vite sans erreur validée par le code retour du sous-processus
  CHECK: node scripts/verify-gates.mjs --manager-build
  EXPECT: G39 passed: production build succeeds with exit code 0
  EVIDENCE: G39 passed: production build succeeds with exit code 0 (vérifié par node scripts/verify-gates.mjs --manager-build)

---

# Gates: Ancrage de la Barre Latérale à 840px

OWNS: src/style.css, src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, scripts/verify-gates.mjs, scripts/verify-browser.mjs, GATES.md, AGENTS.md, .agents/rules/07-design-system.md

Scope: Sous 840px, les deux espaces naviguent par tiroir superposé déclenché par le hamburger. À partir de 840px, la barre latérale s'ancre dans la mise en page avec ses libellés complets, dans les deux espaces. Aucun rail en icônes seules, aucune barre de navigation basse. DaisyUI ne précompile `drawer-open` que pour ses propres seuils, d'où le jeton `--breakpoint-docked: 840px` et la classe `.drawer-docked` posés dans `src/style.css`. La réserve employé d'AGENTS.md et de la règle 07 §7 est levée en conséquence, l'espace employé conservant sa pleine largeur de pointage sous 840px.

- [x] G43: Les deux espaces ancrent leur barre latérale au seuil de 840px déclaré dans le thème, masquent les contrôles de tiroir une fois ancrées, et l'espace employé conserve son verrouillage onepage
  CHECK: node scripts/verify-gates.mjs --nav-docking
  EXPECT: G43 passed: both spaces dock their sidebar at 840px and keep the drawer below
  EVIDENCE: G43 passed: both spaces dock their sidebar at 840px and keep the drawer below (vérifié par node scripts/verify-gates.mjs --nav-docking)

- [x] G44: L'ancrage est éprouvé dans la cascade réelle de part et d'autre du seuil : volet superposé à 839px, barre ancrée à 841px, contenu poussé, voile inerte
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --nav-docking
  EXPECT: browser-verify: navigation docking passed
  EVIDENCE: browser-verify: navigation docking passed, 6 assertions vertes aux deux largeurs, aucune exception de page (vérifié par le parcours Chrome headless, copies dans .unlazy/evidence)

- [x] G40 (revalidée): La parité de grammaire des deux tiroirs tient après le passage à l'ancrage, et aucun rail n'est introduit
  CHECK: node scripts/verify-gates.mjs --drawer-shared-grammar
  EXPECT: G40 passed: both drawers share one navigation grammar
  EVIDENCE: G40 passed: both drawers share one navigation grammar (vérifié par node scripts/verify-gates.mjs --drawer-shared-grammar)

---

# Gates: Repli en Rail d'Icônes

OWNS: src/composables/useSidebarNav.js, src/layouts/EmployeeLayout.vue, src/layouts/ManagerLayout.vue, src/components/shared/ThemeToggle.vue, src/style.css, scripts/verify-gates.mjs, scripts/verify-browser.mjs, scripts/test-sidebar-nav.mjs, CONTEXT.md, .agents/rules/07-design-system.md, GATES.md, AGENTS.md

Scope: Une fois la barre ancrée à 840px, une poignée en tête la replie en rail d'icônes : libellés masqués au profit des seules icônes, infobulle et libellé accessible nommant chaque entrée, marque et pied réduits. Le contrôle d'apparence y devient un menu latéral portant les trois états nommés. Entre 840px et 1024px, le repli s'applique de lui-même pour épargner la largeur de la vue ; un clic sur la poignée grave un choix explicite qui prime ensuite sur le seuil. Sous 840px, le rail n'a pas d'objet : le tiroir superposé garde ses libellés complets. Aucune barre de navigation basse n'est introduite, et le pointage employé conserve sa pleine largeur sous 840px. La porte G17, qui figeait les lignes de l'indicateur de synchronisation, est réécrite en simple contrôle de présence, la classe `rail-network` modifiant légitimement la pastille.

Hors périmètre, constaté avant ce lot sur des fichiers que ce lot ne touche pas : `G1`, `G3` et `G4` échouent déjà sur `src/components/shared/ToastContainer.vue` (caractère graphique brut, `shadow-md`, cible `btn-xs`) et `src/components/shared/SyncIndicator.vue` (`shadow-2xs`) ; `G8` échoue sur `src/views/employee/HomeView.vue` (inversion mobile des cartes absente). L'état de ces portes reste inchangé par ce lot.

- [x] G45: Le contrat du repli est câblé dans les deux espaces : seuil d'ancrage et bande de repli automatique dérivés du composable partagé, poignée de 44px masquée hors ancrage, libellés et infobulles des entrées, règles CSS confinées à la media query de 840px
  CHECK: node scripts/verify-gates.mjs --sidebar-rail
  EXPECT: G45 passed: docked sidebars collapse into an icon rail and keep their labels below 840px
  EVIDENCE: G45 passed: docked sidebars collapse into an icon rail and keep their labels below 840px (vérifié par node scripts/verify-gates.mjs --sidebar-rail)

- [x] G46: La suite comportementale du composable de repli couvre le suivi des deux seuils, la priorité du choix explicite, la persistance, la garde hors ancrage et la robustesse du stockage
  CHECK: node scripts/test-sidebar-nav.mjs
  EXPECT: sidebar-nav: behavior suite passed
  EVIDENCE: sidebar-nav: behavior suite passed, 26 assertions vertes (vérifié par node scripts/test-sidebar-nav.mjs)

- [x] G47: Le repli est éprouvé dans la cascade réelle : rail automatique à 841px, déploiement et repli volontaires persistants, retour au seuil automatique déjoué, aucun rail à 839px, menu d'apparence nommé en rail
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --sidebar-rail
  EXPECT: browser-verify: sidebar rail passed
  EVIDENCE: browser-verify: sidebar rail passed, 20 assertions vertes, aucune exception de page (vérifié par le parcours Chrome headless, copie dans .unlazy/evidence/sidebar-rail.png)

- [x] G17 (réécrite): La porte qui exigeait des lignes `SyncIndicator` identiques octet pour octet à la révision f46026c perd son objet : le lot ajoute légitimement la classe `rail-network` à la pastille pour la camoufler en rail. L'immobilité est remplacée par la seule présence requise de l'indicateur dans chaque tiroir, la mise en page relevant désormais de G33 et G40
  CHECK: node scripts/verify-gates.mjs --sync-indicator-preserved
  EXPECT: G17 passed: each drawer keeps its sync indicator
  EVIDENCE: G17 passed: each drawer keeps its sync indicator (vérifié par node scripts/verify-gates.mjs --sync-indicator-preserved)

- [x] G44 (revalidée): L'ancrage à 840px tient après l'ajout du repli, voile inerte et contenu poussé compris
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --nav-docking
  EXPECT: browser-verify: navigation docking passed
  EVIDENCE: browser-verify: navigation docking passed, 7 assertions vertes, aucune exception de page (vérifié par le parcours Chrome headless, copies dans .unlazy/evidence)

- [x] G40 (revalidée): La parité de grammaire des deux tiroirs tient après l'ajout du repli, le composant historique `navigation-rail` restant proscrit
  CHECK: node scripts/verify-gates.mjs --drawer-shared-grammar
  EXPECT: G40 passed: both drawers share one navigation grammar
  EVIDENCE: G40 passed: both drawers share one navigation grammar (vérifié par node scripts/verify-gates.mjs --drawer-shared-grammar)

- [x] G48: Compilation de production Vite sans erreur validée par le code retour du sous-processus
  CHECK: node scripts/verify-gates.mjs --sidebar-build
  EXPECT: G48 passed: production build succeeds with exit code 0
  EVIDENCE: G48 passed: production build succeeds with exit code 0 (vérifié par node scripts/verify-gates.mjs --sidebar-build)

---

# Gates: Intégration de la Poignée de Repli à l'En-tête

OWNS: src/layouts/EmployeeLayout.vue, src/layouts/ManagerLayout.vue, src/style.css, scripts/verify-gates.mjs, scripts/verify-browser.mjs, .agents/rules/07-design-system.md, GATES.md

Scope: Constat à 1440px avant correctif : la poignée était posée en `absolute top-4 right-4` sur un en-tête `justify-center`, si bien que le badge d'espace passait sous le bouton (chevauchement de 21px) et que le bouton traversait le filet d'en-tête (débord de 3px). La barre déployée garde désormais la poignée en flux dans la rangée de son en-tête, à la droite d'un bloc marque borné (`min-w-0`) sur un en-tête `justify-between relative`. Seul le repli en rail la sort du flux, dans la media query d'ancrage. Les deux espaces partagent cette grammaire, le `relative` manquant de l'en-tête gestionnaire étant rétabli.

- [x] G49: Le contrat d'intégration est vérifié sur les deux fichiers réels : en-tête `items-center justify-between gap-2 relative`, bloc marque borné, poignée en flux (`shrink-0`) sans `absolute`, et reprise en absolu confinée à la media query de 840px
  CHECK: node scripts/verify-gates.mjs --sidebar-handle
  EXPECT: G49 passed: the collapse handle stays in the header row without overflowing it
  EVIDENCE: G49 passed: the collapse handle stays in the header row without overflowing it (vérifié par node scripts/verify-gates.mjs --sidebar-handle, contrôle négatif de l'oracle compris)

- [x] G50: La géométrie réelle est mesurée dans la cascade : à 1440px et 1024px, la poignée siège à droite de la marque, tient dans les quatre bords de l'en-tête et garde sa cible de 44px
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --sidebar-handle
  EXPECT: browser-verify: sidebar handle passed
  EVIDENCE: browser-verify: sidebar handle passed, 9 assertions vertes (4 par largeur + aucune exception de page), chevauchement et débord éliminés (vérifié par le parcours Chrome headless)

- [x] G51 (revalidées): Le repli en rail, l'ancrage à 840px et la compilation de production tiennent après la remise en flux de la poignée
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --sidebar-rail
  EXPECT: browser-verify: sidebar rail passed
  EVIDENCE: browser-verify: sidebar rail passed, 20 assertions vertes ; browser-verify: navigation docking passed, 7 assertions vertes ; G48 passed: production build succeeds with exit code 0 (vérifiés par les parcours Chrome headless et npm run build)

---

# Gates: Dégagement de la Poignée en Rail

OWNS: src/style.css, scripts/verify-browser.mjs, GATES.md

Scope: Constat en barre repliée : la poignée absolue (marge haute 0,5rem + cible 44px, soit 52px) chevauchait le haut de la marque centrée (retrait haut 2,5rem = 40px) de 12px. Le chevron mordait le logo. Le retrait haut de l'en-tête du rail passe à 3,5rem : la poignée garde sa rangée, la marque commence après elle, les deux espaces partageant la règle.

- [x] G52: En rail, la poignée de repli ne recouvre plus la marque centrée : le bas de la cible (52px) précède le haut du bloc marque (56px), mesuré dans la cascade réelle
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --sidebar-rail
  EXPECT: browser-verify: sidebar rail passed
  EVIDENCE: browser-verify: sidebar rail passed, 21 assertions vertes (dégagement poignée/marque compris), aucune exception de page (vérifié par le parcours Chrome headless)

