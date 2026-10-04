# Règle Permanente : Planification Préalable des Tâches Fastidieuses

Ce document impose la rédaction d'un plan écrit avant toute tâche fastidieuse, c'est-à-dire longue, répétitive ou mécanique sans être architecturale. Il complète le garde-fou n°3 de `AGENTS.md`, qui ne couvre que les modifications architecturales, la création de fichier structurant et le refactoring transverse.

---

## 1. Ce qu'est une tâche fastidieuse

Une tâche est fastidieuse dès qu'elle remplit l'un de ces critères :

- Elle touche plus de trois fichiers, ou applique le même motif à plus de cinq endroits.
- Elle enchaîne plus de cinq étapes distinctes qui dépendent l'une de l'autre.
- Elle consiste en une passe mécanique (renommage, remplacement, harmonisation) sans enjeu de conception.
- Son énoncé contient une liste, un tableau ou une suite de points numérotés.
- Un échec partiel y est difficile à repérer sans relecture ordonnée.

Un correctif d'une ligne, une retouche de texte isolée ou une question n'entrent pas dans ce cadre.

## 2. Obligation de plan écrit

Avant la première modification, l'agent consigne son plan dans `.agents/plan.md`. Le fichier sert de mémoire de travail : il porte la tâche en cours, pas l'historique des tâches closes.

Le plan contient au minimum :

- Le titre de la tâche et la date.
- Le périmètre : fichiers lus, fichiers écrits, et ce qui reste explicitement hors périmètre.
- Les étapes ordonnées et numérotées, chacune formulée comme une action vérifiable.
- Le critère d'arrêt : à quoi on reconnaît que la tâche est finie.
- Pour chaque étape, la vérification associée (commande, oracle, relecture ciblée).

## 3. Tenue du plan pendant l'exécution

- Chaque étape porte son état : à faire, en cours, fait ou bloqué.
- Toute étape découverte en cours de route est écrite dans le plan avant d'être exécutée.
- Une étape bloquée reste visible avec la raison du blocage ; elle ne disparaît pas du plan.
- Le plan est relu avant chaque annonce d'achèvement.

## 4. Clôture

- Toutes les étapes sont cochées et leur vérification est notée.
- Le critère d'arrêt est confronté au résultat réel.
- Le plan est purgé une fois la tâche close, sauf si l'utilisateur demande à le conserver.

## 5. Articulation avec `GATES.md`

Le plan et le grand livre ne se remplacent pas. Le plan ordonne le travail et suit son avancement ; les clauses `CHECK:`, `EXPECT:` et `EVIDENCE:` de `GATES.md` apportent la preuve déterministe de complétion. Une tâche fastidieuse qui touche du code substantiel ou plusieurs fichiers réclame les deux.

La tenue du plan n'est pas couverte par un oracle : `node scripts/verify-gates.mjs --all` vérifie le code, pas le suivi du plan. Le contrôle reste la relecture du plan avant l'annonce d'achèvement.

---

## 6. Protocole léger — Complexité « Moyen » (Brouillon de Réflexion)

Les tâches de complexité « Moyen » n'atteignent pas le seuil de `unlazy` (GATES.md + plan.md), mais elles sont trop exposées pour démarrer sans réflexion. Elles passent par un **pre-flight de 10 minutes** consigné dans [`.agents/WRITING_IMPROVEMENT.md`](../WRITING_IMPROVEMENT.md) sous "Tâches actives".

Ce fichier sert de **brouillon de réflexion persistant** : comme un élève qui pose ses calculs et analyse ses impasses sur une feuille de brouillon avant d'écrire sur sa copie, l'agent matérialise son raisonnement dialectique par écrit avant d'ouvrir ou d'éditer le moindre fichier source.

### Règles d'usage du brouillon

- **(Recommandé) Consigner systématiquement l'alternative rejetée et sa justification avant d'agir** : Cœur de la discipline du brouillon. L'agent doit expliciter pourquoi une solution évidente ou tentante n'a pas été retenue, neutralisant les régressions et les fausses bonnes idées.
- **(Recommandé) Clôturer à chaud avec leçon tirée et signalement KI immédiat** : Dès l'implémentation terminée, l'agent consigne le résultat observable et la leçon apprise. Si un critère de mémoire KI est activé, la fiche est créée dans `.agents/knowledge/` sans différer.
- **(Déconseillé) Créer une entrée pour les corrections triviales ou unilignes** : Les retouches isolées, corrections de coquilles ou ajustements cosmétiques ne doivent pas encombrer le journal afin de préserver sa valeur stratégique.

### Critères d'application

Une tâche est de complexité « Moyen » si elle remplit au moins une de ces conditions **sans** atteindre les seuils de `unlazy` :
- 2 fichiers modifiés (≥ 3 = `unlazy`)
- 1 composable ou type partagé touché (mais pas d'API publique modifiée, sinon → `unlazy`)
- Dépendance à une autre story en cours
- Estimation entre 30 min et 2 h

### Les cinq questions du pre-flight

Répondre en prose, de façon concise — pas de tableau, pas de liste à puces systématique.

1. **Quel est le problème réel ?** (reformuler l'objectif en une phrase, pas paraphraser l'intitulé)
2. **Quelle est la contrainte la plus probable ?** (technique, temporelle, dépendance)
3. **Quelle alternative ai-je envisagée et pourquoi je ne la prends pas ?** (au moins une, rejetée explicitement)
4. **Quel est le signal qui me dira que c'est terminé ?** (observable, pas "le code marche")
5. **Y a-t-il un déclencheur KI ?** (même motif vu deux fois → fiche à écrire au moment de la correction)

### Format dans WRITING_IMPROVEMENT.md

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
```

### Ce que ce protocole ne remplace pas

Il ne produit ni `GATES.md`, ni `plan.md`, ni oracle exécutable. Si en cours d'exécution la tâche révèle un troisième fichier à modifier ou une dépendance non anticipée, elle bascule immédiatement en complexité « Élevée » et déclenche `unlazy`.

