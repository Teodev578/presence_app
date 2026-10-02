# Journal d'Arbitrages — PresenceApp

Ce fichier enregistre le raisonnement derrière les décisions non triviales : hypothèses, alternatives refusées, trade-offs acceptés, leçons tirées. Il ne remplace pas `AGENTS.md` (invariants figés) ni les fiches `.agents/knowledge/` (leçons généralisées). Il documente ce qui est *en cours de décider*.

**Règle d'escalade** : une décision qui revient à l'identique dans deux tâches distinctes monte dans une règle `.agents/rules/`. Une leçon tirée qui répond aux déclencheurs KI (`11-apprentissage-et-memoire.md`) alimente une fiche `.agents/knowledge/` au moment de la correction, pas le lendemain.

**Portée** : tâches de complexité « Moyen » ou « Élevée » uniquement. Les tâches simples (correctif ponctuel, retouche isolée) ne génèrent pas d'entrée.

**Gouvernance** : Fabien valide les décisions consignées ici. Pour les arbitrages impliquant un couplage PRD↔implémentation, la validation requiert aussi confirmation de l'agent propriétaire de la story (Lucas / Nora / Marc selon domaine).

---

## Template — Complexité « Moyen » (pre-flight 10 min)

```markdown
### Tâche : [Nom court]
**Date** : AAAA-MM-JJ
**Complexité** : Moyen
**Proposant** : [Agent ou Fabien]
**Story liée** : [référence ou —]

#### Pre-flight (10 min)
1. Problème réel : …
2. Contrainte principale : …
3. Alternative rejetée : … — rejetée parce que …
4. Signal de fin : …
5. Déclencheur KI : O/N

#### Résultat
- Implémenté ? O/N — [date si oui]
- Leçon tirée : …
- Escalade déclenchée ? (si ≥ 3 fichiers découverts en cours de route → unlazy)
```

**Règle d'escalade** : si l'exécution révèle un troisième fichier ou une dépendance non anticipée, la tâche bascule en « Élevée » et déclenche `unlazy` (GATES.md obligatoire). Compléter le template ci-dessous.

---

## Template — Complexité « Élevée » (unlazy + plan.md)

```markdown
### Tâche : [Nom court]
**Date** : AAAA-MM-JJ
**Complexité** : Élevée
**Proposant** : [Agent ou Fabien]
**Story liée** : [référence ou —]

#### Analyse
- **Hypothèse initiale** : …
- **Contraintes identifiées** : …
- **Alternatives envisagées** :
  - Option A — [description] → rejetée parce que …
  - Option B — [description] → rejetée parce que …

#### Décision
**Choix retenu** : …
**Justification** : …
**Trade-offs acceptés** : …
**Engagement KI** : déclencheur KI applicable ? O/N — si O, fiche à écrire immédiatement.

#### Résultat
- Implémenté ? O/N — [date si oui]
- Leçon tirée : …
- Escalade : → `rules/` | → `knowledge/` | aucune
```


---

## Tâches actives

### Tâche : Audit next-level-ui — 2026-10-02
**Date** : 2026-10-02
**Complexité** : Élevée
**Proposant** : next-level-ui skill
**Story liée** : —

#### Findings triés par sévérité

| # | Sévérité | Axe | Fichier(s) / Périmètre | Description | Correctif proposé |
|---|----------|-----|----------------------|-------------|-------------------|
| 1 | 🔴 Critique | Axe 2 (A11y WCAG) & Axe 9 | `src/components/shared/ToastContainer.vue` | Cible de fermeture à 24px (`btn-xs`), glyphe brut `✕`, `shadow-md` prohibé M3 et `transition: all` non GPU | Remplacer par `min-h-11 min-w-11`, icône SVG avec `aria-hidden="true"`, tokens d'élévation M3 et transition GPU `opacity`/`transform` |
| 2 | 🔴 Critique | Axe 9 (Feedback) & Axe 7 | `src/views/SettingsView.vue` | Déconnexion destructive exécutée immédiatement au clic sans modale de confirmation, et bouton pleine largeur sur desktop sans friction `sm:max-w-64` | Encapsuler la déconnexion dans `ConfirmModal` et borner la largeur avec `sm:max-w-64` selon règle 10 |
| 3 | 🔴 Critique | Axe 2 (A11y WCAG) & Axe 4 | `src/layouts/ManagerLayout.vue`, `src/layouts/EmployeeLayout.vue` | Bouton hamburger de tiroir réduit sous 44px entre 640px et 840px (`btn-sm sm:min-h-10 sm:min-w-10`) | Supprimer `btn-sm` et fixer `min-h-11 min-w-11` invariable sous 840px |
| 4 | 🟡 Moyen | Axe 7 (Parcours) & Axe 9 | `src/views/employee/CheckInView.vue`, `CheckOutView.vue` | Absence d'indication ou de réassurance visuelle sur la persistance locale lorsque l'appareil est hors réseau | Intégrer un encart d'information contextuel signalant la prise en charge locale et la synchronisation différée |
| 5 | 🟡 Moyen | Axe 3 (États vides/charge) | `src/views/manager/DashboardView.vue`, `EmployeesView.vue`, `TeamsView.vue` | Flash d'état vide (FOUC) pendant le microtask initial de Dexie (`!data.length` vrai avant réception des données) | Définir un état de chargement explicite (skeleton/spinner) tant que le premier résultat Dexie n'a pas été émis |
| 6 | 🟡 Moyen | Axe 8 (Information & Nav) | `src/layouts/ManagerLayout.vue` | Ambiguïté cognitive entre les entrées de navigation consécutives « Équipe » (`/manager/employees`) et « Équipes » (`/manager/teams`) | Renommer `/manager/employees` en « Collaborateurs » ou « Membres » pour clarifier la distinction |
| 7 | 🟡 Moyen | Axe 6 (Cohérence) & Axe 9 | `src/views/manager/PresencesView.vue` | Bouton d'actualisation absent du slot `#actions` de l'en-tête (échec G63) et appel `syncNow` désaccordé du contrat local-first (échec G72) | Ajouter le bouton « Actualiser » dans `ManagerPageHeader` et harmoniser l'appel `syncNow(user?.id)` |
| 8 | 🟡 Moyen | Axe 6 (Cohérence) & Axe 8 | `src/views/SettingsView.vue` | Absence totale d'en-tête de page (`h1` sémantique), entrée abrupte dans la grille de réglages | Introduire un en-tête sobre avec titre `h1` et sous-titre contextualisé selon l'espace |
| 9 | 🟢 Mineur | Axe 1 (Tokens M3) | `src/views/manager/AvailabilitiesView.vue` | Boîte de dialogue de créneau utilisant l'ombre agressive `shadow-lg` interdite par Material 3 | Aligner sur `bg-base-100 border border-base-300 shadow-sm` |
| 10 | 🟢 Mineur | Axe 1 (Typographie) | `AvailabilitiesView.vue`, `SyncAlert.vue`, `SyncIndicator.vue` | Tailles de police arbitraires `text-[11px]` rompant la rigueur typographique (échec G88) | Convertir vers le jeton standard `text-xs` |
| 11 | 🟢 Mineur | Axe 5 (Copy & Tone) | `LocationsView.vue`, `SyncIndicator.vue`, `SyncAlert.vue` | Emploi de "valider son arrivée" (règle 09 §2) et de pluriels entre parenthèses `mutation(s)` (règle 09 §3) | Formuler « enregistrer son arrivée » et écrire les pluriels en clair |
| 12 | 🟢 Mineur | Axe 6 & Axe 10 (Boutons) | `src/views/manager/AvailabilitiesView.vue` | Boutons de pied de modale sans `min-h-11`, sans feedback `active:scale-95` et flèche unicode `→` | Appliquer `min-h-11`, le feedback tactile universel et une icône SVG dédiée |
| 13 | 🟢 Mineur | Axe 1 (Tokens M3) | `src/components/shared/SyncIndicator.vue` | Emploi de `shadow-2xs` non conforme à la hiérarchie M3 (échec G3) | Retirer la classe ou basculer en bordure surfacique nette |
| 14 | 🟢 Mineur | Axe 4 (Responsive) | `src/views/employee/HomeView.vue` | Classes d'inversion d'ordre absentes sur mobile/tablette (échec G8) | Ajuster l'ordonnancement responsive pour respecter le contrat du pointage prioritaire |
| 15 | 🟢 Mineur | Axe 6 (Cohérence) & Axe 8 | `src/views/manager/LocationsView.vue` | Titre d'en-tête « Lieux de travail » en divergence avec l'oracle G93 (« Gestion des Sites ») | Harmoniser le titre avec le contrat de navigation |

#### Décision
**Findings retenus pour correction** : Les 15 findings retenus, validés et implémentés (Lots 1 à 4).
**Trade-offs acceptés** : Préservation du titre de navigation en bandeau barTitle sur la vue Paramètres conformément à G97 (pas de doublon h1).
**Engagement KI** : Pattern d'anti-FOUC sur useLiveQuery documenté (vérification `=== undefined` avec skeleton au montage).

#### Résultat
- Implémenté ? O (Portes G131 à G136 validées, 100% de succès sur node scripts/verify-gates.mjs --all, compilation Vite sans erreur)

### Tâche : Retrait du bouton Actualiser dans Contrôle des Présences
**Date** : 2026-10-02
**Complexité** : Moyen
**Proposant** : Fabien
**Story liée** : —

#### Pre-flight (10 min)
1. Problème réel : Présence d'un bouton « Actualiser » manuel redondant et encombrant dans l'en-tête de `PresencesView.vue`, alors que la réactivité des requêtes Dexie (`useLiveQuery`) et la synchronisation en arrière-plan maintiennent les données à jour en continu.
2. Contrainte principale : L'oracle G63 vérifiait auparavant `(match(/Actualiser/g) || []).length !== 1` ; il doit vérifier l'absence de doublon (`> 1`) sans forcer la présence d'un bouton impératif sur un écran local-first.
3. Alternative rejetée : Conserver le bouton en variante discrète `btn-ghost` ou `btn-circle` — rejetée car la philosophie de l'application est réactive locale, tout bouton d'actualisation impératif suggère faussement que les données ne sont pas à jour.
4. Signal de fin : Bouton retiré de l'en-tête, compilation sans erreur, suite `verify-gates.mjs --all` verte (G63 et G72 validés).
5. Déclencheur KI : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée : Les oracles de non-régression ne doivent pas imposer la présence de contrôles impératifs superflus lorsqu'un écran bascule en local-first réactif complet.

### Tâche : Responsivité et débordement du sélecteur de semaine (Disponibilités)
**Date** : 2026-10-02
**Complexité** : Moyen
**Proposant** : Fabien
**Story liée** : —

#### Pre-flight (10 min)
1. Problème réel : Débordement horizontal du champ Semaine sur mobile (< 640px) causé par le libellé textuel long (ex: « Semaine du 28 septembre au 2 octobre 2026 ») figé en `whitespace-nowrap` dans un `inline-flex` sans contrainte de largeur, expulsant le chevron droit hors du cadre de la carte.
2. Contrainte principale : Préserver les cibles tactiles minimales de 44×44px sur les deux boutons de navigation (`shrink-0 min-h-11 min-w-11`), tout en garantissant un affichage complet sur desktop et compact sans débordement sur smartphone.
3. Alternatives envisagées :
   - Tronquage pur `truncate` de la chaîne longue — rejetée car l'utilisateur perd la date de fin de la semaine.
   - Passage sur deux lignes avec augmentation de la hauteur du champ — rejetée car elle rompt l'alignement à 44px (`min-h-11`) avec les champs adjacents (Recherche, Équipe).
   - Format court sur mobile (`28 sept. – 2 oct. 2026`) et format complet sur grand écran (`Semaine du 28 septembre au 2 octobre 2026`) — **retenue** car sobre, lisible et naturellement adaptée à la largeur utile disponible.
4. Signal de fin : Sélecteur occupant la pleine largeur utile sur mobile avec chevrons protégés à gauche et à droite, texte compact centré, format long conservé sur desktop, build Vite réussi et suite déterministe verte.
5. Déclencheur KI : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée : Les sélecteurs de dates hebdomadaires doivent disposer d'une variante courte pour les viewports étroits (< 640px) afin d'éviter d'imposer des chaînes de plus de 40 caractères dans des conteneurs mono-lignes.

### Tâche : Harmonisation des formats de dates et responsivité des filtres (Pointages et Exports)
**Date** : 2026-10-02
**Complexité** : Moyen
**Proposant** : Fabien
**Story liée** : —

#### Pre-flight (10 min)
1. Problème réel : Divergences de gabarit et de formatage calendaire entre les modules Contrôle des présences (`PresencesView.vue`), Disponibilités (`AvailabilitiesView.vue`) et Exports (`ExportView.vue`). Le sélecteur journalier était un simple champ de saisie brut sans navigation par chevrons, la semaine utilisait une flèche brute `→` au lieu du tiret demi-cadratin `–`, et les gabarits n'offraient pas d'adaptation compacte sur mobile.
2. Contrainte principale : Respect strict des assertions de `scripts/verify-gates.mjs` (G64 pour le filtre de période, G88 pour la grammaire gestionnaire, G89 pour le responsive, G72/G75 pour Dexie), maintien des cibles tactiles de 44×44px (`shrink-0 min-h-11 min-w-11`), et absence totale de dépendances externes nouvelles.
3. Alternatives envisagées :
   - Conserver l'input date natif apparent sur mobile pour le mode Jour — rejetée car visuellement hétérogène avec les modes Semaine et Mois.
   - Sélecteur avec chevrons `<` `>` et libellé stylé intégrant un input date natif invisible au clic — **retenue (recommandée)** car elle offre simultanément la navigation rapide pas à pas et le sélecteur calendrier natif sans rupture esthétique.
   - Flèches `→` textuelles pour les plages — rejetée (déconseillée) car typographiquement inférieure au tiret demi-cadratin `–`.
4. Signal de fin : Gabarits unifiés sur `PresencesView.vue` et `ExportView.vue`, formats de date adaptatifs (court sur mobile, long sur desktop), 100% de succès sur `node scripts/verify-gates.mjs --all`, build Vite validé et vérification visuelle par captures d'écran DevTools sur mobile et desktop.
5. Déclencheur KI : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée : L'unification des sélecteurs temporels sous un gabarit commun (chevrons sanctuarisés 44px + libellé adaptatif court/long + déclencheur de saisie native au clic) élimine la friction ergonomique sur mobile tout en conservant une structure responsive robuste et sans dette.

### Tâche : Harmonisation du Statut Réseau (Tiroir et Bandeau de navigation)
**Date** : 2026-10-02
**Complexité** : Moyen
**Proposant** : Fabien
**Story liée** : —

#### Pre-flight (10 min)
1. Problème réel : Divergence de langage visuel entre l'indicateur permanent de synchronisation dans le tiroir (`SyncIndicator.vue`) et l'alerte réseau du bandeau d'en-tête (`SyncAlert.vue`). `SyncIndicator` employait un badge DaisyUI opaque à fond plein grisâtre (`badge-ghost`) pour l'état hors ligne, alors que `SyncAlert` affichait une pastille transparente bordée en orange warning (`border-warning/40 text-warning`).
2. Contrainte principale : Préservation stricte de la porte G24 (présence des tokens `badge-sm`, `min-w-0`, `max-w-full`, `shrink`, et du span de texte avec `truncate`), respect de l'ancrage du repli en rail (`.rail-network`), et maintien du seuil d'alerte silencieux quand tout est sain.
3. Alternatives envisagées :
   - Masquer l'alerte sur desktop au profit du seul tiroir — examinée mais l'utilisateur a expressément choisi l'alignement sur le design exact de la puce bordée du bandeau.
   - Puce transparente bordée sur fond transparent dans le tiroir avec synchronisation sémantique des couleurs (warning orange pour hors ligne, info bleu pour en attente, success vert pour à jour) — **retenue** conformément au choix explicite de l'utilisateur.
4. Signal de fin : Remplacement du badge DaisyUI par la pilule transparente bordée avec puce `bg-current`, 100% de réussite sur `node scripts/verify-gates.mjs --all` et vérification visuelle par captures DevTools en état connecté et hors ligne.
5. Déclencheur KI : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée : Les indicateurs d'état disséminés sur différentes surfaces (tiroir permanent et bandeau contextuel) doivent partager une grammaire de composant uniforme (fond transparent, bordure fine sémantique et puce `bg-current`) pour éviter toute dissonance cognitive lors des transitions de connexion.

### Tâche : Refonte humaine du ton des cartes KPI (Disponibilités)
**Date** : 2026-10-02
**Complexité** : Moyen
**Proposant** : Fabien
**Story liée** : —

#### Pre-flight (10 min)
1. Problème réel : Libellés des 3 cartes KPI de synthèse dans `AvailabilitiesView.vue` impersonnels, froids et confus (« 15 Présences attendues • Jours passés », « 1 Pointés • Journées pointées », « Présence constatée • Sur les jours prévus »). La formulation administrative masquait le sens concret des métriques et affichait des zéros stériles sur les semaines futures.
2. Contrainte principale : Maintien de la grille M3 réactive (`grid-cols-2 sm:grid-cols-3`), respect des critères de non-régression (G88, G89, G93), absence de tout jargon répressif ou d'injonction, et contextualisation dynamique selon la temporalité (semaine passée, en cours, ou future).
3. Alternatives envisagées :
   - Formulations managériales orientées mission (« Journées au planning », « Journées assurées », « Réalisation ») — rejetée car encore trop instrumentale.
   - Formulations télégraphiques (« Prévu », « Réalisé », « Taux ») — rejetée car froide et déconnectée du quotidien de l'équipe.
   - Direction « Vie d'équipe » bienveillante (« Planning de l'équipe », « Pointages confirmés », « Présence réelle » avec ratio concret « X sur Y journées prévues » et bascule proactive sur « Absences signalées » pour les semaines futures) — **retenue** conformément au choix de l'utilisateur.
4. Signal de fin : Cartes adaptées et limpides, ratio explicite en sous-titre, 100% de succès sur `node scripts/verify-gates.mjs --all`, build Vite réussi et validation visuelle mobile/desktop.
5. Déclencheur KI : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée : Les métriques de planification gagnent en lisibilité quand elles sont traduites en concepts concrets d'équipe plutôt qu'en compteurs administratifs abstraits, notamment en explicitant le dénominateur (« 1 sur 15 journées prévues ») et en adaptant la métrique à la temporalité consultée.

### Tâche : Configuration des Horaires Généraux d'Entreprise (Disponibilités & company_settings)
**Date** : 2026-10-02
**Complexité** : Élevée
**Proposant** : Fabien / next-level-backend & next-level-ui
**Story liée** : —

#### Analyse
- **Hypothèse initiale** : L'application ne disposait d'aucun horaire général dynamique ; seuls des horaires individuels figuraient dans `profiles` et `availabilities`, avec des valeurs par défaut figées (`09:00:00` / `18:00:00`). L'utilisateur a choisi l'Option UI 2 (module Disponibilités) et la Piste Backend A (`company_settings` en singleton).
- **Contraintes identifiées** :
  - Respect de l'architecture Local-First et de la frontière Dexie (version 2 incrémentale, version 1 sanctuarisée, singleton local).
  - RLS Supabase inconditionnelle avec lecture `authenticated` et écriture réservée aux managers/admins.
  - Transactional Outbox avec idempotence sur clé primaire fixe `'00000000-0000-0000-0000-000000000001'`.
  - Maintien strict de la conformité aux oracles `verify-gates.mjs` (cibles 44px, tokens M3, absence d'ombres agressives, compilation sans erreur).
- **Alternatives envisagées** :
  - Option UI 1 (Paramètres `/manager/settings`) : rejetée par l'utilisateur au profit d'une action directe dans Disponibilités (`/manager/availabilities`), au plus près de la planification.
  - Option UI 4 (Pointages `/manager/presences`) : rejetée car elle mélangeait audit opérationnel temps réel et paramétrage d'entreprise.
  - Piste Backend B (`teams.expected_arrival_time`) : rejetée comme solution unique car elle ne couvrait pas les collaborateurs transverses sans équipe.
  - Piste Backend C (Mise à jour en masse des profils) : rejetée car destructive pour les aménagements individuels et génératrice de bruit outbox.

#### Décision
**Choix retenu** : Table `company_settings` (Singleton d'organisation) avec migration SQL réversible, incrément Dexie `version(2)`, intégration dans `useSyncEngine.js`, et dialogue d'édition accessible dans l'en-tête de `AvailabilitiesView.vue` (Option UI 2) avec option d'harmonisation des collaborateurs.
**Trade-offs acceptés** : Les collaborateurs conservent la possibilité d'avoir un horaire individuel contractuel distinct ; l'horaire d'entreprise agit comme le socle de référence par défaut.
**Engagement KI** : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée : La gestion d'un horaire général dans une architecture Local-First gagne à être traitée comme un singleton d'organisation (`company_settings`) synchronisé via l'Outbox avec repli déterministe par cascade (`COALESCE` disponibilité > profil > organisation > défaut canonique). Son accès direct dans le module Disponibilités fluidifie le flux de planification sans dégrader la séparation des responsabilités.

### Tâche : Visibilité du Statut Réseau dans le Bandeau (Tablette et Bureau)
**Date** : 2026-10-02
**Complexité** : Moyen
**Proposant** : Fabien / next-level-ui
**Story liée** : —

#### Pre-flight (10 min)
1. Problème réel : En format tablette et bureau (≥ 840px), le statut réseau n'apparaissait pas dans le bandeau supérieur en état sain, tandis que le pied du volet latéral hébergeait un indicateur permanent rogné en mode rail (840px–1024px). L'utilisateur a identifié que doubler les indicateurs sur grand écran était redondant, alors que sur mobile le tiroir fermé laissait l'utilisateur sans aucune information.
2. Contrainte principale : Maintien d'un indicateur de statut unique, universel et accessible (cible tactile 44px `min-h-11`), préservation de la navigation pure dans les tiroirs, absence totale de modification de versions de dépendances, et alignement rigoureux des oracles `scripts/verify-gates.mjs`.
3. Alternatives envisagées :
   - Statut dans le bandeau uniquement sur desktop/tablette et maintien du tiroir : rejetée car génère deux indicateurs simultanés dans le champ de vision sur grand écran.
   - Statut masqué par CSS dans le tiroir sans mise à jour des tests : rejetée car introduit du code mort et contourne artificiellement les oracles.
   - Centralisation exclusive dans le bandeau supérieur à toutes les résolutions (Option 1 validée par Fabien), avec retrait du pied de volet latéral et actualisation des oracles : **retenue** car elle élimine toute duplication, offre la visibilité immédiate sur mobile, épure le mode rail et rationalise l'architecture d'information.
4. Signal de fin : `SyncAlert.vue` réactif et permanent dans le bandeau (vert « À jour », orange « Hors ligne », bleu en attente/sync), pied de tiroir retiré dans `ManagerLayout.vue` et `EmployeeLayout.vue`, oracles G5, G17, G20, G22, G35, G45 et G143-G146 validés à 100% sur `verify-gates.mjs --all`, build Vite réussi.
5. Déclencheur KI : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée : Le statut de synchronisation et de connectivité gagne à être unifié en un point d'accès canonique unique (le bandeau supérieur d'application). Déporter le statut dans un pied de barre latérale crée des frictions sur les formats intermédiaires (rails d'icônes) et une redondance cognitive dès lors que le volet reste déployé.


---

## Archives

*(Les tâches fermées migrent ici. Elles restent visibles pour la traçabilité ; aucune rotation temporelle.)*
