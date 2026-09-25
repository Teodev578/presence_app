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

export function checkThemePlacement() {
  const layoutFiles = ['ManagerLayout.vue', 'EmployeeLayout.vue'];
  const togglePattern = /<ThemeToggle\b|<theme-toggle\b/i;
  const sections = {};

  for (const layoutName of layoutFiles) {
    const layoutPath = path.join(SRC_DIR, 'layouts', layoutName);
    if (!fs.existsSync(layoutPath)) {
      console.error(`FAILURE G11: Layout file ${layoutName} does not exist`);
      return false;
    }
    const content = fs.readFileSync(layoutPath, 'utf8');
    const headerMatch = content.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
    const asideMatch = content.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i);

    sections[layoutName] = {
      header: headerMatch ? headerMatch[1] : '',
      aside: asideMatch ? asideMatch[1] : '',
      content,
    };
  }

  const manager = sections['ManagerLayout.vue'];
  const employee = sections['EmployeeLayout.vue'];
  let ok = true;

  if (!togglePattern.test(manager.header)) {
    console.error('FAILURE G11: ManagerLayout.vue is missing the theme toggle in <header>');
    ok = false;
  }
  for (const layoutName of layoutFiles) {
    if (!togglePattern.test(sections[layoutName].aside)) {
      console.error(`FAILURE G11: ${layoutName} is missing the theme toggle in its drawer footer`);
      ok = false;
    }
  }
  if (togglePattern.test(employee.header)) {
    console.error('FAILURE G11: EmployeeLayout.vue header must stay free of the theme toggle (height constrained at 360px)');
    ok = false;
  }
  if (employee.content.includes('navigation-rail') || employee.content.includes('NavigationRail')) {
    console.error('FAILURE G11: Sanctuarisation violée: navigation-rail trouvé dans EmployeeLayout.vue');
    ok = false;
  }

  if (!ok) return false;
  console.log('G11 passed: theme toggle placed in manager header and both drawers');
  return true;
}

/**
 * Non-régression ciblée : l'indicateur de synchronisation des deux mises en page garde exactement
 * les mêmes lignes que la révision de référence HEAD, et reste présent dans chaque tiroir.
 */
export function checkSyncIndicatorPreserved() {
  const layoutFiles = ['src/layouts/ManagerLayout.vue', 'src/layouts/EmployeeLayout.vue'];
  let ok = true;

  for (const relativePath of layoutFiles) {
    const atHead = spawnSync('git', ['show', `HEAD:${relativePath}`], { encoding: 'utf8' });
    if (atHead.status !== 0) {
      console.error(`FAILURE G17: git show HEAD:${relativePath} indisponible`);
      ok = false;
      continue;
    }

    const current = fs.readFileSync(relativePath, 'utf8');
    const headLines = atHead.stdout
      .split('\n')
      .filter(line => line.includes('<SyncIndicator'))
      .map(line => line.trim());
    const missing = headLines.filter(line => !current.includes(line));

    if (headLines.length === 0) {
      console.error(`FAILURE G17: aucune occurrence de SyncIndicator dans la révision HEAD de ${relativePath}`);
      ok = false;
      continue;
    }
    if (missing.length > 0) {
      console.error(`FAILURE G17: ${relativePath} a perdu ou modifié des lignes SyncIndicator (${missing.join(' | ')})`);
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
  console.log('G17 passed: SyncIndicator placement unchanged from HEAD');
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
  success = r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8 && r9 && r10 && r11 && r12 && r13 && r14 && r15 && r16 && r17;
} else {
  console.error(`Usage: node scripts/verify-gates.mjs [--emojis|--radii|--shadows|--targets|--layout|--employee-desktop|--responsive|--card-desktop|--past-days|--theme-placement|--theme-css|--theme-emojis|--theme-radii|--theme-shadows|--theme-targets|--sync-indicator-preserved|--build|--all]`);
  process.exit(1);
}

process.exit(success ? 0 : 1);
