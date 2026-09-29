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
