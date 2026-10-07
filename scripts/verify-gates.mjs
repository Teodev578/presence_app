#!/usr/bin/env node

/**
 * Point d'entrée principal et façade de vérification déterministe des portes d'acceptation (GATES.md)
 *
 * Architecture modulaire scindée sous scripts/gates/ :
 * - scripts/gates/utils.mjs           : Utilitaires partagés d'analyse statique et reporting
 * - scripts/gates/checks/ui.mjs       : Conformité M3, emojis, radii, ombres, cibles tactiles, animations GPU, voix
 * - scripts/gates/checks/theme.mjs    : Commutateur de thème et CSS binaire
 * - scripts/gates/checks/navigation.mjs: Tiroirs, ancrage à 840px, repli rail d'icônes, poignée, passerelles
 * - scripts/gates/checks/manager.mjs  : Vues gestionnaire, lieux, présences, Dexie local-first, LiveQuery
 * - scripts/gates/checks/auth-accounts.mjs: Cycle de vie, cloche, notifications, OTP, prénom/nom
 * - scripts/gates/checks/absence.mjs  : Demandes d'absence, synchronisation outbox, notifications, UI
 * - scripts/gates/checks/system.mjs   : Compilation Vite, app shell/loading, favicon PWA, boucle de connaissances
 * - scripts/gates/runner.mjs          : Registre dynamique Map des 84 flags et exécution ordonnée
 */

import { runCli } from './gates/runner.mjs';

// Réexport de tous les oracles individuels pour rétrocompatibilité totale
export * from './gates/checks/ui.mjs';
export * from './gates/checks/theme.mjs';
export * from './gates/checks/navigation.mjs';
export * from './gates/checks/manager.mjs';
export * from './gates/checks/auth-accounts.mjs';
export * from './gates/checks/absence.mjs';
export * from './gates/checks/system.mjs';
export { runAll, ORACLES_MAP } from './gates/runner.mjs';

// Exécution CLI
runCli(process.argv.slice(2));
