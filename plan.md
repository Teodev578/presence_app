# Plan de reprise UI/UX : Contrôle des Présences

Fichier de travail pour l'équipe de sous-agents. Il fixe les incohérences relevées sur l'écran
`src/views/manager/PresencesView.vue` (route `#/manager/presences`), la correction retenue pour
chacune et l'ordre d'exécution. Le commanditaire a validé le constat à l'écran le 29/09/2026.

## Périmètre

- Cœur : `src/views/manager/PresencesView.vue` (filtres, KPI, tableau, états vides).
- Annexe : `src/components/shared/StatusBadge.vue`, `src/lib/dateUtils.js`.
- Oracles : `scripts/verify-gates.mjs`, `scripts/verify-browser.mjs`, `GATES.md`.
- Hors périmètre : la logique de chargement Dexie/Supabase, l'outbox, la modale de correction et
  toute la navigation (garde-fous AGENTS.md n°5). Aucun changement de dépendance.

## Règles applicables

- `.agents/rules/07-design-system.md` : libellé au-dessus du champ (§7), échelle typographique sans
  taille arbitraire (§5), échelle `rounded-m3-*` (§4), sémantique des couleurs (§2).
- `.agents/rules/09-ui-copy-and-tone.md` : le libellé nomme la catégorie, le chiffre énonce le fait
  (§3), un seul mot par notion (§3).
- Discipline `unlazy` : chaque lot ouvre sa clause `OWNS:` dans `GATES.md` avec `CHECK:`, `EXPECT:`,
  `EVIDENCE:` avant toute modification.
- Compétences par lot : `ui-ux-pro-max` pour les lots 1 et 3, `responsive-adaptive-ui` pour le lot 4,
  `code-hygiene` en clôture. Contrôle final : `npm run build` en sortie 0.

---

## A. Filtre de période

### A1. L'ancre calendaire disparaît en Semaine et en Mois — priorité haute

`filterDate` sert d'ancre aux presets (`PresencesView.vue:41-58`) mais le champ de date n'est rendu
qu'en mode Jour (`:498-501`). En Semaine et en Mois, seul `periodLabel` s'affiche (`:516-518`).
Une date choisie en Jour pilote donc la semaine ou le mois affichés sans jamais être visible, et
changer de semaine suppose de repasser par Jour.

Correction : chaque mode expose son ancre dans le même gabarit.
- Jour : champ date, libellé « Date ».
- Semaine : navigation précédent/suivant avec la plage lisible (« 28 sept. → 4 oct. »).
- Mois : navigation précédent/suivant avec le mois lisible (« Septembre 2026 »).
- Personnalisé : champs « Du » / « Au » inchangés.

Les flèches de navigation l'emportent sur `input[type=week]` et `input[type=month]`, dont le rendu
varie selon les navigateurs. La logique `dateRange` (`:41-61`) reste intacte : seule la saisie de
l'ancre change.

### A2. Trois gabarits de libellé dans une même carte — priorité haute

`Période :` et `Statut :` s'affichent à gauche de leur contrôle (`:460`, `:523`). `Date :`, `Du :`,
`Au :` s'affichent au-dessus via `fieldset-legend` (`:499`, `:506`, `:510`). La plage calculée en
Semaine/Mois n'a aucun libellé (`:516`). La règle 07 §7 impose le libellé au-dessus du champ.

Correction : un motif unique, libellé au-dessus, pour les cinq blocs (Période, ancre, Du, Au,
Statut). Le `fieldset` reste le conteneur sémantique.

### A3. Le groupe Statut flotte verticalement — priorité moyenne

`sm:self-end` (`:522`) cale Statut en bas quand la colonne Période est haute, au centre quand elle
est basse. Sur la capture, « Statut : » se retrouve à mi-hauteur du champ de date.

Correction : aligner les deux groupes sur une ligne commune, ou passer Statut en pleine largeur sous
la période. Trancher avec le design (Chloé) avant implémentation.

### A4. Ponctuation des libellés inégale — priorité basse

Les libellés portent un deux-points (`Date :`, `Période :`, `Statut :`) alors que les en-têtes de
colonnes et le sous-titre d'écran n'en portent pas. Le deux-points se retire des libellés de champ.

---

## B. Vocabulaire et comptes

### B1. Trois mots pour une même notion : la journée close — priorité haute

Le bandeau dit « Départs validés » puis « Journées clôturées » (`:431`, `:434`), le filtre dit
« Terminés » (`:555`), le badge dit « Terminé » (`StatusBadge.vue:21`).

Correction : le mot porté par `StatusBadge` fait foi : « Terminé ». Déclinaison : KPI « Journées
terminées », filtre « Terminés », colonne « Départ » gardée pour le temps saisi.

### B2. Les comptes KPI contredisent les comptes de filtres — priorité haute

- `stats.onTime` compte `present + completed` (`:148`) alors que `statusCounts.present` compte
  `present` seul (`:157`).
- `stats.late` compte `late + completed_late` (`:149`) contre `late` seul (`:158`).
- `stats.completed` compte toute ligne dotée d'un `check_out_time` (`:150`) contre
  `completed + completed_late` (`:159`).

Deux bandeaux voisins annoncent des chiffres différents pour des libellés voisins, et le clic sur
« Présents » n'affiche pas les lignes qui ont nourri « À l'heure ».

Correction : deux sémantiques possibles, une seule à retenir et à documenter dans `GATES.md`.
- Option 1 (recommandée) : le filtre de statut décrit la session (`present`, `late`, `completed`,
  `absent`), le bandeau KPI décrit les temps (ponctualité, clôture). Chaque libellé dit alors sa
  source, et les sous-titres des cartes KPI portent la nuance.
- Option 2 : aligner strictement les deux calculs sur `statusCounts`.

### B3. « Total pointés » — priorité moyenne

Libellé elliptique (`:408`), forme verbale qui nomme mal la catégorie (règle 09 §3). Retenir
« Pointages ».

### B4. Le statut Absent manque au filtre — priorité moyenne

`absent` existe dans `StatusBadge.vue:22-23` et dans le sélecteur de correction
(`PresencesView.vue:735-741`) mais pas dans les segments du filtre (`:524-557`). Une ligne « Absent »
n'est atteignable que par « Tous ». Ajouter le segment ou acter son exclusion dans `GATES.md`.

---

## C. Hiérarchie visuelle et détails

### C1. « Actualiser » existe en double — priorité moyenne

En-tête (`:392-401`) et état vide (`:579-585`), ce dernier en `btn-primary`, donc l'action la plus
voyante de l'écran revient à une situation transitoire.

Correction : garder l'actualisation dans l'en-tête. L'état vide propose l'action utile au contexte
déjà calculée dans `emptyState` (`:263-286`) : « Effacer la recherche », « Voir tous les pointages ».
Pour « Aucun pointage », un rafraîchissement secondaire ou pas d'action.

### C2. L'état vide reprend l'icône du titre — priorité basse

Même tracé SVG en `:380-381` et `:571-574`. L'état vide porte une icône de situation : calendrier
vide pour la période, loupe barrée pour la recherche.

### C3. Formats de date disparates — priorité moyenne

Champ natif `29/09/2026` (`:500`), `periodLabel` en « Mar. 29 sept. » (`formatWorkDate`,
`dateUtils.js:111-123`), colonne Date du tableau sur le même helper abrégé.

Correction : un format lisible unique pour les libellés de période et de tableau
(« 29 septembre 2026 », semaine « 28 sept. → 4 oct. »). Le format natif reste réservé aux champs de
saisie. Étendre `formatWorkDate` d'un variant long plutôt que dupliquer la logique.

### C4. `text-[11px]` hors échelle typographique — priorité basse

Quatre occurrences (`:410`, `:418`, `:426`, `:434`). La règle 07 §5 interdit les tailles
arbitraires. Remplacer par `text-xs` ou une valeur de l'échelle définie dans `src/style.css`.

### C5. Deux groupes `btn-primary` concurrents — priorité basse

Période (`:465`) et Statut (`:528`) saturent tous deux leur segment actif en `btn-primary`. Deux
sélections de même poids se disputent l'attention dans une même carte. Faire varier : le filtre
dominante garde `btn-primary`, l'autre groupe adopte un segment actif atténué. Trancher avec le
design.

### C6. Placeholder de recherche trop chargé — priorité basse

`« Rechercher un collaborateur (nom, email ou site)... »` (`:451`) cumule consigne, liste de champs
et points de suspension. Retenir « Rechercher un nom, un email ou un site ».

---

## D. Responsive

### D1. Tableau à défilement horizontal sous 640px — priorité moyenne

Neuf colonnes dans `overflow-x-auto` (`:590-693`). `docs/walkout-ui-ux.md:63,93` documente la gêne
et recommande des fiches synthétiques sous 640px. Le lot G65 a acté le défilement en attendant.

Correction : fiches synthétiques sous 640px (identité, site, temps, statut), tableau à partir de
640px. Compétence `responsive-adaptive-ui` obligatoire sur ce lot.

### D2. Filtres empilés sur mobile — priorité moyenne

Les deux barres `join` passent en `join-vertical w-full` (`:461`, `:524`) : huit boutons de 44px
empilés avant toute donnée.

Correction : segments scrollables horizontalement sur mobile, ou menu déroulant pour Statut. La
période reste segmentée. Aucune cible sous 44px (règle 07 §7).

---

## Lots d'exécution

| Lot | Contenu | Fichiers | Priorité |
|---|---|---|---|
| 1 | Grammaire du filtre de période (A1, A2, A3, A4) | `PresencesView.vue`, `verify-gates.mjs` | Haute |
| 2 | Vocabulaire et comptes unifiés (B1, B2, B3, B4) | `PresencesView.vue`, `StatusBadge.vue`, `verify-gates.mjs` | Haute |
| 3 | Hiérarchie et détails (C1 à C6) | `PresencesView.vue`, `dateUtils.js` | Moyenne |
| 4 | Responsive (D1, D2) | `PresencesView.vue` | Moyenne |

Contraintes communes à chaque lot :

1. Ouvrir la clause `OWNS:` du lot dans `GATES.md` avant d'éditer, avec `Scope:`, `CHECK:`, `EXPECT:`
   et `EVIDENCE:` à remplir après exécution.
2. Étendre les oracles existants plutôt que d'en créer de parallèles : `--presences-period` couvre
   A1, A2, A4 ; `--presences-ui` couvre B1, B3, C1, C2, C6 ; `--presences-table` couvre D1. Contrôle
   négatif de chaque oracle exigé.
3. La règle 09 §4 impose de mettre à jour les oracles qui asservissent un texte modifié
   (`scripts/verify-browser.mjs`, `BANNED_VOICE_TERMS`).
4. `npm run build` en sortie 0 avant de clore un lot, suite `--all` verte avant de clore le chantier.
5. Ne toucher ni à `loadPresences`, ni à `saveEdit`, ni aux ADR 0001 à 0004.

## Questions à trancher avant le lot 2

- Sémantique des KPI : option 1 (temps de travail vs session) ou option 2 (alignement strict) ?
  Concerne B2.
- Segment « Absent » dans le filtre de statut : ajout ou exclusion actée ? Concerne B4.
- Groupe Statut : aligné sur la période ou en pleine largeur ? Concerne A3.
