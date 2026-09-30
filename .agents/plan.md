# Plan de Travail Agentique : Modernisation du Moteur de Synchronisation (Options 1 & 2)

Ce fichier porte le plan de la tâche architecturale en cours, conformément à la règle `.agents/rules/10-planification-taches-fastidieuses.md` et au garde-fou n°3 de `AGENTS.md`.

---

## Tâche en cours

- **Tâche** : Modernisation réactive du moteur de synchronisation (Supabase Realtime, Hooks Dexie, Web Locks & Résilience d'arrière-plan).
- **Date** : 2026-09-30
- **Périmètre** :
  - *Fichiers modifiés* : `src/composables/useSyncEngine.js`, `src/lib/db.js`.
  - *Fichiers créés/configurés* : `public/sw.js`.
  - *Hors périmètre* : Schémas SQL Supabase distants, composants de vue UI (HomeView, SettingsView, etc.), layouts de navigation.
- **Critère d'arrêt** :
  1. Toute mutation dans `sync_outbox` déclenche immédiatement et de façon découplée un cycle `pushOutbox` (via hook Dexie).
  2. Les modifications distantes de Supabase sont notifiées en temps réel via WebSocket (`postgres_changes`) et déclenchent une réconciliation Dexie en < 200 ms.
  3. L'exécution concurrente multi-onglets est protégée par `navigator.locks`.
  4. L'intervalle de polling aveugle de 30s est remplacé par une veille événementielle (WebSocket + `visibilitychange` + `online` + battement de secours basse fréquence).
  5. La fermeture impromptue est couverte par la résilience en arrière-plan (Service Worker Background Sync).
  6. `npm run build` réussit sans avertissement ni régression (exit code 0).
  7. `node scripts/verify-gates.mjs` valide l'intégrité de l'architecture (notamment G73 et G95).
  8. L'ensemble des 8 scripts `scripts/test-*.mjs` passent au vert.
- **État** : Réalisé et validé le 2026-09-30.

---

### Étapes d'exécution

- [x] **Étape 1 : Crochets réactifs Dexie (Vidange automatique de l'Outbox)**
  - Câblé via `db.sync_outbox.hook('creating')` dans `src/lib/db.js` attaché à l'événement `transaction.on('complete')`.
  - Notification automatique à `useSyncEngine.js` avec anti-rebond (*debounce* de 50 ms) pour déclencher `syncNow()` dès la validation locale.
  - Vérification : code intégré, zéro régression de transaction IndexedDB.

- [x] **Étape 2 : Exclusion mutuelle multi-onglets (Web Locks API)**
  - Encadrement des fonctions critiques `pushOutbox` et `pullChanges` dans `withSyncLock` utilisant `navigator.locks.request('presence_push_lock', ...)` et `presence_pull_lock`.
  - Repli direct prévu en cas d'absence d'API Web Locks.
  - Vérification : exécution thread-safe sans double dépilement de l'outbox.

- [x] **Étape 3 : Canal réactif Supabase Realtime (CDC WebSocket)**
  - Initialisation de `supabase.channel('presence-cdc-sync')` écoutant `postgres_changes` sur les 5 tables métier (`presences`, `availabilities`, `locations`, `profiles`, `teams`).
  - Implémentation du pattern « Realtime as Invalidation Signal » : déclenchement immédiat de `scheduleRealtimePull()` avec anti-rebond (100 ms).
  - Rattrapage temporel automatique lors de la transition d'état vers `SUBSCRIBED`.
  - Vérification : abonnement WebSocket propre et réactif.

- [x] **Étape 4 : Allègement de l'horloge de fond et réveil contextuel**
  - Remplacement du polling aveugle de 30s par un filet de sécurité espacé à 120s (2 minutes).
  - Ajout de l'écouteur `visibilitychange` : resynchronisation immédiate dès que l'utilisateur revient sur l'onglet ou déverrouille l'appareil.
  - Écouteur `online` conservé pour le réveil au retour réseau.
  - Vérification : réactivité immédiate sans saturation réseau.

- [x] **Étape 5 : Résilience d'arrière-plan (Option 2 - PWA Background Sync)**
  - Création de `public/sw.js` avec gestionnaire de l'événement `sync` (`presence-outbox-sync`).
  - Fonction `requestBackgroundSync()` enregistrant le tag auprès du Service Worker dès qu'une mutation est créée ou suspendue hors-ligne.
  - Écouteur de message inter-processus `TRIGGER_SYNC` réveillant le moteur.
  - Vérification : Service Worker valide, enregistrement tolérant aux pannes.

- [x] **Étape 6 : Validation globale et conformité des oracles**
  - Compilation de production : `npm run build` réussit avec code 0.
  - Conformité des oracles : `node scripts/verify-gates.mjs` confirme le passage de G73 (périmètre strict du pull) et G95 (page Paramètres).
  - Tests unitaires : `ALL TESTS PASSED` sur l'ensemble de la suite `scripts/test-*.mjs`.
