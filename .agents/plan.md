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
