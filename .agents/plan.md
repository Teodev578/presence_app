# Plan de Travail Agentique : Refonte de la Tuile Apparence (Vignettes de Prévisualisation M3)

Ce fichier porte le plan de la tâche en cours, conformément à la règle `.agents/rules/10-planification-taches-fastidieuses.md` et au garde-fou n°3 de `AGENTS.md`.

---

## Tâche en cours

- **Tâche** : Conception et intégration des cartes de prévisualisation graphique thématique M3 dans la tuile Apparence.
- **Date** : 2026-09-30
- **Périmètre** :
  - *Fichiers modifiés* : `src/components/shared/ThemeToggle.vue`, `src/views/SettingsView.vue`.
  - *Hors périmètre* : Schémas Dexie/Supabase, logique de synchronisation, autres vues.
- **Critère d'arrêt** :
  1. Les trois choix (Automatique, Clair, Sombre) sont présentés sous forme de cartes de prévisualisation interactives avec micro-maquettes visuelles.
  2. L'état actif est mis en exergue par un anneau et une bordure primaire (`ring-2 ring-primary/30 border-primary bg-primary/5`).
  3. En mode Automatique, la résolution système en cours (*Clair* ou *Sombre*) est explicitée de façon dynamique.
  4. Strict respect des tokens de rayon Material 3 (`rounded-m3-*`), absence d'ombres prohibées, cibles tactiles supérieures ou égales à 44 px.
  5. `npm run build` réussit avec code 0.
  6. `node scripts/verify-gates.mjs` passe avec succès (G11, G12, G13, G14, G15, G16, G95).
  7. `node scripts/test-theme-toggle.mjs` passe toutes ses assertions au vert.

---

### Étapes d'exécution

- [x] **Étape 1 : Logique de détection de résolution système**
  - Câbler dans `ThemeToggle.vue` une référence réactive `systemIsDark` écoutant `prefers-color-scheme: dark`.
  - Exposer le libellé descriptif dynamique pour le mode actif.
  - Vérification : le composant sait si le système est sombre ou clair en mode automatique. *(Validé)*

- [x] **Étape 2 : Création des vignettes de prévisualisation M3**
  - Remplacer le simple conteneur segmenté par une grille de trois cartes interactives (`role="radio"`, `aria-checked`, `min-h-11`).
  - Intégrer les micro-maquettes CSS : miniature claire avec en-tête bleu, miniature sombre avec contrastes profonds, miniature automatique bicolore/scindée.
  - Vérification : conformité stricte des tokens M3 (`rounded-m3-md`, `rounded-m3-xs`, `border-base-300`, etc.). *(Validé)*

- [x] **Étape 3 : Zone d'information contextuelle et affinage SettingsView**
  - Insérer sous les cartes le bandeau d'information contextuelle (résolution actuelle et guide d'usage).
  - Maintenir l'ancrage et la cohérence de grille dans `SettingsView.vue` (préservation de `max-w-md` requis par G95).
  - Vérification : équilibre visuel parfait en vis-à-vis de la tuile Autorisations. *(Validé)*

- [x] **Étape 4 : Validation des oracles et du build**
  - Exécuter `npm run build`. *(Code 0)*
  - Exécuter `node scripts/verify-gates.mjs`. *(G11-G16, G45, G95 validés)*
  - Exécuter `node scripts/test-theme-toggle.mjs`. *(28 assertions comportementales et cohérence storage key validées)*
