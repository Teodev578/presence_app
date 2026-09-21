# Standards du Moteur de Synchronisation & Transactional Outbox

Ce document définit les règles permanentes régissant le flux de synchronisation des données entre le stockage local (Dexie.js) et le backend distant (Supabase).

---

## 1. Primauté du Stockage Local (Local-First Invariant)

- **Interdiction formelle des mutations réseau directes depuis l'interface** :
  Aucun composant Vue, composable d'interface ou gestionnaire d'événement ne doit appeler directement `supabase.from(...).insert()`, `.update()` ou `.delete()`.
- **Écriture locale préalable obligatoire** :
  Toute intention d'écriture utilisateur s'effectue obligatoirement en deux volets atomiques, regroupés dans une transaction Dexie unique :
  1. Mise à jour de l'état de l'entité dans la table locale correspondante.
  2. Création d'un enregistrement d'intention dans la table `sync_outbox`.

---

## 2. Structure et Propriétés de la Table `sync_outbox`

Chaque entrée de la table locale d'outbox doit impérativement comporter les attributs suivants :
- `id` : identifiant local unique de la tâche.
- `client_mutation_id` : identifiant universel (UUIDv4/UUIDv7) généré côté client dès l'origine de l'action.
- `table_name` : nom de la table ciblée (ex : `'presences'`).
- `record_id` : identifiant de l'enregistrement affecté.
- `operation` : nature de la modification (`'INSERT' | 'UPDATE' | 'DELETE'`).
- `payload` : données nécessaires à la réplication sur le serveur.
- `created_at` : horodatage ISO de la création locale.
- `attempts` : compteur de tentatives d'envoi.
- `status` : statut de traitement (`'pending' | 'syncing' | 'failed'`).

---

## 3. Idempotence Côté Distant

- **Garantie d'idempotence via `client_mutation_id`** :
  En cas de coupure réseau survenant entre l'exécution de la requête sur Supabase et la réception de la réponse par le client, le moteur réessaiera d'expédier la même mutation.
- La base distante doit être capable d'absorber ce rejeu sans créer de doublon (via contrainte d'unicité sur `client_mutation_id` ou upsert déterministe sur la clé primaire `id`).

---

## 4. Suppressions Logiques (Pattern Tombstone)

- **Interdiction du `DELETE` physique immédiat** :
  Une entité supprimée par un utilisateur en mode déconnecté ne doit pas être retirée sèchement d'IndexedDB sans laisser de trace.
- **Marquage par `deleted_at`** :
  La suppression s'effectue en renseignant la colonne `deleted_at = new Date().toISOString()`.
- **Rôle du tombstone** :
  Ce marquage empêche le prochain cycle de synchronisation descendante (Pull) d'interpréter l'absence locale de la ligne comme un manque à combler depuis le serveur distant (résurrection de données).

---

## 5. Résilience de la File d'Attente & Gestion des Erreurs

- **Séparation des types d'erreurs** :
  - **Erreurs transitoires (réseau indisponible, timeout, 5xx)** : l'élément reste dans l'outbox avec `status: 'pending'`, et sera rejoué lors du rétablissement du réseau avec un backoff exponentiel.
  - **Erreurs permanentes (4xx, rejet de contrainte RLS, format invalide)** : l'élément ne doit pas bloquer indéfiniment la synchronisation des mutations suivantes. Il doit être basculé vers `status: 'failed'` ou déplacé dans une table de rejet (Dead Letter Queue) pour alerte de l'utilisateur ou inspection.
