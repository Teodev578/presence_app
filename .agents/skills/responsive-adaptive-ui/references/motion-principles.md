# Motion Principles — Référence d'animation

> Source de vérité pour toutes les durées, courbes et règles d'animation du skill `responsive-adaptive-ui`.
> Complémentaire à `.agents/skills/vue-animation/SKILL.md` (qui couvre l'implémentation Vue 3 spécifique).
> Ce fichier traite des **principes** — le "quoi" et le "pourquoi" avant le "comment".

---

## 1. Principe fondateur : le mouvement communique l'état

Chaque animation doit servir **un de ces quatre buts** — aucun autre n'est légitime :

1. **Spatial** — Communiquer la relation entre deux éléments dans l'espace (d'où vient ce contenu, où va-t-il).
2. **Causal** — Relier une action utilisateur à son résultat (tap → le bouton répond).
3. **Hiérarchique** — Révéler la structure (une modale appartient à un contenu, une sidebar appartient à la navigation).
4. **Temporel** — Indiquer une progression dans le temps (loading, progress bar).

Une animation qui ne sert aucun de ces buts est du bruit visuel. La supprimer.

---

## 2. Courbes d'accélération M3

| Nom | Valeur cubic-bezier | Usage canonique |
|---|---|---|
| **Emphasized** | `cubic-bezier(0.2, 0, 0, 1.0)` | Full Player open, Bottom Sheet up, navigation entre pages |
| **Emphasized Decelerate** | `cubic-bezier(0.05, 0.7, 0.1, 1.0)` | Élément entrant dans l'écran depuis le bas ou depuis un côté |
| **Emphasized Accelerate** | `cubic-bezier(0.3, 0, 0.8, 0.15)` | Élément quittant l'écran, dismiss, retrait |
| **Standard** | `cubic-bezier(0.2, 0, 0, 1.0)` | Transitions de contenu, changements d'état internes |
| **Standard Decelerate** | `cubic-bezier(0, 0, 0, 1)` | Toasts, snackbars, éléments de feedback entrants |
| **Standard Accelerate** | `cubic-bezier(0.3, 0, 1, 1)` | Toasts et snackbars sortants |
| **Linear** | `linear` | Progressions continues (slider, progress bar, loaders) |
| **Spring Elastic** | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Snap-back élastique (swipe non complété) |

---

## 3. Catalogue de durées

| Type d'animation | Durée recommandée | Courbe |
|---|---|---|
| **Micro-feedback** (press, hover state) | 80ms | Standard |
| **Micro-interaction** (hover apparition bouton Play) | 120ms | Standard Decelerate |
| **Show / Hide composant** | 150ms (in) / 120ms (out) | Standard Decelerate / Accelerate |
| **Transition de couleur** (state change) | 150ms | Standard |
| **Navigation entre pages** | 250–300ms | Emphasized |
| **Slide de Sidebar** (déploiement/rétraction) | 250ms | Emphasized |
| **Bottom Sheet** (montée) | 300ms | Emphasized Decelerate |
| **Dismiss** (descente ou sortie côté) | 280ms | Emphasized Accelerate |
| **Shared Element Transition** (Full Player) | 350ms | Emphasized |
| **Gradient de fond** (Full Player content change) | 600ms | Linear |
| **Skeleton loader** (pulse) | 1500ms · infini | ease-in-out |
| **Snap-back élastique** | 200ms | Spring Elastic |

---

## 4. Shared Element Transition — Full Player

La transition Mini Pill → Full Player est le cas le plus complexe du système. Elle implique plusieurs éléments animant simultanément avec des délais ordonnés.

### Séquence d'animation (t=0 = début du tap)

| t | Action |
|---|---|
| 0ms | L'artwork commence son scale (48dp → vw−32dp) et son translate |
| 0ms | La pill commence son expansion vers le haut |
| 0ms | Le gradient de fond du Full Player commence son fade-in |
| 50ms | Le titre mini-barre commence son fade-out (opacity 1 → 0) |
| 150ms | Le titre H2 commence son fade-in (opacity 0 → 1) |
| 100ms | Les contrôles complets commencent leur staggered fade-in |
| 100ms + n×50ms | Chaque contrôle s'enchaîne avec 50ms de délai |
| 350ms | Animation complète |

### Séquence inverse (fermeture via swipe down)

| t | Action |
|---|---|
| 0ms | Le titre H2 commence son fade-out |
| 0ms | Les contrôles complets commencent leur fade-out simultané |
| 50ms | L'artwork commence son reverse scale (vw−32dp → 48dp) |
| 50ms | La pill commence sa contraction vers le bas |
| 150ms | Le titre mini-barre commence son fade-in |
| 280ms | Animation de fermeture complète |

---

## 5. Règles de performance

### GPU-only : la règle absolue

Les propriétés CSS qui déclenchent un **reflow** (recalcul de layout) sont interdites dans les animations :

| Interdit dans les animations | Alternative GPU |
|---|---|
| `width`, `height` | `transform: scaleX()`, `transform: scaleY()` |
| `top`, `left`, `right`, `bottom` | `transform: translateX()`, `transform: translateY()` |
| `margin`, `padding` | `transform: translate()` |
| `font-size` (dans une animation) | Cross-fade entre deux éléments |
| `background-color` (si animé en boucle) | Préférer `opacity` sur un overlay coloré |

**Seules `transform` et `opacity` sont animables** dans ce système.

### will-change

- Appliquer `will-change: transform, opacity` uniquement **juste avant** le début de l'animation (via une classe CSS ajoutée dynamiquement).
- **Retirer immédiatement** `will-change` après la fin de l'animation. Un `will-change` permanent est une fuite mémoire.
- Ne jamais appliquer `will-change` à plus de 3 éléments simultanément.

### Jank budget

- Cible : **60fps** sur un appareil équivalent Snapdragon 665 (mi-gamme 2020).
- Si une frame dépasse 16.7ms : simplifier ou supprimer l'animation sur cet appareil.
- Sur les appareils haute résolution (120Hz) : les durées restent identiques — ne pas adapter les durées au refresh rate.

---

## 6. Règle prefers-reduced-motion

Tout le système d'animation est soumis au media query `@media (prefers-reduced-motion: reduce)`.

### Comportement selon le type d'animation

| Type d'animation | Comportement sans reduced motion | Comportement avec reduced motion |
|---|---|---|
| Translations (translate, scale) | Animées normalement | Durée → 0ms (instantané) |
| Cross-fades d'opacité | Animés normalement | Réduits à 150ms maximum |
| Rotations (artwork actif) | Rotation lente 20s infini | Remplacé par opacity pulsante 0.8→1.0 en 2s infini |
| Loaders (skeleton pulse) | animate-pulse normal | Remplacé par opacity statique 50% |
| Shared Element Transition | Morph complet 350ms | Simple cross-fade 150ms |
| Bottom Sheet | Slide up 300ms | Fade-in 150ms depuis la position finale |
| Gradient dynamique | Cross-fade 600ms | Cross-fade 200ms |

### Justification

Les animations de translation et de rotation peuvent provoquer des malaises vestibulaires (cinétose, nausée) chez les utilisateurs sensibles. Les cross-fades d'opacité sont généralement exemptés car ils ne créent pas de mouvement spatial perçu.

---

## 7. Hiérarchie des animations lors des interactions simultanées

Quand plusieurs animations voudraient se déclencher en même temps, la priorité est :

1. **Résolution d'état critique** (erreur, succès de validation) — toujours immédiat, jamais différé.
2. **Navigation (changement de vue)** — prioritaire sur les animations de contenu en cours.
3. **Shared Element Transition** — ne peut pas être interrompue une fois démarrée.
4. **Micro-interactions** (hover, press) — peuvent être interrompues à tout moment.
5. **Animations de fond** (gradients, skeleton) — peuvent être suspendues si une animation de priorité supérieure démarre.

---

## 8. Contre-indications — Animations à ne jamais implémenter

| Animation | Raison |
|---|---|
| Bounce infini sur des éléments UI statiques | Détourne l'attention, pas de signal utile |
| Parallax agressif au scroll | Coûteux en GPU, mal toléré par les utilisateurs sensibles |
| Transitions de page avec rotation 3D | Trop dramatique, inadapté à une app de gestion |
| Flash d'erreur répété (clignotement) | Interdit WCAG (photosensibilité) si > 3 flashs/seconde |
| Animations de texte (lettres qui apparaissent une à une) | Nuit à la lisibilité |
| Scale > 1.05 sur des éléments de navigation | Déstabilisant, casse la structure visuelle |
| Animations de durée > 800ms pour des actions utilisateur directes | Perçu comme lent, frustrant |
