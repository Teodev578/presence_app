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


