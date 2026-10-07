#!/usr/bin/env node

/**
 * Runner unifié pour la suite de tests unitaires et comportementaux.
 *
 * Usage :
 *   node scripts/tests/runner.mjs
 *   node scripts/tests/runner.mjs <nom_test>
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allTestFiles = fs.readdirSync(__dirname)
  .filter((f) => f.endsWith('.mjs') && f !== 'runner.mjs')
  .sort();

const filterArg = process.argv[2];
const filesToRun = filterArg
  ? allTestFiles.filter((f) => f.includes(filterArg))
  : allTestFiles;

if (filesToRun.length === 0) {
  console.error(`Aucun test trouvé correspondant au filtre : "${filterArg}"`);
  console.error(`Tests disponibles :\n  - ${allTestFiles.join('\n  - ')}`);
  process.exit(1);
}

console.log(`\n🚀 Exécution de ${filesToRun.length} suite(s) de tests unitaires...\n`);

let passedCount = 0;
let failedCount = 0;
const failures = [];

for (const file of filesToRun) {
  const filePath = path.join(__dirname, file);
  process.stdout.write(`• ${file} ... `);

  const start = Date.now();
  const proc = spawnSync('node', [filePath], {
    encoding: 'utf8',
    stdio: 'pipe',
    env: process.env,
  });
  const duration = Date.now() - start;

  if (proc.status === 0) {
    passedCount += 1;
    console.log(`✓ (${duration}ms)`);
  } else {
    failedCount += 1;
    console.log(`✗ ÉCHEC (${duration}ms)`);
    failures.push({
      file,
      stdout: proc.stdout,
      stderr: proc.stderr,
      status: proc.status,
    });
  }
}

console.log('\n--- Bilan des tests unitaires ---');
console.log(`Suites exécutées : ${filesToRun.length}`);
console.log(`Succès           : ${passedCount}`);
console.log(`Échecs           : ${failedCount}`);

if (failures.length > 0) {
  console.error('\n❌ Détail des échecs :');
  for (const fail of failures) {
    console.error(`\n[${fail.file}] Code de sortie : ${fail.status}`);
    if (fail.stdout) console.error(fail.stdout);
    if (fail.stderr) console.error(fail.stderr);
  }
  process.exit(1);
} else {
  console.log('\n✅ Toutes les suites de tests unitaires sont au vert.\n');
  process.exit(0);
}
