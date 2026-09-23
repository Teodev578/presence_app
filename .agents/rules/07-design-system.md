# Directives & Standards de Design System — Material 3 & DaisyUI v5

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

- **Élévation 0 (Plate)** : `bg-base-100` — Arrière-plan de la vue.
- **Élévation 1 (Posée)** : `bg-base-200` — Cartes standards, listes d'éléments, tableaux.
- **Élévation 2 (Surélevée)** : `bg-base-300` — Menus déroulants, barres de navigation flottantes.
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
- **Bascule Navigation Basse vers Rail (840px)** : Sous 840px, l'application utilise une Bottom Navigation fixe. À partir de 840px, la navigation bascule en Sidebar Rail latérale compacte (icônes seules).
- **Bascule Rail vers Tiroir Déployé (1200px)** : À partir de 1200px, la barre latérale se déploie avec libellés complets et indicateurs d'état permanents.

### Ergonomie tactile et cibles cliquables
- **Surface tactile minimale** : 44×44 pixels obligatoires pour tout élément interactif. Sur mobile tactile, les boutons d'action clés (pointage, validation) occupent une hauteur minimale de 56dp. Sur desktop (souris/pointeur), la hauteur minimale est de 48dp.
- **Affordance tactile** : Tout bouton ou carte interactive intègre un feedback au toucher (`active:scale-95 transition-transform duration-150`).
- **Marges matérielles (Safe Areas)** : Tout conteneur d'en-tête ou de pied de page applique les variables d'encoche matérielles (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).

### Composant Player Bar persistant
Le Player Bar (barre de statut audio/pointage) adopte trois morphologies distinctes :
1. **Mini Pill (Mobile)** : Pastille flottante compacte ancrée au-dessus de la Bottom Navigation, accessible au pouce.
2. **Desktop Bar (Grand écran)** : Barre horizontale ancrée en bas de page couvrant toute la largeur avec commandes déployées.
3. **Full View (Plein écran)** : Feuille modale immersive déroulée par glissement vertical.

---

## 8. Anti-Patterns & Pratiques Prohibées

Tout agent doit refuser et corriger les pratiques suivantes lors de ses interventions :

1. **L'accumulation utilitaire débridée** : Remplacer les chaînes de 12 classes Tailwind ad-hoc par la combinaison d'une classe sémantique DaisyUI (`card`, `btn`) et d'un conteneur M3 (`bg-base-200 rounded-m3-lg`).
2. **Les couleurs brutes non sémantiques** : Éviter les classes de couleurs figées comme `bg-blue-600`, `text-red-500` ou `border-gray-200`. Utiliser impérativement les tokens thématiques réactifs (`bg-primary`, `text-error`, `border-base-300`).
3. **Le décalage de safe-area mobile** : Oublier les paddings réservés aux encoches sur smartphones (`var(--safe-top)`, `var(--safe-bottom)`).
4. **Les boutons sans affordance tactile** : Omettre les états actifs réactifs (`active:scale-95 transition-transform duration-150`).
