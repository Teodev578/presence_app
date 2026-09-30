# Plan d'action : Finitions de l'espace Paramètres

Date : 2026-09-30
Source : `docs/audits/audit-espace-parametres-2026-09-30.md`, section 3.
Statut : proposition, quatre arbitrages en attente (section 6).

## 1. Objectif

Traiter les constats de l'audit des paramètres : borner le contrôle d'apparence, aligner les titres de section sur la règle 07, lever l'ambiguïté de l'état réseau, corriger les détails de contraste, d'accessibilité et de focus, et trancher la confirmation de déconnexion.

## 2. Périmètre

### Fichiers écrits
- `src/views/SettingsView.vue`
- `src/components/shared/ThemeToggle.vue`
- `scripts/verify-gates.mjs`, `scripts/verify-browser.mjs`, `GATES.md`

### Hors périmètre
- La logique de synchronisation (moteur, outbox) et la déconnexion (auth).
- Le bandeau et la navigation, traités par le lot précédent.
- Le pied de tiroir, laissé au statut réseau.

## 3. Constats, priorité et vérification

| # | Constat | Priorité | Vérification |
|---|---|---|---|
| A1 | Groupe d'apparence étiré sur toute la largeur | Moyenne | Oracle navigateur (largeur des segments) |
| A2 | Titres de section hors règle 07 §5 | Basse | Oracle source |
| B1 | « Connecté » ambigu avec la session | Moyenne | Oracle source |
| B2 | Contraste de « Dernière synchronisation » | Basse | Oracle navigateur (contraste) |
| C1 | Avatar non masqué aux lecteurs d'écran | Basse | Oracle source |
| C2 | Focus absent sur les deux boutons | Basse | Oracle source |
| D1 | Déconnexion sans confirmation | Moyenne | Décision |
| E1 | Titre de section pour une action unique | Basse | Oracle source, si retenu |

## 4. Lots d'exécution

### Lot 1 — Apparence et titres de section
- Borner le contrôle d'apparence (`max-w-md`) ou le convertir en lignes à sélection (décision 2).
- Passer les titres de section à `text-base font-semibold`.
Fichiers : `SettingsView.vue`, `ThemeToggle.vue`.
Oracles : `--settings-page`, oracle navigateur.

### Lot 2 — État réseau et contraste
- Remplacer « Connecté » par « En ligne » (décision 3).
- « Dernière synchronisation » en `text-base-content/60`.
Fichiers : `SettingsView.vue`.
Oracles : `--settings-page`, `--voice-conformance`, oracle navigateur.

### Lot 3 — Accessibilité et focus
- Avatar décoratif masqué (`aria-hidden="true"`).
- Anneau de focus visible sur « Synchroniser maintenant » et « Se déconnecter ».
- Éventuellement retirer le titre de la section Déconnexion (décision 4).
Fichiers : `SettingsView.vue`.
Oracles : `--targets`, `--ux-conformance`, oracle source dédié.

### Lot 4 — Déconnexion
- Exécution immédiate (défaut) ou `ConfirmModal` (décision 1).
Fichiers : `SettingsView.vue`.
Oracles : oracle source dédié, oracle navigateur.

### Lot 5 — Clôture
- `node scripts/verify-gates.mjs --all` vert hors échecs préexistants.
- Suite navigateur verte.
- `npm run build` en sortie 0.
- `code-hygiene`.

## 5. Critère d'arrêt

- Les constats de l'audit sont traités, livrés ou actés.
- Le contrôle d'apparence garde des segments lisibles sur grand écran.
- Les titres respectent la règle 07, l'état réseau ne prête plus à confusion, les détails d'accessibilité sont corrigés.
- `npm run build` en sortie 0, `--all` sans régression.

## 6. Arbitrages actés le 2026-09-30

1. **Déconnexion** : exécution immédiate, sans confirmation.
2. **Contrôle d'apparence** : groupe segmenté borné `max-w-md`.
3. **État réseau** : « En ligne » / « Hors ligne ».
4. **Titre de la section Déconnexion** : retiré, seul le bouton reste.
5. **Ordre des sections** : Compte, Synchronisation, Apparence, Déconnexion. Identité en tête, état applicatif puis préférence, destructeur en fin de page. Confirmé par la recherche (Apple, Google, Plane, Finzen) et par la constante « destructeur en dernier ».

### État des lots

- Lot 1 : livré (apparence bornée, titres `text-base font-semibold`).
- Lot 2 : livré (« En ligne », contraste `/60`).
- Lot 3 : livré (avatar masqué, focus visible, titre Déconnexion retiré).
- Lot 4 : livré (déconnexion immédiate confirmée).
- Lot 5 : clôture effectuée, porte G95 étendue verte.

## 7. Disciplines attachées

- `unlazy` : clause `OWNS:` et preuves dans `GATES.md` avant chaque lot.
- `ui-ux-pro-max` et `responsive-adaptive-ui` : lot 1.
- `stop-slop` et `09-ui-copy-and-tone.md` : lots 2 et 4.
- `code-hygiene` : lot 5.
