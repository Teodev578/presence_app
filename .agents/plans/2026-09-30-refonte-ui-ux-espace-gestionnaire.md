# Plan de refonte UI/UX : Espace gestionnaire

Date : 2026-09-30
Statut : livré le 2026-09-30, porté par les clauses G88 à G91 de `GATES.md`.

## 1. Objectif

Reprendre l'interface, l'expérience et la responsivité des modules de l'espace gestionnaire. La grammaire des deux écrans validés (`LocationsView.vue`, `PresencesView.vue`) sert de socle visuel, pas de fin. Chaque module est réexaminé pour son usage réel : ce que le gestionnaire vient y faire, ce qui l'empêche d'y arriver vite, et comment le module tient sur un téléphone de terrain, une tablette et un poste fixe.

## 2. Périmètre

### Écrans réécrits
- `src/views/manager/DashboardView.vue` (Tableau de bord de l'activité)
- `src/views/manager/EmployeesView.vue` (Gestion des Collaborateurs)
- `src/views/manager/TeamsView.vue` (Gestion des Équipes)
- `src/views/manager/AvailabilitiesView.vue` (Disponibilités de l'Équipe)
- `src/views/manager/ExportView.vue` (Export des Données)
- `src/components/manager/StatCard.vue`
- Socle commun extrait des écrans validés (voir section 5).

### Fichiers de référence et de preuve
- `.agents/rules/07-design-system.md` (section « Grammaire et responsivité de l'espace gestionnaire »)
- `scripts/verify-gates.mjs`, `scripts/verify-browser.mjs`
- `GATES.md`

### Hors périmètre
- La couche de données : lecture et écriture Dexie, Supabase, outbox. `EmployeesView.vue` et `TeamsView.vue` lisent Supabase en direct, et ce chantier ne change pas cette couche (question 3).
- Les composables, le schéma Dexie, les policies RLS, les ADR.
- La navigation et le tiroir (`ManagerLayout.vue`, `EmployeeLayout.vue`), traités par les lots précédents.
- L'espace employé.

## 3. Méthode

1. **Audit d'usage** : pour chaque écran, nommer le parcours réel du gestionnaire, les frictions constatées dans le code et le walkout `docs/walkout-ui-ux.md`, et le résultat visé.
2. **Spécification** : structure cible, états (chargement, vide, erreur), comportement responsive, interactions et accessibilité.
3. **Réalisation** : lots ordonnés, chacun avec sa clause `GATES.md`, son oracle source, son oracle navigateur et son contrôle négatif.
4. **Clôture** : `code-hygiene`, `npm run build`, suite `--all`.

## 4. Audit d'usage par écran

### 4.1 Tableau de bord de l'activité
Parcours : le gestionnaire ouvre l'application pour savoir où en est la journée, puis rejoint l'écran qui traite une anomalie.

Frictions constatées :
- Le KPI « Non pointés / Absents » (`DashboardView.vue:104-108`) se calcule par soustraction (`effectif - pointages du jour`) et mélange l'absence déclarée avec l'employé qui n'a pas encore pointé. Le statut `absent` stocké n'est jamais lu.
- `StatCard.vue` s'appuie sur `border-t-4 border-t-*` et un libellé `text-[11px]`, en dérive visuelle du bandeau KPI de `PresencesView`.
- Le tableau des derniers pointages n'a ni avatar, ni badge GPS sémantique (le code produit `±NaN m` quand la précision est absente), ni tri, ni représentation mobile.
- Aucun état de chargement structuré, aucun état vide actionnable.
- Les cartes KPI ne mènent nulle part alors qu'elles nomment une situation à traiter.

### 4.2 Gestion des Collaborateurs
Parcours : retrouver une personne, corriger son rôle, son équipe ou son heure attendue, archiver un départ.

Frictions constatées :
- Aucune recherche, aucun filtre, aucun compte. La liste complète s'affiche d'un bloc.
- Aucune représentation mobile : tableau à défilement horizontal (`docs/walkout-ui-ux.md:62-63`).
- Aucun tri.
- Modale en `input-sm`/`select-sm`/`btn-sm`, sous la cible de 44px, sans coque d'en-tête ni bouton de fermeture.
- Les erreurs Supabase partent dans `console.error` sans retour à l'écran.
- Le chargement et l'état vide sont deux lignes de texte sans action.

### 4.3 Gestion des Équipes
Parcours : structurer les pôles, voir qui les compose, créer, renommer ou désactiver une équipe.

Frictions constatées :
- Formulaire de création inline en `input-sm`/`btn-sm`, comprimé à côté du titre.
- Aucune recherche, aucun compte, aucun tri.
- Grille figée `md:grid-cols-2 lg:grid-cols-3`, sans adaptation fine.
- Aucun état vide actionnable.
- Renommage impossible, alors que l'archivage est à un clic sous une seule icône corbeille.
- Les erreurs partent dans `console.error`.

### 4.4 Disponibilités de l'Équipe
Parcours : confronter ce que l'équipe a déclaré disponible avec ce qui a été réellement pointé sur la semaine.

Frictions constatées :
- Navigation de semaine dans une carte flottante sans légende ni point de rattachement.
- Matrice dense : noms, dates et badges en `text-[10px]`/`text-[11px]`, défilement horizontal sur mobile sans colonne de nom figée.
- Aucune légende des états, alors que trois couleurs portent un sens (pointé, non pointé révolu, à venir).
- Aucune recherche par nom ni filtre par équipe.
- État vide sans action.

### 4.5 Export des Données
Parcours : produire un CSV de pointages pour la paie ou le suivi RH.

Frictions constatées :
- En-tête sans pastille, titre en `h2`.
- Champs en `input-sm`, sous la cible de 44px.
- Conteneur `max-w-xl` sans justification.
- Pas de presets de période, alors que `PresencesView` en propose quatre. Deux écrans voisins demandent la même plage de deux manières.
- Aucun aperçu du volume avant export, aucun état vide de période.

### 4.6 StatCard
Le composant porte une identité visuelle propre (`stats`, `border-t-4`) que le reste de l'espace n'utilise pas. Il crée une divergence là où un bandeau KPI unique suffirait.

## 5. Socle commun

### 5.1 Grammaire visuelle (relevée sur les écrans validés)
- En-tête : `flex flex-col sm:flex-row sm:items-center justify-between gap-4`, pastille `w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 text-primary`, titre `h1 text-2xl font-black tracking-tight`, sous-titre `text-xs text-base-content/60 mt-0.5`.
- Carte de filtres : `card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 flex flex-col gap-3`.
- Recherche : `label.input input-bordered w-full items-center gap-2 rounded-m3-md bg-base-300/50 min-h-11`, loupe 20px.
- Filtres : barre `join` scrollable horizontalement sur mobile, comptes annoncés, segment actif unique dominant, libellés via `fieldset`/`fieldset-legend` au-dessus du contrôle.
- État vide : `card ... p-8 text-center items-center`, pastille de situation `w-12 h-12 rounded-full bg-base-300`, titre `font-bold text-base`, message `text-sm text-base-content/60`, action utile au contexte.
- Modale : `modal-box rounded-m3-xl p-5 sm:p-6 bg-base-100 border border-base-300 shadow-sm`, champs `min-h-11` sans `input-sm`, actions `min-h-11`, fermeture `min-w-11 min-h-11`.
- Destructif : `ConfirmModal.vue`.
- Transversal : tokens M3 `rounded-m3-*`, élévation tonale, aucune `btn-sm`/`input-sm` sur les actions icône+texte, aucune taille de police arbitraire.

### 5.2 Composants partagés (option B, à confirmer en question 1)
Extraire seulement les blocs à duplication mécanique forte et contrat stable :
- `src/components/manager/ManagerPageHeader.vue` : titre, sous-titre, icône, slot d'actions. Utilisé par les cinq écrans et par `LocationsView`/`PresencesView` sans changer leur rendu.
- `src/components/manager/ManagerKpiCard.vue` : libellé, valeur, légende, ton, icône, état cliquable optionnel. Remplace `StatCard.vue` et unifie le bandeau de `DashboardView` avec celui de `PresencesView`.
- `src/components/manager/ManagerEmptyState.vue` : situation, icône, titre, message, action. Utilisé par les cinq écrans.

La carte de filtres et le tableau restent en convention écrite, leur variabilité étant réelle. Aucune abstraction de « DataTable » générique : elle masquerait plus qu'elle ne factorise.

### 5.3 États normalisés
Chaque écran expose trois états explicites :
- **Chargement** : ossature (skeleton `animate-pulse`) à la forme du contenu attendu, pour les tableaux comme pour les cartes. Le simple spinner centré disparaît.
- **Vide** : distinction entre « aucune donnée », « aucun résultat de recherche » et « aucun résultat pour ce filtre », chacune avec l'action qui débloque (créer, effacer la recherche, élargir le filtre).
- **Erreur** : bandeau `alert alert-error` avec le fait et une action « Réessayer », pour `EmployeesView` et `TeamsView` qui avalent aujourd'hui leurs erreurs.

## 6. Refonte par module

### 6.1 Tableau de bord de l'activité
Résultat visé : lire la journée d'un regard et rejoindre l'action en un geste.

- En-tête : pastille + titre + date du jour en clair (« Aujourd'hui, mercredi 30 septembre »).
- Bandeau KPI unifié sur `ManagerKpiCard` : Effectif actif, Pointés (présents, retards, journées terminées), En retard, Non pointés (effectif moins pointés). Chaque carte est cliquable vers `Présences`. Une note sous « Non pointés » distingue le non-pointage de l'absence déclarée.
- Cohérence sémantique : aligner les définitions sur `PresencesView` (le filtre décrit la session, le bandeau décrit les temps), et exposer le statut `absent` stocké au lieu de le fondre dans la soustraction.
- Activité récente : liste de fiches sous 640px, tableau balisé au-delà, avatar à initiales, site, arrivée, départ, durée avec les états « En cours » et « Départ manquant », badge GPS sémantique (garde anti `NaN`), statut, tri par en-tête, en-tête de carte avec compte et lien « Voir tous les pointages ».
- États : ossature de chargement, vide « Aucun pointage aujourd'hui » avec renvoi vers `Sites` et `Présences`.
- Actions d'en-tête : « Voir tous les pointages » en primaire, « Sites autorisés » en secondaire, sans `btn-sm`.

### 6.2 Gestion des Collaborateurs
Résultat visé : trouver une personne en quelques frappes et corriger son rattachement.

- En-tête : pastille + sous-titre.
- Carte de filtres : recherche pleine largeur (nom, email), segment de rôle avec comptes (Tous, Employés, Managers, Admins), sélecteur d'équipe avec légende.
- Présentation : fiches personne sous 640px (avatar, nom, email, équipe, rôle, heure), tableau triable au-delà (Nom, Email, Équipe, Rôle, Heure attendue, Actions).
- États : ossature, vide global, vide de recherche, vide de filtre, erreur avec réessai.
- Modale d'édition : coque `max-w-xl` avec en-tête à pastille et fermeture 44px, champs `min-h-11` sans `input-sm`, actions `min-h-11`, erreur en ligne doublée d'un toast.
- Archivage : `ConfirmModal` conservé, action portée par un libellé explicite plutôt qu'une icône seule.

### 6.3 Gestion des Équipes
Résultat visé : parcourir les pôles et agir sur chacun sans quitter l'écran.

- En-tête : pastille + action primaire « Nouvelle équipe » ouvrant une modale. Le formulaire inline disparaît.
- Modale de création et modale de renommage : coque commune, champ `min-h-11`, actions `min-h-11`.
- Carte de filtres : recherche par nom, tri par nom ou par effectif.
- Présentation : grille `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, carte portant le nom, le nombre de membres, les avatars, et un menu d'actions (Renommer, Archiver) au lieu de la corbeille seule.
- États : ossature, vide avec « Créer une équipe », erreur avec réessai.
- Archivage : `ConfirmModal` conservé.

### 6.4 Disponibilités de l'Équipe
Résultat visé : voir la semaine d'un collaborateur et l'écart entre disponibilité déclarée et pointage réel.

- En-tête : pastille + sous-titre.
- Carte de filtres : navigateur de semaine (légende « Semaine », flèches précédent/suivant, plage lisible) dans le gabarit `fieldset`, recherche par nom, filtre d'équipe.
- Légende des états sous la carte : Dispo pointé, Dispo non pointé, Dispo à venir.
- Présentation desktop : matrice à colonne de nom figée. Présentation mobile : une fiche par collaborateur, jours en lignes, pour supprimer le défilement horizontal. Seuil de bascule à confirmer (question 4).
- Synthèse haute : taux de disponibilité tenue sur la semaine, calculé localement.
- États : ossature, vide, vide de recherche, vide de filtre.

### 6.5 Export des Données
Résultat visé : produire le CSV de la bonne période sans hésiter sur les dates.

- En-tête : pastille + sous-titre.
- Carte de filtres : presets de période alignés sur `PresencesView` (Jour, Semaine, Mois, Personnalisé) puis Du/Au, dans le même gabarit `fieldset`.
- Aperçu : volume de pointages de la période, lu dans Dexie avant export, avec le cas vide annoncé.
- Champs `min-h-11`, carte pleine largeur plutôt que `max-w-xl` (question 5).
- Bouton d'export avec états chargement, succès (compteur) et échec.

### 6.6 StatCard
Remplacé par `ManagerKpiCard`, dont le gabarit est celui du bandeau KPI de `PresencesView`. `PresencesView` adopte le composant pour que les deux bandeaux partagent une seule source.

## 7. Responsivité

### 7.1 Seuils
Le projet ancre la navigation à 840px (`--breakpoint-docked`) et bascule les tableaux en fiches à 640px (`sm:`) sur les écrans validés. La règle 07 §7 annonce 600px pour la bascule carrousel vers grille, en écart avec le `sm:` de 640px réellement utilisé par `PresencesView`. Trancher l'alignement (question 4) avant d'écrire une règle contraire au code.

### 7.2 Règles de transformation par type de contenu
- Collections d'entités (équipes) : une colonne sous 640px, deux de 640 à 1024px, trois au-delà. Grille simple, pas de carrousel pour des cartes riches en texte.
- Tableaux de données : fiches empilées sous 640px, tableau balisé au-delà, colonne d'identité figée si le défilement subsiste.
- Matrices (disponibilités) : fiche par ligne sous 640px, matrice au-delà.
- Filtres : segments en défilement horizontal sur mobile, jamais empilés en colonne de huit boutons.
- En-têtes de page : empilés sous 640px, en ligne au-delà.

### 7.3 Cibles et accessibilité
- Cible tactile 44px minimum partout, 48px sur pointeur, 56dp sur mobile pour l'action principale.
- Focus visible `focus-visible:outline-2 focus-visible:outline-primary`.
- `aria-sort` sur les en-têtes triables, `aria-pressed` sur les segments, `aria-label` sur les icônes seules.
- `prefers-reduced-motion` déjà porté par `src/style.css`, aucune animation de `width`/`height` introduite.

## 8. Lots d'exécution

| Lot | Contenu | Fichiers | Priorité |
|---|---|---|---|
| 0 | Socle : grammaire et composants partagés (`ManagerPageHeader`, `ManagerKpiCard`, `ManagerEmptyState`), règle 07, ledger `GATES.md` | vues validées + composants + `verify-gates.mjs` | Haute |
| 1 | Tableau de bord : en-tête, KPI sémantiques, activité récente responsive et triable, états | `DashboardView.vue` | Haute |
| 2 | Collaborateurs : en-tête, recherche et filtres comptés, fiches mobiles, tri, modale conforme, erreurs | `EmployeesView.vue` | Haute |
| 3 | Équipes : en-tête, modales création/renommage, recherche, grille, menu d'actions, états | `TeamsView.vue` | Moyenne |
| 4 | Disponibilités : en-tête, filtre unifié, légende, fiche mobile par collaborateur, synthèse | `AvailabilitiesView.vue` | Moyenne |
| 5 | Export : en-tête, presets de période, aperçu du volume, cibles 44px | `ExportView.vue` | Basse |
| 6 | Audit, `code-hygiene`, build, suite complète | tous | Haute |

Compétences par lot : `ui-ux-pro-max` et `responsive-adaptive-ui` pour les lots 1 à 5, `vue-animation` si une transition est introduite, `unlazy` en discipline, `code-hygiene` au lot 6.

## 9. Vérification

- Source : `node scripts/verify-gates.mjs --manager-grammar` (en-tête, filtres, cibles) et un oracle par vue (`--dashboard-ui`, `--employees-ui`, `--teams-ui`, `--availabilities-ui`, `--export-ui`).
- Transversal : `--targets`, `--radii`, `--shadows`, `--emojis`, `--manager-dexie`.
- Rendu et interaction : extension de `scripts/verify-browser.mjs` pour monter chaque vue avec des données semées et mesurer en-tête, filtres, comptes, bascule fiches/tableau, cibles et états.
- Compilation : `node scripts/verify-gates.mjs --build`.
- Contrôle négatif exigé pour chaque nouvel oracle : un état de référence doit le faire échouer avant le correctif.

## 10. Questions à trancher avant le lot 0

1. **Abstraction** : copie du gabarit (option A) ou extraction de `ManagerPageHeader`, `ManagerKpiCard`, `ManagerEmptyState` (option B, recommandée) ?
2. **KPI** : remplacer `StatCard` par `ManagerKpiCard` et faire adopter le bandeau à `PresencesView`, ou n'aligner que le tableau de bord ?
3. **Local-first** : inclure la bascule Dexie de `EmployeesView`/`TeamsView` (et donc les erreurs réseau) dans ce chantier, ou rester strictement UI (recommandé) ?
4. **Seuil mobile** : aligner la bascule fiches/tableau sur 640px (précédent de `PresencesView`) ou introduire un jeton à 600px comme l'annonce la règle 07 ?
5. **Export** : conserver `max-w-xl` ou passer en pleine largeur ?
6. **Dashboard** : ajouter recherche et filtre, ou conserver l'aperçu sans filtre avec renvoi vers `Présences` (recommandé) ?
7. **Équipes** : rendre le renommage possible dans ce chantier, ou le différer (le schéma `teams` le permet, l'UI ne l'expose pas) ?

## 11. Critère d'arrêt

- Les cinq écrans partagent en-tête, carte de filtres à comptes, états chargement/vide/erreur explicites, présentation responsive (fiches sous 640px, tableau ou matrice au-delà), modales à cibles 44px.
- Les KPI du tableau de bord et des présences partagent une définition et un gabarit uniques.
- Aucune `btn-sm`/`input-sm` ni taille de police arbitraire sur les écrans traités.
- `npm run build` en sortie 0.
- `node scripts/verify-gates.mjs --all` vert, hormis les échecs préexistants hors périmètre (`G1`, `G3`, `G4` sur `ToastContainer.vue` et `SyncIndicator.vue`, `G8` sur `HomeView.vue`).
- Oracles navigateur verts sur chaque vue traitée.
