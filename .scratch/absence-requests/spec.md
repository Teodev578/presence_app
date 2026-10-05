# Spécification Fonctionnelle et Technique : Demande d'absence et validation hiérarchique

## Contexte et Objectif

Dans le module de planification hebdomadaire de l'espace collaborateur, les employés pouvaient jusqu'alors consigner leurs disponibilités de façon purement déclarative. Afin de doter l'organisation d'un flux de validation managériale sans dénaturer le modèle de pointage ni la synchro Local-First :
1. Une nouvelle entité `absence_requests` est créée, permettant à l'employé de soumettre une demande d'absence pour la semaine sélectionnée (avec les jours concernés et une note explicative).
2. L'action principale de l'employé devient « Demande d'absence » (ou « Annuler ma demande » si une demande est en attente ou validée).
3. Dès validation par un gestionnaire ou un administrateur, les jours validés bénéficient d'un indicateur naturel (outline et tonalité verte `success` M3).
4. Le gestionnaire dispose d'une section dédiée dans son interface des disponibilités pour examiner, valider ou refuser les demandes.
5. Les notifications in-app informent les gestionnaires des nouvelles demandes et les employés de l'avancement (soumission, validation, refus, annulation).

## Modèle de Données & Invariants

- **Table Supabase `absence_requests`** :
  - `id` : UUID primaire (UUIDv7)
  - `user_id` : Référence vers `profiles.id`
  - `week_start` : Date du lundi (YYYY-MM-DD)
  - `days` : `smallint[]` (jours 1 à 5 concernés par la demande d'absence)
  - `note` : Commentaire explicatif facultatif
  - `status` : `'submitted' | 'validated' | 'refused' | 'cancelled'`
  - `decided_by` : UUID du manager ayant statué (null tant qu'en attente)
  - `decided_at` : Timestamptz de décision
  - `decision_note` : Motif optionnel de refus ou commentaire du manager
  - `client_mutation_id` : UUIDv7 d'idempotence outbox
  - `created_at`, `updated_at`, `deleted_at`
- **Sécurité RLS** :
  - Employé : insertion de sa propre demande, lecture de ses demandes, annulation autorisée pour ses propres demandes (`status` devient `'cancelled'`).
  - Manager/Admin : lecture des demandes de son équipe/organisation, mise à jour du statut vers `'validated'` ou `'refused'`.
- **Local-First & Dexie.js v4** :
  - Table locale `absence_requests: 'id, user_id, week_start, status, client_mutation_id, updated_at, deleted_at'`.
  - Intégration complète dans `useSyncEngine.js` (push via outbox, pull incrémental par rôle, écoute WebSocket Realtime).
