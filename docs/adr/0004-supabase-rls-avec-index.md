# ADR 0004 : Sécurisation Multi-tenant par Row Level Security (RLS) et Indexation Systématique

- **Statut** : Accepté
- **Date** : 2026-09-21
- **Décideurs** : Marc (Moteur de Synchro & Supabase), Victor (Chaos & Standards Auditor)

---

## Contexte

PresenceApp manipule des données d'utilisateurs et potentiellement d'organisations multiples. Le client Supabase opérant directement depuis le navigateur via la clé anonyme (`anon_key`), la sécurité et le cloisonnement des données doivent impérativement être garantis au niveau du moteur de base de données PostgreSQL lui-même.

Sans politiques de sécurité strictes, un utilisateur malveillant pourrait forger des requêtes directes via le client JS et accéder aux enregistrements de tiers. De surcroît, des politiques RLS mal conçues induisent des scans séquentiels massifs (table scans) à chaque requête de synchronisation descendante, ruinant les performances de l'application à mesure que le volume croît.

## Décision

Nous imposons les règles de conception suivantes pour toute table Supabase :
1. **RLS activé par défaut** : Chaque table doit comporter `ALTER TABLE <nom_table> ENABLE ROW LEVEL SECURITY;`.
2. **Cloisonnement strict par utilisateur ou organisation** : Les règles RLS s'appuient sur `auth.uid()` et, le cas échéant, sur `organization_id` validé via le jeton JWT ou une table de jointure des membres.
3. **Indexation obligatoire des colonnes de filtrage RLS** : Toute colonne figurant dans la clause `USING` ou `WITH CHECK` d'une politique RLS (notamment `user_id`, `organization_id`, `deleted_at`, `updated_at`) doit disposer d'un index B-Tree explicite.
4. **Optimisation des fonctions de contexte** : Utilisation de `(select auth.uid())` plutôt que `auth.uid()` directement dans les expressions pour permettre au planificateur de requêtes PostgreSQL d'évaluer la fonction de manière scalaire (statique pour la requête) et non par ligne (évite les réévaluations redondantes).

## Conséquences

### Positives
- Étanchéité cryptographique et logique des données garantie au niveau base de données, indépendamment du code client.
- Performances constantes lors des requêtes de synchronisation incrémentale (`updated_at > ...`) grâce aux index composites.
- Auditabilité claire des droits d'accès via les scripts de migration SQL.

### Négatives & Contraintes
- Discipline stricte lors de l'écriture des migrations : aucune table exposée sans RLS.
- Légère surcharge en écriture sur PostgreSQL due à la maintenance des index.
