# Journal d'Arbitrages — PresenceApp

Ce fichier enregistre le raisonnement derrière les décisions non triviales : hypothèses, alternatives refusées, trade-offs acceptés, leçons tirées. Il ne remplace pas `AGENTS.md` (invariants figés) ni les fiches `.agents/knowledge/` (leçons généralisées). Il documente ce qui est *en cours de décider*.

**Règle d'escalade** : une décision qui revient à l'identique dans deux tâches distinctes monte dans une règle `.agents/rules/`. Une leçon tirée qui répond aux déclencheurs KI (`11-apprentissage-et-memoire.md`) alimente une fiche `.agents/knowledge/` au moment de la correction, pas le lendemain.

**Portée** : tâches de complexité « Moyen » ou « Élevée » uniquement. Les tâches simples (correctif ponctuel, retouche isolée) ne génèrent pas d'entrée.

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

*(Aucune entrée pour l'instant — commencer par la prochaine story de complexité ≥ Moyen)*

---

## Archives

*(Les tâches fermées migrent ici. Elles restent visibles pour la traçabilité ; aucune rotation temporelle.)*
