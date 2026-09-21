# ADR 0003 : Résolution de Conflits par Last-Write-Wins avec Autorité Temporelle Serveur

- **Statut** : Accepté
- **Date** : 2026-09-21
- **Décideurs** : Marc (Moteur de Synchro & Supabase), Winston (Architecte Système)

---

## Contexte

Dans une application Local-First collaborative, deux clients hors-ligne peuvent modifier simultanément le même enregistrement. À la reconnexion, ces mutations divergentes doivent être réconciliées de façon déterministe et prévisible.

Trois grandes familles de résolution ont été évaluées :
- **CRDTs (Conflict-free Replicated Data Types)** : Garantissent une convergence mathématique parfaite mais imposent une lourdeur conceptuelle et un surcoût mémoire excessif pour un modèle de présence où les conflits réels sont rares et portent principalement sur des champs discrets.
- **Verrouillage optimiste avec refus (OCC)** : Rejeter la mutation si la version distante a évolué force l'utilisateur à arbitrer manuellement, ce qui dégrade l'expérience mobile sur le terrain.
- **Last-Write-Wins (LWW) avec horodatage serveur** : La dernière écriture enregistrée par l'horloge faisant autorité prévaut.

## Décision

Nous adoptons la stratégie **Last-Write-Wins (LWW)** adossée à l'autorité temporelle du serveur PostgreSQL (Supabase) :
1. Chaque table métier comprend les colonnes `updated_at TIMESTAMPTZ` et `created_at TIMESTAMPTZ`.
2. Lors de l'écriture en base distante, PostgreSQL applique automatiquement `updated_at = clock_timestamp()` via un déclencheur (`trigger`). Les horloges locales des appareils clients (mobiles ou navigateurs) ne font jamais foi pour l'arbitrage temporel en raison de la dérive inévitable des horloges matérielles.
3. Pour la synchronisation descendante (Pull), le client interroge les modifications distantes via `updated_at > :dernier_sync_client`.
4. Les suppressions sont gérées logiquement via un drapeau `deleted_at TIMESTAMPTZ` (pattern Tombstone) afin d'éviter la résurrection d'entités supprimées hors-ligne.

## Conséquences

### Positives
- Complexité algorithmique faible, aucun framework CRDT tiers requis.
- Déterminisme absolu de l'état final sur la base de données distante.
- Performances optimales en lecture et écriture sur PostgreSQL et Dexie.

### Négatives & Contraintes
- Risque théorique de perte d'une modification concurrente sur le même attribut si deux utilisateurs modifient le même champ au même instant ("blind overwrite"). Ce compromis est jugé acceptable au vu du domaine métier de PresenceApp où les modifications portent typiquement sur des pointages discrets.
- Obligation de maintenir les tombstones (`deleted_at`) pendant une période de rétention minimale avant purge définitive.
