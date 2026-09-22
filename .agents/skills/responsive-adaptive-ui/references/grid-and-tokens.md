# Grid & Tokens — Référence de dimensionnement

> Source de vérité pour les règles de grille, les breakpoints, les espacements et l'échelle typographique.
> Complément de `spotify-encore-deep-spec.md` — lire ce fichier pour le raisonnement UX.

---

## 1. Breakpoints canoniques

| Nom | Viewport | Classe Tailwind |
|---|---|---|
| xs | < 360px | (défaut, pas de préfixe) |
| sm | >= 360px | `sm:` |
| md | >= 600px | `md:` |
| lg | >= 840px | `lg:` |
| xl | >= 1200px | `xl:` |
| 2xl | >= 1600px | `2xl:` |

---

## 2. Règles de grille par breakpoint

| Breakpoint | Mode | Colonnes | Padding lateral | Gap horizontal | Gap vertical |
|---|---|---|---|---|---|
| xs (< 360px) | Carousel scroll-snap | 2.2 visibles | 12px | 8px | — |
| sm (360–599px) | Carousel scroll-snap | 2.5 visibles | 16px | 12px | — |
| md (600–839px) | Grille fixe | 3 | 24px | 16px | 16px |
| lg (840–1199px) | Grille fixe | 4 | 32px | 16px | 16px |
| xl (1200–1599px) | Grille fixe | 5 | 40px | 20px | 20px |
| 2xl (>= 1600px) | Grille fixe | 6 | 48px | 24px | 24px |

**Seuil de bascule Carousel → Grille** : 600px de largeur viewport.

---

## 3. Hauteurs de sections (espacement vertical inter-sections)

| Contexte | Top d'une section | Bottom d'une section |
|---|---|---|
| Mobile (< 600px) | 24px | 8px |
| Tablet (600–1199px) | 32px | 12px |
| Desktop (>= 1200px) | 40px | 16px |

---

## 4. Échelle d'espacement interne (multiples de 4dp)

```
4dp  — Micro (séparateurs, gaps minimaux entre Caption)
8dp  — Petite (gap entre actions liées, padding mini)
12dp — Standard mobile compact (padding interne Card mobile)
16dp — Standard (padding interne Card, gap grille)
24dp — Large (espacement H1 → contenu, padding container tablet)
32dp — XL (espacement H2 → H2, padding container desktop)
40dp — 2XL (padding container wide, H1 → contenu desktop)
48dp — 3XL (padding container 2xl)
64dp — 4XL (espacement entre grandes sections)
96dp — 5XL (marges éditoriales premium)
```

**Règle absolue** : Aucune valeur hors de cette série. Zéro valeur arbitraire (ex : 15px, 22px, 7px).

---

## 5. Échelle typographique

### 5.1 Valeurs minimales et maximales (interpolation fluide)

| Rôle | Min (360px) | Max (1440px) | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| Display | 28px | 56px | 700 | 1.1 | −0.5px |
| H1 | 24px | 40px | 700 | 1.2 | −0.3px |
| H2 | 18px | 28px | 600 | 1.3 | −0.2px |
| H3 | 14px | 16px | 600 | 1.4 | 0 |
| Body Large | 16px | 18px | 400 | 1.6 | 0 |
| Body | 14px | 16px | 400 | 1.5 | 0 |
| Body Small | 12px | 14px | 400 | 1.5 | 0 |
| Label | 14px | 14px | 500 | 1.0 | +0.1px |
| Caption | 11px | 12px | 400 | 1.4 | +0.2px |
| Overline | 11px | 11px | 500 | 1.2 | +1.0px |

### 5.2 Correspondance avec les classes Tailwind actuelles

| Rôle | Classe Tailwind recommandée |
|---|---|
| Display | `text-3xl md:text-4xl xl:text-5xl font-bold tracking-tight` |
| H1 | `text-2xl md:text-3xl xl:text-4xl font-bold tracking-tight` |
| H2 | `text-lg md:text-xl xl:text-2xl font-semibold` |
| H3 | `text-sm md:text-base font-semibold` |
| Body Large | `text-base md:text-lg font-normal leading-relaxed` |
| Body | `text-sm md:text-base font-normal leading-relaxed` |
| Body Small | `text-xs md:text-sm font-normal` |
| Label | `text-sm font-medium` |
| Caption | `text-[11px] md:text-xs font-normal` |
| Overline | `text-[11px] font-medium uppercase tracking-widest` |

---

## 6. Largeur maximale du contenu textuel

| Rôle | Largeur max (desktop >= 1200px) |
|---|---|
| Body Large, Body | 720px |
| Descriptions de section | 600px |
| H1, H2 | 960px |
| Display | Pleine largeur |
| Cards, grilles | Pleine largeur |

---

## 7. Dimensions des composants de navigation

### Bottom Navigation Bar

| Propriété | Valeur |
|---|---|
| Hauteur | 56dp + safe-area-inset-bottom |
| Fond | bg-base-300 |
| Séparateur | border-t border-base-300/60 |
| Indicateur actif | Pill rounded-full, bg-primary/20, largeur auto |
| Zone de tap par tab | 56dp × (100% / n_tabs) |
| Max tabs | 5 |

### Sidebar Rail (tablet)

| Propriété | Valeur |
|---|---|
| Largeur | 72dp |
| Hauteur item | 48dp |
| Indicateur actif | Barre 3dp à gauche, bg-primary |
| Fond | bg-base-200 |
| Séparateur droite | border-r border-base-300/40 |

### Sidebar déployée (desktop)

| Propriété | Valeur |
|---|---|
| Largeur déployée | 240dp |
| Largeur réduite | 72dp |
| Hauteur item | 48dp |
| Indicateur actif | bg-primary/10 sur toute la rangée |
| Transition open/close | 250ms cubic-bezier(0.2, 0, 0, 1) |

---

## 8. Dimensions du Player Bar

| État | Hauteur | Largeur | Position | Border-radius |
|---|---|---|---|---|
| Mini pill (mobile) | 64dp | calc(100vw − 16dp) | Bottom Nav + 8dp + safe-area | rounded-m3-xl (28px) |
| Bar desktop | 72dp | 100vw | fixed bottom-0 left-0 | 0 |
| Full Player | 100dvh | 100vw | fixed inset-0 | 0 |
