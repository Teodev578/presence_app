# Audit UI/UX de l'espace gestionnaire

Date : 2026-09-30
Périmètre : `src/layouts/ManagerLayout.vue`, les sept vues `src/views/manager/`, et les composants partagés qu'elles consomment (`ThemeToggle`, `ConfirmModal`, `StatusBadge`, `ManagerPageHeader`, `ManagerKpiCard`, `ManagerEmptyState`).
Statut des correctifs : appliqués et vérifiés pour les points marqués « corrigé » ; le reste attend un arbitrage.

## 1. Méthode

- Lecture du code des sept écrans, du tiroir gestionnaire et des composants partagés.
- Rendu headless de l'application réelle (Chrome headless, sonde locale montant `ManagerLayout` et la vue Disponibilités) en thème sombre à 1440 px, 900 px (rail) et 390 px (tiroir mobile), plus un rendu clair pour comparaison.
- Recherches sur des sources de conception d'interface : Material Design 3, WTW Software Design System, ux-patterns-for-developers, guides d'accessibilité SVG, glossaires RH français.
- Contrôle déterministe par les oracles `scripts/verify-gates.mjs` et `scripts/verify-browser.mjs`.

## 2. Constats et correctifs appliqués

| Constat | Gravité | Correctif | Preuve |
|---|---|---|---|
| Sélecteur de semaine dupliqué en trois écrans sans surface propre : le libellé de période s'affichait dans un simple `span.join-item` sans fond ni bordure, quasi invisible en thème sombre. | Moyenne | Conteneur bordé `rounded-m3-md border border-base-300 bg-base-300/50` commun aux trois sélecteurs (Disponibilités, Présences, Export). | Rendu sombre 1440/390, contraste 3:1 du conteneur sur la carte. |
| Contrôle d'apparence tronqué dans le tiroir mobile : « Système » et « Sombre » se lisaient « Syst… » et « Som… » à 390 px. | Moyenne | Icônes du segment masquées sous 640 px (`hidden sm:inline-flex`), libellés entiers conservés. | Rendu sombre 390, « Système », « Clair », « Sombre » complets. |
| Libellés de navigation divergents des titres de page : « Lieux & Sites » pour « Gestion des Sites & Lieux », « Employés » pour « Gestion des Collaborateurs », « Disponibilités équipe » pour « Disponibilités de l'Équipe ». | Moyenne | Alignement : « Sites & Lieux », « Collaborateurs », « Disponibilités ». | `ManagerLayout.vue`, oracles G34 et G40 verts. |
| Icônes de navigation signalées absentes dans la barre latérale et le tiroir mobile. | Signalée | Non reproduite : les sept entrées plus la passerelle affichent leur tracé à 1440 (déployé), 900 (rail) et 390 (tiroir), en sombre. Un garde-fou de source est ajouté pour empêcher une entrée sans icône. | Oracle G92 (`--manager-nav-icons`). |

Le défaut d'icônes non reproduit mérite une vérification côté navigateur du lecteur : un cache de bundle ancien ou une capture antérieure au code courant explique l'écart. La sonde de contrôle montée sur `ManagerLayout` rend chaque icône.

## 3. Propositions traitées le 2026-09-30

Les huit propositions sont livrées sous la clause G93, après arbitrages actés : option A pour le titre, tri par nom de la matrice, « Sites » seul.

1. **Titre dupliqué sur desktop.** Livré (option A) : le H1 de page est conservé, le bandeau supérieur gestionnaire ne porte plus que la marque et le hamburger.
2. **Icônes du rail à 20 px.** Livré : 22 px via une règle confinée à la media query de 840 px.
3. **Valeur KPI isolée.** Livré : « Taux de tenue » affiche « Aucun » avec la légende « Aucun jour révolu » quand aucun jour de la semaine n'est révolu.
4. **Grille KPI en trois colonnes sous 640 px.** Livré : `grid-cols-2 sm:grid-cols-3`.
5. **« & Lieux » redondant.** Livré : navigation « Sites », titre « Gestion des Sites ».
6. **Focus clavier sur les entrées de navigation.** Livré : `focus-visible:outline-2 focus-visible:outline-primary` dans les deux espaces.
7. **États vides de la matrice de disponibilités.** Livré : trois cas distincts (aucun collaborateur, recherche sans résultat, équipe sans résultat) avec l'action utile.
8. **Tri de la matrice de disponibilités.** Livré : colonne Collaborateur triable par nom, croissant puis décroissant, avec `aria-sort` et icône orientée.

## 4. Terminologie

Recommendations tirées des usages RH français et des conventions d'interface.

| Notion | Terme retenu | Terme écarté | Raison |
|---|---|---|---|
| Personne gérée dans l'espace manager | Collaborateur | Employé | Le jargon RH français emploie « collaborateur » comme terme standard et non marqué ; « employé » reste générique et peut sonner péjoratif. Le titre de page l'employait déjà, la navigation s'aligne. |
| Vue d'ensemble | Tableau de bord | Dashboard | « Tableau de bord » est la traduction consignée (Cambridge, Collins) et le terme des guides de pilotage (Tableau.com). Le mot anglais reste hors interface. |
| Périmètre de pointage | Site | Lieu | « Site » nomme un périmètre opérationnel géolocalisé ; « lieu » reste générique. La redondance « Sites & Lieux » disparaît. |
| Regroupement de personnes | Équipe | Pôle | « Équipe » est compris sans contexte ; « pôle » suppose une lecture organisationnelle. |
| Enregistrement d'arrivée ou de départ | Pointage | Présence | Le module se nomme « Présences », le fait enregistré se nomme « pointage ». Les deux cohabitent sans se confondre. |
| Enregistrement d'absence tenue | Disponibilité | Disponibilité d'équipe | Le contexte de l'écran porte déjà « Équipe » ; le libellé de navigation se raccourcit. |

## 5. Bonnes pratiques retenues

- **Barre latérale** : regrouper les entrées par sections, garder des libellés courts, placer les entrées fréquentes en haut, séparer la navigation des réglages. Le tiroir gestionnaire respecte ces règles (sections « Navigation » et « Mon espace », pied de réglages distinct). Source : ux-patterns-for-developers, « Sidebar ».
- **Rail en icônes** : une icône seule exige une infobulle ou un libellé accessible ; le rail fournit `data-tip` et `aria-label`. Source : « SVG Icons for Navigation Menus ».
- **Contraste des composants en sombre** : Material 3 demande un rapport d'au moins 3:1 entre un conteneur de composant et sa surface. Le sélecteur de période respectait la règle par accident, il la respecte désormais par construction (`bg-base-300/50` sur carte `bg-base-200`). Sources : Material 3 « Color contrast », « Segmented buttons: accessibility ».
- **Formulaires** : libellé au-dessus du champ, cible de 44 px, focus visible, `fieldset`/`legend` pour les groupes. Les écrans refondus s'y conforment. Source : WTW Software Design System, « Forms ».
- **Mode sombre** : surfaces en gris élevés plutôt qu'en noir absolu, hiérarchie par paliers de luminance. Le thème du projet applique déjà cette règle. Source : « Dark Mode Design: Best Practices ».

## 6. Vérification

- `node scripts/verify-gates.mjs --manager-grammar` : G88 verte.
- `node scripts/verify-gates.mjs --manager-responsive` : G89 verte.
- `node scripts/verify-gates.mjs --manager-nav-icons` : G92 verte, contrôle négatif compris.
- `node scripts/verify-gates.mjs --all` : aucune régression, seuls G1, G3, G4 (ToastContainer, SyncIndicator) et G8 (HomeView) restent hors périmètre.
- `CHROME_PATH=$(command -v google-chrome-stable) node scripts/verify-browser.mjs --appearance-control --sidebar-rail --nav-docking` : vertes après masquage des icônes de segment.
- `npm run build` : sortie 0.

## 7. Références

- Material Design 3, « Color contrast » et « Segmented buttons: accessibility », m3.material.io.
- WTW Software Design System, « Button - Segmented », « Forms », « Date Picker », ux-software.wtwco.com.
- ux-patterns-for-developers, « Sidebar », github.com/thedaviddias/ux-patterns-for-developers.
- All SVG Icons, « SVG Icons for Navigation Menus », allsvgicons.com.
- W3C WAI, « Menu Styling » et « SVG Accessibility », w3.org.
- WordReference, fil « collaborateur / employé » ; glossaires RH Combo et QuickMS.
- Cambridge Dictionary et Collins, traductions de « dashboard » ; Tableau.com, « Les 10 meilleures pratiques pour créer des tableaux de bord ».
