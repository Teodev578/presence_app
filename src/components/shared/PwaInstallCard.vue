<script setup>
import { computed } from 'vue'
import { usePwaInstall } from '../../composables/usePwaInstall'

const {
  isInstalled,
  canPromptDirectly,
  isIOS,
  isDesktop,
  isInstalling,
  showIosGuide,
  showDesktopGuide,
  installStatus,
  promptInstall,
  toggleIosGuide,
  toggleDesktopGuide,
} = usePwaInstall()

const badgeLabel = computed(() => {
  switch (installStatus.value) {
    case 'installed':
      return 'Installée'
    case 'ready':
      return 'Prête à installer'
    case 'desktop':
      return 'Prête à installer'
    case 'ios':
      return 'Safari iOS'
    default:
      return 'Navigateur web'
  }
})

const badgeClass = computed(() => {
  switch (installStatus.value) {
    case 'installed':
      return 'badge-success'
    case 'ready':
    case 'desktop':
    case 'ios':
      return 'badge-primary'
    default:
      return 'badge-neutral'
  }
})

const desktopButtonLabel = computed(() => {
  if (canPromptDirectly.value) return "Installer l'application"
  return showDesktopGuide.value ? 'Masquer la démarche' : 'Installer sur cet ordinateur'
})
</script>

<template>
  <section class="card bg-base-200 border border-base-300 shadow-xs rounded-m3-lg p-4 sm:p-5 flex flex-col gap-4 md:col-span-2">
    <div class="flex flex-col gap-1">
      <h2 class="text-base font-semibold text-base-content">Application sur l'appareil</h2>
      <p class="text-xs text-base-content/60">
        Installez PresenceApp pour un lancement rapide et un fonctionnement hors ligne optimal.
      </p>
    </div>

    <!-- État courant dans une surface M3 -->
    <div class="rounded-m3-md bg-base-100 border border-base-300/60 p-3.5 flex flex-col gap-3">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <!-- Icône smartphone / écran selon environnement -->
          <svg
            v-if="isDesktop"
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 text-primary shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect width="20" height="14" x="2" y="3" rx="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 text-primary shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
            <path d="M12 18h.01"></path>
          </svg>
          <span class="text-sm font-semibold text-base-content">
            {{ isDesktop ? 'Application pour ordinateur' : 'Disponibilité locale' }}
          </span>
        </div>
        <span class="badge badge-sm font-semibold" :class="badgeClass">
          {{ badgeLabel }}
        </span>
      </div>

      <!-- Description selon l'état -->
      <p class="text-xs text-base-content/60">
        <template v-if="installStatus === 'installed'">
          {{ isDesktop
            ? 'L\'application est installée sur cet ordinateur et s\'exécute dans sa propre fenêtre avec accès direct.'
            : 'L\'application s\'exécute en mode autonome sur votre appareil avec accès direct et stockage local garanti.'
          }}
        </template>
        <template v-else-if="installStatus === 'ready'">
          PresenceApp peut être ajoutée directement à vos applications ou à votre écran d'accueil sans passer par un magasin d'applications.
        </template>
        <template v-else-if="installStatus === 'desktop'">
          PresenceApp peut être installée comme une application autonome sur votre ordinateur (Chrome, Edge, Brave). Elle s'ouvrira dans sa propre fenêtre, sans barre d'adresse.
        </template>
        <template v-else-if="installStatus === 'ios'">
          Sur iPhone et iPad, l'installation s'effectue directement depuis les options de partage de Safari.
        </template>
        <template v-else>
          Cette page est consultée dans un navigateur standard. Vous pouvez l'ajouter à vos favoris ou créer un raccourci bureau.
        </template>
      </p>

      <!-- Indicateur de succès si déjà installée -->
      <div
        v-if="installStatus === 'installed'"
        class="flex items-center gap-2 pt-1 text-xs text-success font-medium"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5"></path>
        </svg>
        <span>Mode autonome actif : expérience fluide et stockage persistant</span>
      </div>

      <!-- Dépliant d'instructions pour ordinateur (Desktop Chrome / Edge / Brave) -->
      <div
        v-if="showDesktopGuide && (installStatus === 'desktop' || isDesktop)"
        class="rounded-m3-md bg-base-200/80 border border-base-300/80 p-3 flex flex-col gap-2.5 mt-1"
      >
        <p class="text-xs font-semibold text-base-content">Comment installer sur votre ordinateur :</p>
        <ol class="flex flex-col gap-2 text-xs text-base-content/80">
          <li class="flex items-start gap-2">
            <span class="badge badge-sm badge-neutral shrink-0 mt-0.5 font-bold">1</span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span>Dans la barre d'adresse de votre navigateur (à droite de l'URL), cliquez sur l'icône</span>
              <span class="inline-flex items-center gap-1 font-medium bg-base-100 px-1.5 py-0.5 rounded-m3-xs border border-base-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-3.5 h-3.5 text-primary shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <rect width="20" height="14" x="2" y="3" rx="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                  <polyline points="9 9 12 12 15 9"></polyline>
                  <line x1="12" y1="6" x2="12" y2="12"></line>
                </svg>
                <span>Installer PresenceApp</span>
              </span>
            </div>
          </li>
          <li class="flex items-start gap-2">
            <span class="badge badge-sm badge-neutral shrink-0 mt-0.5 font-bold">2</span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span>Ou ouvrez le menu du navigateur</span>
              <span class="inline-flex items-center gap-1 font-medium bg-base-100 px-1.5 py-0.5 rounded-m3-xs border border-base-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-3.5 h-3.5 text-primary shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="1.5"></circle>
                  <circle cx="12" cy="5" r="1.5"></circle>
                  <circle cx="12" cy="19" r="1.5"></circle>
                </svg>
                <span>Options</span>
              </span>
              <span>puis choisissez « Enregistrer et partager » puis « Installer PresenceApp… ».</span>
            </div>
          </li>
        </ol>
      </div>

      <!-- Dépliant d'instructions pour iOS Safari -->
      <div
        v-if="showIosGuide && installStatus === 'ios'"
        class="rounded-m3-md bg-base-200/80 border border-base-300/80 p-3 flex flex-col gap-2.5 mt-1"
      >
        <p class="text-xs font-semibold text-base-content">Deux étapes pour installer sur iPhone :</p>
        <ol class="flex flex-col gap-2 text-xs text-base-content/80">
          <li class="flex items-start gap-2">
            <span class="badge badge-sm badge-neutral shrink-0 mt-0.5 font-bold">1</span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span>Touchez l'icône</span>
              <span class="inline-flex items-center gap-1 font-medium bg-base-100 px-1.5 py-0.5 rounded-m3-xs border border-base-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-3.5 h-3.5 text-primary shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
                <span>Partager</span>
              </span>
              <span>en bas de Safari.</span>
            </div>
          </li>
          <li class="flex items-start gap-2">
            <span class="badge badge-sm badge-neutral shrink-0 mt-0.5 font-bold">2</span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span>Faites défiler puis touchez</span>
              <span class="inline-flex items-center gap-1 font-medium bg-base-100 px-1.5 py-0.5 rounded-m3-xs border border-base-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-3.5 h-3.5 text-primary shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                <span>Sur l'écran d'accueil</span>
              </span>
              <span>puis confirmez.</span>
            </div>
          </li>
        </ol>
      </div>
    </div>

    <!-- Action : Déclenchement direct (Android ou Chrome Desktop avec invite prête) -->
    <button
      v-if="installStatus === 'ready'"
      type="button"
      class="btn btn-primary rounded-m3-sm font-bold shadow-xs min-h-11 w-full sm:w-auto sm:min-w-64 gap-2 mt-auto self-start focus-visible:outline-2 focus-visible:outline-primary"
      :disabled="isInstalling"
      @click="promptInstall"
    >
      <span v-if="isInstalling" class="loading loading-spinner loading-xs"></span>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Installer l'application</span>
    </button>

    <!-- Action : Desktop Chrome/Edge/Brave -->
    <button
      v-else-if="installStatus === 'desktop'"
      type="button"
      class="btn btn-primary rounded-m3-sm font-bold shadow-xs min-h-11 w-full sm:w-auto sm:min-w-64 gap-2 mt-auto self-start focus-visible:outline-2 focus-visible:outline-primary"
      :disabled="isInstalling"
      @click="canPromptDirectly ? promptInstall() : toggleDesktopGuide()"
    >
      <span v-if="isInstalling" class="loading loading-spinner loading-xs"></span>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect width="20" height="14" x="2" y="3" rx="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
        <polyline points="9 9 12 12 15 9"></polyline>
        <line x1="12" y1="6" x2="12" y2="12"></line>
      </svg>
      <span>{{ desktopButtonLabel }}</span>
    </button>

    <!-- Action : Guide iOS Safari -->
    <button
      v-else-if="installStatus === 'ios'"
      type="button"
      class="btn btn-primary btn-outline rounded-m3-sm font-semibold min-h-11 w-full sm:w-auto sm:min-w-64 gap-2 mt-auto self-start focus-visible:outline-2 focus-visible:outline-primary"
      @click="toggleIosGuide"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 16v-4"></path>
        <path d="M12 8h.01"></path>
      </svg>
      <span>{{ showIosGuide ? 'Masquer les étapes' : 'Voir les étapes d\'installation' }}</span>
    </button>
  </section>
</template>
