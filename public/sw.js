/**
 * Service Worker PWA de PresenceApp
 * Gestion de la synchronisation d'arrière-plan (Background Sync API).
 */

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Déclencheur Background Sync (Chrome / Chromium / Edge / Android)
self.addEventListener('sync', (event) => {
  if (event.tag === 'presence-outbox-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        if (clients && clients.length > 0) {
          for (const client of clients) {
            client.postMessage({ type: 'TRIGGER_SYNC' })
          }
        }
      })
    )
  }
})

// Écouteur de requêtes réseau garantissant la reconnaissance PWA par les navigateurs
self.addEventListener('fetch', (event) => {
  // Laisse le réseau et le cache natif répondre normalement
})

