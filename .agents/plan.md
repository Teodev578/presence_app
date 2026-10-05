# Plan : Refonte de la Lisibilité et du Thème de l'Écran de Mot de Passe Oublié

Date : 2026-10-05  
Déclencheur : Demande utilisateur (revoir la lisibilité du thème pour l'écran de mot de passe oublié)  
Statut : Terminé et Validé (Portes G190 et G191 validées, suppression du ratio 1.1:1, bandeau de confirmation avec email, retour à la connexion fluide, build conforme)  
Porte liée : G190 / G191  

## 1. Périmètre

### Fichiers cibles
- `src/views/auth/LoginView.vue` (refonte contrastée de l'état de mot de passe oublié, suppression de l'écrasement de fond disabled, encart de confirmation explicite, CTA Retour à la connexion)
- `GATES.md` (portes G190 et G191)
- `scripts/verify-gates.mjs` (oracle déterministe pour G190)

---

## 2. Étapes Séquentielles

1. [x] **Étape 1 : Refonte de l'état de confirmation et contraste du bouton (`LoginView.vue`)**
   - Éliminer le piège `:disabled="authLoading || isForgotSuccess"` qui détruisait le fond vert au profit du fond gris disabled de DaisyUI.
   - Utiliser un badge d'accusé de réception net avec coche verte Material 3 et le CTA principal « Retour à la connexion ».
   - Ajouter un bandeau d'alerte de confirmation Material 3 avec l'adresse email rappelée et un message explicatif clair.

2. [x] **Étape 2 : Rehaussement typographique et d'incarnation (`LoginView.vue`)**
   - Insérer un badge visuel M3 d'en-tête (cadenas/clé) pour situer l'écran.
   - Améliorer le contraste du bouton retour (`text-base-content`, hover franc, cible 44px).
   - Augmenter la lisibilité du sous-titre (`text-sm text-base-content/75`).

3. [x] **Étape 3 : Oracle Déterministe et Validation Globale**
   - Implémenter l'oracle G190 dans `scripts/verify-gates.mjs` (`--forgot-password-theme`).
   - Valider la suite intégrale `node scripts/verify-gates.mjs --all` et la compilation Vite `npm run build`.

---

# Plan : Éradication des Bandes et Marges Périphériques Durant le Chargement

Date : 2026-10-05  
Déclencheur : Demande utilisateur (résoudre la cause des bandes autour de la page durant le chargement)  
Statut : Terminé et Validé (Portes G188 et G189 validées, reset Frame 0 html/body actif, scale(0.995) éliminé, adhérence viewport parfaite, build conforme)  
Porte liée : G188 / G189  

## 1. Périmètre

### Fichiers cibles
- `index.html` (reset inline `html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; }` et fonds `#fdfcff` / `#111318`)
- `src/App.vue` (suppression de `scale(0.995)` dans `.space`, `w-full min-h-dvh` sur l'écran d'attente)
- `GATES.md` (portes G188 et G189)
- `scripts/verify-gates.mjs` (oracle déterministe pour G188)

---

## 2. Étapes Séquentielles

1. [x] **Étape 1 : Normalisation CSS Frame 0 (`index.html`)**
   - Réinitialiser `html, body` à `margin: 0; padding: 0; width: 100%; min-height: 100%;`.
   - Déclarer la couleur de fond native sur `html, body` et `[data-theme="dark"]` (`#fdfcff` et `#111318`).
   - Supprimer tout risque de débordement de 16px sur la hauteur du viewport.

2. [x] **Étape 2 : Suppression du `scale(0.995)` dans la transition d'espace (`src/App.vue`)**
   - Remplacer `scale(0.995)` par une translation verticale pure `translateY(6px)` / `-6px`.
   - Garantir le maintien de la vue bord-à-bord contre le viewport sans décollement durant les 250 ms.

3. [x] **Étape 3 : Oracle Déterministe et Validation Globale**
   - Implémenter l'oracle G188 dans `scripts/verify-gates.mjs` (`--loading-margins`).
   - Valider la suite intégrale `node scripts/verify-gates.mjs --all` et la compilation Vite `npm run build`.

---

# Plan : Identité Visuelle Officielle, Élimination des Logos Vite et Titre d'Onglet Dynamique

Date : 2026-10-05  
Déclencheur : Demande utilisateur (remplacer les logos Vite, titre sobre sans description et notifications entre parenthèses façon YouTube)  
Statut : Terminé et Validé (Portes G186 et G187 validées, logo Vite éliminé, titre dynamique réactif opérationnel, build conforme)  
Porte liée : G186 / G187  

## 1. Périmètre

### Fichiers cibles
- `public/favicon.svg` (nouveau logo officiel vectoriel PresenceApp)
- `public/apple-touch-icon.png`, `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/pwa-maskable-512x512.png` (génération HD)
- `public/manifest.webmanifest` (mise à jour du nom et des métadonnées PWA)
- `index.html` (titre épuré `<title>PresenceApp</title>`)
- `src/App.vue` (watcher réactif sur `unreadCount` pour ajuster `document.title = (N) PresenceApp` ou `PresenceApp`)
- `src/assets/vite.svg`, `src/components/HelloWorld.vue` (nettoyage résidus template)
- `GATES.md` (portes G186 et G187)
- `scripts/verify-gates.mjs` (oracle déterministe pour G186)

---

## 2. Étapes Séquentielles

1. [x] **Étape 1 : Conception du Logo Officiel SVG et Génération des Icônes PWA**
   - Créer `public/favicon.svg` avec le cadran temporel M3, la coche de présence et le gradient `#005ac1` / `#1d4ed8`.
   - Générer avec `rsvg-convert` les versions PNG haute résolution : `apple-touch-icon.png` (180x180), `pwa-192x192.png`, `pwa-512x512.png`, et `pwa-maskable-512x512.png`.
   - Nettoyer les fichiers de démo Vite (`src/assets/vite.svg`, `src/components/HelloWorld.vue`).
   - Aligner `public/manifest.webmanifest` (`"name": "PresenceApp"`).

2. [x] **Étape 2 : Épuration du Titre Initial et Titre Dynamique d'Onglet**
   - Modifier `index.html` : `<title>PresenceApp</title>`.
   - Dans `src/App.vue` : importer `useNotifications()`, lier `unreadCount` à `document.title` avec mise à jour immédiate.

3. [x] **Étape 3 : Oracle Déterministe et Validation des Portes**
   - Implémenter l'oracle G186 dans `scripts/verify-gates.mjs` (`--app-identity`).
   - Valider la suite intégrale `node scripts/verify-gates.mjs --all` et la compilation Vite `npm run build`.
   - Consigner les preuves dans `GATES.md` et clôturer le journal.

---

# Plan : Optimisation du Chargement à Froid et de l'App Shell

Date : 2026-10-05  
Déclencheur : Demande utilisateur (recommandations et implémentation pour le chargement de l'app)  
Statut : Terminé et Validé (Portes G184 et G185 validées, chunk d'entrée réduit de 789 kB à 75 kB, build de production conforme)  
Porte liée : G184 / G185  

## 1. Périmètre

### Fichiers cibles
- `index.html` (Splash Screen SVG/CSS natif Frame 0, preconnect Google Fonts)
- `src/style.css` (optimisation typographique)
- `src/composables/useProfile.js` (résolution optimiste Dexie immédiate, stale-while-revalidate sans blocage réseau)
- `src/App.vue` (Code-splitting dynamique `defineAsyncComponent`, écran d'attente à froid M3 stylisé)
- `public/sw.js` (App shell precaching pour chargement instantané offline)
- `GATES.md` (portes G184 et G185)
- `scripts/verify-gates.mjs` (oracle déterministe pour G184)

---

## 2. Étapes Séquentielles

1. [x] **Étape 1 : Splash Screen Frame 0 & Préconnexions (`index.html` & `style.css`)**
   - Injecter le splash screen inline dans `<div id="app">` avec adaptation automatique au thème (`data-theme`).
   - Ajouter `preconnect` pour Google Fonts dans `index.html` et optimiser l'import.

2. [x] **Étape 2 : Résolution Optimiste Local-First (`useProfile.js`)**
   - Restituer immédiatement le profil Dexie ou les métadonnées de session dans `fetchProfile()` sans bloquer sur l'appel Supabase distant.
   - Laisser le rafraîchissement Supabase s'exécuter en tâche de fond.

3. [x] **Étape 3 : Code-Splitting Dynamique & Écran d'attente M3 (`App.vue`)**
   - Remplacer les 15 imports statiques par `defineAsyncComponent(() => import(...))`.
   - Remplacer le spinner brut par un écran d'attente Material 3 avec badge de marque et typographie soignée.

4. [x] **Étape 4 : App Shell Caching (`public/sw.js`)**
   - Ajouter la mise en cache des assets statiques (HTML, CSS, JS, SVG, polices) dans CacheStorage.
   - Préserver intact le listener Background Sync `presence-outbox-sync`.

5. [x] **Étape 5 : Définition des Portes et Validation (`GATES.md` & `verify-gates.mjs`)**
   - Écrire et exécuter l'oracle G184 (`--app-loading`).
   - Valider la suite intégrale et la compilation Vite de production.

---

# Plan : Fluidification de la Transition d'Authentification

Date : 2026-10-05  
Déclencheur : Demande utilisateur (résoudre la cassure d'animation entre la loginpage et l'écran lors de la connexion)  
Statut : Terminé et Validé (Portes G182 et G183 validées, build de production conforme)  
Porte liée : G182 / G183  

## 1. Périmètre

### Fichiers cibles
- `src/composables/useAuth.js` (découplage `authInitializing` et `authLoading`)
- `src/App.vue` (déclenchement du loader plein écran réservé à `authInitializing`, redirection racine sur `#/login`)
- `src/views/auth/LoginView.vue` (normalisation de route sur `#/login`, état continu `isSubmitting` pour éliminer le reset de bouton)
- `GATES.md` (déclaration de la porte G182/G183)
- `scripts/verify-gates.mjs` (oracle déterministe pour G182)

---

## 2. Étapes Séquentielles

1. [x] **Étape 1 : Découplage dans `useAuth.js`**
   - Introduire `authInitializing = ref(true)` activé uniquement pendant `initAuth()` au démarrage à froid.
   - Conserver `authLoading = ref(false)` pour les soumissions interactives.
   - Exporter `authInitializing` et `authLoading`.

2. [x] **Étape 2 : Sécurisation du rendu dans `App.vue`**
   - Adapter la condition du loader racine : `v-if="authInitializing || (isAuthenticated && !profile && profileLoading)"`.
   - Normaliser les arrivées non authentifiées sur `/` vers `#/login`.

3. [x] **Étape 3 : Fluidité et continuité dans `LoginView.vue`**
   - Introduire `isSubmitting` qui reste actif pendant tout le cycle `signIn -> fetchProfile -> JIT checks -> isSuccess`.
   - Assurer que le bouton ne subit aucun retour arrière ou saut d'état avant l'apparition de « Connexion réussie ».
   - Normaliser l'URL sur `#/login` dès le montage.

4. [x] **Étape 4 : Définition des Oracles et Portes (`GATES.md` & `verify-gates.mjs`)**
   - Implémenter l'oracle pour G182.
   - Valider la suite complète de gates et la compilation de production Vite.

---

# Plan : Demande d'Absence avec Validation Hiérarchique

Date : 2026-10-05  
Déclencheur : Demande utilisateur (remplacer l'enregistrement simple par une demande d'absence, validation manager, indicateur vert sur jours accordés, notifications croisées)  
Statut : Terminé et Validé (Portes G175 à G179 validées, build de production conforme)  
Artifact Antigravity : `plan_demande_absence.md`

## 1. Périmètre

### Fichiers cibles
- `supabase/migrations/20261005170000_create_absence_requests.sql` (création)
- `src/types/database.types.d.ts` (types TypeScript de la table)
- `src/lib/db.js` (Dexie v4 store absence_requests)
- `src/composables/useSyncEngine.js` (pull incrémental et canal Realtime CDC)
- `src/composables/useAbsenceRequests.js` (création : composable métier employé & manager)
- `src/composables/useNotifications.js` (notifications in-app dérivées pour employé et manager)
- `src/components/shared/NotificationBell.vue` (support des badges de notification d'absence)
- `src/views/employee/AvailabilitiesView.vue` (titre et présentation adaptés au nouveau rôle)
- `src/components/employee/WeekGrid.vue` (action « Demande d'absence » / « Annuler ma demande », indicateur vert M3 sur jours validés)
- `src/views/manager/AvailabilitiesView.vue` (section d'examen et d'arbitrage des demandes)
- `GATES.md` (portes G175 à G179)
- `scripts/verify-gates.mjs` (oracles d'acceptation déterministes)

---

## 2. Étapes Séquentielles

1. [x] **Étape 1 : Migration Supabase & Types**
   - Rédiger `20261005170000_create_absence_requests.sql` avec table `absence_requests`, index B-Tree, RLS étanche et Realtime.
   - Compléter `src/types/database.types.d.ts`.
   - *Vérification* : Syntaxe SQL propre, types TypeScript alignés.

2. [x] **Étape 2 : Dexie v4 & Moteur de Synchro**
   - Ajouter `absence_requests` en version 4 dans `src/lib/db.js`.
   - Étendre `useSyncEngine.js` : pull incrémental par rôle (`user_id` pour employé, RLS pour superviseurs) et souscription CDC Realtime.
   - *Vérification* : Vérification de non-régression sur le singleton Dexie et `useLiveQuery`.

3. [x] **Étape 3 : Composable `useAbsenceRequests.js`**
   - Implémenter les méthodes `submitRequest`, `cancelRequest`, `validateRequest`, `refuseRequest`.
   - Intégrer la boîte d'envoi transactionnelle Dexie (`sync_outbox`) avec UUIDv7.
   - Dériver la demande de la semaine en cours via `useLiveQuery`.
   - *Vérification* : Résolution réactive sans fuite mémoire.

4. [x] **Étape 4 : Notifications Croisées (`useNotifications.js` & `NotificationBell.vue`)**
   - Étendre `useNotifications.js` :
     - Pour les managers : alerte sur toute demande `submitted` de l'équipe et sur les annulations.
     - Pour les collaborateurs : alerte sur le passage à `validated` ou `refused`.
   - Adapter `NotificationBell.vue` pour afficher les badges d'état (« En attente », « Validée », « Refusée », « Annulée »).
   - *Vérification* : Comptage exact des notifications non lues, navigation ciblée vers la vue appropriée.

5. [x] **Étape 5 : Refonte UX Collaborateur (`WeekGrid.vue` & `AvailabilitiesView.vue`)**
   - Bouton d'action principale :
     - Si aucune demande active : « Demande d'absence » (sélection des jours à poser en absence).
     - Si une demande est soumise : « Annuler ma demande » (permet d'annuler sa demande en attente).
     - Si la demande est validée : bouton d'annulation disponible si autorisé, affichage d'un bandeau informatif vert.
   - Jours de la semaine : outline et fond vert naturel `success` (M3 `border-success bg-success/10`) pour les jours dont la demande a été validée.
   - Prise en charge des notes et des retours explicatifs en cas de refus.
   - *Vérification* : Cibles tactiles 44px, zéro emoji brut, transitions GPU sans saccade.

6. [x] **Étape 6 : Section Arbitrage Manager (`src/views/manager/AvailabilitiesView.vue`)**
   - Insérer une section claire et sobre dédiée aux demandes d'absence de l'équipe.
   - Liste des demandes avec statut, employé, jours demandés, note éventuelle.
   - Actions directes : Valider (immédiat) ou Refuser (modale avec motif optionnel).
   - *Vérification* : Grammaire M3 et DaisyUI v5 conforme, zéro jargon corporate.

7. [x] **Étape 7 : Portes d'Acceptation & Validation Globale**
   - Ajouter les portes G175 à G179 dans `GATES.md`.
   - Câbler les oracles d'absence dans `scripts/verify-gates.mjs`.
   - Exécuter `node scripts/verify-gates.mjs --all` et `npm run build`.
   - Consigner le bilan dans `.agents/WRITING_IMPROVEMENT.md`.

---

# Plan : Refonte Éditoriale Stop-Slop de l'Espace Gestionnaire

Date : 2026-10-01  
Déclencheur : Audit stop-slop pour éradiquer le ton corporate classique des IA et adopter une tonalité sobre, humaine et naturelle  
Statut : Terminé et Validé (Portes G116 à G118 validées, build de production conforme)  
Artifact Antigravity : `audit_stop_slop_manager.md`

## 1. Périmètre

### Fichiers cibles
- `src/layouts/ManagerLayout.vue`
- `src/views/manager/DashboardView.vue`
- `src/views/manager/PresencesView.vue`
- `src/views/manager/AvailabilitiesView.vue`
- `src/views/manager/LocationsView.vue`
- `src/views/manager/EmployeesView.vue`
- `src/views/manager/TeamsView.vue`
- `src/views/manager/ExportView.vue`
- `GATES.md`

### Référentiels
- Skill `stop-slop` : suppression du remplissage, des constructions passives, des fausses antithèses et des métaphores managériales creuses.
- Directive locale `.agents/rules/09-ui-copy-and-tone.md` : parler à une personne et non à un dossier, nommer le fait constaté plutôt que le verdict disciplinaire, accorder le pluriel en toutes lettres.

---

## 2. Synthèse des Reformulations Appliquées

1. **Navigation et tiroir (`ManagerLayout.vue`)** :
   - Entrées : « Lieux de travail », « Pointages », « Équipe » (au lieu de « Sites », « Présences », « Collaborateurs »).

2. **Tableau de bord (`DashboardView.vue`)** :
   - Titre / sous-titre : « Tableau de bord » / « Pointages du [date] ».
   - Boutons et KPI : « Lieux de travail », « Personnes inscrites », « Sur site ou journée finie », « Sans pointage ni absence prévue », « Derniers pointages aujourd'hui ».

3. **Pointages (`PresencesView.vue`)** :
   - Titre / sous-titre : « Pointages » / « Arrivées, départs et heures constatées sur le terrain ».
   - Action modale : « Enregistrer la modification » (au lieu de « Valider la correction »).

4. **Disponibilités (`AvailabilitiesView.vue`)** :
   - Titre / sous-titre : « Disponibilités » / « Présences prévues par l'équipe pour la semaine ».
   - KPI : « Jours passés », « Journées pointées », « Présence constatée » / « Sur les jours prévus ».
   - Légendes & Modale : « Pointé », « Absence signalée », « Prévu », « Jour férié », « Note laissée par le collaborateur », « Consulter les pointages → ».

5. **Lieux de travail (`LocationsView.vue`)** :
   - Titre / sous-titre : « Lieux de travail » / « Adresses et zones où l'équipe peut valider son arrivée ».
   - Bouton & Formulaire : « Ajouter un lieu », « Rayon de détection », « Prendre ma position actuelle », « Lieu ouvert au pointage ».

6. **Équipes (`TeamsView.vue`)** :
   - Titre / sous-titre : « Équipes » / « Regroupez les personnes par pôle, atelier ou chantier ».
   - Modale & Listes : « Ajouter une équipe », « Donnez un nom clair pour identifier cette équipe », suppression de `btn-sm`.

7. **Membres de l'équipe (`EmployeesView.vue`)** :
   - Titre / sous-titre : « Membres de l'équipe » / « Rôles, équipes et heures habituelles d'arrivée ».
   - Aide & Modale : « Heure d'arrivée habituelle » / « Sert de repère pour signaler les arrivées après l'horaire », suppression de `btn-sm` et de `table-zebra`.

8. **Export (`ExportView.vue`)** :
   - Titre / sous-titre : « Export des pointages » / « Téléchargez un fichier CSV pour votre tableur ou vos fiches de paie ».
   - Toast & Téléchargement : accord grammatical explicite sans parenthèse (`${count > 1 ? `${count} pointages exportés en CSV.` : '1 pointage exporté en CSV.'}`), « Télécharger le fichier CSV ».

---

## 3. Résultats de Validation

- Oracle G116 (Éradication du jargon policier/corporate) : Validé (0 violation).
- Oracle G117 (Rigueur grammaticale et pluriels en clair) : Validé (0 parenthèse résiduelle).
- Oracle G118 (Compilation de production Vite) : Validé (code de sortie 0, 117 modules transformés).

---

## 4. Humanisation, Structure Sémantique et Accessibilité du Dialogue des Lieux

Date : 2026-10-01  
Déclencheur : Validation utilisateur de l'audit éditorial et de la refonte DaisyUI v5 `<fieldset class="fieldset">`  
Statut : Terminé et Validé (Portes G119 à G121 validées, build conforme)

### Objectifs
1. Structurer le dialogue avec `<fieldset class="fieldset">`, `<legend class="fieldset-legend">` et `<span class="fieldset-label">`.
2. Adopter un vocabulaire d'usage centré sur l'équipe : « Périmètre de pointage autorisé », « Trouver l'emplacement », « Rendre ce lieu actif immédiatement ».
3. Clarifier les 3 modes de localisation (adresse postale, position actuelle sur place, repère cartographique) avec des micro-copies d'aide.
4. Expliquer le rôle des sélecteurs de précision `−` et `+` sur les coordonnées.
5. Garantir les cibles tactiles 44px (WCAG AA), le feedback tactile et le focus visible.

### Résultats de Validation
- Oracle G119 (Structure sémantique et dimensionnement 44px) : Validé par G56.
- Oracle G120 (Intégrité des cartes et filtres sans jargon proscrit) : Validé par G58 et G60.
- Oracle G121 (Compilation de production Vite) : Validé avec code de sortie 0 (117 modules).

---

## 5. Intégration de l'Heure de Départ Individuelle (`expected_departure_time`)

Date : 2026-10-01  
Déclencheur : Demande utilisateur (personnalisation de l'heure de départ comme pour l'arrivée)  
Statut : Terminé et Validé (Portes G122 à G125)

### Objectifs
1. **Migration Supabase** : Ajouter `expected_departure_time TIME NOT NULL DEFAULT '18:00:00'::TIME` à la table `profiles`.
2. **Types TypeScript** : Mettre à jour `src/types/database.types.d.ts` avec le nouveau champ.
3. **UI Gestionnaire (`EmployeesView.vue`)** :
   - Afficher l'heure de départ dans la liste (ex. "Arrivée 09:00 - Départ 18:00").
   - Ajouter le champ d'édition dans la modale d'édition.
4. **UI Collaborateur (`CheckOutView.vue` / `HomeView.vue`)** : Exploiter `expected_departure_time` (qui remplace le "18h" théorique, bien qu'il ne soit pas trouvé explicitement en dur) ou le cas échéant afficher la bonne métrique.

### Résultats de Validation
- [x] G122 (Migration Supabase valide)
- [x] G123 (Types TS synchronisés)
- [x] G124 (Interface gestionnaire affiche et édite les deux horaires)
- [x] G125 (Compilation Vite)

---

## 6. Ajustement des Horaires au Vol dans le Planning Manager (`AvailabilitiesView.vue`)

Date : 2026-10-01  
Déclencheur : Demande utilisateur (Option C : permettre au manager de spécifier et ajuster les horaires de pointage et départ directement dans le Planning)  
Statut : Terminé et Validé (Portes G126 à G130 validées, build de production conforme)  

### Objectifs
1. **Sécurité & RLS Supabase** : Autoriser les managers et administrateurs à insérer et mettre à jour les enregistrements de disponibilités (`availabilities`) via la politique `availabilities_write_manager`.
2. **Interface Modale (`AvailabilitiesView.vue`)** :
   - Ajouter un bloc d'ajustement horaire au sein de la modale de détail d'un créneau (`selectedCell`).
   - Saisie de `Heure d'arrivée prévue` (`start_time`) et `Heure de départ prévue` (`end_time`).
   - Bouton de sauvegarde dédié avec état de chargement et bouton pour réinitialiser aux horaires habituels du profil.
3. **Moteur Local-First & Transactional Outbox** :
   - Mise à jour ou création de l'enregistrement dans Dexie `db.availabilities`.
   - Écriture atomique dans `db.sync_outbox` (opération INSERT ou UPDATE).
   - Déclenchement de la synchronisation en arrière-plan `syncNow()` et actualisation des compteurs.
4. **Visualisation dans la Grille** :
   - Afficher les horaires journaliers spécifiques ou habituels directement sous le badge dans les cellules du tableau.
5. **Validation et Portes** : Portes G126 à G130 avec oracles exécutables.

### Résultats de Validation
- [x] G126 (Migration Supabase RLS `availabilities_write_manager` créée et appliquée)
- [x] G127 (Modale d'édition des horaires journaliers dans `AvailabilitiesView.vue`)
- [x] G128 (Sauvegarde transactionnelle Dexie + outbox fonctionnelle)
- [x] G129 (Affichage des horaires dans la grille du planning manager)
- [x] G130 (Compilation Vite en production sans régression)

---

## 7. Plan d'Exécution : Résolution Intégrale de l'Audit Next-Level-UI

Date : 2026-10-02  
Déclencheur : Demande utilisateur (« Ecrit un plan pour mettre en place toutes tes recommandations ») suite à l'audit `/next-level-ui`  
Statut : Terminé et Validé (Portes G131 à G136 validées, 100% de succès sur verify-gates.mjs --all, build de production conforme)  
Complexité : Élevée (15 findings, 15 fichiers impactés, discipline `unlazy`, portes de vérification G1 à G136 + build)

### 1. Périmètre

#### Fichiers en écriture :
- `src/components/shared/ToastContainer.vue` (Finding 1)
- `src/views/SettingsView.vue` (Findings 2, 8)
- `src/layouts/ManagerLayout.vue` (Findings 3, 6)
- `src/layouts/EmployeeLayout.vue` (Finding 3)
- `src/views/employee/CheckInView.vue` (Finding 4)
- `src/views/employee/CheckOutView.vue` (Finding 4)
- `src/views/manager/DashboardView.vue` (Finding 5)
- `src/views/manager/EmployeesView.vue` (Finding 5)
- `src/views/manager/TeamsView.vue` (Finding 5)
- `src/views/manager/PresencesView.vue` (Finding 7)
- `src/views/manager/LocationsView.vue` (Findings 11, 15)
- `src/views/employee/HomeView.vue` (Finding 14)
- `src/views/manager/AvailabilitiesView.vue` (Findings 9, 10, 12)
- `src/components/shared/SyncIndicator.vue` (Findings 10, 11, 13)
- `src/components/shared/SyncAlert.vue` (Findings 10, 11)
- `GATES.md` (consignation des preuves d'exécution)

#### Fichiers en lecture seule (référence / oracles) :
- `scripts/verify-gates.mjs`
- `.agents/rules/07-design-system.md`
- `.agents/rules/09-ui-copy-and-tone.md`
- `.agents/rules/06-animation-standards.md`
- `.agents/rules/02-frontend-conventions.md`

#### Hors périmètre explicite :
- Aucune modification de dépendance externe (`package.json` intact, règle inviolable).
- Aucune migration SQL / schéma de données Supabase (structures existantes préservées).

---

### 2. Décomposition en Lots Séquentiels

#### Lot 1 : Cibles d'Accessibilité WCAG AA, Toast & Sécurité Destructive (🔴 Critique)
1. **Étape 1.1 — Refonte accessible du Toast (`ToastContainer.vue`)** :
   - Agrandir la cible tactile de fermeture à 44×44 px (`min-h-11 min-w-11` ou padding tactile conforme WCAG AA).
   - Remplacer le glyphe brut `✕` par une icône vectorielle SVG (`aria-hidden="true"`).
   - Remplacer `shadow-md` par une bordure/surface M3 (`border border-base-300 shadow-sm`).
   - Restreindre l'animation CSS à `opacity` et `transform` (GPU composited only, éradication de `transition: all`).
   - *Vérification* : `node scripts/verify-gates.mjs --emojis`, `node scripts/verify-gates.mjs --shadows`, `node scripts/verify-gates.mjs --targets`.
2. **Étape 1.2 — Sécurisation de la Déconnexion (`SettingsView.vue`)** :
   - Encapsuler l'action "Se déconnecter" dans `ConfirmModal` (`openConfirmLogout`, confirmation explicite requise).
   - Restreindre la largeur du bouton à `w-full sm:max-w-64` conformément à la règle `10` (§ Largeur selon cardinalité).
   - *Vérification* : Relecture ciblée et test de non-déconnexion accidentelle.
3. **Étape 1.3 — Normalisation des Cibles de Tiroir (`ManagerLayout.vue` & `EmployeeLayout.vue`)** :
   - Retirer la classe `btn-sm` et supprimer `sm:min-h-10 sm:min-w-10` sur les boutons hamburger.
   - Fixer `class="btn btn-ghost btn-circle min-h-11 min-w-11 ..."` stable sur tous les écrans tactiles (< 840px).
   - *Vérification* : `node scripts/verify-gates.mjs --targets`, `node scripts/verify-gates.mjs --nav-docking`.

#### Lot 2 : Alignement des Oracles et Finitions Visuelles (🟡 Moyen / 🟢 Mineur)
4. **Étape 2.1 — En-tête et Synchronisation des Pointages (`PresencesView.vue`)** :
   - Ajouter le bouton « Actualiser » dans le slot `#actions` de `ManagerPageHeader` avec son icône de rafraîchissement et son spinner conditionnel.
   - Ajuster l'appel `syncNow(user?.id)` pour concorder avec l'oracle G72.
   - *Vérification* : `node scripts/verify-gates.mjs --presences-ui`, `node scripts/verify-gates.mjs --presences-localfirst`.
5. **Étape 2.2 — Titre canonique de la Gestion des Sites (`LocationsView.vue`)** :
   - Aligner l'en-tête sur `title="Gestion des Sites"` pour satisfaire G93.
   - Remplacer les formulations « valider son arrivée » par « enregistrer son arrivée » (règle `09`).
   - *Vérification* : `node scripts/verify-gates.mjs --manager-finish`, `node scripts/verify-gates.mjs --voice-conformance`.
6. **Étape 2.3 — Ordre Responsive de la Page d'Accueil Employé (`HomeView.vue`)** :
   - Appliquer les classes d'inversion croisée `order-2 md:order-1` / `order-1 md:order-2` sur DayCard et WeekSummaryCard.
   - *Vérification* : `node scripts/verify-gates.mjs --responsive`.
7. **Étape 2.4 — En-tête de la Page des Paramètres (`SettingsView.vue`)** :
   - Ajouter l'en-tête de page `h1` ("Paramètres") avec sous-titre contextuel ("Compte, préférences et options de l'appareil").
   - *Vérification* : `node scripts/verify-gates.mjs --settings-page`.

#### Lot 3 : Fluidité Comportementale : Anti-FOUC Dexie & Réassurance Hors-Ligne (🟡 Moyen)
8. **Étape 3.1 — Élimination du sursaut d'état vide (`DashboardView.vue`, `EmployeesView.vue`, `TeamsView.vue`)** :
   - Distinguer l'état initial non chargé (`raw === null` ou `raw === undefined`) de l'état vide confirmé (`raw.length === 0`).
   - Afficher un skeleton élégant (`animate-pulse`) ou un état de chargement léger tant que la première émission Dexie n'a pas été reçue.
   - Ne rendre `ManagerEmptyState` que lorsque les données ont été interrogées et confirmées vides.
   - *Vérification* : Relecture du cycle de vie et absence de flash au rafraîchissement.
9. **Étape 3.2 — Réassurance Hors-Ligne sur le Pointage (`CheckInView.vue`, `CheckOutView.vue`)** :
   - Afficher un encart d'information contextuel en cas de déconnexion réseau (`!navigator.onLine`), notifiant que le pointage est enregistré localement sur l'appareil et sera synchronisé automatiquement au retour de la connexion.
   - Remplacer `transition-all` par `transition-transform duration-150 motion-reduce:transform-none` sur les boutons de validation.
   - *Vérification* : `node scripts/verify-gates.mjs --voice-conformance`, `node scripts/verify-gates.mjs --motion-conformance`.
10. **Étape 3.3 — Désambiguïsation de Navigation (`ManagerLayout.vue`)** :
    - Renommer l'item de menu `/manager/employees` de « Équipe » en « Collaborateurs » (ou « Membres ») pour supprimer l'homonymie avec « Équipes ».
    - *Vérification* : `node scripts/verify-gates.mjs --manager-nav-icons`, `node scripts/verify-gates.mjs --drawer-parity`.

#### Lot 4 : Rigueur des Tokens M3 & Règle Éditoriale 09 (🟢 Mineur)
11. **Étape 4.1 — Normalisation M3 de la Modale de Créneau (`AvailabilitiesView.vue`)** :
    - Remplacer `shadow-lg` par `border border-base-300 shadow-sm`.
    - Remplacer les 4 occurrences de `text-[11px]` par `text-xs`.
    - Calibrer les boutons de pied de modale avec `min-h-11`, `active:scale-95 transition-transform duration-150` et icône SVG.
    - *Vérification* : `node scripts/verify-gates.mjs --manager-grammar`.
12. **Étape 4.2 — Nettoyage Typographique & Pluriels (`SyncIndicator.vue`, `SyncAlert.vue`)** :
    - Supprimer `shadow-2xs` sur `SyncIndicator.vue`.
    - Remplacer `text-[11px]` par `text-xs`.
    - Corriger les parenthèses de pluriel `mutation(s)` en formulant en clair selon la règle `09` §3.
    - Supprimer le couplage `btn-sm min-h-11` dans `SyncAlert.vue`.
    - *Vérification* : `node scripts/verify-gates.mjs --shadows`, `node scripts/verify-gates.mjs --tone-rule-registered`.

---

### 3. Critères d'Arrêt & Validation Globale

La tâche sera déclarée achevée lorsque :
1. `node scripts/verify-gates.mjs --all` passera avec **100 % de succès** (0 échec sur les 50+ portes, notamment G1, G3, G4, G8, G63, G72, G88, G93).
2. `npm run build` compilera sans erreur ni avertissement.
3. Toutes les cibles tactiles critiques respecteront 44×44 px minimum.
4. L'action de déconnexion sera protégée par `ConfirmModal`.
5. Le clignotement d'état vide (FOUC) sur les vues de gestion sera éradiqué.

### 4. Résultats d'Exécution
- [x] Oracle G131 (WCAG AA Toast, SVG et ombres) : Validé par G1, G3, G4.
- [x] Oracle G132 (Protection déconnexion et friction desktop) : Validé dans SettingsView.vue.
- [x] Oracle G133 (Cibles tactiles hamburger 44px) : Validé sur ManagerLayout.vue et EmployeeLayout.vue.
- [x] Oracle G134 (Oracles gestionnaire G63, G72, G93) : Validés à 100%.
- [x] Oracle G135 (Skeletons anti-FOUC) : Validé sur DashboardView.vue, EmployeesView.vue et TeamsView.vue.
- [x] Oracle G136 (Vérification intégrale et build) : Validé avec 100% de succès sur verify-gates.mjs --all et exit code 0 sur npm run build (117 modules).
- [x] Cohérence des icônes : Lieux/sites harmonisés avec MapPin, équipes harmonisées avec tracé de groupe, séparation claire Collaborateurs (individuel) vs Équipes (collectif).

---

# Plan : Configuration des Horaires Généraux d'Entreprise (Disponibilités & company_settings)

Date : 2026-10-02  
Déclencheur : Demande utilisateur (Option UI 2 dans Disponibilités + Piste Backend A `company_settings`)  
Statut : Terminé et Validé (Portes G137 à G142 validées, build de production conforme)

## 1. Périmètre & Fichiers cibles
- `supabase/migrations/20261002190000_create_company_settings.sql` (Migration UP)
- `supabase/migrations/20261002190000_create_company_settings_down.sql` (Migration DOWN)
- `src/lib/db.js` (Incrément version 2 Dexie.js + table locale `company_settings`)
- `src/composables/useSyncEngine.js` (Pull incrémental et support outbox `company_settings`)
- `src/types/database.types.d.ts` (Types TypeScript de la table `company_settings`)
- `src/lib/domain.js` (Cascade d'héritage d'horaire)
- `src/views/manager/AvailabilitiesView.vue` (Bouton d'en-tête, modale M3, réactivité locale)
- `GATES.md` (Oracles déterministes G137 à G142)

## 2. Décomposition des étapes
1. **Étape 1 : Création et application de la migration Supabase réversible** :
   - Table `company_settings` (singleton id fixe `'00000000-0000-0000-0000-000000000001'`).
   - Trigger `trg_company_settings_updated_at` utilisant `public.set_updated_at()`.
   - RLS active inconditionnellement, SELECT pour `authenticated`, UPDATE/INSERT pour managers/admins.
   - Application via Supabase MCP `execute_sql`.
2. **Étape 2 : Évolution du schéma Dexie.js (`src/lib/db.js`)** :
   - Préservation stricte de `version(1)`.
   - Déclaration de `version(2)` avec table locale `company_settings: 'id, updated_at, deleted_at'`.
3. **Étape 3 : Moteur de synchronisation (`src/composables/useSyncEngine.js`)** :
   - Ajout de `company_settings` dans le cycle de pull incrémental (`pullChanges`).
4. **Étape 4 : Modélisation des types TypeScript (`src/types/database.types.d.ts`)** :
   - Ajout de `company_settings` dans `Database['public']['Tables']`.
5. **Étape 5 : Domaine & Cascade d'horaires (`src/lib/domain.js`)** :
   - Utilitaires de résolution d'horaire prenant en compte `company_settings`.
6. **Étape 6 : Interface utilisateur dans Disponibilités (`src/views/manager/AvailabilitiesView.vue`)** :
   - Bouton « Horaires par défaut » dans l'en-tête (44px min, tokens M3).
   - Modale accessible avec saisie `time`, option de mise à jour des collaborateurs.
   - Transaction atomique Dexie + `sync_outbox`, notification toast, mise à jour réactive des cellules de planning.
7. **Étape 7 : Vérification et Oracles déterministes** :
   - Validation de G137 à G142, tests `verify-gates.mjs` et compilation `npm run build`.

---

# Plan : Cycle de Vie des Comptes, Confirmation de Session et Archivage Réversible

Date : 2026-10-02  
Déclencheur : Demande utilisateur (« Met en place toutes tes recommandations ») suite à l'analyse d'architecture  
Statut : Terminé et Validé (Portes G150 à G155 validées, build de production conforme, migration Supabase active)  
Complexité : Élevée (Multi-fichiers, cross-layer : migration SQL, RLS, pg_cron, Dexie v3, sync engine, types TS, vues Vue 3)

## 1. Périmètre & Fichiers cibles
- `supabase/migrations/20261002220000_account_lifecycle_and_session_confirmation.sql` (Migration UP)
- `supabase/migrations/20261002220000_account_lifecycle_and_session_confirmation_down.sql` (Migration DOWN)
- `src/types/database.types.d.ts` (Types TypeScript de `profiles`)
- `src/lib/db.js` (Incrément version 3 Dexie.js + préservation des versions 1 et 2)
- `src/composables/useSyncEngine.js` (Pull incrémental et push outbox pour statuts)
- `src/composables/useProfile.js` & `src/composables/useAuth.js` (Exposition du statut et contrôles JIT)
- `src/views/employee/PendingApprovalView.vue` (Nouvelle vue d'attente d'intégration collaborateur)
- `src/App.vue` (Routage conditionnel de la session collaborateur selon le statut)
- `src/views/manager/EmployeesView.vue` (Filtres de statut, boutons valider, archiver, désarchiver, décompte temporel)
- `GATES.md` & `scripts/verify-gates.mjs` (Oracles déterministes G150 à G155)

## 2. Décomposition des étapes
1. **Étape 1 : Migration Supabase réversible** :
   - Colonnes `status`, `confirmed_at`, `archived_at` avec valeur par défaut `active` pour les comptes existants puis `pending_validation` pour les futurs.
   - Triggers d'inscription `handle_new_user` configurés en `pending_validation`.
   - RLS `profiles_update_manager` pour autoriser managers/admins à valider/archiver/mettre à jour.
   - Procédure stockée `cleanup_expired_profiles()` (purge 7j non validés, désactivation 30j archivés) et planification `pg_cron`.
   - Application via Supabase MCP `execute_sql`.
2. **Étape 2 : Synchronisation des types TypeScript** :
   - Champs `status`, `confirmed_at`, `archived_at` ajoutés dans `database.types.d.ts`.
3. **Étape 3 : Évolution de la persistance locale Dexie (`src/lib/db.js`)** :
   - Déclaration de `version(3)` avec index sur `status`.
   - Méthode `.upgrade(tx)` initialisant les profils locaux existants à `status: 'active'`.
4. **Étape 4 : Moteur de synchronisation (`useSyncEngine.js`)** :
   - Ingestion et diffusion réactive du statut des profils.
5. **Étape 5 : Session collaborateur & Onboarding d'attente** :
   - Création de `PendingApprovalView.vue` (design M3, message sobre de réassurance, détails du profil, déconnexion).
   - Intégration dans `App.vue` pour les collaborateurs dont le statut est `pending_validation`.
6. **Étape 6 : Gestion des statuts dans l'espace Manager (`EmployeesView.vue`)** :
   - Filtres : Tous, Actifs, En attente, Archivés, Désactivés avec compteurs.
   - Actions : « Valider le compte » pour les comptes en attente, « Archiver » pour les comptes actifs (avec modale d'information 30j), « Désarchiver » pour les comptes archivés.
   - Indicateur de délai : mention des jours restants avant purge ou désactivation.
7. **Étape 7 : Validation déterministe** :
   - Vérification des oracles G150 à G155, exécution de `verify-gates.mjs --all` et compilation Vite `npm run build`.

## 3. Résultats de Validation

- Oracle G150 (Migrations SQL UP/DOWN et procédure de purge) : Validé.
- Oracle G151 (Schéma Dexie v3 et types TypeScript synchronisés) : Validé.
- Oracle G152 (Vue d'attente collaborateur et routage conditionnel sans jargon banni) : Validé.
- Oracle G153 (Filtres de statut et actions d'archivage/confirmation gestionnaire) : Validé.
- Oracle G154 (Intégration composables et contrôles Just-In-Time) : Validé.
- Oracle G155 (Exécution intégrale de verify-gates.mjs et compilation de production Vite) : Validé (code de sortie 0, dist/ sain).


