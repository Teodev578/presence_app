# Directive : Ton et Formulation des Textes d'Interface

Ce document fixe les règles de rédaction des textes visibles par la personne qui utilise l'application. Il couvre les libellés, les boutons, les messages d'état, les erreurs et les infobulles rendus dans `src/`. Il prime sur l'espace employé, où la personne consulte l'écran debout, sur le terrain, souvent d'une seule main.

Le protocole général de rédaction reste celui de `01-engineering-standards.md`. Cette directive le prolonge pour les chaînes destinées à l'écran.

---

## 1. Principe directeur : parler à une personne, pas à un dossier

Chaque texte d'interface décrit ce que la personne observe ou ce qu'elle peut faire.

- Adresse la personne directement. Écris « votre journée », jamais « la journée de l'utilisateur ».
- Nomme le fait observé. « Départ non enregistré » décrit un état ; « Anomalie détectée » porte un jugement.
- Expose la conséquence avant l'attente. La personne comprend ce qui s'est passé avant de lire ce qu'on lui demande.
- Supprime l'injonction culpabilisante. Un écran de pointage n'est pas un formulaire disciplinaire.
- Préfère le mot courant au terme de gestion.
- Respecte la temporalité. Une journée révolue est close : présente-la comme un fait constaté, jamais comme une tâche ouverte. Un compteur décrit, il ne réclame rien.

## 2. Lexique proscrit

Ces termes appartiennent au vocabulaire de l'audit, du contrôle de gestion ou de la conformité. Aucun ne doit apparaître dans les textes visibles de l'espace employé.

| Terme proscrit | Formulation retenue |
|---|---|
| Anomalie, anomalies | Départ manquant |
| À corriger, à compléter | Fait constaté : « 1 manquant », « 2 manquants » |
| Non conforme, non-conformité | Fait constaté, nommé simplement |
| Veuillez… | Impératif direct : « Sélectionnez votre lieu de travail » |
| Utilisateur | Vous, votre |
| Sanction, discipline | (aucun équivalent : hors sujet dans l'interface) |
| KPI, optimiser | Le fait mesuré, nommé simplement |
| Conformité | (aucun équivalent : hors sujet dans l'interface) |

Un terme proscrit ne devient pas acceptable parce qu'il figure dans une infobulle, un `aria-label` ou un `title`. Ces surfaces s'adressent à la même personne.

## 3. Étiquette des libellés d'état

Les libellés d'état décrivent une situation, pas un verdict.

- Le libellé nomme la catégorie, la valeur énonce le fait : « Départs » puis « 1 manquant ».
- L'état sain s'annonce sans réserve : « Tous enregistrés ». Une case vide ne porte pas le mot « Aucun » seul, qui se lit comme un manquement.
- Le singulier et le pluriel s'écrivent en clair, sans suffixe entre parenthèses.
- Une teinte d'alerte reste justifiée quand le fait fausse un autre chiffre affiché à côté. Elle signale l'écart, pas une obligation.

## 4. Application et vérification

Le contrôle `node scripts/verify-gates.mjs --voice-conformance` balaie les fichiers de `src/views/employee/` et `src/components/employee/` et échoue sur tout terme du lexique proscrit. Toute modification de ce lexique s'accompagne de la mise à jour de `BANNED_VOICE_TERMS` dans `scripts/verify-gates.mjs`, sans quoi la règle et le garde-fou divergent.

Une reformulation de libellé n'est pas une modification purement cosmétique : mets à jour les oracles qui asservissent le texte concerné (`scripts/verify-browser.mjs`).
