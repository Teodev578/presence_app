# Audit UI/UX de l'espace Paramètres

Date : 2026-09-30
Périmètre : `src/views/SettingsView.vue`, `src/components/shared/ThemeToggle.vue`, et leur intégration dans les deux mises en page.
Contexte : page créée le 2026-09-30, centrée et élargie, apparence ramenée du pied de tiroir, engrenage masqué sur l'écran lui-même.

## 1. Méthode

- Relecture du code de la page et du contrôle d'apparence.
- Rendu headless en thème sombre à 1440 et 390.
- Recherches sur les guides d'écran de paramètres : Android (Design patterns Settings, Source Android), Microsoft (Guidelines for app settings), Apple (HIG Settings), Material 3 (Lists, texte secondaire), et guides de composants (segmented control, confirmation destructive).

## 2. Bonnes pratiques retenues

- **Regrouper et limiter** : sections courtes sous un titre, quatre à cinq réglages au total, les plus utiles en haut, les actions destructrices en bas (Android, Microsoft, UX Collective).
- **Anatomie d'un réglage** : libellé principal, texte secondaire portant l'état, contrôle en fin de ligne. Le libellé reste bref, sans verbe générique ni jargon (Material 3 Lists, Source Android).
- **Contrôle de sélection** : un choix unique et mutuellement exclusif se rend par un groupe segmenté ou une liste à sélection, pas par une pleine largeur diluée. Les segments d'un même groupe gardent un gabarit homogène (Harmonic, eBay EVO).
- **Action destructive** : placée en bas, style danger, conséquence énoncée. La confirmation se discute : le consensus mobile penche pour ne pas confirmer une déconnexion, qui se refait en se reconnectant ; d'autres la recommandent sur mobile où le tap accidentel est facile (UX StackExchange, Primer).
- **Synchronisation** : état courant affiché en texte secondaire, action explicite « Synchroniser maintenant » (Android).
- **Largeur** : colonne bornée centrée sur grand écran, ce qui est fait (Microsoft).

## 3. Constats

| # | Constat | Gravité | Statut |
|---|---|---|---|
| A1 | Le contrôle d'apparence segmenté occupe toute la largeur de la carte. À `max-w-3xl`, chaque segment fait environ 250 px, l'icône et le libellé se perdent. Un groupe segmenté doit garder des segments lisibles, pas étirés. | Moyenne | Proposé |
| A2 | Titres de section en `text-sm font-bold`, alors que la règle 07 §5 donne `text-base font-semibold` pour un titre de carte ou de section. | Basse | Proposé |
| B1 | L'état réseau s'intitule « Connecté ». Dans une application authentifiée, « connecté » se lit comme « session ouverte », pas comme « en ligne ». Le contraste avec « Hors ligne » est réel. | Moyenne | Proposé |
| B2 | « Dernière synchronisation » est en `text-base-content/50`, plus pâle que le reste du texte secondaire en `/60`. | Basse | Proposé |
| C1 | L'avatar à initiales n'est pas masqué aux lecteurs d'écran : « U » est annoncé à côté du nom. | Basse | Proposé |
| C2 | Les boutons « Synchroniser maintenant » et « Se déconnecter » n'exposent pas d'anneau de focus explicite, alors que d'autres écrans le posent. | Basse | Proposé |
| D1 | La déconnexion s'exécute immédiatement, sans confirmation. Le débat est ouvert : friction utile sur mobile, geste banal ailleurs. | Moyenne | Proposé, décision requise |
| E1 | La section « Déconnexion » porte un titre pour une seule action. Le titre peut disparaître au profit du seul bouton, placé en fin de page. | Basse | Proposé |
| F1 | Ordre des sections : révisé le 2026-09-30. Identité en tête, préférence et état applicatif ensuite, destructeur en fin. Nouvel ordre Compte, Synchronisation, Apparence, Déconnexion. | — | Acté |

### Ordre des sections

La recherche confirme l'intuition sur deux points structurants. L'identité vient en tête : Apple place le compte au sommet des réglages, Google ouvre sur « Gérer votre compte Google », Plane liste le profil avant les préférences, Finzen ouvre l'onglet Général sur les informations de compte. L'action destructrice ferme la page : c'est un point constant des guides (Android, Microsoft, UX Collective). Le couple Synchronisation puis Apparence est plus libre : certains guides placent les préférences avant l'état applicatif, d'autres l'inverse. L'ordre retenu range l'état de l'application avant la préférence d'affichage.

## 4. Propositions

1. **Borner le contrôle d'apparence** : enveloppe `max-w-md` autour de `ThemeToggle inline`, ou passage à trois lignes à sélection (libellé + description + radio en fin de ligne), plus proche du gabarit de réglage Material. Trancher (décision 2).
2. **Titres de section** : passer à `text-base font-semibold`, conforme à la règle 07 §5.
3. **État réseau** : remplacer « Connecté » par « En ligne », sans ambiguïté avec la session (décision 3).
4. **Contraste** : « Dernière synchronisation » en `text-base-content/60`.
5. **Avatar** : `aria-hidden="true"` sur les initiales décoratives.
6. **Focus** : anneau `focus-visible:outline-2 focus-visible:outline-primary` sur les deux boutons.
7. **Déconnexion** : conserver l'exécution immédiate ou ajouter `ConfirmModal` (décision 1).
8. **Titre de la section Déconnexion** : le retirer et laisser le bouton en fin de page, ou le garder.

## 5. Vérification prévue

- Oracles source : un oracle dédié contrôlera la largeur bornée du groupe d'apparence, le libellé d'état, le contraste du texte secondaire, l'avatar masqué et le focus.
- Oracle navigateur : montage de la page, mesure de la largeur des segments et des cibles à 44 px.
- `npm run build` en sortie 0, `--all` sans nouvelle régression.

## 6. Références

- Android Developers, « Settings: design patterns » et « Android settings design guidelines ».
- Microsoft Learn, « Guidelines for app settings ».
- Apple, Human Interface Guidelines, « Settings » ; documentation française des réglages Apparence.
- Material Design 3, « Lists » (anatomie, texte secondaire) ; Harmonic et eBay EVO, « Segmented control ».
- UX StackExchange, « Should you always confirm sign-out in a mobile app? » ; Primer, « ConfirmationDialog ».
