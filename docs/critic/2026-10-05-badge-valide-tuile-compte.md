# Verdict Critic — Badge « Validé » dans la tuile Compte

**Date** : 2026-10-05  
**Projet** : PresenceApp  
**Idée examinée** : Ajouter un badge d'état mentionnant « Validé » au sein de la tuile « Compte » sur l'écran des Paramètres (`SettingsView.vue`) pour signaler formellement le statut approuvé du compte utilisateur.

---

## 1. Plaidoirie (L'Avocat)

La proposition s'appuie sur la cohérence de grille de la page des réglages : les tuiles voisines (« Synchronisation », « Autorisations ») arborent déjà des jetons d'état dans leur coin supérieur (« À jour », « Autorisé »). Placer un badge dans la tuile « Compte » crée un équilibre visuel immédiat. Pour un collaborateur ayant connu la phase bloquante d'attente à l'inscription, ce badge offre un feedback positif pérenne de sa pleine légitimité opérationnelle.

- **L'argument le plus solide** : L'homogénéité du rythme visuel avec les autres cartes de l'écran.
- **Ce qui ne peut être prouvé** : L'existence d'un besoin réel de réassurance chez l'utilisateur une fois l'onboarding passé.

---

## 2. Réquisitoire (Le Procureur)

L'idée constitue une redondance cognitive pure (tautologie d'interface). Le routage de l'application (`App.vue`) interdit strictement l'accès à l'espace applicatif et aux paramètres aux comptes non validés (`PendingApprovalView`). Par conséquent, 100 % des personnes voyant cet écran sont *de facto* validées. Le badge ne porterait jamais aucun autre état que « Validé » : c'est un composant sans variance, sans information décisionnelle et sans action possible. Pire, il injecte un vocabulaire bureaucratique (« Validé ») prohibé par la règle de sobriété 09.

- **Ce qui est fatal** : L'invariance absolue de la donnée sur cet écran, transformant le badge en bruit visuel stérile.
- **Ce qui est corrigeable** : Remplacer l'idée d'un statut par une information métier utile (ex. l'équipe ou le site d'affectation).

---

## 3. Comptes (Le Comptable)

- **Payeur & Valeur** : 0 € de valeur perçue ou d'impact business. Aucun utilisateur ne valorise la confirmation d'une évidence d'accès.
- **Coûts** : Coût d'implémentation marginal (15 minutes), mais coût différé en dette visuelle permanente et maintenance de tests.
- **Scénario prudent** : Indifférence totale des utilisateurs.
- **Scénario défavorable** : Surcharge cognitive et confusion (« Pourquoi mon compte doit-il afficher qu'il est validé ? Pourrait-il cesser de l'être ? »).
- **Seuil de rentabilité** : Inexistant.
- **Délai au premier euro** : Aucun.
- **Chiffre manquant** : Volume d'utilisateurs consultant la page des paramètres spécifiquement pour vérifier leur statut de validation (estimé à 0 %).

---

## 4. Verdict (Le Juge)

### Verdict : ABANDONNER

**Raisonnement** :  
Un élément d'interface qui ne change jamais d'état et ne permet aucune action est un bruit visuel, pas une fonctionnalité. Dans la mesure où l'architecture de routage rend cet écran strictement inaccessible aux comptes non confirmés, afficher « Validé » s'apparente à écrire « Moteur allumé » sur le tableau de bord d'une voiture en train de rouler. La tuile « Compte » doit se concentrer sur l'identité de la personne et la gestion de ses accès (mot de passe), sans encombrer l'espace d'étiquettes de conformité superflues.

**Le plus gros risque** :  
Dériver vers une interface d'audit administrative et anxiogène, rompant le principe directeur de la règle 09 (« parler à une personne, pas à un dossier »).

**Le test de dix minutes** :  
Ouvrir l'application en tant que collaborateur connecté et se poser la question : *« À cet instant, ai-je le moindre doute sur le fait que mon compte est fonctionnel, alors que je suis en train de naviguer dans l'espace opérationnel ? »*. Le constat évident d'inutilité confirme l'abandon sans écrire de code.

---

**Résultat du test** : 
