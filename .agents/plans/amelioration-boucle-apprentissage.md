# Plan : Rendre la boucle d'apprentissage KI moins dépendante de la discipline

Date : 2026-10-05
Statut : proposé, en attente de validation
Complexité : Moyen (plusieurs fichiers, aucun changement de dépendance ni de version)

## 1. Problème

La boucle KI repose sur la discipline de l'agent en session et sur des revues humaines. Quatre faiblesses, constatées le 2026-10-05 :

| # | Faiblesse | Conséquence |
|---|---|---|
| F1 | La capture ne se déclenche que sur quatre événements explicites | Les erreurs répétées sans que personne ne les remarque ne sont jamais fichées |
| F2 | Le rituel bimensuel n'a aucun déclencheur | La base pourrit en silence |
| F3 | Aucun hook ni `npm script` n'exécute `knowledge-check.mjs` | L'oracle existe mais personne ne l'appelle (`.git/hooks` sans hook actif, pas de script dans `package.json`) |
| F4 | Le compteur de récurrence de `INDEX.md` est tenu à la main | Le taux de récurrence, métrique centrale du README, n'est pas mesuré |

Contrainte principale : les sous-agents n'écrivent pas dans `.agents/knowledge/` ni `.agents/rules/`. Toute automatisation reste donc une **détection ou un rappel**. La fiche reste écrite par l'agent principal et relue par un humain.

## 2. Alternatives examinées

| Option | Avis | Motif |
|---|---|---|
| A. Hook qui rédige et commit des fiches automatiquement | Déconseillée | Contredit le principe « aucun palier sans revue » et pollue l'équipe avec des fiches non validées |
| B. Oracles exécutables + rappels planifiés + détection de récurrence qui propose sans écrire | **Recommandée** | Respecte la revue humaine, réduit la dépendance à la mémoire de l'agent |
| C. Ne rien changer, compter sur `/learn` à la demande | Déconseillée | Reproduit exactement F1 à F4 |
| D. Installer Husky + lint-staged pour porter le contrôle | Déconseillée pour l'instant | Ajoute des dépendances (accord utilisateur requis) alors qu'un hook git natif suffit |

## 3. Périmètre

Fichiers touchés : `package.json` (scripts uniquement, **aucune dépendance**), `scripts/knowledge-check.mjs`, `scripts/verify-gates.mjs`, `.githooks/pre-commit` (nouveau), `.agents/knowledge/INDEX.md`, `.agents/knowledge/README.md`, `GATES.md`.

Hors périmètre : versions de paquets, contenu des fiches KI-0001 et KI-0002, règles `.agents/rules/` existantes.

## 4. Lots

### Lot 1 : Rendre l'oracle appelable (F3)
1. Ajouter dans `package.json` les scripts `knowledge:check` (`node scripts/knowledge-check.mjs --all`) et `knowledge:staleness`. Modification de la section `scripts` seulement.
2. Créer `.githooks/pre-commit` qui lance `knowledge-check.mjs --all` uniquement si le commit touche `.agents/knowledge/` ou `.agents/rules/`. Activation par `git config core.hooksPath .githooks`, documentée dans le README (action manuelle de Fabien, la config git locale n'est pas versionnée).
3. Le hook bloque sur échec structurel et avertit seulement sur péremption (`a-verifier`), pour ne pas bloquer un commit sans rapport.

### Lot 2 : Détection de récurrence assistée (F1, F4)
1. Ajouter à `knowledge-check.mjs` un mode `--recurrence` : il scanne `GATES.md`, `.scratch/` et `.agents/WRITING_IMPROVEMENT.md`, regroupe les signatures d'erreur identiques (même message ou même identifiant de porte en échec) et liste celles qui apparaissent au moins deux fois sans fiche correspondante.
2. Sortie : une liste de **candidates à fiche**, jamais d'écriture. L'agent principal rédige la fiche, Fabien la valide.
3. Le même mode lit le compteur de `INDEX.md` et signale toute fiche avec deux récurrences non escaladée (niveau 2 ou 3 attendu).
4. Limite assumée : la détection par signature textuelle manquera les erreurs sémantiquement identiques mais formulées autrement. Elle réduit F1, elle ne l'élimine pas.

### Lot 3 : Déclencheur du rituel bimensuel (F2)
1. Planifier via `/schedule` une passe toutes les deux semaines : `knowledge:check`, `--staleness`, `--recurrence`, puis rapport dans `.agents/WRITING_IMPROVEMENT.md`. Recommandé en cron non-daemon à court terme ; en daemon seulement si vous voulez qu'il survive à la fin de chaque tâche.
2. Ajouter au README une section « Rituel planifié » précisant qui lit le rapport et dans quel délai (proposition : sous 7 jours).
3. Ajouter un garde-fou : si le dernier rapport date de plus de 21 jours, `knowledge-check.mjs --all` émet un avertissement.

### Lot 4 : Capture à bas coût en fin de session (F1)
1. Ajouter au README une étape de clôture : avant de déclarer une tâche de complexité ≥ Moyen terminée, l'agent relit `INDEX.md` et déclare soit « aucun déclencheur », soit la fiche candidate créée.
2. Cette déclaration s'inscrit comme `EVIDENCE:` dans `GATES.md`, ce qui la rend vérifiable par `verify-gates.mjs`.
3. Pour une correction ponctuelle, `/learn` reste le chemin court pour fiche immédiate, sans attendre le deuxième incident.

## 5. Portes d'acceptation (à reporter dans `GATES.md`)

```
G-A  CHECK: npm run knowledge:check          EXPECT: exit 0, toutes portes G77 à G82 passent
G-B  CHECK: node scripts/knowledge-check.mjs --recurrence
     EXPECT: exit 0 sur le dépôt actuel, et exit 1 sur un jeu de test avec deux signatures identiques sans fiche
G-C  CHECK: git config core.hooksPath ; test -x .githooks/pre-commit
     EXPECT: ".githooks" ; hook exécutable
G-D  CHECK: commit de test modifiant une fiche avec frontmatter invalide
     EXPECT: le hook refuse le commit
G-E  CHECK: grep -c "Rituel planifié" .agents/knowledge/README.md
     EXPECT: ≥ 1
G-F  CHECK: npm run build                    EXPECT: exit 0
```

## 6. Ordre et estimation

Lot 1 (30 min), Lot 2 (1 h 30, le plus incertain), Lot 4 (20 min), Lot 3 (15 min, après validation de la sortie du lot 2). Total estimé : environ 2 h 30. Un dépassement de plus de 50 % se signale dans la fiche issue (règle de remontée BMAD).

## 7. Risques

- **Faux positifs de récurrence** : le mode `--recurrence` peut proposer des candidates bruyantes. Mitigation : seuil de deux occurrences minimum et revue humaine systématique.
- **Hook contourné** : `git commit --no-verify` ou `core.hooksPath` non configuré sur une autre machine. Mitigation : le contrôle de péremption du lot 3 sert de filet.
- **Dérive du compteur** : le compteur de `INDEX.md` reste saisi à la main tant que le lot 2 n'a pas fait ses preuves. À réévaluer après un mois.

## 8. Décisions attendues de Fabien

1. Accord sur le périmètre, en particulier l'ajout de scripts dans `package.json` (aucune version ni dépendance touchée).
2. Activation de `core.hooksPath` sur votre machine (commande à lancer vous-même).
3. Cadence du rituel : toutes les deux semaines (proposition), cron non-daemon.
