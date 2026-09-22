# Directives & Standards d'Animation — Vue 3 & Mobile PWA

Ce document définit les règles impératives régissant l'usage des animations et transitions dans l'application PresenceApp. Tout composant ou vue implémentant un effet de mouvement doit s'y conformer strictement.

---

## 1. Principe de Sobriété & Performance (Anti-Jank)

Les animations sur mobile sont sensibles au blocage du thread principal. Pour garantir une fluidité constante à 60 images/seconde :

### Propriétés strictement autorisées (GPU Composited)
- `transform` (ex : `translate3d`, `scale`, `rotate`)
- `opacity`

### Propriétés formellement interdites en animation/transition
- `width`, `height`, `min-width`, `max-width`, `min-height`, `max-height` (déclenchent un calcul de géométrie / reflow)
- `top`, `left`, `right`, `bottom` (remplacer par `transform: translate(...)`)
- `margin`, `padding` (remplacer par du layout statique ou `transform`)
- `box-shadow` continue (coût de rasterization élevé sur GPU mobile)

---

## 2. Durées et Fonctions de Bézier (Timing)

- **Micro-interactions tactiles (boutons, toggles)** : Durée comprise entre **150ms et 250ms**.
  - Courbe : `cubic-bezier(0.4, 0, 0.2, 1)` (standard ease-in-out) ou `ease-out`.
- **Transitions d'écrans & de routes** : Durée comprise entre **200ms et 300ms**.
- **Modales et feuilles de dialogue (Bottom Sheets)** : Durée de **200ms à 300ms** en `ease-out`.
- **Interdiction formelle des durées > 400ms** : Tout délai supérieur engendre une perception de latence chez l'utilisateur.

---

## 3. Accessibilité & `prefers-reduced-motion`

Chaque animation ou transition doit impérativement respecter le paramétrage système de l'utilisateur pour prévenir la cinétose :

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 4. Composants natifs Vue 3 (`<Transition>`)

- Privilégier les composants natifs Vue `<Transition>` et `<TransitionGroup>` plutôt que d'injecter des bibliothèques JS lourdes.
- Configurer systématiquement `mode="out-in"` pour les bascules de vues ou d'états textuels afin d'éviter les sauts de disposition dans le flux DOM.
- Aucune dépendance de motion lourde (GSAP, Framer-like > 20 kB) ne doit être introduite sans validation préalable.
