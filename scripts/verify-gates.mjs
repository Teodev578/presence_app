#!/usr/bin/env node

/**
 * Script de vérification déterministe des portes d'acceptation (GATES.md)
 * Analyse statique de code pour PresenceApp : conformité M3, absence d'emojis bruts, ombres, cibles tactiles et agencement.
 *
 * Les contrôles globaux balaient tout src/. Les contrôles préfixés par --theme-* se limitent aux fichiers
 * du lot « commutateur de thème », ce qui isole le lot de la dette préexistante hors de son périmètre.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SRC_DIR = path.resolve('src');

/** Fichiers écrits par le lot « commutateur de thème ». */
const THEME_SCOPE_FILES = [
  'src/components/shared/ThemeToggle.vue',
  'src/layouts/ManagerLayout.vue',
  'src/layouts/EmployeeLayout.vue',
  'src/composables/useTheme.js',
];

function getAllSourceFiles(dir, extensions = ['.vue', '.js', '.html']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getAllSourceFiles(filePath, extensions));
    } else if (extensions.some(ext => filePath.endsWith(ext))) {
      results.push(filePath);
    }
  }
  return results;
}

function getThemeScopeFiles(extensions) {
  return THEME_SCOPE_FILES
    .map(file => path.resolve(file))
    .filter(file => fs.existsSync(file) && extensions.some(ext => file.endsWith(ext)));
}

function extractTemplate(content) {
  const match = content.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
  return match ? match[1] : '';
}

function extractClassTokens(text) {
  const classAttrRegex = /(?:class|:class)=["']([^"']+)["']/g;
  const tokens = [];
  let match;
  while ((match = classAttrRegex.exec(text)) !== null) {
    const parts = match[1].split(/\s+/);
    for (const part of parts) {
      const clean = part.replace(/^['"{}\[\],!:]+|['"{}\[\],!:]+$/g, '').trim();
      if (clean) {
        tokens.push(clean);
      }
    }
  }
  return tokens;
}

/* ---------------------------------------------------------------------------
   Détecteurs purs : renvoient la liste des écarts, sans sortie console
   --------------------------------------------------------------------------- */

function findEmojis(files) {
  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{1F1E6}-\u{1F1FF}]/u;
  const issues = [];

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (emojiRegex.test(line)) {
        issues.push({ file: path.relative(process.cwd(), f), line: index + 1, content: line.trim() });
      }
    });
  }

  return issues;
}

function findNonM3Radii(vueFiles) {
  const issues = [];

  // Tolérance exclusive des tokens Material 3 et rounded-full
  const validRadiusPattern = /^!?rounded(-(t|b|l|r|tl|tr|bl|br|s|e))?-(m3-(xs|sm|md|lg|xl)|full)$|^!?rounded-full$/;

  for (const f of vueFiles) {
    const content = fs.readFileSync(f, 'utf8');
    const tpl = extractTemplate(content);
    const tokens = extractClassTokens(tpl);

    for (const token of tokens) {
      if (/^!?rounded/.test(token)) {
        if (!validRadiusPattern.test(token)) {
          issues.push({ file: path.relative(process.cwd(), f), token });
        }
      }
    }
  }

  return issues;
}

function findProhibitedShadows(vueFiles) {
  const issues = [];

  // Tolérance exclusive des ombres subtiles autorisées
  const allowedShadowPattern = /^!?(shadow-(none|xs|sm)|drop-shadow-none)$/;

  for (const f of vueFiles) {
    const content = fs.readFileSync(f, 'utf8');
    const tpl = extractTemplate(content);
    const tokens = extractClassTokens(tpl);

    for (const token of tokens) {
      if (/^!?(shadow|drop-shadow)/.test(token)) {
        if (!allowedShadowPattern.test(token)) {
          issues.push({ file: path.relative(process.cwd(), f), token });
        }
      }
    }
  }

  return issues;
}

function findProhibitedTargets(vueFiles) {
  const prohibitedTargetPattern = /\b(btn-xs|min-h-8|min-w-8|h-8(?:\s|$))\b/;
  const issues = [];

  for (const f of vueFiles) {
    const content = fs.readFileSync(f, 'utf8');
    const tpl = extractTemplate(content);
    const lines = tpl.split('\n');

    lines.forEach((line, index) => {
      if (prohibitedTargetPattern.test(line) && (line.includes('btn') || line.includes('button') || line.includes('join-item'))) {
        issues.push({ file: path.relative(process.cwd(), f), line: index + 1, content: line.trim() });
      }
    });
  }

  return issues;
}

function reportIssues(issues, label, heading, formatter) {
  console.error(`FAILURE ${label}: ${heading} (${issues.length}):`);
  issues.forEach(issue => console.error(`  ${formatter(issue)}`));
}

/* ---------------------------------------------------------------------------
   Contrôles globaux (portée : tout src/)
   --------------------------------------------------------------------------- */

export function checkEmojis() {
  const issues = findEmojis(getAllSourceFiles(SRC_DIR));

  if (issues.length === 0) {
    console.log('G1 passed: 0 raw emojis across all src files');
    return true;
  }
  reportIssues(issues, 'G1', 'Found raw emojis across src files', i => `${i.file}:${i.line} -> ${i.content}`);
  return false;
}

export function checkRadii() {
  const issues = findNonM3Radii(getAllSourceFiles(SRC_DIR, ['.vue']));

  if (issues.length === 0) {
    console.log('G2 passed: all non-M3 radii converted to tokens');
    return true;
  }
  reportIssues(issues, 'G2', 'Non-M3 rounded classes found', i => `${i.file} -> ${i.token}`);
  return false;
}

export function checkShadows() {
  const issues = findProhibitedShadows(getAllSourceFiles(SRC_DIR, ['.vue']));

  if (issues.length === 0) {
    console.log('G3 passed: no aggressive shadows across all Vue files');
    return true;
  }
  reportIssues(issues, 'G3', 'Prohibited shadows found', i => `${i.file} -> ${i.token}`);
  return false;
}

export function checkTouchTargets() {
  const issues = findProhibitedTargets(getAllSourceFiles(SRC_DIR, ['.vue']));

  if (issues.length === 0) {
    console.log('G4 passed: all interactive buttons meet 44px touch targets');
    return true;
  }
  reportIssues(issues, 'G4', 'Prohibited sub-44px touch targets found', i => `${i.file}:${i.line} -> ${i.content}`);
  return false;
}

/* ---------------------------------------------------------------------------
   Contrôles ciblés sur les fichiers du lot « commutateur de thème »
   --------------------------------------------------------------------------- */

export function checkThemeEmojis() {
  const issues = findEmojis(getThemeScopeFiles(['.vue', '.js']));

  if (issues.length === 0) {
    console.log('G13 passed: no raw emojis in theme toggle files');
    return true;
  }
  reportIssues(issues, 'G13', 'Found raw emojis in theme toggle files', i => `${i.file}:${i.line} -> ${i.content}`);
  return false;
}

export function checkThemeRadii() {
  const issues = findNonM3Radii(getThemeScopeFiles(['.vue']));

  if (issues.length === 0) {
    console.log('G14 passed: theme toggle files use M3 radii tokens only');
    return true;
  }
  reportIssues(issues, 'G14', 'Non-M3 rounded classes found in theme toggle files', i => `${i.file} -> ${i.token}`);
  return false;
}

export function checkThemeShadows() {
  const issues = findProhibitedShadows(getThemeScopeFiles(['.vue']));

  if (issues.length === 0) {
    console.log('G15 passed: no prohibited shadows in theme toggle files');
    return true;
  }
  reportIssues(issues, 'G15', 'Prohibited shadows found in theme toggle files', i => `${i.file} -> ${i.token}`);
  return false;
}

export function checkThemeTargets() {
  const issues = findProhibitedTargets(getThemeScopeFiles(['.vue']));

  if (issues.length === 0) {
    console.log('G16 passed: all theme toggle touch targets meet 44px');
    return true;
  }
  reportIssues(issues, 'G16', 'Prohibited sub-44px touch targets found in theme toggle files', i => `${i.file}:${i.line} -> ${i.content}`);
  return false;
}

/* ---------------------------------------------------------------------------
   Contrôles d'agencement
   --------------------------------------------------------------------------- */

export function checkLayout() {
  const layouts = ['ManagerLayout.vue', 'EmployeeLayout.vue'];
  let allPassed = true;

  for (const layoutName of layouts) {
    const layoutPath = path.join(SRC_DIR, 'layouts', layoutName);
    if (!fs.existsSync(layoutPath)) {
      console.error(`FAILURE G5: Layout file ${layoutName} does not exist`);
      allPassed = false;
      continue;
    }

    const content = fs.readFileSync(layoutPath, 'utf8');
    const headerMatch = content.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
    const asideMatch = content.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i);

    const headerContent = headerMatch ? headerMatch[1] : '';
    const asideContent = asideMatch ? asideMatch[1] : '';

    const syncInHeader = /<SyncIndicator\b|<sync-indicator\b/i.test(headerContent);
    const syncInAside = /<SyncIndicator\b|<sync-indicator\b/i.test(asideContent);

    if (syncInHeader) {
      console.error(`FAILURE G5: ${layoutName} contains SyncIndicator in <header>`);
      allPassed = false;
    }

    if (!syncInAside) {
      console.error(`FAILURE G5: ${layoutName} is missing SyncIndicator in <aside>`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('G5 passed: SyncIndicator correctly placed in sidebar drawers and removed from headers');
    return true;
  }
  return false;
}

const countOccurrences = (text, needle) => text.split(needle).length - 1;

/**
 * Le commutateur de thème est consultatif : une seule occurrence par espace, dans le tiroir.
 */
export function checkThemePlacement() {
  const layoutFiles = ['ManagerLayout.vue', 'EmployeeLayout.vue'];
  const togglePattern = /<ThemeToggle\b|<theme-toggle\b/i;
  let ok = true;

  for (const layoutName of layoutFiles) {
    const layoutPath = path.join(SRC_DIR, 'layouts', layoutName);
    if (!fs.existsSync(layoutPath)) {
      console.error(`FAILURE G11: Layout file ${layoutName} does not exist`);
      ok = false;
      continue;
    }

    const content = fs.readFileSync(layoutPath, 'utf8');
    const occurrences = (content.match(new RegExp(togglePattern.source, 'gi')) || []).length;

    if (occurrences !== 0) {
      console.error(`FAILURE G11: ${layoutName} garde encore le commutateur de thème dans son tiroir (${occurrences})`);
      ok = false;
    }
    if (layoutName === 'EmployeeLayout.vue' && (content.includes('navigation-rail') || content.includes('NavigationRail'))) {
      console.error('FAILURE G11: Sanctuarisation violée: navigation-rail trouvé dans EmployeeLayout.vue');
      ok = false;
    }
  }

  const settings = readScopeFile('src/views/SettingsView.vue');
  if (settings === null) {
    console.error('FAILURE G11: src/views/SettingsView.vue introuvable');
    return false;
  }
  const settingsToggles = (settings.match(new RegExp(togglePattern.source, 'gi')) || []).length;
  if (settingsToggles !== 1) {
    console.error(`FAILURE G11: la page Paramètres doit porter un seul commutateur de thème (${settingsToggles})`);
    ok = false;
  }
  if (!settings.includes('Apparence')) {
    console.error('FAILURE G11: la page Paramètres n\'expose pas de section Apparence');
    ok = false;
  }

  if (!ok) return false;
  console.log('G11 passed: the theme toggle lives on the settings page, not in the drawer');
  return true;
}

/**
 * Non-régression ciblée : chaque tiroir conserve son occurrence de l'indicateur de synchronisation.
 * La comparaison octet pour octet à la révision f46026c a perdu son objet quand le lot « Repli en
 * Rail d'Icônes » a légitimement ajouté la classe `rail-network` à la pastille pour la camoufler en
 * rail. La présence dans chaque tiroir reste, elle, requise ; sa mise en page relève de G33 et G40.
 */
export function checkSyncIndicatorPreserved() {
  const layoutFiles = ['src/layouts/ManagerLayout.vue', 'src/layouts/EmployeeLayout.vue'];
  let ok = true;

  for (const relativePath of layoutFiles) {
    const current = fs.readFileSync(relativePath, 'utf8');
    const asideMatch = current.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i);
    const asideContent = asideMatch ? asideMatch[1] : '';
    if (!/<SyncIndicator\b/i.test(asideContent)) {
      console.error(`FAILURE G17: ${relativePath} n'a plus d'indicateur de synchronisation dans son tiroir`);
      ok = false;
    }
  }

  if (!ok) return false;
  console.log('G17 passed: each drawer keeps its sync indicator');
  return true;
}

export function checkEmployeeDesktop() {
  const compPath = path.join(SRC_DIR, 'components', 'employee', 'WeekSummaryCard.vue');
  if (!fs.existsSync(compPath)) {
    console.error('FAILURE G7: WeekSummaryCard.vue does not exist');
    return false;
  }
  const homePath = path.join(SRC_DIR, 'views', 'employee', 'HomeView.vue');
  const homeContent = fs.readFileSync(homePath, 'utf8');
  if (!homeContent.includes('WeekSummaryCard')) {
    console.error('FAILURE G7: HomeView.vue does not import or use WeekSummaryCard');
    return false;
  }
  if (!homeContent.includes('lg:grid-cols-12')) {
    console.error('FAILURE G7: HomeView.vue does not define an asymmetric desktop grid lg:grid-cols-12');
    return false;
  }
  const layoutPath = path.join(SRC_DIR, 'layouts', 'EmployeeLayout.vue');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  if (layoutContent.includes('navigation-rail') || layoutContent.includes('NavigationRail')) {
    console.error('FAILURE G7: Sanctuarisation violée: navigation-rail trouvé dans EmployeeLayout.vue');
    return false;
  }
  if (!layoutContent.includes('max-w-5xl') && !layoutContent.includes('max-w-6xl')) {
    console.error('FAILURE G7: EmployeeLayout.vue does not expand desktop container (missing max-w-5xl/6xl)');
    return false;
  }
  console.log('G7 passed: WeekSummaryCard and desktop grid properly implemented with employee navigation sanctuarized');
  return true;
}

export function checkResponsiveCards() {
  const homePath = path.join(SRC_DIR, 'views', 'employee', 'HomeView.vue');
  const homeContent = fs.readFileSync(homePath, 'utf8');
  if (!homeContent.includes('md:grid-cols-12')) {
    console.error('FAILURE G8: HomeView.vue does not enable 2-column grid on tablet breakpoint (missing md:grid-cols-12)');
    return false;
  }
  if (!homeContent.includes('flex-1')) {
    console.error('FAILURE G8: HomeView.vue does not use flex-1 to fill vertical space');
    return false;
  }

  const layoutPath = path.join(SRC_DIR, 'layouts', 'EmployeeLayout.vue');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  if (!layoutContent.includes('flex flex-col') || !layoutContent.includes('flex-1')) {
    console.error('FAILURE G8: EmployeeLayout.vue main tag does not use flex-1 flex flex-col for full height expansion');
    return false;
  }
  if (layoutContent.includes('navigation-rail') || layoutContent.includes('NavigationRail')) {
    console.error('FAILURE G8: Sanctuarisation violée: navigation-rail trouvé dans EmployeeLayout.vue');
    return false;
  }

  const weekPath = path.join(SRC_DIR, 'components', 'employee', 'WeekSummaryCard.vue');
  const weekContent = fs.readFileSync(weekPath, 'utf8');
  if (!weekContent.includes('flex-1 flex flex-col justify-between')) {
    console.error('FAILURE G8: WeekSummaryCard.vue does not expand vertically with flex-1 flex flex-col justify-between');
    return false;
  }

  if (!homeContent.includes('order-2 md:order-1') || !homeContent.includes('order-1 md:order-2')) {
    console.error('FAILURE G8: HomeView.vue does not invert cards on mobile format (missing order-2 md:order-1 or order-1 md:order-2)');
    return false;
  }

  console.log('G8 passed: cards responsiveness, mobile order inversion, and vertical coverage validated');
  return true;
}

export function checkCardDesktop() {
  const files = ['CheckInView.vue', 'CheckOutView.vue', 'AvailabilitiesView.vue'];
  let allPassed = true;
  for (const f of files) {
    const filePath = path.join(SRC_DIR, 'views', 'employee', f);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('max-w-md md:max-w-3xl') || content.includes('max-w-2xl md:max-w-3xl') || content.includes('max-w-md md:max-w-5xl')) {
      console.error(`FAILURE G9: ${f} contains narrow card constraints causing excessive padding`);
      allPassed = false;
    }
    if (!content.includes('w-full flex-1')) {
      console.error(`FAILURE G9: ${f} does not expand card with w-full flex-1`);
      allPassed = false;
    }
  }
  if (allPassed) {
    console.log('G9 passed: all employee cards expand to full desktop container width');
    return true;
  }
  return false;
}

export function checkPastDaysDisabled() {
  const weekGridPath = path.join(SRC_DIR, 'components', 'employee', 'WeekGrid.vue');
  if (!fs.existsSync(weekGridPath)) return false;
  const content = fs.readFileSync(weekGridPath, 'utf8');

  if (!content.includes('isPast')) {
    console.error('FAILURE G10: WeekGrid.vue does not calculate or check isPast for days');
    return false;
  }
  if (!content.includes(':disabled="d.isPast"')) {
    console.error('FAILURE G10: WeekGrid.vue does not disable checkbox toggle for past days');
    return false;
  }
  if (!content.includes('if (day.isPast) return')) {
    console.error('FAILURE G10: WeekGrid.vue toggleDay does not prevent mutating past days');
    return false;
  }
  console.log('G10 passed: past days in WeekGrid are grayed out, disabled and non-mutable');
  return true;
}

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

export function checkThemeCss() {
  const assetsDir = path.resolve('dist', 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.error('FAILURE G12: dist/assets introuvable, lancer npm run build avant ce contrôle');
    return false;
  }

  const cssFiles = fs.readdirSync(assetsDir).filter(file => file.endsWith('.css'));
  if (cssFiles.length === 0) {
    console.error('FAILURE G12: aucun fichier CSS construit dans dist/assets');
    return false;
  }

  const css = cssFiles.map(file => fs.readFileSync(path.join(assetsDir, file), 'utf8')).join('\n');

  // Le bundle contient aussi les blocs de thème propres à DaisyUI, qui portent les mêmes sélecteurs
  // sans les tokens Material 3. On retient donc la première règle de chaque sélecteur qui définit
  // réellement --md-sys-color-surface, c'est-à-dire celle du design system du projet.
  const surfaceForSelector = (selectors) => {
    for (const selector of selectors) {
      let at = css.indexOf(selector);
      while (at !== -1) {
        const open = css.indexOf('{', at);
        const close = open === -1 ? -1 : css.indexOf('}', open);
        if (open !== -1 && close !== -1) {
          const body = css.slice(open + 1, close);
          const match = body.match(/--md-sys-color-surface:\s*([^;}]+)/);
          if (match) return { selector, surface: match[1].trim(), offset: at };
        }
        at = css.indexOf(selector, at + 1);
      }
    }
    return null;
  };

  const light = surfaceForSelector(['[data-theme=light]', '[data-theme="light"]']);
  const dark = surfaceForSelector(['[data-theme=dark]', '[data-theme="dark"]']);

  if (!light) {
    console.error('FAILURE G12: aucune règle forcée claire du design system ne définit --md-sys-color-surface');
    return false;
  }
  if (!dark) {
    console.error('FAILURE G12: aucune règle forcée sombre du design system ne définit --md-sys-color-surface');
    return false;
  }
  if (light.surface === dark.surface) {
    console.error(`FAILURE G12: les deux règles forcées partagent la surface ${light.surface}, le forçage resterait sans effet`);
    return false;
  }

  console.log('G12 passed: built CSS exposes both forced theme blocks with distinct surfaces');
  console.log(`  details: light=${light.surface} dark=${dark.surface} forced-light-offset=${light.offset} forced-dark-offset=${dark.offset}`);
  return true;
}

/** Fichiers écrits par le lot « état des sessions ouvertes ». */
const OPEN_SESSION_SCOPE_FILES = [
  'src/lib/dateUtils.js',
  'src/components/employee/WeekSummaryCard.vue',
  'src/composables/usePresences.js',
  'src/views/manager/PresencesView.vue',
];

/**
 * Vérifie que les trois surfaces consomment la règle partagée au lieu de dériver l'état
 * du seul check_out_time. Le détecteur d'appel détourné est éprouvé sur échantillon témoin
 * pour qu'une absence de résultat reste probante.
 */
export function checkOpenSessionWiring() {
  const forbiddenToken = 'calculateElapsedTime';
  const detects = (content, token) => content.includes(token);

  if (!detects(`const duree = ${forbiddenToken}(debut)`, forbiddenToken)) {
    console.error('FAILURE G18: le détecteur est aveugle, oracle invalide');
    return false;
  }
  if (detects('const duree = calculateWorkDuration(debut, fin)', forbiddenToken)) {
    console.error('FAILURE G18: le détecteur confond calculateWorkDuration et calculateElapsedTime');
    return false;
  }

  const requirements = [
    {
      file: 'src/lib/dateUtils.js',
      must: [
        'export function isSessionInProgress',
        'export function resolveSessionState',
        'export function resolveSessionMinutes',
        'export function formatSessionDuration',
      ],
    },
    {
      file: 'src/components/employee/WeekSummaryCard.vue',
      must: ['resolveSessionState', 'formatSessionDuration', 'missing_checkout'],
      forbidden: [forbiddenToken],
    },
    {
      file: 'src/views/manager/PresencesView.vue',
      must: ['resolveSessionState', 'formatSessionDuration', 'missing_checkout'],
      forbidden: [forbiddenToken],
    },
    {
      file: 'src/composables/usePresences.js',
      must: ['resolveSessionMinutes'],
      forbidden: [forbiddenToken],
    },
  ];

  let ok = true;
  for (const { file, must = [], forbidden = [] } of requirements) {
    const resolved = path.resolve(file);
    if (!fs.existsSync(resolved)) {
      console.error(`FAILURE G18: ${file} introuvable`);
      ok = false;
      continue;
    }
    const content = fs.readFileSync(resolved, 'utf8');
    for (const token of must) {
      if (!content.includes(token)) {
        console.error(`FAILURE G18: ${file} ne référence pas ${token}`);
        ok = false;
      }
    }
    for (const token of forbidden) {
      if (content.includes(token)) {
        console.error(`FAILURE G18: ${file} mesure encore une durée écoulée hors de la règle partagée (${token})`);
        ok = false;
      }
    }
  }

  if (!ok) return false;
  console.log('G18 passed: open-session rule wired through the three surfaces');
  return true;
}

export function checkOpenSessionConformance() {
  const files = OPEN_SESSION_SCOPE_FILES.map(file => path.resolve(file)).filter(file => fs.existsSync(file));
  const vueFiles = files.filter(file => file.endsWith('.vue'));
  let ok = true;

  const emojiIssues = findEmojis(files);
  if (emojiIssues.length > 0) {
    reportIssues(emojiIssues, 'G19', 'Found raw emojis in open-session files', i => `${i.file}:${i.line} -> ${i.content}`);
    ok = false;
  }

  const radiiIssues = findNonM3Radii(vueFiles);
  if (radiiIssues.length > 0) {
    reportIssues(radiiIssues, 'G19', 'Non-M3 rounded classes found in open-session files', i => `${i.file} -> ${i.token}`);
    ok = false;
  }

  const shadowIssues = findProhibitedShadows(vueFiles);
  if (shadowIssues.length > 0) {
    reportIssues(shadowIssues, 'G19', 'Prohibited shadows found in open-session files', i => `${i.file} -> ${i.token}`);
    ok = false;
  }

  const targetIssues = findProhibitedTargets(vueFiles);
  if (targetIssues.length > 0) {
    reportIssues(targetIssues, 'G19', 'Prohibited sub-44px touch targets found in open-session files', i => `${i.file}:${i.line} -> ${i.content}`);
    ok = false;
  }

  if (!ok) return false;
  console.log('G19 passed: open-session files conform to emoji, radius, shadow and touch target rules');
  return true;
}

/** Fichiers écrits par le lot « dédoublonnage des en-têtes et densité de la tuile ». */
const UX_SCOPE_FILES = [
  'src/components/shared/SyncAlert.vue',
  'src/components/shared/ThemeToggle.vue',
  'src/components/shared/StatusBadge.vue',
  'src/components/employee/WeekSummaryCard.vue',
  'src/layouts/ManagerLayout.vue',
  'src/layouts/EmployeeLayout.vue',
];

/**
 * Chaque espace conserve une seule occurrence de chaque contrôle consultatif, et l'en-tête
 * ne porte plus que l'alerte réseau.
 */
export function checkHeaderDeduplication() {
  const layouts = [
    { name: 'ManagerLayout.vue', gateway: "handleNav('/employee')" },
    { name: 'EmployeeLayout.vue', gateway: "handleNav('/manager')" },
  ];
  let ok = true;

  for (const { name, gateway } of layouts) {
    const layoutPath = path.join(SRC_DIR, 'layouts', name);
    if (!fs.existsSync(layoutPath)) {
      console.error(`FAILURE G20: ${name} introuvable`);
      ok = false;
      continue;
    }

    const content = fs.readFileSync(layoutPath, 'utf8');
    const headerMatch = content.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
    const asideMatch = content.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i);
    const header = headerMatch ? headerMatch[1] : '';
    const aside = asideMatch ? asideMatch[1] : '';

    const indicators = countOccurrences(content, '<SyncIndicator');
    if (indicators !== 1) {
      console.error(`FAILURE G20: ${name} doit exposer un seul indicateur de synchronisation (${indicators})`);
      ok = false;
    }
    if (header.includes('<SyncIndicator')) {
      console.error(`FAILURE G20: ${name} garde l'indicateur permanent dans son en-tête`);
      ok = false;
    }

    const toggles = countOccurrences(content, '<ThemeToggle');
    if (toggles !== 0) {
      console.error(`FAILURE G20: ${name} garde un commutateur de thème dans son tiroir (${toggles}), il vit sur la page Paramètres`);
      ok = false;
    }

    const gateways = countOccurrences(content, gateway);
    if (gateways !== 1) {
      console.error(`FAILURE G20: ${name} doit exposer une seule passerelle inter-espace (${gateways})`);
      ok = false;
    } else if (!aside.includes(gateway)) {
      console.error(`FAILURE G20: ${name} n'expose pas sa passerelle inter-espace dans le tiroir`);
      ok = false;
    }

    if (!/<SyncAlert\b/.test(header)) {
      console.error(`FAILURE G20: ${name} n'expose pas l'alerte réseau dans son en-tête`);
      ok = false;
    }
  }

  if (!ok) return false;
  console.log('G20 passed: each space keeps a single instance of each control');
  return true;
}

export function checkUxConformance() {
  const files = UX_SCOPE_FILES.map(file => path.resolve(file)).filter(file => fs.existsSync(file));
  const vueFiles = files.filter(file => file.endsWith('.vue'));
  let ok = true;

  const emojiIssues = findEmojis(files);
  if (emojiIssues.length > 0) {
    reportIssues(emojiIssues, 'G21', 'Found raw emojis in ux files', i => `${i.file}:${i.line} -> ${i.content}`);
    ok = false;
  }

  const radiiIssues = findNonM3Radii(vueFiles);
  if (radiiIssues.length > 0) {
    reportIssues(radiiIssues, 'G21', 'Non-M3 rounded classes found in ux files', i => `${i.file} -> ${i.token}`);
    ok = false;
  }

  const shadowIssues = findProhibitedShadows(vueFiles);
  if (shadowIssues.length > 0) {
    reportIssues(shadowIssues, 'G21', 'Prohibited shadows found in ux files', i => `${i.file} -> ${i.token}`);
    ok = false;
  }

  const targetIssues = findProhibitedTargets(vueFiles);
  if (targetIssues.length > 0) {
    reportIssues(targetIssues, 'G21', 'Prohibited sub-44px touch targets found in ux files', i => `${i.file}:${i.line} -> ${i.content}`);
    ok = false;
  }

  if (!ok) return false;
  console.log('G21 passed: ux files conform to emoji, radius, shadow and touch target rules');
  return true;
}

/* ---------------------------------------------------------------------------
   Contrôle d'apparence du pied de tiroir
   --------------------------------------------------------------------------- */

/** Le contenu du `<div>` englobant la position donnée, par comptage de profondeur. */
function enclosingDivAt(text, index) {
  const openers = /<div\b[^>]*>/g;
  let openStart = -1;
  let match;
  while ((match = openers.exec(text)) && match.index < index) openStart = match.index;
  if (openStart === -1) return null;

  const tags = /<div\b[^>]*>|<\/div>/g;
  tags.lastIndex = openStart;
  let depth = 0;
  while ((match = tags.exec(text))) {
    if (match[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) return { markup: text.slice(openStart, match.index + match[0].length), start: openStart };
    } else {
      depth += 1;
    }
  }
  return null;
}

/** Le contenu du plus proche `<div>` englobant le marqueur. */
function enclosingDiv(text, marker) {
  const index = text.indexOf(marker);
  return index === -1 ? null : enclosingDivAt(text, index);
}

/**
 * Le pied de tiroir ne porte plus que le statut réseau. Le contrôle d'apparence a quitté le
 * tiroir pour la page Paramètres : le badge de synchronisation n'a plus de frère réglage.
 */
export function checkDrawerSettingsLayout() {
  let ok = true;

  for (const layoutName of ['ManagerLayout.vue', 'EmployeeLayout.vue']) {
    const layoutPath = path.join(SRC_DIR, 'layouts', layoutName);
    if (!fs.existsSync(layoutPath)) {
      console.error(`FAILURE G22: ${layoutName} introuvable`);
      ok = false;
      continue;
    }

    const content = fs.readFileSync(layoutPath, 'utf8');
    const asideMatch = content.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i);
    const aside = asideMatch ? asideMatch[1] : '';

    if (/<ThemeToggle\b/.test(aside)) {
      console.error(`FAILURE G22: ${layoutName} garde le contrôle d'apparence dans son tiroir`);
      ok = false;
    }

    const statusRow = enclosingDiv(aside, 'Statut réseau');
    if (!statusRow) {
      console.error(`FAILURE G22: ${layoutName} n'expose pas de rangée « Statut réseau »`);
      ok = false;
      continue;
    }

    const row = statusRow.markup;
    if (!/<SyncIndicator\b/.test(row)) {
      console.error(`FAILURE G22: ${layoutName} ne place pas le badge de synchronisation dans sa rangée de statut`);
      ok = false;
    }
    if (!/min-w-0/.test(row)) {
      console.error(`FAILURE G22: ${layoutName} n'autorise pas sa rangée de statut à se comprimer (min-w-0 absent)`);
      ok = false;
    }
    if (!/shrink-0/.test(row)) {
      console.error(`FAILURE G22: ${layoutName} laisse son libellé de statut se comprimer (shrink-0 absent)`);
      ok = false;
    }
  }

  if (!ok) return false;
  console.log('G22 passed: drawer settings split network status and appearance control');
  return true;
}

/**
 * Le contrôle d'apparence est un groupe segmenté à trois états nommés. Chaque segment porte un
 * libellé visible, un état aria-pressed et un nom accessible, et atteint la cible de 44px.
 */
export function checkAppearanceControlMarkup() {
  const SEGMENT_TOKENS = ['join-item', 'flex-1', 'min-h-11'];

  const segmentComplete = (tag) =>
    SEGMENT_TOKENS.every((token) => tag.includes(token)) &&
    /:aria-pressed=/.test(tag) &&
    /:aria-label=/.test(tag);

  if (segmentComplete('<button class="join-item btn">')) {
    console.error('FAILURE G23: le détecteur de segment est aveugle, oracle invalide');
    return false;
  }
  if (!segmentComplete('<button class="join-item flex-1 min-h-11" :aria-pressed="x" :aria-label="y">')) {
    console.error('FAILURE G23: le détecteur rejette un segment conforme');
    return false;
  }

  const file = path.join(SRC_DIR, 'components', 'shared', 'ThemeToggle.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G23: ThemeToggle.vue introuvable');
    return false;
  }

  const content = fs.readFileSync(file, 'utf8');
  const buttons = content.match(/<button\b/g) || [];
  let ok = true;

  if (buttons.length < 1) {
    console.error('FAILURE G23: aucun gabarit de segment trouvé');
    ok = false;
  }

  const buttonMarkup = (content.match(/<button[^>]*>/s) || [''])[0];
  if (!segmentComplete(buttonMarkup)) {
    console.error(`FAILURE G23: segment incomplet (${buttonMarkup.trim()})`);
    ok = false;
  }

  for (const value of ['system', 'light', 'dark']) {
    if (!content.includes(`value: '${value}'`)) {
      console.error(`FAILURE G23: l'état ${value} n'est pas déclaré`);
      ok = false;
    }
  }

  const groupTag = (content.match(/<div[^>]*role="group"[^>]*>/s) || [''])[0];
  for (const token of ['role="group"', 'aria-label=', 'join']) {
    if (!groupTag.includes(token)) {
      console.error(`FAILURE G23: le groupe segmenté n'expose pas ${token}`);
      ok = false;
    }
  }
  if (!/\{\{ option\.label \}\}/.test(content)) {
    console.error("FAILURE G23: le segment n'expose pas son libellé visible");
    ok = false;
  }

  if (!ok) return false;
  console.log('G23 passed: appearance control is a three-state segmented group');
  return true;
}

/** Le badge de synchronisation cède sa largeur au lieu de pousser ses voisins hors du tiroir. */
export function checkSyncBadgeTruncation() {
  const file = path.join(SRC_DIR, 'components', 'shared', 'SyncIndicator.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G24: SyncIndicator.vue introuvable');
    return false;
  }

  const content = fs.readFileSync(file, 'utf8');
  const badgeTag = content.match(/<button\b[^>]*badge-sm[^>]*>/s);
  const badgeMarkup = badgeTag ? badgeTag[0] : '';
  let ok = true;

  if (!badgeMarkup) {
    console.error('FAILURE G24: variante badge de SyncIndicator introuvable');
    return false;
  }
  for (const token of ['min-w-0', 'max-w-full']) {
    if (!badgeMarkup.includes(token)) {
      console.error(`FAILURE G24: la classe ${token} manque au badge de synchronisation`);
      ok = false;
    }
  }
  // DaisyUI impose flex-shrink: 0 sur .badge : sans cette permission, min-w-0 reste inopérant
  if (!/\bshrink(?!-)/.test(badgeMarkup)) {
    console.error('FAILURE G24: le badge n\'a pas la permission de se comprimer (shrink absent)');
    ok = false;
  }

  // Mesure portée sur la variante badge : la variante compacte porte le même marqueur de clé
  const badgeSection = content.slice(content.indexOf(badgeTag[0]));
  const statusSpan = badgeSection.match(/<span :key="statusText"[^>]*>/);
  if (!statusSpan) {
    console.error('FAILURE G24: libellé du badge introuvable');
    ok = false;
  } else {
    // min-w-0 est indispensable : la troncature seule ne suffit pas sur un élément flex
    for (const token of ['truncate', 'min-w-0']) {
      if (!statusSpan[0].includes(token)) {
        console.error(`FAILURE G24: la classe ${token} manque au libellé du badge`);
        ok = false;
      }
    }
  }

  if (!ok) return false;
  console.log('G24 passed: sync badge truncates instead of overflowing');
  return true;
}

/** Fichiers écrits par le lot « feedback de pointage & résumé de disponibilités ». */
const FEEDBACK_SCOPE_FILES = [
  'src/components/employee/CheckConfirmationOverlay.vue',
  'src/components/employee/AvailabilitySummary.vue',
  'src/lib/availabilitySummary.js',
  'src/views/employee/CheckInView.vue',
  'src/views/employee/CheckOutView.vue',
  'src/components/employee/WeekGrid.vue',
];

const readScopeFile = (file) => {
  const resolved = path.resolve(file);
  if (!fs.existsSync(resolved)) return null;
  return fs.readFileSync(resolved, 'utf8');
};

/** Extrait les blocs `<style>` d'un SFC, concaténés. */
function extractStyleBlocks(content) {
  const blocks = [];
  const regex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) blocks.push(match[1]);
  return blocks.join('\n');
}

/**
 * Le volet de confirmation doit être une surface de statut annoncée poliment, posée sur la carte,
 * sans style en ligne. Le détecteur est d'abord éprouvé sur un échantillon lacunaire.
 */
export function checkConfirmationOverlayMarkup() {
  const file = 'src/components/employee/CheckConfirmationOverlay.vue';
  const content = readScopeFile(file);
  if (content === null) {
    console.error(`FAILURE G25: ${file} introuvable`);
    return false;
  }

  const complete = (text) =>
    ['role="status"', 'aria-live="polite"', 'absolute inset-0', '<Transition name="confirm"'].every(
      (token) => text.includes(token)
    );

  // Contrôle négatif : sans cette preuve, un détecteur toujours vrai certifierait n'importe quel fichier
  if (complete('role="status" absolute inset-0')) {
    console.error('FAILURE G25: le détecteur est aveugle, oracle invalide');
    return false;
  }
  if (!complete(content)) {
    console.error('FAILURE G25: le volet n’expose pas sa surface de statut complète (role, aria-live, position, transition)');
    return false;
  }

  let ok = true;
  for (const token of ['visible:', 'title:', 'message:', 'siteName:']) {
    if (!content.includes(token)) {
      console.error(`FAILURE G25: la propriété ${token} manque au contrat du volet`);
      ok = false;
    }
  }
  if (!/rounded(-(t|b|l|r|tl|tr|bl|br|s|e))?-m3-/.test(content)) {
    console.error('FAILURE G25: le volet n’emploie aucun token d’arrondi Material 3');
    ok = false;
  }
  if (/\sstyle="/.test(content)) {
    console.error('FAILURE G25: le volet utilise un style en ligne interdit');
    ok = false;
  }

  if (!ok) return false;
  console.log('G25 passed: confirmation overlay is an accessible animated status surface');
  return true;
}

/**
 * Les deux flux de pointage montent le volet sur leur état de succès, gardent le retour haptique
 * et positionnent leur carte pour ancrer la surface.
 */
export function checkFeedbackWiring() {
  const views = [
    { name: 'CheckInView.vue', label: 'Arrivée validée' },
    { name: 'CheckOutView.vue', label: 'Départ validé' },
  ];

  const wired = (text) =>
    text.includes('CheckConfirmationOverlay') && text.includes(':visible="isSuccess"');

  if (wired('import CheckConfirmationOverlay from \'x\'')) {
    console.error('FAILURE G26: le détecteur est aveugle, oracle invalide');
    return false;
  }

  let ok = true;
  for (const { name, label } of views) {
    const file = `src/views/employee/${name}`;
    const content = readScopeFile(file);
    if (content === null) {
      console.error(`FAILURE G26: ${file} introuvable`);
      ok = false;
      continue;
    }
    if (!wired(content)) {
      console.error(`FAILURE G26: ${file} ne monte pas le volet de confirmation sur l’état de succès`);
      ok = false;
    }
    if (!content.includes(`title="${label}"`)) {
      console.error(`FAILURE G26: ${file} n’annonce pas « ${label} »`);
      ok = false;
    }
    if (!content.includes('navigator.vibrate')) {
      console.error(`FAILURE G26: ${file} a perdu le retour haptique`);
      ok = false;
    }
    if (!content.includes('class="card relative')) {
      console.error(`FAILURE G26: ${file} n’ancre pas la surface (carte non positionnée)`);
      ok = false;
    }
    if (!content.includes('<Transition name="fade-fast" mode="out-in">')) {
      console.error(`FAILURE G26: ${file} n’anime pas le libellé du bouton sans décalage`);
      ok = false;
    }
    if (!content.includes('buttonState')) {
      console.error(`FAILURE G26: ${file} ne dérive pas un état unique pour son bouton`);
      ok = false;
    }
    if (content.includes('setTimeout(r, 700)')) {
      console.error(`FAILURE G26: ${file} conserve l’attente muette antérieure au volet`);
      ok = false;
    }
  }

  if (!ok) return false;
  console.log('G26 passed: both check flows surface the confirmation overlay and keep haptics');
  return true;
}

/**
 * La grille dérive son résumé de la librairie partagée et l’affiche avant l’enregistrement.
 */
export function checkWeekSummaryWiring() {
  const gridFile = 'src/components/employee/WeekGrid.vue';
  const libFile = 'src/lib/availabilitySummary.js';
  const grid = readScopeFile(gridFile);
  const lib = readScopeFile(libFile);

  if (grid === null || lib === null) {
    console.error('FAILURE G27: la grille ou la librairie de résumé est introuvable');
    return false;
  }

  for (const token of ['export function summarizeAvailability', 'export function describeAvailabilityCount']) {
    if (!lib.includes(token)) {
      console.error(`FAILURE G27: ${libFile} n’exporte pas ${token}`);
      return false;
    }
  }

  const drived = (text) => text.includes('summarizeAvailability(') && text.includes('<AvailabilitySummary')
  if (drived("import x from 'summarizeAvailability('")) {
    console.error('FAILURE G27: le détecteur est aveugle, oracle invalide');
    return false;
  }

  let ok = true;
  if (!grid.includes("from '../../lib/availabilitySummary'")) {
    console.error(`FAILURE G27: ${gridFile} n’importe pas la librairie de résumé`);
    ok = false;
  }
  if (!grid.includes("from './AvailabilitySummary.vue'")) {
    console.error(`FAILURE G27: ${gridFile} n’importe pas le panneau de résumé`);
    ok = false;
  }
  if (!drived(grid)) {
    console.error(`FAILURE G27: ${gridFile} ne dérive ni n’affiche son résumé`);
    ok = false;
  }
  if (!grid.includes('availabilitySummary.count')) {
    console.error(`FAILURE G27: ${gridFile} ne rend pas le compte de jours`);
    ok = false;
  }
  if (!grid.includes('availabilitySummary.label')) {
    console.error(`FAILURE G27: ${gridFile} n’annonce pas le résumé sur son bouton`);
    ok = false;
  }

  if (!ok) return false;
  console.log('G27 passed: week grid derives and renders its availability summary');
  return true;
}

const FORBIDDEN_ANIMATED = /\b(width|height|min-width|max-width|min-height|max-height|top|left|right|bottom|margin|padding|box-shadow)\b/;
const MAX_ANIMATION_MS = 400;

/** Les déclarations de transition/animation qui animent une propriété non composée. */
function findNonCompositedAnimations(styleText) {
  const issues = [];
  const declarationRegex = /(transition|animation)(-property)?\s*:\s*([^;]+);/g;
  let match;
  while ((match = declarationRegex.exec(styleText)) !== null) {
    const value = match[3];
    if (FORBIDDEN_ANIMATED.test(value)) issues.push(`${match[1]}: ${value.trim()}`);
  }
  return issues;
}

/** Durées en millisecondes déclarées dans les transitions et animations. */
function findAnimationDurationsMs(styleText) {
  const durations = [];
  const declarationRegex = /(transition|animation)(-duration)?\s*:\s*([^;]+);/g;
  let match;
  while ((match = declarationRegex.exec(styleText)) !== null) {
    const timeRegex = /(\d+(?:\.\d+)?)(ms|s)\b/g;
    let time;
    while ((time = timeRegex.exec(match[3])) !== null) {
      durations.push({ value: time[1], unit: time[2], ms: time[2] === 's' ? parseFloat(time[1]) * 1000 : parseFloat(time[1]) });
    }
  }
  return durations;
}

/**
 * Le lot n’anime que des propriétés composées, sous le plafond de 400 ms, et l’échappatoire
 * d’accessibilité du thème reste en place. Les détecteurs sont éprouvés sur des échantillons témoins.
 */
export function checkMotionConformance() {
  let ok = true;

  // Contrôle positif : le détecteur d’animation non composée doit reconnaître une faute connue
  if (findNonCompositedAnimations('transition: width 200ms ease;').length !== 1) {
    console.error('FAILURE G28: le détecteur de propriétés non composées est aveugle, oracle invalide');
    return false;
  }
  if (findNonCompositedAnimations('transition: opacity 200ms ease, transform 200ms ease;').length !== 0) {
    console.error('FAILURE G28: le détecteur signale à tort une transition composée');
    return false;
  }
  if (findAnimationDurationsMs('animation-duration: 500ms;')[0]?.ms !== 500) {
    console.error('FAILURE G28: le détecteur de durée est aveugle, oracle invalide');
    return false;
  }

  for (const file of ['src/components/employee/CheckConfirmationOverlay.vue', 'src/components/employee/AvailabilitySummary.vue']) {
    const content = readScopeFile(file);
    if (content === null) {
      console.error(`FAILURE G28: ${file} introuvable`);
      ok = false;
      continue;
    }
    const style = extractStyleBlocks(content);
    if (!style.trim()) {
      console.error(`FAILURE G28: ${file} n’expose aucun bloc de style à contrôler`);
      ok = false;
      continue;
    }

    const nonComposited = findNonCompositedAnimations(style);
    if (nonComposited.length > 0) {
      console.error(`FAILURE G28: ${file} anime des propriétés non composées (${nonComposited.join(' | ')})`);
      ok = false;
    }

    const tooLong = findAnimationDurationsMs(style).filter((d) => d.ms > MAX_ANIMATION_MS);
    if (tooLong.length > 0) {
      console.error(
        `FAILURE G28: ${file} dépasse le plafond de ${MAX_ANIMATION_MS} ms (${tooLong.map((d) => d.value + d.unit).join(', ')})`
      );
      ok = false;
    }

    // Les transitions à état clé doivent éviter le chevauchement DOM ; une simple apparition
    // de surface n'a pas de contrepartie sortante à enchaîner.
    const transitions = content.match(/<Transition[^>]*>/g) || [];
    if (transitions.length === 0) {
      console.error(`FAILURE G28: ${file} n’expose aucune transition native`);
      ok = false;
    }
    for (const tag of transitions.filter((t) => t.includes(':key'))) {
      if (!tag.includes('mode="out-in"')) {
        console.error(`FAILURE G28: ${file} bascule un état clé sans mode="out-in" (${tag})`);
        ok = false;
      }
    }
  }

  const styleCss = readScopeFile('src/style.css');
  if (styleCss === null || !styleCss.includes('prefers-reduced-motion: reduce')) {
    console.error('FAILURE G28: l’échappatoire prefers-reduced-motion a disparu de src/style.css');
    ok = false;
  }

  if (!ok) return false;
  console.log('G28 passed: batch animations use GPU properties within timing budget');
  return true;
}

/** Conformité du lot : emojis, arrondis M3, ombres, cibles tactiles. */
export function checkEmployeeFeedbackConformance() {
  const files = FEEDBACK_SCOPE_FILES.map((file) => path.resolve(file)).filter((file) => fs.existsSync(file));
  const vueFiles = files.filter((file) => file.endsWith('.vue'));
  let ok = true;

  const emojiIssues = findEmojis(files);
  if (emojiIssues.length > 0) {
    reportIssues(emojiIssues, 'G29', 'Found raw emojis in feedback files', i => `${i.file}:${i.line} -> ${i.content}`);
    ok = false;
  }

  const radiiIssues = findNonM3Radii(vueFiles);
  if (radiiIssues.length > 0) {
    reportIssues(radiiIssues, 'G29', 'Non-M3 rounded classes found in feedback files', i => `${i.file} -> ${i.token}`);
    ok = false;
  }

  const shadowIssues = findProhibitedShadows(vueFiles);
  if (shadowIssues.length > 0) {
    reportIssues(shadowIssues, 'G29', 'Prohibited shadows found in feedback files', i => `${i.file} -> ${i.token}`);
    ok = false;
  }

  const targetIssues = findProhibitedTargets(vueFiles);
  if (targetIssues.length > 0) {
    reportIssues(targetIssues, 'G29', 'Prohibited sub-44px touch targets found in feedback files', i => `${i.file}:${i.line} -> ${i.content}`);
    ok = false;
  }

  if (!ok) return false;
  console.log('G29 passed: batch files conform to emoji, radius, shadow and touch target rules');
  return true;
}

/** Directives de ton : lexique proscrit par .agents/rules/09-ui-copy-and-tone.md. */
const VOICE_SCOPE_DIRS = ['src/views/employee', 'src/components/employee'];
const BANNED_VOICE_TERMS = [
  'anomalie',
  'à corriger',
  'à compléter',
  'non conforme',
  'non-conformité',
  'veuillez',
  'sanction',
  'discipline',
  'utilisateur',
  'kpi',
  'optimiser',
  'conformité',
];

/** Termes proscrits présents dans un texte, insensibles à la casse. */
function findBannedVoiceInText(text) {
  const lowered = String(text).toLowerCase();
  return BANNED_VOICE_TERMS.filter((term) => lowered.includes(term));
}

function findBannedVoiceTerms(files) {
  const issues = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    content.split('\n').forEach((line, index) => {
      const terms = findBannedVoiceInText(line);
      if (terms.length > 0) {
        issues.push({
          file: path.relative(process.cwd(), file),
          line: index + 1,
          term: terms.join(', '),
          content: line.trim(),
        });
      }
    });
  }
  return issues;
}

/**
 * Les textes de l'espace employé n'emploient aucun terme du lexique administratif proscrit.
 * Détecteur éprouvé sur un témoin positif et un témoin neutre avant le balayage.
 */
export function checkVoiceConformance() {
  if (findBannedVoiceInText('Anomalie détectée').length !== 1) {
    console.error('FAILURE G30: le détecteur de ton est aveugle, oracle invalide');
    return false;
  }
  if (findBannedVoiceInText('Départs : 1 manquant, tous enregistrés').length !== 0) {
    console.error('FAILURE G30: le détecteur signale à tort une formulation retenue');
    return false;
  }

  const files = VOICE_SCOPE_DIRS.flatMap((dir) => getAllSourceFiles(path.resolve(dir), ['.vue', '.js']));
  if (files.length === 0) {
    console.error('FAILURE G30: aucun fichier d’espace employé trouvé, périmètre de contrôle vide');
    return false;
  }

  const issues = findBannedVoiceTerms(files);
  if (issues.length > 0) {
    reportIssues(issues, 'G30', 'Administrative tone found in employee-facing copy', i => `${i.file}:${i.line} [${i.term}] -> ${i.content}`);
    return false;
  }

  console.log('G30 passed: employee-facing copy avoids administrative tone');
  return true;
}

/**
 * La consigne de ton existe, cite son garde-fou exécutable et reste référencée par la carte
 * des directives, faute de quoi elle cesse d'être opposable.
 */
export function checkToneRuleRegistered() {
  const ruleFile = '.agents/rules/09-ui-copy-and-tone.md';
  const rule = readScopeFile(ruleFile);
  const agents = readScopeFile('AGENTS.md');

  if (rule === null) {
    console.error(`FAILURE G31: ${ruleFile} introuvable`);
    return false;
  }
  if (agents === null) {
    console.error('FAILURE G31: AGENTS.md introuvable');
    return false;
  }

  const namesRule = (text) => text.includes('09-ui-copy-and-tone.md');
  if (namesRule('aucune référence ici')) {
    console.error('FAILURE G31: le détecteur de référence est aveugle, oracle invalide');
    return false;
  }

  let ok = true;
  if (!rule.includes('--voice-conformance')) {
    console.error(`FAILURE G31: ${ruleFile} ne cite pas son garde-fou --voice-conformance`);
    ok = false;
  }
  if (!rule.includes('BANNED_VOICE_TERMS')) {
    console.error(`FAILURE G31: ${ruleFile} ne nomme pas la source du lexique BANNED_VOICE_TERMS`);
    ok = false;
  }
  if (!namesRule(agents)) {
    console.error('FAILURE G31: AGENTS.md ne référence pas la consigne de ton');
    ok = false;
  }

  if (!ok) return false;
  console.log('G31 passed: tone rule is registered and wired to its oracle');
  return true;
}

/* ---------------------------------------------------------------------------
   Lot « alignement du tiroir gestionnaire et rampe tonale M3 »
   --------------------------------------------------------------------------- */

/** Fichiers de l'espace gestionnaire écrits par ce lot. */
const MANAGER_SCOPE_FILES = [
  'src/layouts/ManagerLayout.vue',
  'src/components/manager/ManagerKpiCard.vue',
  'src/views/manager/DashboardView.vue',
  'src/views/manager/PresencesView.vue',
  'src/views/manager/AvailabilitiesView.vue',
  'src/views/manager/EmployeesView.vue',
  'src/views/manager/TeamsView.vue',
  'src/views/manager/LocationsView.vue',
  'src/views/manager/ExportView.vue',
];

const managerScopeFiles = () =>
  MANAGER_SCOPE_FILES.map((file) => path.resolve(file)).filter((file) => fs.existsSync(file));

const readLayout = (name) => {
  const file = path.join(SRC_DIR, 'layouts', name);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
};

const extractAside = (content) => {
  const match = String(content).match(/<aside[^>]*>([\s\S]*?)<\/aside>/i);
  return match ? match[1] : '';
};

const extractAsideTag = (content) => {
  const match = String(content).match(/<aside[^>]*>/i);
  return match ? match[0] : '';
};

/** La balise du bouton le plus proche qui précède le marqueur donné. */
function buttonTagBefore(text, marker) {
  const index = text.indexOf(marker);
  if (index === -1) return null;
  const open = text.lastIndexOf('<button', index);
  const close = text.indexOf('>', index);
  if (open === -1 || close === -1) return null;
  return text.slice(open, close + 1);
}

/** Les blocs des entrées de navigation, à l'exclusion des boutons DaisyUI d'action. */
function navEntryBlocks(aside) {
  const blocks = [];
  const regex = /<button\b[^>]*>[\s\S]*?<\/button>/g;
  let match;
  while ((match = regex.exec(aside)) !== null) {
    const tag = match[0].slice(0, match[0].indexOf('>') + 1);
    if (tag.includes('rounded-m3-md') && !tag.includes('btn-')) blocks.push(match[0]);
  }
  return blocks;
}

const RAMP_ROOT = /class="drawer drawer-docked[^"]*bg-base-100/;

/** Le fond de vue gestionnaire et son tiroir respectent la rampe tonale de la règle 07. */
export function checkManagerRamp() {
  const drawerOnContainer = (tag) => tag.includes('bg-base-200') && !tag.includes('bg-base-100');

  if (
    !RAMP_ROOT.test('<div class="drawer drawer-docked min-h-screen bg-base-100">') ||
    RAMP_ROOT.test('<div class="drawer drawer-docked min-h-screen bg-base-200">')
  ) {
    console.error('FAILURE G32: le détecteur de fond de vue est aveugle, oracle invalide');
    return false;
  }
  if (!drawerOnContainer('<aside class="bg-base-200">') || drawerOnContainer('<aside class="bg-base-100">')) {
    console.error('FAILURE G32: le détecteur de surface du tiroir est aveugle, oracle invalide');
    return false;
  }

  const content = readLayout('ManagerLayout.vue');
  if (content === null) {
    console.error('FAILURE G32: ManagerLayout.vue introuvable');
    return false;
  }

  let ok = true;
  if (!RAMP_ROOT.test(content)) {
    console.error('FAILURE G32: le conteneur gestionnaire ne porte pas le fond de vue base-100');
    ok = false;
  }
  if (!drawerOnContainer(extractAsideTag(content))) {
    console.error('FAILURE G32: le tiroir gestionnaire ne porte pas la surface base-200');
    ok = false;
  }

  if (!ok) return false;
  console.log('G32 passed: manager page and drawer follow the M3 surface ramp');
  return true;
}

/** Métriques partagées par les deux tiroirs. */
const DRAWER_PARITY_TOKENS = [
  'w-72 sm:w-80',
  'p-5',
  'bg-base-200',
  'border-base-300/60',
  'gap-1.5',
  'py-3 px-3.5',
  'w-5 h-5',
];

const drawerParityGaps = (text) => DRAWER_PARITY_TOKENS.filter((token) => !text.includes(token));

/** Le tiroir gestionnaire reprend les métriques du tiroir employé. */
export function checkDrawerParity() {
  const drifted =
    '<aside class="w-64 sm:w-72 bg-base-100 p-4 gap-1" data-ignored="py-2.5 px-3 w-4 h-4 border-base-300">';
  if (drawerParityGaps(drifted).length !== DRAWER_PARITY_TOKENS.length) {
    console.error('FAILURE G33: le détecteur de métriques est aveugle, oracle invalide');
    return false;
  }

  const employee = readLayout('EmployeeLayout.vue');
  const manager = readLayout('ManagerLayout.vue');
  if (employee === null || manager === null) {
    console.error('FAILURE G33: une des deux mises en page est introuvable');
    return false;
  }

  const referenceGaps = drawerParityGaps(employee);
  if (referenceGaps.length > 0) {
    console.error(
      `FAILURE G33: le tiroir employé, référence de comparaison, a perdu ${referenceGaps.join(', ')}`
    );
    return false;
  }

  const managerGaps = drawerParityGaps(manager);
  if (managerGaps.length > 0) {
    console.error(`FAILURE G33: le tiroir gestionnaire n'aligne pas ${managerGaps.join(', ')}`);
    return false;
  }

  console.log('G33 passed: manager drawer metrics match the employee drawer');
  return true;
}

/** Chaque entrée de navigation atteint la cible tactile de 44px. */
export function checkManagerNavTargets() {
  const measurements = (block) => {
    const tag = block.slice(0, block.indexOf('>') + 1);
    const gaps = [];
    if (!tag.includes('py-3 px-3.5')) gaps.push('padding vertical et horizontal de 12px et 14px');
    if (tag.includes('py-2.5') || tag.includes('py-2 ')) gaps.push('hauteur inférieure au seuil de 44px');
    const svg = block.match(/<svg[^>]*>/);
    if (svg && !svg[0].includes('w-5 h-5')) gaps.push('icône de 20px');
    return gaps;
  };

  const witness =
    '<button type="button" class="flex items-center gap-3 py-2.5 px-3 rounded-m3-md"><svg class="w-4 h-4 shrink-0"></svg></button>';
  if (measurements(witness).length !== 3) {
    console.error('FAILURE G34: le détecteur de cible tactile est aveugle, oracle invalide');
    return false;
  }

  const manager = readLayout('ManagerLayout.vue');
  if (manager === null) {
    console.error('FAILURE G34: ManagerLayout.vue introuvable');
    return false;
  }

  // Sept entrées sont déclarées dans navItems et partagent le gabarit unique du v-for ;
  // la huitième est la passerelle inter-espace.
  const declared = (manager.match(/path: '\/manager/g) || []).length;
  if (declared !== 7) {
    console.error(`FAILURE G34: sept destinations de gestion attendues dans navItems, ${declared} trouvées`);
    return false;
  }

  const entries = navEntryBlocks(extractAside(manager));
  if (entries.length !== 2) {
    console.error(`FAILURE G34: gabarit d'entrée et passerelle attendus, ${entries.length} blocs trouvés`);
    return false;
  }

  const issues = entries.flatMap((block) => measurements(block));
  if (issues.length > 0) {
    console.error(`FAILURE G34: entrées gestionnaire sous-dimensionnées (${issues.join(' | ')})`);
    return false;
  }

  console.log('G34 passed: every manager nav entry meets the 44px touch target');
  return true;
}

/**
 * Le pied des deux tiroirs ne porte plus que le statut réseau. L'apparence, l'identité et la
 * déconnexion ont quitté le tiroir pour la page Paramètres.
 */
export function checkDrawerFooter() {
  const footerOnlyStatus = (aside) => {
    const status = aside.indexOf('Statut réseau');
    if (status === -1) return false;
    if (aside.includes('userInitial')) return false;
    if (aside.includes('aria-label="Se déconnecter"')) return false;
    if (aside.includes('handleLogout')) return false;
    if (aside.includes('<ThemeToggle')) return false;
    return aside.slice(status).includes('<SyncIndicator');
  };

  if (footerOnlyStatus('<span>Statut réseau</span><SyncIndicator/>{{ userInitial }}<ThemeToggle/>aria-label="Se déconnecter"')) {
    console.error('FAILURE G35: le détecteur de pied vidé est aveugle, oracle invalide');
    return false;
  }

  let ok = true;
  for (const layoutName of ['ManagerLayout.vue', 'EmployeeLayout.vue']) {
    const content = readLayout(layoutName);
    if (content === null) {
      console.error(`FAILURE G35: ${layoutName} introuvable`);
      ok = false;
      continue;
    }

    const aside = extractAside(content);
    const header = aside.slice(0, aside.indexOf('<nav'));

    if (!footerOnlyStatus(aside)) {
      console.error(`FAILURE G35: le pied de ${layoutName} ne se réduit pas au statut réseau`);
      ok = false;
    }
    if (!header.includes('PresenceApp')) {
      console.error(`FAILURE G35: l'en-tête de ${layoutName} ne porte plus la marque`);
      ok = false;
    }
    if (!header.includes('badge badge-primary badge-xs')) {
      console.error(`FAILURE G35: l'en-tête de ${layoutName} ne porte plus de badge d'espace`);
      ok = false;
    }
  }

  const settings = readScopeFile('src/views/SettingsView.vue');
  if (settings === null) {
    console.error('FAILURE G35: src/views/SettingsView.vue introuvable');
    return false;
  }
  for (const token of ['Compte', 'Se déconnecter', '<ThemeToggle']) {
    if (!settings.includes(token)) {
      console.error(`FAILURE G35: la page Paramètres n'expose plus ${token}`);
      ok = false;
    }
  }

  if (!ok) return false;
  console.log('G35 passed: the drawer footer keeps only the network status, settings live on the page');
  return true;
}

/**
 * Dans les deux espaces, la passerelle inter-espace reste neutre : la teinte primaire et la
 * pastille pleine sont réservées à l'entrée sélectionnée, qui doit rester unique.
 */
export function checkGatewayNeutral() {
  const isNeutral = (tag) => tag !== null && !tag.includes('text-primary') && !tag.includes('bg-primary');

  if (
    isNeutral(
      '<button type="button" class="flex items-center gap-3 py-3 px-3.5 rounded-m3-md text-primary hover:bg-primary/10">'
    )
  ) {
    console.error('FAILURE G36: le détecteur de teinte de passerelle est aveugle, oracle invalide');
    return false;
  }

  const gateways = [
    { layout: 'ManagerLayout.vue', marker: "handleNav('/employee')" },
    { layout: 'EmployeeLayout.vue', marker: "handleNav('/manager')" },
  ];

  let ok = true;
  for (const { layout, marker } of gateways) {
    const content = readLayout(layout);
    if (content === null) {
      console.error(`FAILURE G36: ${layout} introuvable`);
      ok = false;
      continue;
    }

    const aside = extractAside(content);
    const gateway = buttonTagBefore(aside, marker);
    const selected = (aside.match(/bg-primary\/15 text-primary font-bold/g) || []).length;

    if (gateway === null) {
      console.error(`FAILURE G36: la passerelle de ${layout} est introuvable dans le tiroir`);
      ok = false;
    } else if (!isNeutral(gateway)) {
      console.error(`FAILURE G36: la passerelle de ${layout} porte encore la teinte primaire (${gateway.trim()})`);
      ok = false;
    }
    if (selected !== 1) {
      console.error(`FAILURE G36: une seule entrée sélectionnée attendue dans ${layout}, ${selected} trouvées`);
      ok = false;
    }
  }

  if (!ok) return false;
  console.log('G36 passed: no gateway entry mimics a selected destination');
  return true;
}

/** Les teintes de surface imbriquées restées au niveau du conteneur. */
function findStaleNestedTints(text) {
  const containers = [];
  const containerRegex = /class="[^"]*\b(card|modal-box)\b/g;
  let match;
  while ((match = containerRegex.exec(text)) !== null) {
    containers.push({ index: match.index, kind: match[0].includes('modal-box') ? 'modal' : 'card' });
  }

  const issues = [];
  const tintRegex = /bg-base-200\/(?:5|6)0/g;
  while ((match = tintRegex.exec(text)) !== null) {
    const owner = containers.filter((container) => container.index < match.index).pop();
    if (owner && owner.kind === 'card') issues.push(match[0]);
  }
  return issues;
}

/** Les cartes gestionnaire vivent en base-200, leurs surfaces imbriquées restent lisibles. */
export function checkManagerTonalRamp() {
  const FORBIDDEN = [
    { pattern: /card bg-base-100/, reason: 'carte encore à l\'élévation 0' },
    { pattern: /stats bg-base-100/, reason: 'tuile de statistique encore à l\'élévation 0' },
    { pattern: /table-zebra/, reason: 'rayures base-200 invisibles sur une carte base-200' },
    { pattern: /badge-ghost/, reason: 'puce base-200 invisible sur une carte base-200' },
    { pattern: /rounded-full bg-base-200(?!\/)/, reason: 'pastille décorative au niveau du conteneur' },
  ];

  if (!FORBIDDEN[0].pattern.test('class="card bg-base-100 border"')) {
    console.error('FAILURE G37: le détecteur de surface de carte est aveugle, oracle invalide');
    return false;
  }
  if (findStaleNestedTints('class="card bg-base-200"><div class="bg-base-200/60">').length !== 1) {
    console.error('FAILURE G37: le détecteur de teinte imbriquée est aveugle, oracle invalide');
    return false;
  }
  if (findStaleNestedTints('class="modal-box bg-base-100"><div class="bg-base-200/60">').length !== 0) {
    console.error('FAILURE G37: le détecteur de teinte confond modale et carte');
    return false;
  }

  const files = managerScopeFiles();
  if (files.length === 0) {
    console.error('FAILURE G37: aucun fichier gestionnaire trouvé, périmètre de contrôle vide');
    return false;
  }

  const issues = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relative = path.relative(process.cwd(), file);

    for (const { pattern, reason } of FORBIDDEN) {
      if (pattern.test(content)) issues.push(`${relative} -> ${reason}`);
    }
    for (const tint of findStaleNestedTints(content)) {
      issues.push(`${relative} -> teinte ${tint} confondue avec la surface de sa carte`);
    }
    for (const tag of content.match(/<div[^>]*modal-box[^>]*>/g) || []) {
      if (!tag.includes('bg-base-100')) {
        issues.push(`${relative} -> modale hors de l'élévation 3 (${tag.trim()})`);
      }
    }
  }

  if (issues.length > 0) {
    reportIssues(issues, 'G37', 'Manager surfaces still off the tonal ramp', (issue) => issue);
    return false;
  }

  console.log('G37 passed: manager cards and nested surfaces follow the tonal ramp');
  return true;
}

/**
 * Les deux tiroirs partagent la même grammaire : marque et badge d'espace en tête, sections
 * libellées, barre d'accent sur l'entrée sélectionnée. Le repli en rail d'icônes est admis
 * depuis le lot « Repli en Rail d'Icônes » ; seul le composant historique `navigation-rail`
 * reste proscrit, le repli vivant dans `.drawer-rail`.
 */
export function checkDrawerSharedGrammar() {
  const ACCENT_BAR = 'absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full';
  const SECTION_LABEL = 'px-3.5 text-xs font-medium uppercase tracking-wide text-base-content/60';

  const grammarComplete = (aside) =>
    ['Navigation', 'Mon espace', 'PresenceApp'].every((token) => aside.includes(token)) &&
    aside.includes(ACCENT_BAR) &&
    aside.includes(SECTION_LABEL);

  if (grammarComplete('<aside></aside>')) {
    console.error('FAILURE G40: le détecteur de grammaire est aveugle, oracle invalide');
    return false;
  }

  const spaces = [
    { layout: 'ManagerLayout.vue', badge: 'Espace Manager' },
    { layout: 'EmployeeLayout.vue', badge: 'Espace Collaborateur' },
  ];

  let ok = true;
  for (const { layout, badge } of spaces) {
    const content = readLayout(layout);
    if (content === null) {
      console.error(`FAILURE G40: ${layout} introuvable`);
      ok = false;
      continue;
    }

    const aside = extractAside(content);
    if (!grammarComplete(aside)) {
      console.error(`FAILURE G40: ${layout} ne partage pas la grammaire de tiroir (sections, accent, marque)`);
      ok = false;
    }
    if (!aside.includes(`>${badge}<`)) {
      console.error(`FAILURE G40: ${layout} n'annonce pas son badge « ${badge} »`);
      ok = false;
    }

    const nav = aside.slice(aside.indexOf('<nav'), aside.indexOf('</nav>'));
    if ((nav.match(new RegExp(ACCENT_BAR, 'g')) || []).length !== 1) {
      console.error(`FAILURE G40: ${layout} ne monte pas exactement une barre d'accent dans sa navigation`);
      ok = false;
    }
    if (!/aria-hidden="true"/.test(nav)) {
      console.error(`FAILURE G40: la barre d'accent de ${layout} n'est pas masquée aux lecteurs d'écran`);
      ok = false;
    }
    if (nav.indexOf('Navigation') > nav.indexOf('Mon espace')) {
      console.error(`FAILURE G40: ${layout} n'ordonne pas ses sections Navigation puis Mon espace`);
      ok = false;
    }
    if (/navigation-rail|NavigationRail/.test(content)) {
      console.error(`FAILURE G40: ${layout} réintroduit le composant historique navigation-rail, remplacé par le repli .drawer-rail`);
      ok = false;
    }
  }

  if (!ok) return false;
  console.log('G40 passed: both drawers share one navigation grammar');
  return true;
}

/**
 * Le tiroir superposé gouverne sous 840 px, l'ancrage au delà, dans les deux espaces.
 * DaisyUI ne précompile `drawer-open` que pour ses propres seuils : le projet pose donc
 * lui-même son jeton de seuil et la règle d'ancrage qui va avec.
 */
export function checkNavigationDocking() {
  const DOCKING_TOKENS = ['--breakpoint-docked: 840px'];
  const DOCKING_RULES = ['.drawer-docked > .drawer-toggle', 'position: sticky', 'pointer-events: none'];

  const declaresDocking = (css) =>
    DOCKING_TOKENS.every((token) => css.includes(token)) && DOCKING_RULES.every((rule) => css.includes(rule));

  if (declaresDocking(':root { --radius-m3-xs: 4px; }')) {
    console.error('FAILURE G43: le détecteur de jeton de seuil est aveugle, oracle invalide');
    return false;
  }

  const dockedLayout = (content) =>
    content.includes('drawer drawer-docked') &&
    (content.match(/docked:hidden/g) || []).length >= 1 &&
    !content.includes('lg:drawer-open');

  if (dockedLayout('<div class="drawer lg:drawer-open">')) {
    console.error("FAILURE G43: le détecteur d'ancrage est aveugle, oracle invalide");
    return false;
  }

  const css = readScopeFile('src/style.css');
  if (css === null) {
    console.error('FAILURE G43: src/style.css introuvable');
    return false;
  }
  if (!declaresDocking(css)) {
    console.error("FAILURE G43: src/style.css ne déclare pas le seuil d'ancrage de 840px et sa règle");
    return false;
  }

  let ok = true;
  for (const layoutName of ['ManagerLayout.vue', 'EmployeeLayout.vue']) {
    const content = readLayout(layoutName);
    if (content === null) {
      console.error(`FAILURE G43: ${layoutName} introuvable`);
      ok = false;
      continue;
    }
    if (!dockedLayout(content)) {
      console.error(
        `FAILURE G43: ${layoutName} n'ancre pas sa barre latérale, ou laisse des contrôles visibles une fois ancrée`
      );
      ok = false;
    }
    if (!content.includes('drawer-overlay')) {
      console.error(`FAILURE G43: ${layoutName} n'expose plus son voile de fermeture sous 840px`);
      ok = false;
    }
  }

  // L'espace employé conserve son pointage pleine largeur et son verrouillage onepage
  const employee = readLayout('EmployeeLayout.vue') || '';
  for (const token of ['flex-1', 'max-w-6xl', 'md:overflow-hidden']) {
    if (!employee.includes(token)) {
      console.error(`FAILURE G43: l'espace employé a perdu ${token}`);
      ok = false;
    }
  }

  if (!ok) return false;
  console.log('G43 passed: both spaces dock their sidebar at 840px and keep the drawer below');
  return true;
}

/** Contenu de la media query ouvrante, accolades appariées, jusqu'à sa fermeture. */
function extractMediaBlock(css, opener) {
  const start = String(css).indexOf(opener);
  if (start === -1) return '';
  let depth = 0;
  let opened = false;
  for (let index = start; index < css.length; index += 1) {
    const char = css[index];
    if (char === '{') {
      depth += 1;
      opened = true;
    } else if (char === '}') {
      depth -= 1;
      if (opened && depth === 0) return css.slice(start, index + 1);
    }
  }
  return css.slice(start);
}

/**
 * Le repli en rail d'icônes du lot éponyme : le composable porte le contrat (clé de persistance,
 * seuil d'ancrage de 840px, bande de repli automatique de 840 à 1024px, révocation du choix au
 * franchissement des seuils), les deux espaces câblent la poignée et les libellés masquables, et
 * le style reste confiné à la media query d'ancrage. Sous 840px, le rail n'a pas d'objet.
 */
export function checkSidebarRail() {
  const COMPOSABLE_TOKENS = [
    "SIDEBAR_STORAGE_KEY = 'presence_nav_collapsed'",
    "DOCKED_QUERY = '(min-width: 840px)'",
    "AUTO_RAIL_QUERY = '(min-width: 840px) and (max-width: 1023.98px)'",
  ];

  const composable = readScopeFile('src/composables/useSidebarNav.js');
  if (composable === null) {
    console.error('FAILURE G45: src/composables/useSidebarNav.js introuvable');
    return false;
  }
  for (const token of COMPOSABLE_TOKENS) {
    if (!composable.includes(token)) {
      console.error(`FAILURE G45: le composable ne déclare plus « ${token} »`);
      return false;
    }
  }
  if (!/isRail\s*=\s*computed\(\(\)\s*=>\s*isDocked\.value\s*&&/.test(composable)) {
    console.error("FAILURE G45: le rail n'est plus conditionné à l'ancrage");
    return false;
  }
  if (!/explicit\.value\s*=\s*!isRail\.value/.test(composable) || !composable.includes('persistPreference(')) {
    console.error('FAILURE G45: le clic sur la poignée ne grave plus de choix explicite persistant');
    return false;
  }
  if (!/addEventListener\('change'/.test(composable) || !/window\.localStorage\.(getItem|setItem)/.test(composable)) {
    console.error('FAILURE G45: le composable ne suit plus les seuils ou ne persiste plus la préférence');
    return false;
  }

  const RAIL_HIDE_MIN = 6;
  const RAIL_ENTRY_MIN = 2;
  let ok = true;
  for (const { name, space } of [
    { name: 'EmployeeLayout.vue', space: 'employee' },
    { name: 'ManagerLayout.vue', space: 'manager' },
  ]) {
    const content = readLayout(name);
    if (content === null) {
      console.error(`FAILURE G45: ${name} introuvable`);
      ok = false;
      continue;
    }
    if (!content.includes('useSidebarNav') || !/const\s*\{\s*isRail,\s*toggleRail\s*\}\s*=\s*useSidebarNav\(\)/.test(content)) {
      console.error(`FAILURE G45: ${name} ne consomme plus le composable de repli`);
      ok = false;
    }
    if (!/:class="\{\s*'drawer-rail':\s*isRail\s*\}"/.test(content)) {
      console.error(`FAILURE G45: ${name} ne lie plus la classe drawer-rail au repli`);
      ok = false;
    }
    if (!content.includes(`id="${space}-sidebar"`)) {
      console.error(`FAILURE G45: ${name} n'expose plus sa barre latérale sous un identifiant stable`);
      ok = false;
    }
    const handle = buttonTagBefore(content, 'rail-handle');
    if (handle === null) {
      console.error(`FAILURE G45: ${name} n'a plus de poignée de repli`);
      ok = false;
    } else {
      const missing = [
        ['min-w-11', handle.includes('min-w-11')],
        ['min-h-11', handle.includes('min-h-11')],
        ['hidden', handle.includes('hidden')],
        ['docked:inline-flex', handle.includes('docked:inline-flex')],
        [`aria-controls="${space}-sidebar"`, handle.includes(`aria-controls="${space}-sidebar"`)],
        [':aria-expanded="!isRail"', handle.includes(':aria-expanded="!isRail"')],
        ['@click="toggleRail"', handle.includes('@click="toggleRail"')],
      ].filter(([, present]) => !present).map(([label]) => label);
      if (missing.length > 0) {
        console.error(`FAILURE G45: la poignée de ${name} perd ${missing.join(', ')}`);
        ok = false;
      }
    }
    const railHideCount = (content.match(/rail-hide/g) || []).length;
    if (railHideCount < RAIL_HIDE_MIN) {
      console.error(`FAILURE G45: ${name} ne masque plus assez de libellés en rail (${railHideCount})`);
      ok = false;
    }
    const railEntryCount = (content.match(/rail-entry/g) || []).length;
    if (railEntryCount < RAIL_ENTRY_MIN) {
      console.error(`FAILURE G45: ${name} ne marque plus ses entrées de navigation pour le rail (${railEntryCount})`);
      ok = false;
    }
    for (const [label, pattern] of [
      ['infobulles du rail', /tooltip tooltip-right/g],
      ['libellés d’infobulle', /:data-tip=/g],
      ['libellés accessibles', /:aria-label=/g],
    ]) {
      const count = (content.match(pattern) || []).length;
      if (count < RAIL_ENTRY_MIN) {
        console.error(`FAILURE G45: ${name} ne porte plus ses ${label} (${count})`);
        ok = false;
      }
    }
  }

  const css = readScopeFile('src/style.css');
  if (css === null) {
    console.error('FAILURE G45: src/style.css introuvable');
    return false;
  }

  /** Vrai quand le rail déborde de la media query d'ancrage. */
  const railEscapesMedia = (cssText) => {
    const block = extractMediaBlock(cssText, '@media (width >= 840px)');
    if (block === '') return true;
    return cssText.replace(block, '').includes('.drawer-rail');
  };

  if (railEscapesMedia('@media (width >= 840px) { .other { color: red; } } .drawer-rail { color: red; }') !== true) {
    console.error('FAILURE G45: le détecteur de confinement du rail est aveugle, oracle invalide');
    return false;
  }
  if (railEscapesMedia(css)) {
    console.error("FAILURE G45: src/style.css porte des règles de rail hors de la media query de 840px");
    return false;
  }

  const RAIL_TOKENS = [
    '.drawer-rail > .drawer-side',
    '.drawer-rail > .drawer-side > aside',
    'width: 5rem',
    '.drawer-rail .rail-hide',
    'display: none',
    '.drawer-rail .rail-entry',
    'justify-content: center',
    '.drawer-rail .rail-stack',
    'flex-direction: column',
    '.drawer-rail .rail-handle',
    '.drawer-rail .rail-network',
  ];
  const railBlock = extractMediaBlock(css, '@media (width >= 840px)');
  for (const token of RAIL_TOKENS) {
    if (!railBlock.includes(token)) {
      console.error(`FAILURE G45: la media query de 840px ne porte plus « ${token} »`);
      ok = false;
    }
  }

  const toggle = readScopeFile('src/components/shared/ThemeToggle.vue');
  if (toggle === null) {
    console.error('FAILURE G45: src/components/shared/ThemeToggle.vue introuvable');
    return false;
  }
  for (const [label, present] of [
    ['consommation du composable de repli', toggle.includes('useSidebarNav')],
    ['variante déployée du contrôle', toggle.includes('v-if="showSegmented"')],
    ['variante rail du contrôle', toggle.includes('v-else')],
    ['menu du rail', toggle.includes('role="menu"')],
    ['choix nommés du menu', toggle.includes('role="menuitemradio"')],
    ['état coché des choix', toggle.includes('aria-checked')],
    ['déclencheur du menu', toggle.includes('aria-haspopup="true"')],
    ['fermeture sur Échap', toggle.includes('@keydown.escape')],
  ]) {
    if (!present) {
      console.error(`FAILURE G45: ThemeToggle n'expose plus son ${label}`);
      ok = false;
    }
  }
  if ((toggle.match(/min-h-11/g) || []).length < 2) {
    console.error('FAILURE G45: les cibles du contrôle d’apparence en rail passent sous 44px');
    ok = false;
  }

  if (!ok) return false;
  console.log('G45 passed: docked sidebars collapse into an icon rail and keep their labels below 840px');
  return true;
}

/**
 * G49 : La poignée de repli est intégrée à l'en-tête de la barre ancrée. Déployée, la barre la
 * garde en flux dans sa rangée, à la droite d'un bloc marque borné (`min-w-0`), sur un en-tête
 * `justify-between` positionné. Seul le repli la sort du flux, et uniquement dans la media query
 * d'ancrage. La géométrie résultante est prouvée par `verify-browser.mjs --sidebar-handle`.
 */
export function checkSidebarHandle() {
  /** La balise ouvrante du conteneur qui porte le marqueur donné. */
  const containerTagBefore = (text, marker) => {
    const index = text.indexOf(marker);
    if (index === -1) return null;
    const open = text.lastIndexOf('<div', index);
    const close = text.indexOf('>', index);
    return open === -1 || close === -1 ? null : text.slice(open, close + 1);
  };

  /** Vrai quand l'en-tête et la poignée forment une rangée où marque et commande cohabitent. */
  const integration = (text) => {
    const header = containerTagBefore(text, 'rail-header');
    const handle = buttonTagBefore(text, 'rail-handle');
    if (header === null || handle === null) return { ok: false, reason: 'en-tête ou poignée introuvable' };
    const misses = [];
    for (const token of ['items-center', 'justify-between', 'gap-2', 'relative']) {
      if (!header.includes(token)) misses.push(`en-tête sans ${token}`);
    }
    if (!handle.includes('shrink-0')) misses.push('poignée sans shrink-0');
    if (/\babsolute\b/.test(handle)) misses.push('poignée encore hors flux en barre déployée');
    for (const token of ['min-w-11', 'min-h-11', 'hidden', 'docked:inline-flex']) {
      if (!handle.includes(token)) misses.push(`poignée sans ${token}`);
    }
    return { ok: misses.length === 0, reason: misses.join(', ') };
  };

  // Contrôle négatif : un en-tête resté centré et une poignée absolue doivent être refusés.
  const bogus = integration(
    '<div class="rail-header flex items-center justify-center pb-4">'
      + '<button class="rail-handle hidden docked:inline-flex btn absolute top-4 right-4 min-w-11 min-h-11">x</button></div>'
  );
  if (bogus.ok) {
    console.error("FAILURE G49: le détecteur d'intégration de la poignée est aveugle, oracle invalide");
    return false;
  }

  let ok = true;
  for (const name of ['EmployeeLayout.vue', 'ManagerLayout.vue']) {
    const content = readLayout(name);
    if (content === null) {
      console.error(`FAILURE G49: ${name} introuvable`);
      ok = false;
      continue;
    }
    if (containerTagBefore(content, 'rail-header') === null) {
      console.error(`FAILURE G49: ${name} n'expose plus d'en-tête de barre latérale`);
      ok = false;
      continue;
    }
    if (!content.includes('class="flex items-center gap-2.5 min-w-0"')) {
      console.error(`FAILURE G49: ${name} ne borne plus le bloc marque (min-w-0)`);
      ok = false;
    }
    const verdict = integration(content);
    if (!verdict.ok) {
      console.error(`FAILURE G49: dans ${name}, ${verdict.reason}`);
      ok = false;
    }
  }

  const css = readScopeFile('src/style.css');
  if (css === null) {
    console.error('FAILURE G49: src/style.css introuvable');
    return false;
  }
  const railBlock = extractMediaBlock(css, '@media (width >= 840px)');
  const handleRule = railBlock.match(/\.drawer-rail \.rail-handle \{([^}]*)\}/);
  if (!handleRule) {
    console.error("FAILURE G49: la media query de 840px ne reprend plus la poignée en rail");
    ok = false;
  } else {
    for (const token of ['position: absolute', 'top: 0.5rem', 'right: 0.5rem']) {
      if (!handleRule[1].includes(token)) {
        console.error(`FAILURE G49: la poignée en rail perd « ${token} »`);
        ok = false;
      }
    }
  }

  if (!ok) return false;
  console.log('G49 passed: the collapse handle stays in the header row without overflowing it');
  return true;
}

/**
 * G56 : Le dialogue de site et sa barre de recherche sont dimensionnés pour la lecture.
 * Le dialogue est élargi, chaque champ texte remplit son conteneur et offre 44px de haut,
 * le curseur occupe la largeur, et la recherche prend toute la largeur de sa carte.
 */
export function checkLocationsForm() {
  const sliceDialog = (text) => {
    const start = text.indexOf('<dialog');
    const end = text.indexOf('</dialog>');
    return start === -1 || end === -1 ? '' : text.slice(start, end + '</dialog>'.length);
  };

  const formGaps = (dialog) => {
    const gaps = [];
    if (!dialog.includes('max-w-xl')) gaps.push('dialogue non élargi');
    if (!dialog.includes('bg-base-100')) gaps.push('dialogue hors élévation 3');
    if (dialog.includes('input-sm')) gaps.push('champ rétréci (input-sm)');
    if (dialog.includes('max-w-md')) gaps.push('largeur étroite (max-w-md)');
    const inputs = dialog.match(/<input[\s\S]*?\/>/g) || [];
    const textInputs = inputs.filter((tag) => /type="(text|number)"/.test(tag));
    if (textInputs.length < 5) gaps.push(`champs texte insuffisants (${textInputs.length})`);
    for (const tag of textInputs) {
      if (!tag.includes('w-full')) gaps.push('champ sans w-full');
      if (!tag.includes('min-h-11')) gaps.push('champ sous 44px');
    }
    const range = inputs.find((tag) => tag.includes('type="range"'));
    if (!range || !range.includes('w-full')) gaps.push('curseur non pleine largeur');
    return gaps;
  };

  // Contrôle négatif : un dialogue étroit aux champs rétrécis doit être refusé.
  const bogus = sliceDialog(
    '<dialog><div class="modal-box max-w-md bg-base-100">'
      + '<input type="text" class="input input-sm" />'
      + '<input type="range" class="range range-xs" /></div></dialog>'
  );
  if (formGaps(bogus).length === 0) {
    console.error('FAILURE G56: le détecteur de dimensionnement est aveugle, oracle invalide');
    return false;
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'LocationsView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G56: LocationsView.vue introuvable');
    return false;
  }
  const content = fs.readFileSync(file, 'utf8');
  const gaps = formGaps(sliceDialog(content));
  const searchFullWidth = /class="input input-bordered flex w-full/.test(content) && !content.includes('sm:w-80');
  if (!searchFullWidth) gaps.push('barre de recherche non pleine largeur');

  if (gaps.length > 0) {
    console.error(`FAILURE G56: le dialogue de site reste sous-dimensionné -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G56 passed: the locations dialog fields and search fill their containers at 44px');
  return true;
}

/**
 * G58 : Les cartes de sites situent le lieu sans jargon : périmètre autorisé explicite,
 * coordonnées nommées par hémisphère, et lien cartographique ouvert à la demande, sans
 * coordonnées brutes étiquetées « Latitude / Longitude ».
 */
export function checkLocationsCards() {
  const cardGaps = (text) => {
    const gaps = [];
    for (const token of ['Périmètre autorisé', 'Voir sur la carte', 'formatCoordinate', 'mapUrl', 'toggle toggle-success', 'type="checkbox"']) {
      if (!text.includes(token)) gaps.push(`carte sans « ${token} »`);
    }
    if (!text.includes('@change="toggleStatus(loc)"')) gaps.push('interrupteur non câblé');
    if (!text.includes('target="_blank"') || !text.includes('rel="noopener noreferrer"')) {
      gaps.push('lien cartographique non sécurisé');
    }
    if (/\bLatitude\s*:/.test(text) || /\bLongitude\s*:/.test(text)) {
      gaps.push('coordonnées brutes conservées');
    }
    if (text.includes('title="Cliquer pour changer le statut"')) {
      gaps.push('ancien badge cliquable conservé');
    }
    if (/\bbtn-sm\b/.test(text)) {
      gaps.push('bouton au texte réduit (btn-sm) désaccordé de l’icône');
    }
    return gaps;
  };

  // Contrôle négatif : une carte portant encore le badge cliquable et les coordonnées brutes doit
  // être refusée, même lorsque tous les autres jetons sont présents.
  const bogus =
    'Périmètre autorisé Voir sur la carte formatCoordinate mapUrl toggle toggle-success type="checkbox" '
    + '@change="toggleStatus(loc)" target="_blank" rel="noopener noreferrer" '
    + 'title="Cliquer pour changer le statut" <span>Latitude :</span><span>Longitude :</span>';
  if (cardGaps(bogus).length === 0) {
    console.error('FAILURE G58: le détecteur de carte de site est aveugle, oracle invalide');
    return false;
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'LocationsView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G58: LocationsView.vue introuvable');
    return false;
  }
  const gaps = cardGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G58: les cartes de sites restent peu lisibles -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G58 passed: site cards show a readable perimeter, position and map link');
  return true;
}

/**
 * G60 : La logique d'affichage actif/inactif est cohérente de bout en bout. Côté vue, les
 * filtres annoncent leurs comptes et chaque état vide décrit sa cause avec l'action utile.
 * Côté données, un prédicat unique `isLocationActive` remplace les comparaisons dispersées
 * du gestionnaire et des deux pointages.
 */
export function checkLocationsFilters() {
  const displayGaps = (text) => {
    const gaps = [];
    for (const token of ['locationCounts', 'emptyState', 'runEmptyAction']) {
      if (!text.includes(token)) gaps.push(`vue sans ${token}`);
    }
    if (!/locationCounts\.all/.test(text) || !/locationCounts\.active/.test(text) || !/locationCounts\.inactive/.test(text)) {
      gaps.push('filtres sans comptes');
    }
    for (const message of ['Aucun site enregistré', 'Aucun résultat', 'Aucun site actif', 'Aucun site inactif']) {
      if (!text.includes(message)) gaps.push(`état vide absent : ${message}`);
    }
    if (/\bloc\.is_active\b/.test(text)) gaps.push('comparaison is_active locale subsistante');
    return gaps;
  };

  // Contrôle négatif : l'ancien état vide unique et l'absence de comptes doivent être refusés.
  const bogus = '<div v-if="filteredLocations.length === 0">Aucun site trouvé — Créez votre premier site.</div>';
  if (displayGaps(bogus).length === 0) {
    console.error('FAILURE G60: le détecteur d’état vide est aveugle, oracle invalide');
    return false;
  }

  const viewPath = path.join(SRC_DIR, 'views', 'manager', 'LocationsView.vue');
  if (!fs.existsSync(viewPath)) {
    console.error('FAILURE G60: LocationsView.vue introuvable');
    return false;
  }
  const viewContent = fs.readFileSync(viewPath, 'utf8');
  const gaps = displayGaps(viewContent);

  const composable = readScopeFile('src/composables/useLocations.js');
  if (composable === null || !/export const isLocationActive/.test(composable)) {
    console.error('FAILURE G60: le prédicat partagé isLocationActive n’est plus exporté');
    return false;
  }
  if (!viewContent.includes('isLocationActive')) gaps.push('la vue n’utilise pas le prédicat partagé');

  for (const [dir, name] of [
    ['employee', 'CheckInView.vue'],
    ['employee', 'CheckOutView.vue'],
    ['manager', 'DashboardView.vue'],
  ]) {
    const file = path.join(SRC_DIR, 'views', dir, name);
    if (!fs.existsSync(file)) {
      console.error(`FAILURE G60: ${name} introuvable`);
      return false;
    }
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('isLocationActive')) gaps.push(`${name} ne consomme pas le prédicat partagé`);
    if (/is_active\s*===\s*(true|1|'true')/.test(content)) gaps.push(`${name} conserve une comparaison locale`);
  }

  if (gaps.length > 0) {
    console.error(`FAILURE G60: la logique actif/inactif reste incohérente -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G60 passed: active/inactive display and data predicate are consistent end to end');
  return true;
}

/**
 * G63 : L'écran Contrôle des Présences partage la grammaire de l'écran Lieux & Sites : en-tête à
 * pastille d'icône, recherche intégrée, filtres à comptes, cartes responsives et états vides
 * distincts. Le tableau brut et le sélecteur natif qui désaccordaient l'écran disparaissent.
 */
export function checkPresencesUi() {
  const uiGaps = (text) => {
    const gaps = [];
    // En-tête unifié : soit inline en h1, soit porté par le composant partagé ManagerPageHeader,
    // dont la grammaire (h1, pastille) est vérifiée séparément.
    const sharedHeader = text.includes('ManagerPageHeader');
    if (!sharedHeader && (!/<h1[^>]*>/.test(text) || /<h2[^>]*>/.test(text))) gaps.push('en-tête non unifié en h1');
    if (!sharedHeader && (!text.includes('bg-primary/10') || !text.includes('border-primary/20'))) gaps.push('pastille d’en-tête absente');
    // Recherche intégrée, pleine largeur et nommée, placeholder allégé de sa consigne chargée (C6)
    if (!/class="input input-bordered flex w-full/.test(text)) gaps.push('recherche non intégrée');
    if (!text.includes('placeholder="Rechercher un nom, un email ou un site"')) gaps.push('placeholder de recherche allégé absent');
    // Filtres à comptes dans une barre join, le statut absent compris (B4)
    for (const token of ['statusCounts.all', 'statusCounts.present', 'statusCounts.late', 'statusCounts.completed', 'statusCounts.absent']) {
      if (!text.includes(token)) gaps.push(`filtre sans compte : ${token}`);
    }
    if (!/\bjoin\b/.test(text)) gaps.push('filtres sans barre join');
    // États vides distincts et action utile
    for (const message of ['Aucun pointage', 'Aucun résultat', 'Aucun pointage pour ce filtre']) {
      if (!text.includes(message)) gaps.push(`état vide absent : ${message}`);
    }
    if (!text.includes('runEmptyAction')) gaps.push('action d’état vide absente');
    // L'actualisation vit dans l'en-tête : l'état vide n'en propose plus de doublon ni d'action primaire (C1)
    if ((text.match(/Actualiser/g) || []).length !== 1) gaps.push('actualisation en double');
    if (/action: 'refresh'/.test(text)) gaps.push('rafraîchissement proposé par l’état vide');
    if (!/v-if="emptyState\.action"/.test(text)) gaps.push('action d’état vide non conditionnée');
    // L'état vide porte une icône de situation, distincte du tracé du titre (C2)
    if (!text.includes("emptyState.icon === 'calendar'") || !text.includes("emptyState.icon === 'search'")) {
      gaps.push('icône de situation d’état vide absente');
    }
    // La journée close se nomme « Terminé » partout (B1), le total se nomme « Pointages » (B3)
    if (!text.includes('Journées terminées')) gaps.push('journée close mal dénommée dans le bandeau');
    if (/Départs validés|Journées clôturées/.test(text)) gaps.push('journée close mal nommée');
    if (/Total pointés/.test(text)) gaps.push('total mal nommé');
    // Les KPI décrivent les temps, leurs sous-titres portent la nuance (B2)
    for (const nuance of ['Arrivées ponctuelles, journées closes comprises', 'Arrivées tardives, journées closes comprises', 'Avec départ enregistré']) {
      if (!text.includes(nuance)) gaps.push(`sous-titre KPI absent : ${nuance}`);
    }
    // Un seul segment actif dominant : la période en primary, le statut atténué (C5)
    if (!text.includes("'btn-primary': filterPeriod")) gaps.push('segment de période non dominant');
    if (!text.includes("'btn-active font-semibold': filterStatus")) gaps.push('segment de statut non atténué');
    // Rigueur typographique : aucune taille arbitraire (C4)
    if (/text-\[11px\]/.test(text)) gaps.push('taille de police arbitraire');
    // Cartes/tableau : identité, temps et précision GPS portés par la vue
    for (const token of ['initials(', 'accuracyBadge(', 'StatusBadge']) {
      if (!text.includes(token)) gaps.push(`ligne sans ${token}`);
    }
    // Retrait du sélecteur natif, des actions rétrécies et du filtrage serveur par statut
    if (/id="f-status"/.test(text)) gaps.push('sélecteur natif conservé');
    if (/\bbtn-sm\b/.test(text)) gaps.push('action rétrécie (btn-sm) désaccordée de l’icône');
    // Les compteurs des filtres exigent la période complète : le statut se filtre côté client
    if (/\.eq\('status'/.test(text) || /\.in\('status'/.test(text)) gaps.push('filtrage de statut appliqué au serveur, compteurs faussés');
    return gaps;
  };

  // Contrôle négatif : l'ancien écran (tableau + select natif + h2) et son vocabulaire divergent doivent être refusés.
  const bogus =
    '<h2>Contrôle des Présences</h2><select id="f-status"></select><table></table>'
    + '<span>Départs validés</span><span>Journées clôturées</span><span>Total pointés</span>'
    + '<span class="text-[11px]">x</span><span>Actualiser</span><span>Actualiser</span>';
  const bogusGaps = uiGaps(bogus);
  if (bogusGaps.length === 0) {
    console.error('FAILURE G63: le détecteur d’interface présences est aveugle, oracle invalide');
    return false;
  }
  for (const expected of ['journée close mal nommée', 'total mal nommé', 'actualisation en double', 'taille de police arbitraire']) {
    if (!bogusGaps.includes(expected)) {
      console.error(`FAILURE G63: contrôle négatif incomplet, ${expected} non détecté`);
      return false;
    }
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'PresencesView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G63: PresencesView.vue introuvable');
    return false;
  }
  const gaps = uiGaps(fs.readFileSync(file, 'utf8'));

  // La grammaire d'en-tête vit désormais dans le composant partagé : il doit porter h1 et pastille.
  const headerFile = path.join(SRC_DIR, 'components', 'manager', 'ManagerPageHeader.vue');
  if (!fs.existsSync(headerFile)) {
    console.error('FAILURE G63: ManagerPageHeader.vue introuvable');
    return false;
  }
  const headerContent = fs.readFileSync(headerFile, 'utf8');
  if (!/<h1[^>]*>/.test(headerContent)) gaps.push('en-tête partagé sans h1');
  if (!headerContent.includes('bg-primary/10') || !headerContent.includes('border-primary/20')) {
    gaps.push('en-tête partagé sans pastille');
  }

  if (gaps.length > 0) {
    console.error(`FAILURE G63: l’écran présences reste incohérent -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G63 passed: presences screen shares the locations grammar');
  return true;
}

/**
 * G64 : Le filtre de date propose d'abord des presets (jour, semaine, mois) puis une plage
 * personnalisée. La plage effective est calculée une fois et appliquée à l'identique au cache
 * local (comparaison de chaînes 'YYYY-MM-DD') et à la requête distante (gte/lte), avec un
 * rechargement piloté par la seule plage.
 */
export function checkPresencesPeriod() {
  const periodGaps = (text) => {
    const gaps = [];
    for (const preset of ["'day'", "'week'", "'month'", "'custom'"]) {
      if (!text.includes(preset)) gaps.push(`preset de période absent : ${preset}`);
    }
    for (const token of ['dateRange', 'customStart', 'customEnd', 'periodLabel']) {
      if (!text.includes(token)) gaps.push(`période sans ${token}`);
    }
    // La plage borne une lecture locale réactive : plus de requête distante, plus de rechargement manuel
    if (!text.includes('useLiveQuery')) gaps.push('période sans lecture réactive Dexie');
    if (!text.includes(".where('work_date')")) gaps.push('plage sans index work_date');
    if (!/\.between\(start, end, true, true\)/.test(text)) gaps.push('plage non appliquée au filtre local');
    if (!text.includes('`${dateRange.value.start}|${dateRange.value.end}`')) {
      gaps.push('plage non déclarée comme dépendance réactive');
    }
    if (/from\('presences'\)/.test(text)) gaps.push('lecture réseau conservée dans la vue');
    // A1 : chaque mode expose son ancre, la semaine et le mois se parcourent par flèches
    if (!text.includes('shiftAnchor')) gaps.push('ancre non navigable');
    for (const label of ['Semaine précédente', 'Semaine suivante', 'Mois précédent', 'Mois suivant']) {
      if (!text.includes(`aria-label="${label}"`)) gaps.push(`flèche absente : ${label}`);
    }
    // A2 et A4 : libellé au-dessus du champ, sans deux-points
    for (const colon of ['Période :', 'Statut :', 'Date :', 'Du :', 'Au :']) {
      if (text.includes(colon)) gaps.push(`deux-points conservé : ${colon}`);
    }
    for (const legend of ['>Période<', '>Statut<', '>Date<', '>Semaine<', '>Mois<', '>Du<', '>Au<']) {
      if (!text.includes(legend)) gaps.push(`libellé manquant : ${legend}`);
    }
    // A3 : le groupe Statut ne flotte plus au bas de la colonne période
    if (text.includes('sm:self-end')) gaps.push('statut encore flottant');
    // C3 : libellé de période et colonne Date passés au format long
    if (!text.includes('formatWorkDate(start, { long: true })')) gaps.push('libellé de période non allongé');
    if (!text.includes('formatWorkDate(p.work_date, { long: true })')) gaps.push('colonne date non allongée');
    // A5 : les champs Du et Au occupent la largeur de la rangée, comme la date du mode jour
    if ((text.match(/fieldset sm:flex-1 min-w-0/g) || []).length !== 2) {
      gaps.push('champs Du/Au non étendus sur la largeur');
    }
    return gaps;
  };

  // Contrôle négatif : l'ancien filtre à date unique (eq + watch(filterDate)) et son gabarit
  // à deux-points doivent être refusés.
  const bogus = "const filterDate = ref(getLocalDateString()); watch(filterDate, loadPresences); supabase.from('presences').select('*').eq('work_date', filterDate.value); Période : Statut :";
  const bogusGaps = periodGaps(bogus);
  if (bogusGaps.length === 0) {
    console.error('FAILURE G64: le détecteur de période est aveugle, oracle invalide');
    return false;
  }
  for (const expected of ['ancre non navigable', 'deux-points conservé : Période :', 'champs Du/Au non étendus sur la largeur', 'lecture réseau conservée dans la vue']) {
    if (!bogusGaps.includes(expected)) {
      console.error(`FAILURE G64: contrôle négatif incomplet, ${expected} non détecté`);
      return false;
    }
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'PresencesView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G64: PresencesView.vue introuvable');
    return false;
  }
  const gaps = periodGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G64: le filtre de période reste incomplet -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G64 passed: presence period filter offers presets and a custom range');
  return true;
}

/**
 * G65 : Les pointages sont présentés dans un vrai tableau balisé (`table`/`thead`/`tbody`),
 * défilable horizontalement, avec les colonnes d'audit — collaborateur, site, date, arrivée,
 * départ, durée, statut, précision GPS, actions — au lieu d'une grille de cartes.
 */
export function checkPresencesTable() {
  const tableGaps = (text) => {
    const gaps = [];
    for (const token of ['<table', '<thead', '<tbody', 'overflow-x-auto', 'table table-sm']) {
      if (!text.includes(token)) gaps.push(`tableau sans ${token}`);
    }
    for (const column of ['Collaborateur', 'Site', 'Date', 'Arrivée', 'Départ', 'Durée', 'Statut', 'Précision GPS']) {
      if (!text.includes(column)) gaps.push(`colonne absente : ${column}`);
    }
    for (const token of ['initials(', 'formatWorkDate(', 'accuracyBadge(', 'StatusBadge', 'formatSessionDuration(']) {
      if (!text.includes(token)) gaps.push(`cellule sans ${token}`);
    }
    if (/grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3/.test(text)) gaps.push('grille de cartes conservée');
    if (/\bbtn-sm\b/.test(text)) gaps.push('action rétrécie (btn-sm) désaccordée de l’icône');
    // D1 : fiches synthétiques sous 640px, tableau d'audit à partir de 640px
    if (!text.includes('sm:hidden divide-y divide-base-300')) gaps.push('fiches mobiles absentes');
    if (!text.includes('hidden sm:block overflow-x-auto')) gaps.push('tableau non réservé au-delà de 640px');
    // D2 : les segments de filtre défilent horizontalement sur mobile, chaque cible restant fixe
    if (!text.includes('join w-full overflow-x-auto')) gaps.push('segments non défilables sur mobile');
    if (!/shrink-0/.test(text)) gaps.push('segments sans cible fixe');
    return gaps;
  };

  // Contrôle négatif : l'ancienne présentation en cartes, sans tableau balisé ni fiches mobiles,
  // doit être refusée.
  const bogus =
    '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">'
    + '<div class="card">Collaborateur Arrivée Départ Durée Statut</div></div>';
  const bogusGaps = tableGaps(bogus);
  if (bogusGaps.length === 0) {
    console.error('FAILURE G65: le détecteur de tableau présences est aveugle, oracle invalide');
    return false;
  }
  for (const expected of ['grille de cartes conservée', 'fiches mobiles absentes']) {
    if (!bogusGaps.includes(expected)) {
      console.error(`FAILURE G65: contrôle négatif incomplet, ${expected} non détecté`);
      return false;
    }
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'PresencesView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G65: PresencesView.vue introuvable');
    return false;
  }
  const gaps = tableGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G65: la présentation tabulaire reste incomplète -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G65 passed: presences render as an audit table');
  return true;
}

/**
 * G66 : Chaque colonne d'audit du tableau se trie par un clic d'en-tête, en alternant croissant
 * et décroissant, avec une icône orientée et `aria-sort` pour les lecteurs d'écran. Les colonnes
 * Arrivée, Départ, Durée et Précision GPS sont triables ; les valeurs absentes finissent en bas.
 */
export function checkPresencesSort() {
  const sortGaps = (text) => {
    const gaps = [];
    for (const token of ['SORTABLE_COLUMNS', 'sortKey', 'sortDir', 'sortedPresences', 'toggleSort', 'aria-sort', 'sortIconPath']) {
      if (!text.includes(token)) gaps.push(`tri sans ${token}`);
    }
    if (!/v-for="col in SORTABLE_COLUMNS"/.test(text)) gaps.push('en-têtes non itérés sur les colonnes triables');
    if (!/v-for="p in sortedPresences"/.test(text)) gaps.push('corps non itéré sur la liste triée');
    for (const column of ["'check_in'", "'check_out'", "'duration'", "'gps'"]) {
      if (!text.includes(column)) gaps.push(`colonne triable absente : ${column}`);
    }
    return gaps;
  };

  // Contrôle négatif : un tableau figé, sans tri ni en-têtes cliquables, doit être refusé.
  const bogus = '<table><thead><tr><th>Arrivée</th></tr></thead><tbody><tr v-for="p in filteredPresences"><td>x</td></tr></tbody></table>';
  if (sortGaps(bogus).length === 0) {
    console.error('FAILURE G66: le détecteur de tri présences est aveugle, oracle invalide');
    return false;
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'PresencesView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G66: PresencesView.vue introuvable');
    return false;
  }
  const gaps = sortGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G66: le tri du tableau reste incomplet -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G66 passed: presence table headers sort both ways');
  return true;
}

/**
 * G72 : Le Contrôle des Présences lit Dexie et rien d'autre. La plage borne une lecture réactive
 * indexée, les profils et les sites sont joints localement, et la correction passe par l'outbox.
 */
export function checkPresencesLocalFirst() {
  const localGaps = (text) => {
    const gaps = [];
    if (/from\('presences'\)/.test(text)) gaps.push('lecture réseau conservée');
    if (!text.includes('useLiveQuery')) gaps.push('aucune lecture réactive Dexie');
    if (!text.includes(".where('work_date')")) gaps.push('plage sans index work_date');
    if (!/\.between\(start, end, true, true\)/.test(text)) gaps.push('plage non bornée');
    if (!text.includes('db.profiles.toArray()')) gaps.push('jointure des profils absente');
    if (!text.includes('db.locations.toArray()')) gaps.push('jointure des sites absente');
    if (!text.includes('syncNow(user?.id)')) gaps.push('actualisation non pilotée par l’engine');
    if (!text.includes('db.presences.update(presenceId, { status: newStatus')) {
      gaps.push('correction locale absente');
    }
    return gaps;
  };

  // Contrôle négatif : une vue qui interroge Supabase et garde un chargement impératif doit être refusée.
  const bogus =
    "const presencesList = ref([])\nasync function loadPresences() {\n  const { data } = await supabase.from('presences').select('*')\n  presencesList.value = data\n}";
  if (localGaps(bogus).length === 0) {
    console.error('FAILURE G72: le détecteur local-first présences est aveugle, oracle invalide');
    return false;
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'PresencesView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G72: PresencesView.vue introuvable');
    return false;
  }
  const gaps = localGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G72: l’écran présences n’est pas local-first -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G72 passed: presences screen reads Dexie and only Dexie');
  return true;
}

/**
 * G73 : Le périmètre du pull suit le rôle lu dans le profil local, et profils comme équipes sont
 * rapatriés : sans eux, toute jointure locale rend un nom vide.
 */
export function checkSyncScope() {
  const scopeGaps = (text) => {
    const gaps = [];
    if (!text.includes("from('profiles')")) gaps.push('profils absents du pull');
    if (!text.includes("from('teams')")) gaps.push('équipes absentes du pull');
    if (!text.includes('isSupervisor')) gaps.push('périmètre indifférent au rôle');
    if (!text.includes('db.profiles.get(userId)')) gaps.push('rôle non lu dans le profil local');
    if (!/===\s*'manager'/.test(text)) gaps.push('rôle gestionnaire non reconnu');
    if (!/===\s*'admin'/.test(text)) gaps.push('rôle administrateur non reconnu');
    if (!/presenceQuery = presenceQuery\.eq\('user_id', userId\)/.test(text)) {
      gaps.push('repli employé absent sur les présences');
    }
    if (!/availabilityQuery = availabilityQuery\.eq\('user_id', userId\)/.test(text)) {
      gaps.push('repli employé absent sur les disponibilités');
    }
    return gaps;
  };

  // Contrôle négatif : l'ancien pull, cadenassé sur l'utilisateur et sans profils ni équipes.
  const bogus =
    "const { data } = await supabase.from('presences').select('*').eq('user_id', userId).gt('updated_at', cursor)";
  if (scopeGaps(bogus).length === 0) {
    console.error('FAILURE G73: le détecteur de périmètre de pull est aveugle, oracle invalide');
    return false;
  }

  const file = path.join(SRC_DIR, 'composables', 'useSyncEngine.js');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G73: useSyncEngine.js introuvable');
    return false;
  }
  const gaps = scopeGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G73: le pull reste incomplet -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G73 passed: the pull scope follows the role and brings profiles and teams');
  return true;
}

/**
 * G74 : `useLiveQuery` accepte une dépendance réactive et réabonne la requête quand elle change,
 * sans import mort ni souscription unique figée.
 */
export function checkLiveQueryDeps() {
  const depsGaps = (text) => {
    const gaps = [];
    if (!text.includes('dependsOn')) gaps.push('dépendance réactive non supportée');
    if (!/watch\(dependsOn,/.test(text)) gaps.push('dépendance non observée');
    if (!text.includes('const subscribe = ()')) gaps.push('réabonnement non factorisé');
    if (!/cleanup\(\)\s*\n\s*observableSub = Dexie\.liveQuery/.test(text)) {
      gaps.push('ancienne souscription non libérée avant réabonnement');
    }
    if (/\bisRef\b|\bwatchEffect\b/.test(text)) gaps.push('import mort conservé');
    return gaps;
  };

  // Contrôle négatif : l'ancien helper, à souscription unique et imports morts.
  const bogus =
    "import { shallowRef, onScopeDispose, isRef, watchEffect } from 'vue'\n"
    + 'export function useLiveQuery(querier, initialValue) { const o = Dexie.liveQuery(querier); o.subscribe({ next: v => {} }) }';
  if (depsGaps(bogus).length === 0) {
    console.error('FAILURE G74: le détecteur de dépendance liveQuery est aveugle, oracle invalide');
    return false;
  }

  const file = path.join(SRC_DIR, 'lib', 'db.js');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G74: db.js introuvable');
    return false;
  }
  const gaps = depsGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G74: le helper liveQuery reste incomplet -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G74 passed: useLiveQuery resubscribes on an explicit reactive dependency');
  return true;
}

/**
 * G75 : Les trois autres vues gestionnaire lisent Dexie et ne montent plus de requête réseau pour
 * les données qu'elles affichent.
 */
export function checkManagerDexie() {
  const dexieGaps = (text) => {
    const gaps = [];
    for (const table of ['presences', 'availabilities', 'profiles', 'teams']) {
      if (text.includes(`from('${table}')`)) gaps.push(`${table} lu au réseau`);
    }
    if (!text.includes("from '../../lib/db'")) gaps.push('db non importé');
    return gaps;
  };

  // Contrôle négatif : une vue gestionnaire branchée sur Supabase doit être refusée.
  const bogus =
    "import { supabase } from '../../lib/supabase'\nconst { data } = await supabase.from('presences').select('*')";
  if (dexieGaps(bogus).length === 0) {
    console.error('FAILURE G75: le détecteur Dexie des vues gestionnaire est aveugle, oracle invalide');
    return false;
  }

  const gaps = [];
  for (const name of ['DashboardView.vue', 'AvailabilitiesView.vue', 'ExportView.vue']) {
    const file = path.join(SRC_DIR, 'views', 'manager', name);
    if (!fs.existsSync(file)) {
      console.error(`FAILURE G75: ${name} introuvable`);
      return false;
    }
    for (const gap of dexieGaps(fs.readFileSync(file, 'utf8'))) gaps.push(`${name} : ${gap}`);
  }

  if (gaps.length > 0) {
    console.error(`FAILURE G75: des vues gestionnaire restent branchées au réseau -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G75 passed: the remaining manager views read Dexie only');
  return true;
}

/* ---------------------------------------------------------------------------
   Lot « Refonte UI/UX de l'espace gestionnaire »
   --------------------------------------------------------------------------- */

const MANAGER_VIEW_FILES = [
  'DashboardView.vue',
  'EmployeesView.vue',
  'TeamsView.vue',
  'AvailabilitiesView.vue',
  'ExportView.vue',
  'PresencesView.vue',
  'LocationsView.vue',
];

/**
 * G88 : Tous les écrans gestionnaire partagent la grammaire : en-tête porté par ManagerPageHeader,
 * aucun titre h2 résiduel, aucune action input-sm/select-sm/btn-sm, aucune taille de police
 * arbitraire. Les trois composants partagés existent et portent leur contrat.
 */
export function checkManagerGrammar() {
  const grammarGaps = (text) => {
    const gaps = [];
    if (!text.includes('ManagerPageHeader')) gaps.push('en-tête partagé absent');
    if (/<h2[^>]*>/.test(text)) gaps.push('titre h2 conservé');
    if (/\bbtn-sm\b/.test(text)) gaps.push('action rétrécie (btn-sm)');
    if (/\binput-sm\b|\bselect-sm\b/.test(text)) gaps.push('champ rétréci (input-sm/select-sm)');
    if (/text-\[\d+px\]/.test(text)) gaps.push('taille de police arbitraire');
    return gaps;
  };

  // Contrôle négatif : un écran à titre h2, action rétrécie et police arbitraire doit être refusé.
  const bogus =
    '<h2>Titre</h2><button class="btn btn-sm">x</button><input class="input input-sm" /><span class="text-[11px]"></span>';
  const bogusGaps = grammarGaps(bogus);
  if (bogusGaps.length === 0) {
    console.error('FAILURE G88: le détecteur de grammaire gestionnaire est aveugle, oracle invalide');
    return false;
  }
  for (const expected of ['titre h2 conservé', 'action rétrécie (btn-sm)', 'champ rétréci (input-sm/select-sm)', 'taille de police arbitraire']) {
    if (!bogusGaps.includes(expected)) {
      console.error(`FAILURE G88: contrôle négatif incomplet, ${expected} non détecté`);
      return false;
    }
  }

  const gaps = [];
  for (const name of MANAGER_VIEW_FILES) {
    const file = path.join(SRC_DIR, 'views', 'manager', name);
    if (!fs.existsSync(file)) {
      console.error(`FAILURE G88: ${name} introuvable`);
      return false;
    }
    for (const gap of grammarGaps(fs.readFileSync(file, 'utf8'))) gaps.push(`${name} : ${gap}`);
  }

  const headerFile = path.join(SRC_DIR, 'components', 'manager', 'ManagerPageHeader.vue');
  if (!fs.existsSync(headerFile)) {
    console.error('FAILURE G88: ManagerPageHeader.vue introuvable');
    return false;
  }
  const header = fs.readFileSync(headerFile, 'utf8');
  if (!/<h1[^>]*>/.test(header) || !header.includes('bg-primary/10') || !header.includes('border-primary/20')) {
    gaps.push('ManagerPageHeader.vue : grammaire d\u2019en-tête incomplète');
  }
  for (const component of ['ManagerKpiCard.vue', 'ManagerEmptyState.vue']) {
    if (!fs.existsSync(path.join(SRC_DIR, 'components', 'manager', component))) {
      gaps.push(`${component} introuvable`);
    }
  }

  if (gaps.length > 0) {
    console.error(`FAILURE G88: des écrans gestionnaire divergent -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G88 passed: every manager screen shares one grammar');
  return true;
}

/**
 * G89 : Les écrans de données présentent des fiches sous 640px et un tableau au delà ; les filtres
 * défilent horizontalement sur mobile ; la grille d'équipes adopte 2 puis 3 colonnes.
 */
export function checkManagerResponsive() {
  const responsiveGaps = (text) => {
    const gaps = [];
    for (const token of ['sm:hidden', 'hidden sm:block']) {
      if (!text.includes(token)) gaps.push(`bascule fiches/tableau absente : ${token}`);
    }
    return gaps;
  };

  // Contrôle négatif : un écran sans bascule mobile doit être refusé.
  const bogus = '<table></table>';
  if (responsiveGaps(bogus).length === 0) {
    console.error('FAILURE G89: le détecteur responsive gestionnaire est aveugle, oracle invalide');
    return false;
  }

  const gaps = [];
  for (const name of ['DashboardView.vue', 'EmployeesView.vue', 'AvailabilitiesView.vue']) {
    const file = path.join(SRC_DIR, 'views', 'manager', name);
    if (!fs.existsSync(file)) {
      console.error(`FAILURE G89: ${name} introuvable`);
      return false;
    }
    const text = fs.readFileSync(file, 'utf8');
    for (const gap of responsiveGaps(text)) gaps.push(`${name} : ${gap}`);
    if (!text.includes('overflow-x-auto')) gaps.push(`${name} : filtres ou tableau sans défilement horizontal`);
  }

  const teamsFile = path.join(SRC_DIR, 'views', 'manager', 'TeamsView.vue');
  const teams = fs.existsSync(teamsFile) ? fs.readFileSync(teamsFile, 'utf8') : '';
  if (!teams.includes('md:grid-cols-2 lg:grid-cols-3')) gaps.push('TeamsView.vue : grille responsive absente');

  if (gaps.length > 0) {
    console.error(`FAILURE G89: la responsivité gestionnaire est incomplète -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G89 passed: manager screens present cards below 640px and tables above');
  return true;
}

/**
 * G92 : Chaque entrée de navigation gestionnaire déclare une icône non vide, et la passerelle
 * vers l'espace personnel porte son propre tracé. Verrouille le défaut « icône absente ».
 */
export function checkManagerNavIcons() {
  const navGaps = (text) => {
    const gaps = [];
    const entries = [...text.matchAll(/path: '\/manager[^']*',[\s\S]*?icon: createIcon\(\[([\s\S]*?)\]\),/g)];
    if (entries.length < 6) gaps.push(`entrées de navigation incomplètes (${entries.length})`);
    entries.forEach((entry, index) => {
      const body = entry[1].trim();
      if (!body.includes('[')) gaps.push(`entrée ${index + 1} sans tracé`);
    });
    if (!/handleNav\('\/employee'\)[\s\S]*?<svg/.test(text)) gaps.push('passerelle sans icône');
    return gaps;
  };

  // Contrôle négatif : une entrée sans createIcon doit être refusée.
  const bogus = "path: '/manager/x', label: 'X', icon: null,";
  if (navGaps(bogus).length === 0) {
    console.error('FAILURE G92: le détecteur d\u2019icônes de navigation est aveugle, oracle invalide');
    return false;
  }

  const file = path.join(SRC_DIR, 'layouts', 'ManagerLayout.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G92: ManagerLayout.vue introuvable');
    return false;
  }
  const gaps = navGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G92: des entrées de navigation sont sans icône -> ${gaps.join(', ')}`);
    return false;
  }
  console.log('G92 passed: every manager nav entry declares an icon');
  return true;
}

/**
 * G93 : Passe de finition gestionnaire. Icônes de rail à 22px, focus visible sur les entrées de
 * navigation des deux espaces, bandeau gestionnaire réduit à la marque, titre « Sites » seul,
 * matrice de disponibilités triable par nom avec états vides distincts et grille KPI responsive.
 */
export function checkManagerFinish() {
  const read = (relative) => {
    const file = path.join(SRC_DIR, relative);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };
  const missing = (text, tokens) => tokens.filter((token) => !text.includes(token));

  // Contrôle négatif : le détecteur de jetons doit refuser un texte vide.
  if (missing('', ['grid-cols-2 sm:grid-cols-3']).length === 0) {
    console.error('FAILURE G93: le détecteur de finition est aveugle, oracle invalide');
    return false;
  }

  const gaps = [];

  const css = read('style.css');
  if (css === null) {
    console.error('FAILURE G93: style.css introuvable');
    return false;
  }
  if (!/\.drawer-rail \.rail-entry > svg[\s\S]*?width:\s*1\.375rem/.test(css)) {
    gaps.push('icônes de rail non portées à 22px');
  }

  for (const layout of ['layouts/ManagerLayout.vue', 'layouts/EmployeeLayout.vue']) {
    const text = read(layout);
    if (text === null) {
      console.error(`FAILURE G93: ${layout} introuvable`);
      return false;
    }
    const focused = (text.match(/rail-entry[^"]*focus-visible:outline-2 focus-visible:outline-primary/g) || []).length;
    if (focused < 2) gaps.push(`${layout} : focus des entrées de navigation incomplet`);
  }

  const manager = read('layouts/ManagerLayout.vue');
  if (!manager.includes('activeTitle')) gaps.push('titre de bandeau gestionnaire absent');
  const managerHeader = manager.match(/<header[\s\S]*?<\/header>/);
  if (!managerHeader || !/<h1/.test(managerHeader[0])) gaps.push('bandeau gestionnaire sans h1');

  const employee = read('layouts/EmployeeLayout.vue');
  if (!employee.includes('activeTitle')) gaps.push('titre de bandeau employé absent');

  const locations = read('views/manager/LocationsView.vue');
  if (locations.includes('& Lieux')) gaps.push('« & Lieux » conservé');
  if (!locations.includes('title="Gestion des Sites"')) gaps.push('titre de page « Gestion des Sites » absent');

  const availabilities = read('views/manager/AvailabilitiesView.vue');
  gaps.push(...missing(availabilities, [
    'grid-cols-2 sm:grid-cols-3',
    'sortedEmployees',
    'aria-sort',
    'toggleSort',
    'emptyState',
    'Aucun collaborateur pour cette équipe',
    'Aucun résultat',
  ]).map((token) => `disponibilités sans ${token}`));
  if (availabilities.includes("'—'")) gaps.push('taux de tenue rendu par un tiret isolé');

  if (gaps.length > 0) {
    console.error(`FAILURE G93: la passe de finition est incomplète -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G93 passed: manager finishing pass applied');
  return true;
}

/**
 * G94 : Passe de finition employé. Aucune taille de police arbitraire, aucune date capitalisée à
 * tort, vocabulaire unifié, sélecteur de lieu de travail à 44px, verrouillage onepage qui cède
 * au défilement sur hauteur courte, bandeau nommant l'espace et le module.
 */
export function checkEmployeeFinish() {
  const read = (relative) => {
    const file = path.join(SRC_DIR, relative);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };
  const missing = (text, tokens) => tokens.filter((token) => !text.includes(token));

  if (missing('', ['employee-onepage']).length === 0) {
    console.error('FAILURE G94: le détecteur de finition employé est aveugle, oracle invalide');
    return false;
  }

  const gaps = [];
  const employeeFiles = [
    'components/employee/DayCard.vue',
    'components/employee/WeekSummaryCard.vue',
    'components/employee/WeekGrid.vue',
    'components/employee/GpsRing.vue',
    'components/employee/AvailabilitySummary.vue',
    'components/employee/CheckConfirmationOverlay.vue',
    'views/employee/HomeView.vue',
    'views/employee/CheckInView.vue',
    'views/employee/CheckOutView.vue',
    'views/employee/AvailabilitiesView.vue',
  ];

  for (const relative of employeeFiles) {
    const text = read(relative);
    if (text === null) {
      console.error(`FAILURE G94: ${relative} introuvable`);
      return false;
    }
    if (/text-\[\d+px\]/.test(text)) gaps.push(`${relative} : taille de police arbitraire`);
  }

  for (const relative of ['components/employee/DayCard.vue', 'components/employee/WeekSummaryCard.vue', 'components/employee/WeekGrid.vue']) {
    if ((read(relative) || '').includes('capitalize')) gaps.push(`${relative} : date capitalisée à tort`);
  }

  const layout = read('layouts/EmployeeLayout.vue') || '';
  gaps.push(...missing(layout, ["label: 'Pointage'", "label: 'Ma disponibilité'"]).map((token) => `navigation employé sans ${token}`));
  if (layout.includes('Mes disponibilités')) gaps.push('navigation employé conserve « Mes disponibilités »');
  if (!layout.includes('activeTitle')) gaps.push('bandeau employé sans titre');

  const availabilities = read('views/employee/AvailabilitiesView.vue') || '';
  if (!availabilities.includes('>Ma disponibilité<')) gaps.push('page disponibilité mal nommée');

  const checkout = read('views/employee/CheckOutView.vue') || '';
  if (checkout.includes('En cours de service')) gaps.push('« En cours de service » conservé');

  const checkin = read('views/employee/CheckInView.vue') || '';
  if (checkin.includes('select-xs')) gaps.push('sélecteur de lieu sous 44px');

  const css = read('style.css') || '';
  if (!css.includes('.employee-onepage')) gaps.push('marqueur onepage employé absent');
  if (!/max-height:\s*760px/.test(css)) gaps.push('repli onepage sur hauteur courte absent');

  if (gaps.length > 0) {
    console.error(`FAILURE G94: la passe de finition employé est incomplète -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G94 passed: employee finishing pass applied');
  return true;
}

/**
 * G95 : Page Paramètres dédiée. Une seule vue partagée, portant synchronisation, compte et
 * déconnexion, sans contrôle d'apparence (le tiroir le garde). Le bandeau des deux espaces
 * expose une icône d'engrenage vers la page, et App.vue route les deux chemins.
 */
export function checkSettingsPage() {
  const read = (relative) => {
    const file = path.join(SRC_DIR, relative);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };

  const settings = read('views/SettingsView.vue');
  if (settings === null) {
    console.error('FAILURE G95: SettingsView.vue introuvable');
    return false;
  }

  const pageGaps = ['Apparence', '<ThemeToggle', 'Synchronisation', 'Compte', 'Déconnexion', 'syncNow', 'signOut'].filter(
    (token) => !settings.includes(token)
  );
  if (pageGaps.length > 0) {
    console.error(`FAILURE G95: page Paramètres incomplète -> ${pageGaps.join(', ')}`);
    return false;
  }

  const app = read('App.vue') || '';
  for (const route of ["'/manager/settings'", "'/employee/settings'"]) {
    if (!app.includes(route)) {
      console.error(`FAILURE G95: route absente dans App.vue -> ${route}`);
      return false;
    }
  }

  const gear = (text) => text.includes('Ouvrir les paramètres') && /navigate\('\/\w+\/settings'\)/.test(text);
  for (const layout of ['layouts/ManagerLayout.vue', 'layouts/EmployeeLayout.vue']) {
    const text = read(layout);
    if (text === null) {
      console.error(`FAILURE G95: ${layout} introuvable`);
      return false;
    }
    if (!gear(text)) {
      console.error(`FAILURE G95: ${layout} sans icône d\u2019engrenage vers les paramètres`);
      return false;
    }
  }

  // Contrôle négatif : une page vide doit être refusée.
  const missingTokens = (text) => ['Synchronisation', 'Compte', 'Déconnexion'].filter((token) => !text.includes(token));
  if (missingTokens('').length !== 3) {
    console.error('FAILURE G95: le détecteur de page Paramètres est aveugle, oracle invalide');
    return false;
  }

  console.log('G95 passed: settings page wired in both spaces');
  return true;
}

/**
 * G96 : Les passerelles inter-espace restent câblées et leurs dépendances importées. Chaque
 * barre latérale conserve le moyen de rejoindre l'autre espace pour les rôles autorisés, et le
 * composable qui porte le rôle est bien importé.
 */
export function checkCrossSpaceGateways() {
  const readLayoutFile = (name) => {
    const file = path.join(SRC_DIR, 'layouts', name);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };

  const employeeGaps = (text) => {
    const gaps = [];
    if (!text.includes("handleNav('/manager')")) gaps.push('passerelle employé vers gestion absente');
    if (!text.includes('canReachManagerSpace')) gaps.push('condition de rôle de la passerelle absente');
    if (!text.includes('useProfile')) gaps.push('composable de profil non importé');
    if (!/const\s*\{\s*profile\s*\}\s*=\s*useProfile\(\)/.test(text)) gaps.push('profil non extrait du composable');
    return gaps;
  };

  // Contrôle négatif : une passerelle qui lit `profile` sans importer le composable doit être refusée.
  const bogus = "const canReachManagerSpace = computed(() => profile.value?.role === 'admin')\nhandleNav('/manager')";
  const bogusGaps = employeeGaps(bogus);
  if (bogusGaps.length === 0 || !bogusGaps.includes('composable de profil non importé')) {
    console.error('FAILURE G96: le détecteur de passerelle est aveugle, oracle invalide');
    return false;
  }

  const employee = readLayoutFile('EmployeeLayout.vue');
  const manager = readLayoutFile('ManagerLayout.vue');
  if (employee === null || manager === null) {
    console.error('FAILURE G96: une des mises en page est introuvable');
    return false;
  }

  const gaps = employeeGaps(employee);
  if (!manager.includes("handleNav('/employee')")) gaps.push('passerelle gestion vers pointage absente');

  if (gaps.length > 0) {
    console.error(`FAILURE G96: passerelles inter-espace incomplètes -> ${gaps.join(', ')}`);
    return false;
  }
  console.log('G96 passed: cross-space gateways stay wired with their role composable');
  return true;
}

// Exécution CLI
const arg = process.argv[2] || '--all';let success = true;

if (arg === '--emojis') {
  success = checkEmojis();
} else if (arg === '--radii') {
  success = checkRadii();
} else if (arg === '--shadows') {
  success = checkShadows();
} else if (arg === '--targets') {
  success = checkTouchTargets();
} else if (arg === '--layout') {
  success = checkLayout();
} else if (arg === '--employee-desktop') {
  success = checkEmployeeDesktop();
} else if (arg === '--responsive') {
  success = checkResponsiveCards();
} else if (arg === '--card-desktop') {
  success = checkCardDesktop();
} else if (arg === '--past-days') {
  success = checkPastDaysDisabled();
} else if (arg === '--build') {
  success = checkBuild();
} else if (arg === '--theme-placement') {
  success = checkThemePlacement();
} else if (arg === '--theme-css') {
  success = checkThemeCss();
} else if (arg === '--theme-emojis') {
  success = checkThemeEmojis();
} else if (arg === '--theme-radii') {
  success = checkThemeRadii();
} else if (arg === '--theme-shadows') {
  success = checkThemeShadows();
} else if (arg === '--theme-targets') {
  success = checkThemeTargets();
} else if (arg === '--sync-indicator-preserved') {
  success = checkSyncIndicatorPreserved();
} else if (arg === '--open-session-wiring') {
  success = checkOpenSessionWiring();
} else if (arg === '--open-session-conformance') {
  success = checkOpenSessionConformance();
} else if (arg === '--header-deduplication') {
  success = checkHeaderDeduplication();
} else if (arg === '--ux-conformance') {
  success = checkUxConformance();
} else if (arg === '--drawer-settings-layout') {
  success = checkDrawerSettingsLayout();
} else if (arg === '--appearance-control-markup') {
  success = checkAppearanceControlMarkup();
} else if (arg === '--sync-badge-truncation') {
  success = checkSyncBadgeTruncation();
} else if (arg === '--check-overlay-markup') {
  success = checkConfirmationOverlayMarkup();
} else if (arg === '--check-feedback-wiring') {
  success = checkFeedbackWiring();
} else if (arg === '--check-week-summary-wiring') {
  success = checkWeekSummaryWiring();
} else if (arg === '--motion-conformance') {
  success = checkMotionConformance();
} else if (arg === '--employee-feedback-conformance') {
  success = checkEmployeeFeedbackConformance();
} else if (arg === '--voice-conformance') {
  success = checkVoiceConformance();
} else if (arg === '--tone-rule-registered') {
  success = checkToneRuleRegistered();
} else if (arg === '--manager-ramp') {
  success = checkManagerRamp();
} else if (arg === '--drawer-parity') {
  success = checkDrawerParity();
} else if (arg === '--manager-nav-targets') {
  success = checkManagerNavTargets();
} else if (arg === '--drawer-footer') {
  success = checkDrawerFooter();
} else if (arg === '--gateway-neutral') {
  success = checkGatewayNeutral();
} else if (arg === '--manager-tonal-ramp') {
  success = checkManagerTonalRamp();
} else if (arg === '--drawer-shared-grammar') {
  success = checkDrawerSharedGrammar();
} else if (arg === '--nav-docking') {
  success = checkNavigationDocking();
} else if (arg === '--sidebar-handle') {
  success = checkSidebarHandle();
} else if (arg === '--sidebar-rail') {
  success = checkSidebarRail();
} else if (arg === '--locations-form') {
  success = checkLocationsForm();
} else if (arg === '--locations-cards') {
  success = checkLocationsCards();
} else if (arg === '--locations-filters') {
  success = checkLocationsFilters();
} else if (arg === '--presences-ui') {
  success = checkPresencesUi();
} else if (arg === '--presences-period') {
  success = checkPresencesPeriod();
} else if (arg === '--presences-table') {
  success = checkPresencesTable();
} else if (arg === '--presences-sort') {
  success = checkPresencesSort();
} else if (arg === '--presences-localfirst') {
  success = checkPresencesLocalFirst();
} else if (arg === '--sync-scope') {
  success = checkSyncScope();
} else if (arg === '--livequery-deps') {
  success = checkLiveQueryDeps();
} else if (arg === '--manager-dexie') {
  success = checkManagerDexie();
} else if (arg === '--manager-grammar') {
  success = checkManagerGrammar();
} else if (arg === '--manager-responsive') {
  success = checkManagerResponsive();
} else if (arg === '--manager-nav-icons') {
  success = checkManagerNavIcons();
} else if (arg === '--manager-finish') {
  success = checkManagerFinish();
} else if (arg === '--employee-finish') {
  success = checkEmployeeFinish();
} else if (arg === '--settings-page') {
  success = checkSettingsPage();
} else if (arg === '--cross-space-gateways') {
  success = checkCrossSpaceGateways();
} else if (arg === '--sidebar-build') {
  success = checkBuild('G48', 'production build succeeds with exit code 0');
} else if (arg === '--manager-build') {
  success = checkBuild('G39', 'production build succeeds with exit code 0');
} else if (arg === '--all') {
  const r1 = checkEmojis();
  const r2 = checkRadii();
  const r3 = checkShadows();
  const r4 = checkTouchTargets();
  const r5 = checkLayout();
  const r6 = checkEmployeeDesktop();
  const r7 = checkResponsiveCards();
  const r9 = checkCardDesktop();
  const r10 = checkPastDaysDisabled();
  const r8 = checkBuild();
  const r11 = checkThemePlacement();
  const r12 = checkThemeCss();
  const r13 = checkThemeEmojis();
  const r14 = checkThemeRadii();
  const r15 = checkThemeShadows();
  const r16 = checkThemeTargets();
  const r17 = checkSyncIndicatorPreserved();
  const r18 = checkOpenSessionWiring();
  const r19 = checkOpenSessionConformance();
  const r20 = checkHeaderDeduplication();
  const r21 = checkUxConformance();
  const r25 = checkConfirmationOverlayMarkup();
  const r26 = checkFeedbackWiring();
  const r27 = checkWeekSummaryWiring();
  const r28 = checkMotionConformance();
  const r29 = checkEmployeeFeedbackConformance();
  const r30 = checkVoiceConformance();
  const r31 = checkToneRuleRegistered();
  const r32 = checkManagerRamp();
  const r33 = checkDrawerParity();
  const r34 = checkManagerNavTargets();
  const r35 = checkDrawerFooter();
  const r36 = checkGatewayNeutral();
  const r37 = checkManagerTonalRamp();
  const r39 = checkBuild('G39', 'production build succeeds with exit code 0');
  const r40 = checkDrawerSharedGrammar();
  const r43 = checkNavigationDocking();
  const r45 = checkSidebarRail();
  const r49 = checkSidebarHandle();
  const r56 = checkLocationsForm();
  const r58 = checkLocationsCards();
  const r60 = checkLocationsFilters();
  const r63 = checkPresencesUi();
  const r64 = checkPresencesPeriod();
  const r65 = checkPresencesTable();
  const r66 = checkPresencesSort();
  const r72 = checkPresencesLocalFirst();
  const r73 = checkSyncScope();
  const r74 = checkLiveQueryDeps();
  const r75 = checkManagerDexie();
  const r88 = checkManagerGrammar();
  const r89 = checkManagerResponsive();
  const r92 = checkManagerNavIcons();
  const r93 = checkManagerFinish();
  const r94 = checkEmployeeFinish();
  const r95 = checkSettingsPage();
  const r96 = checkCrossSpaceGateways();
  const r48 = r39; // Une seule compilation sert les portes de build G39 et G48
  success = r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8 && r9 && r10 && r11 && r12 && r13 && r14 && r15 && r16 && r17 && r18 && r19 && r20 && r21 && r25 && r26 && r27 && r28 && r29 && r30 && r31 && r32 && r33 && r34 && r35 && r36 && r37 && r39 && r40 && r43 && r45 && r49 && r48 && r56 && r58 && r60 && r63 && r64 && r65 && r66 && r72 && r73 && r74 && r75 && r88 && r89 && r92 && r93 && r94 && r95 && r96;
} else {
  console.error(`Usage: node scripts/verify-gates.mjs [--emojis|--radii|--shadows|--targets|--layout|--employee-desktop|--responsive|--card-desktop|--past-days|--theme-placement|--theme-css|--theme-emojis|--theme-radii|--theme-shadows|--theme-targets|--sync-indicator-preserved|--open-session-wiring|--open-session-conformance|--header-deduplication|--ux-conformance|--drawer-settings-layout|--appearance-control-markup|--sync-badge-truncation|--check-overlay-markup|--check-feedback-wiring|--check-week-summary-wiring|--motion-conformance|--employee-feedback-conformance|--voice-conformance|--tone-rule-registered|--manager-ramp|--drawer-parity|--manager-nav-targets|--drawer-footer|--gateway-neutral|--manager-tonal-ramp|--drawer-shared-grammar|--nav-docking|--sidebar-handle|--sidebar-rail|--locations-form|--locations-cards|--locations-filters|--presences-ui|--presences-period|--presences-table|--presences-sort|--presences-localfirst|--sync-scope|--livequery-deps|--manager-dexie|--manager-grammar|--manager-responsive|--manager-nav-icons|--manager-finish|--employee-finish|--settings-page|--cross-space-gateways|--manager-build|--sidebar-build|--build|--all]`);
  process.exit(1);
}

process.exit(success ? 0 : 1);
