#!/usr/bin/env node

/**
 * Script de vérification déterministe des portes d'acceptation (GATES.md)
 * Analyse statique de code pour PresenceApp : conformité M3, absence d'emojis bruts, ombres et agencement.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

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

export function checkEmojis() {
  const files = getAllSourceFiles(SRC_DIR);
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
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
    console.log('CLEAN: 0 raw emojis across all src files');
    return true;
  }
  console.error(`FAILURE: Found ${issues.length} raw emojis across src files:`);
  issues.forEach(i => console.error(`  ${i.file}:${i.line} -> ${i.content}`));
  return false;
}

export function checkRadii() {
  const vueFiles = getAllSourceFiles(SRC_DIR, ['.vue']);
  const badRadiusRegex = /rounded-(xl|2xl|3xl)\b/;
  const issues = [];

  for (const f of vueFiles) {
    const content = fs.readFileSync(f, 'utf8');
    if (badRadiusRegex.test(content)) {
      issues.push(path.relative(process.cwd(), f));
    }
  }

  if (issues.length === 0) {
    console.log('G2 passed: all non-M3 radii converted to tokens');
    return true;
  }
  console.error('FAILURE: Non-M3 rounded classes found in:', issues);
  return false;
}

export function checkShadows() {
  const vueFiles = getAllSourceFiles(SRC_DIR, ['.vue']);
  const badShadowRegex = /shadow-(md|lg|xl|2xl)\b/;
  const issues = [];

  for (const f of vueFiles) {
    const content = fs.readFileSync(f, 'utf8');
    if (badShadowRegex.test(content)) {
      issues.push(path.relative(process.cwd(), f));
    }
  }

  if (issues.length === 0) {
    console.log('G3 passed: no aggressive shadows across all Vue files');
    return true;
  }
  console.error('FAILURE: Prohibited shadows found in:', issues);
  return false;
}

export function checkLayout() {
  const mLayoutPath = path.join(SRC_DIR, 'layouts', 'ManagerLayout.vue');
  if (!fs.existsSync(mLayoutPath)) {
    console.error('FAILURE: ManagerLayout.vue does not exist');
    return false;
  }

  const mLayout = fs.readFileSync(mLayoutPath, 'utf8');
  const mHeaderHasSync = mLayout.includes('<header') && mLayout.split('<header')[1].split('</header>')[0].includes('<SyncIndicator');
  const mDrawerHasSync = mLayout.includes('aside') && mLayout.split('<aside')[1].split('</aside>')[0].includes('<SyncIndicator');

  if (!mHeaderHasSync && mDrawerHasSync) {
    console.log('G4 passed: SyncIndicator properly located in drawer footer and removed from header');
    return true;
  }
  console.error('FAILURE: ManagerLayout SyncIndicator location invalid');
  return false;
}

export function checkBuild() {
  try {
    const stdout = execSync('npm run build', { stdio: 'pipe' }).toString();
    if (stdout.includes('built in')) {
      console.log('G5 passed: build succeeded');
      return true;
    }
    console.error('FAILURE: npm run build completed without expected output');
    return false;
  } catch (err) {
    console.error('FAILURE: npm run build exited with error:', err.message);
    return false;
  }
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
} else if (arg === '--layout') {
  success = checkLayout();
} else if (arg === '--build') {
  success = checkBuild();
} else if (arg === '--all') {
  const r1 = checkEmojis();
  const r2 = checkRadii();
  const r3 = checkShadows();
  const r4 = checkLayout();
  const r5 = checkBuild();
  success = r1 && r2 && r3 && r4 && r5;
} else {
  console.error(`Usage: node scripts/verify-gates.mjs [--emojis|--radii|--shadows|--layout|--build|--all]`);
  process.exit(1);
}

process.exit(success ? 0 : 1);
