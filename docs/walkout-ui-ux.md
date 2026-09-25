# Walkout & Synthèse d'Audit UX/UI : PresenceApp

Ce document consigne l'audit ergonomique, visuel et fonctionnel de PresenceApp. Il évalue l'adéquation de l'interface avec les contraintes d'une progressive web app de terrain (Local-First), son respect des directives d'hybridation entre Material Design 3 et DaisyUI v5, et synthétise le plan d'action hiérarchisé selon les recommandations retenues ou écartées.

---

## 1. Contexte & Philosophie Visuelle

PresenceApp applique une architecture visuelle fondée sur la séparation stricte de la structure sémantique et du langage formel :
- **DaisyUI v5** structure les composants réactifs et accessibles (`btn`, `card`, `modal`, `badge`, `alert`, `input`, `drawer`).
- **Google Material Design 3 (M3)** impose son système de couleurs tonales, son élévation par surfaces conteneurs sans ombres opaques agressives, son échelle hiérarchique d'arrondis et la police unifiée *Inter*.

La philosophie technique repose sur une approche **Local-First**, où la persistance locale (Dexie.js / IndexedDB) et la file d'attente transactionnelle (Transactional Outbox) rendent l'application immédiatement opérationnelle même en l'absence de réseau. L'interface utilisateur doit donc refléter fidèlement cet état de synchronisation sans masquer les événements de connectivité.

---

## 2. Synthèse des Points Forts

### L'expérience et l'affordance du pointage
Le flux de pointage dans l'espace collaborateur est fluide, direct et rassurant :
- **Composant radar [`GpsRing.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/components/employee/GpsRing.vue)** : L'animation d'anneau pulsé combinée aux trois paliers chromatiques (vert lorsque le site est reconnu, ambre/rouge en cas d'éloignement, bleu lors de l'acquisition satellite) traduit immédiatement l'état spatial de l'utilisateur sans nécessiter la lecture rébarbative de coordonnées GPS.
- **Confirmation haptique** : L'appel à `navigator.vibrate(40)` fournit un retour tactile immédiat au moment de valider une arrivée ou un départ, ce qui prévient les doubles frappes sur smartphone en condition de travail sur le terrain.
- **Machine à états dans [`DayCard.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/components/employee/DayCard.vue)** : L'enchaînement logique entre le bouton de prise de poste, celui de clôture de journée et l'état inerte final (« Journée enregistrée ») évite toute hésitation ou fausse manœuvre.

### Rigueur des surfaces et absence de pollution visuelle
La configuration des thèmes dans [`src/style.css`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/style.css) matérialise fidèlement les tokens M3 :
- Le relief est exprimé par l'étagement des teintes de surface (`bg-base-100`, `bg-base-200`, `bg-base-300`) plutôt que par des ombres portées sombres et diffuses.
- Les contrastes respectent les couples conteneur/contenu (`on-primary`, `on-surface`).
- L'échelle de formes est cohérente sur l'ensemble des modules, des badges compacts de 4px aux modales de 28px.

### Saisie et suivi des disponibilités d'équipe
- **Espace collaborateur ([`WeekGrid.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/components/employee/WeekGrid.vue))** : La grille hebdomadaire propose des tuiles de sélection aux cibles tactiles généreuses, verrouille les jours révolus pour empêcher les modifications incohérentes et offre une prise en charge complète du clavier (`Space`, `Enter`).
- **Espace gestionnaire ([`ManagerAvailabilitiesView.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/views/manager/AvailabilitiesView.vue))** : La matrice croisée offre une confrontation immédiate entre les intentions prévisionnelles (« Dispo ») et la réalité constatée des pointages (« Pointé » ou « Non pointé »), simplifiant considérablement le contrôle opérationnel.

### Aide à la saisie géographique
Le module cartographique de [`LocationsView.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/views/manager/LocationsView.vue) permet au gestionnaire de coller un lien Google Maps ou Apple Maps pour extraire automatiquement les coordonnées et le rayon de tolérance, supprimant le besoin de manipulation manuelle de latitudes et longitudes.

---

## 3. Points de Friction et Vulnérabilités Identifiés

### 1. Ergonomie d'accessibilité tactile (Thumb Zone) sur mobile
L'analyse de [`HomeView.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/views/employee/HomeView.vue#L39-L59) confirme la pertinence de l'ordonnancement actuel : sur les smartphones modernes dotés d'écrans allongés (ratios 19:9 ou 20:9), la moitié inférieure de l'écran constitue la zone de préhension naturelle du pouce (*thumb zone*). Placer la carte du jour (`DayCard`) en partie basse permet de déclencher le pointage ou de déclarer les disponibilités d'une seule main sans étirement digital ni fatigue musculaire.

### 2. Visibilité de l'indicateur de synchronisation réseau (Résolu)
Initialement relégué au pied du tiroir latéral masqué ([`EmployeeLayout.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/layouts/EmployeeLayout.vue) et [`ManagerLayout.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/layouts/ManagerLayout.vue)), le composant [`SyncIndicator.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/components/shared/SyncIndicator.vue) a été remonté directement dans la barre d'en-tête supérieure sous une forme compacte et discrète (pastille réactive avec état hors-ligne, mutation en attente et succès).

### 3. Guidage d'acquisition GPS (Résolu)
Dans [`CheckInView.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/views/employee/CheckInView.vue) et [`CheckOutView.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/views/employee/CheckOutView.vue), un panneau de guidage contextuel informe désormais l'utilisateur des actions concrètes à mener en cas de signal satellite imprécis (activation du Wi-Fi pour triangulation) ou d'éloignement par rapport au site.

### 4. Persistance de dialogues modaux bloquants natifs
Plusieurs vues utilisent encore `window.confirm()` et `window.alert()` pour valider des suppressions ou afficher des erreurs techniques ([`LocationsView.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/views/manager/LocationsView.vue#L291), [`EmployeesView.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/views/manager/EmployeesView.vue#L83), [`TeamsView.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/views/manager/TeamsView.vue#L50), [`ExportView.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/views/manager/ExportView.vue#L31)). Ces dialogues bloquent le moteur d'exécution, brisent l'esthétique PWA et nuisent à la perception de qualité globale.

### 5. Absence d'un commutateur de thème interactif
Bien que les feuilles de style supportent à la fois le thème clair et le thème sombre, aucun contrôle d'interface ne permet à l'utilisateur de forcer ce réglage manuellement. L'affichage dépend exclusivement de `prefers-color-scheme`, ce qui pose problème aux utilisateurs terrain souhaitant basculer en mode clair à fort contraste sous une lumière solaire vive.

### 6. Rigidité de la contrainte sans défilement
La directive `md:h-screen md:overflow-hidden` présente dans [`EmployeeLayout.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/layouts/EmployeeLayout.vue#L37) verrouille le défilement vertical dès le seuil de 768px. Sur des résolutions moyennes (notamment 1366×768) ou lorsque les polices d'accessibilité du système sont agrandies, les cartes peuvent se trouver coupées au bas de l'écran.

### 7. Rendu des tableaux de gestion sur smartphone
Dans les vues [`PresencesView.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/views/manager/PresencesView.vue) et [`EmployeesView.vue`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/src/views/manager/EmployeesView.vue), les données sont confinées dans des tableaux HTML avec défilement horizontal. La manipulation de ces tableaux sur mobile est malaisée et nuit à l'efficacité du suivi nomade par les encadrants.

---

## 4. Recommandations et Arbitrages

Chaque piste d'évolution ci-dessous fait l'objet d'un statut explicite et de sa justification technique :

### Proposition 1 : Maintien de la carte du jour en partie basse sur smartphone (Thumb Zone)
- **Avis : Confirmé & Acté**
- **Justification** : L'ergonomie physique d'un smartphone allongé privilégie l'accès direct aux boutons d'action clés (pointage d'arrivée, départ, disponibilités) dans la zone basse de préhension naturelle du pouce sans étirer la main.

### Proposition 2 : Intégrer l'indicateur de connectivité discret dans l'en-tête persistant
- **Avis : Recommandé & Implémenté**
- **Justification** : Dans une PWA Local-First, la transparence sur l'état de synchronisation est indispensable. L'intégration d'une pastille compacte dans la barre supérieure garantit la réassurance permanente sans alourdir la vue.

### Proposition 3 : Intégrer le guidage contextuel d'acquisition GPS
- **Avis : Recommandé & Implémenté**
- **Justification** : Fournit une explication constructive et des conseils pratiques (activation du Wi-Fi pour triangulation, distance par rapport à l'entrée) lorsque le bouton de confirmation est désactivé.

### Proposition 4 : Remplacer les appels `alert()` et `confirm()` par des composants DaisyUI
- **Avis : Recommandé**
- **Justification** : L'implémentation de fenêtres modales dédiées (`<dialog class="modal">`) et de bannières éphémères (toasts) harmonise les interactions avec la charte Material 3 et préserve la réactivité de l'application sans bloquer l'interface.

### Proposition 5 : Ajouter un bouton d'alternance Thème Clair / Thème Sombre
- **Avis : Recommandé**
- **Justification** : Offrir le choix manuel de la tonalité visuelle répond directement aux impératifs d'ergonomie en extérieur (lisibilité sous fort ensoleillement vs confort visuel en environnement sombre).

### Proposition 6 : Transformer les tableaux de gestion en cartes empilées sur mobile
- **Avis : Recommandé**
- **Justification** : Remplacer le défilement horizontal des balises `<table>` par des fiches synthétiques sous 640px permet au gestionnaire en déplacement d'auditer les présences et les équipes d'un simple balayage vertical.

### Proposition 6 : Adopter un Navigation Rail dans l'espace collaborateur
- **Avis : Déconseillé**
- **Justification** : Cette approche est formellement prohibée par la consigne de sanctuarisation de la navigation employé inscrite dans [`AGENTS.md`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/AGENTS.md) et la règle [`07-design-system.md`](file:///home/fabien/Documents/Projets/Pro/PresenceApp/presence-app/.agents/rules/07-design-system.md). L'espace collaborateur doit conserver sa navigation épurée via tiroir afin de réserver l'intégralité de l'écran aux cartes de pointage.

### Proposition 7 : Forcer une hauteur fixe stricte (`overflow-hidden`) sur toutes les résolutions
- **Avis : Déconseillé**
- **Justification** : Le verrouillage absolu sans défilement de secours provoque des tronquages d'interface sur les résolutions de hauteur réduite (laptops 768p, tablettes en mode portrait) ou lors de l'activation des options d'accessibilité avec fort zoom typographique.
