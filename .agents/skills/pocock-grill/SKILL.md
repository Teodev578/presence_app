---
name: pocock-grill
description: Protocole d'interview de Matt Pocock pour éprouver et affiner un plan ou une conception technique.
disable-model-invocation: true
---

# Protocole d'Interview (Matt Pocock)

Ce skill exécute le protocole d'interview rigoureux de Matt Pocock afin d'éprouver et d'aligner les choix d'architecture ou de conception avant toute implémentation.

## Méthodologie

Interrogez l'utilisateur méthodiquement jusqu'à obtenir une compréhension partagée. Modélisez la démarche sous la forme d'un **arbre de décision** (chaque décision se ramifiant en sous-décisions dépendantes).

Traitez l'arbre par **rounds**. La **frontière** représente l'ensemble des décisions dont les prérequis sont déjà tranchés : les questions qu'il est possible de poser _maintenant_ sans présumer de réponses non encore formulées.

Posez l'intégralité de la frontière en un seul round : numérotez chaque question et indiquez systématiquement votre réponse recommandée. Attendez ensuite les réponses de l'utilisateur avant le round suivant.

### Formatage d'un round :

```markdown
❓ **Q1** - **<titre de la question>**: <corps de la question, options éventuelles>

➡️ <votre réponse recommandée avec justification>

---

❓ **Q2** - **<titre de la question>**: <corps de la question, options éventuelles>

➡️ <votre réponse recommandée avec justification>
```

Chaque round répondu par l'utilisateur restructure l'arbre : les décisions arrêtées repoussent la frontière et débloquent les questions dépendantes. Recalculez la frontière et initiez le round suivant. Une question tributaire d'une autre question encore ouverte dans ce round relève d'un round ultérieur.

### Règles opérationnelles :

1. **Recherche de faits** : Trouver les faits relève de la responsabilité de l'agent, jamais de l'utilisateur. Si une question de la frontière requiert des faits issus de l'environnement (fichiers, git, configurations, outils), inspectez-les directement sans interroger l'utilisateur.
2. **Décisions** : Les arbitrages appartiennent à l'utilisateur : soumettez chaque question avec votre recommandation explicite et attendez sa validation.
3. **Clôture** : La session prend fin lorsque la frontière est vide (toutes les branches de l'arbre ont été explorées et aucun point n'est laissé sous silence). N'engagez aucune implémentation tant que la validation partagée n'est pas confirmée.
