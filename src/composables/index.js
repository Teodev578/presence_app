/**
 * Point d'accès unifié aux composables de PresenceApp.
 * Expose l'ensemble de la logique d'état réactive organisée par domaine.
 */

// Authentification & Utilisateur
export * from './auth/useAuth.js';
export * from './auth/useProfile.js';

// Domaine & Données métier
export * from './domain/usePresences.js';
export * from './domain/useAbsenceRequests.js';
export * from './domain/useAvailabilities.js';
export * from './domain/useLocations.js';

// Infrastructure & PWA
export * from './infra/useSyncEngine.js';
export * from './infra/useGeolocation.js';
export * from './infra/useDevicePermissions.js';
export * from './infra/usePwaInstall.js';

// Interface & Expérience utilisateur
export * from './ui/useTheme.js';
export * from './ui/useSidebarNav.js';
export * from './ui/useNotifications.js';
export * from './ui/useToast.js';
