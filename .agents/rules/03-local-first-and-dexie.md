# Standards de Persistance Locale & Intégrité Dexie.js

Ce document consigne les règles permanentes régissant l'utilisation d'IndexedDB et de la bibliothèque Dexie.js sur PresenceApp. Tout agent manipulant les modèles de données locaux ou les transactions de stockage doit se conformer à ces directives.

---

## 1. Respect Strict de la Frontière des Microtâches (Microtask Boundary)

IndexedDB ferme automatiquement et silencieusement toute transaction dès qu'un saut asynchrone non-IndexedDB est effectué.
- **Interdiction formelle des promesses non-Dexie dans une transaction** :
  Aucun `fetch`, aucun appel réseau vers Supabase, aucun `setTimeout`, ni aucune promesse arbitraire ne doit être exécutée au sein d'une fonction passée à `db.transaction('rw', ...)`.
- **Principe d'isolation** :
  Toutes les données nécessaires à l'écriture locale doivent être calculées ou validées en amont avant l'ouverture de la transaction Dexie.

```javascript
// ❌ INTERDIT : entraîne l'avortement immédiat de la transaction IndexedDB
await db.transaction('rw', db.presences, db.sync_outbox, async () => {
  await db.presences.add(presenceData)
  await fetch('/api/notify') // Rupture de transaction
  await db.sync_outbox.add(outboxEntry)
})

// ✅ CONFORME : transaction Dexie pure, atomique et synchrone du point de vue IndexedDB
await db.transaction('rw', db.presences, db.sync_outbox, async () => {
  await db.presences.add(presenceData)
  await db.sync_outbox.add(outboxEntry)
})
```

---

## 2. Génération des Identifiants Primaires Décentralisés

Dans une architecture Local-First déconnectée, plusieurs clients créent des enregistrements simultanément.
- **Interdiction des clés auto-incrémentées** : Ne jamais utiliser de clés primaires numériques auto-incrémentales (`++id`) pour les entités métier synchronisées.
- **Standard UUIDv7** : Toute entité métier créée localement doit recevoir une clé primaire de type chaîne générée au format UUIDv7 (ou UUIDv4 cryptographique). L'UUIDv7 est privilégié car il encode un horodatage naturel garantissant la performance des index B-Tree en base distante.

---

## 3. Gestion Rigoureuse des Versions et Migrations de Schéma

IndexedDB applique un contrôle strict de version. Une altération imprudente du schéma rend l'application inutilisable pour les utilisateurs existants.
- **Interdiction de modifier une version historique** : Ne jamais modifier la définition d'un appel `db.version(n).stores(...)` existant.
- **Versionnement incrémental systématique** : Toute modification de table, ajout d'index ou renommage doit être implémenté via une nouvelle version incrémentale `db.version(n + 1).stores(...)`, accompagnée d'une fonction de migration `.upgrade(tx => ...)` si une transformation des données existantes est nécessaire.
- **Index minimaux** : N'indexer que les propriétés explicitement filtrées ou triées dans les requêtes de l'interface afin d'éviter la dégradation des performances d'écriture sur mobile.

---

## 4. Instance Unique (Pattern Singleton)

- **Export d'un singleton unique** : La classe héritant de `Dexie` doit être instanciée une seule fois dans `src/db/` et réexportée pour l'ensemble de l'application.
- **Interdiction des instances multiples** : Ne jamais exécuter `new Dexie()` de manière ad-hoc dans un composant ou un composable. Les instances multiples génèrent des conflits de verrous IndexedDB et désynchronisent les observateurs réactifs.
