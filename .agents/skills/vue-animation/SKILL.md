---
name: vue-animation
description: Playbook et modèles d'implémentation pour des transitions et animations fluides sans saccade sous Vue 3 et DaisyUI v5.
---

# Skill : Vue 3 & DaisyUI Animation Playbook

Ce skill fournit les patrons de conception standardisés pour intégrer des animations légères, performantes et accessibles dans l'application.

---

## 1. Transitions de Route (Vue Router)

Pour animer les changements de page de manière fluide et sans saccade :

```vue
<template>
  <RouterView v-slot="{ Component }">
    <Transition name="fade-slide" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
```

---

## 2. Micro-interactions DaisyUI

### Bouton de confirmation avec retour d'état (Bounce subtil)
```css
.btn-press {
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-press:active {
  transform: scale(0.97);
}
```

### Fade fluide entre états de texte (ex: SyncIndicator)
```vue
<Transition name="fade-fast" mode="out-in">
  <span :key="statusText">{{ statusText }}</span>
</Transition>

<style scoped>
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.15s ease;
}
.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}
</style>
```

---

## 3. Modales & Overlays (DaisyUI)

Pour animer l'ouverture des modales DaisyUI sans reflow :
```vue
<dialog :class="['modal', { 'modal-open': isOpen }]">
  <div class="modal-box transition-transform duration-200 ease-out">
    <slot />
  </div>
  <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-xs transition-opacity duration-200">
    <button @click="$emit('close')">close</button>
  </form>
</dialog>
```

---

## 4. Skeleton Loader (DaisyUI)

Pour les chargements asynchrones sans rupture de layout :
```vue
<div class="skeleton h-4 w-full"></div>
```
