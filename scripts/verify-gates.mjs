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
 * Révision de référence, antérieure au lot « commutateur de thème ». La comparaison ne peut pas viser
 * HEAD : une fois le lot commité, l'oracle comparerait l'arbre à lui-même et ne prouverait plus rien.
 * À déplacer volontairement si l'indicateur de synchronisation doit légitimement évoluer.
 * Surchargeable par SYNC_INDICATOR_BASELINE, notamment pour éprouver que l'oracle sait échouer.
 */
const SYNC_INDICATOR_BASELINE = process.env.SYNC_INDICATOR_BASELINE || 'f46026c';

/**
 * Non-régression ciblée : l'indicateur de synchronisation des deux mises en page garde exactement
 * les mêmes lignes que la révision de référence, et reste présent dans chaque tiroir.
 */
export function checkSyncIndicatorPreserved() {
  const layoutFiles = ['src/layouts/ManagerLayout.vue', 'src/layouts/EmployeeLayout.vue'];
  let ok = true;

  for (const relativePath of layoutFiles) {
    const baseline = spawnSync('git', ['show', `${SYNC_INDICATOR_BASELINE}:${relativePath}`], { encoding: 'utf8' });
    if (baseline.status !== 0) {
      console.error(`FAILURE G17: git show ${SYNC_INDICATOR_BASELINE}:${relativePath} indisponible`);
      ok = false;
      continue;
    }

    // Mesure circonscrite au tiroir : l'instance d'en-tête a été retirée volontairement lors du
    // dédoublonnage, elle ne relève donc plus de cette non-régression
    const drawerSyncLines = (text) => {
      const asideMatch = text.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i);
      const aside = asideMatch ? asideMatch[1] : '';
      return aside
        .split('\n')
        .filter(line => line.includes('<SyncIndicator'))
        .map(line => line.trim());
    };

    const current = fs.readFileSync(relativePath, 'utf8');
    const baselineLines = drawerSyncLines(baseline.stdout);
    const currentLines = drawerSyncLines(current);

    if (baselineLines.length === 0) {
      console.error(`FAILURE G17: aucune occurrence de SyncIndicator dans la révision ${SYNC_INDICATOR_BASELINE} de ${relativePath}`);
      ok = false;
      continue;
    }

    // Comparaison symétrique : une ligne retirée comme une ligne ajoutée doivent faire échouer l'oracle
    const missing = baselineLines.filter(line => !currentLines.includes(line));
    const added = currentLines.filter(line => !baselineLines.includes(line));
    if (missing.length > 0 || added.length > 0 || baselineLines.length !== currentLines.length) {
      console.error(
        `FAILURE G17: ${relativePath} a modifié ses lignes SyncIndicator depuis ${SYNC_INDICATOR_BASELINE}` +
          ` (retirées: ${missing.join(' | ') || 'aucune'} ; ajoutées: ${added.join(' | ') || 'aucune'})`
      );
      ok = false;
    }

    const asideMatch = current.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i);
    const asideContent = asideMatch ? asideMatch[1] : '';
    if (!/<SyncIndicator\b/i.test(asideContent)) {
      console.error(`FAILURE G17: ${relativePath} n'a plus d'indicateur de synchronisation dans son tiroir`);
      ok = false;
    }
  }

  if (!ok) return false;
  console.log('G17 passed: drawer SyncIndicator unchanged since the baseline revision');
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

export function checkBuild() {
  const result = spawnSync('npm', ['run', 'build'], { encoding: 'utf8', stdio: 'pipe' });
  if (result.status === 0) {
    console.log('G6 passed: build succeeded with exit code 0');
    return true;
  }
  console.error('FAILURE G6: npm run build failed with exit code', result.status);
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
 * Le contrôle d'apparence est un bouton unique, contourné et pleine largeur, qui nomme son action.
 * La variante icône, devenue morte, est retirée.
 */
export function checkAppearanceControlMarkup() {
  const file = path.join(SRC_DIR, 'components', 'shared', 'ThemeToggle.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G23: ThemeToggle.vue introuvable');
    return false;
  }

  const content = fs.readFileSync(file, 'utf8');
  const buttons = content.match(/<button\b/g) || [];
  let ok = true;

  if (buttons.length !== 1) {
    console.error(`FAILURE G23: un seul bouton attendu, ${buttons.length} trouvés`);
    ok = false;
  }
  if (/defineProps/.test(content)) {
    console.error('FAILURE G23: la variante à propriété subsiste alors que plus rien ne l\'utilise');
    ok = false;
  }

  const buttonTag = content.match(/<button[^>]*>/s);
  const buttonMarkup = buttonTag ? buttonTag[0] : '';
  for (const token of ['btn-outline', 'w-full', 'min-h-11']) {
    if (!buttonMarkup.includes(token)) {
      console.error(`FAILURE G23: la classe ${token} manque au bouton d'apparence`);
      ok = false;
    }
  }

  if (!/Thème : \$\{|Thème : /.test(content)) {
    console.error("FAILURE G23: le libellé visible n'annonce pas « Thème : <mode> »");
    ok = false;
  }
  if (!/:aria-label="hint"/.test(buttonMarkup)) {
    console.error("FAILURE G23: le bouton n'expose pas son nom accessible via hint");
    ok = false;
  }

  if (!ok) return false;
  console.log('G23 passed: appearance control is a single full-width outlined button');
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
  success = r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8 && r9 && r10 && r11 && r12 && r13 && r14 && r15 && r16 && r17 && r18 && r19 && r20 && r21;
} else {
  console.error(`Usage: node scripts/verify-gates.mjs [--emojis|--radii|--shadows|--targets|--layout|--employee-desktop|--responsive|--card-desktop|--past-days|--theme-placement|--theme-css|--theme-emojis|--theme-radii|--theme-shadows|--theme-targets|--sync-indicator-preserved|--open-session-wiring|--open-session-conformance|--header-deduplication|--ux-conformance|--drawer-settings-layout|--appearance-control-markup|--sync-badge-truncation|--build|--all]`);
  process.exit(1);
}

process.exit(success ? 0 : 1);
