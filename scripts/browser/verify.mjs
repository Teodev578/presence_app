#!/usr/bin/env node

/**
 * Vérification navigateur réelle via le Chrome DevTools Protocol.
 *
 * L'oracle est auto-suffisant : il démarre son propre serveur Vite sur un port dédié, lance un
 * Chrome headless avec un profil jetable, monte un banc d'essai temporaire, mesure le DOM rendu
 * et la cascade CSS réelle, capture des copies d'écran de preuve, puis nettoie tout.
 *
 * Usage :
 *   node scripts/verify-browser.mjs --theme         bascule de thème
 *   node scripts/verify-browser.mjs --sessions      états des sessions de pointage
 *   node scripts/verify-browser.mjs --sync-alert    alerte réseau de l'en-tête
 *   node scripts/verify-browser.mjs --week-tile     densité de la tuile hebdomadaire
 *   node scripts/verify-browser.mjs --status-badge  sémantique des statuts
 *   node scripts/verify-browser.mjs --appearance-control  pied de tiroir à 375px
 *   node scripts/verify-browser.mjs --nav-docking         ancrage à 840px
 *   node scripts/verify-browser.mjs --sidebar-handle      intégration de la poignée d'en-tête
 *   node scripts/verify-browser.mjs --sidebar-rail        repli en rail d'icônes
 *   node scripts/verify-browser.mjs --locations-form      dialogue de site et recherche
 *   node scripts/verify-browser.mjs --check-overlay       volet de confirmation de pointage
 *   node scripts/verify-browser.mjs --availability-summary résumé de disponibilités
 *   node scripts/verify-browser.mjs                 tous les modes
 *
 * Dépendance d'environnement : un binaire Chrome (CHROME_PATH pour le forcer).
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const VITE_PORT = 5199
const CDP_PORT = 9224
const HARNESS_DIR = path.join(ROOT, '__browser-harness__')
const EVIDENCE_DIR = path.join(ROOT, '.unlazy', 'evidence')

const TOKENS = {
  theme: 'browser-verify: theme toggle passed',
  sessions: 'browser-verify: session states passed',
  'sync-alert': 'browser-verify: sync alert states passed',
  'week-tile': 'browser-verify: week tile passed',
  'status-badge': 'browser-verify: status badge passed',
  'appearance-control': 'browser-verify: appearance control passed',
  'nav-docking': 'browser-verify: navigation docking passed',
  'sidebar-handle': 'browser-verify: sidebar handle passed',
  'sidebar-rail': 'browser-verify: sidebar rail passed',
  'locations-form': 'browser-verify: locations dialog passed',
  'locations-cards': 'browser-verify: locations cards passed',
  'locations-filters': 'browser-verify: locations filters passed',
  'check-overlay': 'browser-verify: check overlay passed',
  'availability-summary': 'browser-verify: availability summary passed',
}

const HARNESS_HTML = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="theme-color" content="#fdfcff" />
    <title>Banc d'essai navigateur</title>
  </head>
  <body class="bg-base-100 text-base-content">
    <div id="app"></div>
    <script type="module" src="/__browser-harness__/harness.js"></script>
  </body>
</html>
`

const HARNESS_JS = `import { createApp, h, ref } from 'vue'
import '../src/style.css'
import ThemeToggle from '../src/components/shared/ThemeToggle.vue'
import SyncAlert from '../src/components/shared/SyncAlert.vue'
import SyncIndicator from '../src/components/shared/SyncIndicator.vue'
import StatusBadge from '../src/components/shared/StatusBadge.vue'
import WeekSummaryCard from '../src/components/employee/WeekSummaryCard.vue'
import CheckConfirmationOverlay from '../src/components/employee/CheckConfirmationOverlay.vue'
import AvailabilitySummary from '../src/components/employee/AvailabilitySummary.vue'
import LocationsView from '../src/views/manager/LocationsView.vue'
import { db } from '../src/lib/db.js'
import { getLocalDateString, resolveSessionMinutes } from '../src/lib/dateUtils.js'
import { useSyncEngine } from '../src/composables/useSyncEngine.js'
import { useSidebarNav } from '../src/composables/useSidebarNav.js'

// Jeu de sites semé pour les vérifications de l'espace gestionnaire : un actif, un inactif.
const PROBE_LOCATIONS = [
  { id: 'probe-site-lyon', name: 'Siège Lyon', latitude: 45.76404, longitude: 4.83566, radius_meters: 120, is_active: true },
  { id: 'probe-site-sud', name: 'Dépôt Sud', latitude: 43.60465, longitude: 1.44421, radius_meters: 250, is_active: false },
]

const dayOffset = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d
}

const at = (base, hours, minutes) => {
  const d = new Date(base)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

const yesterday = dayOffset(-1)
const today = new Date()

// Session ouverte du jour calée sur 90 minutes écoulées, pour rester déterministe quelle que soit l'heure du test
const openTodayStart = new Date(Date.now() - 90 * 60000)

const presences = [
  {
    id: 'closed',
    work_date: getLocalDateString(yesterday),
    check_in_time: at(yesterday, 8, 0),
    check_out_time: at(yesterday, 16, 30),
  },
  {
    id: 'stale',
    work_date: getLocalDateString(yesterday),
    check_in_time: at(yesterday, 23, 6),
    check_out_time: null,
  },
  {
    id: 'openToday',
    work_date: getLocalDateString(today),
    check_in_time: openTodayStart.toISOString(),
    check_out_time: null,
  },
]

const weekTotalMinutes = presences.reduce((sum, presence) => sum + resolveSessionMinutes(presence), 0)

// Sonde sans rendu : expose les états du moteur de synchronisation pour simuler le réseau
const SyncProbe = {
  setup() {
    const { pendingCount, isSyncing } = useSyncEngine()
    window.__harness.setPendingCount = (value) => {
      pendingCount.value = value
    }
    window.__harness.setSyncing = (value) => {
      isSyncing.value = value
    }
    return () => null
  },
}

// Sonde du volet de confirmation : monte et démonte la surface à la demande du vérificateur
const OverlayProbe = {
  setup() {
    const visible = ref(false)
    window.__harness.setOverlayVisible = (value) => {
      visible.value = value
    }
    return () =>
      h('div', { id: 'overlay-host', class: 'relative w-[420px] h-[320px] border border-base-300 bg-base-200 rounded-m3-lg' }, [
        h(CheckConfirmationOverlay, {
          visible: visible.value,
          title: 'Arrivée enregistrée',
          message: 'Votre pointage a bien été enregistré.',
          siteName: 'Siège Lyon',
        }),
      ])
  },
}

// Sonde du résumé : permet de faire varier la sélection pour éprouver l'animation du compteur
const SummaryProbe = {
  setup() {
    const count = ref(5)
    const labels = ref(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'])
    window.__harness.setSummaryCount = (value) => {
      count.value = value
      labels.value = value > 0 ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].slice(0, value) : []
    }
    return () =>
      h('div', { id: 'summary-host', class: 'w-[420px] bg-base-200' }, [
        h(AvailabilitySummary, { count: count.value, labels: labels.value }),
      ])
  },
}

// Largeur utile réelle du pied de tiroir à 375px : aside w-72 (288px) moins p-5 (2 x 20px)
const DRAWER_INNER_WIDTH = 248

// Structure identique au bloc de réglages des deux mises en page, que G22 épingle par ailleurs
const settingsBlock = (id, width) =>
  h('div', { id, style: 'width:' + width + 'px', class: 'bg-base-200' }, [
    h('div', { id: id + '-block', class: 'flex flex-col gap-2 px-1' }, [
      h('div', { class: 'flex items-center justify-between gap-2 min-w-0' }, [
        h('span', { class: 'text-xs text-base-content/60 font-medium shrink-0' }, 'Statut réseau'),
        h(SyncIndicator),
      ]),
      h(ThemeToggle),
    ]),
  ])

/**
 * Banc du repli : reprend les classes des deux mises en page, poignée et contrôle d'apparence
 * compris, et consomme le composable réel. Le rail n'agit qu'une fois la barre ancrée.
 */
const railIcon = () =>
  h(
    'svg',
    { viewBox: '0 0 24 24', class: 'w-5 h-5 shrink-0', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
    [h('circle', { cx: 12, cy: 12, r: 10 })]
  )

const RailProbe = {
  setup() {
    const { isRail, toggleRail } = useSidebarNav()
    return () =>
      h(
        'div',
        {
          id: 'rail-host',
          class: ['drawer', 'drawer-docked', 'min-h-screen', 'bg-base-100', isRail.value ? 'drawer-rail' : ''],
          style: 'width:100%;height:640px',
        },
        [
          h('input', { id: 'rail-toggle', type: 'checkbox', class: 'drawer-toggle' }),
          h('div', { class: 'drawer-content flex flex-col' }, [
            h('main', { id: 'rail-content', class: 'flex-1 p-4' }, 'Vue active'),
          ]),
          h('div', { class: 'drawer-side z-50' }, [
            h('label', { for: 'rail-toggle', class: 'drawer-overlay' }),
            h(
              'aside',
              {
                id: 'rail-aside',
                class:
                  'relative bg-base-200 border-r border-base-300/60 min-h-full w-72 sm:w-80 p-5 flex flex-col justify-between text-base-content',
              },
              [
                h('div', [
                  h('div', { class: 'rail-header flex items-center justify-between gap-2 pb-4 border-b border-base-300/60 relative' }, [
                    h('div', { id: 'rail-brand-block', class: 'flex items-center gap-2.5 min-w-0' }, [
                      h('div', { class: 'w-8 h-8 rounded-m3-sm bg-primary/10 border border-primary/20' }),
                      h('div', { class: 'rail-hide flex flex-col' }, [
                        h('span', { id: 'rail-brand', class: 'rail-hide font-bold text-base' }, 'PresenceApp'),
                        h('span', { class: 'badge badge-primary badge-xs uppercase font-bold tracking-wider' }, 'Espace Collaborateur'),
                      ]),
                    ]),
                    h(
                      'button',
                      {
                        id: 'rail-handle',
                        type: 'button',
                        class:
                          'rail-handle hidden docked:inline-flex btn btn-ghost btn-circle shrink-0 min-w-11 min-h-11 text-base-content/60',
                        'aria-controls': 'rail-aside',
                        'aria-expanded': String(!isRail.value),
                        'aria-label': isRail.value ? 'Déplier la navigation' : 'Replier la navigation',
                        onClick: toggleRail,
                      },
                      [
                        h(
                          'svg',
                          {
                            viewBox: '0 0 24 24',
                            class: ['w-5', 'h-5', 'transition-transform', isRail.value ? 'rotate-180' : ''],
                            fill: 'none',
                            stroke: 'currentColor',
                            'stroke-width': 2,
                            'stroke-linecap': 'round',
                            'stroke-linejoin': 'round',
                          },
                          [h('polyline', { points: '15 18 9 12 15 6' })]
                        ),
                      ]
                    ),
                  ]),
                  h('nav', { class: 'mt-6', 'aria-label': 'Navigation latérale' }, [
                    h('p', { id: 'rail-section', class: 'rail-hide px-3.5 text-xs font-medium uppercase tracking-wide text-base-content/60' }, 'Navigation'),
                    h('ul', { class: 'menu bg-transparent w-full p-0 gap-1.5 font-medium mt-2' }, [
                      h('li', [
                        h(
                          'button',
                          {
                            id: 'rail-entry',
                            type: 'button',
                            class: [
                              'rail-entry',
                              'relative',
                              'flex',
                              'items-center',
                              'gap-3',
                              'py-3',
                              'px-3.5',
                              'rounded-m3-md',
                              'transition-colors',
                              'bg-primary/15',
                              'text-primary',
                              'font-bold',
                              isRail.value ? 'tooltip tooltip-right' : '',
                            ],
                            'aria-label': 'Tableau de bord',
                            'data-tip': isRail.value ? 'Tableau de bord' : null,
                          },
                          [
                            h('span', { 'aria-hidden': 'true', class: 'absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-primary' }),
                            railIcon(),
                            h('span', { id: 'rail-entry-label', class: 'rail-hide text-sm' }, 'Tableau de bord'),
                          ]
                        ),
                      ]),
                    ]),
                  ]),
                ]),
                h('div', { class: 'pt-4 border-t border-base-300/60 flex flex-col gap-3' }, [
                  h('div', { class: 'rail-center flex flex-col gap-2 px-1' }, [
                    h('div', { class: 'rail-center flex items-center justify-between gap-2 min-w-0' }, [
                      h('span', { class: 'rail-hide text-xs text-base-content/60 font-medium shrink-0' }, 'Statut réseau'),
                      h(SyncIndicator, { class: 'rail-network' }),
                    ]),
                    h(ThemeToggle),
                  ]),
                ]),
              ]
            ),
          ]),
        ]
      )
  },
}

window.__harness = {
  presences,
  weekTotalMinutes,
  afterPaint: () => new Promise((resolve) => requestAnimationFrame(() => resolve())),
  openLocationsDialog: () => {
    const host = document.querySelector('#locations-host')
    const button = host ? [...host.querySelectorAll('button')].find((b) => /Nouveau Site/.test(b.textContent)) : null
    if (button) button.click()
  },
  closeLocationsDialog: () => {
    const host = document.querySelector('#locations-host')
    const button = host ? host.querySelector('.modal-box button[aria-label="Fermer la modale"]') : null
    if (button) button.click()
  },
  clickLocationsFilter: (label) => {
    const host = document.querySelector('#locations-host')
    const button = host ? [...host.querySelectorAll('.join button')].find((b) => b.textContent.trim().startsWith(label)) : null
    if (button) button.click()
  },
  setLocationsSearch: (value) => {
    const host = document.querySelector('#locations-host')
    const input = host ? host.querySelector('.card label.input input') : null
    if (input) {
      input.value = value
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  },
  clickLocationsEmptyAction: () => {
    const host = document.querySelector('#locations-host')
    const box = host ? host.querySelector('.card.p-8') : null
    const button = box ? box.querySelector('button') : null
    if (button) button.click()
  },
  resetLocations: () => db.locations.clear().then(() => db.locations.bulkPut(PROBE_LOCATIONS)),
}

const app = createApp({
  render: () =>
    h('div', { class: 'p-4 flex flex-col gap-4' }, [
      h(SyncProbe),
      h(OverlayProbe),
      h(SummaryProbe),
      h('div', { id: 'summary-empty-host', class: 'w-[420px] bg-base-200' }, [
        h(AvailabilitySummary, { count: 0, labels: [] }),
      ]),
      h('div', { id: 'toggle-host' }, [h(ThemeToggle)]),
      settingsBlock('drawer-settings', DRAWER_INNER_WIDTH),
      settingsBlock('drawer-settings-narrow', 200),
      h('div', { id: 'sync-alert-host' }, [h(SyncAlert)]),
      h('div', { id: 'status-badge-host', class: 'flex flex-wrap gap-2' }, [
        h(StatusBadge, { status: 'present' }),
        h(StatusBadge, { status: 'late' }),
        h(StatusBadge, { status: 'completed' }),
        h(StatusBadge, { status: 'completed_late' }),
      ]),
      h('div', { id: 'card-host', style: 'max-width:520px' }, [
        h(WeekSummaryCard, {
          recentPresences: presences,
          weekPresences: presences,
          weekTotalMinutes,
        }),
      ]),
      h('div', { id: 'card-low-host', style: 'max-width:520px' }, [
        h(WeekSummaryCard, {
          recentPresences: presences,
          weekPresences: presences,
          weekTotalMinutes: 21,
        }),
      ]),
      // Banc d'ancrage : mêmes classes que les mises en page, monté pour éprouver le seuil de 840px
      h('div', { id: 'docking-host', class: 'drawer drawer-docked min-h-screen bg-base-100', style: 'width:100%;height:520px' }, [
        h('input', { id: 'docking-toggle', type: 'checkbox', class: 'drawer-toggle' }),
        h('div', { class: 'drawer-content flex flex-col' }, [
          h('label', { id: 'docking-hamburger', for: 'docking-toggle', class: 'btn btn-ghost btn-circle btn-sm docked:hidden' }, 'M'),
          h('main', { id: 'docking-content', class: 'flex-1 p-4' }, 'Contenu de la vue active'),
        ]),
        h('div', { class: 'drawer-side z-50' }, [
          h('label', { for: 'docking-toggle', class: 'drawer-overlay' }),
          h('aside', { id: 'docking-aside', class: 'bg-base-200 w-72 p-5' }, 'Navigation'),
        ]),
      ]),
      // Banc du repli : mêmes classes que les mises en page, monté pour éprouver le rail d'icônes
      h(RailProbe),
      // Vue gestionnaire réelle : le dialogue de site et sa barre de recherche sont mesurés en place
      h('div', { id: 'locations-host' }, [h(LocationsView)]),
      h('div', { id: 'card-clean-host', style: 'max-width:520px' }, [
        h(WeekSummaryCard, {
          recentPresences: presences.filter((presence) => presence.check_out_time),
          weekPresences: presences.filter((presence) => presence.check_out_time),
          weekTotalMinutes: 510,
        }),
      ]),
    ]),
})

db.locations
  .clear()
  .then(() => db.locations.bulkPut(PROBE_LOCATIONS))
  .catch(() => {})
  .finally(() => {
    app.mount('#app')
    window.__harnessReady = true
  })
`

const MEASURE_EXPRESSION = `(() => {
  const collapse = (value) => (value || '').replace(/\\s+/g, ' ').trim()
  const background = (node) => (node ? getComputedStyle(node).backgroundColor : null)
  const alertButton = document.querySelector('#sync-alert-host button')
  const measureToggle = (hostSelector) => {
    const group = document.querySelector(hostSelector + ' [role="group"]')
    const segments = group ? [...group.querySelectorAll('button')] : []
    return {
      groupAria: group ? group.getAttribute('aria-label') : null,
      groupWidth: group ? Math.round(group.getBoundingClientRect().width) : 0,
      groupHeight: group ? Math.round(group.getBoundingClientRect().height) : 0,
      segments: segments.map((segment) => {
        const rect = segment.getBoundingClientRect()
        const label = segment.querySelector('span')
        return {
          text: collapse(segment.innerText),
          aria: segment.getAttribute('aria-label'),
          pressed: segment.getAttribute('aria-pressed'),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          center: { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) },
          overflow: label ? Math.max(0, label.scrollWidth - label.clientWidth) : 0,
        }
      }),
    }
  }
  const measureSettings = (hostId) => {
    const host = document.querySelector('#' + hostId)
    const block = document.querySelector('#' + hostId + '-block')
    if (!host || !block) return null
    const blockRect = block.getBoundingClientRect()
    const group = block.querySelector('[role="group"]')
    const segments = group ? [...group.querySelectorAll('button')] : []
    const badge = block.querySelector('.badge')
    const badgeText = badge ? badge.querySelector('span[class*="text-xs"]') : null
    const groupRect = group ? group.getBoundingClientRect() : null
    const badgeRect = badge ? badge.getBoundingClientRect() : null
    const groupStyle = group ? getComputedStyle(group) : null
    const labelOverflow = segments.reduce((worst, segment) => {
      const label = segment.querySelector('span')
      return label ? Math.max(worst, label.scrollWidth - label.clientWidth) : worst
    }, 0)
    return {
      hostWidth: Math.round(host.getBoundingClientRect().width),
      scrollWidth: block.scrollWidth,
      clientWidth: block.clientWidth,
      right: Math.round(blockRect.right),
      groupTop: groupRect ? Math.round(groupRect.top) : 0,
      groupRight: groupRect ? Math.round(groupRect.right) : 0,
      groupWidth: groupRect ? Math.round(groupRect.width) : 0,
      groupHeight: groupRect ? Math.round(groupRect.height) : 0,
      groupBorderWidth: groupStyle ? groupStyle.borderTopWidth : null,
      groupBorderColor: groupStyle ? groupStyle.borderTopColor : null,
      groupBackground: groupStyle ? groupStyle.backgroundColor : null,
      segmentCount: segments.length,
      segmentHeights: segments.map((segment) => Math.round(segment.getBoundingClientRect().height)),
      labelOverflow,
      badgeRight: badgeRect ? Math.round(badgeRect.right) : 0,
      badgeBottom: badgeRect ? Math.round(badgeRect.bottom) : 0,
      badgeText: badge ? collapse(badge.innerText) : null,
      badgeTextScroll: badgeText ? badgeText.scrollWidth : 0,
      badgeTextClient: badgeText ? badgeText.clientWidth : 0,
    }
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  const list = document.querySelector('#card-host .overflow-y-auto')
  const rows = list
    ? [...list.children].map((row) => {
        const dot = row.querySelector('span.rounded-full')
        const badge = row.querySelector('.badge')
        return {
          text: collapse(row.innerText),
          dot: dot ? dot.className : null,
          badge: badge ? collapse(badge.innerText) : null,
        }
      })
    : []
  const lowProgress = document.querySelector('#card-low-host progress')
  const overlayHost = document.querySelector('#overlay-host')
  const overlayBox = overlayHost ? overlayHost.querySelector('[role="status"]') : null
  const overlayStyle = overlayBox ? getComputedStyle(overlayBox) : null
  const summaryHost = document.querySelector('#summary-host')
  const summaryBadge = summaryHost ? summaryHost.querySelector('.badge') : null
  const summaryBadgeStyle = summaryBadge ? getComputedStyle(summaryBadge) : null
  const summaryEmptyHost = document.querySelector('#summary-empty-host')
  const dockingHost = document.querySelector('#docking-host')
  const dockingSide = dockingHost ? dockingHost.querySelector('.drawer-side') : null
  const dockingOverlay = dockingHost ? dockingHost.querySelector('.drawer-overlay') : null
  const dockingToggle = document.querySelector('#docking-toggle')
  const dockingHamburger = document.querySelector('#docking-hamburger')
  const dockingAside = document.querySelector('#docking-aside')
  const dockingContent = document.querySelector('#docking-content')
  const rectOf = (node) => (node ? node.getBoundingClientRect() : null)
  const docking = dockingHost
    ? {
        toggleDisplay: dockingToggle ? getComputedStyle(dockingToggle).display : null,
        hamburgerDisplay: dockingHamburger ? getComputedStyle(dockingHamburger).display : null,
        sideVisibility: dockingSide ? getComputedStyle(dockingSide).visibility : null,
        sidePosition: dockingSide ? getComputedStyle(dockingSide).position : null,
        asideRight: rectOf(dockingAside) ? Math.round(rectOf(dockingAside).right) : 0,
        asideWidth: rectOf(dockingAside) ? Math.round(rectOf(dockingAside).width) : 0,
        overlayBackground: dockingOverlay ? getComputedStyle(dockingOverlay).backgroundColor : null,
        overlayPointerEvents: dockingOverlay ? getComputedStyle(dockingOverlay).pointerEvents : null,
        contentLeft: rectOf(dockingContent) ? Math.round(rectOf(dockingContent).left) : 0,
      }
    : null

  const railHost = document.querySelector('#rail-host')
  const railAside = railHost ? railHost.querySelector('aside') : null
  const railHeader = railAside ? railAside.querySelector('.rail-header') : null
  const railBrandBlock = document.querySelector('#rail-brand-block')
  const railHandle = document.querySelector('#rail-handle')
  const railBrand = document.querySelector('#rail-brand')
  const railSection = document.querySelector('#rail-section')
  const railEntry = document.querySelector('#rail-entry')
  const railEntryLabel = document.querySelector('#rail-entry-label')
  const railContent = document.querySelector('#rail-content')
  const railAppearanceButton = railAside ? railAside.querySelector('button[aria-haspopup="true"]') : null
  const railAppearanceGroup = railAside ? railAside.querySelector('[role="group"]') : null
  const railAppearanceMenu = railAside ? railAside.querySelector('[role="menu"]') : null
  const boxOf = (node) => (node ? node.getBoundingClientRect() : null)
  const centerOf = (node) => {
    const box = boxOf(node)
    return box ? { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) } : null
  }
  const rail = railHost
    ? {
        hostRailed: railHost.classList.contains('drawer-rail'),
        asideWidth: Math.round(boxOf(railAside)?.width || 0),
        asideRight: Math.round(boxOf(railAside)?.right || 0),
        contentLeft: Math.round(boxOf(railContent)?.left || 0),
        headerTop: Math.round(boxOf(railHeader)?.top || 0),
        headerBottom: Math.round(boxOf(railHeader)?.bottom || 0),
        headerLeft: Math.round(boxOf(railHeader)?.left || 0),
        headerRight: Math.round(boxOf(railHeader)?.right || 0),
        brandBlockTop: Math.round(boxOf(railBrandBlock)?.top || 0),
        brandBlockRight: Math.round(boxOf(railBrandBlock)?.right || 0),
        handleLeft: Math.round(boxOf(railHandle)?.left || 0),
        handleRight: Math.round(boxOf(railHandle)?.right || 0),
        handleTop: Math.round(boxOf(railHandle)?.top || 0),
        handleBottom: Math.round(boxOf(railHandle)?.bottom || 0),
        handleDisplay: railHandle ? getComputedStyle(railHandle).display : null,
        handleWidth: Math.round(boxOf(railHandle)?.width || 0),
        handleHeight: Math.round(boxOf(railHandle)?.height || 0),
        handleCenter: centerOf(railHandle),
        handleExpanded: railHandle ? railHandle.getAttribute('aria-expanded') : null,
        brandDisplay: railBrand ? getComputedStyle(railBrand).display : null,
        sectionDisplay: railSection ? getComputedStyle(railSection).display : null,
        entryLabelDisplay: railEntryLabel ? getComputedStyle(railEntryLabel).display : null,
        entryTip: railEntry ? railEntry.getAttribute('data-tip') : null,
        entryAria: railEntry ? railEntry.getAttribute('aria-label') : null,
        entryHeight: Math.round(boxOf(railEntry)?.height || 0),
        groupPresent: Boolean(railAppearanceGroup),
        appearanceButtonPresent: Boolean(railAppearanceButton),
        appearanceButtonLabel: railAppearanceButton ? railAppearanceButton.getAttribute('aria-label') : null,
        appearanceButtonCenter: centerOf(railAppearanceButton),
        menuDisplay: railAppearanceMenu ? getComputedStyle(railAppearanceMenu).display : null,
        menuItems: railAppearanceMenu
          ? [...railAppearanceMenu.querySelectorAll('[role="menuitemradio"]')].map((item) => ({
              text: collapse(item.innerText),
              checked: item.getAttribute('aria-checked'),
              center: centerOf(item),
            }))
          : [],
        stored: (() => {
          try {
            const raw = window.localStorage.getItem('presence_nav_collapsed')
            return raw ? JSON.parse(raw) : null
          } catch {
            return null
          }
        })(),
      }
    : null

  const locationsHost = document.querySelector('#locations-host')
  const locationsDialog = locationsHost ? locationsHost.querySelector('.modal-box') : null
  const locationsOpen = locationsHost ? locationsHost.querySelector('.modal.modal-open') : null
  const locationsInputs = locationsDialog
    ? [...locationsDialog.querySelectorAll('input')].map((input) => {
        const wrap = input.closest('.form-control') || input.closest('.relative') || input.parentElement
        const rect = input.getBoundingClientRect()
        const wrapRect = wrap.getBoundingClientRect()
        return {
          type: input.type,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          wrapWidth: Math.round(wrapRect.width),
          fullWidth: Math.abs(rect.width - wrapRect.width) <= 1,
        }
      })
    : []
  const locationsSearch = locationsHost ? locationsHost.querySelector('.card label.input') : null
  const locationsSearchCard = locationsSearch ? locationsSearch.closest('.card') : null
  const locationsCardPadding = locationsSearchCard ? parseFloat(getComputedStyle(locationsSearchCard).paddingLeft) : 0
  const locationsForm = {
    present: Boolean(locationsDialog),
    open: Boolean(locationsOpen),
    width: locationsDialog ? Math.round(locationsDialog.getBoundingClientRect().width) : 0,
    inputs: locationsInputs,
    search: locationsSearch
      ? {
          controlWidth: Math.round(locationsSearch.getBoundingClientRect().width),
          inputWidth: Math.round(locationsSearch.querySelector('input').getBoundingClientRect().width),
          cardInnerWidth: locationsSearchCard
            ? Math.round(locationsSearchCard.getBoundingClientRect().width - 2 * locationsCardPadding)
            : 0,
        }
      : null,
    buttons: locationsDialog
      ? [...locationsDialog.querySelectorAll('button')].map((button) => ({
          label: collapse(button.innerText),
          height: Math.round(button.getBoundingClientRect().height),
        }))
      : [],
    cards: locationsHost
      ? [...locationsHost.querySelectorAll('.grid > .card')].map((card) => {
          const link = card.querySelector('a[target="_blank"]')
          const toggle = card.querySelector('input.toggle')
          return {
            name: collapse(card.querySelector('h3')?.innerText || ''),
            statusText: toggle ? collapse(toggle.parentElement.innerText) : '',
            statusChecked: toggle ? toggle.checked : null,
            statusAria: toggle ? toggle.getAttribute('aria-label') : null,
            statusCenter: toggle
              ? (() => {
                  const rect = toggle.getBoundingClientRect()
                  return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) }
                })()
              : null,
            perimeter: collapse(card.querySelector('p.font-bold')?.innerText || ''),
            position: collapse(card.querySelector('p.font-mono')?.innerText || ''),
            mapHref: link ? link.getAttribute('href') : null,
            mapTarget: link ? link.getAttribute('target') : null,
            mapRel: link ? link.getAttribute('rel') : null,
            buttonHeights: [...card.querySelectorAll('button')].map((button) => Math.round(button.getBoundingClientRect().height)),
            buttonFontSizes: [...card.querySelectorAll('button')].map((button) => getComputedStyle(button).fontSize),
          }
        })
      : [],
    filters: locationsHost
      ? [...locationsHost.querySelectorAll('.join button')].map((button) => collapse(button.innerText))
      : [],
    empty: (() => {
      const box = locationsHost ? locationsHost.querySelector('.card.p-8') : null
      return {
        present: Boolean(box),
        title: box ? collapse(box.querySelector('h3')?.innerText || '') : null,
        message: box ? collapse(box.querySelector('p')?.innerText || '') : null,
        action: box ? collapse(box.querySelector('button')?.innerText || '') : null,
      }
    })(),
  }

  return {
    docking,
    rail,
    locations: locationsForm,
    theme: document.documentElement.getAttribute('data-theme'),
    stored: window.localStorage.getItem('presence_theme'),
    bodyBg: background(document.body),
    meta: meta ? meta.content : null,
    toggle: measureToggle('#toggle-host'),
    settings: measureSettings('drawer-settings'),
    narrow: measureSettings('drawer-settings-narrow'),
    syncAlertText: alertButton ? collapse(alertButton.innerText) : null,
    syncAlertAria: alertButton ? alertButton.getAttribute('aria-label') : null,
    badges: [...document.querySelectorAll('#status-badge-host .badge')].map((badge) => {
      const dot = badge.querySelector('span.rounded-full')
      return { text: collapse(badge.innerText), classes: badge.className, dot: dot ? dot.className : null }
    }),
    rows,
    cardText: document.querySelector('#card-host') ? collapse(document.querySelector('#card-host').innerText) : null,
    cardBadges: [...document.querySelectorAll('#card-host .badge')].map((badge) => collapse(badge.innerText)),
    lowCardText: document.querySelector('#card-low-host') ? collapse(document.querySelector('#card-low-host').innerText) : null,
    cleanCardText: document.querySelector('#card-clean-host') ? collapse(document.querySelector('#card-clean-host').innerText) : null,
    lowProgressValue: lowProgress ? lowProgress.getAttribute('value') : null,
    lowProgressAria: lowProgress ? lowProgress.getAttribute('aria-valuenow') : null,
    overlay: {
      present: Boolean(overlayBox),
      text: overlayBox ? collapse(overlayBox.innerText) : null,
      role: overlayBox ? overlayBox.getAttribute('role') : null,
      live: overlayBox ? overlayBox.getAttribute('aria-live') : null,
      position: overlayStyle ? overlayStyle.position : null,
      opacity: overlayStyle ? overlayStyle.opacity : null,
      transitionDuration: overlayStyle ? overlayStyle.transitionDuration : null,
    },
    summary: {
      text: summaryHost ? collapse(summaryHost.innerText) : null,
      badgeText: summaryBadge ? collapse(summaryBadge.innerText) : null,
      badgeTransition: summaryBadgeStyle ? summaryBadgeStyle.transitionDuration : null,
      chips: summaryHost ? [...summaryHost.querySelectorAll('.badge')].map((badge) => collapse(badge.innerText)) : [],
    },
    summaryEmpty: {
      text: summaryEmptyHost ? collapse(summaryEmptyHost.innerText) : null,
    },
    weekTotal: window.__harness ? window.__harness.weekTotalMinutes : null,
  }
})()`

const REQUIRED_FIELDS = ['theme', 'stored', 'bodyBg', 'meta', 'rows', 'cardText', 'weekTotal', 'docking', 'rail', 'locations']

const LIGHT_SURFACE = 'rgb(253, 252, 255)'
const DARK_SURFACE = 'rgb(17, 19, 24)'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// La bascule du volet est animée : mesurer avant la fin de la transition saisit une position transitoire
const LAYOUT_SETTLE_MS = 450

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'google-chrome-stable',
    'google-chrome',
    'chromium',
    'chromium-browser',
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (candidate.includes('/')) {
      if (fs.existsSync(candidate)) return candidate
      continue
    }
    for (const dir of (process.env.PATH || '').split(path.delimiter)) {
      const full = path.join(dir, candidate)
      if (fs.existsSync(full)) return full
    }
  }
  return null
}

async function waitForHttp(url, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs
  let lastError = 'inconnu'
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) })
      if (response.ok) return
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error.cause?.code || error.name
    }
    await sleep(250)
  }
  throw new Error(`${label} injoignable après ${timeoutMs} ms (${lastError})`)
}

class Cdp {
  constructor(socket) {
    this.socket = socket
    this.nextId = 0
    this.pending = new Map()
    this.pageErrors = []
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) reject(new Error(message.error.message))
        else resolve(message.result)
        return
      }
      if (message.method === 'Runtime.exceptionThrown') {
        this.pageErrors.push(message.params?.exceptionDetails?.exception?.description || 'exception sans description')
      }
      if (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error') {
        this.pageErrors.push((message.params.args || []).map((arg) => arg.value ?? arg.description).join(' '))
      }
    }
  }

  static async connect(webSocketUrl) {
    const socket = new WebSocket(webSocketUrl)
    await new Promise((resolve, reject) => {
      socket.onopen = resolve
      socket.onerror = () => reject(new Error('connexion CDP refusée'))
    })
    return new Cdp(socket)
  }

  send(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) {
      throw new Error(`évaluation en échec : ${result.exceptionDetails.exception?.description || 'inconnue'}`)
    }
    return result.result?.value
  }

  async measure() {
    return this.evaluate(MEASURE_EXPRESSION)
  }

  /** Déclenche une action puis mesure dans la même image, pour saisir une transition en cours. */
  async measureAfter(action) {
    return this.evaluate(
      `(async () => { ${action}; await window.__harness.afterPaint(); return ${MEASURE_EXPRESSION}; })()`
    )
  }

  async clickAt(point) {
    const base = { x: point.x, y: point.y, button: 'left', clickCount: 1 }
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...base })
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...base })
    await sleep(150)
  }

  async screenshot(fileName) {
    const shot = await this.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(EVIDENCE_DIR, fileName), Buffer.from(shot.data, 'base64'))
  }

  close() {
    this.socket.close()
  }
}

let failures = 0

const check = (description, assertion) => {
  try {
    assertion()
    console.log(`  ok ${description}`)
  } catch (error) {
    failures += 1
    console.error(`  FAIL ${description} -> ${error.message}`)
  }
}

const assertEqual = (actual, expected, label) => {
  if (actual !== expected) throw new Error(`${label} attendu "${expected}", obtenu "${actual}"`)
}

const assertTrue = (condition, label) => {
  if (!condition) throw new Error(label)
}

function assertShape(snapshot) {
  for (const field of REQUIRED_FIELDS) {
    if (snapshot[field] === undefined) throw new Error(`mesure incomplète : champ ${field} absent`)
  }
  if (!Array.isArray(snapshot.rows)) throw new Error('mesure incomplète : lignes illisibles')
}

async function verifyTheme(cdp) {
  const before = failures
  console.log('browser-verify: bascule de thème')

  const initial = await cdp.measure()
  assertShape(initial)

  check('état initial : aucun attribut de thème forcé', () => assertEqual(initial.theme, null, 'data-theme'))
  check('état initial : aucune préférence stockée', () => assertEqual(initial.stored, null, 'localStorage'))
  check('état initial : surface M3 claire rendue', () => assertEqual(initial.bodyBg, LIGHT_SURFACE, 'fond du corps'))
  check('état initial : meta theme-color alignée sur la surface claire', () => assertEqual(initial.meta, '#fdfcff', 'meta'))

  const segment = (snapshot, label) =>
    (snapshot.toggle?.segments || []).find((entry) => entry.text === label)

  check('contrôle segmenté monté', () => assertTrue(Boolean(initial.toggle), 'aucun groupe segmenté mesuré'))
  check('contrôle segmenté : trois états nommés', () =>
    assertEqual((initial.toggle.segments || []).map((entry) => entry.text).join('|'), 'Automatique|Clair|Sombre', 'segments'))
  check('contrôle segmenté : groupe nommé', () =>
    assertEqual(initial.toggle.groupAria, "Apparence de l'interface", 'nom du groupe'))
  check('contrôle segmenté : état courant annoncé par aria-pressed', () => {
    assertEqual(segment(initial, 'Automatique')?.pressed, 'true', 'segment Automatique')
    assertEqual(segment(initial, 'Clair')?.pressed, 'false', 'segment Clair')
  })
  check('contrôle segmenté : chaque segment nomme son mode', () =>
    assertTrue((segment(initial, 'Clair')?.aria || '').includes('Clair'), `nom accessible : ${segment(initial, 'Clair')?.aria}`))
  check('contrôle segmenté : cibles tactiles au moins 44px de haut', () =>
    assertTrue(
      (initial.toggle.segments || []).every((entry) => entry.height >= 44),
      `hauteurs : ${JSON.stringify((initial.toggle.segments || []).map((entry) => entry.height))}`
    ))

  await cdp.clickAt(segment(initial, 'Clair').center)
  const light = await cdp.measure()
  check('segment clair : thème clair forcé', () => assertEqual(light.theme, 'light', 'data-theme'))
  check('segment clair : préférence persistée', () => assertEqual(light.stored, 'light', 'localStorage'))
  check('segment clair : surface claire rendue', () => assertEqual(light.bodyBg, LIGHT_SURFACE, 'fond du corps'))
  check('segment clair : état porté par le segment clair', () =>
    assertEqual(segment(light, 'Clair')?.pressed, 'true', 'segment Clair'))
  await cdp.screenshot('theme-light.png')

  await cdp.clickAt(segment(light, 'Sombre').center)
  const dark = await cdp.measure()
  check('segment sombre : thème sombre forcé', () => assertEqual(dark.theme, 'dark', 'data-theme'))
  check('segment sombre : préférence persistée', () => assertEqual(dark.stored, 'dark', 'localStorage'))
  check('segment sombre : surface sombre réellement rendue', () => assertEqual(dark.bodyBg, DARK_SURFACE, 'fond du corps'))
  check('les deux thèmes produisent des surfaces distinctes', () => assertTrue(light.bodyBg !== dark.bodyBg, 'surfaces identiques'))
  check('meta theme-color suit le thème sombre', () => assertEqual(dark.meta, '#111318', 'meta'))
  await cdp.screenshot('theme-dark.png')

  await cdp.clickAt(segment(dark, 'Automatique').center)
  const backToSystem = await cdp.measure()
  check('segment système : retour au réglage système', () => assertEqual(backToSystem.theme, null, 'data-theme'))
  check('retour système : préférence effacée', () => assertEqual(backToSystem.stored, null, 'localStorage'))

  // Le réglage système est émulé au niveau du moteur : le thème doit suivre sans préférence forcée
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'dark' }],
  })
  await sleep(200)
  const systemDark = await cdp.measure()
  check('mode système : la préférence sombre de l\u2019OS est suivie', () =>
    assertEqual(systemDark.bodyBg, DARK_SURFACE, 'fond du corps')
  )
  check('mode système : meta theme-color suit le basculement OS', () => assertEqual(systemDark.meta, '#111318', 'meta'))

  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'light' }],
  })
  await sleep(200)
  const systemLight = await cdp.measure()
  check('mode système : retour à la surface claire', () => assertEqual(systemLight.bodyBg, LIGHT_SURFACE, 'fond du corps'))

  return failures === before
}

async function verifySessions(cdp) {
  const before = failures
  console.log('browser-verify: états des sessions')

  const snapshot = await cdp.measure()
  assertShape(snapshot)

  check('la tuile rend trois lignes de pointage', () => assertTrue(snapshot.rows.length === 3, `${snapshot.rows.length} lignes`))

  const closed = snapshot.rows.find((row) => (row.text || '').includes('8h 30min'))
  const stale = snapshot.rows.find((row) => (row.text || '').includes('Départ manquant'))
  const openToday = snapshot.rows.find((row) => (row.text || '').includes('En cours'))

  check('session close : durée réelle affichée', () => assertTrue(Boolean(closed), `lignes : ${JSON.stringify(snapshot.rows.map((r) => r.text))}`))
  check('journée révolue sans départ : libellé « Départ manquant »', () => assertTrue(Boolean(stale), 'libellé absent du rendu'))
  check('journée révolue sans départ : pastille non pulsante', () =>
    assertTrue(stale && !String(stale.dot).includes('animate-pulse'), `classes de pastille : ${stale?.dot}`)
  )
  check('journée révolue sans départ : durée indisponible au lieu d\u2019un temps écoulé', () =>
    assertEqual(stale?.badge, '--', 'badge de durée')
  )
  check('session du jour ouverte : libellé « En cours »', () => assertTrue(Boolean(openToday), 'libellé absent du rendu'))
  check('session du jour ouverte : pastille pulsante', () =>
    assertTrue(openToday && String(openToday.dot).includes('animate-pulse'), `classes de pastille : ${openToday?.dot}`)
  )
  check('session du jour ouverte : durée écoulée affichée', () =>
    assertTrue(openToday?.badge && openToday.badge !== '--', `badge de durée : ${openToday?.badge}`)
  )

  check('le total hebdomadaire exclut la session oubliée', () => assertEqual(snapshot.weekTotal, 600, 'total de la semaine'))
  check('la jauge reflète le total recalculé', () => {
    const expected = Math.min(100, Math.round((600 / (35 * 60)) * 100))
    assertTrue((snapshot.cardText || '').includes(`${expected}%`), `pourcentage attendu ${expected}% absent de la tuile`)
  })

  // Mesure portée sur la ligne concernée : la tuile affiche aussi un temps restant, qui ne doit pas
  // pouvoir confondre l'oracle
  check('aucune durée écoulée sur la ligne de la veille', () =>
    assertTrue(!/\d+h \d\dmin/.test(stale?.text || ''), `durée fantôme dans la ligne : ${stale?.text}`)
  )
  check('les durées restantes de la tuile restent affichées', () =>
    assertTrue(/\d+h \d\dmin/.test(snapshot.cardText || ''), 'aucune durée formatée dans la tuile')
  )

  await cdp.screenshot('session-states.png')

  return failures === before
}

async function verifySyncAlert(cdp) {
  const before = failures
  console.log('browser-verify: alerte réseau')

  const healthy = await cdp.measure()
  check('en-tête silencieux quand tout est synchronisé', () => assertEqual(healthy.syncAlertText, null, 'alerte affichée'))

  await cdp.evaluate('window.__harness.setPendingCount(3)')
  await sleep(200)
  const pending = await cdp.measure()
  check('alerte affichée dès qu\u2019une mutation attend', () =>
    assertTrue((pending.syncAlertText || '').includes('3 en attente'), `texte : ${pending.syncAlertText}`)
  )

  await cdp.evaluate("window.dispatchEvent(new Event('offline'))")
  await sleep(200)
  const offline = await cdp.measure()
  check('alerte affichée hors ligne', () => assertTrue((offline.syncAlertText || '').includes('Hors ligne'), `texte : ${offline.syncAlertText}`))
  check('hors ligne : état annoncé aux lecteurs d\u2019écran', () =>
    assertTrue((offline.syncAlertAria || '').includes('Hors ligne'), `aria : ${offline.syncAlertAria}`)
  )
  await cdp.screenshot('sync-alert.png')

  await cdp.evaluate("window.__harness.setPendingCount(0); window.dispatchEvent(new Event('online'))")
  await sleep(250)
  const restored = await cdp.measure()
  check('retour au silence après résorption', () => assertEqual(restored.syncAlertText, null, 'alerte encore affichée'))

  return failures === before
}

async function verifyWeekTile(cdp) {
  const before = failures
  console.log('browser-verify: tuile hebdomadaire')

  const snapshot = await cdp.measure()
  assertShape(snapshot)

  // innerText renvoie le texte après application de text-transform : le libellé est mis en capitales par le CSS
  check('départ manquant constaté sur la semaine', () => {
    assertTrue(/départs/i.test(snapshot.cardText || ''), 'libellé absent de la tuile')
    assertTrue((snapshot.cardText || '').includes('1 manquant'), `tuile : ${snapshot.cardText}`)
  })
  check('ni terme administratif ni injonction dans la tuile', () =>
    assertTrue(!/anomalie|à corriger|à compléter/i.test(snapshot.cardText || ''), `tuile : ${snapshot.cardText}`)
  )
  check('état sain annoncé sans réserve', () =>
    assertTrue((snapshot.cleanCardText || '').includes('Tous enregistrés'), `tuile saine : ${snapshot.cleanCardText}`)
  )
  check('état sain exempt de terme administratif', () =>
    assertTrue(!/anomalie|à corriger|à compléter/i.test(snapshot.cleanCardText || ''), `tuile saine : ${snapshot.cleanCardText}`)
  )
  check('pointages récents libellés sans progression trompeuse', () =>
    assertTrue(snapshot.cardBadges.some((text) => text.includes('3 derniers pointages')), `badges : ${JSON.stringify(snapshot.cardBadges)}`)
  )
  check('jauge lisible sous 5 % de progression', () => assertEqual(snapshot.lowProgressValue, '3', 'segment de jauge'))
  check('la progression annoncée reste la valeur réelle', () => assertEqual(snapshot.lowProgressAria, '1', 'aria-valuenow'))
  check('le pourcentage réel reste affiché', () => assertTrue((snapshot.lowCardText || '').includes('1%'), 'pourcentage absent'))

  await cdp.screenshot('week-tile.png')

  return failures === before
}

async function verifyStatusBadge(cdp) {
  const before = failures
  console.log('browser-verify: statuts de pointage')

  const snapshot = await cdp.measure()
  const [present, late, done, doneLate] = snapshot.badges

  check('quatre statuts rendus', () => assertEqual(snapshot.badges.length, 4, 'nombre de badges'))
  check('statut présent inchangé', () => {
    assertTrue(present?.text.includes('Présent'), `texte : ${present?.text}`)
    assertTrue(present?.classes.includes('badge-success'), `classes : ${present?.classes}`)
  })
  check('retard en cours toujours signalé', () => {
    assertTrue(late?.text.includes('En retard'), `texte : ${late?.text}`)
    assertTrue(late?.classes.includes('badge-warning'), `classes : ${late?.classes}`)
  })
  check('journée close à l\u2019heure inchangée', () => {
    assertEqual(done?.text, 'Terminé', 'texte')
    assertTrue(done?.classes.includes('badge-info'), `classes : ${done?.classes}`)
  })
  check('journée close avec retard non alarmante', () => {
    assertTrue(doneLate?.text.includes('Terminé'), `texte : ${doneLate?.text}`)
    assertTrue(!doneLate?.classes.includes('badge-warning'), `classes : ${doneLate?.classes}`)
  })
  check('retard conservé sur la journée close', () => {
    assertTrue(doneLate?.text.includes('avec retard'), `texte : ${doneLate?.text}`)
    assertTrue(String(doneLate?.dot).includes('bg-warning'), `pastille : ${doneLate?.dot}`)
  })

  await cdp.screenshot('status-badge.png')

  return failures === before
}

async function verifyAppearanceControl(cdp) {
  const before = failures
  console.log('browser-verify: pied de tiroir')

  // État le plus large possible du badge : c'est lui qui comprimait le commutateur
  await cdp.evaluate('window.__harness.setSyncing(true)')
  await sleep(250)

  const snapshot = await cdp.measure()
  const settings = snapshot.settings
  const narrow = snapshot.narrow
  if (!settings || !narrow) {
    failures += 1
    console.error('  FAIL bloc de réglages absent du banc d\u2019essai')
    return false
  }

  check('le badge prend son état le plus large sans comprimer', () =>
    assertTrue((settings.badgeText || '').includes('Synchronisation'), `état du badge : ${settings.badgeText}`)
  )
  check('aucun débordement horizontal du bloc de réglages', () =>
    assertTrue(settings.scrollWidth <= settings.clientWidth + 1, `scroll ${settings.scrollWidth} > client ${settings.clientWidth}`)
  )
  check('le badge reste contenu dans le pied de tiroir', () =>
    assertTrue(settings.badgeRight <= settings.right + 0.5, `badge ${settings.badgeRight} > bloc ${settings.right}`)
  )
  check('le badge ne pousse plus le contrôle d\u2019apparence', () =>
    assertTrue(settings.badgeBottom <= settings.groupTop + 0.5, `bas du badge ${settings.badgeBottom} > haut du groupe ${settings.groupTop}`)
  )

  check('le contrôle d\u2019apparence présente ses trois états', () =>
    assertEqual(settings.segmentCount, 3, 'segments')
  )
  check('le contrôle d\u2019apparence occupe la largeur du pied de tiroir', () =>
    assertTrue(settings.groupWidth >= settings.clientWidth - 12, `groupe ${settings.groupWidth}px pour un bloc de ${settings.clientWidth}px`)
  )
  check('le contrôle d\u2019apparence atteint 44px de haut', () =>
    assertTrue(
      settings.groupHeight >= 44 && settings.segmentHeights.every((height) => height >= 44),
      `groupe ${settings.groupHeight}px, segments ${JSON.stringify(settings.segmentHeights)}`
    )
  )
  check('le contrôle d\u2019apparence reste dans le tiroir', () =>
    assertTrue(settings.groupRight <= settings.right + 0.5, `groupe ${settings.groupRight} > bloc ${settings.right}`)
  )
  check('le contrôle d\u2019apparence porte une bordure visible', () => {
    assertTrue(parseFloat(settings.groupBorderWidth) >= 1, `épaisseur de bordure ${settings.groupBorderWidth}`)
    assertTrue(settings.groupBorderColor !== settings.groupBackground, 'bordure indistinguable du fond')
    assertTrue(settings.groupBorderColor !== 'rgba(0, 0, 0, 0)', 'bordure transparente')
  })

  // Cas de torture : à 200px, la troncature doit s'engager au lieu de déborder. Sans ce contrôle,
  // l'absence de troncature resterait invisible tant que la largeur suffit.
  check('sous contrainte extrême, la troncature s\u2019engage', () =>
    assertTrue(narrow.badgeTextScroll > narrow.badgeTextClient, `texte ${narrow.badgeTextScroll}px pour ${narrow.badgeTextClient}px`)
  )
  check('sous contrainte extrême, un libellé de segment se tronque', () =>
    assertTrue(narrow.labelOverflow > 0, `débordement mesuré : ${narrow.labelOverflow}px`)
  )
  check('sous contrainte extrême, le bloc ne déborde pas malgré tout', () =>
    assertTrue(narrow.scrollWidth <= narrow.clientWidth + 1, `scroll ${narrow.scrollWidth} > client ${narrow.clientWidth}`)
  )
  check('sous contrainte extrême, le contrôle d\u2019apparence reste entier', () =>
    assertTrue(narrow.groupRight <= narrow.right + 0.5, `groupe ${narrow.groupRight} > bloc ${narrow.right}`)
  )

  await cdp.evaluate('window.__harness.setSyncing(false)')
  await sleep(200)
  await cdp.screenshot('drawer-appearance.png')

  return failures === before
}

const assertBatchFields = (snapshot) => {
  for (const field of ['overlay', 'summary', 'summaryEmpty']) {
    if (!snapshot[field]) throw new Error(`mesure incomplète : champ ${field} absent`)
  }
}

async function verifyCheckOverlay(cdp) {
  const before = failures
  console.log('browser-verify: volet de confirmation de pointage')

  const initial = await cdp.measure()
  assertShape(initial)
  assertBatchFields(initial)

  check('volet masqué au repos', () => assertEqual(initial.overlay.present, false, 'présence'))
  check('aucune surface de statut rendue au repos', () => assertEqual(initial.overlay.role, null, 'role'))

  // Mesure dans l'image qui suit l'activation : la transition d'entrée est encore en cours,
  // ce qui prouve que l'apparition est animée et non instantanée.
  const entering = await cdp.measureAfter('window.__harness.setOverlayVisible(true)')
  check('volet monté à l’activation', () => assertEqual(entering.overlay.present, true, 'présence'))
  check('surface de statut annoncée poliment', () => {
    assertEqual(entering.overlay.role, 'status', 'role')
    assertEqual(entering.overlay.live, 'polite', 'aria-live')
  })
  check('volet ancré sur la carte', () => assertEqual(entering.overlay.position, 'absolute', 'position'))
  check('entrée réellement animée', () =>
    assertTrue(parseFloat(entering.overlay.transitionDuration) > 0, `transition : ${entering.overlay.transitionDuration}`)
  )

  await sleep(320)
  const settled = await cdp.measure()
  check('volet pleinement visible après l’entrée', () => assertEqual(settled.overlay.opacity, '1', 'opacité'))
  check('titre, message et site rendus', () => {
    const text = settled.overlay.text || ''
    assertTrue(text.includes('Arrivée enregistrée'), `titre : ${text}`)
    assertTrue(text.includes('bien été enregistré'), 'message absent')
    assertTrue(text.includes('Siège Lyon'), 'site absent')
  })
  await cdp.screenshot('check-overlay.png')

  await cdp.evaluate('window.__harness.setOverlayVisible(false)')
  await sleep(320)
  const gone = await cdp.measure()
  check('volet retiré après désactivation', () => assertEqual(gone.overlay.present, false, 'présence'))

  return failures === before
}

async function verifyAvailabilitySummary(cdp) {
  const before = failures
  console.log('browser-verify: résumé des disponibilités')

  const initial = await cdp.measure()
  assertShape(initial)
  assertBatchFields(initial)

  check('compte et jours rendus', () => {
    assertTrue((initial.summary.badgeText || '').includes('5 jours sélectionnés'), `compte : ${initial.summary.badgeText}`)
    assertTrue(
      initial.summary.chips.includes('Lun') && initial.summary.chips.includes('Ven'),
      `jours : ${JSON.stringify(initial.summary.chips)}`
    )
  })
  check('état vide explicite et conséquence annoncée', () => {
    const text = initial.summaryEmpty.text || ''
    assertTrue(text.includes('Aucun jour sélectionné'), `texte : ${text}`)
    assertTrue(text.includes('retirera'), 'conséquence non annoncée')
  })

  const entering = await cdp.measureAfter('window.__harness.setSummaryCount(2)')
  check('changement de sélection animé', () =>
    assertTrue(parseFloat(entering.summary.badgeTransition) > 0, `transition : ${entering.summary.badgeTransition}`)
  )

  await sleep(380)
  const settled = await cdp.measure()
  check('nouveau compte et jours après la transition', () => {
    assertTrue((settled.summary.badgeText || '').includes('2 jours sélectionnés'), `compte : ${settled.summary.badgeText}`)
    assertTrue(settled.summary.chips.includes('Lun'), `jours : ${JSON.stringify(settled.summary.chips)}`)
    assertTrue(settled.summary.chips.includes('Mar'), `jours : ${JSON.stringify(settled.summary.chips)}`)
    assertTrue(
      !settled.summary.chips.includes('Mer') && !settled.summary.chips.includes('Ven'),
      `jours restants : ${JSON.stringify(settled.summary.chips)}`
    )
  })
  await cdp.screenshot('availability-summary.png')

  return failures === before
}

/**
 * Le seuil canonique de 840px : tiroir superposé en dessous, barre latérale ancrée au delà.
 * Le banc reproduit les classes des mises en page, et la mesure porte sur les styles calculés.
 */
async function verifyNavDocking(cdp) {
  const before = failures
  console.log('browser-verify: ancrage à 840px')

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 839,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await sleep(LAYOUT_SETTLE_MS)
  const narrow = await cdp.measure()
  assertShape(narrow)

  check('sous 840px : le tiroir reste un volet superposé', () => {
    assertTrue(narrow.docking.toggleDisplay !== 'none', 'interrupteur du tiroir masqué')
    assertTrue(narrow.docking.asideRight <= 1, `barre latérale visible à ${narrow.docking.asideRight}px du bord`)
  })
  check('sous 840px : le hamburger reste offert', () =>
    assertTrue(narrow.docking.hamburgerDisplay !== 'none', `affichage du hamburger : ${narrow.docking.hamburgerDisplay}`)
  )

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 841,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await sleep(LAYOUT_SETTLE_MS)
  const wide = await cdp.measure()

  check('au delà de 840px : le tiroir s\u2019ancre dans la mise en page', () => {
    assertEqual(wide.docking.toggleDisplay, 'none', "affichage de l'interrupteur")
    assertEqual(wide.docking.sidePosition, 'sticky', 'position de la barre latérale')
    assertEqual(wide.docking.sideVisibility, 'visible', 'visibilité de la barre latérale')
  })
  check('au delà de 840px : la barre occupe sa largeur et pousse le contenu', () => {
    assertTrue(wide.docking.asideWidth >= 280, `largeur de barre ${wide.docking.asideWidth}px`)
    assertTrue(wide.docking.contentLeft >= wide.docking.asideRight - 1, `contenu à ${wide.docking.contentLeft}px, barre finissant à ${wide.docking.asideRight}px`)
  })
  check('au delà de 840px : les contrôles de tiroir disparaissent', () =>
    assertEqual(wide.docking.hamburgerDisplay, 'none', 'affichage du hamburger')
  )
  check('au delà de 840px : le voile ne capte plus le clic ni n\u2019assombrit la vue', () => {
    assertEqual(wide.docking.overlayPointerEvents, 'none', 'interception du volet')
    assertTrue(
      wide.docking.overlayBackground === 'rgba(0, 0, 0, 0)' || wide.docking.overlayBackground === 'transparent',
      `fond du volet : ${wide.docking.overlayBackground}`
    )
  })

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await sleep(LAYOUT_SETTLE_MS)

  return failures === before
}

/**
 * Le repli en rail d'icônes : à 841px, la barre ancrée se replie d'elle-même ; un clic sur la
 * poignée grave un choix qui ne vaut que pour la bande courante, tout franchissement de seuil
 * le révoquant au profit du seuil ; sous 840px le rail disparaît au profit du volet à libellés
 * complets ; repliée, le contrôle d'apparence s'ouvre en menu nommé.
 */
async function verifySidebarRail(cdp) {
  const before = failures
  console.log('browser-verify: repli en rail d\u2019icônes')

  const settle = async (width) => {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
    await sleep(LAYOUT_SETTLE_MS)
    return cdp.measure()
  }

  const clickCenter = async (center) => {
    if (!center) throw new Error('cible absente du banc de rail')
    await cdp.clickAt(center)
    await sleep(220)
    return cdp.measure()
  }

  const focusAndMeasure = async (selector) => {
    await cdp.evaluate(`document.querySelector('${selector}')?.scrollIntoView({ block: 'center' })`)
    await sleep(150)
    return cdp.measure()
  }

  // 1. Repli automatique dans la bande 840-1024 px, sans choix préalable.
  const auto = await settle(841)
  assertShape(auto)
  check('entre 840 et 1024 px : le rail s\u2019applique de lui-même', () => {
    assertTrue(auto.rail.hostRailed, 'classe drawer-rail absente')
    assertTrue(Math.abs(auto.rail.asideWidth - 80) <= 1, `largeur de rail ${auto.rail.asideWidth}px`)
    // La poignée est hors flux (`absolute`) : le navigateur blockifie `inline-flex` en `flex`.
    assertTrue(
      auto.rail.handleDisplay === 'flex' || auto.rail.handleDisplay === 'inline-flex',
      `affichage de la poignée : ${auto.rail.handleDisplay}`
    )
  })
  check('repliée : les libellés cèdent la place aux icônes', () => {
    assertEqual(auto.rail.brandDisplay, 'none', 'marque visible')
    assertEqual(auto.rail.sectionDisplay, 'none', 'libellé de section visible')
    assertEqual(auto.rail.entryLabelDisplay, 'none', 'libellé d\u2019entrée visible')
  })
  check('repliée : la poignée et les entrées gardent leur cible de 44px', () => {
    assertTrue(auto.rail.handleWidth >= 44 && auto.rail.handleHeight >= 44, `poignée ${auto.rail.handleWidth}x${auto.rail.handleHeight}`)
    assertTrue(auto.rail.entryHeight >= 44, `entrée ${auto.rail.entryHeight}px`)
  })
  check('repliée : la poignée ne mord pas la marque centrée', () =>
    assertTrue(
      auto.rail.handleBottom <= auto.rail.brandBlockTop,
      `poignée finissant à ${auto.rail.handleBottom}px, marque débutant à ${auto.rail.brandBlockTop}px`
    )
  )
  check('repliée : chaque entrée reste nommée pour le survol et les lecteurs d\u2019écran', () => {
    assertEqual(auto.rail.entryTip, 'Tableau de bord', 'libellé d\u2019infobulle')
    assertEqual(auto.rail.entryAria, 'Tableau de bord', 'libellé accessible')
  })
  check('repliée : le contenu suit la largeur du rail', () =>
    assertTrue(auto.rail.contentLeft >= auto.rail.asideRight - 1, `contenu à ${auto.rail.contentLeft}px, rail finissant à ${auto.rail.asideRight}px`)
  )
  check('repliée : la poignée annonce son état', () => assertEqual(auto.rail.handleExpanded, 'false', 'aria-expanded'))

  // 2. Le clic sur la poignée déploie et grave un choix explicite.
  const handleTarget = await focusAndMeasure('#rail-handle')
  const expanded = await clickCenter(handleTarget.rail.handleCenter)
  check('un clic sur la poignée déploie la barre', () => {
    assertTrue(!expanded.rail.hostRailed, 'classe drawer-rail toujours posée')
    assertTrue(expanded.rail.asideWidth >= 280, `largeur déployée ${expanded.rail.asideWidth}px`)
    assertEqual(expanded.rail.handleExpanded, 'true', 'aria-expanded')
  })
  check('le déploiement rend les libellés et persiste le choix', () => {
    assertTrue(expanded.rail.brandDisplay !== 'none', 'marque masquée')
    assertTrue(expanded.rail.entryLabelDisplay !== 'none', 'libellé d\u2019entrée masqué')
    assertEqual(expanded.rail.stored?.collapsed, false, 'préférence stockée')
    assertEqual(expanded.rail.stored?.band, 'tablet', 'bande de la préférence')
  })

  // 3. Le franchissement vers le desktop révoque le choix : le seuil redéploie.
  const wide = await settle(1280)
  check('au delà de 1024 px : le franchissement révoque le choix', () => assertEqual(wide.rail.stored, null, 'préférence stockée'))
  check('au delà de 1024 px : le seuil déploie malgré le clic', () => assertTrue(!wide.rail.hostRailed, 'barre repliée contre le seuil'))
  check('au delà de 1024 px : la barre déployée reprend sa largeur pleine', () =>
    assertTrue(wide.rail.asideWidth >= 280, `largeur ${wide.rail.asideWidth}px`)
  )

  // 4. Un second clic replie volontairement ; le choix vaut pour la bande desktop courante.
  const handleWide = await focusAndMeasure('#rail-handle')
  const railed = await clickCenter(handleWide.rail.handleCenter)
  check('un second clic replie volontairement la barre', () => {
    assertTrue(railed.rail.hostRailed, 'classe drawer-rail absente')
    assertEqual(railed.rail.stored?.collapsed, true, 'préférence stockée')
    assertEqual(railed.rail.stored?.band, 'desktop', 'bande de la préférence')
  })
  const railedInBand = await settle(841)
  check('franchir vers la bande révoque le choix', () => assertEqual(railedInBand.rail.stored, null, 'préférence stockée'))
  check('de retour dans la bande : le seuil replie', () => assertTrue(railedInBand.rail.hostRailed, 'barre déployée contre le seuil'))

  // 5. Sous 840 px, le rail n'a pas d'objet.
  const narrow = await settle(839)
  check('sous 840 px : la barre redevient un volet à libellés complets', () => {
    assertTrue(!narrow.rail.hostRailed, 'classe drawer-rail persistante')
    assertTrue(narrow.rail.entryLabelDisplay !== 'none', 'libellé d\u2019entrée masqué')
    assertEqual(narrow.rail.handleDisplay, 'none', 'poignée offerte hors ancrage')
  })

  // 6. Repliée, le contrôle d'apparence s'ouvre en menu nommé.
  const backInBand = await settle(841)
  check('de retour dans la bande : le seuil replie', () => assertTrue(backInBand.rail.hostRailed, 'rail absent'))
  const railFooter = await focusAndMeasure('#rail-aside button[aria-haspopup="true"]')
  check('repliée : le contrôle d\u2019apparence devient un déclencheur nommé', () => {
    assertTrue(!railFooter.rail.groupPresent, 'groupe segmenté encore rendu')
    assertTrue(railFooter.rail.appearanceButtonPresent, 'déclencheur absent')
    assertTrue((railFooter.rail.appearanceButtonLabel || '').startsWith('Apparence'), `libellé : ${railFooter.rail.appearanceButtonLabel}`)
    assertEqual(railFooter.rail.menuDisplay, 'none', 'menu ouvert au repos')
  })
  const menuOpen = await clickCenter(railFooter.rail.appearanceButtonCenter)
  check('le déclencheur ouvre les trois états nommés, un seul coché', () => {
    assertTrue(menuOpen.rail.menuDisplay !== 'none', 'menu fermé')
    assertEqual(menuOpen.rail.menuItems.length, 3, 'choix du menu')
    const checked = menuOpen.rail.menuItems.filter((item) => item.checked === 'true')
    assertEqual(checked.length, 1, 'choix cochés')
    assertTrue(menuOpen.rail.menuItems.every((item) => item.text.length > 0), 'choix non nommés')
  })
  await cdp.screenshot('sidebar-rail.png')
  const darkItem = menuOpen.rail.menuItems.find((item) => item.text.includes('Sombre'))
  const dark = await clickCenter(darkItem ? darkItem.center : null)
  check('un choix referme le menu et s\u2019applique', () => {
    assertEqual(dark.rail.menuDisplay, 'none', 'menu encore ouvert')
    assertEqual(dark.theme, 'dark', 'thème appliqué')
    assertTrue((dark.rail.appearanceButtonLabel || '').includes('Sombre'), `libellé du déclencheur : ${dark.rail.appearanceButtonLabel}`)
  })

  // 7. Remise en état : barre déployée hors bande et thème rendu au système.
  const restored = await settle(1280)
  if (restored.rail.hostRailed) {
    await clickCenter((await focusAndMeasure('#rail-handle')).rail.handleCenter)
  }
  // Le défilement a suivi le rail : on ramène le contrôle d'apparence dans la fenêtre avant de le viser.
  const reopened = await focusAndMeasure('#toggle-host')
  check('remise en état : barre déployée', () => assertTrue(!reopened.rail.hostRailed, 'barre laissée repliée'))
  const systemSegment = (reopened.toggle?.segments || []).find((segment) => segment.text === 'Automatique')
  const system = await clickCenter(systemSegment ? systemSegment.center : null)
  check('remise en état : thème rendu au système', () => assertEqual(system.theme, null, 'data-theme'))

  return failures === before
}

/**
 * L'intégration de la poignée de repli dans l'en-tête ancré : la barre déployée la garde dans
 * sa rangée, à la droite de la marque, sans chevauchement ni débord du filet d'en-tête.
 */
async function verifySidebarHandle(cdp) {
  const before = failures
  console.log('browser-verify: intégration de la poignée d\u2019en-tête')

  for (const width of [1440, 1024]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
    await sleep(LAYOUT_SETTLE_MS)
    const snapshot = await cdp.measure()
    assertShape(snapshot)
    const rail = snapshot.rail
    check(`à ${width}px : la barre ancrée reste déployée`, () => assertTrue(!rail.hostRailed, 'barre repliée en rail'))
    check(`à ${width}px : la poignée siège à droite de la marque`, () =>
      assertTrue(
        rail.brandBlockRight <= rail.handleLeft,
        `marque finissant à ${rail.brandBlockRight}px, poignée débutant à ${rail.handleLeft}px`
      ))
    check(`à ${width}px : la poignée tient dans l\u2019en-tête`, () => {
      assertTrue(rail.handleTop >= rail.headerTop - 1, `poignée haute à ${rail.handleTop}px, en-tête à ${rail.headerTop}px`)
      assertTrue(rail.handleBottom <= rail.headerBottom, `poignée basse à ${rail.handleBottom}px, en-tête finissant à ${rail.headerBottom}px`)
      assertTrue(
        rail.handleLeft >= rail.headerLeft && rail.handleRight <= rail.headerRight + 1,
        `poignée hors des marges de l'en-tête (${rail.handleLeft}→${rail.handleRight})`
      )
    })
    check(`à ${width}px : la poignée garde sa cible de 44px`, () =>
      assertTrue(rail.handleWidth >= 44 && rail.handleHeight >= 44, `poignée ${rail.handleWidth}x${rail.handleHeight}`))
  }

  // Restauration d'une largeur large pour ne pas contaminer les modes suivants.
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
  await sleep(LAYOUT_SETTLE_MS)

  return failures === before
}

/**
 * Le dialogue de site monté sur la vue gestionnaire réelle : champs de saisie et barre de
 * recherche à la largeur de leur conteneur, cibles de 44px, dialogue élargi sans débordement.
 */
async function verifyLocationsForm(cdp) {
  const before = failures
  console.log('browser-verify: dialogue des sites')

  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false })
  await sleep(LAYOUT_SETTLE_MS)
  await cdp.evaluate('window.__harness.openLocationsDialog()')
  await sleep(LAYOUT_SETTLE_MS)

  const snapshot = await cdp.measure()
  assertShape(snapshot)
  const form = snapshot.locations

  check('le dialogue s’ouvre sur la vue réelle', () => assertTrue(form.present && form.open, 'dialogue non monté ou fermé'))
  check('le dialogue est élargi', () => assertTrue(form.width >= 520, `largeur ${form.width}px`))

  const textFields = form.inputs.filter((input) => ['text', 'number'].includes(input.type))
  check('les champs texte sont présents', () => assertTrue(textFields.length >= 5, `${textFields.length} champs`))
  check('chaque champ texte remplit son conteneur', () =>
    assertTrue(
      textFields.every((input) => input.fullWidth),
      JSON.stringify(textFields.map((input) => `${input.width}/${input.wrapWidth}`))
    )
  )
  check('chaque champ texte atteint 44px de haut', () =>
    assertTrue(
      textFields.every((input) => input.height >= 44),
      JSON.stringify(textFields.map((input) => input.height))
    )
  )
  check('la barre de recherche occupe la largeur de sa carte', () => {
    assertTrue(Boolean(form.search), 'barre de recherche introuvable')
    assertTrue(
      form.search.controlWidth >= form.search.cardInnerWidth - 2,
      `contrôle ${form.search.controlWidth}px pour une carte utile de ${form.search.cardInnerWidth}px`
    )
  })
  check('le dialogue garde ses cibles de 44px', () =>
    assertTrue(
      form.buttons.length > 0 && form.buttons.every((button) => button.height >= 44),
      JSON.stringify(form.buttons.map((button) => `${button.label}:${button.height}`))
    )
  )

  await cdp.screenshot('locations-dialog.png')
  await cdp.evaluate('window.__harness.closeLocationsDialog()')
  await sleep(200)

  return failures === before
}

/**
 * Les cartes de sites rendues sur la vue réelle : le périmètre et une position lisible
 * remplacent les coordonnées brutes, et le lien cartographique s'ouvre à la demande.
 */
async function verifyLocationsCards(cdp) {
  const before = failures
  console.log('browser-verify: cartes de sites')

  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
  await sleep(LAYOUT_SETTLE_MS)
  await cdp.evaluate('window.__harness.resetLocations()')

  // Les cartes montent au fil de la requête live Dexie : on laisse le rendu se stabiliser.
  const deadline = Date.now() + 5000
  let snapshot = await cdp.measure()
  while ((snapshot.locations?.cards?.length || 0) < 2 && Date.now() < deadline) {
    await sleep(250)
    snapshot = await cdp.measure()
  }
  assertShape(snapshot)

  const cards = snapshot.locations.cards
  const lyon = cards.find((card) => card.name.includes('Siège Lyon'))

  check('les cartes de sites sont rendues', () => assertTrue(cards.length >= 2, `${cards.length} cartes`))
  check('le nom du site reste lisible', () => assertTrue(Boolean(lyon), JSON.stringify(cards.map((card) => card.name))))
  const sud = cards.find((card) => card.name.includes('Dépôt Sud'))
  check('l’état de pointage est un interrupteur, pas un badge', () => {
    assertTrue(lyon?.statusChecked === true, `Lyon : coché = ${lyon?.statusChecked}`)
    assertTrue(sud?.statusChecked === false, `Dépôt Sud : coché = ${sud?.statusChecked}`)
  })
  check('l’interrupteur est nommé et libellé en clair', () => {
    assertTrue(/Actif/.test(lyon?.statusText || ''), `libellé Lyon : ${lyon?.statusText}`)
    assertTrue(/Inactif/.test(sud?.statusText || ''), `libellé Dépôt Sud : ${sud?.statusText}`)
    assertTrue((lyon?.statusAria || '').includes('Désactiver'), `aria Lyon : ${lyon?.statusAria}`)
    assertTrue((sud?.statusAria || '').includes('Activer'), `aria Dépôt Sud : ${sud?.statusAria}`)
  })
  check('le périmètre autorisé est explicite', () =>
    assertTrue((lyon?.perimeter || '').includes('120 m'), `périmètre : ${lyon?.perimeter}`)
  )
  check('les coordonnées sont lisibles et nommées par hémisphère', () => {
    assertTrue(/°\s?N/.test(lyon?.position || ''), `position : ${lyon?.position}`)
    assertTrue(/°\s?E/.test(lyon?.position || ''), `position : ${lyon?.position}`)
    assertTrue(!/Latitude|Longitude/.test(lyon?.position || ''), 'libellés bruts conservés')
  })
  check('le lien cartographique vise le point et s’ouvre de façon sûre', () => {
    assertTrue((lyon?.mapHref || '').includes('45.76404') && (lyon?.mapHref || '').includes('4.83566'), `href : ${lyon?.mapHref}`)
    assertEqual(lyon?.mapTarget, '_blank', 'cible du lien')
    assertTrue((lyon?.mapRel || '').includes('noopener'), `rel : ${lyon?.mapRel}`)
  })
  check('les actions de carte gardent 44px', () =>
    assertTrue(
      cards.every((card) => card.buttonHeights.every((height) => height >= 44)),
      JSON.stringify(cards.map((card) => card.buttonHeights))
    )
  )
  check('les actions accordent texte et icône (≥ 14px)', () =>
    assertTrue(
      cards.every((card) => card.buttonFontSizes.every((size) => parseFloat(size) >= 14)),
      JSON.stringify(cards.map((card) => card.buttonFontSizes))
    )
  )

  await cdp.evaluate("document.querySelector('#locations-host')?.scrollIntoView({ block: 'start' })")
  await sleep(250)
  const inView = await cdp.measure()
  await cdp.screenshot('locations-cards.png')

  // L'interrupteur doit réellement basculer l'état, pas seulement l'afficher.
  const target = inView.locations.cards.find((card) => card.name.includes('Siège Lyon'))
  await cdp.clickAt(target?.statusCenter)
  await sleep(400)
  const flipped = (await cdp.measure()).locations.cards.find((card) => card.name.includes('Siège Lyon'))
  check('l’interrupteur bascule l’état au clic', () => {
    assertTrue(flipped?.statusChecked === false, `état après clic : ${flipped?.statusChecked}`)
    assertTrue(/Inactif/.test(flipped?.statusText || ''), `libellé après clic : ${flipped?.statusText}`)
  })

  return failures === before
}

/**
 * La logique de filtrage actif/inactif : les comptes annoncent le contenu, et chaque état vide
 * décrit sa cause avec l'action utile, sans inviter à créer quand des sites existent déjà.
 */
async function verifyLocationsFilters(cdp) {
  const before = failures
  console.log('browser-verify: filtres de sites')

  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
  await sleep(LAYOUT_SETTLE_MS)
  await cdp.evaluate('window.__harness.resetLocations()')

  const deadline = Date.now() + 5000
  let snapshot = await cdp.measure()
  while ((snapshot.locations?.cards?.length || 0) < 2 && Date.now() < deadline) {
    await sleep(250)
    snapshot = await cdp.measure()
  }
  assertShape(snapshot)

  check('les filtres annoncent leurs comptes', () =>
    assertEqual(snapshot.locations.filters.join('|'), 'Tous (2)|Actifs (1)|Inactifs (1)', 'libellés des filtres')
  )

  await cdp.evaluate("document.querySelector('#locations-host')?.scrollIntoView({ block: 'start' })")
  await sleep(250)

  await cdp.evaluate("window.__harness.clickLocationsFilter('Inactifs')")
  await sleep(250)
  let view = await cdp.measure()
  check('le filtre « Inactifs » ne garde que les sites désactivés', () => {
    assertEqual(view.locations.cards.map((card) => card.name).join('|'), 'Dépôt Sud', 'cartes filtrées')
    assertTrue(!view.locations.empty.present, 'état vide affiché à tort')
  })

  // Le seul inactif redevient actif : la catégorie se vide sous nos yeux.
  const sudToggle = view.locations.cards.find((card) => card.name.includes('Dépôt Sud'))?.statusCenter
  await cdp.clickAt(sudToggle)
  await sleep(450)
  view = await cdp.measure()
  check('filtre vide : le message décrit l’absence de sites inactifs, sans inviter à créer', () => {
    assertTrue(view.locations.empty.present, 'état vide absent')
    assertEqual(view.locations.empty.title, 'Aucun site inactif', 'titre')
    assertTrue(!/premier site/i.test(view.locations.empty.message || ''), `message : ${view.locations.empty.message}`)
    assertEqual(view.locations.empty.action, 'Voir tous les sites', 'action proposée')
  })
  await cdp.screenshot('locations-filters.png')

  await cdp.evaluate('window.__harness.clickLocationsEmptyAction()')
  await sleep(300)
  view = await cdp.measure()
  check('l’action de l’état vide ramène tous les sites', () => {
    assertTrue(view.locations.cards.length >= 2, `${view.locations.cards.length} cartes`)
    assertTrue(!view.locations.empty.present, 'état vide persistant')
  })

  await cdp.evaluate("window.__harness.setLocationsSearch('zzz')")
  await sleep(300)
  view = await cdp.measure()
  check('recherche vide : message et action de réinitialisation', () => {
    assertTrue(view.locations.empty.present, 'état vide absent')
    assertEqual(view.locations.empty.title, 'Aucun résultat', 'titre')
    assertEqual(view.locations.empty.action, 'Effacer la recherche', 'action proposée')
  })
  await cdp.evaluate('window.__harness.clickLocationsEmptyAction()')
  await sleep(300)
  view = await cdp.measure()
  check('effacer la recherche ramène les sites', () =>
    assertTrue(view.locations.cards.length >= 2, `${view.locations.cards.length} cartes`)
  )

  return failures === before
}

const VERIFIERS = {
  theme: verifyTheme,
  sessions: verifySessions,
  'sync-alert': verifySyncAlert,
  'week-tile': verifyWeekTile,
  'status-badge': verifyStatusBadge,
  'appearance-control': verifyAppearanceControl,
  'check-overlay': verifyCheckOverlay,
  'availability-summary': verifyAvailabilitySummary,
  'nav-docking': verifyNavDocking,
  'sidebar-handle': verifySidebarHandle,
  'sidebar-rail': verifySidebarRail,
  'locations-form': verifyLocationsForm,
  'locations-cards': verifyLocationsCards,
  'locations-filters': verifyLocationsFilters,
}

async function main() {
  const chromePath = findChrome()
  if (!chromePath) {
    console.error('FAILURE browser-verify: aucun binaire Chrome trouvé, définir CHROME_PATH')
    process.exit(1)
  }

  const requested = process.argv.slice(2).filter((argument) => argument.startsWith('--')).map((argument) => argument.slice(2))
  const modes = requested.length === 0 || requested.includes('all') ? Object.keys(VERIFIERS) : requested
  const unknown = modes.filter((mode) => !VERIFIERS[mode])
  if (unknown.length > 0) {
    console.error(`FAILURE browser-verify: mode inconnu ${unknown.join(', ')}`)
    process.exit(1)
  }

  fs.mkdirSync(HARNESS_DIR, { recursive: true })
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  fs.writeFileSync(path.join(HARNESS_DIR, 'harness.html'), HARNESS_HTML)
  fs.writeFileSync(path.join(HARNESS_DIR, 'harness.js'), HARNESS_JS)

  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'presenceapp-cdp-'))
  const vite = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', '--port', String(VITE_PORT), '--strictPort', '--host', '127.0.0.1'],
    { cwd: ROOT, stdio: 'ignore' }
  )
  const chrome = spawn(
    chromePath,
    [
      '--headless',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      'about:blank',
    ],
    { stdio: 'ignore' }
  )

  let cdp = null
  const passed = new Set()
  try {
    await waitForHttp(`http://127.0.0.1:${CDP_PORT}/json/version`, 25000, 'Chrome DevTools')
    await waitForHttp(`http://127.0.0.1:${VITE_PORT}/`, 40000, 'Serveur Vite')

    const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
    const target = targets.find((entry) => entry.type === 'page')
    if (!target) throw new Error('aucune cible de page exposée par CDP')

    cdp = await Cdp.connect(target.webSocketDebuggerUrl)
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 1200,
      deviceScaleFactor: 1,
      mobile: false,
    })

    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${VITE_PORT}/__browser-harness__/harness.html` })

    const deadline = Date.now() + 30000
    let ready = false
    while (Date.now() < deadline && !ready) {
      ready = await cdp.evaluate('Boolean(window.__harnessReady)').catch(() => false)
      if (!ready) await sleep(250)
    }
    if (!ready) throw new Error('le banc d\u2019essai n\u2019a pas monté ses composants')
    await sleep(300)

    for (const mode of modes) {
      if (await VERIFIERS[mode](cdp)) passed.add(mode)
    }

    if (cdp.pageErrors.length > 0) {
      failures += 1
      console.error(`  FAIL aucune exception de page attendue -> ${cdp.pageErrors.slice(0, 3).join(' | ')}`)
    } else {
      console.log('  ok aucune exception de page pendant le parcours')
    }

    for (const mode of modes) {
      if (passed.has(mode)) console.log(TOKENS[mode])
    }

    console.log(`  copies d'écran de preuve : ${path.relative(ROOT, EVIDENCE_DIR)}`)
  } catch (error) {
    failures += 1
    console.error(`FAILURE browser-verify: ${error.message}`)
  } finally {
    if (cdp) cdp.close()
    vite.kill('SIGTERM')
    chrome.kill('SIGTERM')
    await sleep(400)
    fs.rmSync(HARNESS_DIR, { recursive: true, force: true })
    try {
      fs.rmSync(profileDir, { recursive: true, force: true })
    } catch {
      // Profil temporaire encore verrouillé par Chrome : il reste dans le répertoire temporaire système
    }
  }

  process.exit(failures === 0 ? 0 : 1)
}

await main()
