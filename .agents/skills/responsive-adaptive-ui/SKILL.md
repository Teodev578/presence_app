---
name: responsive-adaptive-ui
description: >
  Design system intelligence for building highly responsive and adaptive interfaces
  inspired by Spotify's Encore philosophy, calibrated to PresenceApp's M3 + DaisyUI v5 stack.
  Use when designing or implementing: responsive Card grids, adaptive navigation (Bottom Nav / Sidebar),
  Player Bar persistent UI (mini pill / desktop bar / full-screen), fluid typography scaling,
  touch vs. pointer input zones, micro-interactions, motion transitions, or WCAG AA compliance.
  Covers all six breakpoints (xs 360px → 2xl 1600px+) and three input modalities (touch, pointer, keyboard).
---

# Responsive & Adaptive UI

Ce skill fournit les spécifications, règles et workflow pour concevoir et implémenter des interfaces adaptatives selon la philosophie Spotify Encore, intégrées au design system PresenceApp (M3 + DaisyUI v5).

**Avant tout travail**, lire la règle `.agents/rules/07-design-system.md`. Ce skill l'étend — il ne la remplace pas.

---

## Quand invoquer ce skill

Déclencher sur l'un de ces signaux :

- Nouveau composant Card, List Item, ou grille de contenu
- Mise en place ou refonte de la navigation (Bottom Nav, Sidebar Rail, Sidebar déployée)
- Player Bar sous l'une de ses trois formes (Mini pill, Desktop bar, Full Player)
- Question de breakpoint, padding, gap, ou nombre de colonnes
- Adaptation d'une interface existante à un nouveau viewport
- Dimensionnement de zones tactiles ou de cibles cliquables
- Typographie fluide ou hiérarchie éditoriale
- Micro-interactions, transitions, courbes d'accélération, prefers-reduced-motion

---

## Références

Ce skill délègue ses spécifications détaillées à quatre fichiers de référence. Les lire selon le besoin :

| Fichier | Quand le lire |
|---|---|
| [`spotify-encore-deep-spec.md`](references/spotify-encore-deep-spec.md) | Vue d'ensemble complète — lire en premier pour toute tâche nouvelle |
| [`grid-and-tokens.md`](references/grid-and-tokens.md) | Breakpoints, colonnes, padding, gap, échelle typographique, largeurs max |
| [`component-anatomy.md`](references/component-anatomy.md) | États visuels de chaque composant (Card, List Item, Player Bar, Navigation) |
| [`motion-principles.md`](references/motion-principles.md) | Courbes M3, durées, Shared Element Transition, prefers-reduced-motion, GPU |

---

## Règle de priorité — Non-destructivité

**Le style existant est toujours prioritaire sur les défauts de ce skill.**

Ce skill ajoute de la responsivité et de l'adaptivité ; il ne reécrit pas un design en place. Avant toute intervention sur une vue ou un composant existant, appliquer la règle :

> `existing design tokens > skill defaults`

Si le composant cible utilise déjà `rounded-xl` au lieu de `rounded-m3-lg`, ou `bg-slate-800` au lieu de `bg-base-300` — **conserver ces choix**. Ne les corriger que si l'utilisateur demande explicitement une mise en conformité avec le design system.

---

## Workflow d'exécution

### Étape 0 — Auditer le style existant (obligatoire sur toute vue existante)

Avant d'intervenir sur un composant ou une vue **qui existe déjà**, relever :

- Les classes CSS / tokens actuellement utilisés (couleurs, arrondis, espacement)
- Les tailles et hauteurs hardcodées qui bloquent l'adaptation responsive
- Les unités rigides (`px` fixes, `width` absolue) qui empêchent le redimensionnement fluide
- Ce qui **ne doit pas changer** : identité visuelle, couleurs de marque, typographie choisie

Formuler explicitement la liste des éléments à préserver avant d'agir. Si rien n'est à préserver (composant nouveau), passer directement à l'Étape 1.

### Étape 1 — Identifier le composant et le contexte

Avant d'écrire quoi que ce soit, répondre à ces trois questions :

1. **Quel composant** est en jeu ? (Card, List Item, Navigation, Player Bar, Grid, Typography)
2. **Quels breakpoints** sont concernés ? (mobile seul, tablet+, desktop, ou tous)
3. **Quelle modalité d'entrée** est prioritaire ? (touch / pointer / keyboard)

Lire ensuite le fichier de référence correspondant.

---

### Étape 2 — Appliquer les règles de breakpoint

Utiliser impérativement la table de `grid-and-tokens.md` pour les valeurs de :
- Nombre de colonnes
- Padding du container
- Gap entre items
- Hauteur minimale des zones interactives (56dp mobile, 48dp desktop)
- Dimensions du Player Bar selon l'état

**Seuil de bascule critique** :
- Carousel → Grille : **600px**
- Bottom Nav → Sidebar Rail : **840px**
- Sidebar Rail → Sidebar déployée : **1200px**

---

### Étape 3 — Spécifier les états visuels

Pour chaque composant, tous les états doivent être définis **avant** l'implémentation :

- Default, Hovered, Pressed/Active, Focused (clavier), Disabled, Loading/Skeleton

Consulter `component-anatomy.md` pour les valeurs exactes de chaque état.

**Règle des tokens** : tout composant utilise exclusivement les tokens M3/DaisyUI de `.agents/rules/07-design-system.md`. Aucune couleur Tailwind brute (bg-blue-600, text-gray-500). Aucun `shadow-lg`.

---

### Étape 4 — Définir les micro-interactions et transitions

Toute interaction utilisateur produit un feedback visuel. Consulter `motion-principles.md` pour :
- La courbe appropriée (Emphasized, Standard, Spring Elastic)
- La durée appropriée (80ms micro-feedback → 350ms Shared Element)
- La règle prefers-reduced-motion correspondante
- La propriété CSS animable (transform/opacity uniquement — jamais width/height/top)

---

### Étape 5 — Vérifier l'accessibilité

Avant de valider une spécification ou une implémentation :

- Contraste WCAG AA : 4.5:1 pour le texte < 18px, 3:1 pour les grands textes et icônes actives
- Focus visible sur tous les éléments interactifs (`ring-2 ring-primary ring-offset-2`)
- ARIA : `role`, `aria-label`, `aria-selected`, `aria-disabled` partout où nécessaire
- prefers-reduced-motion : toute animation de translation/scale → durée 0ms

---

### Étape 6 — Auto-revue avant livraison

Relire chaque composant ou spécification produite et vérifier :

- [ ] Les tokens M3/DaisyUI sont utilisés (pas de couleurs brutes)
- [ ] Les arrondis sont des `rounded-m3-*` (pas des `rounded-lg` natifs Tailwind)
- [ ] L'élévation est tonale (pas de `shadow-lg` ou `shadow-2xl`)
- [ ] Tous les états visuels (y compris disabled et loading) sont définis
- [ ] Les zones de tap mobile respectent le minimum de 48dp
- [ ] Les transitions utilisent `transform`/`opacity` uniquement
- [ ] La règle prefers-reduced-motion est documentée ou appliquée
- [ ] Les breakpoints correspondent exactement aux seuils canoniques (600, 840, 1200px)
- [ ] La Card fantôme est spécifiée dans tout Carousel mobile

---

## Garde-fous inviolables

Ces règles ne souffrent aucune exception dans ce skill :

1. **Aucune couleur brute** — `bg-blue-600`, `text-gray-500`, `border-gray-200` sont interdits.
2. **Aucune ombre portée agressive** — `shadow-lg`, `shadow-2xl` sont interdits.
3. **Aucun arrondi natif Tailwind** sur les composants — uniquement `rounded-m3-*` ou `rounded-full`.
4. **Aucune valeur d'espacement hors de l'échelle** — `[4, 8, 12, 16, 24, 32, 48, 64, 96]` dp seulement.
5. **Aucune taille de police arbitraire** — uniquement les rôles typographiques de `grid-and-tokens.md`.
6. **Aucune animation de width/height/top/left** — `transform` et `opacity` uniquement.
7. **La Safe Area mobile** doit toujours être respectée (Bottom Nav, Mini Player Bar).
