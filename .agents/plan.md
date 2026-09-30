# Plan de Travail Agentique : Ajout du Changement de Mot de Passe dans la Tuile Compte

Ce fichier porte le plan de la tâche en cours, conformément à la règle `.agents/rules/10-planification-taches-fastidieuses.md` et aux garde-fous de `AGENTS.md`.

---

## Tâche en cours

- **Tâche** : Ajout du changement de mot de passe dans la tuile Compte (`SettingsView.vue` et `useAuth.js`).
- **Date** : 2026-09-30
- **Périmètre** :
  - *Fichiers modifiés / créés* :
    - `src/composables/useAuth.js` (méthode `changePassword`)
    - `src/views/SettingsView.vue` (volet de changement de mot de passe dans la section Compte)
    - `scripts/test-change-password.mjs` (oracle de test déterministe)
  - *Hors périmètre* : Schémas Dexie/Supabase, routes de pointage, tiroirs de navigation.
- **Critère d'arrêt** :
  1. `useAuth.js` exporte `changePassword(newPassword)` s'appuyant sur `supabase.auth.updateUser` avec validation et formattage d'erreur.
  2. La section Compte dans `SettingsView.vue` offre un bouton sobre ouvrant un volet M3 intégré comprenant :
     - Nouveau mot de passe (avec bascule affichage / masquage)
     - Confirmation du mot de passe
     - Boutons « Enregistrer le mot de passe » et « Annuler »
     - Retour visuel par toast et message d'erreur contextuel
  3. Cibles tactiles >= 44px (`min-h-11`), tokens `rounded-m3-*`, absence d'ombres prohibées, zéro émoji brut.
  4. Respect strict de la tonalité `09-ui-copy-and-tone.md` (pas de mot proscrit).
  5. `npm run build` réussit avec code 0.
  6. `node scripts/test-change-password.mjs` passe avec code 0 (27 assertions).
  7. Non-régression sur `node scripts/verify-gates.mjs` (G11, G14, G15, G16, G35, G95 validés).

---

### Étapes d'exécution

- [x] **Étape 1 : Ajout de la méthode `changePassword` dans `useAuth.js`**
  - Implémenter `changePassword(newPassword)` avec validation locale (longueur >= 6), gestion des erreurs réseau via `formatAuthError` et appel `supabase.auth.updateUser`.
  - Exposer `changePassword` dans le contrat de retour du composable.
  - Vérification : export vérifié et gestion des retours d'état. *(Validé)*

- [x] **Étape 2 : Conception du volet de modification dans `SettingsView.vue`**
  - Ajouter l'état réactif (`isChangingPassword`, `newPassword`, `confirmPassword`, `showPassword`, `passwordError`, `isSubmittingPassword`).
  - Câbler `useToast` pour notifier la confirmation du changement de mot de passe.
  - Intégrer le bouton de déclenchement dans la tuile Compte et le volet de saisie M3 rétractable (`rounded-m3-md bg-base-100 border border-base-300/60 p-3.5`).
  - Bouton replié calibré en `btn-outline btn-primary` pour un contraste optimal en thème clair et sombre.
  - Vérification : cibles tactiles >= 44px, tokens M3, aucun mot proscrit, aucun émoji. *(Validé)*

- [x] **Étape 3 : Création de l'oracle déterministe `test-change-password.mjs`**
  - Vérifier la présence et signature de `changePassword` dans `useAuth.js`.
  - Vérifier l'absence de tokens proscrits, la conformité M3 et la présence des champs et contrôles.
  - Exécuter `node scripts/test-change-password.mjs` (27 assertions au vert). *(Validé)*

- [x] **Étape 4 : Validation globale et non-régression**
  - Exécuter `node scripts/verify-gates.mjs` (G11, G14, G15, G16, G35, G95 validés).
  - Exécuter `node scripts/test-pwa-install.mjs` et `node scripts/test-theme-toggle.mjs`.
  - Exécuter `npm run build` (succès code 0).
  - Contrôle visuel sur Chrome DevTools (état replié et état déplié validés). *(Validé)*
