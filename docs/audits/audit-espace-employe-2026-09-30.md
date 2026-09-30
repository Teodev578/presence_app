# Audit UI/UX de l'espace employé

Date : 2026-09-30
Périmètre : `src/layouts/EmployeeLayout.vue`, les quatre vues `src/views/employee/`, les six composants `src/components/employee/`, et les composants partagés qu'ils consomment.
Statut : constat. Aucun correctif appliqué à ce stade, le plan d'action associé attend les arbitrages.

## 1. Méthode

- Lecture du code des vues et composants employé.
- Rendu headless de l'application réelle (Chrome headless, sonde montant `EmployeeLayout` et les vues, données Dexie semées) en thème sombre à 1440 px et 390 px, plus un rendu clair.
- Recherches sur la typographie française, l'accessibilité WCAG 2.2 et les usages des applications de pointage mobile.
- Contrôle déterministe par `scripts/verify-gates.mjs` et `scripts/verify-browser.mjs`.

## 2. Constats

| # | Constat | Gravité | Statut |
|---|---|---|---|
| A1 | `capitalize` appliqué aux dates françaises : « Mercredi 30 Septembre » (DayCard), « Votre Semaine » (WeekSummaryCard), « 28 Sept. », « 30 Sept. » (WeekGrid). Les noms de jours et de mois s'écrivent en minuscules, sauf en tête de phrase. | Moyenne | Proposé |
| A2 | Tailles de police arbitraires `text-[10px]` et `text-[11px]` dans huit fichiers employé (DayCard, WeekSummaryCard, WeekGrid, GpsRing, CheckInView, CheckOutView, AvailabilitySummary, CheckConfirmationOverlay). La règle 07 §5 les interdit. | Moyenne | Proposé |
| A3 | Trois mots pour une même notion : « En cours » (WeekSummaryCard) contre « En cours de service » (CheckOutView) ; « Partager ma disponibilité cette semaine » (DayCard) contre « Mes disponibilités » (navigation) ; « Pointage de présence » (navigation) contre « Valider mon arrivée » (page). | Moyenne | Proposé, décision requise |
| B1 | Jours révolus de la grille de disponibilités à `opacity-45` : le texte informatif (« Passé », date) tombe sous le seuil de lisibilité. Un contrôle inactif est exempté, le texte qu'on lit ne l'est pas. | Moyenne | Proposé |
| B2 | Placeholders (note de disponibilité, champs de recherche) non contrôlés : WCAG exige 4.5:1 pour un texte de substitution, non exempté. | Basse | Proposé |
| C1 | Libellé de semaine coupé en deux dans WeekGrid : « Semaine du 28 septembre au 2 / octobre 2026 ». | Basse | Proposé |
| C2 | Tuile « Départs » tronquée sur mobile : « Tous enregistr… » au lieu de « Tous enregistrés ». | Basse | Proposé |
| C3 | Grandes zones vides sur écran haut : la carte du jour et l'écran de pointage étirent leur contenu (`justify-between` sur `flex-1`), le contenu se dilate verticalement à 900 px. | Basse | Proposé |
| C4 | Sélecteur « Autre lieu de travail » en `select-xs` dans CheckInView : cible tactile sous 44 px. | Moyenne | Proposé |
| C5 | Marque « PresenceApp » affichée deux fois sur desktop (bandeau et barre latérale). Héritage commun avec l'espace gestionnaire. | Basse | Proposé, décision requise |
| D1 | Verrouillage onepage `md:h-screen md:overflow-hidden` : sur une hauteur courte (portable 768p, zoom d'accessibilité), le bas des cartes peut être coupé. | Moyenne | Soumis à autorisation explicite (garde-fou AGENTS.md n°5) |
| E1 | Focus visible et `role=checkbox` des jours : conformes, à préserver. | — | Constat |

## 3. Propositions

1. **Retirer `capitalize` des dates** et n'appliquer une majuscule qu'à la première lettre du titre de phrase. Concerne DayCard, WeekSummaryCard, WeekGrid.
2. **Rentrer les tailles arbitraires dans l'échelle** : remplacer `text-[10px]` et `text-[11px]` par `text-xs`, la densité se réglant par l'espacement et le poids, non par une taille hors échelle.
3. **Un seul terme par notion** (voir section 4).
4. **Relever le contraste des jours révolus** : remplacer `opacity-45` par une surface désactivée et un texte à contraste suffisant, la case restant clairement non modifiable.
5. **Contraster les placeholders** à 4.5:1 minimum.
6. **Empêcher la coupure du libellé de semaine** : `whitespace-nowrap` avec une taille adaptée, ou libellé court.
7. **Corriger la troncature de la tuile Départs** : libellé court (« Tous », « 1 manquant »).
8. **Borner la hauteur des panneaux sur écran haut** pour supprimer les vides verticaux.
9. **Passer le sélecteur de lieu de travail à 44 px** (`min-h-11`).
10. **Marque dupliquée sur desktop** : aligner sur le choix retenu pour l'espace gestionnaire.
11. **Verrouillage onepage** : à conserver sauf autorisation explicite, le garde-fou AGENTS.md n°5 protégeant la pleine largeur et le onepage du pointage.

## 4. Terminologie

| Notion | Terme retenu | Terme écarté | Raison |
|---|---|---|---|
| Acte de pointage sur la page | Pointage d'arrivée / Pointage de départ | Valider mon arrivée | « Valider » signifie approuver un fait ; le salarié enregistre un fait. « Pointage d'arrivée » nomme l'enregistrement. |
| État d'une session ouverte | En cours | En cours de service | Un seul mot pour une notion, employé déjà par le tableau de bord. |
| Disponibilités | Mes disponibilités | Partager ma disponibilité | Le libellé nomme l'objet, pas l'action ; la navigation et la page partagent le même mot. |
| Journées et mois | lundi, septembre | Lundi, Septembre | Noms communs en minuscules, sauf en tête de phrase (Académie française). |

## 5. Bonnes pratiques retenues

- **Applications de pointage** : le geste de pointage doit tenir en un ou deux appuis, l'état courant doit se lire d'un regard, et le départ manquant doit être rendu comme un fait constaté. L'application respecte ces trois règles. Sources : Workforce.com, Homebase, ShiftFlow.
- **Contraste WCAG 2.2** : 4.5:1 pour le texte courant, 3:1 pour le grand texte et les composants d'interface (bordures, anneaux de focus, interrupteurs). Les contrôles inactifs sont exemptés, mais la lisibilité d'un texte informatif reste exigée. Sources : MDN, W3C WAI 1.4.3 et 1.4.11.
- **Placeholders** : non exemptés du contraste, à traiter comme du texte lu. Source : AccessScan, WCAG.
- **Typographie française** : jours et mois en minuscules, la marque du pluriel s'applique (« des lundis »). Source : Académie française, BDL OQLF.

## 6. Vérification prévue

- Oracles source : `--employee-typography` (tailles et `capitalize`), `--employee-finish` (libellés et densité), `--employee-targets` (cible du sélecteur).
- Oracle navigateur : extension du banc pour monter DayCard, WeekSummaryCard et WeekGrid, en thème sombre, et mesurer contraste, troncature et coupure.
- `npm run build` en sortie 0, `--all` sans nouvelle régression.

## 7. Références

- Académie française, « Majuscules aux noms de jours et de mois ».
- Office québécois de la langue française, BDL, règles générales d'emploi de la majuscule.
- MDN, « Color contrast » ; W3C WAI, critères 1.4.3 et 1.4.11.
- Workforce.com, Homebase, ShiftFlow, TimeClick : parcours de pointage mobile.
- `.agents/rules/07-design-system.md` §5 (échelle typographique) et §7 (responsivité) ; `.agents/rules/09-ui-copy-and-tone.md`.
