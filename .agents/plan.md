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
