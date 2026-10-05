# Journal d'Arbitrages & Brouillon de Réflexion — PresenceApp

Ce fichier sert de **brouillon de réflexion persistant** et de journal d'arbitrages : tout comme un élève pose ses calculs et hypothèses sur une feuille de brouillon avant de rédiger, l'agent ou sous-agent y matérialise son raisonnement dialectique avant de toucher au code. Il consigne les hypothèses, les contraintes, les alternatives refusées, les compromis acceptés et les leçons tirées.

Il ne remplace pas `AGENTS.md` (invariants figés), `.agents/plan.md` (feuille de route séquentielle d'exécution), ni les fiches `.agents/knowledge/` (leçons durables capitalisées). Il documente ce qui est *en cours de réflexion et d'arbitrage*.

### Règles d'usage du brouillon

1. **(Recommandé) Consigner systématiquement l'alternative rejetée et sa justification avant d'agir** : Pour toute tâche non triviale (complexité ≥ Moyen), poser par écrit le problème réel, la contrainte principale et impérativement au moins une alternative rejetée avec le motif précis de son rejet. Ne jamais débuter l'implémentation sans avoir formalisé cette étape.
2. **(Recommandé) Clôturer à chaud avec leçon tirée et signalement KI immédiat** : Dès que l'implémentation est achevée, renseigner le statut réel, la date et la leçon tirée. Si un déclencheur KI est rencontré (erreur répétée, temps de correction élevé), rédiger la fiche dans `.agents/knowledge/` séance tenante.
3. **(Déconseillé) Créer une entrée pour les corrections triviales ou unilignes** : Les retouches ponctuelles, corrections de coquilles ou ajustements isolés ne doivent pas générer d'entrée afin de préserver la lisibilité et la haute valeur décisionnelle de ce journal.

**Règle d'escalade** : Une décision qui revient à l'identique dans deux tâches distinctes monte dans une règle `.agents/rules/`. Une leçon tirée répondant aux critères KI (`11-apprentissage-et-memoire.md`) alimente une fiche `.agents/knowledge/` au moment de la correction, sans délai.

**Portée** : Tâches de complexité « Moyen » ou « Élevée » uniquement.

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

### Tâche : Déclencheur et Boîte de Dialogue de Notifications dans le Bandeau
**Date** : 2026-10-02
**Complexité** : Moyen
**Proposant** : Fabien / next-level-ui
**Story liée** : —

#### Pre-flight (10 min)
1. Problème réel : Absence de point d'entrée pour les notifications système dans le bandeau supérieur d'application. L'utilisateur souhaite disposer d'une icône cloche placée immédiatement devant l'indicateur de synchronisation, ouvrant une boîte de dialogue modale classique avec un état vide propre en attendant l'implémentation du flux de notifications.
2. Contrainte principale : Respect des standards d'ergonomie et d'accessibilité (M3 dialog, cible tactile 44×44px `min-h-11 min-w-11`, focus visible, fermeture par Échap et clic extérieur), zéro régression sur les oracles du bandeau (G5, G17, G20), et composant partagé réutilisable entre ManagerLayout et EmployeeLayout.
3. Alternatives envisagées :
   - Implémentation inline dans chaque layout : rejetée car duplique la structure modale et la logique réactive dans deux fichiers.
   - Menu déroulant (dropdown) sous la cloche : rejetée car problématique sur smartphone étroit où les dropdowns débordent hors de l'écran.
   - Composant dédié `NotificationBell.vue` encapsulant le déclencheur 44px et la boîte de dialogue modale M3 avec état vide : **retenue (recommandée)** car modulaire, accessible et parfaitement intégrée au design system.
4. Signal de fin : Bouton cloche présent devant l'icône de synchronisation dans ManagerLayout et EmployeeLayout, dialogue modal accessible s'ouvrant au clic et affichant l'état vide soigné, 100% de réussite sur `node scripts/verify-gates.mjs --all` et build de production réussi.
5. Déclencheur KI : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée : Les contrôles d'en-tête combinant un déclencheur iconique et un dialogue contextuel gagnent à être encapsulés sous forme de popover ancré (`NotificationBell.vue`), évitant le piège du stacking context CSS causé par `backdrop-filter` sur la barre de navigation.

### Tâche : Masquage des Actions d'En-tête (Réseau et Notifications) sur la Vue Paramètres
**Date** : 2026-10-02
**Complexité** : Moyen
**Proposant** : Fabien / next-level-ui
**Story liée** : —

#### Pre-flight (10 min)
1. Problème réel : Sur la page des paramètres (`/#/manager/settings` et `/#/employee/settings`), la vue est un écran de configuration focalisé. Conserver l'icône de synchronisation et l'icône de notification dans le bandeau supérieur provoquait un encombrement visuel et une duplication par rapport aux sections dédiées de la page.
2. Contrainte principale : Masquer sélectivement `SyncAlert` et `NotificationBell` sur la vue des paramètres (`v-if="!onSettings"`), laissant le bandeau supérieur dédié au bouton retour et au titre de la page, tout en maintenant la stricte parité entre `ManagerLayout` et `EmployeeLayout` et la réussite des oracles.
3. Alternatives envisagées :
   - Masquer uniquement la synchronisation et conserver la cloche : rejetée suite à l'arbitrage utilisateur de focaliser l'écran des paramètres.
   - Masquer l'ensemble des actions d'en-tête (synchronisation, notifications et bouton paramètres) via `v-if="!onSettings"` (Option retenue) : **recommandée** car elle offre une interface épurée propice aux réglages.
4. Signal de fin : `SyncAlert v-if="!onSettings"` et `NotificationBell v-if="!onSettings"` dans `ManagerLayout.vue` et `EmployeeLayout.vue`, oracle `checkSettingsPage` actualisé et passant à 100% sur `verify-gates.mjs --all`, build Vite réussi.
5. Déclencheur KI : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée : Les écrans de configuration secondaire (comme les Paramètres) gagnent à libérer entièrement la zone d'actions droite du bandeau pour renforcer la lisibilité et la concentration sur le formulaire de réglages.

### Tâche : Cycle de Vie des Comptes, Confirmation de Session et Archivage Réversible
**Date** : 2026-10-02
**Complexité** : Élevée
**Proposant** : Fabien / next-level-backend & next-level-ui
**Story liée** : —

#### Analyse
- **Hypothèse initiale** : L'inscription d'un employé donne un accès immédiat au pointage sans validation de compte par un manager. L'archivage manager est en réalité un soft-delete destructeur pour l'affichage (`deleted_at: now`), sans possibilité de désarchivage. Aucun mécanisme d'expiration (7j pour compte non validé, 30j pour compte archivé) n'existe.
- **Contraintes identifiées** :
  - Un client web PWA ne peut pas exécuter de manière autonome des tâches différées à 7 et 30 jours lorsque l'application est fermée ou hors-ligne.
  - La suppression définitive d'un compte exige d'intervenir dans `auth.users`, ce qui nécessite les prérogatives `service_role` ou des fonctions PostgreSQL `SECURITY DEFINER`.
  - Intégrité de la persistance locale Dexie : préservation absolue des versions 1 et 2, incrément vers `version(3)` avec initialisation rétroactive des profils locaux existants à `status = 'active'`.
  - Préservation des données historiques : un compte archivé ou désactivé au bout de 30 jours ne doit pas subir de suppression physique de ses pointages ni de ses disponibilités pour respecter les obligations d'audit et d'export.
  - Respect strict des standards UI M3, cibles 44px, et oracles `verify-gates.mjs`.
- **Alternatives envisagées** :
  - Purge déléguée au front-end du manager lors de sa connexion : rejetée car fragile, dépendante de la présence en ligne d'un tiers et non déterministe.
  - Edge Function Deno planifiée : rejetée en première intention car PostgreSQL gère nativement la purge via `pg_cron` et procédure stockée sans dépendance serveur supplémentaire.
  - Blocage brut de connexion pour compte non validé : rejetée car anxiogène et dénuée de feedback collaborateur.

#### Décision
**Choix retenu** : 
1. Migration Supabase étendant `profiles` avec `status` (`pending_validation`, `active`, `archived`, `disabled`), `confirmed_at`, `archived_at`, trigger d'inscription mis à jour, politiques RLS `profiles_update_manager` et procédure `cleanup_expired_profiles` couplée à `pg_cron`.
2. Incrément Dexie `version(3)` dans `src/lib/db.js` avec index sur `status`.
3. Session collaborateur restreinte : vue `PendingApprovalView.vue` affichée dans `EmployeeLayout` quand `status === 'pending_validation'`, avec écoute réactive de la validation sans reconnexion.
4. Refonte de `EmployeesView.vue` : filtres de statut segmentés, action « Valider le compte », action « Archiver » avec délai de 30 jours, action « Désarchiver » immédiate, et décompte des jours restants.
**Trade-offs acceptés** : Les comptes existants sont tous initialisés à `status = 'active'` pour garantir une continuité de service totale sans verrouillage intempestif des utilisateurs actifs.
**Engagement KI** : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée : 
  1. *Sécurité RLS et récursion* : Ne jamais invoquer une fonction SQL interrogeant `profiles` dans une politique RLS appliquée sur `profiles` elle-même sous peine de provoquer une récursion infinie (timeout SQL) ; privilégier `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND ...)`.
  2. *Automatisation temporelle* : Les délais d'expiration (7j pour purge des inscriptions non confirmées, 30j pour désactivation des profils archivés) doivent être gérés côté SGBD via `pg_cron` et procédure `SECURITY DEFINER`, complétés d'un contrôle Just-In-Time lors de l'authentification.
  3. *Local-First et Dexie* : L'évolution du schéma local vers `version(3)` avec index `status` et hook `.upgrade()` rétroactif assure la continuité de service pour les comptes préexistants sans perturber la file d'outbox.
  4. *Règle 09 côté collaborateur* : L'expérience d'attente d'intégration gagne en qualité lorsqu'elle bannit le lexique administratif ("validation") au profit de termes clairs et orientés accompagnement ("confirmation", "activation").

### Tâche : Notifications de Cycle de Vie (Comptes en Attente pour Managers et Collaborateurs)
**Date** : 2026-10-02
**Complexité** : Moyen
**Proposant** : Fabien / next-level-ui & next-level-backend
**Story liée** : —

#### Pre-flight (10 min)
1. Problème réel :
   - Les managers et administrateurs ne sont pas informés activement dans l'interface de l'existence de nouveaux comptes en attente de validation (`status === 'pending_validation'`), ce qui risque de laisser expirer le délai des 7 jours sans action.
   - Les collaborateurs ayant créé leur compte n'ont pas d'alerte dans leurs notifications précisant que le compte n'est pas encore actif, qu'il expirera dans 7 jours, et les invitant à solliciter leurs supérieurs pour activer leur profil.
2. Contrainte principale :
   - Dynamisme et réactivité locale (Local-First via Dexie `useLiveQuery` pour les managers).
   - Règle 09 / G30 stricte côté collaborateur : bannissement des termes « validation », « valider », « utilisateur » et « veuillez » dans l'espace collaborateur.
   - Respect strict des cibles tactiles 44px (`min-h-11 min-w-11`), des tokens M3 et de l'accessibilité dans `NotificationBell.vue`.
3. Alternatives envisagées :
   - Option A : Notification par bandeau toast éphémère à chaque connexion. Rejetée car intrusive, non persistante et perturbante pour le flux utilisateur.
   - Option B : Table SQL dédiée `notifications` avec polling distant. Rejetée (déconseillée) car surdimensionnée pour ce besoin : les états sont déjà déductibles de manière réactive dans Dexie (`status === 'pending_validation'`) sans alourdir le schéma ni consommer de bande passante.
   - Option C : Composable `useNotifications.js` dérivant dynamiquement les alertes depuis Dexie pour les managers et depuis le profil courant pour les collaborateurs, couplé à un badge interactif et à des fiches d'action dans `NotificationBell.vue`. **Option retenue (Recommandée)** car réactive, 100% Local-First et sans latence.
4. Signal de fin :
   - `NotificationBell.vue` affiche une pastille rouge avec le compteur de comptes en attente pour les managers.
   - La boîte de dialogue détaille chaque compte en attente (nom, email, jours restants) et propose un bouton d'action directe « Examiner dans l'équipe ».
   - Pour l'employé, la cloche (présente sur `PendingApprovalView` et `EmployeeLayout`) affiche une notification d'activation invitant à solliciter ses supérieurs avant l'échéance des 7 jours.
   - 100% de réussite sur `verify-gates.mjs --all` et `npm run build`.
5. Déclencheur KI : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée :
  1. *Réactivité Local-First* : Dériver dynamiquement les alertes dans `useNotifications.js` via `useLiveQuery` sur `db.profiles` évite d'ajouter une table distante `notifications`, assurant une mise à jour instantanée sans polling ni surcharge réseau.
  2. *Synergie Navigation-Filtres* : L'écoute réactive de `route.query.status` dans `EmployeesView.vue` permet aux notifications de router directement vers le bon filtre contextuel (`pending_validation`) avec une transition fluide.
  3. *Cohérence des cibles tactiles M3* : Les dialogues popover d'en-tête exigent une vigilance sur chaque bouton d'action secondaire (tel que "Tout marquer lu") pour préserver la cible minimale de 44px (`min-h-11`).
  4. *Conformité éditoriale G30* : Les notifications destinées aux collaborateurs doivent formuler le rappel des délais et la sollicitation de la hiérarchie avec une tonalité sobre et constructive, sans jamais employer le lexique administratif proscrit ("validation", "veuillez").

### Tâche : Action Manuelle « Refuser l'inscription » et Purge Immédiate (RPC Supabase)
**Date** : 2026-10-02
**Complexité** : Moyen
**Proposant** : Fabien / next-level-backend & next-level-ui
**Story liée** : —

#### Pre-flight (10 min)
1. Problème réel :
   - Lorsqu'un compte non validé est erroné, frauduleux ou non sollicité, le gestionnaire est actuellement contraint d'attendre l'expiration du délai de 7 jours pour que la purge automatique s'opère.
   - Il manque une commande explicite « Refuser » permettant à un manager ou administrateur de purger immédiatement le compte (dans `profiles` et `auth.users`) après confirmation.
2. Contrainte principale :
   - Sécurité et permissions : la suppression dans `auth.users` requiert les droits `SECURITY DEFINER` (procédure RPC PostgreSQL) avec contrôle strict du rôle de l'appelant (seuls `admin` et `manager` sont autorisés) et vérification que la cible est bien en `status = 'pending_validation'`.
   - Ergonomie M3 et cibles 44px : bouton « Refuser » accessible, modale de confirmation `ConfirmModal` explicite, suppression réactive dans le Dexie local et synchronisation distante.
3. Alternatives envisagées :
   - Option A : Simple suppression locale dans Dexie avec outbox DELETE sur `profiles`. Rejetée car ne supprime pas l'utilisateur dans `auth.users`, laissant l'accès d'authentification orphelin et bloquant une future réinscription avec le même e-mail.
   - Option B : Fonction RPC Supabase `reject_pending_profile(target_user_id)` en `SECURITY DEFINER` supprimant atomiquement dans `auth.users` et `public.profiles`. **Option retenue (Recommandée)** car elle garantit une purge physique complète, sécurisée et déterministe.
4. Signal de fin :
   - Fonction RPC `reject_pending_profile` déployée et testée sur Supabase.
   - Bouton « Refuser » présent sur les cartes et le tableau de `EmployeesView.vue` pour les comptes `pending_validation`.
   - Modale de confirmation avertissant de la suppression définitive sans attendre les 7 jours.
   - Disparition immédiate du compte dans la liste et notification toast de confirmation.
   - 100% de réussite sur `verify-gates.mjs --all` et `npm run build`.
5. Déclencheur KI : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée :
  1. *Purge des comptes non validés* : L'action de refus manuel sur un compte `pending_validation` exige une suppression locale instantanée dans Dexie (`db.profiles.delete`) et un appel RPC PostgreSQL `admin_reject_unverified_account` en `SECURITY DEFINER` pour purger la ligne dans `public.profiles`. L'automate nocturne (`cleanup_expired_profiles`) prend en charge le nettoyage des orphelins résiduels dans `auth.users`.
  2. *Modale de confirmation et friction saine* : Pour une action destructive irréversible (purge définitive immédiate), la modale de confirmation `ConfirmModal` avec un bouton rouge explicite évite toute méprise avec le refus temporaire.
  3. *Fluidité réactive Local-First* : En retirant immédiatement l'entrée du Dexie local avant l'appel RPC distant, l'interface utilisateur s'actualise sans aucune latence perçue, tandis que le compteur de notifications en attente se met à jour en temps réel.

### Tâche : Session Restreinte et Écran Dédié pour Compte Archivé (Option 1)
**Date** : 2026-10-02
**Complexité** : Moyen
**Proposant** : Fabien / next-level-ui & next-level-backend
**Story liée** : —

#### Pre-flight (10 min)
1. Problème réel :
   - Lorsqu'un compte est archivé (`status === 'archived'`), il ne doit en aucun cas pouvoir utiliser l'application de façon opérationnelle (pointages, disponibilités, accès aux lieux et collègues), car cela compromettrait l'intégrité des registres de présence et la confidentialité d'entreprise.
   - Cependant, le rejeter brutalement au login sans explication crée une incompréhension. L'utilisateur doit pouvoir se connecter pour atterrir sur un écran dédié d'information (« Compte archivé ») indiquant le délai de 30 jours avant désactivation définitive et la conservation des données.
2. Contrainte principale :
   - Respect strict de la règle 09 / G30 : proscription des mots interdits ("validation", "valider", "utilisateur", "veuillez") dans l'espace collaborateur. Tonalité bienveillante, digne et claire.
   - Cibles tactiles 44px (`min-h-11 min-w-11`), design tokens M3, absence d'ombres excessives.
   - Protection hermétique dans `App.vue` : aucun accès aux routes de pointage ou aux pages d'administration.
3. Alternatives envisagées :
   - Option 1 (Retenue) : Écran dédié informatif avec décompte des 30 jours, notification contextuelle, vérification réactive de statut et bouton de déconnexion.
   - Option 2 (Rejetée) : Blocage strict au login avec déconnexion synchrone (anxiogène, prive le collaborateur d'information sur son statut).
   - Option 3 (Rejetée) : Accès complet maintenu avec bandeau passif (dangereux pour l'intégrité des pointages).
4. Signal de fin :
   - Composant `ArchivedAccountView.vue` créé et stylé selon le design system M3.
   - Intégration dans `App.vue` garantissant qu'un compte archivé ou désactivé n'accède à aucune vue opérationnelle.
   - Notification contextuelle dans `useNotifications.js`.
   - 100% de succès sur `node scripts/verify-gates.mjs --all` et `npm run build`.
5. Déclencheur KI : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée :
  1. *Autorisation vs Authentification* : La dissociation entre la capacité d'ouvrir une session et l'accès aux fonctions opérationnelles permet d'offrir une interface explicative et digne aux comptes archivés (`ArchivedAccountView.vue`), sans jamais compromettre l'intégrité des pointages ni la confidentialité des sites de l'entreprise.
  2. *Réactivité Local-First du cycle de vie* : Lorsqu'un gestionnaire désarchive un collaborateur dans Dexie, la réactivité du composable `useProfile` met immédiatement à jour `profile.value.status`, basculant le collaborateur de l'écran d'archive vers son tableau de bord opérationnel sans nécessiter de rafraîchissement complet de page.
  3. *Tonalité bienveillante et conformité M3* : Les comptes archivés bénéficient d'un traitement clair (décompte des 30 jours, réassurance sur la préservation des données historiques, démarches de contact), formulé dans le respect rigoureux de la règle 09 (aucun mot administratif proscrit) et des cibles tactiles de 44px.

### Tâche : Refonte Responsive & Onepage-First (ArchivedAccountView & PendingApprovalView)
**Date** : 2026-10-02
**Complexité** : Moyen
**Proposant** : Fabien / next-level-ui & responsive-adaptive-ui
**Story liée** : —

#### Pre-flight (10 min)
1. Problème réel :
   - *Marges latérales superflues* : sur mobile, le cumul des paddings du conteneur `main` et de la carte gaspillait entre 56px et 80px de largeur utile sur un écran de 360px ; sur desktop, la contrainte trop serrée (`max-w-md`) produisait un vide latéral disproportionné de ~700px tout en tassant le récapitulatif.
   - *Logique Onepage-First* : sur tous les viewports normaux (smartphones 667-844px de haut, tablettes, laptops), la vue doit se tenir à 100% dans la hauteur sans barre de défilement verticale visible.
   - *Défilement propre sur viewports étroits ou courts* : en cas de hauteur réduite (mode paysage mobile, zoom élevé), le conteneur central doit défiler verticalement sans que le centrage flexbox ne tronque le haut de la carte (élimination du piège `justify-center` + `overflow-y-auto`).
2. Contrainte principale :
   - Préservation stricte de la conformité WCAG AA (cibles tactiles `min-h-11 min-w-11` soit 44px).
   - Respect absolu de la règle 09 / G30 (aucun terme proscrit).
   - Tokens DaisyUI v5 / Tailwind v4 et échelle de formes Material 3 (`rounded-m3-xl`, `rounded-m3-md`).
3. Alternatives envisagées :
   - Option A : Défilement global de la page entière (`min-h-screen` classique) -> rejetée car brise la cohérence onepage PWA en faisant disparaître la navbar et le statut réseau.
   - Option B : Carte plein écran sans bordure sur mobile -> rejetée pour préserver l'identité visuelle de carte d'information M3.
   - Option C (Retenue) : Conteneur `h-dvh max-h-screen overflow-hidden` avec `header` et `footer` en `shrink-0`, zone centrale `flex-1 min-h-0 overflow-y-auto flex flex-col items-center px-2.5 sm:px-4 md:px-6` avec carte `my-auto w-full max-w-lg md:max-w-xl lg:max-w-2xl` et paddings adaptatifs (`p-3.5 sm:p-5 md:p-6`).
4. Signal de fin :
   - Affichage 100% onepage sans scrollbar sur écran standard.
   - Scroll fluide du haut vers le bas sur écran court / étroit sans troncature.
   - Élimination des paddings excessifs sur mobile et assise visuelle équilibrée sur grand écran.
   - Validation 100% sur `node scripts/verify-gates.mjs --all` et `npm run build`.
5. Déclencheur KI : N

#### Résultat
- Implémenté ? O (2026-10-02)
- Leçon tirée :
  1. *Éradication du gaspillage de marge latérale* : L'accumulation d'un padding extérieur de vue et d'un padding intérieur de carte (ex: `px-3` + `p-6`) détruisait l'ergonomie mobile en amputant plus de 60px sur 360px. En passant à `px-2.5 sm:px-4 md:px-6` sur le conteneur et `p-3.5 sm:p-5 md:p-6` sur la carte, la largeur utile est préservée sur smartphone, tandis que `max-w-lg md:max-w-xl lg:max-w-2xl` supprime l'îlot isolé et le vide stérile sur grand écran desktop.
  2. *Contrat Onepage-First et évitement du piège CSS flexbox* : L'utilisation de `items-center justify-center` sur un conteneur flex avec `overflow-y-auto` coupe irrémédiablement le haut de page dès que la hauteur d'écran est trop faible. En combinant un conteneur `flex flex-col items-center overflow-y-auto` avec une carte portant `my-auto`, le centrage vertical est mathématiquement parfait sans scrollbar quand l'espace suffit (onepage-first), et le défilement démarre naturellement depuis le premier pixel du haut dès que la hauteur devient restreinte.
  3. *Cohérence inter-écrans d'attente/statut* : Les vues `ArchivedAccountView.vue` et `PendingApprovalView.vue` partagent désormais la même grammaire ergonomique, les mêmes proportions d'en-tête, les mêmes cibles tactiles WCAG AA 44px (`min-h-11`) et le même pied de page sobre.

### Tâche : Protection contre l'Archivage des Rôles Privilégiés (Manager, Admin)
**Date** : 2026-10-03
**Complexité** : Moyen
**Proposant** : Fabien / next-level-backend & next-level-ui
**Story liée** : —

#### Pre-flight (10 min)
1. Problème réel :
   - L'archivage direct d'un compte administrateur ou gestionnaire comporte un risque critique d'auto-exclusion (*self-lockout*) ou d'amputation accidentelle de la gouvernance de l'équipe.
   - Un compte privilégié doit être rétrogradé en simple collaborateur ('employee') avant de pouvoir être archivé.
2. Contrainte principale :
   - Intégrité multi-couche : garantie déclarative par contrainte CHECK PostgreSQL et trigger BEFORE UPDATE sur Supabase, doublée d'un garde-fou applicatif dans `EmployeesView.vue`.
   - Clarté pédagogique de l'interface : bouton "Archiver" désactivé avec info-bulle explicite (`tooltip`) pour que le gestionnaire comprenne immédiatement l'action préalable requise.
3. Alternatives envisagées :
   - Option A : Masquer simplement le bouton "Archiver" sans explication -> rejetée car source de perplexité pour le gestionnaire.
   - Option B : Vérification uniquement en frontend -> rejetée car vulnérable aux mutations directes ou requêtes API.
   - Option C (Retenue) : Sécurité profonde (Trigger PostgreSQL + Contrainte CHECK + Refus frontend dans `requestArchive`, `confirmArchive` et `saveEmployee` + Bouton désactivé avec info-bulle explicite).
4. Signal de fin :
   - Migration `20261003001500_prevent_archiving_privileged_roles.sql` appliquée avec succès sur Supabase.
   - Rejet de toute tentative SQL d'archivage d'un admin ou manager avec message d'erreur clair.
   - Interface `EmployeesView.vue` affichant le bouton désactivé avec `tooltip` explicite pour les rôles privilégiés.
   - Oracles G167-G168 validés à 100% et `npm run build` en sortie 0.
5. Déclencheur KI : N

#### Résultat
- Implémenté ? O (2026-10-03)
- Leçon tirée :
  1. *Défense en profondeur pour les actions destructives/d'éviction* : En couplant un trigger PostgreSQL `BEFORE UPDATE` (qui lève une exception 23514 contextualisée) et une contrainte `CHECK` relationnelle, la base de données demeure hermétique face à toute dérive, même hors UI.
  2. *Ergonomie préventive vs punitive* : Plutôt que de masquer l'action ou de laisser l'utilisateur déclencher une modale pour échouer après validation, l'affichage du bouton désactivé avec l'info-bulle "Rôle protégé : modifier en collaborateur pour archiver" guide proactivement le gestionnaire sans friction superflue.

### Tâche : Amélioration et Automatisation de la Boucle d'Apprentissage KI
**Date** : 2026-10-05
**Complexité** : Élevée
**Proposant** : Fabien / unlazy & rigueur-code
**Story liée** : `.agents/plans/amelioration-boucle-apprentissage.md`

#### Analyse
- **Hypothèse initiale** : La boucle KI (.agents/knowledge/) fonctionne mais dépend trop de la discipline humaine en session : la capture n'est déclenchée que manuellement, le rituel bimensuel n'a aucun rappel ni contrôle de fraîcheur, `scripts/knowledge-check.mjs` n'est invoqué par aucun script npm ni hook git, et le compteur de récurrence dans `INDEX.md` est tenu de mémoire sans détection assistée.
- **Contraintes identifiées** :
  - Interdiction absolue d'altérer les versions ou d'ajouter de nouvelles dépendances npm sans accord explicite (pas d'installation de Husky/lint-staged ; utilisation d'un hook git natif dans `.githooks/`).
  - Principe inviolable : « aucun palier sans revue ». L'automatisation doit se limiter à la détection, au rappel et au signalement d'anomalies, sans jamais commiter ni rédiger de fiches de manière opaque. Les sous-agents demeurent en lecture seule sur la mémoire.
  - Déterministe et mesurable : oracles `knowledge:check` et `verify-gates.mjs` avec preuves tangibles.
- **Alternatives envisagées** :
  - Option A (Génération automatique de fiches par hook) : rejetée car violerait la validation humaine, risquerait d'inonder la base de fausses leçons ou de trivialités dérivables du code.
  - Option B (Installation de Husky et lint-staged) : rejetée car introduit des dépendances et scripts superflus alors qu'un simple hook git natif `.githooks/pre-commit` associé à `core.hooksPath` est plus léger et zéro dépendance.
  - Option C (Statut quo avec commande /learn uniquement) : rejetée car ne résout ni l'oubli du rituel bimensuel, ni l'absence d'oracle dans package.json, ni le manque de visibilité sur les récurrences.
  - Option D (Oracles exécutables + hook pre-commit natif + mode --recurrence + alerte de rituel 21j + protocole de clôture) : **retenue (recommandée)** car elle renforce l'outillage sans dette technique et garantit une boucle d'apprentissage vivante.

#### Décision
**Choix retenu** :
1. Ajout de scripts `knowledge:check` et `knowledge:staleness` dans `package.json` (zéro dépendance ajoutée).
2. Création d'un hook pre-commit natif `.githooks/pre-commit` qui exécute l'oracle quand `.agents/knowledge/` ou `.agents/rules/` est touché.
3. Extension de `scripts/knowledge-check.mjs` avec le mode `--recurrence` (scan d'occurrences d'erreurs et contrôle d'escalade du compteur) et vérification du rituel bimensuel (alerte si délai > 21 jours).
4. Mise à jour du README et protocole de clôture de tâche obligatoire.
**Trade-offs acceptés** : La détection de récurrence par pattern regex/mots-clés assiste l'agent mais ne remplace pas le jugement critique de l'ingénieur sur les causes profondes.

#### Résultat
- Implémenté ? O (2026-10-05) — Portes G169 à G174 validées à 100%, scripts npm opérationnels, suite verify-gates.mjs --all et build de production conformes.
- Leçon tirée :
  1. *L'outillage natif avant les dépendances* : Un hook natif `.githooks/pre-commit` (activable par `git config core.hooksPath .githooks`) doublé d'un oracle en script npm (`npm run knowledge:check`) offre une protection hermétique de la mémoire agentique sans nécessiter de dépendance npm supplémentaire ni compromettre le gel des versions.
  2. *Automatisation sans déresponsabilisation* : Les modes `--recurrence` et `--ritual` fournissent des alertes objectives et déterministes (détection des anomalies de récurrence et contrôle d'échéance à 21 jours) tout en préservant le principe fondamental : la rédaction et la validation des leçons durables restent soumises à la rigueur critique de l'ingénieur et à la revue humaine.
  3. *Déclencheur KI* : N (aucun motif répété ni coût excessif ; renforcement outillage).

---

## Archives

*(Les tâches fermées migrent ici. Elles restent visibles pour la traçabilité ; aucune rotation temporelle.)*
