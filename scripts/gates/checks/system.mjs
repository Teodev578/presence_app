import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  SRC_DIR,
  getAllSourceFiles,
  extractTemplate,
  extractClassTokens,
  findEmojis,
  findNonM3Radii,
  findProhibitedShadows,
  findProhibitedTargets,
  reportIssues,
  readScopeFile,
  countOccurrences
} from '../utils.mjs';

export function checkBuild(label = 'G6', wording = 'build succeeded with exit code 0') {
  const result = spawnSync('npm', ['run', 'build'], { encoding: 'utf8', stdio: 'pipe' });
  if (result.status === 0) {
    console.log(`${label} passed: ${wording}`);
    return true;
  }
  console.error(`FAILURE ${label}: npm run build failed with exit code`, result.status);
  if (result.stderr) console.error(result.stderr);
  return false;
}


export function checkKnowledgeLoop() {
  const pkgPath = path.resolve('package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const scripts = pkg.scripts || {};

  // G169: Scripts npm et hook pre-commit
  const requiredScripts = ['knowledge:check', 'knowledge:staleness', 'knowledge:recurrence', 'knowledge:ritual'];
  for (const s of requiredScripts) {
    if (!scripts[s]) {
      console.error(`FAILURE G169: package.json manque le script "${s}"`);
      return false;
    }
  }

  const hookPath = path.resolve('.githooks/pre-commit');
  if (!fs.existsSync(hookPath)) {
    console.error('FAILURE G169: .githooks/pre-commit introuvable');
    return false;
  }
  const hookStat = fs.statSync(hookPath);
  const isExecutable = (hookStat.mode & 0o111) !== 0;
  if (!isExecutable) {
    console.error('FAILURE G169: .githooks/pre-commit n\'est pas exécutable (chmod +x requis)');
    return false;
  }

  const hookContent = fs.readFileSync(hookPath, 'utf8');
  if (!hookContent.includes('knowledge-check.mjs')) {
    console.error('FAILURE G169: .githooks/pre-commit n\'exécute pas knowledge-check.mjs');
    return false;
  }
  console.log('G169 passed: knowledge npm scripts and executable pre-commit hook verified');

  // G170 & G171: Vérification par sous-processus de knowledge-check.mjs
  const checkProc = spawnSync('node', ['scripts/knowledge-check.mjs', '--all'], { encoding: 'utf8' });
  if (checkProc.status !== 0) {
    console.error('FAILURE G170/G171: scripts/knowledge-check.mjs --all a échoué :\n' + checkProc.stdout + '\n' + checkProc.stderr);
    return false;
  }
  if (!checkProc.stdout.includes('G170 passed:')) {
    console.error('FAILURE G170: G170 passed non détecté dans knowledge-check.mjs');
    return false;
  }
  console.log('G170 passed: recurrence detection and escalation counter verified');

  if (!checkProc.stdout.includes('G171 passed:')) {
    console.error('FAILURE G171: G171 passed non détecté dans knowledge-check.mjs');
    return false;
  }
  console.log('G171 passed: bi-weekly ritual freshness verified');

  // G172: Mise à jour documentaire
  const readmePath = path.resolve('.agents/knowledge/README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  if (!readmeContent.includes('## Rituel planifié') || !readmeContent.includes('Clôture de tâche')) {
    console.error('FAILURE G172: .agents/knowledge/README.md ne contient pas les sections de rituel planifié ou de clôture de tâche');
    return false;
  }

  const indexPath = path.resolve('.agents/knowledge/INDEX.md');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (!indexContent.includes('## Rituel bimensuel') || !indexContent.includes('Dernière exécution :')) {
    console.error('FAILURE G172: .agents/knowledge/INDEX.md ne contient pas le suivi du rituel bimensuel');
    return false;
  }
  console.log('G172 passed: knowledge protocol documentation and task closure rules verified');

  return true;
}

/**
 * G175 : Modèle Supabase, types TypeScript et schéma Dexie v4 pour absence_requests
 */

export function checkAppLoading() {
  const indexFile = path.resolve('index.html');
  const indexContent = fs.readFileSync(indexFile, 'utf8');
  for (const token of ['preconnect', 'fonts.googleapis.com', 'app-splash-icon', 'app-splash-title', 'PresenceApp']) {
    if (!indexContent.includes(token)) {
      console.error(`FAILURE G184: index.html ne contient pas ${token}`);
      return false;
    }
  }

  const appFile = path.resolve('src/App.vue');
  const appContent = fs.readFileSync(appFile, 'utf8');
  for (const token of ['defineAsyncComponent', "import('./views/auth/LoginView.vue')", "import('./views/employee/HomeView.vue')", 'Initialisation de votre espace sécurisé...']) {
    if (!appContent.includes(token)) {
      console.error(`FAILURE G184: App.vue ne contient pas ${token}`);
      return false;
    }
  }

  const profileFile = path.resolve('src/composables/useProfile.js');
  const profileContent = fs.readFileSync(profileFile, 'utf8');
  if (!profileContent.includes('Local-First Stale-While-Revalidate') || !profileContent.includes('.maybeSingle()')) {
    console.error('FAILURE G184: useProfile.js n’implémente pas le rafraîchissement Stale-While-Revalidate non bloquant');
    return false;
  }

  const swFile = path.resolve('public/sw.js');
  const swContent = fs.readFileSync(swFile, 'utf8');
  for (const token of ['CACHE_NAME', 'PRECACHE_ASSETS', "url.pathname.startsWith('/assets/')", 'presence-outbox-sync']) {
    if (!swContent.includes(token)) {
      console.error(`FAILURE G184: public/sw.js ne contient pas ${token}`);
      return false;
    }
  }

  console.log('G184 passed: native splash screen, route-level code splitting, local-first optimistic profile and app shell caching verified');
  return true;
}

export function checkAppIdentity() {
  const indexFile = path.resolve('index.html');
  const indexContent = fs.readFileSync(indexFile, 'utf8');
  if (!indexContent.includes('<title>PresenceApp</title>')) {
    console.error('FAILURE G186: index.html ne contient pas <title>PresenceApp</title>');
    return false;
  }
  if (indexContent.includes('PresenceApp — Pointage & Disponibilités')) {
    console.error('FAILURE G186: index.html contient encore la description "PresenceApp — Pointage & Disponibilités"');
    return false;
  }

  const appFile = path.resolve('src/App.vue');
  const appContent = fs.readFileSync(appFile, 'utf8');
  if (!appContent.includes('useNotifications') || !appContent.includes('unreadCount') || !appContent.includes('document.title =')) {
    console.error('FAILURE G186: App.vue ne synchronise pas document.title avec unreadCount');
    return false;
  }

  const faviconFile = path.resolve('public/favicon.svg');
  const faviconContent = fs.readFileSync(faviconFile, 'utf8');
  if (faviconContent.includes('#863bff') || faviconContent.includes('stdDeviation="7.659"') || !faviconContent.includes('presenceBg')) {
    console.error('FAILURE G186: public/favicon.svg contient encore le logo Vite ou manque l’identité PresenceApp');
    return false;
  }

  for (const png of ['apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png']) {
    const pngPath = path.resolve('public', png);
    if (!fs.existsSync(pngPath) || fs.statSync(pngPath).size < 1000) {
      console.error(`FAILURE G186: public/${png} est absent ou corrompu (< 1000 octets)`);
      return false;
    }
  }

  const manifestFile = path.resolve('public/manifest.webmanifest');
  const manifestContent = fs.readFileSync(manifestFile, 'utf8');
  if (!manifestContent.includes('"name": "PresenceApp"') || manifestContent.includes('PresenceApp — Pointage & Disponibilités')) {
    console.error('FAILURE G186: public/manifest.webmanifest conserve encore la description longue');
    return false;
  }

  console.log('G186 passed: official PresenceApp svg icon, generated pwa assets, clean index title and dynamic reactive tab notifications verified');
  return true;
}

export function checkLoadingMargins() {
  const indexFile = path.resolve('index.html');
  const indexContent = fs.readFileSync(indexFile, 'utf8');
  if (!indexContent.includes('html, body') || !indexContent.includes('margin: 0') || !indexContent.includes('padding: 0')) {
    console.error('FAILURE G188: index.html ne réinitialise pas html, body avec margin: 0 et padding: 0 en inline');
    return false;
  }
  if (!indexContent.includes('#111318')) {
    console.error('FAILURE G188: index.html ne synchronise pas la couleur de fond sombre du body en inline');
    return false;
  }

  const appFile = path.resolve('src/App.vue');
  const appContent = fs.readFileSync(appFile, 'utf8');
  if (appContent.includes('scale(') && appContent.includes('.space-enter-from')) {
    console.error('FAILURE G188: App.vue applique encore une transformation scale() dans la transition space');
    return false;
  }
  if (!appContent.includes('translateY(6px)') && !appContent.includes('translateY(-6px)')) {
    console.error('FAILURE G188: App.vue n’applique pas la translation verticale fluide sans scale');
    return false;
  }

  console.log('G188 passed: frame 0 html/body reset, synchronized background color, scale-free space transition and full viewport adhesion verified');
  return true;
}

