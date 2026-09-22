# Anatomie des Composants — Référence d'états

> Source de vérité pour les états visuels de chaque composant.
> Consulter en priorité lors de l'implémentation d'un nouveau composant ou de la correction d'un état existant.
> Compatible avec `.agents/rules/07-design-system.md` (M3 + DaisyUI v5).

---

## 1. Card

### Structure anatomique

```
┌─────────────────────────────────────────┐
│  bg-base-200 · rounded-m3-lg (16px)     │
│  ┌─────────────────────────────────┐    │
│  │  ARTWORK (ratio 1:1 invariant)  │    │
│  │  rounded-m3-md sur l'artwork    │    │
│  └─────────────────────────────────┘    │
│  ↕ padding 12dp (mobile) / 16dp (desk) │
│  ┌─────────────────────────────────┐    │
│  │  Titre — 1 ligne, ellipse       │    │  ← H3 (font-semibold)
│  │  Sous-titre (optionnel) — 1 lig │    │  ← Body Small (text-base-content/60)
│  └─────────────────────────────────┘    │
│  ↕ padding 12dp (mobile) / 16dp (desk) │
└─────────────────────────────────────────┘
```

### États

| État | Fond | Artwork | Overlay | Bouton Play | Note |
|---|---|---|---|---|---|
| Default | bg-base-200 | Normal | — | Masqué | — |
| Hovered | bg-base-300 | brightness-90 | — | Apparaît fade 150ms, bg-primary rounded-full, icône text-primary-content | Desktop uniquement |
| Pressed | bg-base-300 | scale 0.97 100ms | bg-black/8 | scale 0.95 | — |
| Focused | bg-base-200 | Normal | ring-2 ring-primary ring-offset-2 | Visible | Clavier uniquement |
| Disabled | bg-base-200/50 | opacity-38 | — | Masqué | aria-disabled=true, cursor-not-allowed |
| Loading | bg-base-300 | Skeleton rectangle arrondi animate-pulse | — | Masqué | Max 3 secondes |

### Règles de la Card fantôme (Carousel mobile)

- Dernière card visible rognée à 40–60% de sa largeur sur le bord droit du viewport.
- L'artwork doit rester partiellement visible (affordance de scroll).
- Le texte sous l'artwork ne doit PAS être visible sur la card rognée.

---

## 2. List Item

### Structure horizontale

```
[ 8dp ] [ Leading 48dp ] [ 16dp ] [ Text Stack · flex-1 ] [ 16dp ] [ Trailing ] [ 16dp ]
```

### Sous-composants

| Sous-composant | Mobile | Desktop | Type |
|---|---|---|---|
| Leading Media | 48×48dp | 40×40dp | Avatar rounded-full OU artwork rounded-m3-sm (jamais les deux) |
| Text Stack | flex-1 | flex-1 | Titre 1 ligne + Sous-titre 1 ligne (ellipse) |
| Trailing | Fixe | Fixe | Durée, badge, bouton ⋮ |
| Hauteur min | 56dp | 48dp | — |

### États

| État | Fond | Indicateur | Comportement |
|---|---|---|---|
| Default | Transparent | — | — |
| Hovered | bg-base-200/60 | — | Transition 80ms |
| Pressed | bg-base-200 | — | 100ms, pas de scale |
| Selected | bg-primary/10 | Barre 3dp bg-primary à gauche | aria-selected=true |
| Focused | Transparent | Ring horizontal pleine largeur | Clavier uniquement |
| Disabled | Transparent | opacity-38 sur tout le contenu | Pas d'interaction |

### Séparateur

Aucune ligne `<hr>` entre les items. La séparation est assurée par le padding vertical de 8dp top + 8dp bottom sur chaque item.

---

## 3. Player Bar — Mini Pill (Mobile, < 840px)

### Anatomie

```
[8dp] [Art 48dp rounded-m3-md] [16dp] [Title · Sub] [flex-1] [Play 48dp] [Next 48dp] [8dp]
                      ──── progress bar 2dp bg-primary ────
```

### Propriétés

| Propriété | Valeur |
|---|---|
| Hauteur | 64dp |
| Marge | 0 8dp 8dp 8dp |
| Border-radius | rounded-m3-xl (28px) |
| Fond | bg-base-300/90 + backdrop-blur-md |
| Progress | 2dp, bg-primary, non interactif, bottom de la pill |
| Z-index | z-40 (derrière la Bottom Nav z-50) |
| Position | fixed, bottom = hauteur Bottom Nav + safe-area-inset-bottom + 8dp |

### États internes

| Lecture | Artwork | Icône |
|---|---|---|
| Active | Animation subtile (pulsation légère) | ⏸ Pause |
| Pause | Statique | ▶ Play |
| Chargement | Skeleton pulsant | Spinner centré |
| Erreur | Icône ! rouge à la place de l'artwork | Grisé |
| Hors ligne | Badge "Hors ligne" sur artwork | Désactivé |

### Gestes reconnus

| Geste | Résultat |
|---|---|
| Tap | Ouvre Full Player |
| Swipe Up | Ouvre Full Player (bottom sheet) |
| Swipe Right > 40% de la largeur | Dismiss + haptic |
| Swipe Right < 40% | Snap-back élastique |

---

## 4. Player Bar — Desktop (>= 840px)

### 3 zones horizontales

| Zone | Largeur | Contenu |
|---|---|---|
| Gauche | 25% | Artwork 48dp + Titre + Sous-titre + Bouton Favori ♥ |
| Centre | 50% | Contrôles (⏮⏪⏯⏩⏭) + Slider de progression |
| Droite | 25% | Volume slider + Bouton Queue ☰ + Bouton Fullscreen ⛶ |

### Propriétés

| Propriété | Valeur |
|---|---|
| Hauteur | 72dp |
| Largeur | 100vw |
| Position | fixed bottom-0 left-0 z-50 |
| Fond | bg-base-300 |
| Séparateur top | border-top 1px var(--color-base-300) |
| Border-radius | 0 (pas d'arrondi) |

### Micro-interaction du slider de progression

| Phase | Épaisseur | Couleur passée | Couleur à venir | Curseur |
|---|---|---|---|---|
| Repos | 4dp | bg-primary/30 | bg-base-content/20 | Masqué |
| Hover (curseur au-dessus) | 8dp (transition 100ms) | bg-primary | bg-base-content/40 | 16dp draggable |
| Drag | 8dp | bg-primary | bg-base-content/40 | 16dp, temps mis à jour |

---

## 5. Player Bar — Full Player (Mobile, full-screen)

### Anatomie verticale

| Élément | Dimensions | Position |
|---|---|---|
| Barre de statut | Hauteur système | Top |
| Bouton Retour ← | 48×48dp | Top-left |
| Bouton Options ⋮ | 48×48dp | Top-right |
| Espacement | 32dp | — |
| Artwork | vw − 32dp, ratio 1:1 | Centré |
| Espacement | 32dp | — |
| Titre H2 | Pleine largeur | — |
| Sous-titre + Favori ♥ | Ligne flex between | — |
| Espacement | 24dp | — |
| Slider de progression | Pleine largeur | — |
| Temps écoulé / restant | Flex between | — |
| Espacement | 24dp | — |
| Contrôles (⏮⏪⏯⏩⏭) | Flex center, gap 8dp | — |
| ⏮⏪⏩⏭ : 48×48dp | ⏯ : 64×64dp | — |
| Espacement | 24dp | — |
| Mélanger 🔀 / Queue ☰ | Flex between | — |
| Safe area bottom | Hauteur système | Bottom |

### Fond dynamique

- Extraction de la couleur dominante de l'artwork (Canvas API)
- `radial-gradient(ellipse 120% 60% at 50% 0%, {dominant-color}50%, transparent)` sur bg-base-100
- Cross-fade du gradient en 600ms lors du changement de contenu

---

## 6. Bottom Navigation Bar

### Structure

```
[ Tab 1 · 56dp ] [ Tab 2 · 56dp ] [ Tab 3 · 56dp ] [ Tab 4 · 56dp ] [ Tab 5 · 56dp ]
                  ── 56dp hauteur totale ──
                  ── safe-area-inset-bottom additionnel ──
```

### États par tab

| État | Icône | Label | Indicateur |
|---|---|---|---|
| Inactif | text-base-content/60, 24dp | Body Small, text-base-content/60 | Aucun |
| Actif | text-primary, 24dp | Body Small, text-primary, font-medium | Pill rounded-full bg-primary/20 derrière l'icône |
| Hovered | text-base-content/80 | — | bg-base-300/30 circulaire derrière l'icône |
| Focused | text-base-content | — | ring-2 ring-primary circulaire |

### ARIA

```
role="navigation"
aria-label="Navigation principale"
// Chaque tab :
role="tab"
aria-selected="true/false"
aria-label="{nom du tab}"
```

---

## 7. Sidebar Rail (Tablet, 840–1199px)

### Structure

```
[72dp width]
─────────────
[Icône 24dp centré] ← hauteur 48dp
[Indicateur 3dp ←]  ← si actif
─────────────
```

### États

| État | Fond de l'item | Icône | Indicateur |
|---|---|---|---|
| Inactif | Transparent | text-base-content/60 | Aucun |
| Actif | bg-primary/10 | text-primary | Barre 3dp bg-primary à gauche, hauteur 24dp |
| Hovered | bg-base-200/60 | text-base-content/80 | Aucun |
| Focused | Transparent | text-base-content | Ring sur l'icône |

---

## 8. Sidebar Déployée (Desktop, >= 1200px)

### Structure par item

```
[ 16dp ] [ Icône 20dp ] [ 12dp ] [ Label Body ] [ flex-1 ] [ 16dp ]
──────── hauteur 48dp ────────
```

### Transition d'ouverture/fermeture

| Propriété | Valeur |
|---|---|
| Durée | 250ms |
| Courbe | cubic-bezier(0.2, 0, 0, 1) (M3 Emphasized) |
| Propriété animée | width (72dp → 240dp) |
| Contenu | Labels apparaissent/disparaissent en cross-fade 100ms |

---

## Conventions de tokens M3 à respecter (rappel)

Tout composant de ce skill doit impérativement utiliser les tokens définis dans `.agents/rules/07-design-system.md` :

| Usage | Token à utiliser | Token interdit |
|---|---|---|
| Surface principale | bg-base-100 | bg-white, bg-gray-50 |
| Cartes, conteneurs | bg-base-200 | bg-gray-100, bg-slate-100 |
| Barres, nav, popovers | bg-base-300 | bg-gray-200 |
| Texte principal | text-base-content | text-gray-900, text-black |
| Texte secondaire | text-base-content/60 | text-gray-500 |
| Action principale | bg-primary | bg-blue-600 |
| Contraste sur primary | text-primary-content | text-white |
| Erreur | text-error, bg-error | text-red-500 |
| Bordures subtiles | border-base-300/40 | border-gray-200 |

**Élévation** : Jamais `shadow-lg`, `shadow-2xl`. Au maximum `shadow-xs` ou `shadow-sm` combiné à une variation de surface.
**Arrondis** : Uniquement `rounded-m3-xs` (4px) à `rounded-m3-xl` (28px) ou `rounded-full`. Jamais `rounded-lg` natif Tailwind.
