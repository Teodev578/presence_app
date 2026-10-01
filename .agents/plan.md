# Plan
_Aucune tâche en cours._

Date : 2026-10-01
Déclencheur : diagnostic UX screenshots + recommandations boutons

## Périmètre (10 fichiers)

### Règles agentiques
- [ ] A1 `.agents/rules/07-design-system.md` — Ajouter section grammaire des boutons
- [ ] A2 `.agents/rules/08-skills-activation.md` — Ajouter gate oracle copy obligatoire
- [ ] A3 `.agents/rules/09-ui-copy-and-tone.md` — Ajouter glossaire positif gestionnaire

### Composants partagés
- [ ] C1 `src/components/shared/ThemeToggle.vue` — Corriger le label tronqué "Automatiqui..."
- [ ] C2 `src/components/shared/PwaInstallCard.vue` — Corriger copy marketing "Mode autonome actif…"

### Vues
- [ ] V1 `src/views/manager/DashboardView.vue` — Copy corporate + boutons
- [ ] V2 `src/views/manager/AvailabilitiesView.vue` — Overflow grille KPI mobile
- [ ] V3 `src/views/SettingsView.vue` — Boutons solitaires + btn-sm contradiction
- [ ] V4 `src/views/manager/TeamsView.vue` — Paire de boutons modale
- [ ] V5 `src/views/manager/EmployeesView.vue` — Paire de boutons modale

## Détail des changements

### A1 — Grammaire des boutons dans 07-design-system.md
Ajouter section §10 :
- Bouton solitaire dans section/carte → `w-full`
- Exception action destructrice → `w-full sm:max-w-64`
- Paire boutons (flex-row) → secondaire `px-5`, primaire `flex-1`
- CTA principal d'une vue → `min-h-12` + `active:scale-95 transition-transform duration-150`
- Tout autre bouton → `min-h-11` + `active:scale-95 transition-transform duration-150`
- Bouton icône seul → `min-h-11 min-w-11`
- Interdiction de mixer `btn-sm` et `min-h-11`

### A2 — Oracle copy dans 08-skills-activation.md
Ajouter ligne dans la matrice :
- Signal : modification d'un fichier `.vue` dans `src/views/` ou `src/components/`
- Action : exécuter `node scripts/verify-gates.mjs --voice-conformance`, produire la sortie comme EVIDENCE:

### A3 — Glossaire positif dans 09-ui-copy-and-tone.md
Ajouter tableau §5 :
- "Effectif actif" → "Personnes de l'équipe"
- "Collaborateurs enregistrés" → "Membres de l'équipe"
- "Statut des effectifs pour la journée" → "Activité du jour"
- "Sites autorisés" → "Mes sites"
- "0 pointage(s)" → "0 pointage" / "1 pointage" / "2 pointages" (règle §3 déjà existante)
- "Mode autonome actif : expérience fluide et stockage persistant" → "Lancée depuis l'écran d'accueil"

### C1 — ThemeToggle : label tronqué
L255 : `<span class="text-xs font-semibold tracking-tight truncate">{{ option.label }}</span>`
Le label "Automatique" (10 chars) est tronqué dans la grille 3 colonnes étroites.
Fix : réduire le label "Automatique" → "Auto" uniquement dans la vignette inline (prop `inline`).
Ou mieux : retirer `truncate` et ajouter `leading-none text-center` pour permettre le retour à la ligne sur 2 lignes max.

### C2 — PwaInstallCard : copy marketing
L147 : `"Mode autonome actif : expérience fluide et stockage persistant"`
→ `"Lancée depuis votre écran d'accueil, sans navigateur."`

L99 : `"Disponibilité locale"` (label technique) — pas de changement, il est assez explicite dans ce contexte.

### V1 — DashboardView : copy + boutons
- L104 : `"Statut des effectifs pour la journée du"` → `"Activité du"`
- L125 : `"Sites autorisés ({{ activeLocationsCount }})"` → `"Mes sites ({{ activeLocationsCount }})"`
- L140-142 : label "Effectif actif" + caption "Collaborateurs enregistrés" → "Équipe" + "Personnes actives"
- L164 : `"absence(s) déclarée(s)"` → pluriel propre via computed
- L175 : `"{{ presencesToday.length }} pointage(s)"` → pluriel propre
- Boutons du header (#actions) : "Sites autorisés" → "Mes sites" déjà fait ci-dessus
- Ajouter `active:scale-95 transition-transform duration-150` aux boutons primaires du header

### V2 — AvailabilitiesView : overflow overflow
L192 : `grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4`
Le conteneur parent ManagerLayout `<main>` a `p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto`.
Sur mobile, p-4 = 16px de chaque côté. La grille ne devrait pas déborder.
Vraie cause : `subtitle="Vue croisée : déclarations des collaborateurs et conformité des présences"` — mot "conformité" dans le sous-titre est aussi proscrit.
Fix overflow : ajouter `min-w-0` sur le conteneur flex parent de la grille et `overflow-hidden` sur le wrapper du template.
Fix copy : subtitle → `"Déclarations de disponibilité et pointages de la semaine"`

### V3 — SettingsView : boutons
- L375 : `btn btn-primary btn-sm ... self-start` → retirer `btn-sm` + `self-start`, ajouter `w-full`
- L410 : `btn btn-neutral btn-outline btn-sm ... self-start` → même correction
- L440 : `btn btn-error btn-outline ... self-start` → `w-full sm:max-w-64` (action destructrice)
- L269/277 (paire mot de passe) : primaire `flex-1`, secondaire `px-5` → déjà bien avec `flex-1` sur primaire ✓
- Ajouter `active:scale-95 transition-transform duration-150` aux boutons manquants

### V4 — TeamsView : paire modale
L315/316 : Annuler = taille naturelle, Confirmer = taille naturelle
→ `<div class="modal-action ... flex gap-2">` : primaire ajoute `flex-1`

### V5 — EmployeesView : paire modale
L487/488 : même pattern
→ primaire ajoute `flex-1`

## Critère d'arrêt
`npm run build` sans erreur après toutes les modifications.
