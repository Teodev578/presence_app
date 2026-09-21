# Conventions de Développement Frontend — Vue 3 & Vite

Ce document définit les standards d'implémentation et de style de code frontend applicables à l'ensemble du projet PresenceApp. Tout agent générant ou refactorisant du code d'interface ou de logique client doit s'y conformer rigoureusement.

---

## 1. Architecture des Composants Monofichiers (SFC)

### Structure interne invariable
Chaque composant `.vue` respecte strictement l'ordonnancement vertical suivant :
```vue
<script setup>
// 1. Imports externes (vue, dexie, etc.)
// 2. Imports internes (composants, composables, types, db)
// 3. defineProps() et defineEmits()
// 4. Logique réactive, états (shallowRef, ref, computed)
// 5. Composables et requêtes de données (useLiveQuery)
// 6. Méthodes et gestionnaires d'événements (handlers)
// 7. Cycle de vie (onMounted, onScopeDispose)
</script>

<template>
  <!-- Balisage déclaratif sémantique -->
</template>

<style scoped>
/* Uniquement si des styles spécifiques non couverts par Tailwind/DaisyUI sont indispensables */
</style>
```

### Conventions de nommage de fichiers
- **Composants** : `PascalCase.vue` impératif (ex : `AttendanceCard.vue`, `SyncStatusBadge.vue`).
- **Composants mono-instance (uniques par page)** : préfixés par `The` (ex : `TheHeader.vue`, `TheBottomNavigation.vue`).
- **Composants atomiques et génériques** : préfixés par `Base` (ex : `BaseButton.vue`, `BaseModal.vue`).
- **Composants spécifiques à un domaine** : préfixés par l'entité métier racine (ex : `SessionItem.vue`, `SessionList.vue`).
- **Composables** : `camelCase.js` préfixé par `use` (ex : `useLiveQuery.js`, `useSyncStatus.js`).

---

## 2. Composition API & Réactivité

### Principes directeurs
- **`<script setup>` exclusif** : Rejet formel de l'Options API, des mixins et de la fonction verbeuse `defineComponent({})`.
- **Typage strict des contrats de composants** :
  - Toujours documenter `defineProps` avec validation de type (`type`) et statut obligatoire (`required`) ou valeur par défaut (`default`).
  - Toujours documenter `defineEmits` sous forme de tableau ou d'objet de validation d'arguments.
  ```javascript
  const props = defineProps({
    sessionId: {
      type: String,
      required: true
    },
    isReadOnly: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update', 'close'])
  ```

### Gestion frugale de la mémoire (Mobile & PWA)
- **`shallowRef` pour les collections de données** : Tout retour de requête Dexie.js ou ensemble volumineux d'enregistrements doit être encapsulé dans un `shallowRef()`. L'enveloppement dans un `ref()` profond ou un `reactive()` est prohibé pour les collections afin d'épargner au moteur JavaScript l'instanciation de proxies réactifs imbriqués.
- **Propriétés calculées pures** : Les `computed()` doivent demeurer exempts d'effets de bord (pas de modification de variable réactive, pas d'appel asynchrone).
- **Nettoyage systématique des effets** : Tout écouteur d'événement (`window.addEventListener`), souscription manuelle ou timer (`setInterval`) initié dans un composable ou un composant doit être explicitement révoqué dans `onScopeDispose` ou `onUnmounted`.

---

## 3. Conventions de Template & Balisage

- **Directives abrégées** : Utilisation exclusive de la syntaxe condensée :
  - `:` pour `v-bind` (ex : `:id="record.id"`)
  - `@` pour `v-on` (ex : `@click="handleSave"`)
  - `#` pour `v-slot` (ex : `#header`)
- **Stabilité des clés de boucle** : Chaque directive `v-for` doit impérativement comporter une clé unique et immuable `:key="item.id"`. L'utilisation de l'index du tableau (`:key="index"`) est formellement interdite pour les listes dynamiques, filtrables ou mutables.
- **Simplicité des expressions de template** : Les conditions complexes ou les transformations de chaînes doivent être encapsulées dans des `computed()` plutôt qu'inlinées dans le template.
- **Balises auto-fermantes** : Les composants sans contenu de slot s'auto-ferment obligatoirement (ex : `<BaseSpinner size="sm" />`).

---

## 4. Intégration UI, DaisyUI v5 & Ergonomie Tactile

- **Composants sémantiques DaisyUI en priorité** : Privilégier les classes sémantiques fournies par DaisyUI (`btn`, `card`, `alert`, `badge`, `modal`) avant d'ajouter des utilitaires de disposition Tailwind CSS v4 (`flex`, `grid`, `gap-*`).
- **Interdiction des styles en ligne** : Aucun attribut `style="..."` n'est autorisé dans les composants, sauf pour des valeurs dynamiques calculées au pixel près (ex : position d'un drag-and-drop).
- **Accessibilité WCAG AA** :
  - Contrastes de couleurs suffisants selon le thème actif.
  - Présence d'attributs `aria-label` sur tous les boutons contenant uniquement une icône sans texte visible.
  - Visibilité du focus clavier (`focus-visible:outline-*`).
- **Ergonomie mobile-first & Safe Areas** :
  - Cibles tactiles d'une dimension minimale de 44×44 pixels pour prévenir les erreurs de frappe sur écran tactile.
  - Respect impératif des marges d'encoches sur smartphone via `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`.

---

## 5. Arborescence Canonique de `src/`

Pour préserver la lisibilité de la base de code, les fichiers sont organisés selon la hiérarchie suivante :
```
src/
├── assets/             # Fichiers statiques, icônes SVG, polices
├── components/
│   ├── ui/             # Composants de présentation atomiques et réutilisables (Base*.vue)
│   └── features/       # Composants composites spécifiques à un domaine métier
├── composables/        # Fonctions de logique réactive pure (use*.js)
├── db/                 # Définition du schéma Dexie, tables, migrations locales
├── services/           # Client Supabase, moteur d'outbox, connecteurs réseau
├── views/              # Vues complètes associées aux routes principales
├── App.vue             # Composant racine de l'application
├── main.js             # Point d'entrée, initialisation de Vue et des plugins
└── style.css           # Fichier de styles racine et configuration Tailwind/DaisyUI
```
