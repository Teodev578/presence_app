---
name: code-hygiene
description: "Exécute un audit de propreté sur le code : suppression du code mort, vérification des types et validation du formatage."
---

# Protocole d'Hygiène de Code

Cette procédure formalise l'assainissement systématique du code source. Elle s'applique avant la validation définitive d'un lot technique ou lors d'un audit ciblé.

## Procédure pas à pas

### Étape 1 : Inspection du périmètre

1. Identifier explicitement la liste des fichiers ciblés (fichiers modifiés dans la branche ou sous-module concerné).
2. Lire l'intégralité du contenu des fichiers cibles pour cartographier les symboles exportés, les imports déclarés et l'état réactif local.
3. Repérer les configurations de linter, de formatage et de build applicables dans l'environnement.

### Étape 2 : Détection des anomalies

Passer en revue les sources selon les axes suivants :
- **Imports et variables orphelines** : Dépendances importées inutilisées, variables locales non référencées, fonctions devenues inaccessibles.
- **Traces de débogage et code commenté** : Blocs d'instructions commentées sans justification documentaire, instructions `console.log`, `debugger` ou clauses temporaires.
- **Cohérence des signatures et des types** : Types implicites ambigus, discordance entre les props Vue / événements émis et leur usage réel, non-respect des contrats de modèles de données (Dexie / Supabase).
- **Formatage et conventions stylistiques** : Indentation irrégulière, structures conditionnelles redondantes, nommage non canonique.

### Étape 3 : Correction isolée et chirurgicale

1. Corriger chaque catégorie d'anomalie de façon granulaire sans altérer la logique métier existante.
2. Éliminer le code mort sans introduire d'abstraction compensatoire.
3. Exécuter la commande de build locale (`npm run build`) pour s'assurer qu'aucune régression de compilation ou de résolution de module n'a été introduite.

### Étape 4 : Rapport synthétique

Fournir à l'utilisateur un compte-rendu sobre et direct articulé autour de trois points :
- Périmètre audité (fichiers et modules examinés).
- Anomalies résolues (détail précis des suppressions de code mort, ajustements de signatures et nettoyage).
- Statut de vérification (résultat du build et confirmation d'absence de régression).
