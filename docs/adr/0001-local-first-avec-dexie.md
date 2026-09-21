# ADR 0001 : Architecture Local-First et Persistance Locale avec Dexie.js

- **Statut** : Accepté
- **Date** : 2026-09-21
- **Décideurs** : Nora (Architecte Local-First), Winston (Architecte Système)

---

## Contexte

PresenceApp requiert un fonctionnement transparent en conditions de connectivité dégradée ou inexistante (mode hors-ligne complet sur PWA mobile). L'utilisateur doit pouvoir consulter et enregistrer des données de présence instantanément, sans latence réseau ni blocage d'interface.

Plusieurs approches et bibliothèques de persistance client ont été considérées :
- **IndexedDB natif** : API verbeuse, sans typage fort, gestion fastidieuse des transactions et de l'indexation.
- **RxDB** : Puissant mais volumineux, introduit une dépendance lourde à RxJS, complexifie inutilement la réactivité dans l'écosystème Vue 3.
- **WatermelonDB** : Orienté React Native, nécessite des adaptateurs complexes sous environnement web PWA standard.
- **Dexie.js (v4)** : Wrapper minimal et performant au-dessus d'IndexedDB, support natif des promesses, observabilité fine (`dexie/liveQuery`), empreinte bundle légère.

## Décision

Nous adoptons **Dexie.js v4** comme couche unique de persistance locale et source de vérité côté client :
1. Les écritures applicatives sont toujours effectuées localement en premier dans Dexie avant toute synchronisation réseau.
2. La réactivité de l'interface Vue 3 est assurée par un composable `useLiveQuery` natif fondé sur `shallowRef` et `onScopeDispose`, sans bibliothèque de flux externe.
3. Les transactions Dexie doivent respecter strictement la frontière des microtâches JavaScript (`microtask boundary`) : aucune opération asynchrone non-Dexie (comme `fetch` ou appel réseau) n'est tolérée au sein d'un bloc transactionnel Dexie sous peine d'avortement automatique de la transaction par le navigateur.

## Conséquences

### Positives
- Disponibilité hors-ligne immédiate et latence de saisie nulle (optimistic UI par conception).
- Indépendance vis-à-vis de l'état du réseau pour toutes les opérations de lecture et d'écriture courantes.
- Intégration légère et fluide avec la réactivité de Vue 3 via `shallowRef`.

### Négatives & Contraintes
- Nécessite la mise en place d'un moteur de synchronisation asynchrone bidirectionnel (décrit dans l'ADR 0002).
- Gestion explicite des migrations de schéma IndexedDB via le versionnement Dexie (`db.version(n).stores(...)`).
- Vigilance accrue sur la clôture intempestive des transactions IndexedDB lors d'appels asynchrones arbitraires.
