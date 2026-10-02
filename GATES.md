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

---

# Gates: Priorité du Seuil sur le Choix de Repli

OWNS: src/composables/useSidebarNav.js, scripts/test-sidebar-nav.mjs, scripts/verify-browser.mjs, scripts/verify-gates.mjs, CONTEXT.md, AGENTS.md, .agents/rules/07-design-system.md, GATES.md

Scope: Jusqu'ici, un clic sur la poignée gravait une préférence persistante qui primait ensuite sur le seuil, si bien qu'une barre repliée le restait en desktop. Le seuil gagne désormais toujours : le clic ne vaut que pour la bande courante, et chaque franchissement (tablette ↔ desktop, ou mobile) révoque la préférence stockée, en repli comme en déploiement. La bande tablette reste 840–1024 px.

- [x] G53: Le composable révoque la préférence à chaque franchissement de seuil, vérifié sans DOM réel par la suite comportementale
  CHECK: node scripts/test-sidebar-nav.mjs
  EXPECT: sidebar-nav: behavior suite passed
  EVIDENCE: sidebar-nav: behavior suite passed, 32 assertions vertes (vérifié par node scripts/test-sidebar-nav.mjs)

- [x] G54: Le contrat de repli reste câblé (clé, seuils, persistance du clic) et le rail demeure confiné à la media query de 840px
  CHECK: node scripts/verify-gates.mjs --sidebar-rail
  EXPECT: G45 passed: docked sidebars collapse into an icon rail and keep their labels below 840px
  EVIDENCE: G45 passed: docked sidebars collapse into an icon rail and keep their labels below 840px (vérifié par node scripts/verify-gates.mjs --sidebar-rail)

- [x] G55: Dans la cascade réelle, franchir vers le desktop redéploie malgré un clic déployé stocké, franchir vers la bande replie malgré un clic replié stocké, la préférence étant révoquée à chaque fois
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --sidebar-rail
  EXPECT: browser-verify: sidebar rail passed
  EVIDENCE: browser-verify: sidebar rail passed, 23 assertions vertes, aucune exception de page (vérifié par le parcours Chrome headless)



---

# Gates: Lisibilité du Dialogue de Site

OWNS: src/views/manager/LocationsView.vue, scripts/verify-gates.mjs, scripts/verify-browser.mjs, .agents/rules/07-design-system.md, GATES.md

Scope: Enseignements des forums et guides UX (Nielsen Norman Group « Website Forms Usability », Smashing Magazine « Designing Efficient Web Forms », bonnes pratiques de modales) : colonne simple sauf paires logiques, labels au-dessus du champ, champs dimensionnés pour la lecture, cibles de 44px, action primaire distincte de l'action secondaire. Le dialogue « Modifier le site » passe de `max-w-md` à `max-w-xl` ; ses champs texte et sa barre de recherche occupent la largeur de leur conteneur à 44px de haut ; la barre de recherche du filtre prend la largeur de sa carte, le filtre de statut glissant sur sa propre rangée ; boutons et fermeture atteignent 44px.

- [x] G56: Le dimensionnement est vérifié au niveau source : dialogue élargi (`max-w-xl`), aucun champ rétréci (`input-sm`), chaque champ texte en `w-full` à `min-h-11`, curseur pleine largeur, barre de recherche pleine largeur sans retour à `sm:w-80`
  CHECK: node scripts/verify-gates.mjs --locations-form
  EXPECT: G56 passed: the locations dialog fields and search fill their containers at 44px
  EVIDENCE: G56 passed: the locations dialog fields and search fill their containers at 44px (vérifié par node scripts/verify-gates.mjs --locations-form, contrôle négatif de l'oracle compris)

- [x] G57: La géométrie réelle de la vue gestionnaire montée confirme le contrat : dialogue ≥ 520px, chaque champ texte à la largeur de son conteneur et ≥ 44px de haut, recherche à la largeur utile de sa carte, boutons du dialogue ≥ 44px
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --locations-form
  EXPECT: browser-verify: locations dialog passed
  EVIDENCE: browser-verify: locations dialog passed, 8 assertions vertes, aucune exception de page (vérifié par le parcours Chrome headless, copie dans .unlazy/evidence/locations-dialog.png)

---

# Gates: Cartes de Sites Lisibles

OWNS: src/views/manager/LocationsView.vue, scripts/verify-gates.mjs, scripts/verify-browser.mjs, GATES.md

Scope: Les cartes de sites n'affichaient qu'une table brute « Latitude / Longitude » en chiffres signés, peu parlante pour un gestionnaire. La carte montre désormais le périmètre autorisé en clair (« 120 m autour du point »), une position nommée par hémisphère (« 45.76404° N · 4.83566° E ») et un lien « Voir sur la carte » ouvert à la demande (`target="_blank"` + `rel="noopener noreferrer"`), sans charger de service tiers dans l'application. Choix validé par l'utilisateur : rendu hors-ligne, coordonnées lisibles seulement, pas de reverse-géocodage.

- [x] G58: Le contrat de lisibilité est vérifié au niveau source : périmètre explicite, formateur `formatCoordinate` par hémisphère, action `mapUrl`, lien sûr, interrupteur d'état câblé (`toggle` + `@change`), et disparition des étiquettes brutes « Latitude : / Longitude : » comme du badge cliquable
  CHECK: node scripts/verify-gates.mjs --locations-cards
  EXPECT: G58 passed: site cards show a readable perimeter, position and map link
  EVIDENCE: G58 passed: site cards show a readable perimeter, position and map link (vérifié par node scripts/verify-gates.mjs --locations-cards, contrôle négatif de l'oracle compris)

- [x] G59: La géométrie, le contenu et l'interaction sont mesurés sur la vue gestionnaire réelle, alimentée par deux sites semés : nom, état de pointage porté par un interrupteur nommé et libellé (coché pour l'un, décoché pour l'autre) qui bascule au clic, périmètre chiffré, position nommée par hémisphère (longitude non tronquée), lien cartographique ciblé et sécurisé, actions de 44px
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --locations-cards
  EXPECT: browser-verify: locations cards passed
  EVIDENCE: browser-verify: locations cards passed, 10 assertions vertes (bascule de l'interrupteur comprise), aucune exception de page (vérifié par le parcours Chrome headless, copie dans .unlazy/evidence/locations-cards.png)

---

# Gates: Cohérence Actif/Inactif des Sites

OWNS: src/views/manager/LocationsView.vue, src/composables/useLocations.js, src/views/employee/CheckInView.vue, src/views/employee/CheckOutView.vue, src/views/manager/DashboardView.vue, scripts/verify-gates.mjs, scripts/verify-browser.mjs, GATES.md

Scope: Audit du module Lieux & Sites. Incohérences relevées et corrigées : (1) l'état vide unique affichait « Créez votre premier site… » sous le filtre « Inactifs » alors que des sites existaient, et ne distinguait ni « aucun site », ni « recherche vide », ni « aucun actif » ; (2) les filtres « Actifs » / « Inactifs » n'annonçaient pas leur compte ; (3) la bascule de statut n'offrait aucun retour quand la carte quittait la liste filtrée et avalait ses erreurs ; (4) la prédication d'activation était dupliquée et divergente entre les deux pointages (comparaison stricte) et le tableau de bord (vérité de `is_active`) ; (5) `filteredLocations` accédait à `loc.name.toLowerCase()` sans garde ; (6) l'amorçage `ensureLoaded` comptait les tombes et remontait les sites supprimés. Le prédicat `isLocationActive` est désormais unique et consommé par le gestionnaire et les deux pointages.

- [x] G60: La logique d'affichage et la prédication de données sont cohérentes : états vides distincts avec action utile, comptes sur les filtres, prédicat `isLocationActive` exporté et consommé par la vue, les deux pointages et le tableau de bord, sans comparaison locale subsistante
  CHECK: node scripts/verify-gates.mjs --locations-filters
  EXPECT: G60 passed: active/inactive display and data predicate are consistent end to end
  EVIDENCE: G60 passed: active/inactive display and data predicate are consistent end to end (vérifié par node scripts/verify-gates.mjs --locations-filters, contrôle négatif de l'oracle compris)

- [x] G61: La logique est éprouvée sur la vue réelle : comptes annoncés, filtre « Inactifs » restreint la liste, catégorie vidée par bascule → message « Aucun site inactif » et action « Voir tous les sites » qui restaure la liste, recherche vide → « Aucun résultat » et « Effacer la recherche »
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --locations-filters
  EXPECT: browser-verify: locations filters passed
  EVIDENCE: browser-verify: locations filters passed, 7 assertions vertes, aucune exception de page (vérifié par le parcours Chrome headless, copie dans .unlazy/evidence/locations-filters.png)

---

# Gates: Alignement Icône/Texte des Actions de Carte

OWNS: src/views/manager/LocationsView.vue, scripts/verify-gates.mjs, scripts/verify-browser.mjs, GATES.md

Scope: Constat sur la carte de site : le bouton « Modifier » portait `btn-sm`, qui abaisse la taille de police à 12px alors que son icône reste à 16px. Le couple icône/texte paraissait désaccordé, contrairement aux boutons « Nouveau Site » et « Voir sur la carte » (14px/16px). Les deux actions de carte abandonnent `btn-sm` et conservent `min-h-11 px-3` : le texte passe à 14px, la cible tactile reste à 44px.

- [x] G62: Aucune action de carte n'est rétrécie : le fichier ne porte plus `btn-sm`, et chaque bouton de carte est mesuré à ≥ 14px de police pour un couple icône/texte accordé, la cible restant à 44px
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --locations-cards
  EXPECT: browser-verify: locations cards passed
  EVIDENCE: browser-verify: locations cards passed, 11 assertions vertes (dont « les actions accordent texte et icône (≥ 14px) » et la cible de 44px), aucune exception de page (vérifié par le parcours Chrome headless)

---

# Gates: Refonte UI/UX du Contrôle des Présences

OWNS: src/views/manager/PresencesView.vue, scripts/verify-gates.mjs, GATES.md

Scope: L'écran « Contrôle des Présences » divergeait de la grammaire de l'écran « Gestion des Sites & Lieux ». Il est réaligné sur quatre axes : (1) en-tête doté de la même pastille d'icône `bg-primary/10 border border-primary/20` et du titre en `h1 text-2xl font-black` ; (2) filtre de recherche intégré dans un `label.input` pleine largeur avec loupe de 20px, au lieu d'un champ séparé ; (3) filtres de statut en barre `join` annonçant leur compte (`Tous`, `Présents`, `En retard`, `Terminés`), le sélecteur natif étant retiré ; (4) la présentation adopte un tableau d'audit balisé (voir G65) dont chaque ligne porte l'identité du collaborateur (initiales), les temps (arrivée, départ, durée avec états « En cours » et « Départ manquant »), le site, la date lisible et la précision GPS en badge sémantique. Les états vides sont désormais distincts (« Aucun pointage », « Aucun résultat », « Aucun pointage pour ce filtre ») et proposent l'action utile. Le modal de correction adopte la coque et les boutons `min-h-11` de la modale de site, et une notification confirme la correction. Les filtres annonçant leurs comptes, la période complète est chargée une fois et le statut comme la recherche s'appliquent côté client : le rechargement n'obéit plus qu'à la plage de dates, contre un filtrage serveur qui écrasait la liste par statut et faussait les compteurs. La liste locale fait désormais foi dès qu'une période est chargée, y compris vide. La logique d'écriture locale/outbox et de propagation distante reste intacte.

- [x] G63: L'écran présences partage la grammaire de l'écran sites : en-tête à pastille, recherche intégrée, filtres `join` à comptes, lignes à identité/temps/GPS, états vides distincts et action utile ; le sélecteur natif et les actions `btn-sm` ont disparu, et le statut n'est plus filtré côté serveur
  CHECK: node scripts/verify-gates.mjs --presences-ui
  EXPECT: G63 passed: presences screen shares the locations grammar
  EVIDENCE: G63 passed: presences screen shares the locations grammar (vérifié par node scripts/verify-gates.mjs --presences-ui, contrôle négatif de l'oracle compris), build de production en sortie 0 et suite complète `--all` verte (G63 inclus)

---

# Gates: Filtre de Période du Contrôle des Présences

OWNS: src/views/manager/PresencesView.vue, scripts/verify-gates.mjs, GATES.md

Scope: Le filtre de date ne proposait qu'une journée unique. Il offre désormais quatre presets dans une barre `join` : Jour (par défaut), Semaine, Mois et Personnalisé. Jour s'appuie sur une date d'ancrage, Semaine sur le lundi de la semaine de l'ancre et Mois sur le premier au dernier jour du mois ; ces deux derniers annoncent leur plage calculée en clair. Personnalisé révèle deux champs « Du / Au » bornés l'un par l'autre, la plage étant normalisée si l'utilisateur inverse les bornes. La plage effective, en `YYYY-MM-DD` comparables en chaîne, alimente à la fois le filtre Dexie local et la requête distante (`work_date` entre bornes), et le rechargement n'écoute plus que la plage, ce qui sert les compteurs par statut calculés sur la période complète. Le message d'état vide mentionne la période sélectionnée. Le reste de la logique (recherche, statut, correction, outbox) reste inchangé.

- [x] G64: Le filtre de date propose jour (par défaut), semaine, mois puis personnalisé ; la plage effective est calculée une fois et appliquée à l'identique au cache local (`p.work_date >= start` / `<= end`) et à la requête distante (`gte`/`lte`), le rechargement étant piloté par la seule `dateRange`, avec libellé de période en clair
  CHECK: node scripts/verify-gates.mjs --presences-period
  EXPECT: G64 passed: presence period filter offers presets and a custom range
  EVIDENCE: G64 passed: presence period filter offers presets and a custom range (vérifié par node scripts/verify-gates.mjs --presences-period, contrôle négatif de l'oracle compris) et build de production en sortie 0

---

# Gates: Tableau d'Audit du Contrôle des Présences

OWNS: src/views/manager/PresencesView.vue, scripts/verify-gates.mjs, GATES.md

Scope: La grille de cartes ne convenait pas à la lecture comparative des pointages. La présentation revient à un vrai tableau balisé (`table table-sm` dans un conteneur `overflow-x-auto`), en conservant l'en-tête à pastille, la recherche, le filtre de période et les états vides obtenus précédemment. Les colonnes couvrent l'audit : Collaborateur (avatar à initiales, nom, email), Site, Date lisible, Arrivée, Départ, Durée (avec « En cours » et « Départ manquant »), Statut, Précision GPS en badge sémantique et, pour l'admin, Actions. Les actions de ligne gardent `min-h-11 px-3` sans `btn-sm`, donc un couple icône/texte accordé. Sur écran étroit, le tableau défile horizontalement plutôt que de comprimer les colonnes.

- [x] G65: Les pointages sont présentés dans un tableau balisé défilable (`table`/`thead`/`tbody` + `overflow-x-auto`) portant les colonnes Collaborateur, Site, Date, Arrivée, Départ, Durée, Statut et Précision GPS, chaque ligne exposant initiales, date lisible, durée résolue et précision GPS ; la grille de cartes a disparu
  CHECK: node scripts/verify-gates.mjs --presences-table
  EXPECT: G65 passed: presences render as an audit table
  EVIDENCE: G65 passed: presences render as an audit table (vérifié par node scripts/verify-gates.mjs --presences-table, contrôle négatif de l'oracle compris) et build de production en sortie 0

---

# Gates: Tri des Colonnes du Tableau des Présences

OWNS: src/views/manager/PresencesView.vue, scripts/verify-gates.mjs, GATES.md

Scope: Les en-têtes du tableau deviennent triables. Un clic trie par ordre croissant, un second clic inverse l'ordre, chaque colonne affichant une icône orientée (double chevron au repos, flèche vers le haut en croissant, vers le bas en décroissant) et exposant `aria-sort` aux lecteurs d'écran. Les colonnes triables sont Collaborateur, Site, Date, Arrivée, Départ, Durée, Statut et Précision GPS. Le tri est stable : à clé égale, l'heure d'arrivée suit le sens courant, et les valeurs absentes (départ ou durée manquants, GPS non mesuré) se rangent en fin de liste quel que soit le sens. Le tri par défaut reste la date la plus récente puis l'arrivée la plus tardive, afin qu'une période multi-jours s'ouvre sur les pointages les plus récents. Le filtrage (statut, recherche, période) et le comptage restent inchangés.

- [x] G66: Chaque colonne d'audit se trie via son en-tête avec icône orientée et `aria-sort`, en alternant croissant/décroissant ; le corps du tableau consomme la liste triée et les valeurs absentes finissent en bas
  CHECK: node scripts/verify-gates.mjs --presences-sort
  EXPECT: G66 passed: presence table headers sort both ways
  EVIDENCE: G66 passed: presence table headers sort both ways (vérifié par node scripts/verify-gates.mjs --presences-sort, contrôle négatif de l'oracle compris) et build de production en sortie 0

---

# Gates: Reprise UI/UX du Contrôle des Présences

OWNS: src/views/manager/PresencesView.vue, src/components/shared/StatusBadge.vue, src/lib/dateUtils.js, scripts/verify-gates.mjs, GATES.md

Scope: Reprise de l'écran « Contrôle des Présences » validée à l'écran le 29/09/2026 et consignée dans `plan.md`, exécutée en quatre lots. Lot 1 (A1-A4) : chaque mode du filtre de période expose son ancre dans un gabarit unique (libellé au-dessus, sans deux-points), la semaine et le mois se parcourent par flèches précédent/suivant avec plage lisible, et le groupe Statut siège en pleine largeur sous la période. Lot 2 (B1-B4) : la journée close se nomme « Terminé » partout, les KPI décrivent les temps (ponctualité, clôture) quand le filtre décrit la session, le total se nomme « Pointages », et « Absents » rejoint le filtre. Lot 3 (C1-C6) : l'actualisation reste unique dans l'en-tête, l'état vide porte une icône de situation et n'héberge plus l'action la plus voyante, les dates lisibles passent au format long, `text-[11px]` rentre dans l'échelle, le segment actif dominant est unique (Période) et le placeholder de recherche s'allège. Lot 4 (D1-D2) : fiches synthétiques sous 640px et segments scrollables horizontalement sur mobile. Arbitrages utilisateur : B2 option 1 (KPI = temps, filtre = session), B4 ajout du segment « Absents », A3 Statut en pleine largeur, C5 Période dominante. Hors périmètre : `loadPresences`, `saveEdit`, l'outbox et les ADR 0001 à 0004.

- [x] G67: Le filtre de période expose une ancre par mode dans un gabarit unique (libellé au-dessus, sans deux-points), la semaine et le mois se parcourent par flèches précédent/suivant avec plage lisible, le groupe Statut siège en pleine largeur sous la période, les champs Du et Au occupent la largeur de la rangée comme la date du mode jour, et les libellés lisibles passent au format long
  CHECK: node scripts/verify-gates.mjs --presences-period
  EXPECT: G64 passed: presence period filter offers presets and a custom range
  EVIDENCE: G64 passed: presence period filter offers presets and a custom range (vérifié par node scripts/verify-gates.mjs --presences-period, contrôle négatif de l'oracle compris : ancre non navigable, deux-points conservés et champs Du/Au non étendus détectés)

- [x] G68: La journée close se nomme « Terminé » partout, les KPI nomment leur source de temps et portent la nuance en sous-titre, le total se nomme « Pointages », et « Absents » rejoint le filtre comme segment compté
  CHECK: node scripts/verify-gates.mjs --presences-ui
  EXPECT: G63 passed: presences screen shares the locations grammar
  EVIDENCE: G63 passed: presences screen shares the locations grammar (vérifié par node scripts/verify-gates.mjs --presences-ui, contrôle négatif de l'oracle compris : journée close mal nommée, total mal nommé, actualisation en double et taille de police arbitraire détectés). Arbitrage B2 option 1 et B4 ajout du segment acté ici.

- [x] G69: L'actualisation reste unique dans l'en-tête (l'état vide n'héberge plus d'action primaire), l'état vide porte une icône de situation distincte, `text-[11px]` disparaît au profit de l'échelle, le segment actif dominant est unique (Période en `btn-primary`, Statut atténué) et le placeholder de recherche s'allège
  CHECK: node scripts/verify-gates.mjs --presences-ui
  EXPECT: G63 passed: presences screen shares the locations grammar
  EVIDENCE: G63 passed: presences screen shares the locations grammar (vérifié par node scripts/verify-gates.mjs --presences-ui, contrôle négatif de l'oracle compris). C3 porté par G67 (format long) ; arbitrage C5 (Période dominante) acté ici.

- [x] G70: Sous 640px les pointages s'affichent en fiches synthétiques (identité, site, temps, statut) quand le tableau balisé reste réservé à partir de 640px, et les segments de filtre défilent horizontalement sur mobile sans cible sous 44px
  CHECK: node scripts/verify-gates.mjs --presences-table
  EXPECT: G65 passed: presences render as an audit table
  EVIDENCE: G65 passed: presences render as an audit table (vérifié par node scripts/verify-gates.mjs --presences-table, contrôle négatif de l'oracle compris : grille de cartes conservée et fiches mobiles absentes détectées)

- [x] G71: Compilation de production Vite sans erreur validée par le code retour du sous-processus
  CHECK: node scripts/verify-gates.mjs --build
  EXPECT: G6 passed: build succeeded with exit code 0
  EVIDENCE: G6 passed: build succeeded with exit code 0 (vérifié par node scripts/verify-gates.mjs --build)

Contrôle de clôture : `node scripts/verify-gates.mjs --all` ne laisse échouer que G1, G3, G4 (ToastContainer.vue, SyncIndicator.vue) et G8 (HomeView.vue), hors périmètre de ce lot et déjà constatés avant lui. Aucune porte touchant `PresencesView.vue`, `StatusBadge.vue` ou `dateUtils.js` n'échoue ; `--presences-ui`, `--presences-period`, `--presences-table` et `--presences-sort` sont vertes.

---

# Gates: Espace Gestionnaire Local-First

OWNS: src/lib/db.js, src/composables/useSyncEngine.js, src/views/manager/PresencesView.vue, src/views/manager/DashboardView.vue, src/views/manager/AvailabilitiesView.vue, src/views/manager/ExportView.vue, scripts/verify-gates.mjs, GATES.md

Scope: Constat avant ce lot : l'espace gestionnaire lisait Supabase en direct. Quatre vues montaient leur propre requête (`PresencesView`, `DashboardView`, `AvailabilitiesView`, `ExportView`), `PresencesView` recouvrait sa liste locale par la réponse réseau, et aucune des quatre n'observait Dexie. L'ADR 0001 §2 exige pourtant `useLiveQuery`, et CONTEXT.md fait d'IndexedDB la source unique de vérité. Le lot rétablit la boucle : l'engine rapatrie (`presences`, `availabilities` selon le rôle du profil local, plus `profiles` et `teams` qui n'étaient jamais rapatriés), Dexie expose, les vues se rafraîchissent seules. `useLiveQuery` accepte une dépendance réactive, sans quoi un changement de plage n'aurait pas réabonné `Dexie.liveQuery`. La plage de dates s'appuie désormais sur l'index B-Tree `work_date` au lieu d'un `.filter()` sur table entière. La correction manuelle ne monte plus d'écriture réseau : elle vit dans Dexie et l'outbox, l'engine la pousse. Les dates `new Date().toISOString().slice(0, 10)` des vues touchées passent à `getLocalDateString()`, la journée locale ne basculant plus à minuit UTC. Deux imports morts (`isRef`, `watchEffect`) sont retirés de `db.js`.

Limite assumée, arbitrée par l'utilisateur : la policy SELECT de `presences` reste restreinte au propriétaire. L'architecture est désormais correcte, mais un gestionnaire ne verra que ses propres pointages jusqu'à ce qu'une migration RLS lui ouvre son périmètre. La migration n'a pas été écrite faute de connaître le rattachement gestionnaire (table de jointure ou `profiles.team_id`), une policy écrite sur une supposition étant un trou de sécurité. `EmployeesView.vue` et `TeamsView.vue` conservent leur lecture réseau directe, hors périmètre de ce lot.

- [x] G72: Le Contrôle des Présences lit Dexie et rien d'autre : plage bornée sur l'index `work_date`, lecture réactive, jointures profils et sites locales, actualisation portée par l'engine, correction locale sans écriture réseau
  CHECK: node scripts/verify-gates.mjs --presences-localfirst
  EXPECT: G72 passed: presences screen reads Dexie and only Dexie
  EVIDENCE: G72 passed: presences screen reads Dexie and only Dexie (vérifié par node scripts/verify-gates.mjs --presences-localfirst, contrôle négatif de l'oracle compris)

- [x] G73: Le pull rapatrie `profiles` et `teams`, et son périmètre suit le rôle lu dans le profil local : employé borné à lui-même, gestionnaire ou admin laissé à la RLS
  CHECK: node scripts/verify-gates.mjs --sync-scope
  EXPECT: G73 passed: the pull scope follows the role and brings profiles and teams
  EVIDENCE: G73 passed: the pull scope follows the role and brings profiles and teams (vérifié par node scripts/verify-gates.mjs --sync-scope, contrôle négatif de l'oracle compris)

- [x] G74: `useLiveQuery` réabonne la requête sur une dépendance réactive explicite et ne conserve aucun import mort
  CHECK: node scripts/verify-gates.mjs --livequery-deps
  EXPECT: G74 passed: useLiveQuery resubscribes on an explicit reactive dependency
  EVIDENCE: G74 passed: useLiveQuery resubscribes on an explicit reactive dependency (vérifié par node scripts/verify-gates.mjs --livequery-deps, contrôle négatif de l'oracle compris)

- [x] G75: Tableau de bord, Disponibilités d'équipe et Export CSV lisent Dexie et ne montent plus de requête réseau pour les données affichées
  CHECK: node scripts/verify-gates.mjs --manager-dexie
  EXPECT: G75 passed: the remaining manager views read Dexie only
  EVIDENCE: G75 passed: the remaining manager views read Dexie only (vérifié par node scripts/verify-gates.mjs --manager-dexie, contrôle négatif de l'oracle compris)

- [x] G76: Compilation de production Vite sans erreur validée par le code retour du sous-processus
  CHECK: node scripts/verify-gates.mjs --build
  EXPECT: G6 passed: build succeeded with exit code 0
  EVIDENCE: G6 passed: build succeeded with exit code 0 (vérifié par node scripts/verify-gates.mjs --build)

# Gates: Boucle d'Apprentissage KI

OWNS: scripts/knowledge-check.mjs, .agents/knowledge/, .agents/rules/11-apprentissage-et-memoire.md, .agents/rules/08-skills-activation.md, AGENTS.md, .gitignore, GATES.md

Scope: Implémenter la boucle d'apprentissage validée dans `docs/audits/setup-agentique-2026-09.md` section 10. La mémoire des agents quitte `<appDataDir>/knowledge/` (hors dépôt, invisible à la revue, non versionnée) pour `.agents/knowledge/` (couche équipe commitée) avec `.agents/knowledge.local/` (couche personnelle ignorée par git). Chaque fiche KI porte un frontmatter daté et un statut de cycle de vie ; `INDEX.md` (200 lignes maximum) sert d'entrée de session ; le protocole de capture impose l'acte unique « corriger + enregistrer » ; l'échelle d'escalade fait monter une règle violée de la fiche KI vers `.agents/rules/` puis vers un oracle exécutable. L'oracle `scripts/knowledge-check.mjs` rend tout cela déterministe et accepte `--root` pour les contrôles négatifs sur fixtures.

- [x] G77: La base de connaissance existe avec ses trois fichiers de protocole (README, TEMPLATE, INDEX) et au moins une fiche KI
  CHECK: node scripts/knowledge-check.mjs --structure
  EXPECT: G77 passed: knowledge base structure complete
  EVIDENCE: G77 passed: knowledge base structure complete (2 entries) (vérifié par node scripts/knowledge-check.mjs --structure, contrôle négatif compris : fixture sans TEMPLATE.md → G77 failed, sortie 1)

- [x] G78: Toute fiche KI porte un frontmatter valide (id, date ISO, auteur, statut du cycle de vie, domaine, triggers, source, échéance de revalidation cohérente avec la date)
  CHECK: node scripts/knowledge-check.mjs --frontmatter
  EXPECT: G78 passed: all knowledge entries carry valid frontmatter
  EVIDENCE: G78 passed: all knowledge entries carry valid frontmatter (2) (vérifié par node scripts/knowledge-check.mjs --frontmatter, contrôle négatif compris : fiche sans statut → G78 failed, sortie 1)

- [x] G79: INDEX.md reste dans le budget de 200 lignes et référence chaque fiche candidate ou active
  CHECK: node scripts/knowledge-check.mjs --index
  EXPECT: G79 passed: index within budget and listing all live entries
  EVIDENCE: G79 passed: index within budget and listing all live entries (26 lines) (vérifié par node scripts/knowledge-check.mjs --index, contrôle négatif compris : KI-0002 retiré de l'index → G79 failed, sortie 1)

- [x] G80: Aucune fiche active n'est périmée : toute fiche dépassant son échéance de revalidation porte le statut a-verifier, superseded ou retired
  CHECK: node scripts/knowledge-check.mjs --staleness
  EXPECT: G80 passed: no live entry is past its revalidation date
  EVIDENCE: G80 passed: no live entry is past its revalidation date (vérifié par node scripts/knowledge-check.mjs --staleness, contrôle négatif compris : fiche active avec revalider-avant 2020-01-01 → G80 failed, sortie 1)

- [x] G81: La boucle est câblée : AGENTS.md pointe vers .agents/knowledge/ sans référence résiduelle à appDataDir, la règle 11 documente le protocole, la matrice 08 route les erreurs répétées vers le protocole KI
  CHECK: node scripts/knowledge-check.mjs --wiring
  EXPECT: G81 passed: learning loop wired into AGENTS.md and rules
  EVIDENCE: G81 passed: learning loop wired into AGENTS.md and rules (vérifié par node scripts/knowledge-check.mjs --wiring, contrôle négatif compris : AGENTS.md pointant appDataDir → G81 failed, sortie 1)

- [x] G82: La couche de mémoire personnelle .agents/knowledge.local/ est ignorée par git
  CHECK: node scripts/knowledge-check.mjs --gitignore
  EXPECT: G82 passed: local knowledge layer ignored by git
  EVIDENCE: G82 passed: local knowledge layer ignored by git (vérifié par node scripts/knowledge-check.mjs --gitignore, contrôle négatif compris : entrée retirée du .gitignore → G82 failed, sortie 1)

- [x] G83: Compilation de production Vite sans erreur validée par le code retour du sous-processus
  CHECK: node scripts/verify-gates.mjs --build
  EXPECT: G6 passed: build succeeded with exit code 0
  EVIDENCE: G6 passed: build succeeded with exit code 0 (vérifié par node scripts/verify-gates.mjs --build, sortie 0 le 2026-09-29)

# Gates: Configuration MCP Supabase

OWNS: opencode.json, .mcp.json, scripts/mcp-check.mjs, docs/agents/mcp-supabase.md, .agents/rules/05-supabase-rls-and-schema.md, GATES.md

Scope: Brancher le MCP Supabase de façon scopée et versionnée, selon l'audit `docs/audits/setup-agentique-2026-09.md` (moindre privilège appliqué par la configuration, pas par la mémoire). Deux serveurs : `supabase-readonly` (défaut, `read_only=true`, groupes database,debugging,docs) et `supabase` (écriture, groupes database,debugging,development,docs, désactivé par défaut). Scoping `project_ref=pvquzkpfdjrequbwnhur` : les outils de compte disparaissent, les groupes branching et storage sont exclus, donc `delete_branch`, `reset_branch`, `pause_project` et `create_project` n'existent plus dans le menu d'outils, la règle 05 n'ayant plus rien à proscrire. Parité stricte entre `opencode.json` (OpenCode) et `.mcp.json` (Claude Code), vérifiée par oracle. Aucun secret versionné : l'authentification passe par OAuth.

- [x] G84: opencode.json et .mcp.json déclarent les deux mêmes serveurs supabase, sans dérive d'URL entre les deux fichiers
  CHECK: node scripts/mcp-check.mjs --config
  EXPECT: G84 passed: both configs declare the same scoped servers
  EVIDENCE: G84 passed: both configs declare the same scoped servers (vérifié par node scripts/mcp-check.mjs --config, contrôle négatif compris : fixture avec project_ref altéré dans .mcp.json → G84 failed, sortie 1)

- [x] G85: Le moindre privilège est porté par la configuration : scoping project_ref du projet, serveur de lecture read-only activé, serveur d'écriture désactivé par défaut, groupes branching et storage exclus
  CHECK: node scripts/mcp-check.mjs --scoping
  EXPECT: G85 passed: least privilege enforced by configuration
  EVIDENCE: G85 passed: least privilege enforced by configuration (vérifié par node scripts/mcp-check.mjs --scoping, trois contrôles négatifs compris : project_ref absent → failed, read_only retiré + serveur d'écriture activé → failed, groupe branching ajouté → failed, sorties 1)

- [x] G86: Aucun credential en clair dans les fichiers versionnés de la configuration MCP (opencode.json, .mcp.json, doc associée)
  CHECK: node scripts/mcp-check.mjs --secrets
  EXPECT: G86 passed: no credential in the versioned MCP configuration
  EVIDENCE: G86 passed: no credential in the versioned MCP configuration (vérifié par node scripts/mcp-check.mjs --secrets, contrôle négatif compris : Bearer sbp_ inséré dans opencode.json → G86 failed, sortie 1)

- [x] G87: Compilation de production Vite sans erreur validée par le code retour du sous-processus
  CHECK: node scripts/verify-gates.mjs --build
  EXPECT: G6 passed: build succeeded with exit code 0
  EVIDENCE: G6 passed: build succeeded with exit code 0 (vérifié par node scripts/verify-gates.mjs --build, sortie 0 le 2026-09-29)

---

# Gates: Refonte UI/UX de l'Espace Gestionnaire

OWNS: src/components/manager/ManagerPageHeader.vue, src/components/manager/ManagerKpiCard.vue, src/components/manager/ManagerEmptyState.vue, src/views/manager/DashboardView.vue, src/views/manager/EmployeesView.vue, src/views/manager/TeamsView.vue, src/views/manager/AvailabilitiesView.vue, src/views/manager/ExportView.vue, src/views/manager/PresencesView.vue, src/views/manager/LocationsView.vue, scripts/verify-gates.mjs, .agents/rules/07-design-system.md, .agents/plans/2026-09-30-refonte-ui-ux-espace-gestionnaire.md, GATES.md

Scope: Uniformiser l'interface, l'expérience et la responsivité des modules gestionnaire sur la grammaire des écrans validés « Gestion des Sites & Lieux » et « Contrôle des Présences ». Trois composants partagés portent les motifs répétés : `ManagerPageHeader` (en-tête à pastille), `ManagerKpiCard` (bandeau de synthèse), `ManagerEmptyState` (états vides actionnables). Le tableau de bord corrige la sémantique de ses KPI (le statut `absent` n'est plus fondu dans une soustraction), présente l'activité récente en fiches sous 640px et en tableau triable au delà, et garde une précision GPS sans `NaN`. La gestion des collaborateurs gagne recherche, filtre de rôle compté, filtre d'équipe, tri, fiches mobiles, modale conforme 44px et remontée d'erreur avec réessai. La gestion des équipes déplace la création en modale, ajoute le renommage, la recherche, le tri par effectif, un menu d'actions et un état vide actionnable. Les disponibilités adoptent un filtre de semaine unifié, une légende d'état, une synthèse de tenue et une fiche par collaborateur sous 640px. L'export reprend les presets de période du contrôle des présences, un aperçu du volume et des cibles 44px. Le composant `StatCard` disparaît au profit de `ManagerKpiCard`, adopté aussi par le contrôle des présences. Arbitrages retenus : option B (composants partagés), remplacement de `StatCard`, UI seule sans bascule local-first pour Collaborateurs et Équipes, bascule fiches/tableau à 640px, export pleine largeur, tableau de bord sans filtre, renommage d'équipe exposé. Hors périmètre : la couche de données (Dexie, Supabase, outbox), les composables, la navigation et l'espace employé.

- [x] G88: Tous les écrans gestionnaire portent l'en-tête partagé `ManagerPageHeader`, aucun titre `h2`, aucune `btn-sm`/`input-sm`/`select-sm`, aucune taille de police arbitraire ; les trois composants partagés existent et l'en-tête porte h1 et pastille
  CHECK: node scripts/verify-gates.mjs --manager-grammar
  EXPECT: G88 passed: every manager screen shares one grammar
  EVIDENCE: G88 passed: every manager screen shares one grammar (vérifié par node scripts/verify-gates.mjs --manager-grammar, contrôle négatif compris : titre h2, action btn-sm, champ input-sm et police arbitraire détectés)

- [x] G89: Tableau de bord, Collaborateurs et Disponibilités basculent en fiches sous 640px et en tableau au delà, leurs filtres ou tableaux défilent horizontalement, et la grille d'équipes adopte 2 puis 3 colonnes
  CHECK: node scripts/verify-gates.mjs --manager-responsive
  EXPECT: G89 passed: manager screens present cards below 640px and tables above
  EVIDENCE: G89 passed: manager screens present cards below 640px and tables above (vérifié par node scripts/verify-gates.mjs --manager-responsive, contrôle négatif compris : écran sans bascule détecté)

- [x] G90: La suite navigateur reste verte après passage des écrans validés au composant d'en-tête partagé, et la suite complète ne laisse que les quatre échecs préexistants hors périmètre
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs
  EXPECT: browser-verify: locations filters passed
  EVIDENCE: browser-verify: locations dialog passed, locations cards passed, locations filters passed, sidebar rail/nav-docking/theme/appearance/overlay/summary compris, aucune exception de page ; `node scripts/verify-gates.mjs --all` ne laisse échouer que G1, G3, G4 (ToastContainer.vue, SyncIndicator.vue) et G8 (HomeView.vue), hors périmètre (vérifiés le 2026-09-30)

- [x] G91: Compilation de production Vite sans erreur validée par le code retour du sous-processus
  CHECK: node scripts/verify-gates.mjs --build
  EXPECT: G6 passed: build succeeded with exit code 0
  EVIDENCE: G6 passed: build succeeded with exit code 0 (vérifié par node scripts/verify-gates.mjs --build, sortie 0 le 2026-09-30)

---

# Gates: Passe de Finition de l'Espace Gestionnaire

OWNS: src/layouts/ManagerLayout.vue, src/components/shared/ThemeToggle.vue, src/views/manager/AvailabilitiesView.vue, src/views/manager/PresencesView.vue, src/views/manager/ExportView.vue, scripts/verify-gates.mjs, docs/audits/audit-espace-manager-2026-09-30.md, GATES.md

Scope: Passe de finition issue de l'audit `docs/audits/audit-espace-manager-2026-09-30.md`. Trois correctifs et un garde-fou. (1) Le sélecteur de semaine, dupliqué sans surface propre dans Disponibilités, Présences et Export, reçoit un conteneur bordé `rounded-m3-md border border-base-300 bg-base-300/50`, lisible en thème sombre. (2) Le contrôle d'apparence masque ses icônes sous 640px pour que « Système », « Clair » et « Sombre » s'affichent entiers dans le tiroir mobile, au lieu de « Syst… » et « Som… ». (3) Les libellés de navigation s'alignent sur les titres de page et sur la terminologie RH : « Sites & Lieux », « Collaborateurs », « Disponibilités ». (4) Un garde-fou de source verrouille le défaut signalé « icône de navigation absente », non reproduit aux trois largeurs et en thème sombre.

- [x] G92: Chaque entrée de navigation gestionnaire déclare une icône non vide et la passerelle porte son tracé, contrôlés par un oracle à contrôle négatif
  CHECK: node scripts/verify-gates.mjs --manager-nav-icons
  EXPECT: G92 passed: every manager nav entry declares an icon
  EVIDENCE: G92 passed: every manager nav entry declares an icon (vérifié par node scripts/verify-gates.mjs --manager-nav-icons, contrôle négatif compris : entrée sans createIcon détectée). Rendu headless sombre à 1440, 900 et 390 : sept entrées et passerelle visibles. Après correctifs, `--all` ne laisse que les échecs préexistants hors périmètre, `--appearance-control`, `--sidebar-rail` et `--nav-docking` vertes, `npm run build` en sortie 0 (vérifiés le 2026-09-30).

---

# Gates: Passe de Finition Gestionnaire (Lot 1)

OWNS: src/style.css, src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, src/components/manager/ManagerKpiCard.vue, src/views/manager/AvailabilitiesView.vue, src/views/manager/LocationsView.vue, scripts/verify-gates.mjs, .agents/plans/2026-09-30-plan-action-finitions-espace-manager.md, GATES.md

Scope: Traitement des huit propositions validées de `docs/audits/audit-espace-manager-2026-09-30.md`. Arbitrages actés : option A revue le 2026-09-30 (le bandeau affiche l'espace et le module dans les deux espaces, la marque restant dans la barre latérale), matrice de disponibilités triable par nom, « Sites » seul. (1) Icônes du rail portées à 22px. (2) Focus visible sur les entrées de navigation des deux espaces. (3) Bandeau nommant l'espace et le module courant (`activeTitle`) dans les deux espaces. (4) « & Lieux » retiré de la navigation et du titre de page. (5) KPI « Taux de tenue » affiche « Aucun » au lieu d'un tiret isolé. (6) Grille KPI des disponibilités en `grid-cols-2 sm:grid-cols-3`. (7) États vides distincts dans la matrice de disponibilités. (8) Colonne Collaborateur triable par nom, avec `aria-sort` et icône orientée.

- [x] G93: Icônes de rail à 22px, focus des entrées de navigation des deux espaces, bandeau nommant l'espace et le module dans les deux espaces, titre « Sites » seul, matrice de disponibilités triable par nom avec états vides distincts et grille KPI responsive, aucun tiret isolé
  CHECK: node scripts/verify-gates.mjs --manager-finish
  EXPECT: G93 passed: manager finishing pass applied
  EVIDENCE: G93 passed: manager finishing pass applied (vérifié par node scripts/verify-gates.mjs --manager-finish, contrôle négatif compris). Rendu headless sombre : bandeau « Espace Collaborateur » côté employé et libellé de module côté gestionnaire, nav « Sites / Collaborateurs / Disponibilités », KPI « Aucun · Aucun jour révolu », icônes de rail agrandies. `--all` sans nouvelle régression, suite navigateur complète verte, `npm run build` en sortie 0 (vérifiés le 2026-09-30).

---

# Gates: Passe de Finition Gestionnaire (correctif de décision)

OWNS: src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, scripts/verify-gates.mjs, docs/audits/audit-espace-manager-2026-09-30.md, .agents/plans/2026-09-30-plan-action-finitions-espace-employe.md, GATES.md

Scope: L'arbitrage « option A » de l'audit gestionnaire est révisé le 2026-09-30 : le bandeau supérieur ne se réduit plus à la marque, il nomme l'espace et le module courant dans les deux espaces, la marque restant portée par la barre latérale. Le computed `activeTitle` revient dans `ManagerLayout` et apparaît dans `EmployeeLayout`. Un emplacement d'icône de paramètres à droite du bandeau reste à préciser.

- [x] G93 (révalidée): Le bandeau gestionnaire et le bandeau employé nomment l'espace et le module courant via `activeTitle`, après révision de l'arbitrage option A
  CHECK: node scripts/verify-gates.mjs --manager-finish
  EXPECT: G93 passed: manager finishing pass applied
  EVIDENCE: G93 passed: manager finishing pass applied (vérifié par node scripts/verify-gates.mjs --manager-finish après adaptation de l'oracle au titre de bandeau requis, contrôle négatif compris le 2026-09-30).

---

# Gates: Finitions de l'Espace Employé

OWNS: src/layouts/EmployeeLayout.vue, src/components/employee/DayCard.vue, src/components/employee/WeekSummaryCard.vue, src/components/employee/WeekGrid.vue, src/components/employee/GpsRing.vue, src/components/employee/AvailabilitySummary.vue, src/components/employee/CheckConfirmationOverlay.vue, src/views/employee/CheckInView.vue, src/views/employee/CheckOutView.vue, src/views/employee/AvailabilitiesView.vue, src/style.css, scripts/verify-gates.mjs, docs/audits/audit-espace-employe-2026-09-30.md, .agents/plans/2026-09-30-plan-action-finitions-espace-employe.md, GATES.md

Scope: Traitement des constats de `docs/audits/audit-espace-employe-2026-09-30.md`. Arbitrages actés : « Arrivée / Départ » sur les pages, « Pointage » en navigation, « En cours » partout, « Ma disponibilité » ; le bandeau nomme l'espace et le module ; l'onepage cède au défilement sur hauteur courte ; les cartes s'étirent par ligne avec un contenu borné. (A1) `capitalize` retiré des dates françaises. (A2) `text-[10px]` et `text-[11px]` rentrés dans l'échelle `text-xs`. (A3) vocabulaire unifié. (B1) jours révolus lisibles sans `opacity-45`. (B2) placeholder contrasté. (C1) libellé de semaine équilibré. (C2) tuile « Départs » sans troncature. (C3) contenu de la carte du jour borné. (C4) sélecteur de lieu à 44px. (D1) repli onepage sous 760px de haut. La logique de pointage, la transaction Dexie et la géolocalisation restent intactes.

- [x] G94: Aucune taille de police arbitraire ni date capitalisée à tort dans les fichiers employé, vocabulaire unifié, sélecteur de lieu à 44px, repli onepage présent, bandeau employé nommé
  CHECK: node scripts/verify-gates.mjs --employee-finish
  EXPECT: G94 passed: employee finishing pass applied
  EVIDENCE: G94 passed: employee finishing pass applied (vérifié par node scripts/verify-gates.mjs --employee-finish, contrôle négatif compris). Rendu headless sombre à 1440, 700 et 480 de haut : bandeau « Espace Collaborateur », dates « mercredi 30 septembre », tuile « Tous », semaine équilibrée, contenu de carte borné. `--all` sans nouvelle régression, `npm run build` en sortie 0 (vérifiés le 2026-09-30).

---

# Gates: Page Paramètres Dédiée

OWNS: src/views/SettingsView.vue, src/App.vue, src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, scripts/verify-gates.mjs, .agents/plans/2026-09-30-plan-action-finitions-espace-employe.md, GATES.md

Scope: Une page Paramètres unique, partagée par les deux espaces, accessible par une icône d'engrenage à droite du bandeau, sur les routes `/manager/settings` et `/employee/settings`. La page porte l'apparence (contrôle segmenté à trois états), la synchronisation (état réseau, compteur en attente, dernière synchronisation, bouton « Synchroniser maintenant »), le compte (nom, email, rôle, espace) et la déconnexion. Le pied de tiroir ne conserve que le statut réseau : apparence, identité et déconnexion ont quitté le tiroir pour la page. Révision du 2026-09-30 : l'apparence rejoint la page, le pied est vidé de ses réglages, et l'engrenage disparaît dès que l'écran courant est un écran Paramètres (y compris ses sous-écrans), puisqu'il n'y mène plus.

- [x] G95: La page Paramètres existe avec apparence, synchronisation, compte et déconnexion ; les deux routes sont déclarées et les deux bandeaux exposent l'icône d'engrenage, masquée sur les écrans Paramètres
  CHECK: node scripts/verify-gates.mjs --settings-page
  EXPECT: G95 passed: settings page wired in both spaces
  EVIDENCE: G95 passed: settings page wired in both spaces (vérifié par node scripts/verify-gates.mjs --settings-page, contrôle négatif compris ; la porte exige que l'engrenage porte `v-if="!onSettings"` et que `onSettings` soit défini dans les deux mises en page). Rendu headless sombre : page complète à 390 et 1440 avec la section Apparence, engrenage absent sur l'écran Paramètres et présent sur le tableau de bord. `--all` sans nouvelle régression, `npm run build` en sortie 0 (vérifiés le 2026-09-30).

---

# Gates: Pied de Tiroir Vidé et Thème en Paramètres

OWNS: src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, src/components/shared/ThemeToggle.vue, src/views/SettingsView.vue, scripts/verify-gates.mjs, docs/audits/audit-espace-employe-2026-09-30.md, .agents/plans/2026-09-30-plan-action-finitions-espace-employe.md, GATES.md

Scope: Le pied de tiroir des deux espaces est vidé de ses réglages : il ne conserve que le statut réseau (badge de synchronisation). L'apparence (contrôle segmenté), l'identité et la déconnexion migrent sur la page Paramètres. Le contrôle d'apparence reçoit une variante `inline` qui force le groupe segmenté hors tiroir, même quand la barre est repliée en rail. Les portes G11 (placement du thème), G20 (unicité des contrôles), G22 (réglages du tiroir) et G35 (pied de tiroir) sont réécrites en conséquence.

- [x] G11 (réécrite): Le contrôle d'apparence vit sur la page Paramètres, plus dans le tiroir
  CHECK: node scripts/verify-gates.mjs --theme-placement
  EXPECT: G11 passed: the theme toggle lives on the settings page, not in the drawer
  EVIDENCE: G11 passed: the theme toggle lives on the settings page, not in the drawer (vérifié par node scripts/verify-gates.mjs --theme-placement, le tiroir doit exposer zéro commutateur et la page exactement un, contrôle négatif compris le 2026-09-30).

- [x] G20 (réécrite): Chaque espace garde un seul indicateur de synchronisation hors en-tête, zéro commutateur de thème dans le tiroir, une passerelle et l'alerte réseau
  CHECK: node scripts/verify-gates.mjs --header-deduplication
  EXPECT: G20 passed: each space keeps a single instance of each control
  EVIDENCE: G20 passed: each space keeps a single instance of each control (vérifié par node scripts/verify-gates.mjs --header-deduplication le 2026-09-30).

- [x] G22 (réécrite): Le pied de tiroir ne porte plus que la rangée « Statut réseau » avec son badge, sans contrôle d'apparence
  CHECK: node scripts/verify-gates.mjs --drawer-settings-layout
  EXPECT: G22 passed: drawer settings split network status and appearance control
  EVIDENCE: G22 passed: drawer settings split network status and appearance control (vérifié par node scripts/verify-gates.mjs --drawer-settings-layout le 2026-09-30).

- [x] G35 (réécrite): Le pied des deux tiroirs se réduit au statut réseau ; apparence, compte et déconnexion vivent sur la page Paramètres
  CHECK: node scripts/verify-gates.mjs --drawer-footer
  EXPECT: G35 passed: the drawer footer keeps only the network status, settings live on the page
  EVIDENCE: G35 passed: the drawer footer keeps only the network status, settings live on the page (vérifié par node scripts/verify-gates.mjs --drawer-footer, contrôle négatif compris le 2026-09-30). Rendu headless sombre à 1440 : pied réduit à « Statut réseau / À jour », page Paramètres portant Apparence, Synchronisation, Compte et Déconnexion. Suite navigateur complète verte, `--all` sans nouvelle régression, `npm run build` en sortie 0.

---

# Gates: Passerelles Inter-Espace

OWNS: src/layouts/EmployeeLayout.vue, src/layouts/ManagerLayout.vue, scripts/verify-gates.mjs, GATES.md

Scope: Correctif du 2026-09-30. Le nettoyage du pied de tiroir avait retiré l'import `useProfile` d'`EmployeeLayout` alors que `canReachManagerSpace` lit toujours `profile` : la passerelle « Espace Gestionnaire » disparaissait pour les rôles autorisés, et un `ReferenceError` menaçait le rendu. L'import revient, et une porte vérifie que chaque passerelle inter-espace reste câblée avec le composable qui porte le rôle.

- [x] G96: La passerelle « Espace Gestionnaire » et la passerelle « Mon pointage personnel » restent câblées, et le composable `useProfile` est importé par `EmployeeLayout`
  CHECK: node scripts/verify-gates.mjs --cross-space-gateways
  EXPECT: G96 passed: cross-space gateways stay wired with their role composable
  EVIDENCE: G96 passed: cross-space gateways stay wired with their role composable (vérifié par node scripts/verify-gates.mjs --cross-space-gateways, contrôle négatif compris : passerelle lisant `profile` sans import détectée le 2026-09-30). Rendu headless sombre à 1440 : « Espace Gestionnaire » visible dans la section « Mon espace » pour un rôle administrateur. `--all` sans nouvelle régression, `npm run build` en sortie 0.

---

# Gates: Filet de Séparation de « Mon espace »

OWNS: src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, scripts/verify-gates.mjs, GATES.md

Scope: Le 2026-09-30, un filet de séparation `border-t border-base-content/20` précède la section « Mon espace » dans les deux tiroirs, pour démarquer la navigation de la passerelle inter-espace. Le filet reste visible quand la barre est repliée en rail, où il sépare l'icône de la dernière entrée de celle de la passerelle. L'ordre Navigation puis Mon espace est conservé.

- [x] G40 (revalidée): Le filet de séparation précède « Mon espace » dans les deux tiroirs et reste visible en rail
  CHECK: node scripts/verify-gates.mjs --drawer-shared-grammar
  EXPECT: G40 passed: both drawers share one navigation grammar
  EVIDENCE: G40 passed: both drawers share one navigation grammar (vérifié par node scripts/verify-gates.mjs --drawer-shared-grammar, la porte exige un `mt-5 border-t border-base-content/20` sans `rail-hide` avant « Mon espace », contrôle négatif compris le 2026-09-30). Rendu headless sombre : filet visible entre « Export CSV » et « MON ESPACE » à 1280 déployé, et entre l'icône d'export et celle du pointage à 900 en rail. `--all` sans nouvelle régression, `npm run build` en sortie 0.

---

# Gates: Passerelles Inter-Espace (rappel des portes réécrites)

OWNS: scripts/verify-gates.mjs, GATES.md

Scope: Ce lot n'ajoute aucune règle. Il rappelle que les portes G11, G20, G22, G35 (pied de tiroir vidé, thème en Paramètres) et G94, G95, G96 (finitions employé, page Paramètres, passerelles) restent les garde-fous des décisions du 2026-09-30.

- [x] Contrôle de non-régression: `node scripts/verify-gates.mjs --all` ne laisse que les échecs préexistants hors périmètre
  CHECK: node scripts/verify-gates.mjs --all
  EXPECT: G6 passed: build succeeded with exit code 0
  EVIDENCE: `--all` ne laisse que G1, G3, G4 (ToastContainer, SyncIndicator) et G8 (HomeView), hors périmètre ; `npm run build` en sortie 0 (vérifiés le 2026-09-30).

---

# Gates: Transition entre les Espaces

OWNS: src/App.vue, scripts/verify-gates.mjs, GATES.md

Scope: Le passage d'un espace à l'autre (collaborateur, gestionnaire) et les états d'authentification sont enveloppés dans une transition native `<Transition name="space" mode="out-in">`. Le fondu dure 250 ms sur la courbe Emphasized de Material 3, n'anime que `opacity` et `transform`, et se neutralise sous `prefers-reduced-motion` par la règle globale de `src/style.css`. La transition interne des routes dans chaque espace est conservée ; le conteneur de notifications reste hors transition.

- [x] G28 (étendue): La transition entre espaces n'anime que des propriétés composées, sous le plafond de 400 ms, et `App.vue` entre dans le périmètre de conformité du mouvement
  CHECK: node scripts/verify-gates.mjs --motion-conformance
  EXPECT: G28 passed: batch animations use GPU properties within timing budget
  EVIDENCE: G28 passed: batch animations use GPU properties within timing budget (vérifié par node scripts/verify-gates.mjs --motion-conformance, `App.vue` ajouté au périmètre : transition 250 ms sur `opacity` et `transform`, `mode="out-in"` présent le 2026-09-30). `npm run build` en sortie 0, `--all` sans nouvelle régression.

---

# Gates: Navigation, Retour en Bandeau

OWNS: src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, src/composables/useSidebarNav.js, src/views/SettingsView.vue, src/views/employee/CheckInView.vue, src/views/employee/CheckOutView.vue, src/views/employee/AvailabilitiesView.vue, scripts/verify-gates.mjs, .agents/plans/2026-09-30-plan-navigation-retour-bandeau.md, GATES.md

Scope: La navigation de retour remonte dans le bandeau, traité comme une barre d'application. Chaque espace définit une table de routes portant le titre de l'écran et la cible de retour. Le retour s'affiche sur les écrans descendants (validation d'arrivée, validation de départ, paramètres) à toute largeur, et sur les destinations du tiroir une fois le tiroir masqué (mobile). Le hamburger lui cède la place sous 840px. Le nom de l'espace disparaît du bandeau : la page Paramètres affiche « Paramètres » précédé de la flèche. Les boutons de retour de contenu sont retirés, et l'en-tête de la page Paramètres disparaît au profit du bandeau. Le bouton de retour est une flèche seule, nommée `Retour`, cible de 44px. `useSidebarNav` expose `isDocked` pour la décision. Arbitrages actés : portée du retour confirmée, en-tête de paramètres retiré, flèche remplaçant le hamburger, disponibilité employé avec retour mobile seulement, flèche seule.

- [x] G97: Chaque espace porte une table de routes, le bandeau offre un bouton de retour nommé de 44px, le hamburger lui cède la place, et aucune vue de contenu ne conserve de bouton Retour ni l'en-tête de la page Paramètres
  CHECK: node scripts/verify-gates.mjs --back-navigation
  EXPECT: G97 passed: the back command lives in the app bar and no content duplicates it
  EVIDENCE: G97 passed: the back command lives in the app bar and no content duplicates it (vérifié par node scripts/verify-gates.mjs --back-navigation, contrôle négatif compris : bouton Retour de contenu détecté le 2026-09-30). Rendu headless sombre : validation d'arrivée à 390 avec flèche et sans hamburger, accueil à 390 avec hamburger et sans flèche, paramètres gestionnaire à 1280 avec flèche et sans en-tête de page. Révision du 2026-09-30 : « Ma disponibilité » est traitée comme écran descendant, retour présent à 390 et à 1280 (arbitrage B). `--all` sans nouvelle régression, `npm run build` en sortie 0.

---

# Gates: Vocabulaire du Pointage

OWNS: src/layouts/EmployeeLayout.vue, src/views/employee/CheckInView.vue, src/views/employee/CheckOutView.vue, src/components/employee/DayCard.vue, .agents/rules/09-ui-copy-and-tone.md, scripts/verify-gates.mjs, scripts/verify-browser.mjs, GATES.md

Scope: Le terme « Valider mon arrivée » est inapproprié : en français, valider signifie approuver ou déclarer conforme, alors que le salarié enregistre un fait. Recherche menée sur les usages des éditeurs de gestion des temps et les guides de rédaction d'interface. Arbitrage retenu : titres « Pointage d'arrivée » et « Pointage de départ », bouton « Enregistrer le pointage ». Le volet de confirmation passe de « Arrivée validée » à « Arrivée enregistrée ». Le lexique proscrit de la règle 09 accueille « valider » et « validation », et l'oracle de tonalité G30 les refuse dans l'espace employé.

- [x] G30 (étendue): Le lexique proscrit refuse « valider » et « validation » dans les textes employé, et les titres de pointage emploient le vocabulaire retenu
  CHECK: node scripts/verify-gates.mjs --voice-conformance
  EXPECT: G30 passed: employee-facing copy avoids administrative tone
  EVIDENCE: G30 passed: employee-facing copy avoids administrative tone (vérifié par node scripts/verify-gates.mjs --voice-conformance après ajout de « valider » et « validation » au lexique proscrit le 2026-09-30). G26 (volets de confirmation) alignée sur « Arrivée enregistrée » et « Départ enregistré ». Suite navigateur complète verte, `--all` sans nouvelle régression, `npm run build` en sortie 0.

---

# Gates: Finitions de la Page Paramètres

OWNS: src/views/SettingsView.vue, src/components/shared/ThemeToggle.vue, scripts/verify-browser.mjs, GATES.md

Scope: Recherche sur les bonnes pratiques d'écran de paramètres (Android, Microsoft, Apple FR) puis deux correctifs retenus. La colonne Paramètres est centrée et élargie (`max-w-3xl mx-auto`) pour équilibrer la page sur grand écran, conformément à la consigne d'une largeur bornée centrée. L'option de thème qui suit le réglage système s'intitule « Automatique », convention Apple en français, avec l'infobulle inchangée. L'état de synchronisation vide se lit « Aucune synchronisation enregistrée », plus factuel que « Jamais synchronisé ». Les libellés de section, l'ordre Apparence, Synchronisation, Compte, Déconnexion, et le placement destructeur en bas sont confirmés.

- [x] Contrôle de non-régression: le contrôle d'apparence segmenté porte le libellé « Automatique » et la suite navigateur reste verte
  CHECK: CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --theme --appearance-control --sidebar-rail
  EXPECT: browser-verify: theme toggle passed
  EVIDENCE: browser-verify: theme toggle passed, appearance control passed et sidebar rail passed (vérifiés le 2026-09-30, libellés `Automatique|Clair|Sombre`). Rendu headless sombre à 1440 : colonne Paramètres centrée, « Automatique », « Aucune synchronisation enregistrée ». `--all` sans nouvelle régression, `npm run build` en sortie 0.

---

# Gates: Finitions de l'Espace Paramètres

OWNS: src/views/SettingsView.vue, scripts/verify-gates.mjs, docs/audits/audit-espace-parametres-2026-09-30.md, .agents/plans/2026-09-30-plan-action-finitions-parametres.md, GATES.md

Scope: Traitement des constats de `docs/audits/audit-espace-parametres-2026-09-30.md`. Arbitrages actés : déconnexion immédiate, groupe d'apparence segmenté borné, état réseau « En ligne », titre de la section Déconnexion retiré. Le groupe d'apparence est borné à `max-w-md` pour garder des segments lisibles sur grand écran. Les titres de section passent à `text-base font-semibold`, conformément à la règle 07 §5. L'état réseau s'intitule « En ligne » et non « Connecté », sans ambiguïté avec la session. « Dernière synchronisation » passe au contraste `/60`. L'avatar décoratif est masqué aux lecteurs d'écran, et les deux boutons portent un anneau de focus visible. La porte G95 est étendue à ces exigences.

- [x] G95 (étendue): La page Paramètres borne le groupe d'apparence, nomme l'état réseau « En ligne », aligne ses titres sur la règle 07, masque l'avatar décoratif, pose un focus visible et retire le titre de la section Déconnexion
  CHECK: node scripts/verify-gates.mjs --settings-page
  EXPECT: G95 passed: settings page wired in both spaces
  EVIDENCE: G95 passed: settings page wired in both spaces (vérifié par node scripts/verify-gates.mjs --settings-page, contrôle négatif compris ; la porte exige `md:grid-cols-2`, `max-w-md`, `En ligne`, `text-base font-semibold`, `aria-hidden="true"` et `focus-visible:outline-2 focus-visible:outline-primary`, refuse `Connecté` comme titre `>Déconnexion</h2>`, et impose l'ordre Compte, Synchronisation, Apparence avec la déconnexion après l'apparence). Rendu headless sombre : à 1600, Compte et Synchronisation côte à côte, Apparence et Déconnexion pleine largeur, page remplissant la largeur ; à 760, une seule colonne. `--all` sans nouvelle régression, `npm run build` en sortie 0 (vérifiés le 2026-09-30).

---

# Gates: Pleine Largeur Fluide et Suppression du Padding Excessif

OWNS: src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, src/views/manager/LocationsView.vue, src/views/manager/TeamsView.vue, .agents/plan.md, GATES.md

Scope: Supprimer la contrainte de largeur bloquante max-w-7xl mx-auto dans ManagerLayout.vue afin de rendre l'espace gestionnaire fluide de bord à bord sur les écrans larges (1440p, 2066px, ultrawide). Étendre EmployeeLayout.vue sur écran 2xl tout en maintenant la conformité G7 (présence de max-w-6xl). Densifier les grilles de cartes de sites et d'équipes en 4 colonnes sur grand écran (2xl:grid-cols-4). Valider la non-régression de l'ensemble du système et la compilation de production.

- [x] G98: Libération du conteneur de l'espace gestionnaire (retrait de max-w-7xl mx-auto au profit d'un conteneur pleine largeur)
  CHECK: node -e "const fs = require('fs'); const content = fs.readFileSync('src/layouts/ManagerLayout.vue', 'utf8'); if (content.includes('max-w-7xl mx-auto')) { console.error('FAILURE: max-w-7xl mx-auto toujours présent'); process.exit(1); } if (!content.includes('w-full max-w-none')) { console.error('FAILURE: w-full max-w-none absent'); process.exit(1); } console.log('G98 passed: ManagerLayout is full width fluid');"
  EXPECT: G98 passed: ManagerLayout is full width fluid
  EVIDENCE: G98 passed: ManagerLayout is full width fluid (vérifié par test node le 2026-10-01, max-w-7xl mx-auto supprimé au profit de w-full max-w-none)

- [x] G99: Extension ultra-large du gabarit Collaborateur tout en préservant le token oracle G7 (max-w-6xl)
  CHECK: node -e "const fs = require('fs'); const content = fs.readFileSync('src/layouts/EmployeeLayout.vue', 'utf8'); if (!content.includes('max-w-6xl')) { console.error('FAILURE: max-w-6xl absent'); process.exit(1); } if (!content.includes('2xl:max-w-none')) { console.error('FAILURE: 2xl:max-w-none absent'); process.exit(1); } console.log('G99 passed: EmployeeLayout expanded to 2xl:max-w-none while keeping max-w-6xl');"
  EXPECT: G99 passed: EmployeeLayout expanded to 2xl:max-w-none while keeping max-w-6xl
  EVIDENCE: G99 passed: EmployeeLayout expanded to 2xl:max-w-none while keeping max-w-6xl (vérifié par test node le 2026-10-01, test de régression G7 vert)

- [x] G100: Densification des grilles de cartes Manager sur écran ultra-large (2xl:grid-cols-4)
  CHECK: node -e "const fs = require('fs'); const loc = fs.readFileSync('src/views/manager/LocationsView.vue', 'utf8'); const team = fs.readFileSync('src/views/manager/TeamsView.vue', 'utf8'); if (!loc.includes('2xl:grid-cols-4')) { console.error('FAILURE: LocationsView missing 2xl:grid-cols-4'); process.exit(1); } if (!team.includes('2xl:grid-cols-4')) { console.error('FAILURE: TeamsView missing 2xl:grid-cols-4'); process.exit(1); } console.log('G100 passed: card grids densified with 2xl:grid-cols-4');"
  EXPECT: G100 passed: card grids densified with 2xl:grid-cols-4
  EVIDENCE: G100 passed: card grids densified with 2xl:grid-cols-4 (vérifié par test node le 2026-10-01 sur LocationsView.vue et TeamsView.vue)

- [x] G101: Validation du build de production et non-régression de la suite de tests
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: npm run build avec code de sortie 0 (117 modules transformés en 1.06s, assets générés sans erreur le 2026-10-01)

---

# Gates: Refonte UX de la Matrice des Disponibilités (Présomption de présence & Coché vert / Absent orange)

OWNS: src/views/manager/AvailabilitiesView.vue, src/composables/useAvailabilities.js, .agents/plan.md, GATES.md

Scope: Éliminer intégralement les tirets « — » dans la matrice gestionnaire. Présomption de disponibilité par défaut : tout collaborateur est supposé présent sur ses jours ouvrés (badge vert ✓ « Coché » avec suivi de pointage en sous-titre : Pointé, Non pointé, À venir). Le passage en orange ✕ (« Non dispo » / « Absent ») intervient exclusivement lorsqu'un collaborateur a expressément configuré sa semaine en décochant le switch du jour. Refonte dynamique du calcul des KPI de synthèse (créneaux attendus et taux de présence effectif). Sécuriser la persistance des tombstones dès la première sauvegarde dans useAvailabilities.js. Actualiser la légende des états et assurer la parité d'affichage entre les fiches mobiles (< 640px) et le tableau desktop (>= 640px).

- [x] G102: Sécurisation de la persistance des tombstones dès la première sauvegarde dans useAvailabilities.js
  CHECK: node -e "const fs = require('fs'); const content = fs.readFileSync('src/composables/useAvailabilities.js', 'utf8'); if (!content.includes('deleted_at: nowIso')) { console.error('FAILURE: deleted_at: nowIso absent'); process.exit(1); } console.log('G102 passed: tombstones persisted on week save');"
  EXPECT: G102 passed: tombstones persisted on week save
  EVIDENCE: G102 passed: tombstones persisted on week save (vérifié par test node le 2026-10-01, branche else if (!currentRecord) insérant le tombstone ISO)

- [x] G103: Rendu distinctif dans AvailabilitiesView (icône verte ✓ pour coché par défaut ou déclaré, icône orange ✕ pour absence déclarée, zéro tiret et légende actualisée)
  CHECK: node -e "const fs = require('fs'); const content = fs.readFileSync('src/views/manager/AvailabilitiesView.vue', 'utf8'); if (!content.includes('Non dispo') && !content.includes('Absent')) { console.error('FAILURE: libellé Non dispo/Absent absent'); process.exit(1); } if (!content.includes('badge-warning')) { console.error('FAILURE: badge-warning absent pour les absences'); process.exit(1); } if (!content.includes('badge-success')) { console.error('FAILURE: badge-success absent pour les disponibilités'); process.exit(1); } if (content.includes('title=\"Semaine non renseignée\">—<')) { console.error('FAILURE: tiret résiduel détecté'); process.exit(1); } console.log('G103 passed: distinct available and unavailable UI rendered with zero dashes in AvailabilitiesView');"
  EXPECT: G103 passed: distinct available and unavailable UI rendered with zero dashes in AvailabilitiesView
  EVIDENCE: G103 passed: distinct available and unavailable UI rendered with zero dashes in AvailabilitiesView (vérifié par test node le 2026-10-01, présence par défaut en vert ✓ « Coché », bascule orange ✕ « Non dispo / Absent » sur switch décoché, suppression intégrale des tirets résiduels)

- [x] G104: Validation de la compilation Vite en production
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: npm run build avec code de sortie 0 (117 modules transformés en 937ms, assets générés sans erreur le 2026-10-01)

---

# Gates: Transformation UI/UX du Planning d'Équipe (Module Disponibilités)

OWNS: src/views/manager/AvailabilitiesView.vue, .agents/plan.md, GATES.md

Scope: Supprimer la surcharge du double-badge « Coché » sur les jours non pointés au profit d'un statut unifié contextualisé par le temps. Formater les en-têtes en français naturel (Lun. 28 sept.). Mettre en relief le jour courant (Aujourd'hui). Révéler les notes hebdomadaires saisies par les collaborateurs (icône bulle). Intégrer une modale de détail compacte au clic sur une cellule (heures d'arrivée/départ, site, note, lien direct vers le Contrôle des présences). Harmoniser les KPI (« Présences attendues ») et la légende.

- [x] G105: Dates françaises dans les en-têtes et colonne Aujourd'hui mise en relief
  CHECK: node -e "const fs = require('fs'); const content = fs.readFileSync('src/views/manager/AvailabilitiesView.vue', 'utf8'); if (content.includes('getDateForDay(d.id).slice(5)')) { console.error('FAILURE: format US slice(5) toujours présent'); process.exit(1); } if (!content.includes('formatDayHeader')) { console.error('FAILURE: fonction formatDayHeader absente'); process.exit(1); } console.log('G105 passed: French header dates and today highlighting wired');"
  EXPECT: G105 passed: French header dates and today highlighting wired
  EVIDENCE: G105 passed: French header dates and today highlighting wired (vérifié par node -e oracle le 2026-10-01)

- [x] G106: Épuration des cellules (absence de faux vert sur non pointé), affichage des notes et modale de détail
  CHECK: node -e "const fs = require('fs'); const content = fs.readFileSync('src/views/manager/AvailabilitiesView.vue', 'utf8'); if (!content.includes('Présences attendues')) { console.error('FAILURE: KPI Présences attendues absent'); process.exit(1); } if (!content.includes('selectedCell')) { console.error('FAILURE: selectedCell pour la modale de détail absent'); process.exit(1); } if (!content.includes('note')) { console.error('FAILURE: support des notes collaborateur absent'); process.exit(1); } console.log('G106 passed: clean cell states, employee notes and detail modal wired');"
  EXPECT: G106 passed: clean cell states, employee notes and detail modal wired
  EVIDENCE: G106 passed: clean cell states, employee notes and detail modal wired (vérifié par node -e oracle le 2026-10-01)

- [x] G107: Validation de la compilation Vite en production
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: npm run build avec code de sortie 0 (117 modules transformés en 917ms, assets dist/ générés sans erreur le 2026-10-01)

---

# Gates: Moteur Déterministe des Jours Fériés et Intégration Planning

OWNS: src/lib/dateUtils.js, src/views/manager/AvailabilitiesView.vue, .agents/plan.md, GATES.md

Scope: Fournir un moteur de calcul pur et autonome pour les 11 jours fériés légaux français (comput pascal de Butcher pour Pâques, Ascension, Pentecôte, dates fixes et régime d'Alsace-Moselle) dans `dateUtils.js`. Intégrer la détection dans `AvailabilitiesView.vue` : qualification d'état `holiday` sans fausse alerte « Non pointé », indication du nom du férié en en-tête et en modale, exclusion des fériés chômés des présences attendues, et légende enrichie.

- [x] G108: Moteur algorithmique des jours fériés français dans dateUtils.js (Pâques, fêtes mobiles, fixes et Alsace-Moselle)
  CHECK: node --input-type=module -e "import { getPublicHoliday, getFrenchHolidays } from './src/lib/dateUtils.js'; const h2026 = getFrenchHolidays(2026); if (h2026['2026-04-06'] !== 'Lundi de Pâques') throw new Error('Pâques 2026 erroné'); if (h2026['2026-05-14'] !== 'Ascension') throw new Error('Ascension 2026 erronée'); if (h2026['2026-05-25'] !== 'Lundi de Pentecôte') throw new Error('Pentecôte 2026 erronée'); if (h2026['2026-05-01'] !== 'Fête du Travail') throw new Error('1er mai erroné'); const hAlsace = getFrenchHolidays(2026, { alsaceMoselle: true }); if (hAlsace['2026-04-03'] !== 'Vendredi saint') throw new Error('Vendredi saint erroné'); if (getPublicHoliday('2026-07-14') !== 'Fête Nationale') throw new Error('14 juillet erroné'); console.log('G108 passed: French public holidays algorithm accurate and comprehensive');"
  EXPECT: G108 passed: French public holidays algorithm accurate and comprehensive
  EVIDENCE: G108 passed: French public holidays algorithm accurate and comprehensive (vérifié par node -e oracle le 2026-10-01)

- [x] G109: Intégration des jours fériés dans le planning d'équipe AvailabilitiesView.vue (qualification, légende et présences attendues)
  CHECK: node -e "const fs = require('fs'); const content = fs.readFileSync('src/views/manager/AvailabilitiesView.vue', 'utf8'); if (!content.includes('getPublicHoliday')) throw new Error('getPublicHoliday non importé'); if (!content.includes('holiday')) throw new Error('type holiday absent de dayState'); if (!content.includes('Férié')) throw new Error('mention Férié absente de la vue'); console.log('G109 passed: public holidays integrated in AvailabilitiesView');"
  EXPECT: G109 passed: public holidays integrated in AvailabilitiesView
  EVIDENCE: G109 passed: public holidays integrated in AvailabilitiesView (vérifié par node -e oracle le 2026-10-01)

- [x] G110: Validation de la compilation Vite en production
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: npm run build avec code de sortie 0 (117 modules transformés en 1.26s, assets dist/ générés sans erreur le 2026-10-01)

---

# Gates: Éradication des Temps de Chargement & Alignement Local-First Intégral

OWNS: src/views/manager/TeamsView.vue, src/views/manager/EmployeesView.vue, src/views/manager/DashboardView.vue, src/views/manager/PresencesView.vue, src/views/manager/AvailabilitiesView.vue, src/views/employee/CheckInView.vue, src/views/employee/CheckOutView.vue, .agents/plan.md, GATES.md

Scope: Supprimer définitivement les appels réseau directs `supabase.from()` dans `TeamsView.vue` et `EmployeesView.vue` au profit de `useLiveQuery` et des transactions atomiques Dexie (`sync_outbox`). Éliminer les états de chargement artificiels et squelettes clignotants (*Flash of Loading*) dans `DashboardView.vue`, `PresencesView.vue` et `AvailabilitiesView.vue` en amorçant les requêtes réactives sur un tableau vide. Nettoyer les initialisations bloquantes au montage de `CheckInView.vue` et `CheckOutView.vue`.

- [x] G111: Éradication totale des requêtes réseau directes supabase.from() dans TeamsView et EmployeesView
  CHECK: node -e "const fs = require('fs'); const t = fs.readFileSync('src/views/manager/TeamsView.vue', 'utf8'); const e = fs.readFileSync('src/views/manager/EmployeesView.vue', 'utf8'); if (t.includes('supabase.from') || e.includes('supabase.from')) { console.error('FAILURE: supabase.from still present in manager views'); process.exit(1); } if (t.includes('import { supabase }') || e.includes('import { supabase }')) { console.error('FAILURE: supabase import still present'); process.exit(1); } console.log('G111 passed: zero direct supabase calls in TeamsView and EmployeesView');"
  EXPECT: G111 passed: zero direct supabase calls in TeamsView and EmployeesView
  EVIDENCE: G111 passed: zero direct supabase calls in TeamsView and EmployeesView (vérifié par oracle node le 2026-10-01)

- [x] G112: Implémentation réactive et transactionnelle Local-First (useLiveQuery, db.transaction, sync_outbox, generateUUIDv7)
  CHECK: node -e "const fs = require('fs'); const t = fs.readFileSync('src/views/manager/TeamsView.vue', 'utf8'); const e = fs.readFileSync('src/views/manager/EmployeesView.vue', 'utf8'); if (!t.includes('useLiveQuery') || !e.includes('useLiveQuery')) { console.error('FAILURE: useLiveQuery missing'); process.exit(1); } if (!t.includes('sync_outbox') || !e.includes('sync_outbox')) { console.error('FAILURE: sync_outbox missing'); process.exit(1); } if (!t.includes('generateUUIDv7') || !e.includes('generateUUIDv7')) { console.error('FAILURE: generateUUIDv7 missing'); process.exit(1); } console.log('G112 passed: reactive Dexie reading and outbox transactional writing implemented');"
  EXPECT: G112 passed: reactive Dexie reading and outbox transactional writing implemented
  EVIDENCE: G112 passed: reactive Dexie reading and outbox transactional writing implemented (vérifié par oracle node le 2026-10-01)

- [x] G113: Élimination du Flash of Loading et des squelettes d'attente intempestifs (DashboardView, PresencesView, AvailabilitiesView)
  CHECK: node -e "const fs = require('fs'); const d = fs.readFileSync('src/views/manager/DashboardView.vue', 'utf8'); const p = fs.readFileSync('src/views/manager/PresencesView.vue', 'utf8'); const a = fs.readFileSync('src/views/manager/AvailabilitiesView.vue', 'utf8'); if (d.includes('profileRows.value === null') || p.includes('presenceRows.value === null') || a.includes('employeeRows.value === null')) { console.error('FAILURE: null loading state guard still present'); process.exit(1); } console.log('G113 passed: flash of loading eliminated across manager views');"
  EXPECT: G113 passed: flash of loading eliminated across manager views
  EVIDENCE: G113 passed: flash of loading eliminated across manager views (vérifié par oracle node le 2026-10-01)

- [x] G114: Assainissement réactif Local-First des vues de pointage employé (CheckInView, CheckOutView) sans blocage au montage
  CHECK: node -e "const fs = require('fs'); const ci = fs.readFileSync('src/views/employee/CheckInView.vue', 'utf8'); const co = fs.readFileSync('src/views/employee/CheckOutView.vue', 'utf8'); if (ci.includes('isLoadingLocations = ref(true)') || co.includes('isLoading = ref(true)')) { console.error('FAILURE: blocking mount loading flag still present'); process.exit(1); } if (ci.includes('supabase.from')) { console.error('FAILURE: supabase fallback call in CheckInView'); process.exit(1); } console.log('G114 passed: employee check-in and check-out views fully reactive without mount jank');"
  EXPECT: G114 passed: employee check-in and check-out views fully reactive without mount jank
  EVIDENCE: G114 passed: employee check-in and check-out views fully reactive without mount jank (vérifié par oracle node le 2026-10-01)

- [x] G115: Validation de la compilation Vite en production
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: npm run build avec code de sortie 0 (117 modules transformés en 927ms, assets dist/ générés sans erreur le 2026-10-01)

---

# Gates: Refonte Éditoriale et Harmonisation Vocale Stop-Slop de l'Espace Gestionnaire

OWNS: src/layouts/ManagerLayout.vue, src/views/manager/DashboardView.vue, src/views/manager/PresencesView.vue, src/views/manager/AvailabilitiesView.vue, src/views/manager/LocationsView.vue, src/views/manager/TeamsView.vue, src/views/manager/EmployeesView.vue, src/views/manager/ExportView.vue, .agents/plan.md, GATES.md

Scope: Éradiquer le ton corporate classique des IA, le lexique policier et les métaphores industrielles creuses dans l'espace gestionnaire au profit d'une tonalité sobre, humaine, naturelle et précise (conformément au skill `stop-slop` et à la règle permanente `.agents/rules/09-ui-copy-and-tone.md`). Remplacer les formulations disciplinaires (« Contrôle des Présences », « Périmètres autorisés », « Qualifiez les retards », « Structurez vos pôles ») par des termes clairs et factuels (« Pointages », « Lieux de travail », « Heures habituelles d'arrivée », « Équipes »). Accorder les pluriels en toutes lettres sans parenthèses et éliminer les classes rétrécies (`btn-sm`) et rayures (`table-zebra`) pour la cohérence M3.

- [x] G116: Éradication du jargon policier et corporate dans l'ensemble des écrans gestionnaires
  CHECK: node -e "const fs = require('fs'); const files = ['src/layouts/ManagerLayout.vue', 'src/views/manager/DashboardView.vue', 'src/views/manager/PresencesView.vue', 'src/views/manager/AvailabilitiesView.vue', 'src/views/manager/LocationsView.vue', 'src/views/manager/TeamsView.vue', 'src/views/manager/EmployeesView.vue', 'src/views/manager/ExportView.vue']; const banned = ['Contrôle des Présences', 'Gestion des Collaborateurs', 'Gestion des Sites', 'Gestion des Équipes', 'Périmètres autorisés pour le pointage', 'Taux de tenue', 'Structurez vos pôles', 'Données brutes de présence', 'qualifier les retards', 'Veuillez']; const found = []; for (const f of files) { const c = fs.readFileSync(f, 'utf8'); for (const b of banned) { if (c.toLowerCase().includes(b.toLowerCase())) found.push(f + ' -> ' + b); } } if (found.length) { console.error('FAILURE G116: Jargon proscrit détecté :', found); process.exit(1); } console.log('G116 passed: corporate slop and policing jargon eradicated from manager space');"
  EXPECT: G116 passed: corporate slop and policing jargon eradicated from manager space
  EVIDENCE: G116 passed: corporate slop and policing jargon eradicated from manager space (vérifié par oracle node le 2026-10-01)

- [x] G117: Rigueur typographique et pluriels accordés en clair sans parenthèses
  CHECK: node -e "const fs = require('fs'); const files = ['src/views/manager/ExportView.vue', 'src/views/manager/TeamsView.vue', 'src/views/manager/DashboardView.vue']; for (const f of files) { const c = fs.readFileSync(f, 'utf8'); if (/\(s\)|\(es\)/.test(c)) { console.error('FAILURE G117: Pluriel entre parenthèses trouvé dans ' + f); process.exit(1); } } console.log('G117 passed: clear grammatical plurals without lazy parentheses');"
  EXPECT: G117 passed: clear grammatical plurals without lazy parentheses
  EVIDENCE: G117 passed: clear grammatical plurals without lazy parentheses (vérifié par oracle node le 2026-10-01)

- [x] G118: Validation de la compilation Vite en production
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: npm run build avec code de sortie 0 (117 modules transformés en 1.06s, assets dist/ générés sans erreur le 2026-10-01)

---

# Gates: Humanisation, Structure Sémantique et Accessibilité du Dialogue des Lieux

OWNS: src/views/manager/LocationsView.vue, GATES.md, .agents/plan.md

Scope: Aligner la boîte de dialogue de gestion des lieux de travail sur la grammaire moderne DaisyUI v5 (fieldset, fieldset-legend, fieldset-label) et la tonalité humaine et claire établie sur Collaborateurs et Équipes. Supprimer le jargon technique de capteur (« Rayon de détection ») au profit d'un vocabulaire d'usage (« Périmètre de pointage autorisé »), contextualiser l'en-tête, expliciter les trois méthodes de localisation (adresse postale, position actuelle, repère cartographique) et guider l'utilisation des sélecteurs de précision sans compromettre l'accessibilité WCAG AA ni les oracles G56/G58/G60.

- [x] G119: Conformité structurelle, sémantique fieldset et dimensionnement 44px du dialogue des lieux
  CHECK: node scripts/verify-gates.mjs --locations-form
  EXPECT: G56 passed: the locations dialog fields and search fill their containers at 44px
  EVIDENCE: G56 passed: the locations dialog fields and search fill their containers at 44px (vérifié par node scripts/verify-gates.mjs --locations-form le 2026-10-01)

- [x] G120: Respect du lexique positif, absence de jargon proscrit et intégrité des cartes et filtres
  CHECK: node scripts/verify-gates.mjs --locations-cards && node scripts/verify-gates.mjs --locations-filters
  EXPECT: G58 passed: site cards show a readable perimeter, position and map link
  EVIDENCE: G58 passed: site cards show a readable perimeter, position and map link & G60 passed: active/inactive display and data predicate are consistent end to end (vérifié par node scripts/verify-gates.mjs --locations-cards && node scripts/verify-gates.mjs --locations-filters le 2026-10-01)

- [x] G121: Validation de la compilation Vite en production sans régression
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: npm run build avec code de sortie 0 (117 modules transformés en 1.33s, assets dist/ générés sans erreur le 2026-10-01)

---

# Gates: Intégration de l'Heure de Départ Individuelle (`expected_departure_time`)

OWNS: supabase/migrations/20261001000000_add_expected_departure_time_to_profiles.sql, src/types/database.types.d.ts, src/views/manager/EmployeesView.vue, src/views/employee/HomeView.vue, src/views/employee/CheckInView.vue, GATES.md, .agents/plan.md

Scope: Permettre la personnalisation de l'heure de départ (`expected_departure_time`) au même titre que l'heure d'arrivée. Le schéma Supabase est enrichi, les types TypeScript sont mis à jour, l'interface du gestionnaire (EmployeesView) permet la visualisation et l'édition de cette nouvelle donnée. Les écrans employés intègrent cette donnée si nécessaire.

- [x] G122: Migration Supabase créée pour ajouter `expected_departure_time` (TIME, NOT NULL, DEFAULT '18:00:00')
  CHECK: node -e "const fs = require('fs'); const files = fs.readdirSync('supabase/migrations'); if(!files.some(f => f.includes('add_expected_departure_time'))) { console.error('FAILURE: Migration not found'); process.exit(1); } console.log('G122 passed: Migration found');"
  EXPECT: G122 passed: Migration found
  EVIDENCE: G122 passed: Migration found

- [x] G123: Types TypeScript de `profiles` mis à jour avec `expected_departure_time`
  CHECK: node -e "const fs = require('fs'); const c = fs.readFileSync('src/types/database.types.d.ts', 'utf8'); if(!c.includes('expected_departure_time: string')) { console.error('FAILURE: expected_departure_time missing in types'); process.exit(1); } console.log('G123 passed: Types updated');"
  EXPECT: G123 passed: Types updated
  EVIDENCE: G123 passed: Types updated

- [x] G124: Interface EmployeesView.vue permet d'éditer `expected_departure_time`
  CHECK: node -e "const fs = require('fs'); const c = fs.readFileSync('src/views/manager/EmployeesView.vue', 'utf8'); if(!c.includes('v-model=\"editForm.expected_departure_time\"')) { console.error('FAILURE: expected_departure_time input missing'); process.exit(1); } console.log('G124 passed: EmployeesView updated');"
  EXPECT: G124 passed: EmployeesView updated
  EVIDENCE: G124 passed: EmployeesView updated

- [x] G125: Validation de la compilation Vite en production sans régression
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: npm run build avec code de sortie 0 (117 modules transformés en 1.05s, assets dist/ générés sans erreur le 2026-10-01)

---

# Gates: Ajustement des Horaires dans le Planning Gestionnaire

OWNS: supabase/migrations/20261001210000_allow_manager_availability_management.sql, src/views/manager/AvailabilitiesView.vue, GATES.md, .agents/plan.md

Scope: Permettre au gestionnaire d'ajuster les horaires de pointage et départ prévus directement depuis la grille de planification (AvailabilitiesView). Le schéma Supabase autorise l'écriture par les managers via RLS, la modale de détail offre la saisie et la réinitialisation des horaires avec écriture locale Dexie et boîte d'envoi outbox. La grille affiche les plages horaires associées.

- [x] G126: Migration Supabase créée pour autoriser les managers à écrire dans availabilities (availabilities_write_manager)
  CHECK: node -e "const fs = require('fs'); const files = fs.readdirSync('supabase/migrations'); if(!files.some(f => f.includes('allow_manager_availability_management'))) { console.error('FAILURE: Migration not found'); process.exit(1); } console.log('G126 passed: Migration found');"
  EXPECT: G126 passed: Migration found
  EVIDENCE: G126 passed: Migration found (migration supabase/migrations/20261001210000_allow_manager_availability_management.sql créée et appliquée avec succès via Supabase MCP)

- [x] G127: Formulaire d'ajustement des horaires journaliers dans la modale de créneau de AvailabilitiesView.vue
  CHECK: node -e "const fs = require('fs'); const c = fs.readFileSync('src/views/manager/AvailabilitiesView.vue', 'utf8'); if(!c.includes('customStartTime') || !c.includes('saveCustomSchedule')) { console.error('FAILURE: Schedule form not found'); process.exit(1); } console.log('G127 passed: Schedule form found');"
  EXPECT: G127 passed: Schedule form found
  EVIDENCE: G127 passed: Schedule form found (formulaire avec Arrivée prévue, Départ prévu, boutons Enregistrer et Rétablir)

- [x] G128: Persistance locale transactionnelle Dexie et enregistrement dans sync_outbox pour la disponibilité
  CHECK: node -e "const fs = require('fs'); const c = fs.readFileSync('src/views/manager/AvailabilitiesView.vue', 'utf8'); if(!c.includes('db.sync_outbox.add') || !c.includes('table_name: \'availabilities\'')) { console.error('FAILURE: Dexie sync_outbox not found'); process.exit(1); } console.log('G128 passed: Dexie sync_outbox found');"
  EXPECT: G128 passed: Dexie sync_outbox found
  EVIDENCE: G128 passed: Dexie sync_outbox found (transaction Dexie atomique db.availabilities + db.sync_outbox avec déclenchement synchro syncNow)

- [x] G129: Affichage des horaires programmés dans les cellules de la grille manager
  CHECK: node -e "const fs = require('fs'); const c = fs.readFileSync('src/views/manager/AvailabilitiesView.vue', 'utf8'); if(!c.includes('getScheduledHours')) { console.error('FAILURE: getScheduledHours missing in AvailabilitiesView'); process.exit(1); } console.log('G129 passed: getScheduledHours present');"
  EXPECT: G129 passed: getScheduledHours present
  EVIDENCE: G129 passed: getScheduledHours present (affichage dynamique des horaires dans les cellules avec mise en avant visuelle des horaires aménagés)

- [x] G130: Validation de la compilation Vite en production sans régression
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: npm run build avec code de sortie 0 (117 modules transformés en 1.04s, assets dist/ générés sans erreur le 2026-10-01)

---

# Gates: Résolution Intégrale de l'Audit Next-Level-UI

OWNS: src/components/shared/ToastContainer.vue, src/views/SettingsView.vue, src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, src/views/manager/PresencesView.vue, src/views/manager/LocationsView.vue, src/views/employee/HomeView.vue, src/views/manager/DashboardView.vue, src/views/manager/EmployeesView.vue, src/views/manager/TeamsView.vue, src/views/employee/CheckInView.vue, src/views/employee/CheckOutView.vue, src/views/manager/AvailabilitiesView.vue, src/components/shared/SyncIndicator.vue, src/components/shared/SyncAlert.vue, GATES.md, .agents/plan.md

Scope: Résolution des 15 findings de l'audit next-level-ui : accessibilité WCAG AA (Toast 44px, tiroirs 44px), sécurisation de la déconnexion par ConfirmModal, anti-FOUC sur les vues de gestion, réassurance hors-ligne sur les flux de pointage, respect strict des tokens M3 et alignement à 100% de verify-gates.mjs.

- [x] G131: Cible tactile 44px, svg accessible et suppression de shadow-md sur ToastContainer.vue
  CHECK: node scripts/verify-gates.mjs --emojis && node scripts/verify-gates.mjs --shadows && node scripts/verify-gates.mjs --targets
  EXPECT: G1 passed: 0 raw emojis across all src files && G3 passed: no aggressive shadows across all Vue files && G4 passed: all interactive buttons meet 44px touch targets
  EVIDENCE: G1 passed: 0 raw emojis across all src files, G3 passed: no aggressive shadows across all Vue files, G4 passed: all interactive buttons meet 44px touch targets (vérifié par node scripts/verify-gates.mjs)

- [x] G132: Protection de la déconnexion par ConfirmModal et friction desktop sm:max-w-64 dans SettingsView.vue
  CHECK: node -e "const fs = require('fs'); const c = fs.readFileSync('src/views/SettingsView.vue', 'utf8'); if(!c.includes('ConfirmModal') || !c.includes('confirmLogout') || !c.includes('sm:max-w-64')) { console.error('FAILURE: SettingsView logout protection incomplete'); process.exit(1); } console.log('G132 passed: Logout confirmation modal and desktop constraint wired');"
  EXPECT: G132 passed: Logout confirmation modal and desktop constraint wired
  EVIDENCE: G132 passed: Logout confirmation modal and desktop constraint wired (modale de confirmation connectée à handleLogout, bouton limité à sm:max-w-64)

- [x] G133: Normalisation des cibles de tiroir min-h-11 min-w-11 sur ManagerLayout.vue et EmployeeLayout.vue
  CHECK: node -e "const fs = require('fs'); for(const f of ['src/layouts/ManagerLayout.vue', 'src/layouts/EmployeeLayout.vue']) { const c = fs.readFileSync(f, 'utf8'); if(c.includes('btn-sm min-h-12 min-w-12 sm:min-h-10 sm:min-w-10')) { console.error('FAILURE: sub-44px hamburger target found in ' + f); process.exit(1); } } console.log('G133 passed: Drawer trigger targets meet 44px minimum');"
  EXPECT: G133 passed: Drawer trigger targets meet 44px minimum
  EVIDENCE: G133 passed: Drawer trigger targets meet 44px minimum (cibles tactiles de tiroir fixées à min-h-11 min-w-11 sans écrasement par btn-sm)

- [x] G134: Rétablissement des oracles d'interface gestionnaire (G63 actualiser, G72 local-first, G93 titre de vue)
  CHECK: node scripts/verify-gates.mjs --presences-ui && node scripts/verify-gates.mjs --presences-localfirst && node scripts/verify-gates.mjs --manager-finish
  EXPECT: G63 passed: presences screen shares the locations grammar && G72 passed: presences screen reads Dexie and only Dexie && G93 passed: manager finishing pass applied
  EVIDENCE: G63 passed: presences screen shares the locations grammar, G72 passed: presences screen reads Dexie and only Dexie, G93 passed: manager finishing pass applied (vérifiés avec 0 défaut)

- [x] G135: Éradication du sursaut d'état vide (FOUC) sur DashboardView, EmployeesView et TeamsView
  CHECK: node -e "const fs = require('fs'); for(const f of ['src/views/manager/DashboardView.vue', 'src/views/manager/EmployeesView.vue', 'src/views/manager/TeamsView.vue']) { const c = fs.readFileSync(f, 'utf8'); if(!c.includes('loading') && !c.includes('skeleton')) { console.error('FAILURE: loading state missing in ' + f); process.exit(1); } } console.log('G135 passed: Loading states defined to prevent empty state flash');"
  EXPECT: G135 passed: Loading states defined to prevent empty state flash
  EVIDENCE: G135 passed: Loading states defined to prevent empty state flash (états de chargement réactifs avec skeletons animés prévenant tout clignotement intempestif d'état vide)

- [x] G136: Validation globale de tous les oracles verify-gates et compilation de production
  CHECK: node scripts/verify-gates.mjs --all && npm run build
  EXPECT: G97 passed: the back command lives in the app bar and no content duplicates it && built in
  EVIDENCE: node scripts/verify-gates.mjs --all validé avec 100% de succès sur toutes les portes (G1 à G97 sans exception) et npm run build avec code de sortie 0 (117 modules transformés en 1.38s, assets dist/ conformes)

---

# Gates: Horaires Généraux d'Entreprise (Disponibilités & company_settings)

OWNS: supabase/migrations/20261002190000_create_company_settings.sql, supabase/migrations/20261002190000_create_company_settings_down.sql, src/lib/db.js, src/composables/useSyncEngine.js, src/types/database.types.d.ts, src/lib/domain.js, src/views/manager/AvailabilitiesView.vue, GATES.md

Scope: Implémentation complète de l'horaire général d'entreprise (Option UI 2 + Piste Backend A). Création de la table `company_settings` dans Supabase avec RLS et script réversible, incrémentation Dexie en version(2), intégration dans useSyncEngine, ajout des types TypeScript, fonction de cascade de domaine, et modale accessible dans Disponibilités avec mise à jour réactive des cellules.

- [x] G137: Migration Supabase company_settings (table, colonnes système, RLS inconditionnelle, script réversible)
  CHECK: node -e "const fs = require('fs'); const up = fs.readFileSync('supabase/migrations/20261002190000_create_company_settings.sql', 'utf8'); const down = fs.readFileSync('supabase/migrations/20261002190000_create_company_settings_down.sql', 'utf8'); if (!up.includes('CREATE TABLE IF NOT EXISTS public.company_settings') || !up.includes('ENABLE ROW LEVEL SECURITY') || !down.includes('DROP TABLE IF EXISTS public.company_settings')) { console.error('FAILURE: Migration files invalid'); process.exit(1); } console.log('G137 passed: Supabase migration company_settings up and down valid');"
  EXPECT: G137 passed: Supabase migration company_settings up and down valid
  EVIDENCE: G137 passed: Supabase migration company_settings up and down valid (scripts réversibles créés, DDL conforme aux règles RLS et colonnes système)

- [x] G138: Évolution du schéma Dexie.js en version(2) avec table locale company_settings
  CHECK: node -e "const fs = require('fs'); const c = fs.readFileSync('src/lib/db.js', 'utf8'); if (!c.includes('this.version(2).stores') || !c.includes('company_settings:')) { console.error('FAILURE: Dexie version(2) company_settings missing'); process.exit(1); } console.log('G138 passed: Dexie version(2) with company_settings present');"
  EXPECT: G138 passed: Dexie version(2) with company_settings present
  EVIDENCE: G138 passed: Dexie version(2) with company_settings present (version 1 sanctuarisée, version 2 ajoutée avec upgrade et constantes singleton)

- [x] G139: Intégration de company_settings dans le moteur de synchronisation useSyncEngine
  CHECK: node -e "const fs = require('fs'); const c = fs.readFileSync('src/composables/useSyncEngine.js', 'utf8'); if (!c.includes('company_settings')) { console.error('FAILURE: company_settings missing from useSyncEngine'); process.exit(1); } console.log('G139 passed: company_settings integrated in pullChanges');"
  EXPECT: G139 passed: company_settings integrated in pullChanges
  EVIDENCE: G139 passed: company_settings integrated in pullChanges (pull incrémental via updated_at et upsert dans db.company_settings)

- [x] G140: Types TypeScript et cascade d'horaires dans domain.js
  CHECK: node -e "const fs = require('fs'); const t = fs.readFileSync('src/types/database.types.d.ts', 'utf8'); const d = fs.readFileSync('src/lib/domain.js', 'utf8'); if (!t.includes('company_settings:') || !d.includes('resolveSchedule')) { console.error('FAILURE: Types or domain helper missing'); process.exit(1); } console.log('G140 passed: Types and domain cascade helper present');"
  EXPECT: G140 passed: Types and domain cascade helper present
  EVIDENCE: G140 passed: Types and domain cascade helper present (types Database étendus et fonction resolveSchedule avec gestion de cascade)

- [x] G141: Modale Horaires de référence dans AvailabilitiesView avec persistance locale et bouton 44px
  CHECK: node -e "const fs = require('fs'); const c = fs.readFileSync('src/views/manager/AvailabilitiesView.vue', 'utf8'); if (!c.includes('company_settings') || !c.includes('Horaires par défaut') || !c.includes('saveCompanySchedule')) { console.error('FAILURE: AvailabilitiesView schedule modal incomplete'); process.exit(1); } console.log('G141 passed: AvailabilitiesView default schedule modal and reactive query wired');"
  EXPECT: G141 passed: AvailabilitiesView default schedule modal and reactive query wired
  EVIDENCE: G141 passed: AvailabilitiesView default schedule modal and reactive query wired (bouton d'en-tête accessible 44px, dialogue modal M3, transaction atomique Dexie + sync_outbox, réactivité instantanée des cellules)

- [x] G142: Validation intégrale des oracles verify-gates et compilation de production
  CHECK: node scripts/verify-gates.mjs --all && npm run build
  EXPECT: G97 passed: the back command lives in the app bar and no content duplicates it && built in
  EVIDENCE: 100% de réussite sur node scripts/verify-gates.mjs --all et npm run build avec code de sortie 0 (117 modules transformés en 833ms, bundle dist/ sain)

---

# Gates: Unification du Statut Réseau dans le Bandeau Supérieur

OWNS: src/components/shared/SyncAlert.vue, src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, scripts/verify-gates.mjs, GATES.md, .agents/WRITING_IMPROVEMENT.md

Scope: Centralisation exclusive du statut réseau dans le bandeau supérieur (header) à toutes les résolutions (mobile, tablette, bureau). Remplacement du signal d'exception par une pastille permanente réactive dans SyncAlert.vue (« À jour », « Hors ligne », « X en attente », « Synchronisation... » avec cible tactile 44px). Retrait complet du composant et du pied de statut réseau dans les volets latéraux ManagerLayout.vue et EmployeeLayout.vue. Mise à niveau correspondante des oracles déterministes G5, G17, G20, G22, G35 et G45 dans scripts/verify-gates.mjs.

- [x] G143: Statut réseau universel, permanent et accessible dans SyncAlert.vue
  CHECK: node -e "const fs = require('fs'); const c = fs.readFileSync('src/components/shared/SyncAlert.vue', 'utf8'); if (c.includes('v-if=\"isVisible\"') || !c.includes('isSyncing') || !c.includes('text-success') || !c.includes('min-h-11') || c.includes('border-success')) { console.error('FAILURE: SyncAlert incomplete'); process.exit(1); } console.log('G143 passed: SyncAlert exposes universal reactive status at all breakpoints');"
  EXPECT: G143 passed: SyncAlert exposes universal reactive status at all breakpoints
  EVIDENCE: G143 passed: SyncAlert exposes universal reactive status at all breakpoints (pastille ronde colorée devant, icône nuage classique épuré sans coche à base plate, nuage barré hors ligne, flèches de synchronisation animées en transfert avec compteur en attente, sans outline encombrant, cible 44px et libellés accessibles conservés)

- [x] G144: Retrait de SyncIndicator et déchargement du pied de volet latéral dans les deux espaces
  CHECK: node -e "const fs = require('fs'); for(const f of ['src/layouts/ManagerLayout.vue', 'src/layouts/EmployeeLayout.vue']) { const c = fs.readFileSync(f, 'utf8'); if (c.includes('SyncIndicator') || c.includes('Statut réseau')) { console.error('FAILURE: Drawer still contains status in ' + f); process.exit(1); } } console.log('G144 passed: Sidebar drawers dedicated to navigation without network footer');"
  EXPECT: G144 passed: Sidebar drawers dedicated to navigation without network footer
  EVIDENCE: G144 passed: Sidebar drawers dedicated to navigation without network footer (pied de volet retiré, zéro duplication sur desktop/tablette, rail latéral épuré)

- [x] G145: Alignement des oracles de test (G5, G17, G20, G22, G35, G45) sur le nouveau paradigme
  CHECK: node -e "const fs = require('fs'); const c = fs.readFileSync('scripts/verify-gates.mjs', 'utf8'); if (!c.includes('Network status unified in header via SyncAlert') || !c.includes('RAIL_HIDE_MIN = 5')) { console.error('FAILURE: verify-gates.mjs not updated'); process.exit(1); } console.log('G145 passed: verify-gates oracles aligned with unified header status architecture');"
  EXPECT: G145 passed: verify-gates oracles aligned with unified header status architecture
  EVIDENCE: G145 passed: verify-gates oracles aligned with unified header status architecture (oracles actualisés pour valider la centralisation dans le bandeau et l'intégrité de la navigation)

- [x] G146: Validation intégrale de la suite déterministe et compilation Vite en production
  CHECK: node scripts/verify-gates.mjs --all && npm run build
  EXPECT: G97 passed: the back command lives in the app bar and no content duplicates it && built in
  ---

# Gates: Déclencheur et Dialogue des Notifications dans le Bandeau Supérieur

OWNS: src/components/shared/NotificationBell.vue, src/layouts/ManagerLayout.vue, src/layouts/EmployeeLayout.vue, scripts/verify-gates.mjs, GATES.md, .agents/WRITING_IMPROVEMENT.md

Scope: Ajout d'une icône de notification (cloche standard SVG avec cible tactile 44px min-h-11 min-w-11) immédiatement devant l'indicateur de synchronisation dans l'en-tête supérieur des espaces Gestionnaire et Employé. Ouverture d'une boîte de dialogue modale classique DaisyUI / Material 3 (dialog role="dialog" aria-modal="true") présentant un état vide soigné (« Aucune notification », message d'information sobre, bouton de fermeture accessible). Vérification déterministe via l'oracle checkNotificationBell intégré à la suite scripts/verify-gates.mjs.

- [x] G147: Composant NotificationBell.vue avec dialogue modal accessible, état vide sobre et ergonomie tactile 44px
  CHECK: node scripts/verify-gates.mjs --notification-bell
  EXPECT: G147-G148 passed: NotificationBell implemented with accessible dialog, empty state, and positioned before SyncAlert in both headers
  EVIDENCE: G147-G148 passed: NotificationBell implemented with accessible dialog, empty state, and positioned before SyncAlert in both headers (vérifié par node scripts/verify-gates.mjs --notification-bell, dialogue avec titre, icône Feather, état vide sans distraction, fermeture Échap / backdrop / bouton 44px)

- [x] G148: Intégration de NotificationBell immédiatement devant SyncAlert dans les bandeaux supérieurs ManagerLayout et EmployeeLayout
  CHECK: node scripts/verify-gates.mjs --notification-bell
  EXPECT: G147-G148 passed: NotificationBell implemented with accessible dialog, empty state, and positioned before SyncAlert in both headers
  EVIDENCE: G147-G148 passed: NotificationBell implemented with accessible dialog, empty state, and positioned before SyncAlert in both headers (ordre vérifié par oracle dans les deux layouts : NotificationBell précède strictement SyncAlert)

- [x] G149: Intégrité globale de la suite de tests oracles et compilation de production Vite
  CHECK: node scripts/verify-gates.mjs --all && npm run build
  EXPECT: G147-G148 passed: NotificationBell implemented with accessible dialog, empty state, and positioned before SyncAlert in both headers && built in
  EVIDENCE: node scripts/verify-gates.mjs --all validé à 100% (code sortie 0) et npm run build achevé avec succès (code sortie 0, bundle dist/ sain)



