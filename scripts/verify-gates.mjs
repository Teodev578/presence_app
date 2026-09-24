#!/usr/bin/env node

/**
 * Script de vérification déterministe des portes d'acceptation (GATES.md)
 * Analyse statique de code pour PresenceApp : conformité M3, absence d'emojis bruts, ombres, cibles tactiles et agencement.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SRC_DIR = path.resolve('src');

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

export function checkEmojis() {
  const files = getAllSourceFiles(SRC_DIR);
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

  if (issues.length === 0) {
    console.log('G1 passed: 0 raw emojis across all src files');
    return true;
  }
  console.error(`FAILURE G1: Found ${issues.length} raw emojis across src files:`);
  issues.forEach(i => console.error(`  ${i.file}:${i.line} -> ${i.content}`));
  return false;
}

export function checkRadii() {
  const vueFiles = getAllSourceFiles(SRC_DIR, ['.vue']);
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

  if (issues.length === 0) {
    console.log('G2 passed: all non-M3 radii converted to tokens');
    return true;
  }
  console.error(`FAILURE G2: Non-M3 rounded classes found (${issues.length}):`);
  issues.forEach(i => console.error(`  ${i.file} -> ${i.token}`));
  return false;
}

export function checkShadows() {
  const vueFiles = getAllSourceFiles(SRC_DIR, ['.vue']);
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

  if (issues.length === 0) {
    console.log('G3 passed: no aggressive shadows across all Vue files');
    return true;
  }
  console.error(`FAILURE G3: Prohibited shadows found (${issues.length}):`);
  issues.forEach(i => console.error(`  ${i.file} -> ${i.token}`));
  return false;
}

export function checkTouchTargets() {
  const vueFiles = getAllSourceFiles(SRC_DIR, ['.vue']);
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

  if (issues.length === 0) {
    console.log('G4 passed: all interactive buttons meet 44px touch targets');
    return true;
  }
  console.error(`FAILURE G4: Prohibited sub-44px touch targets found (${issues.length}):`);
  issues.forEach(i => console.error(`  ${i.file}:${i.line} -> ${i.content}`));
  return false;
}

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
} else if (arg === '--build') {
  success = checkBuild();
} else if (arg === '--all') {
  const r1 = checkEmojis();
  const r2 = checkRadii();
  const r3 = checkShadows();
  const r4 = checkTouchTargets();
  const r5 = checkLayout();
  const r6 = checkEmployeeDesktop();
  const r7 = checkResponsiveCards();
  const r9 = checkCardDesktop();
  const r8 = checkBuild();
  success = r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8 && r9;
} else {
  console.error(`Usage: node scripts/verify-gates.mjs [--emojis|--radii|--shadows|--targets|--layout|--employee-desktop|--responsive|--card-desktop|--build|--all]`);
  process.exit(1);
}

process.exit(success ? 0 : 1);


