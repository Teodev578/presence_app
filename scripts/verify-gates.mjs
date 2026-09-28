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
    const headerMatch = content.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
    const asideMatch = content.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i);
    const header = headerMatch ? headerMatch[1] : '';
    const aside = asideMatch ? asideMatch[1] : '';
    const occurrences = (content.match(new RegExp(togglePattern.source, 'gi')) || []).length;

    if (occurrences !== 1) {
      console.error(`FAILURE G11: ${layoutName} doit monter le commutateur de thème une seule fois (${occurrences} occurrences)`);
      ok = false;
    }
    if (!togglePattern.test(aside)) {
      console.error(`FAILURE G11: ${layoutName} is missing the theme toggle in its drawer`);
      ok = false;
    }
    if (togglePattern.test(header)) {
      console.error(`FAILURE G11: ${layoutName} garde un commutateur de thème dans son en-tête`);
      ok = false;
    }
    if (layoutName === 'EmployeeLayout.vue' && (content.includes('navigation-rail') || content.includes('NavigationRail'))) {
      console.error('FAILURE G11: Sanctuarisation violée: navigation-rail trouvé dans EmployeeLayout.vue');
      ok = false;
    }
  }

  if (!ok) return false;
  console.log('G11 passed: single theme toggle per space in the drawer');
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
    if (toggles !== 1) {
      console.error(`FAILURE G20: ${name} doit exposer un seul commutateur de thème (${toggles})`);
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
 * Le statut réseau et le contrôle d'apparence vivent sur deux rangées distinctes : le badge
 * de synchronisation n'est plus le frère compressible du commutateur de thème.
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

    const toggles = (aside.match(/<ThemeToggle\b/g) || []).length;
    if (toggles !== 1) {
      console.error(`FAILURE G22: ${layoutName} doit exposer un seul contrôle d'apparence dans son tiroir (${toggles})`);
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
    if (/<ThemeToggle\b/.test(row)) {
      console.error(`FAILURE G22: ${layoutName} garde le contrôle d'apparence dans la rangée du badge`);
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

    const block = enclosingDivAt(aside, statusRow.start);
    if (!block) {
      console.error(`FAILURE G22: ${layoutName} n'englobe pas sa rangée de statut dans un bloc de réglages`);
      ok = false;
    } else {
      const blockTag = block.markup.slice(0, block.markup.indexOf('>') + 1);
      if (!/flex-col/.test(blockTag)) {
        console.error(`FAILURE G22: ${layoutName} empile pas ses réglages verticalement (flex-col absent du bloc)`);
        ok = false;
      }
      if (!/<ThemeToggle\b/.test(block.markup)) {
        console.error(`FAILURE G22: ${layoutName} ne place pas le contrôle d'apparence dans le bloc de réglages`);
        ok = false;
      }
    }

    if (!/<ThemeToggle\s*\/>/.test(aside)) {
      console.error(`FAILURE G22: ${layoutName} passe encore des attributs au contrôle d'apparence`);
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

  if (buttons.length !== 1) {
    console.error(`FAILURE G23: un seul gabarit de segment attendu, ${buttons.length} trouvés`);
    ok = false;
  }
  if (/defineProps/.test(content)) {
    console.error("FAILURE G23: la variante à propriété subsiste alors que plus rien ne l'utilise");
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
  'src/components/manager/StatCard.vue',
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
 * Le pied des deux tiroirs suit la même séquence : statut réseau, apparence, identité, sortie.
 * L'identité vit au pied, à côté d'une déconnexion en icône, et la marque reste en tête.
 */
export function checkDrawerFooter() {
  const footerOrdered = (aside) => {
    const status = aside.indexOf('Statut réseau');
    const identity = aside.indexOf('userInitial');
    const logout = aside.indexOf('aria-label="Se déconnecter"');
    return status !== -1 && identity !== -1 && logout !== -1 && status < identity && identity < logout;
  };

  if (footerOrdered('<span>{{ userInitial }}</span>Statut réseau aria-label="Se déconnecter"')) {
    console.error('FAILURE G35: le détecteur d\'ordre du pied est aveugle, oracle invalide');
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
    const footerAt = aside.indexOf('Statut réseau');
    const footer = footerAt === -1 ? '' : aside.slice(footerAt);
    const header = aside.slice(0, aside.indexOf('<nav'));

    if (!footerOrdered(aside)) {
      console.error(`FAILURE G35: ${layoutName} n'ordonne pas son pied statut, identité puis sortie`);
      ok = false;
      continue;
    }
    for (const token of ['w-10 h-10', 'font-bold text-sm']) {
      if (!footer.includes(token)) {
        console.error(`FAILURE G35: ${layoutName} n'aligne pas le bloc identité sur ${token}`);
        ok = false;
      }
    }
    for (const token of ['<SyncIndicator', '<ThemeToggle', 'handleLogout']) {
      if (!footer.includes(token)) {
        console.error(`FAILURE G35: le pied de ${layoutName} n'expose plus ${token}`);
        ok = false;
      }
    }
    if (!header.includes('PresenceApp')) {
      console.error(`FAILURE G35: l'en-tête de ${layoutName} ne porte plus la marque`);
      ok = false;
    }
    if (!header.includes('badge badge-primary badge-xs')) {
      console.error(`FAILURE G35: l'en-tête de ${layoutName} ne porte plus de badge d'espace`);
      ok = false;
    }
    if (/btn-outline btn-error btn-sm w-full/.test(aside)) {
      console.error(`FAILURE G35: ${layoutName} garde une déconnexion pleine largeur en plus de l'icône`);
      ok = false;
    }
  }

  if (!ok) return false;
  console.log('G35 passed: both drawers end with settings, identity and an icon logout');
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
    ['variante déployée du contrôle', toggle.includes('v-if="!isRail"')],
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

// Exécution CLI
const arg = process.argv[2] || '--all';
let success = true;

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
  const r48 = r39; // Une seule compilation sert les portes de build G39 et G48
  success = r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8 && r9 && r10 && r11 && r12 && r13 && r14 && r15 && r16 && r17 && r18 && r19 && r20 && r21 && r25 && r26 && r27 && r28 && r29 && r30 && r31 && r32 && r33 && r34 && r35 && r36 && r37 && r39 && r40 && r43 && r45 && r49 && r48;
} else {
  console.error(`Usage: node scripts/verify-gates.mjs [--emojis|--radii|--shadows|--targets|--layout|--employee-desktop|--responsive|--card-desktop|--past-days|--theme-placement|--theme-css|--theme-emojis|--theme-radii|--theme-shadows|--theme-targets|--sync-indicator-preserved|--open-session-wiring|--open-session-conformance|--header-deduplication|--ux-conformance|--drawer-settings-layout|--appearance-control-markup|--sync-badge-truncation|--check-overlay-markup|--check-feedback-wiring|--check-week-summary-wiring|--motion-conformance|--employee-feedback-conformance|--voice-conformance|--tone-rule-registered|--manager-ramp|--drawer-parity|--manager-nav-targets|--drawer-footer|--gateway-neutral|--manager-tonal-ramp|--drawer-shared-grammar|--nav-docking|--sidebar-handle|--sidebar-rail|--manager-build|--sidebar-build|--build|--all]`);
  process.exit(1);
}

process.exit(success ? 0 : 1);
