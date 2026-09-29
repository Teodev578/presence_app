# Audit du setup agentique PresenceApp

Date : 29 septembre 2026
Périmètre : `.agents/`, `AGENTS.md`, `CONTEXT.md`, `GATES.md`, plugin `presence-stack`, installation BMAD (`_bmad/`), chaîne de vérification.
Base : retours d'expérience publiés sur les forums de devs et travaux mesurés (Stack Overflow, Hacker News, Reddit, dev.to, GitHub Issues/Discussions, arXiv, blogs d'ingénierie), collectés le 29/09/2026.

## 1. Méthode

Quatre chantiers de recherche ont été menés en parallèle, chacun avec sa table de sources :
orchestration multi-agents, hygiène des fichiers d'instructions et des skills, mémoire et apprentissage, vérification et confiance.
Les digests sourcés sont archivés dans `docs/audits/recon/`.

Notation appliquée aux claims de recherche :

- **VERIFIED** : deux sources indépendantes concordantes.
- **SINGLE-SOURCE** : une seule source. À traiter comme une piste, pas comme un acquis.
- **CONTRADICTED** : sources en désaccord. Le désaccord est rapporté tel quel.

Deux limites à connaître avant de lire la suite. Reddit bloque l'accès automatisé : les claims issus de Reddit reposent sur des extraits de résultats de recherche, pas sur les fils complets. Et l'audit de configuration se fonde sur un seul banc d'essai contrôlé (Augment Code, avril 2026), jamais répliqué par un tiers.

Les références se notent `(Instr. S5)`, `(Mem. C7)`, `(Verif. C17)`, `(Orch. C2)` et renvoient aux digests de `docs/audits/recon/`.

## 2. Verdict

Votre setup est en avance sur la moyenne communautaire sur trois points (discipline de gates, matrice d'activation explicite, verrouillage des dépendances) et en retard sur deux points qui coûtent cher : vous n'avez aucun mécanisme d'apprentissage réel, et votre couche de vérification déterministe repose sur un seul script maison sans lint, sans formatage, sans tests normés.

Le trou le plus coûteux : la section « Mémoire d'apprentissage & Knowledge Items » de votre `AGENTS.md` promet un stockage sous `<appDataDir>/knowledge/`. Aucun fichier n'existe. La littérature est unanime sur ce cas : une mémoire déclarée mais vide ne fait rien, et une mémoire remplie sans protocole de cycle de vie empoisonne le contexte en quelques semaines (Mem. C3, C8).

Point de vigilance supplémentaire : vos 45 skills pèsent 10 426 caractères de descriptions, soit environ 70 % du budget d'affichage silencieux de Claude Code (~15 000 caractères). Au-delà, le harnais tronque les descriptions sans avertissement et des skills deviennent invisibles pour le modèle (Instr. S8, S46). Vous approchez du mur.

## 3. Mesures relevées sur le dépôt

| Indicateur | Valeur mesurée | Repère de la littérature | Lecture |
|---|---|---|---|
| `AGENTS.md` | 86 lignes | 100 à 150 lignes optimum (Instr. S5) | Conforme, marge disponible |
| `.agents/rules/` | 10 fichiers, 626 lignes | ≤ 200 lignes par fichier chargé (docs Anthropic) | Conforme fichier par fichier ; la charge utile totale reste à auditer |
| Skills installés | 45 | pas de plafond dur, mais budget de descriptions borné (Instr. S9) | 70 % du budget consommé |
| Descriptions de skills | 10 426 caractères | ~15 000 avant troncature silencieuse | Zone de risque dès 5 skills supplémentaires |
| Skills non classés dans `skills-scope.md` | 17 | tout skill exposé participe au budget | Fuite de contexte et activations parasites |
| `GATES.md` | 467 lignes, 18 ledgers, G1 à G76 | les oracles rouges permanents provoquent l'accoutumance (Verif. C23) | 4 échecs préexistants non traités |
| `scripts/verify-gates.mjs` | ~3 030 lignes, ~50 oracles | bon : preuve déterministe (Verif. C6) | mais point unique de défaillance |
| Framework de test | aucun | couche non négociable du consensus (Verif. C1) | Écart majeur |
| Lint / format / pre-commit | aucun | « les pre-commit reviennent à cause de l'IA » (Verif. S8) | Écart majeur |
| CI | react-doctor, mode advisory | la couche d'autorité est la CI (Verif. C1) | Aucune gate bloquante |
| Knowledge Items réels | 0 | mémoire = fichiers, pas intention (Mem. C2) | Écart majeur |
| Artefacts BMAD | 2 sessions de brainstorming | le pipeline PRD → epics → sprint-status n'a jamais tourné | La table de délégation reste théorique |

## 4. Axe A : orchestration et sous-agents

### Ce que dit la pratique

Le consensus le plus solide tient en une phrase : un seul agent par défaut, on passe au multi-agents quand un goulot d'étranglement précis l'exige (contexte, parallélisme, spécialisation) (Orch. C9, VERIFIED). Les écrits successifs de Cognition, d'Anthropic et les fils Hacker News convergent là-dessus.

Quand la délégation paie : travail de lecture bruyante en contexte isolé, exploration, tri de logs, recherche. Le sous-agent brûle ses tokens dans sa fenêtre et renvoie une synthèse (Orch. C1). Quand elle coûte : petites tâches, travail séquentiel, modifications du même fichier, codebase mature dont la connaissance est déjà curée dans des fichiers (Orch. C5).

Le coût token est multiplicatif. Anthropic mesure 4x pour un agent, 15x pour du multi-agents contre une simple conversation. Une mesure publique par spawn donne 54 154 tokens de coût fixe, corrigée depuis un chiffre initial de 436 000 (Orch. C2). Le seuil de rentabilité tourne autour de 30 000 à 50 000 tokens de lecture par tâche déléguée.

Sur les personas nommés (« lead frontend », « DBA », « auditeur QA »), les forums sont sceptiques : « Make agents for tasks, not roles », « dire au LLM qu'il est un PM chevronné ne fait pas de lui un PM chevronné » (Orch. C6). Une minorité défend les rôles quand ils transportent des checklists et des templates. Votre plugin `presence-stack` se range de ce côté-là : chaque agent porte des invariants techniques avec exigences et refus, pas une simple étiquette. C'est la variante défendable.

Le patron de travail le plus documenté : la boucle ouvrier-relecteur avec un lecteur au contexte propre, sans histoire partagée avec l'auteur. Cognition mesure 2 bugs par PR dont 58 % graves, et précise que la séparation de contexte est ce qui fait la qualité du relecteur (Orch. C11). Deuxième règle : les lectures parallélisent, les écritures restent mono-fil (Orch. C10, VERIFIED).

### Lecture de votre setup

Votre tableau de délégation (BMAD pour le cadrage, presence-stack pour l'implémentation) respecte la frontière tâches/rôles. Trois réserves.

Première réserve : vos workflows imposent des chaînes séquentielles d'agents nommés (Nora → Marc → Chloé → Lucas → Victor). Si chaque maillon résume son travail au suivant, vous tombez dans la perte de contexte à la relève, documentée comme la première cause d'échec des pipelines multi-agents (Orch. C4, C15). La parade documentée : les agents écrivent leurs artefacts sur le disque et se transmettent des références, pas des résumés.

Deuxième réserve : Victor cumule les casquettes d'implémentation et d'audit. Un relecteur qui partage l'historique de l'auteur perd la moitié de sa valeur (Orch. C11). Dédier la revue à un contexte vierge.

Troisième réserve : aucun mécanisme ne borne le fan-out. Les utilisateurs lourds fixent des plafonds explicites (Codex : 6 threads, profondeur 1) pour éviter la dérive en essaim (Orch. C14).

## 5. Axe B : hygiène des instructions et des skills

### Ce que dit la pratique

Le context rot est mesuré, pas folklorique. Chroma a testé 18 modèles : la fiabilité décroît quand la longueur du contexte augmente (Instr. S1). Une étude contrôlée d'Augment Code, la seule du genre, montre qu'un bon fichier `AGENTS.md` vaut un changement de modèle, et qu'un mauvais vaut pire que l'absence de fichier. Leurs meilleurs fichiers font 100 à 150 lignes avec quelques références ciblées ; au-delà, les gains s'inversent (Instr. S5).

Le mode d'échec dominant s'appelle l'over-exploration. Un fichier de topologie complète sur une tâche de deux lignes a fait lire 12 documents et 80 000 tokens inutiles au modèle, avec un taux de complétude en baisse de 25 %. Une pile de 30 interdits sans équivalents « faire » double la durée du PR et abaisse sa complétude de 20 % (Instr. S3, C4).

Trois constats vous concernent directement :

1. Les fichiers d'instructions se font tronquer silencieusement. Codex coupe à 32 Ko sans prévenir, Claude Code écarte les descriptions de skills au-delà d'un budget d'environ 15 000 caractères (Instr. S16, S8).
2. Le déclenchement automatique des skills échoue environ une fois sur deux dans deux rapports indépendants, pire quand le skill recouvre un comportement déjà appris du modèle, comme git (Instr. C10, VERIFIED). Le remède converge : descriptions distinctes, clauses « quand ne pas utiliser », invocation explicite, hooks pour ce qui a des effets de bord.
3. Les contradictions entre couches de règles se résolvent au hasard par le modèle, avec un coût caché de réconciliation à chaque requête (Instr. C13). Un commentaire non résolu dans `mattpocock/skills` pose encore la question des ADR contradictoires : le problème reste ouvert dans les meilleurs dépôts de skills.

Dernier point, la chaîne d'approvisionnement des skills. Une étude de mai 2026 a trouvé 76 payloads malveillants sur 3 984 skills de marketplaces, et 13,4 % de skills avec au moins un problème critique (Instr. S25). Les pools curés s'en sortent beaucoup mieux que les marketplaces ouvertes.

### Lecture de votre setup

Bonne nouvelle : votre `AGENTS.md` fait 86 lignes, dans la fourchette haute qualité d'Augment. Votre matrice d'activation de la règle 08 impose l'invocation explicite des skills par type de tâche. Vous contournez ainsi le déclenchement automatique, qui est le point faible numéro un des bibliothèques de skills.

Quatre écarts :

1. **Budget de descriptions à 70 %.** Avec 45 skills pour 10 426 caractères, cinq skills supplémentaires vous mettent dans la zone de troncature silencieuse. Les descriptions les plus lourdes (bmad-deep-recon : 725 caractères, ui-ux-pro-max : 573, responsive-adaptive-ui : 571) se compressent sans perte d'information utile.
2. **17 skills hors périmètre.** Les personas BMAD et `graphify` n'apparaissent ni dans la liste active ni dans la liste d'exclusion de `skills-scope.md`. Ils consomment du budget et peuvent s'activer hors de votre contrôle. Un périmètre qui ne liste pas tout n'est pas un périmètre.
3. **Trois skills de revue aux descriptions qui se recouvrent** (`code-review`, `bmad-code-review`, `bmad-review`). Le recouvrement des descriptions est la cause documentée des activations de mauvais skill (Instr. C11). Ils sont complémentaires dans leurs rôles, indifférenciables dans leur pitch.
4. **Règles en consultation manuelle.** Votre `AGENTS.md` demande de consulter systématiquement `.agents/rules/`. Claude Code n'injecte rien sous `.agents/` et rien ne garantit la lecture. La disclosure progressive marche quand la référence est ciblée : Augment mesure 90 % de lectures pour les références pointées depuis le fichier racine, moins de 10 % pour les documents orphelins (Instr. S17). Un index qui pointe vers la bonne règle au bon moment vaut mieux que dix règles à lire.

## 6. Axe C : mémoire et apprentissage

C'est le cœur de votre demande. La littérature est dense, contradictoire par endroits, et plutôt lucide.

### Ce que la pratique établit

**Un agent n'apprend pas dans ses poids.** Tout mécanisme de mémoire est une externalisation de contexte, pas un apprentissage. Plusieurs praticiens chevronnés tiennent le sujet pour un pansement (Mem. C6). À vous de construire la discipline autour, pas de croire qu'un outil va l'apprendre à votre place.

**Écrire une leçon ne change pas le comportement.** Le mode d'échec le plus documenté sur le tracker Claude Code : l'agent écrit la règle, l'acquitte, et reproduit la même erreur. Un cas célèbre montre une même règle enregistrée six fois, erreur répétée au moins huit fois sur une trentaine de sessions. Le commentaire du rapporteur dit l'essentiel : « l'acte d'écrire en mémoire semble se substituer au changement de comportement » (Mem. C7, VERIFIED).

**La mémoire est un conseil, les hooks sont l'exécution.** La documentation Anthropic le dit elle-même : les fichiers de mémoire sont du contexte, pas de la configuration appliquée. Pour bloquer une action quoi que décide le modèle, il faut un hook (Mem. C4). Toute règle de votre `AGENTS.md` que l'agent viole malgré sa présence mérite une escalade vers un oracle exécutable.

**La mémoire pourrit.** Entrées périmées, contradictoires, dupliquées ; rien ne la décompose naturellement. Les parades rapportées : horodatage systématique, seuil de péremption, linter de contradictions, purge régulée, arbitrage humain (Mem. C8). Plus inquiétant : une mémoire périmée l'emporte sur une instruction fraîche, dans deux rapports indépendants (Mem. C10).

**La formulation change l'adhérence.** Les règles datées et reliées à un incident, formulées en action (« quand X arrive, faire Z »), sont suivies nettement mieux que les notes factuelles non datées (Mem. C9, VERIFIED).

**Le simple bat le sophistiqué.** Des fichiers markdown interpellés au grep ou à un léger index d'embeddings surpassent les pipelines d'extraction LLM dans plusieurs évaluations compilées (Mem. C18). Les mémoires gérées automatiquement par le harnais sont la catégorie la plus désactivée par les utilisateurs expérimentés, à cause de la dégradation et des fausses informations accumulées (Mem. C3).

**Où stocker.** Le patron convergent est à trois couches : fichier d'équipe commité (consensus projet), fichier local ignoré par git (préférences personnelles), fichier utilisateur global hors dépôt. Un plugin Cursor qui a écrit des préférences personnelles dans l'`AGENTS.md` partagé documente la fuite à éviter (Mem. C12, C13).

**Ce qui transforme une correction en connaissance durable.** Les guides officiels Codex et Claude Code convergent : même erreur deux fois, on écrit une règle ; même commentaire de revue deux fois, on le codifie ; on demande une rétrospective et on met à jour le fichier d'instructions (Mem. C25). Un commentaire du tracker précise la mécanique : corriger et enregistrer doivent former un seul acte daté et signé, relu au début de la session suivante, sinon la correction meurt avec la session (Mem. C27).

**Sans mesure, pas d'apprentissage.** Anthropic pose le cadre : sans évals, une amélioration est invérifiable, et les évals saturées passent en suite de non-régression (Mem. C20). Des tests à seuil sur une exécution unique ne détectent rien quand l'agent est non déterministe (Mem. C21).

**Frontière de promotion.** Un RFC Codex propose l'échelle expérience → mémoire → règle d'équipe revue → skill, avec des opérations de cycle de vie ADD / NARROW / REPLACE / RETIRE sur des diffs revus (Mem. C28). L'accumulation sans revue est la façon dont une mémoire s'empoisonne elle-même.

### Lecture de votre setup

Votre `AGENTS.md` décrit exactement le mécanisme dont la littérature recommande l'implémentation, et ne l'implémente pas. Trois problèmes concrets dans le texte actuel :

1. `<appDataDir>/knowledge/` situe la mémoire hors dépôt. Invisible à la revue de code, non versionnée, non partagée entre machines, hors de toute gouvernance. C'est la moitié du compromis documenté (Mem. C14), la mauvaise moitié pour des règles d'équipe.
2. « Vérifier les résumés de KI injectés en contexte » suppose une injection qui n'existe nulle part. Les documents orphelins sont lus dans moins de 10 % des sessions (Instr. S17).
3. Aucun protocole de capture, aucun cycle de vie, aucune mesure de récurrence. Le piège « enregistrer remplace apprendre » est alors inévitable.

Côté forces, vous tenez déjà les trois pièces maîtresses : le tracker `.scratch/` pour les incidents, les ADR dans `docs/adr/` pour les décisions, le ledger `GATES.md` pour les preuves. Il manque la courroie qui les relie et fait circuler la leçon apprise vers la règle appliquée.

## 7. Axe D : vérification et confiance

### Ce que dit la pratique

Le consensus porte sur des gates déterministes en couches : pre-commit rapide et étroit en local, CI et policy de merge comme couche d'autorité, revue humaine réservée à l'intention et à la logique sensible (Verif. C1, VERIFIED). Le déplacement recommandé : faire porter la gate sur le comportement vérifié (diff de contrat, score de mutation, revue de dépendances, scan de secrets) plutôt que sur la lecture du diff. Les seuils de couverture de lignes sont discrédités pour du code généré ; les tests de mutation et les tests de propriétés sont les signaux recommandés, sans mesure d'efficacité disponible (Verif. C3).

Le patron des critères d'acceptation explicites existe publiquement sous le nom de spec-driven development (GitHub Spec Kit, Kiro, Tessl). Sa discipline clé : un critère qu'aucune commande ni aucun test ne peut vérifier n'est pas un critère, c'est une auto-évaluation (Verif. C6). Le format `GATES.md` avec `CHECK:`/`EXPECT:`/`EVIDENCE:` n'a pas d'équivalent public identifié : les analogues sont les critères d'acceptation de Spec Kit et les « Approved Scenarios » d'Ivett Ördög. Vous êtes sur un territoire non balisé, ce qui est une raison de plus pour le prouver par l'exécution.

Sur les tests, verdict nuancé. La seule évaluation du TDD dans la boucle d'agent ne trouve aucun bénéfice qualité, pour un coût de 3 à 8 fois plus de tokens (Verif. C9, SINGLE-SOURCE). En revanche, les tests tautologiques sont un mode d'échec établi : le test compare l'implémentation à elle-même, le rouge est simulé, les valeurs sont durcies pour passer (Verif. C10). Les parades discutées : séparer l'auteur de test de l'auteur d'implémentation, faire relire les tests plutôt que le code, contrôler la suite par mutation. Et le test-first reste recommandé pour les correctifs de bugs, contesté pour le greenfield (Verif. C12).

Côté mesures, trois chiffres à garder en tête. GitClear : duplication de blocs +81 %, copier-coller +41 %, masquage d'erreurs +47 %, refactoring -70 % depuis 2023 (Verif. C17). METR : la moitié des PR SWE-bench qui passent les tests seraient refusées par les mainteneurs réels (Verif. C19). Et la revue est le goulot : 61 % des PR écrites par des agents ne reçoivent aucune revue enregistrée (Verif. C21).

### Lecture de votre setup

Votre discipline `unlazy` est la pièce la plus solide du dispositif. Écrire les critères avant, exiger une preuve d'exécution, refuser de déclarer « done » sans evidence : c'est la « preuve plutôt que rapport de soi » du consensus (Verif. C6). `verify-gates.mjs` donne à cette discipline 50 oracles exécutables, ce que presque personne n'a.

Les écarts tiennent en trois lignes. Vous n'avez ni lint, ni formatage, ni pre-commit, ni framework de test, alors que c'est la première couche du consensus vérification. Votre CI est en mode advisory et ne bloque rien. Et votre ledger accumule 18 blocs avec 4 oracles rouges permanents : des gates qui échouent depuis longtemps finissent par ne plus signaler quoi que ce soit.

Un point mérite d'être tranché par vous. Le TDD poussé par le skill `tdd` se heurte aux résultats de Böckeler. La position défendable : test-first obligatoire sur les correctifs (le test doit rougir avant le fix), laissé à discrétion sur le greenfield, et revue humaine des tests produits par l'agent.

## 8. Plan d'actions

Classé par coût du retard pris.

### P1 — Faire fonctionner l'apprentissage (le sujet de votre demande)

1. Déplacer la mémoire dans le dépôt : `.agents/knowledge/` pour l'équipe (commité), `.agents/knowledge.local/` pour le personnel (gitignoré). Le format et le protocole sont en section 10.
2. Brancher la capture sur les déclencheurs documentés : même erreur deux fois, même commentaire de revue deux fois, correction utilisateur répétée. La correction et l'enregistrement forment un seul acte.
3. Définir l'échelle d'escalade : règle écrite → oracle dans `verify-gates.mjs` ou hook si elle est violée malgré tout.

### P2 — Compléter la chaîne de vérification

4. Installer lint et formatage (le skill `setup-pre-commit` est présent et ne demande qu'à servir), pre-commit rapide et étroit, CI bloquante sur build + lint + tests.
5. Poser un framework de test (vitest) et migrer progressivement les scripts `scripts/test-*.mjs` vers des tests exécutables en CI.
6. Purger `GATES.md` : archiver les ledgers soldés, traiter les 4 oracles rouges (corriger ou `ABANDON:` avec handoff), un oracle rouge sans propriétaire est un bruit.

### P3 — Assainir la bibliothèque de skills

7. Compléter `skills-scope.md` : tout skill installé est actif, inactif ou explicitement suspendu. Aucun flou.
8. Compresser les descriptions de skills et leur ajouter une clause « quand ne pas utiliser ». Objectif : revenir sous 8 000 caractères au total.
9. Différencier les trois skills de revue ou les consolider. Documenter pour chacun la frontière d'usage.
10. Auditer l'origine des skills tiers et consigner version et hash dans `skills-lock.json` pour tous, pas seulement pour `mattpocock/skills`. 13,4 % de skills de marketplace ont un problème critique (Instr. S25).

### P4 — Rendre la délégation explicite

11. Exiger dans les workflows `presence-stack` que les agents passés écrivent leurs artefacts sur disque et transmettent des chemins, pas des résumés.
12. Dédier la revue à un agent sans historique partage avec l'auteur, idéalement sur un autre modèle.
13. Borner le fan-out (plafond de sous-agents simultanés et de profondeur) et réserver la délégation aux tâches de lecture au-delà de 30 000 tokens de contexte à absorber.

## 9. Recommandations sur les skills

**Activer (déjà installés, dormants)**

| Skill | Pourquoi maintenant | Source |
|---|---|---|
| `setup-pre-commit` | la première couche de gates manque ; la renaissance des hooks est documentée comme réponse à l'IA | Verif. C13 |
| `tdd` | utile pour les correctifs (le test doit rougir avant le fix), avec revue humaine des tests contre les tests tautologiques | Verif. C10, C12 |
| `bmad-retrospective` | transforme les findings d'un epic en action items ; c'est le point d'entrée naturel du protocole de capture | Mem. C25 |
| `bmad-qa-generate-e2e-tests` | compléter la couche de tests manquante sur les parcours critiques | Verif. C1 |

**Ajouter**

| Manque | Forme proposée | Justification |
|---|---|---|
| Lint des fichiers d'instructions | petit check `scripts/lint-agents.mjs` ou linter dédié (agents-lint, AgentLint) : contradictions, références mortes, doublons, budget de tokens | Instr. C13, C15 |
| Capture d'apprentissage | skill `learn` (ou extension d'unlazy) : protocole de la section 10 | Mem. C27, C28 |
| Audit de chaîne d'approvisionnement des skills | scan de sécurité à l'installation d'un skill tiers | Instr. C25 |
| Contrôle qualité des tests | test de mutation (stryker-js) sur les modules critiques, en complément de la couverture | Verif. C3 |

**Retirer ou suspendre**

- Les skills qui ne servent pas depuis l'installation et pèsent sur le budget de descriptions. Leur donner un statut explicite dans `skills-scope.md`, suspendu plutôt que fantôme.
- `graphify` : la traversée de graphe de connaissance est documentée comme lente (problème N+1) et peu fiable pour le rappel comparée à un saut sémantique sur pages plates (Mem. C19). À valider sur usage réel avant de le garder actif.

**Réécrire**

- Les descriptions des trois skills de revue, avec frontières d'usage croisées.
- Les descriptions des skills de plus de 400 caractères, en gardant le déclencheur et la contre-indication.

## 10. Conception de la boucle d'apprentissage

Objectif : qu'une erreur coûteuse ne se reproduise pas, et qu'on puisse le prouver.

### 10.1 Principes

1. Un agent n'apprend pas dans ses poids. La boucle externalise la connaissance dans des fichiers revus.
2. Écrire ne suffit pas. Toute règle doit pouvoir être escaladée en contrôle exécutable.
3. La mémoire pourrit sans cycle de vie. Chaque entrée porte une date, un statut et une échéance de re-vérification.
4. Ce qui n'est pas mesuré n'est pas de l'apprentissage.

### 10.2 Stockage à trois couches

```
.agents/
├── knowledge/            # couche équipe, commitée, revue en pull request
│   ├── INDEX.md          # ≤ 200 lignes, chargé en tête de session
│   └── KI-0001-<slug>.md
├── knowledge.local/      # couche personnelle, gitignorée
└── rules/                # règles stables, déjà en place
```

Le choix du dépôt remplace `<appDataDir>/knowledge/` : versionnement, revue, partage entre machines et visibilité dans les diffs. La couche locale évite la fuite documentée des préférences personnelles dans les fichiers d'équipe (Mem. C13).

### 10.3 Format d'une entrée KI

```markdown
---
id: KI-0007
date: 2026-09-29
auteur: Fabien | agent
statut: candidate | active | superseded | retired
domaine: sync | dexie | ui | navigation | process
triggers: ["useLiveQuery", "outbox"]
source: lien PR, issue .scratch/ ou GATES
revalider-avant: 2026-11-28
---

## Situation
L'agent ajoutait useLiveQuery sans dépendances explicites, provoquant des re-renders en boucle.

## Règle
Quand un composable expose useLiveQuery, déclarer ses dépendances dans le second argument.

## Vérification
node scripts/verify-gates.mjs --livequery-deps
```

Formulation en action datée et reliée à un incident, conforme à ce qui est suivi (Mem. C9). Le champ `Vérification` est obligatoire : s'il n'existe pas encore, la règle reste `candidate` jusqu'à ce qu'un oracle ou une commande la contrôle.

### 10.4 Protocole de capture

Déclencheurs officiels, alignés sur les guides Codex et Claude Code (Mem. C25) :

- l'agent reproduit la même erreur une deuxième fois ;
- un commentaire de revue revient une deuxième fois ;
- l'utilisateur répète la même correction ;
- un bug sorti de `.scratch/` ou d'un ledger `GATES` a coûté plus d'une heure.

Acte unique (Mem. C27) : le moment où la correction atterrit, l'agent écrit l'entrée datée et signée. Pas en fin de session. La session suivante lit `INDEX.md` avant toute conception.

Interdiction faite aux sous-agents d'écrire dans `knowledge/` ou `rules/`. Ils déposent leurs constats dans leurs artefacts ; l'agent principal porte la candidature. C'est la parade au scénario où un plugin de mémoire a souillé l'`AGENTS.md` partagé (Mem. C13).

### 10.5 Échelle d'escalade

Une règle qui reste violée n'a pas sa place dans la mémoire. Elle monte :

| Niveau | Support | Exemple |
|---|---|---|
| 1 | Entrée KI (conseil) | « ne pas oublier les dépendances de useLiveQuery » |
| 2 | Règle `.agents/rules/` (contexte permanent) | règle 03, intégrée au bloc Dexie |
| 3 | Oracle ou hook (application) | `verify-gates.mjs --livequery-deps`, hook pre-commit |

« La mémoire est un conseil, les hooks sont l'exécution » (Mem. C4). Le passage au niveau 3 se décide quand une entrée de niveau 1 est violée une fois de plus.

### 10.6 Métabolisme

Opérations de cycle de vie sur les entrées : ADD, NARROW (restreindre le domaine), REPLACE (remplacer une version), RETIRE (passer en `retired` avec la raison). Chaque opération passe en revue, en diff. On ne réécrit pas l'historique, on le survit (Mem. C28).

Horodatage systématique et seuil : une entrée qui n'a pas été revérifiée dans les 60 jours passe en `à vérifier`, et `INDEX.md` le marque. Rituel bimensuel de purge, à faire faire par `bmad-retrospective` ou un script : contradictions, doublons, entrées périmées, règles dérivables du code à supprimer (Mem. C8, C30).

### 10.7 Frontière de promotion

```
expérience → KI candidate → revue humaine → KI active → règle → skill
```

Une procédure réutilisable par tâche mérite un skill. Une règle d'équipe stable mérite `.agents/rules/`. Tout le reste reste dans la mémoire. Aucun palier ne se franchit sans revue : c'est la différence entre un journal utile et un magasin empoisonné.

### 10.8 Mesure

Ce qui rend la boucle honnête :

- **Taux de récurrence** : même signature d'erreur dans `.scratch/`, `GATES.md` ou les KI. Doit tendre vers zéro par règle active.
- **Inventaire vivant** : nombre d'entrées actives, périmées, escaladées en gates. Une mémoire qui ne fait que grossir se dégrade.
- **Replay** : rejouer périodiquement les scénarios de bug passés comme suite de non-régression, sur le principe des regression evals (Mem. C20).
- **Preuve par les oracles** : `verify-gates.mjs` reste votre suite de non-régression comportementale. Toute règle de niveau 3 y gagne un flag.

### 10.9 Application aux sous-agents

Les sous-agents appliquent la boucle en lecture seule, avec trois particularités :

1. Le brief de délégation est auto-portant (contexte, tâche, format de sortie, critère d'arrêt), sans reposer sur l'historique partagé (Orch. C12).
2. L'artefact sort sur disque ; la relève passe par un chemin de fichier (Orch. C15).
3. L'agent de revue part d'un contexte vierge, sans accès aux intentions de l'auteur, et peut être routé vers un autre modèle pour couper les angles morts partagés (Orch. C11, C16).

## 11. Limites de cet audit

- Une seule étude contrôlée existe sur le contenu des fichiers d'instructions (Augment Code). Ses pourcentages n'ont pas été répliqués par un tiers.
- Aucune étude publique ne mesure la boucle CHECK/EXPECT/EVIDENCE que vous employez. Ses analogues sont documentés, ses résultats le sont que par votre expérience.
- Les preuves sur les hooks pre-commit sont qualitatives ; aucune mesure avant/après n'existe.
- Reddit est inaccessible aux robots : les claims issus de cette plateforme reposent sur des extraits de recherche.
- Le chiffre de 13,4 % de skills critiques et celui de 26 % à risque quelconque proviennent de jeux de données différents ; les deux pointent dans la même direction sans se réconcilier.

## 12. Sources principales

Les quatre tables de sources complètes (environ 140 références) figurent dans `docs/audits/recon/`.

| Source | Éditeur | Date | Apport |
|---|---|---|---|
| How we built our multi-agent research system | Anthropic Engineering | 06/2025 | coût token 4x/15x, patron orchestrateur-ouvrier |
| Don't Build Multi-Agents / Multi-Agents: What's Actually Working | Cognition | 06/2025, 04/2026 | écritures mono-fil, relecteur au contexte propre |
| How and when to use subagents in Claude Code | Anthropic | 04/2026 | quand déléguer, quand s'en abstenir |
| Context Rot | Chroma Research | 07/2025 | dégradation mesurée selon la longueur |
| A good AGENTS.md is a model upgrade | Augment Code | 04/2026 | seule étude contrôlée, optimum 100-150 lignes |
| Claude Code skills not triggering? | Jesse Vincent | 12/2025 | budget de descriptions, troncature silencieuse |
| Custom skills are not reliably auto-triggered | GitHub anthropics/claude-code#30387 | 03/2026 | ~50 % d'échec du déclenchement automatique |
| How Claude remembers your project | Anthropic | 2026 | mémoire = contexte, hooks = application |
| Agent writes lessons but fails to apply them | GitHub anthropics/claude-code#36296 | 03/2026 | enregistrer remplace apprendre |
| RFC Instruction Distillation and Rule Metabolism | GitHub openai/codex#40575 | 2026 | frontière de promotion, ADD/NARROW/REPLACE/RETIRE |
| Demystifying evals for AI agents | Anthropic Engineering | 01/2026 | sans évals, pas d'amélioration vérifiable |
| Exploring the Emerging Threats of the Agent Skill Ecosystem | arXiv 2605.28588 | 05/2026 | 13,4 % de skills critiques, 76 malveillants |
| TDD inside the agent loop | Böckeler, martinfowler.com | 2026 | aucun bénéfice mesuré, tests tautologiques |
| The Maintainability Gap | GitClear | 06/2026 | duplication +81 %, refactoring -70 % |
| Many SWE-bench-Passing PRs Would Not Be Merged | METR | 03/2026 | la moitié des PR verts refusées par mainteneurs |
| These Aren't the Reviews You're Looking For | arXiv 2605.02273 | 05/2026 | 61 % de PR d'agents sans revue |
| 2025 Stack Overflow Developer Survey | Stack Overflow | 07/2025 | 31 % utilisent des agents, 87 % s'inquiètent de l'exactitude |
| Why Do Multi-Agent LLM Systems Fail? (MAST) | arXiv 2503.13657 | 2025 | répartition des modes d'échec |
