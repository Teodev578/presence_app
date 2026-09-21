# Standards Supabase, Sécurité RLS & Schémas Distants

Ce document consigne les directives permanentes de sécurité, de structuration de base de données PostgreSQL et d'interaction avec Supabase.

---

## 1. Activation Inconditionnelle de la Row Level Security (RLS)

Le client Supabase JS étant exécuté dans le navigateur avec la clé publique (`anon_key`), aucune confiance ne peut être accordée au code client.
- **Interdiction formelle des tables non protégées** :
  Toute table créée dans le schéma public de la base de données distante doit comporter obligatoirement :
  ```sql
  ALTER TABLE public.<nom_de_table> ENABLE ROW LEVEL SECURITY;
  ```
- **Politique de fermeture par défaut** :
  Si aucune politique explicite (`CREATE POLICY`) n'est définie, aucun accès (lecture ni écriture) ne doit être possible via l'API client.

---

## 2. Optimisation et Indexation Systématique des Clauses RLS

Une politique de sécurité mal indexée contraint PostgreSQL à exécuter un parcours séquentiel intégral (Seq Scan) de la table pour chaque ligne évaluée, dégradant catastrophiquement les performances à l'échelle.
- **Indexation obligatoire des colonnes de filtrage** :
  Toute colonne invoquée dans la clause `USING` ou `WITH CHECK` d'une politique RLS (notamment `user_id`, `organization_id`, `deleted_at`, `updated_at`) doit faire l'objet d'un index B-Tree explicite :
  ```sql
  CREATE INDEX idx_<nom_de_table>_user_id ON public.<nom_de_table> (user_id);
  ```
- **Évaluation scalaire de l'identité** :
  Toujours encapsuler l'appel à la fonction d'authentification sous la forme `(select auth.uid())` plutôt que `auth.uid()`. Cela permet au planificateur de requêtes d'exécuter la fonction une seule fois pour l'ensemble de la requête plutôt que de la réévaluer à chaque ligne.

```sql
-- ❌ DÉCONSEILLÉ : réévaluation par ligne, performances dégradées
CREATE POLICY "Utilisateurs accèdent à leurs présences"
ON public.presences FOR SELECT
USING (user_id = auth.uid());

-- ✅ RECOMMANDÉ : sous-requête scalaire optimisée
CREATE POLICY "Utilisateurs accèdent à leurs présences"
ON public.presences FOR SELECT
USING (user_id = (select auth.uid()));
```

---

## 3. Colonnes Systèmes Obligatoires

Chaque table métier persistée sur Supabase doit comporter les colonnes d'audit et de synchronisation suivantes :
- `id UUID PRIMARY KEY` : identifiant universel correspondant à la clé générée par le client.
- `created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL` : horodatage de création initial.
- `updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL` : horodatage faisant autorité pour la résolution de conflits Last-Write-Wins (mis à jour par un déclencheur automatique).
- `deleted_at TIMESTAMPTZ DEFAULT NULL` : drapeau de suppression logique pour la propagation des tombstones.

---

## 4. Requêtes de Synchronisation Descendante (Pull)

- **Requêtes incrémentales uniquement** :
  Le client ne doit jamais rapatrier l'intégralité d'une table à chaque reconnexion. Les requêtes de Pull interrogent systématiquement `updated_at > :dernier_curseur_client`.
- **Index composite pour le Pull** :
  Pour maximiser les performances de cette requête fréquente, créer un index composite combinant la clé d'isolation du tenant et le curseur temporel :
  ```sql
  CREATE INDEX idx_<nom_de_table>_sync ON public.<nom_de_table> (user_id, updated_at);
  ```
