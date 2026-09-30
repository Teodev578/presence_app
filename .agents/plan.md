# Plan de Travail Agentique : Intégration du Dispositif d'Installation PWA dans les Paramètres

Ce fichier porte le plan de la tâche en cours, conformément à la règle `.agents/rules/10-planification-taches-fastidieuses.md` et aux garde-fous de `AGENTS.md`.

---

## Tâche en cours

- **Tâche** : Intégration et extension du dispositif d'installation PWA dans les Paramètres (`SettingsView.vue`), incluant la prise en charge complète sur ordinateur de bureau (Desktop Chrome / Edge / Chromium).
- **Date** : 2026-09-30
- **Périmètre** :
  - *Fichiers créés / modifiés* :
    - `public/manifest.webmanifest` (manifeste standardisé PWA)
    - `public/sw.js` (écouteur de conformité fetch PWA)
    - `index.html` (liens de manifeste, apple-touch-icon et mobile-web-app-capable)
    - `src/composables/usePwaInstall.js` (détection standalone, desktop, chromium et iOS Safari)
    - `src/components/shared/PwaInstallCard.vue` (tuile M3 d'installation et guides interactifs desktop / iOS)
    - `src/views/SettingsView.vue` (intégration de la tuile dans la grille des réglages)
    - `src/App.vue` (initialisation globale du capteur d'installation)
    - `scripts/test-pwa-install.mjs` (oracle de test déterministe étendu)
  - *Hors périmètre* : Schémas Dexie/Supabase, logique de pointage, tiroirs de navigation.
- **Critère d'arrêt** :
  1. Le fichier `public/manifest.webmanifest` contient les métadonnées requises (`name`, `short_name`, `start_url`, `display: standalone`, icônes 192/512).
  2. Le Service Worker `public/sw.js` répond aux exigences d'installabilité PWA.
  3. `usePwaInstall.js` expose un état réactif étendu pour mobile et desktop (`isDesktop`, `isChromium`, `canPromptDirectly`, `isInstalled`, `isIOS`, `showDesktopGuide`, etc.).
  4. La tuile « Application sur l'appareil » affiche sur ordinateur un statut « Prête à installer » ou « Installée » et offre les actions appropriées (installation directe ou guide barre d'adresse Chrome/Edge).
  5. `npm run build` réussit avec code 0.
  6. `node scripts/test-pwa-install.mjs` réussit avec code 0 (38 assertions au vert).
  7. Non-régression sur `node scripts/verify-gates.mjs` (G11, G14, G15, G16, G35, G95 validés).

---

### Étapes d'exécution

- [x] **Étape 1 : Manifeste PWA et conformité Service Worker**
  - Rédiger `public/manifest.webmanifest` avec métadonnées conformes et déclaration des icônes 192/512/maskable.
  - Lier le manifeste et l'icône Apple dans `index.html`.
  - Compléter `public/sw.js` avec un gestionnaire `fetch` sans régression sur Background Sync.
  - Vérification : syntaxe JSON valide et conformité Web App Manifest vérifiées par l'oracle. *(Validé)*

- [x] **Étape 2 : Moteur réactif d'installation (`usePwaInstall.js`)**
  - Mettre en place la capture globale de `beforeinstallprompt` au niveau module pour ne jamais rater l'événement.
  - Implémenter la détection de mode autonome (`matchMedia('(display-mode: standalone)')`, `navigator.standalone`).
  - Détecter iOS Safari pour le routage vers le guide d'installation manuel.
  - Écouter `appinstalled` pour basculer réactivement l'état.
  - Vérification : réactivité unitaire et exports propres. *(Validé)*

- [x] **Étape 3 : Composant d'interface `PwaInstallCard.vue`**
  - Développer la tuile d'installation reprenant la grammaire exacte des cartes de `SettingsView.vue` (`card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 md:col-span-2`).
  - Bloc d'état dans une surface M3 (`rounded-m3-md bg-base-100 border border-base-300/60 p-3.5`) avec badge DaisyUI (`badge-success` si installée, `badge-primary` si installable, `badge-neutral` si navigateur standard).
  - Bouton d'action tactile >= 44px (`min-h-11`) avec icône SVG vectorielle.
  - Guide dépliable pas à pas avec deux étapes claires pour iOS Safari (icône de partage, icône d'ajout à l'écran d'accueil).
  - Vérification : 0 émoji brut, tokens `rounded-m3-*`, absence d'ombres prohibées. *(Validé)*

- [x] **Étape 4 : Intégration dans `SettingsView.vue` et `App.vue`**
  - Insérer la tuile `PwaInstallCard.vue` dans `SettingsView.vue`.
  - Initialiser `initPwaInstall()` dans `App.vue` au montage pour capter l'événement dès le boot de l'application.
  - Ajuster la mise en page de la grille pour un équilibre visuel soigné.
  - Vérification : respect strict des jetons attendus par G11, G35 et G95. *(Validé)*

- [x] **Étape 5 : Oracle déterministe et validation globale**
  - Créer l'oracle de validation `scripts/test-pwa-install.mjs`.
  - Exécuter `node scripts/test-pwa-install.mjs` (33 assertions au vert).
  - Exécuter `node scripts/verify-gates.mjs` (G11, G14, G15, G16, G35, G95 validés).
  - Exécuter `npm run build` (succès code 0).
  - Validation visuelle Chrome DevTools sur desktop (1280px) et mobile (390px). *(Validé)*

- [x] **Étape 6 : Prise en charge et guidage explicite sur ordinateur (Desktop)**
  - Mettre à jour `index.html` avec la balise `<meta name="mobile-web-app-capable" content="yes" />`.
  - Étendre `usePwaInstall.js` avec la détection de bureau (`isDesktop`), la détection de Chromium (`isChromium`), et la gestion du statut `desktop`.
  - Enrichir `PwaInstallCard.vue` pour proposer le statut « Prête à installer » sur ordinateur avec bouton d'action et guide visuel Chrome/Edge (icône d'installation dans la barre d'adresse et menu Options).
  - Actualiser `scripts/test-pwa-install.mjs` (38 assertions au vert) et valider `npm run build`. *(Validé)*
