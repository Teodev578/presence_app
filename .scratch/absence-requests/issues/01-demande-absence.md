# Issue : Implémentation de la demande d'absence et validation manager
Status: ready-for-agent

## Description
Remplacer l'enregistrement simple des disponibilités par un flux complet de demande d'absence avec soumission par l'employé, annulation possible, validation ou refus par le manager, retour visuel vert sur les jours validés, et notifications croisées.

## Critères d'Acceptance
1. **Migration Supabase & RLS** : Définition de la table `absence_requests` avec indexation B-Tree, politiques RLS strictes et publication CDC Realtime.
2. **Schéma Dexie v4** : Ajout du store `absence_requests` et prise en charge intégrale dans `useSyncEngine.js` (pull incrémental selon rôle et subscription Realtime).
3. **Composable `useAbsenceRequests.js`** : Méthodes `submitRequest`, `cancelRequest`, `validateRequest`, `refuseRequest` fondées sur Dexie et `useLiveQuery` avec outbox transactionnelle.
4. **UX Collaborateur** : Bouton « Demande d'absence » pour soumettre ; bouton « Annuler ma demande » si une demande est active ; jours validés entourés d'un contour vert `success` M3 naturel ; statut visible et informatif.
5. **UX Gestionnaire** : Vue dédiée/section des demandes d'absence en attente dans `AvailabilitiesView.vue`, avec validation immédiate ou refus motivé.
6. **Notifications croisées** : Alerte manager à la soumission ou annulation ; alerte employé à la validation ou au refus ; intégration dans `NotificationBell.vue`.
7. **Intégrité de build & tests** : Aucune régression sur la suite déterministe (`scripts/verify-gates.mjs --all`) et compilation Vite sans erreur.
