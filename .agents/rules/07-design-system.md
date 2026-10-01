# Directives & Standards de Design System : Material 3 & DaisyUI v5

Ce document définit les conventions esthétiques, la hiérarchie visuelle et les règles d'implémentation de l'interface graphique pour l'ensemble du projet PresenceApp. Tout agent générant ou refactorisant du code d'interface (`.vue`, `.css`) doit s'y conformer impérativement.

---

## 1. Philosophie & Synergie Architecturale (DaisyUI + M3)

L'architecture visuelle repose sur une séparation rigoureuse des responsabilités entre la structure sémantique et le langage formel :

- **DaisyUI v5 fournit l'armature sémantique** : Les balises et classes natives (`btn`, `card`, `modal`, `badge`, `alert`, `input`, `drawer`) constituent la base structurelle et accessible des composants.
- **Material 3 (M3) insuffle le langage visuel** : Les tokens de couleur sémantiques, l'élévation par teintes tonales (sans ombres portées opaques), l'échelle d'arrondis progressive et la rigueur typographique imposent l'identité visuelle de Google Material Design 3.

Tout composant doit être conçu en pensant d'abord : *« Quel composant DaisyUI répond à ce cas d'usage, et quels tokens M3 définissent son état et sa surface ? »*.

---

## 2. Système Colorimétrique & Rôles Sémantiques

Material 3 récuse l'usage arbitraire des couleurs décoratives. Chaque couleur répond à un rôle d'affordance cognitive précis :

| Token CSS / DaisyUI | Rôle sémantique M3 | Usage autorisé |
|---|---|---|
| `--color-primary` / `--md-sys-color-primary` | Action principale (Primary) | Boutons d'action clé (Pointage, Validation), éléments sélectionnés, bascules actives. |
| `--md-sys-color-primary-container` | Conteneur d'accentuation | Cartes d'action prioritaires, badges d'état saillant (ex: « Présent »). |
| `--color-secondary` / `--md-sys-color-secondary` | Action de soutien (Secondary) | Boutons secondaires, puces de filtre inactives, navigation secondaire. |
| `--color-accent` / `--md-sys-color-tertiary` | Accentuation équilibrée | Éléments de contraste visuel, repères temporels, tags de catégories spéciales. |
| `--color-error` / `--md-sys-color-error` | Alerte critique (Error) | Échecs de validation, erreurs bloquantes, alertes de synchronisation échouée. |
| `--color-base-100` / `--md-sys-color-surface` | Surface neutre de base | Toile de fond principale de l'application (`body`, fenêtres modales). |
| `--color-base-200` / `surface-container` | Surface conteneur niveau 1 | Cartes de contenu (`card bg-base-200`), barres d'outils, tiroirs latéraux. |
| `--color-base-300` / `surface-container-high` | Surface conteneur niveau 2 | En-têtes surélevés, champs de saisie en retrait, popovers. |

### Règle des couples Conteneur / Contenu (On-Color)
Toute couleur de surface ou de conteneur M3 s'accompagne obligatoirement de son texte de contraste dédié :
- Sur `--color-primary`, le texte ou l'icône utilise `--color-primary-content` (`--md-sys-color-on-primary`).
- Sur `--color-base-100` ou `--color-base-200`, le texte utilise `--color-base-content` (`--md-sys-color-on-surface`).
- Ne jamais surimposer un texte noir ou gris standard `#000` / `#666` sur un fond teinté M3.

---

## 3. Élévation Tonale vs Ombres Portées (Anti-Pattern Box-Shadow)

Material 3 remplace l'élévation par ombre (`box-shadow`) par une élévation par **teinte de surface** :

- **Élévation 0 (Plate)** : `bg-base-100` (Arrière-plan de la vue).
- **Élévation 1 (Posée)** : `bg-base-200` (Cartes standards, listes d'éléments, tableaux).
- **Élévation 2 (Surélevée)** : `bg-base-300` (Menus déroulants, barres de navigation flottantes).
- **Élévation 3 (Modale)** : `bg-base-100` avec anneau de bordure subtil `border border-base-300/40` ou `outline-variant`.

> **Interdiction formelle** : Les ombres portées agressives (`shadow-lg`, `shadow-2xl`, ombres noires floues) sont prohibées. Utiliser au maximum `shadow-xs` ou `shadow-sm` combiné à une variation de couleur de surface pour marquer le relief.

---

## 4. Échelle de Formes & Arrondis (Shape Hierarchy)

Les arrondis des composants doivent refléter leur niveau dans la hiérarchie de l'écran, selon l'échelle M3 :

| Échelle M3 | Rayon | Classe utilitaire | Composants cibles |
|---|---|---|---|
| Extra Small | `4px` | `rounded-m3-xs` | Badges compacts, infobulles, puces techniques. |
| Small | `8px` | `rounded-m3-sm` | Boutons compacts, cibles d'action denses, cases à cocher. |
| Medium | `12px` | `rounded-m3-md` | Cartes compactes, champs de saisie (`input`), sélecteurs (`select`). |
| Large | `16px` | `rounded-m3-lg` | Cartes principales (`card`), conteneurs de formulaire, volets. |
| Extra Large | `28px` | `rounded-m3-xl` | Boutons d'action flottants (FAB), modales de dialogue, feuilles de fond. |
| Full | `9999px` | `rounded-full` | Avatars, puces de filtres d'état (pills), boutons d'icônes circulaires. |

---

## 5. Rigueur Typographique (Échelle M3)

L'application utilise exclusivement la police **Inter**, optimisée pour le rendu d'écrans tactiles et d'interfaces de données :

- **Titres de niveau 1 (Page Title / Headline)** : `text-xl md:text-2xl font-bold tracking-tight text-base-content`.
- **Titres de cartes / sections (Title Medium)** : `text-base font-semibold text-base-content`.
- **Corps de texte (Body)** : `text-sm font-normal text-base-content/85 leading-relaxed`.
- **Labels d'action & Métadonnées (Label Small / Medium)** : `text-xs font-medium tracking-wide uppercase text-base-content/60`.

> **Interdiction formelle** : Ne jamais introduire de tailles de police arbitraires en style inline ou classes arbitraires non calibrées (ex : `text-[13px]`, `text-[15px]`). S'en tenir à l'échelle Tailwind standardisée.

---

## 6. Accessibilité Numérique & Mode Sombre (Dark Mode)

- **Gestion native du thème** : Le commutateur de thème bascule l'attribut `data-theme="light"` ou `data-theme="dark"` sur l'élément racine `<html>`.
- **Préservation des contrastes en mode sombre** : En thème sombre, le fond ne doit pas être un noir absolu `#000000` (fatiguant pour la rétine), mais la surface M3 calibrée `#111318` avec des conteneurs étagés `#191c20`, `#1d2024` et `#282a2f`.
- **Contraste WCAG AA minimum** : Ratio 4.5:1 pour le texte régulier, 3:1 pour le texte large et les éléments interactifs.

---

## 7. Architecture Responsive & Adaptative (Protocole Responsive-Adaptive-UI)

Ce volet applique les spécifications du skill `responsive-adaptive-ui`, inspirées d'Encore et calibrées pour PresenceApp :

### Seuils de bascule critiques (Breakpoints)
- **Bascule Carrousel vers Grille (600px)** : Sous 600px, les collections denses s'affichent en carrousel horizontal à défilement tactile avec pagination discrète. À partir de 600px, elles adoptent une grille responsive à colonnes (`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).
- **Bascule Tiroir vers Barre Latérale Ancrée (840px)** : Sous 840px, les deux espaces naviguent par tiroir superposé, déclenché par le hamburger. À partir de 840px, la barre latérale s'ancre dans la mise en page avec ses libellés complets, dans les deux espaces. Le seuil vit dans `src/style.css` sous le jeton `--breakpoint-docked`, Tailwind ne le proposant pas nativement, et le comportement d'ancrage est porté par la classe `.drawer-docked`.
- **Repli volontaire en rail d'icônes (dès 840px)** : Une fois la barre ancrée, une poignée en tête de barre la replie en rail d'icônes : libellés masqués au profit des seules icônes, infobulle nommant chaque entrée au survol, entrée sélectionnée conservée. Entre 840px et 1024px, le rail s'applique de lui-même pour épargner la largeur de la vue, et la barre se déploie au delà ; un clic sur la poignée ne vaut que pour la bande courante, tout franchissement de seuil le révoquant au profit du seuil. L'état vit dans `src/composables/useSidebarNav.js` et le style dans `src/style.css`. Déployée, la poignée demeure dans la rangée de l'en-tête, à la droite de la marque bornée par un `min-w-0` : elle ne recouvre jamais le badge d'espace et ne franchit pas le filet d'en-tête. Seul le repli la sort du flux, en coin au-dessus du logo centré.
- **Aucun rail sous 840px, aucune barre basse** : Sous 840px, le tiroir superposé garde ses libellés complets et réserve toute la largeur à la vue active ; le rail n'a pas d'objet. Aucune barre de navigation basse n'est admise.

Le garde-fou exécutable de ces seuils est `node scripts/verify-gates.mjs --nav-docking`, complété par `node scripts/verify-gates.mjs --sidebar-rail` et `node scripts/test-sidebar-nav.mjs` pour le repli, et par `node scripts/verify-gates.mjs --sidebar-handle` avec `node scripts/verify-browser.mjs --sidebar-handle` pour l'intégration de la poignée à l'en-tête.

### Ergonomie tactile et cibles cliquables
- **Surface tactile minimale** : 44×44 pixels obligatoires pour tout élément interactif. Sur mobile tactile, les boutons d'action clés (pointage, validation) occupent une hauteur minimale de 56dp. Sur desktop (souris/pointeur), la hauteur minimale est de 48dp.
- **Lisibilité des formulaires** : les champs texte et les barres de recherche occupent toute la largeur de leur conteneur, avec une hauteur utile d'au moins 44px. Disposition en colonne simple, sauf paires logiques sur une même rangée (latitude/longitude). Labels au-dessus du champ, jamais l'inverse.
- **Affordance tactile** : Tout bouton ou carte interactive intègre un feedback au toucher (`active:scale-95 transition-transform duration-150`).
- **Marges matérielles (Safe Areas)** : Tout conteneur d'en-tête ou de pied de page applique les variables d'encoche matérielles (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).

---

## 8. Anti-Patterns & Pratiques Prohibées

Tout agent doit refuser et corriger les pratiques suivantes lors de ses interventions :

1. **L'accumulation utilitaire débridée** : Remplacer les chaînes de 12 classes Tailwind ad-hoc par la combinaison d'une classe sémantique DaisyUI (`card`, `btn`) et d'un conteneur M3 (`bg-base-200 rounded-m3-lg`).
2. **Les couleurs brutes non sémantiques** : Éviter les classes de couleurs figées comme `bg-blue-600`, `text-red-500` ou `border-gray-200`. Utiliser impérativement les tokens thématiques réactifs (`bg-primary`, `text-error`, `border-base-300`).
3. **Le décalage de safe-area mobile** : Oublier les paddings réservés aux encoches sur smartphones (`var(--safe-top)`, `var(--safe-bottom)`).
4. **Les boutons sans affordance tactile** : Omettre les états actifs réactifs (`active:scale-95 transition-transform duration-150`).

---

## 9. Grammaire et Responsivité de l'Espace Gestionnaire

Les écrans de l'espace gestionnaire partagent une grammaire unique, extraite des écrans validés `Gestion des Sites & Lieux` et `Contrôle des Présences`. Trois composants portent les motifs répétés, sous `src/components/manager/` :

- `ManagerPageHeader.vue` : en-tête d'écran. Titre `h1 text-2xl font-black tracking-tight`, pastille `w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20 text-primary`, sous-titre `text-xs text-base-content/60 mt-0.5`, slot `actions`. Aucun écran ne réintroduit un `h2` ni un en-tête inline.
- `ManagerKpiCard.vue` : carte de synthèse plate (`card bg-base-200 border border-base-300 shadow-xs p-4 rounded-m3-md`), libellé `text-xs font-semibold` avec point coloré selon le ton, valeur `text-2xl font-black`, légende `text-xs text-base-content/50`. Un bandeau KPI se compose exclusivement de ces cartes, partagées entre le tableau de bord et le contrôle des présences.
- `ManagerEmptyState.vue` : état vide ou vide de filtre. Pastille de situation `w-12 h-12 rounded-full bg-base-300`, titre `font-bold text-base`, message `text-sm text-base-content/60`, action utile conditionnelle. Le drapeau `bare` le pose dans une carte existante.

Règles associées :

- Aucune action icône et texte n'emprunte `btn-sm`, aucun champ n'emprunte `input-sm` ou `select-sm` : le couple icône/texte reste accordé et la cible tactile tient 44px.
- Aucune taille de police arbitraire (`text-[11px]`, `text-[10px]`) : l'échelle Tailwind fait foi.
- Trois états explicites par écran de données : ossature de chargement (`animate-pulse`), état vide distinct (aucune donnée, aucun résultat de recherche, aucun résultat de filtre), état d'erreur avec action de réessai.

### Bascule responsive des données

- Seuil de bascule fiches/tableau : **640px** (`sm:`), seuil déjà retenu par `Contrôle des Présences`. Sous 640px, les tableaux se lisent en fiches empilées (identité, métadonnées, actions) ; au delà, le tableau balisé reprend. La matrice de disponibilités suit la même bascule (fiche par collaborateur sous 640px, matrice au delà).
- Les barres de filtres `join` défilent horizontalement sur mobile (`overflow-x-auto`), jamais empilées en colonne.
- Les grilles de cartes passent d'une colonne sous 640px à deux puis trois colonnes (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).

Le garde-fou exécutable est `node scripts/verify-gates.mjs --manager-grammar` pour la grammaire et `node scripts/verify-gates.mjs --manager-responsive` pour la bascule.

---

## 10. Grammaire des Boutons

Les boutons suivent une grammaire stricte fondée sur leur position dans l'interface et la cardinalité de leur contexte :

### Largeur selon la cardinalité

| Contexte | Classe | Comportement |
|---|---|---|
| Bouton **solitaire** dans une section ou une carte | `w-full` | Prend toute la largeur disponible — invite claire à l'action. |
| **Exception** : action destructrice solitaire (déconnexion, suppression) | `w-full sm:max-w-64` | Pleine largeur sur mobile, ancré à 256 px sur tablette et desktop — friction visuelle intentionnelle. |
| **Paire** de boutons dans un `flex-row` (Annuler + Confirmer, Fermer + Enregistrer) | Secondaire : `px-5` — Primaire : `flex-1` | Le bouton primaire étire et domine visuellement. Le secondaire garde sa taille naturelle. |

### Hauteur minimale selon le niveau d'action

| Niveau | Classe | Usage |
|---|---|---|
| CTA principal d'une vue (Pointer, Synchroniser, Se connecter) | `min-h-12` (48 px) | Une seule instance par vue ou carte. |
| Tout autre bouton interactif | `min-h-11` (44 px) | Boutons de formulaire, actions secondaires, filtres. |
| Bouton icône seul (sans texte) | `min-h-11 min-w-11` | Garantit la cible tactile 44 × 44 px minimum. |

> **Interdiction formelle** : Ne jamais combiner `btn-sm` et `min-h-11`. DaisyUI `btn-sm` contraint la hauteur en dessous du minimum tactile ; le `min-h-11` surajouté crée un conflit silencieux. Utiliser `btn` seul, puis calibrer avec `min-h-*`.

### Feedback tactile universel

Tout bouton interactif visible (hors icônes de navigation dans la barre) intègre obligatoirement :

```html
active:scale-95 transition-transform duration-150
```

Cette règle s'applique aussi aux boutons dans les modales, les formulaires et les cartes de paramètres.

### Icône dans un bouton texte

- L'icône **précède toujours** le texte (ordre LTR).
- L'icône porte `aria-hidden="true"` et `class="w-4 h-4 shrink-0"`.
- Le `gap-2` entre icône et texte est la valeur canonique.
