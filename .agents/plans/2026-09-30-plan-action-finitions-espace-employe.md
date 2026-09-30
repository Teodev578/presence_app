# Plan d'action : Finitions de l'espace employé

Date : 2026-09-30
Source : `docs/audits/audit-espace-employe-2026-09-30.md`, section 2.
Statut : proposition, quatre arbitrages en attente (section 6).

## 1. Objectif

Traiter les constats de l'audit employé pour supprimer les derniers détails qui cassent l'aspect professionnel : typographie française, tailles hors échelle, contraste des jours révolus, libellés tronqués ou coupés, cibles tactiles et vocabulaire.

## 2. Périmètre

### Fichiers écrits
- `src/components/employee/DayCard.vue`, `WeekSummaryCard.vue`, `WeekGrid.vue`, `GpsRing.vue`, `AvailabilitySummary.vue`, `CheckConfirmationOverlay.vue`
- `src/views/employee/CheckInView.vue`, `CheckOutView.vue`, `AvailabilitiesView.vue`, `HomeView.vue`
- `src/layouts/EmployeeLayout.vue` (marque dupliquée, si retenu)
- `scripts/verify-gates.mjs`, `scripts/verify-browser.mjs`, `GATES.md`

### Hors périmètre
- La logique de pointage, la transaction Dexie, l'outbox, la géolocalisation.
- La navigation par tiroir et le repli en rail, verrouillés par G40, G43, G45.
- Le verrouillage onepage et la pleine largeur du pointage sous 840 px, protégés par AGENTS.md n°5, sauf autorisation explicite.

## 3. Constats, priorité et vérification

| # | Constat | Priorité | Vérification |
|---|---|---|---|
| A1 | `capitalize` sur les dates françaises | Moyenne | `--employee-typography` |
| A2 | Tailles `text-[10px]`/`text-[11px]` hors échelle | Moyenne | `--employee-typography` |
| A3 | Vocabulaire divergent | Moyenne | `--employee-copy` + décision |
| B1 | Jours révolus à `opacity-45` | Moyenne | Oracle navigateur (contraste) |
| B2 | Placeholders non contrôlés | Basse | Oracle navigateur |
| C1 | Libellé de semaine coupé | Basse | `--employee-finish` |
| C2 | Tuile « Départs » tronquée | Basse | `--employee-finish` |
| C3 | Vides verticaux sur écran haut | Basse | Oracle navigateur |
| C4 | Sélecteur de lieu de travail sous 44 px | Moyenne | `--employee-targets` |
| C5 | Marque dupliquée sur desktop | Basse | Décision |
| D1 | Verrouillage onepage et hauteur courte | Moyenne | Autorisation explicite requise |

## 4. Lots d'exécution

### Lot 1 — Typographie et contraste
- Retirer `capitalize` des dates, ne conserver qu'une majuscule en tête de phrase.
- Remplacer `text-[10px]` et `text-[11px]` par `text-xs` dans les composants employé.
- Relever le contraste des jours révolus : surface désactivée et texte lisible, case non modifiable.
- Contraster les placeholders à 4.5:1.
Fichiers : les six composants, `CheckInView.vue`, `CheckOutView.vue`, `WeekGrid.vue`.
Oracles : `--employee-typography`, extension navigateur.

### Lot 2 — Densité, libellés et cibles
- Empêcher la coupure du libellé de semaine.
- Raccourcir le libellé de la tuile « Départs » pour supprimer la troncature.
- Borner la hauteur des panneaux sur écran haut (DayCard, CheckIn).
- Passer le sélecteur de lieu de travail à `min-h-11`.
Fichiers : `WeekGrid.vue`, `WeekSummaryCard.vue`, `DayCard.vue`, `CheckInView.vue`.
Oracles : `--employee-finish`, `--employee-targets`, extension navigateur.

### Lot 3 — Vocabulaire
- Appliquer les termes retenus : « Arrivée » et « Départ » sur les pages, « Pointage » en navigation, « En cours » partout, « Mes disponibilités » en navigation et en page.
Fichiers : `DayCard.vue`, `WeekSummaryCard.vue`, `CheckOutView.vue`, `AvailabilitiesView.vue`, `EmployeeLayout.vue`.
Oracles : `--employee-copy`, `--voice-conformance`.

### Lot 4 — Marque dupliquée (si retenu)
- Aligner l'espace employé sur le choix retenu pour l'espace gestionnaire.
Fichier : `EmployeeLayout.vue`.
Oracle : `--manager-grammar` (référence) ou `--employee-finish`.

### Lot 5 — Verrouillage onepage (si autorisé)
- Ajouter un défilement de secours sur hauteur courte, sans toucher au seuil de 840 px ni à la pleine largeur du pointage.
Fichier : `EmployeeLayout.vue`, `src/style.css`.
Oracle : `--nav-docking`, oracle navigateur de hauteur.

### Lot 6 — Clôture
- `node scripts/verify-gates.mjs --all` vert hors échecs préexistants.
- `CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs` vert.
- `npm run build` en sortie 0.
- `code-hygiene`.

## 5. Critère d'arrêt

- Les constats de l'audit sont traités, chacun livré ou acté par une décision.
- Aucune taille de police arbitraire, aucune date capitalisée à tort, aucune troncature de libellé.
- Les cibles tactiles du pointage tiennent 44 px.
- Oracles existants verts, chaque nouvelle règle dotée d'un contrôle négatif.
- `npm run build` en sortie 0, `--all` sans nouvelle régression.

## 6. Arbitrages actés le 2026-09-30

1. **Vocabulaire** : « Arrivée / Départ » sur les pages, « Pointage » en navigation, « En cours » partout, « Ma disponibilité » (et non « Mes disponibilités »).
2. **Bandeau et pied** : le bandeau nomme l'espace et le module courant dans les deux espaces ; le pied de tiroir est vidé de ses réglages et ne garde que le statut réseau ; l'apparence, le compte et la déconnexion migrent sur la page Paramètres, accessible par l'engrenage du bandeau.
3. **Onepage** : verrou maintenu quand la hauteur suffit, défilement de secours sous 760 px de haut.
4. **Densité desktop** : les cartes s'étirent par ligne, le contenu interne est borné.

### État des lots

- Lot 1 : livré (typographie, contraste).
- Lot 2 : livré (semaine équilibrée, tuile « Tous », panneau borné, sélecteur à 44 px).
- Lot 3 : livré (vocabulaire).
- Lot 4 : livré (bandeau nommant l'espace et le module, page Paramètres dédiée, pied de tiroir vidé au profit de la page, apparence comprise).
- Lot 5 : livré (repli onepage hybride).
- Lot 6 : clôture effectuée, portes G94 et G95 vertes.

## 7. Disciplines attachées

- `unlazy` : clause `OWNS:` et preuves dans `GATES.md` avant chaque lot.
- `ui-ux-pro-max` et `responsive-adaptive-ui` : lots 1 et 2.
- `stop-slop` et `09-ui-copy-and-tone.md` : lot 3.
- `code-hygiene` : lot 6.
