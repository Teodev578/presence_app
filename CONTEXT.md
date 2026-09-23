# Glossaire & Modèle de Domaine : PresenceApp

Ce document constitue la source unique de vérité terminologique et conceptuelle pour le projet PresenceApp. Tout agent doit utiliser les termes définis ci-dessous sans recourir à des synonymes arbitraires.

---

## 1. Entités Métier et Rôles

- **Collaborateur (`employee`)** : Utilisateur final de l'application qui déclare ses disponibilités et enregistre ses prises et fins de poste.
- **Responsable (`manager`)** : Utilisateur superviseur disposant des droits d'administration, de consultation des feuilles de présence et de validation des pointages.
- **Pointage / Présence (`presence`)** : Événement horodaté traçant une prise de poste (`check_in`) ou une fin de poste (`check_out`). Chaque enregistrement comporte un identifiant universel (`id`), un horodatage (`timestamp`), des coordonnées GPS (`latitude`, `longitude`), un statut de validation et un indicateur de synchronisation.
- **Disponibilité (`availability`)** : Période temporelle déclarée par un collaborateur indiquant sa capacité à travailler (`available`, `unavailable`, `preferred`).
- **Site / Établissement (`location`)** : Emplacement géographique physique caractérisé par son libellé, ses coordonnées GPS de référence (`latitude`, `longitude`) et son rayon de tolérance.
- **Cercle Géographique (`gps_ring`)** : Zone circulaire définie autour d'un site par son rayon en mètres. Le pointage est qualifié de « conforme » si la géolocalisation du collaborateur s'inscrit à l'intérieur de ce rayon lors de la validation.
- **Équipe (`team`)** : Groupe organisationnel de collaborateurs rattachés à un ou plusieurs gestionnaires.

---

## 2. Invariants Techniques Local-First

- **Primauté Locale** : IndexedDB (orchestré par Dexie.js) constitue la source unique de vérité pour toutes les opérations de lecture et d'écriture de l'interface. Aucun composant d'interface ne communique directement avec l'API distante lors d'une mutation.
- **File d'Attente de Synchronisation (`sync_outbox`)** : Table locale stockant de manière transactionnelle chaque mutation utilisateur sous forme d'opération unitaire (`INSERT`, `UPDATE`, `DELETE`) en attente de réplication vers Supabase.
- **Identifiant UUIDv7** : Clé primaire chronologique générée côté client dès la création de l'enregistrement. L'UUIDv7 préserve les performances d'indexation B-Tree côté PostgreSQL et élimine les collisions d'identifiants auto-incrémentaux.
- **Suppression Logique (`tombstone`)** : Toute suppression locale renseigne le champ `deleted_at` avec un horodatage ISO. La ligne physique subsiste localement pour permettre la réplication de la suppression vers le serveur et empêcher la réapparition de la donnée lors des synchronisations descendantes.
- **Résolution Last-Write-Wins (LWW)** : En cas de conflit de synchronisation, l'enregistrement portant l'horodatage de mise à jour (`updated_at`) le plus récent prévaut.

---

## 3. Invariants Visuels & Ergonomie (Material 3 & DaisyUI v5)

- **Palette Tonale Sémantique** : Utilisation exclusive des rôles de couleur Material 3 (`primary`, `primary-container`, `secondary`, `surface`, `surface-container`, `error`). Rejet formel des classes de couleur statiques (`blue-500`, `gray-100`).
- **Élévation Tonale (Zéro Box-Shadow)** : Le relief s'exprime par le contraste des teintes de surface (`bg-base-100` vers `bg-base-200` et `bg-base-300`), sans ombres portées opaques (`shadow-md`, `shadow-lg` interdits).
- **Échelle d'Arrondis M3** : Utilisation stricte des tokens d'arrondis calibrés (`rounded-m3-xs` à 4px, `rounded-m3-sm` à 8px, `rounded-m3-md` à 12px, `rounded-m3-lg` à 16px, `rounded-m3-xl` à 28px, `rounded-full` à 9999px).
- **Seuils d'Adaptabilité Responsive (Encore)** :
  - **600px** : Bascule des collections de carrousel horizontal tactile vers une grille multi-colonnes.
  - **840px** : Bascule de la navigation basse (`Bottom Navigation`) vers la barre latérale compacte (`Sidebar Rail`).
  - **1200px** : Déploiement complet de la barre latérale (`Navigation Drawer`).
- **Surface Tactile Frugale** : Dimension minimale de 44×44 pixels pour tout élément interactif (56dp pour les boutons d'action critiques sur mobile).
