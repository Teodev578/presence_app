# Règle Permanente : Boucle d'Apprentissage et Mémoire des Agents

Ce document fixe les conditions de capture, de tenue et d'escalade des connaissances durables du projet. Le protocole complet (format des fiches, métabolisme, mesure) fait foi dans `.agents/knowledge/README.md`. La conception et ses sources sont dans `docs/audits/setup-agentique-2026-09.md` section 10.

---

## 1. Où vit la mémoire

- **Couche équipe** : `.agents/knowledge/`, commitée, revue en diff. Une fiche `KI-NNNN-slug.md` par leçon, indexée dans `.agents/knowledge/INDEX.md` (200 lignes maximum).
- **Couche personnelle** : `.agents/knowledge.local/`, ignorée par git. Préférences de travail et notes de session, jamais de règle d'équipe.

Aucune mémoire hors dépôt. Ce qui n'est ni versionné ni revu finit par contredire le code.

## 2. Quand capturer (l'acte unique)

La correction et l'enregistrement forment un seul geste, daté et signé. Déclencheurs obligatoires :

1. la même erreur se produit une deuxième fois ;
2. le même commentaire de revue revient une deuxième fois ;
3. l'utilisateur répète la même correction ;
4. un bug sorti de `.scratch/` ou d'un ledger `GATES.md` a coûté plus d'une heure.

Chaque reproduction d'une erreur déjà fichée s'inscrit dans le compteur de récurrence de `INDEX.md`.

## 3. Forme d'une règle

Une règle s'écrit en action datée et reliée à son incident : « Quand X arrive, faire Z, parce que le [date] tel composant a coûté telle chose ». Une note factuelle non datée se lit comme une suggestion. Rien de dérivable du code ne se consigne : ni chemin, ni signature, ni commande déjà visible dans le dépôt.

## 4. Échelle d'escalade

Une règle violée malgré sa fiche monte d'un palier :

| Niveau | Support | Quand |
|---|---|---|
| 1 | fiche KI (conseil) | constat fait, vérification manuelle |
| 2 | règle `.agents/rules/` | la leçon engage toutes les sessions |
| 3 | oracle ou hook (application) | la règle est violée une fois de plus |

La mémoire conseille, l'oracle applique. Niveau 3 type : flag de `scripts/verify-gates.mjs`, contrôle de `scripts/knowledge-check.mjs`, hook pre-commit.

## 5. Tenue et santé

- Frontmatter obligatoire (`TEMPLATE.md`) : `id`, `date`, `auteur`, `statut`, `domaine`, `triggers`, `source`, `revalider-avant`.
- Toute fiche active porte une échéance de revalidation (date + 60 jours par défaut). Une fiche dépassée passe en `a-verifier`, elle ne sert plus de base à un travail tant qu'elle n'est pas confirmée ou reclassée.
- Rituel bimensuel porté par `bmad-retrospective` ou une passe `code-hygiene` : contradictions, doublons, périmées, contenu dérivable du code.
- Santé de la base : `node scripts/knowledge-check.mjs --all`.

## 6. Frontière de promotion

`expérience → fiche candidate → revue humaine → fiche active → règle → skill`. Aucun palier ne se franchit sans revue. Une procédure réutilisable par tâche mérite un skill, une règle d'équipe stable mérite une entrée de `.agents/rules/`, le reste reste en fiche.

## 7. Sous-agents

Un sous-agent lit `INDEX.md` en début de tâche et travaille en lecture seule sur la mémoire. Il dépose ses constats dans ses artefacts ; l'agent principal porte la fiche candidate. Aucun sous-agent n'écrit dans `.agents/knowledge/` ni dans `.agents/rules/`.
