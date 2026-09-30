# Plan d'action : Navigation, retour en bandeau

Date : 2026-09-30
Statut : proposition, en attente des arbitrages de la section 7. Aucun code modifié.

## 1. Objectif

Déplacer l'action de retour des pages vers le bandeau supérieur, et unifier le bandeau comme une vraie barre d'application : une commande de navigation en tête, le titre de l'écran, et plus aucune mention du nom de l'espace. La page Paramètres affiche « Paramètres » précédé d'une flèche de retour, au lieu de « Espace Collaborateur » ou « Espace Manager ».

## 2. Périmètre

### Fichiers écrits
- `src/layouts/ManagerLayout.vue`, `src/layouts/EmployeeLayout.vue` (bandeau et commande de navigation)
- `src/views/SettingsView.vue` (retrait du bouton Retour de contenu)
- `src/views/employee/CheckInView.vue`, `CheckOutView.vue`, `AvailabilitiesView.vue` (retrait du bouton Retour de contenu)
- Éventuellement un composant partagé de bandeau ou une table de routes.
- `scripts/verify-gates.mjs`, `scripts/verify-browser.mjs`, `GATES.md`

### Hors périmètre
- La logique de pointage, la transaction Dexie, l'outbox.
- Le routeur (`src/router/index.js`) : la navigation reste par hash, seul l'affichage du bandeau change.
- Le contenu des pages, hors le bouton Retour.

## 3. Recherches et bonnes pratiques

- **Material Design 3, App bars** : la commande de tête sert à la navigation. Elle est soit un menu (ouvre la navigation), soit une flèche de retour qui revient à l'écran précédent. La barre porte un titre d'écran et une à deux actions au maximum. La barre n'apparaît que pour les écrans descendants, pas pour les destinations de premier niveau gérées par le tiroir.
- **Material Design 3, accessibilité** : le focus initial tombe sur la commande de tête, qui est le premier élément interactif. Un bouton d'icône porte un nom accessible décrivant l'action.
- **Apple HIG, Toolbars et Navigation Bars** : privilégier le symbole standard de retour, sans libellé « Retour / Back ». Placer les commandes de navigation en tête. Limiter la barre au titre, au retour et à une action de contenu. Éviter la redondance entre la barre et le contenu.
- **W3C WAI, « Let Users Go Back »** : le bouton de retour standard est le moyen le plus prévisible de revenir en arrière ; l'utilisateur ne doit pas perdre son travail.
- **Accessibilité générique** : cible tactile de 44 px minimum, icône `aria-hidden`, nom accessible sur le bouton, anneau de focus visible.
- **Anti-pattern documenté** : un bouton de retour à la fois dans la barre et dans le contenu. Le retour vit dans la barre ; le contenu porte le titre et l'action utile.

## 4. Modèle de navigation proposé

Règle : **la flèche de retour apparaît sur les écrans qui ne sont pas une destination directe du tiroir.** Les destinations du tiroir restent des écrans de premier niveau, sans retour, avec le hamburger sous 840 px et rien une fois la barre ancrée.

| Espace | Écran | Destination du tiroir | Commande de tête | Titre du bandeau |
|---|---|---|---|---|
| Employé | Pointage (accueil) | oui | hamburger (mobile) / rien (ancré) | Pointage |
| Employé | Validation d'arrivée | non | retour | Valider mon arrivée |
| Employé | Validation de départ | non | retour | Valider mon départ |
| Employé | Ma disponibilité | oui | hamburger / rien | Ma disponibilité |
| Employé | Paramètres | non | retour | Paramètres |
| Gestionnaire | Tableau de bord | oui | hamburger / rien | Tableau de bord |
| Gestionnaire | Sites, Présences, Disponibilités, Collaborateurs, Équipes, Export | oui | hamburger / rien | libellé du module |
| Gestionnaire | Paramètres | non | retour | Paramètres |

Le retour pointe vers l'accueil de l'espace : `/employee` ou `/manager`.

Le nom de l'espace disparaît du bandeau. Il reste porté par le badge de la barre latérale.

## 5. Lots d'exécution

### Lot 1 — Table de routes et bandeau unifié
- Définir pour chaque espace une table `chemin → { titre, retour }`.
- Le bandeau lit cette table pour le titre et la commande de tête.
- Supprimer `activeTitle` au profit de la table, avec repli sur le nom du module.
Fichiers : `ManagerLayout.vue`, `EmployeeLayout.vue`, `verify-gates.mjs`.
Oracles : `--manager-grammar`, `--drawer-shared-grammar`, `--settings-page`.

### Lot 2 — Commande de retour
- Bouton de retour en tête du bandeau, cible 44 px, icône `aria-hidden`, `aria-label="Retour"` et `title="Retour"`.
- La flèche remplace le hamburger sur les écrans descendants sous 840 px ; elle s'ajoute en tête sur desktop ancré.
- Le retour pointe vers l'accueil de l'espace.
Fichiers : `ManagerLayout.vue`, `EmployeeLayout.vue`, `verify-browser.mjs`.
Oracles : `--manager-nav-targets`, `--nav-docking`, `--sidebar-handle`, extension navigateur.

### Lot 3 — Retrait des retours de contenu
- Retirer le bouton « Retour » de `CheckInView`, `CheckOutView`, l'espace employé `AvailabilitiesView` et `SettingsView`.
- Recomposer l'en-tête de contenu : titre et sous-titre seuls, ou suppression du bloc si le bandeau suffit (arbitrage 2).
Fichiers : les quatre vues.
Oracles : `--ux-conformance`, `--motion-conformance` (la transition de route reste), `--employee-finish`.

### Lot 4 — Clôture
- `node scripts/verify-gates.mjs --all` vert hors échecs préexistants.
- Suite navigateur verte.
- `npm run build` en sortie 0.

## 6. Critère d'arrêt

- Le bandeau offre une commande de navigation cohérente : retour sur les écrans descendants, hamburger sur les destinations de tiroir sous 840 px.
- Aucun nom d'espace dans le bandeau ; le titre de l'écran est celui de la table.
- Aucun bouton de retour en double dans le contenu.
- La cible du retour tient 44 px, le bouton porte un nom accessible et un focus visible.
- `npm run build` en sortie 0, `--all` sans régression.

## 7. Arbitrages actés le 2026-09-30

1. **Portée du retour** : les écrans hors tiroir (validation d'arrivée, validation de départ, paramètres) à toute largeur ; les destinations du tiroir une fois le tiroir masqué (mobile).
2. **En-tête de contenu** : l'en-tête de la page Paramètres est retiré, le bandeau porte le titre. Les autres pages conservent leur titre de contexte, sans bouton Retour.
3. **Mobile descendant** : la flèche remplace le hamburger.
4. **Ma disponibilité (employé)** : retour dans le bandeau sur mobile, rien en tablette et desktop où la barre latérale affiche déjà l'entrée.
5. **Forme du bouton** : flèche seule avec nom accessible `Retour`.

### État des lots

- Lot 1 : livré (table de routes, titre de bandeau).
- Lot 2 : livré (bouton de retour, 44px, nom accessible).
- Lot 3 : livré (retours de contenu retirés, en-tête de paramètres retiré).
- Lot 4 : clôture effectuée, porte G97 verte.

## 8. Références

- Material Design 3, « Top app bar: Guidelines » et « Accessibility ».
- Apple Human Interface Guidelines, « Toolbars » et « Navigation Bars ».
- W3C WAI, « Let Users Go Back », Cognitive Accessibility Design Pattern.
- W3C WAI, Button Pattern ; règles internes `.agents/rules/07-design-system.md` §7 et `.agents/rules/09-ui-copy-and-tone.md`.
