# Plan d'action : Finitions de l'espace gestionnaire

Date : 2026-09-30
Source : `docs/audits/audit-espace-manager-2026-09-30.md`, section 3 (propositions validées).
Statut : proposition prête à exécuter, deux arbitrages en attente (section 6).

## 1. Objectif

Traiter les huit propositions de l'audit pour supprimer les derniers détails qui cassent l'aspect professionnel de l'espace gestionnaire : hiérarchie des titres, taille des icônes du rail, lisibilité des KPI, cohérence du vocabulaire, focus clavier et distinction des états vides.

## 2. Périmètre

### Fichiers écrits
- `src/layouts/ManagerLayout.vue` (focus des entrées, éventuel titre de bandeau)
- `src/style.css` (icônes du rail à 22px, si retenu)
- `src/components/manager/ManagerKpiCard.vue` (KPI sans valeur numérique)
- `src/views/manager/DashboardView.vue` (grille KPI)
- `src/views/manager/AvailabilitiesView.vue` (grille KPI, états vides, message « & Lieux » côté titre)
- `src/views/manager/LocationsView.vue` (titre de page)
- `scripts/verify-gates.mjs`, `scripts/verify-browser.mjs`, `GATES.md`

### Hors périmètre
- La couche de données, les composables, les policies RLS.
- L'espace employé.
- La structure de navigation et le repli en rail, déjà verrouillés par les portes G40, G43, G45, G49.

## 3. Propositions, priorité et vérification

| # | Proposition | Priorité | Vérification |
|---|---|---|---|
| 1 | Titre dupliqué entre le bandeau supérieur et le H1 de page (décision) | Moyenne | Oracle de grammaire ou navigateur selon l'arbitrage |
| 2 | Icônes du rail à 22px au lieu de 20px | Moyenne | `--sidebar-rail` (browser) et contrôle CSS |
| 3 | Valeur KPI « Taux de tenue » réduite à un tiret | Basse | `--manager-grammar` ou oracle dédié |
| 4 | Grille KPI des disponibilités en trois colonnes sous 640px | Basse | `--manager-responsive` (extension) |
| 5 | « & Lieux » redondant avec « Sites » | Basse | Relecture, oracle si un libellé est asservi |
| 6 | Focus clavier absent sur les entrées de navigation | Moyenne | Oracle source + `--targets` |
| 7 | États vides de la matrice de disponibilités indistincts | Moyenne | Oracle source, comme Présences et Collaborateurs |
| 8 | Tri absent (assumé) de la matrice de disponibilités | Basse | Décision, actée ou documentée |

## 4. Lots d'exécution

### Lot 1 — Finitions visuelles sûres
Contenu : propositions 2, 3, 4, 6.
- Rail : icônes à 22 px via une règle confinée à la media query de 840 px dans `src/style.css` (`.drawer-rail .rail-entry svg`), cible inchangée.
- KPI : `ManagerKpiCard` accepte une valeur textuelle sans chiffre ; « Taux de tenue » affiche « Aucun jour révolu » plutôt qu'un tiret isolé.
- Grille : les KPI des disponibilités passent en `grid-cols-2 sm:grid-cols-3` pour s'aligner sur le tableau de bord et les présences.
- Focus : `focus-visible:outline-2 focus-visible:outline-primary` ajouté aux entrées `rail-entry`.
Fichiers : `ManagerLayout.vue`, `style.css`, `ManagerKpiCard.vue`, `AvailabilitiesView.vue`, `verify-gates.mjs`.
Oracles : `--manager-grammar`, `--manager-responsive`, `--sidebar-rail`, `--targets`.

### Lot 2 — Vocabulaire et hiérarchie des titres
Contenu : propositions 1 et 5 (décisions requises).
- Retirer « & Lieux » du titre de page et du libellé de navigation : « Sites » d'un côté, « Gestion des sites » de l'autre.
- Trancher le doublon de titre. Option A : garder le H1 de page et réduire le bandeau à la marque sur desktop. Option B : garder le titre de bandeau et supprimer le H1 visuel des pages, en conservant un h1 masqué pour les lecteurs d'écran.
Fichiers : `LocationsView.vue`, `AvailabilitiesView.vue`, `ManagerLayout.vue` selon l'option.
Oracles : `--manager-grammar` (en-tête h1), `--drawer-shared-grammar`, `--locations-*`.

### Lot 3 — États et cohérence des tableaux
Contenu : propositions 7 et 8.
- Distinguer « aucune équipe » de « filtre sans résultat » dans la matrice de disponibilités, avec les actions adaptées, comme sur Présences et Collaborateurs.
- Acter le tri de la matrice : option A, assumer l'absence de tri et le documenter dans le message ou l'infobulle ; option B, rendre la matrice triable par nom.
Fichiers : `AvailabilitiesView.vue`, `verify-gates.mjs`.
Oracles : `--manager-responsive`, oracle d'états vides.

### Lot 4 — Clôture
- `node scripts/verify-gates.mjs --all` vert hors échecs préexistants.
- `CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs` vert.
- `npm run build` en sortie 0.
- `code-hygiene` : code mort, imports, console.

## 5. Critère d'arrêt

- Les huit propositions sont traitées, chacune soit livrée, soit actée par une décision consignée.
- Les KPI, les titres et les libellés suivent une seule convention par notion.
- Les oracles existants restent verts, et chaque nouvelle règle reçoit son contrôle négatif.
- `npm run build` en sortie 0, `--all` sans régression.

## 6. Arbitrages actés le 2026-09-30

1. **Titre dupliqué** : option A. Le H1 de page est conservé, le bandeau supérieur gestionnaire se réduit à la marque et au hamburger.
2. **Tri de la matrice de disponibilités** : la colonne Collaborateur devient triable par nom, croissant puis décroissant, avec `aria-sort`.
3. **« Sites » seul** : « & Lieux » retiré de la navigation et du titre de page.

## 7. Disciplines attachées

- `unlazy` : clause `OWNS:` et preuves dans `GATES.md` avant chaque lot.
- `ui-ux-pro-max` et `responsive-adaptive-ui` : lots 1 à 3.
- `stop-slop` : libellés et messages.
- `code-hygiene` : lot 4.
