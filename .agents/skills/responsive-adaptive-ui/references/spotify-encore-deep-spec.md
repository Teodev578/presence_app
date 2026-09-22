# Spécification Responsive Adaptative — Philosophie Spotify Encore
## Référence profonde pour le skill `responsive-adaptive-ui`

> **Contexte** : PresenceApp · Vue 3 · Tailwind CSS v4 · DaisyUI v5 · Material 3 Tokens · Inter typeface.
> Ce document est la source de vérité du skill. L'agent qui l'invoque doit le lire intégralement avant de produire quoi que ce soit.

---

## PARTIE A — ANATOMIE DES COMPOSANTS

### A.1 — Le composant Card : couches et états

#### Structure anatomique invariante

Un composant Card est un **conteneur d'identité avec action primaire implicite**. Ses couches, de la plus profonde à la plus visible :

```
┌─────────────────────────────────┐
│  Surface (bg-base-200)          │  ← Élévation tonale 1
│  ┌───────────────────────────┐  │
│  │  Artwork zone (ratio 1:1) │  │  ← Toujours carré, jamais rogné
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  Title (1 ligne, ellipse) │  │  ← font-semibold
│  │  Subtitle (1 ligne, opt.) │  │  ← text-base-content/60
│  └───────────────────────────┘  │
└─────────────────────────────────┘
       ↑ rounded-m3-lg partout
```

#### États complets de la Card

| État | Fond | Overlay | Artwork | Bouton Play | Comportement |
|---|---|---|---|---|---|
| **Default** | `bg-base-200` | Aucun | Affiché normalement | Masqué | — |
| **Hovered** (desktop) | `bg-base-300` | Aucun | Légèrement assombri (brightness 90%) | Apparaît (fade-in 150ms), `bg-primary` circulaire, `rounded-full`, icône `text-primary-content` | Curseur pointer |
| **Active / Pressed** | `bg-base-300` | Overlay noir 8% | Scale 0.97, 100ms | Scale 0.95 | Feedback immédiat |
| **Focused** (clavier) | `bg-base-200` | Ring `ring-2 ring-primary ring-offset-2` | Normal | Visible | Ring M3 focus indicator |
| **Disabled** | `bg-base-200/50` | — | Opacity 38% | Masqué | cursor-not-allowed, aria-disabled=true |
| **Loading** (skeleton) | `bg-base-300 animate-pulse` | — | Rectangle arrondi animé | Masqué | Durée max skeleton : 3 secondes |

#### Règle de la Card "fantôme" (affordance de scroll)

Sur mobile (< 600px), la **dernière Card visible dans un Carousel doit être délibérément rognée à 40–60% de sa largeur**. Cette coupure n'est pas un bug de layout : c'est un signal intentionnel indiquant qu'il y a du contenu accessible par swipe.

- Le rognage se produit sur le bord droit du viewport, non sur le bord de la Card elle-même.
- La Card rognée doit rester identifiable : l'artwork doit être visible, même partiellement.
- Le texte sous l'artwork ne doit **pas** être visible sur la Card rognée (trop de confusion cognitive).

---

### A.2 — Le List Item : densité et hiérarchie

#### Structure horizontale

```
[ 8dp ] [ Leading 48dp ] [ 16dp ] [ Text Stack ] [ 16dp ] [ Trailing ] [ 16dp ]
```

- **Hauteur minimum** : 56dp sur mobile (safe touch), 48dp sur desktop (densité).
- **Séparation entre items** : Zéro bordure visuelle. Le padding vertical 8dp top + 8dp bottom crée l'espace sans ligne séparatrice.
- **Leading Media** : Avatar circulaire (`rounded-full`) ou artwork carré (`rounded-m3-sm`). Jamais les deux dans la même liste.

#### États du List Item

| État | Fond de ligne | Indicateur visuel | Comportement |
|---|---|---|---|
| **Default** | Transparent | — | — |
| **Hovered** | `bg-base-200/60` | — | Transition 80ms |
| **Pressed** | `bg-base-200` | — | 100ms, pas de scale sur les lignes |
| **Selected** | `bg-primary/10` | Barre verticale 3dp `bg-primary` à gauche | aria-selected=true |
| **Focused** | Transparent | Ring horizontal sur toute la ligne | Clavier uniquement |
| **Disabled** | Transparent | Opacity 38% sur tout le contenu | Pas d'interaction |

---

### A.3 — Grille et Carousel : règles exhaustives

#### Tableau de comportement par breakpoint

| Breakpoint | Viewport | Mode | Colonnes | Padding container | Gap H | Gap V |
|---|---|---|---|---|---|---|
| **xs** | < 360px | Carousel (scroll-snap) | 2.2 visibles | 12px | 8px | N/A |
| **sm** | 360–599px | Carousel (scroll-snap) | 2.5 visibles | 16px | 12px | N/A |
| **md** | 600–839px | Grille fixe | 3 cols | 24px | 16px | 16px |
| **lg** | 840–1199px | Grille fixe | 4 cols | 32px | 16px | 16px |
| **xl** | 1200–1599px | Grille fixe | 5 cols | 40px | 20px | 20px |
| **2xl** | >= 1600px | Grille fixe (max saturée) | 6 cols | 48px | 24px | 24px |

#### Règle du "Padding partagé" en Carousel

Sur mobile, le padding du container s'applique **uniquement au début du premier item** (bord gauche). La fin du dernier item visible n'a pas de padding terminal — cela permet à la Card fantôme d'affleurer le bord droit du viewport, signalant le scroll sans padding supplémentaire.

#### Scroll Snap

- `scroll-snap-type: x mandatory` sur le container du Carousel.
- `scroll-snap-align: start` sur chaque Card.
- `scroll-behavior: smooth` sur le container.
- L'inertie du scroll est gérée par le système natif : ne jamais implémenter un scroll personnalisé JavaScript sur mobile.

#### Hauteur de section (espacement vertical entre sections)

| Contexte | Espacement top | Espacement bottom |
|---|---|---|
| Mobile | 24dp | 8dp |
| Tablet | 32dp | 12dp |
| Desktop | 40dp | 16dp |

---

## PARTIE B — GESTION DES ZONES TACTILES VS SOURIS

### B.1 — Matrice de navigation

| Dimension | Bottom Nav (< 840px) | Sidebar Rail (840–1199px) | Sidebar Déployée (>= 1200px) |
|---|---|---|---|
| **Position** | Bas, au-dessus de safe-area-inset-bottom | Gauche, hauteur pleine | Gauche, hauteur pleine |
| **Largeur** | 100vw | 72dp fixe | 240dp / 72dp réduit |
| **Items max** | 5 | Illimité | Illimité |
| **Labels** | Sous l'icône (toujours) | Masqués (tooltip hover) | Visibles à droite |
| **Indicateur actif** | Pill M3 colorée | Ligne 3dp bg-primary à gauche | Fond bg-primary/10 sur rangée |
| **Fond** | bg-base-300 + border-t base-300/60 | bg-base-200 | bg-base-200 + border-r base-300/40 |
| **Transition** | N/A | N/A | Slide horizontal 250ms M3 Emphasized |
| **Z-index** | z-50 | z-40 | z-40 |

#### Règle de Safe Area mobile

La Bottom Navigation Bar doit toujours respecter la safe area bottom :
- `padding-bottom: env(safe-area-inset-bottom)` additif à son propre padding.
- La Mini Player Bar qui flotte **au-dessus** de la Bottom Nav doit intégrer la hauteur totale de la Bottom Nav (+ sa safe area) dans son positionnement `bottom`.

---

### B.2 — Dimensions minimales cliquables/tappables

| Élément | Zone tactile mobile | Zone clic desktop | Taille visuelle mobile | Taille visuelle desktop |
|---|---|---|---|---|
| **Bouton primaire (CTA)** | 48dp × pleine largeur | 36dp × auto | 48dp | 36dp |
| **Icône isolée** | 48×48dp | 32×32dp | 24dp | 20dp |
| **Item de liste** | 56dp hauteur | 48dp hauteur | 56dp | 48dp |
| **Bottom Nav Tab** | 56dp × (100%/n) | N/A | 56dp | N/A |
| **Sidebar Item** | N/A | 48dp hauteur × 100% | N/A | 48dp |
| **Input de saisie** | 56dp | 40dp | 56dp | 40dp |
| **Chip / Tag** | 32dp min | 24dp min | 32dp | 24dp |
| **Switch** | 40×24dp (zone 48×48dp) | 36×20dp | 40×24dp | 36×20dp |
| **Checkbox** | 48×48dp (zone étendue) | 24×24dp | 20×20dp | 16×16dp |
| **Slider thumb** | 44×44dp zone tap | 20→24dp hover | 20dp | 16dp |
| **Bouton Play (Mini Bar)** | 48×48dp | N/A | 24dp | N/A |
| **Bouton Play (Full Player)** | 64×64dp | N/A | 32dp | N/A |

**Principe du "padding fantôme"** : tout élément interactif visuellement inférieur à 48dp sur mobile est enveloppé d'un padding transparent compensatoire. Non visible, mais tappable.

**Échelle d'espacement inviolable** : `[4, 8, 12, 16, 24, 32, 48, 64, 96]` dp. Aucune valeur hors de cette série.

---

## PARTIE C — LE PLAYER BAR : ARCHITECTURE D'ÉTAT COMPLÈTE

### C.1 — ÉTAT 1 : Mini Player Bar (Mobile, < 840px)

**Anatomie :**
```
[8dp] [Artwork 48dp] [Titre / Sous-titre] [Play 48dp] [Next 48dp] [8dp]
                     ────── progress 2dp ────────
[Bottom Nav + safe-area]
```

**Propriétés :**
- Hauteur : 64dp
- Marge : 0 8dp 8dp 8dp (floating pill)
- Forme : rounded-m3-xl (28px)
- Fond : bg-base-300/90 avec backdrop-blur-md
- Progress : 2dp, bg-primary, non interactif, arrondi identique à la pill

**États internes :**

| Lecture | Artwork | Icône Play | Note |
|---|---|---|---|
| Active | Légère animation | Pause ⏸ | Animation subtile |
| Pause | Statique | Play ▶ | — |
| Chargement | Skeleton pulsant | Spinner | — |
| Erreur | Icône ! rouge | Grisé | "Erreur de lecture" |
| Hors ligne | Badge "Hors ligne" | Désactivé | — |

**Gestes :**
- Tap → Ouvre le Full Player
- Swipe Up → Ouvre le Full Player (bottom sheet)
- Swipe Right > 40% → Dismiss + haptic
- Swipe Right < 40% → Snap-back élastique

---

### C.2 — ÉTAT 2 : Player Bar Desktop (>= 840px)

**3 zones horizontales :**

```
| [Art 48dp] [Title | Sub] [♥] | [⏮][⏪][⏯][⏩][⏭] + slider | [Vol] [☰] [⛶] |
|          25%                 |           50%               |      25%       |
```

**Propriétés :**
- Hauteur : 72dp
- Position : fixed bottom-0 left-0, pleine largeur, z-50
- Fond : bg-base-300, border-top 1px base-300
- Aucun border-radius

**Micro-interaction slider :**
- Repos : 4dp de hauteur, bg-primary/30 (passée), bg-base-content/20 (à venir)
- Hover : 100ms → 8dp, curseur draggable 16dp apparaît
- Drag : Cursor 16dp, hauteur 8dp, temps mis à jour en temps réel

---

### C.3 — ÉTAT 3 : Full Player (Mobile, full-screen)

**Anatomie verticale :**
```
[Status bar]
[← Retour]                    [⋮ Options]
              ↕ 32dp
[─ Artwork (vw − 32dp, ratio 1:1, rounded-m3-xl) ─]
              ↕ 32dp
[Titre H2]
[Sous-titre]                  [♥]
              ↕ 24dp
[─── Progress slider (pleine largeur) ───]
[0:00]                       [−3:42]
              ↕ 24dp
[⏮ 48dp] [⏪ 48dp] [⏯ 64dp] [⏩ 48dp] [⏭ 48dp]
              ↕ 24dp
[🔀]                               [☰]
[Safe area bottom]
```

**Fond dynamique :**
- Extraction de la couleur dominante de l'artwork
- `radial-gradient(ellipse 120% 60% at 50% 0%, {dominant-color}50%, transparent)` sur bg-base-100
- Cross-fade du gradient en 600ms lors du changement de contenu

---

### C.4 — Transitions et animations

**Mini → Full (Shared Element Transition) :**
- Artwork 48dp morphe vers artwork pleine largeur
- La pill s'élargit vers le haut en bottom sheet expansive
- Titre cross-fade de tronqué vers H2
- Durée : 350ms, courbe `cubic-bezier(0.2, 0, 0, 1.0)` (M3 Emphasized)
- Nouveaux contrôles : staggered fade-in, délai 100ms, 50ms entre chaque

**Full → Mini (fermeture via swipe down) :**
- Seuil de fermeture : > 35% de la hauteur du viewport
- Sous le seuil → snap back avec `cubic-bezier(0.34, 1.56, 0.64, 1)` (légère élasticité)
- Durée de fermeture : 280ms

### C.5 — Tableau exhaustif des éléments par état

| Élément | Mini Mobile | Bar Desktop | Full Mobile |
|---|---|---|---|
| Artwork 48dp | Oui | Oui | Non |
| Artwork large | Non | Non | Oui (vw−32dp) |
| Titre tronqué | Oui | Oui | Non |
| Titre H2 | Non | Non | Oui |
| Sous-titre tronqué | Oui | Oui | Non |
| Sous-titre full | Non | Non | Oui |
| Bouton Favori | Non | Oui | Oui |
| Bouton Précédent | Non | Oui | Oui |
| Play/Pause (48dp tap) | Oui | Oui (36dp clic) | Non |
| Play/Pause (64dp tap) | Non | Non | Oui |
| Bouton Suivant | Oui | Oui | Oui |
| Bouton Mélanger | Non | Oui | Oui |
| Bouton Répéter | Non | Oui | Oui |
| Progress indicateur 2dp | Oui (non interactif) | Non | Non |
| Progress slider 4→8dp | Non | Oui (hover) | Non |
| Progress slider 4→12dp | Non | Non | Oui (tap) |
| Temps écoulé/restant | Non | Non | Oui |
| Volume slider | Non | Oui | Non |
| Bouton Queue | Non | Oui | Oui |
| Bouton Options | Non | Non | Oui |
| Bouton Retour | Non | Non | Oui |
| Bouton Fullscreen | Non | Oui | Non |
| Fond coloré dynamique | Non | Non | Oui |
| Border-radius pill | Oui (rounded-m3-xl) | Non | Non |
| Marge flottante | Oui (8dp) | Non | Non |
| Geste swipe-up (ouvrir) | Oui | Non | Non |
| Geste swipe-down (fermer) | Non | Non | Oui |
| Geste swipe-right (dismiss) | Oui | Non | Non |

---

## PARTIE D — TYPOGRAPHIE ADAPTATIVE

### D.1 — Échelle complète

| Rôle | Usage | Min (360px) | Max (1440px) | Weight | Interligne | Tracking |
|---|---|---|---|---|---|---|
| **Display** | Hero, accueil | 28px | 56px | 700 | 1.1 | −0.5px |
| **H1 Page** | Nom de lieu, page titre | 24px | 40px | 700 | 1.2 | −0.3px |
| **H2 Section** | En-têtes de sections | 18px | 28px | 600 | 1.3 | −0.2px |
| **H3 Card** | Titre de card/item | 14px | 16px | 600 | 1.4 | 0 |
| **Body Large** | Descriptions | 16px | 18px | 400 | 1.6 | 0 |
| **Body** | Texte courant | 14px | 16px | 400 | 1.5 | 0 |
| **Body Small** | Métadonnées | 12px | 14px | 400 | 1.5 | 0 |
| **Label** | Boutons, tabs, chips | 14px | 14px | 500 | 1.0 | +0.1px |
| **Caption** | Timestamps, durées | 11px | 12px | 400 | 1.4 | +0.2px |
| **Overline** | Catégories (majuscules) | 11px | 11px | 500 | 1.2 | +1.0px |

**Plancher absolu** : 11px pour tout texte lisible. `text-transform: uppercase` réservé à `Overline` uniquement.

### D.2 — Margin Collapse éditorial

| Transition | Mobile | Desktop |
|---|---|---|
| H1 → Premier contenu | 24dp | 40dp |
| H2 → Premier contenu de section | 12dp | 16dp |
| H2 → H2 (sections consécutives) | 32dp | 48dp |
| H2 → H3 (sous-section) | 8dp | 8dp |
| H3 → Grille/Liste | 12dp | 12dp |
| Body → Body (paragraphes) | 16dp | 16dp |

### D.3 — Largeur max du contenu textuel (desktop >= 1200px)

| Rôle | Largeur max | Raison |
|---|---|---|
| Body Large, Body | 720px centré | 65–75 caractères par ligne |
| H1, H2 | 960px | Autorité éditoriale |
| Display | Pleine largeur | Impact maximal |
| Descriptions de section | 600px centré | Confort de lecture des blurbs |
| Cards, grilles | Pleine largeur | Contenu visuel |

---

## PARTIE E — MOTION PRINCIPLES

### E.1 — Courbes d'accélération M3

| Courbe | Valeur | Usage |
|---|---|---|
| **Emphasized** | `cubic-bezier(0.2, 0, 0, 1.0)` | Bottom Sheet open, Full Player open |
| **Emphasized decelerate** | `cubic-bezier(0.05, 0.7, 0.1, 1.0)` | Élément entrant depuis le bas/côté |
| **Emphasized accelerate** | `cubic-bezier(0.3, 0, 0.8, 0.15)` | Élément quittant l'écran |
| **Standard** | `cubic-bezier(0.2, 0, 0, 1.0)` | Transitions de contenu, fade |
| **Linear** | `linear` | Progressions, sliders |

### E.2 — Durées standards

| Type | Durée | Courbe |
|---|---|---|
| Micro-interaction (hover, press) | 80–120ms | Standard |
| Show/hide composant | 150–200ms | Standard decelerate/accelerate |
| Navigation entre pages | 250–300ms | Emphasized |
| Bottom Sheet / Full Player | 300–400ms | Emphasized decelerate |
| Shared Element Transition | 350ms | Emphasized |
| Gradient de fond Full Player | 600ms | Linear |
| Skeleton loader | 1500ms infini | ease-in-out |

### E.3 — Règle prefers-reduced-motion

Si activé :
- Toutes les transitions de translation/scale → durée 0ms
- Cross-fades d'opacité conservés mais réduits à 150ms maximum
- Animations de rotation → remplacées par opacité pulsante statique
- Shared Element Transition Full Player → simple cross-fade

### E.4 — Performance

- GPU uniquement : utiliser `transform` et `opacity`. Jamais `width`, `height`, `top`, `left`.
- `will-change` appliqué dynamiquement juste avant l'animation, retiré immédiatement après.
- Budget jank : 60fps sur appareil mi-gamme.

---

## PARTIE F — ACCESSIBILITÉ (WCAG AA)

| Contexte | Ratio minimum |
|---|---|
| Texte standard (< 18px non-bold) | 4.5:1 |
| Texte large (>= 18px ou >= 14px bold) | 3:1 |
| Composants interactifs (bordures, icônes) | 3:1 |
| Texte désactivé | Exempté (opacity 38%) |

**Focus** : `ring-2 ring-primary ring-offset-2 rounded-m3-sm` sur tout élément interactif.
**ARIA** : Bottom Nav → `role="navigation"` + `aria-label="Navigation principale"`. Progress bar → `role="progressbar"` + `aria-valuenow/min/max`. Icônes seules → `aria-label` obligatoire.
**Full Player** : Focus trap pendant l'ouverture.

---

## SYNTHÈSE — Matrice décisionnelle responsive

| Signal | < 360px | 360–599px | 600–839px | 840–1199px | >= 1200px |
|---|---|---|---|---|---|
| Grille | Carousel 2.2 | Carousel 2.5 | 3 cols | 4 cols | 5–6 cols |
| Navigation | Bottom Nav icônes | Bottom Nav + labels | Bottom Nav + labels | Sidebar Rail | Sidebar 240dp |
| Player Bar | Mini pill 64dp | Mini pill 64dp | Mini pill 64dp | Bar 72dp fullwidth | Bar 72dp fullwidth |
| Padding | 12px | 16px | 24px | 32px | 40px |
| Densité min | 56dp | 56dp | 52dp | 48dp | 48dp |
| H1 typo | 24px | 24–28px | 28–32px | 32–36px | 36–40px |
| Progress | Indicateur 2dp | Indicateur 2dp | Indicateur 2dp | Slider 4→8dp | Slider 4→8dp |
| Safe area | Oui | Oui | Partiel | Non | Non |
| Reduced motion | Respecté | Respecté | Respecté | Respecté | Respecté |
