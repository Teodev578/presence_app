# Plan : Éradication des Temps de Chargement & Alignement Local-First Intégral

Date : 2026-10-01
Déclencheur : Présence d'indicateurs et de temps de chargement bloquants dans une application architecturée en Local-First
Statut : Terminé (Validé par les portes G111 à G115 et npm run build)

## 1. Périmètre

### Fichiers lus
- `src/views/manager/TeamsView.vue`
- `src/views/manager/EmployeesView.vue`
- `src/views/manager/DashboardView.vue`
- `src/views/manager/PresencesView.vue`
- `src/views/manager/AvailabilitiesView.vue`
- `src/views/employee/CheckInView.vue`
- `src/views/employee/CheckOutView.vue`
- `src/composables/useSyncEngine.js`
- `src/composables/useLocations.js`
- `src/lib/db.js`
- `GATES.md`

### Fichiers à modifier
1. `src/views/manager/TeamsView.vue` :
   - Élimination des requêtes réseau distantes `supabase.from('teams')`.
   - Lecture réactive locale via `useLiveQuery` sur `db.teams` et `db.profiles`.
   - Écritures locales atomiques (création, renommage, archivage) via `db.transaction('rw', db.teams, db.sync_outbox, ...)` avec UUIDv7.
   - Suppression de l'état bloquant `loading = ref(true)` et du squelette d'attente.

2. `src/views/manager/EmployeesView.vue` :
   - Élimination des requêtes réseau distantes `supabase.from('profiles')` et `supabase.from('teams')`.
   - Lecture réactive locale via `useLiveQuery` sur `db.profiles` et `db.teams`.
   - Écritures locales atomiques (édition, archivage) via `db.transaction('rw', db.profiles, db.sync_outbox, ...)` avec UUIDv7.
   - Suppression de l'état bloquant `loading = ref(true)` et du squelette d'attente.

3. `src/views/manager/DashboardView.vue` :
   - Amorçage des `useLiveQuery` avec un tableau vide par défaut `[]` au lieu de `null`.
   - Suppression du flash visuel de squelette (`v-if="loading"`) pour un rendu instantané.

4. `src/views/manager/PresencesView.vue` :
   - Amorçage de `presenceRows` avec un tableau vide par défaut `[]` au lieu de `null`.
   - Rendu immédiat des fiches et statistiques sans flash de spinner.

5. `src/views/manager/AvailabilitiesView.vue` :
   - Amorçage des requêtes `useLiveQuery` avec `[]` par défaut au lieu de `null`.
   - Suppression du bloc d'ossature clignotante à chaque navigation.

6. `src/views/employee/CheckInView.vue` & `src/views/employee/CheckOutView.vue` :
   - Remplacement de l'initialisation bloquante des sites par `useLocations()` réactif.
   - Suppression de `isLoadingLocations` et `isLoading` bloquants au montage.

7. `GATES.md` :
   - Inscription des portes d'acceptation G111 à G115.

### Hors périmètre
- Modification des versions de paquets ou du `package.json` (règle absolue de non-altération sans accord).
- Altération de la logique sous-jacente du moteur de réplication `useSyncEngine.js`.

## 2. Étapes ordonnées

1. **Formalisation des portes dans `GATES.md`** (G111 à G115).
2. **Refonte Local-First de `TeamsView.vue`** (lecture Dexie + outbox).
3. **Refonte Local-First de `EmployeesView.vue`** (lecture Dexie + outbox).
4. **Suppression du Flash of Loading dans `DashboardView.vue`, `PresencesView.vue` et `AvailabilitiesView.vue`**.
5. **Assainissement réactif de `CheckInView.vue` et `CheckOutView.vue`**.
6. **Vérification déterministe des oracles et compilation de production Vite**.

## 3. Critère d'arrêt
Toutes les portes G111 à G115 validées avec succès, absence totale d'appels `supabase.from()` dans les vues gestionnaire, navigation instantanée sans aucun spinner/squelette intempestif, et compilation Vite sans erreur.
