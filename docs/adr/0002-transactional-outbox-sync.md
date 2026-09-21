# ADR 0002 : Moteur de Synchronisation basé sur le Transactional Outbox Pattern

- **Statut** : Accepté
- **Date** : 2026-09-21
- **Décideurs** : Marc (Moteur de Synchro & Supabase), Nora (Architecte Local-First)

---

## Contexte

Dans une application Local-First, les mutations de données surviennent indépendamment de la disponibilité du réseau. Pour synchroniser de manière fiable les modifications locales vers Supabase sans risque de perte de données en cas de crash, de fermeture d'onglet ou de coupure réseau inopinée, un mécanisme de persistance des intentions d'écriture est requis.

Les approches naïves (comme envoyer un appel réseau directement depuis les actions d'interface et retenter en mémoire) échouent si l'application est rechargée ou tuée par l'OS avant le rétablissement de la connexion.

## Décision

Nous implémentons le **Transactional Outbox Pattern** dans Dexie :
1. Chaque mutation de données (création, mise à jour, suppression logique) est enregistrée au sein d'une **transaction Dexie atomique unique** comprenant :
   - L'entité métier mise à jour dans sa table respective.
   - Une entrée dans la table locale `sync_outbox`.
2. Chaque enregistrement d'outbox possède les propriétés canoniques suivantes :
   - `id` : clé primaire locale incrémentale ou UUIDv7.
   - `client_mutation_id` : UUIDv4 ou UUIDv7 unique généré à l'origine de la mutation, garantissant l'idempotence côté serveur.
   - `table_name` : nom de l'entité ciblée.
   - `record_id` : identifiant de l'enregistrement concerné.
   - `operation` : `'INSERT' | 'UPDATE' | 'DELETE'`.
   - `payload` : données sérialisées de la mutation.
   - `created_at` : horodatage client de la demande.
   - `attempts` : compteur de tentatives avec mécanisme de backoff exponentiel.
   - `status` : `'pending' | 'syncing' | 'failed'`.
3. Un worker de synchronisation dépile l'outbox de manière séquentielle dès détection du retour réseau (`navigator.onLine`) ou périodiquement.
4. L'enregistrement n'est purgé de la table `sync_outbox` que lorsque Supabase confirme formellement la persistance avec succès.

## Conséquences

### Positives
- Aucune perte d'intention utilisateur en cas de fermeture du navigateur ou de panne réseau prolongée.
- Idempotence garantie : un rejeu d'une entrée de l'outbox n'entraîne aucun doublon côté base de données distante grâce à `client_mutation_id`.
- Observabilité directe dans l'interface utilisateur (nombre d'éléments en attente de synchronisation).

### Négatives & Contraintes
- Surcharge de stockage locale minime liée au tampon d'outbox (nécessite une purge post-confirmation).
- Complexité d'orchestration : gestion des erreurs permanentes (4xx / violations de contraintes RLS) pour éviter le blocage de la file d'attente (nécessité d'une table d'erreurs ou Dead Letter Queue).
