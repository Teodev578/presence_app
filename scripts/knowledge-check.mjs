#!/usr/bin/env node
/**
 * Oracle déterministe de la boucle d'apprentissage KI.
 *
 * Chaque flag valide une couche du protocole décrit dans .agents/knowledge/README.md
 * et imprime une ligne unique "GNN passed: ..." en cas de succès (sortie 0).
 * En cas d'échec : "GNN failed: <raison>" et sortie 1.
 *
 * Usage : node scripts/knowledge-check.mjs [--root <dir>] [--structure|--frontmatter|--index|--staleness|--wiring|--gitignore|--all]
 * `--root` pointe l'oracle sur une fixture pour les contrôles négatifs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, '..');

const STATUTS = new Set(['candidate', 'active', 'a-verifier', 'superseded', 'retired']);
const LIVE_STATUTS = new Set(['candidate', 'active']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const INDEX_BUDGET = 200;

function parseArgs(argv) {
  const args = { root: DEFAULT_ROOT, checks: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--root') {
      args.root = path.resolve(argv[i + 1] ?? '');
      i += 1;
    } else if (a === '--all') {
      args.checks = ['structure', 'frontmatter', 'index', 'staleness', 'wiring', 'gitignore'];
    } else if (a.startsWith('--')) {
      args.checks.push(a.slice(2));
    }
  }
  if (args.checks.length === 0) args.checks = ['all'];
  if (args.checks.includes('all')) {
    args.checks = ['structure', 'frontmatter', 'index', 'staleness', 'wiring', 'gitignore'];
  }
  return args;
}

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      fields[kv[1]] = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    } else {
      fields[kv[1]] = value;
    }
  }
  return fields;
}

function listEntries(root) {
  const dir = path.join(root, '.agents', 'knowledge');
  if (!fs.existsSync(dir)) return { dir, entries: [] };
  const entries = fs.readdirSync(dir)
    .filter((f) => /^KI-\d{4}-.+\.md$/.test(f))
    .sort()
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      return { file, fields: parseFrontmatter(raw) };
    });
  return { dir, entries };
}

const checks = {
  structure(root) {
    const { dir, entries } = listEntries(root);
    const missing = ['README.md', 'TEMPLATE.md', 'INDEX.md']
      .filter((f) => !fs.existsSync(path.join(dir, f)));
    if (!fs.existsSync(dir)) return 'G77 failed: .agents/knowledge/ is missing';
    if (missing.length > 0) return `G77 failed: missing protocol files: ${missing.join(', ')}`;
    if (entries.length === 0) return 'G77 failed: no KI entry found';
    return `G77 passed: knowledge base structure complete (${entries.length} entr${entries.length > 1 ? 'ies' : 'y'})`;
  },

  frontmatter(root) {
    const { entries } = listEntries(root);
    if (entries.length === 0) return 'G78 failed: no KI entry found';
    const today = new Date().toISOString().slice(0, 10);
    for (const { file, fields } of entries) {
      if (!fields) return `G78 failed: ${file} has no frontmatter`;
      for (const key of ['id', 'date', 'auteur', 'statut', 'domaine', 'source', 'revalider-avant']) {
        if (!fields[key]) return `G78 failed: ${file} misses field "${key}"`;
      }
      if (!ISO_DATE.test(fields.date)) return `G78 failed: ${file} date is not ISO (${fields.date})`;
      if (!ISO_DATE.test(fields['revalider-avant'])) return `G78 failed: ${file} revalider-avant is not ISO (${fields['revalider-avant']})`;
      if (fields.date > fields['revalider-avant']) return `G78 failed: ${file} revalider-avant precedes date`;
      if (fields.date > today) return `G78 failed: ${file} is dated in the future`;
      if (!STATUTS.has(fields.statut)) return `G78 failed: ${file} unknown statut "${fields.statut}"`;
      if (!Array.isArray(fields.triggers) || fields.triggers.length === 0) {
        return `G78 failed: ${file} needs a non-empty triggers list`;
      }
    }
    return `G78 passed: all knowledge entries carry valid frontmatter (${entries.length})`;
  },

  index(root) {
    const { entries } = listEntries(root);
    const indexRaw = readIfExists(path.join(root, '.agents', 'knowledge', 'INDEX.md'));
    if (indexRaw === null) return 'G79 failed: INDEX.md is missing';
    const lineCount = indexRaw.split('\n').length;
    if (lineCount > INDEX_BUDGET) return `G79 failed: INDEX.md is ${lineCount} lines, budget is ${INDEX_BUDGET}`;
    const ids = new Set(entries.map((e) => (e.fields?.id ?? e.file.replace(/\.md$/, ''))));
    for (const id of ids) {
      const live = entries.find((e) => e.fields?.id === id);
      if (live && LIVE_STATUTS.has(live.fields.statut) && !indexRaw.includes(id)) {
        return `G79 failed: ${id} (${live.fields.statut}) is not listed in INDEX.md`;
      }
    }
    const referenced = [...indexRaw.matchAll(/KI-\d{4}-[a-z0-9-]+/g)].map((m) => m[0]);
    for (const ref of referenced) {
      if (!ids.has(ref)) return `G79 failed: INDEX.md references unknown entry ${ref}`;
    }
    return `G79 passed: index within budget and listing all live entries (${lineCount} lines)`;
  },

  staleness(root) {
    const { entries } = listEntries(root);
    const today = new Date().toISOString().slice(0, 10);
    for (const { file, fields } of entries) {
      if (!fields || !LIVE_STATUTS.has(fields.statut)) continue;
      if (ISO_DATE.test(fields['revalider-avant']) && fields['revalider-avant'] < today) {
        return `G80 failed: ${file} is past its revalidation date (${fields['revalider-avant']}) but still "${fields.statut}"`;
      }
    }
    return `G80 passed: no live entry is past its revalidation date`;
  },

  wiring(root) {
    const agents = readIfExists(path.join(root, 'AGENTS.md'));
    if (agents === null) return 'G81 failed: AGENTS.md is missing';
    if (agents.includes('appDataDir')) return 'G81 failed: AGENTS.md still points at appDataDir/knowledge';
    if (!agents.includes('.agents/knowledge/')) return 'G81 failed: AGENTS.md does not point at .agents/knowledge/';
    const rulesDir = path.join(root, '.agents', 'rules');
    const rule11 = fs.existsSync(rulesDir)
      ? fs.readdirSync(rulesDir).filter((f) => /^11-.*\.md$/.test(f))
      : [];
    if (rule11.length === 0) return 'G81 failed: rule 11 (learning loop) is missing';
    const rule11Raw = readIfExists(path.join(rulesDir, rule11[0]));
    for (const token of ['knowledge', 'INDEX.md', 'escalade']) {
      if (!rule11Raw.includes(token)) return `G81 failed: ${rule11[0]} does not mention "${token}"`;
    }
    const matrix = readIfExists(path.join(rulesDir, '08-skills-activation.md'));
    if (matrix === null) return 'G81 failed: 08-skills-activation.md is missing';
    if (!matrix.includes('KI')) return 'G81 failed: activation matrix does not route to the KI protocol';
    return 'G81 passed: learning loop wired into AGENTS.md and rules';
  },

  gitignore(root) {
    const raw = readIfExists(path.join(root, '.gitignore'));
    if (raw === null) return 'G82 failed: .gitignore is missing';
    const covered = raw.split('\n').some((line) => {
      const entry = line.trim();
      return entry === '.agents/knowledge.local' || entry === '.agents/knowledge.local/';
    });
    if (!covered) return 'G82 failed: .agents/knowledge.local is not ignored by git';
    return 'G82 passed: local knowledge layer ignored by git';
  },
};

const args = parseArgs(process.argv.slice(2));
const known = new Set(Object.keys(checks));
let failed = 0;
for (const name of args.checks) {
  if (!known.has(name)) {
    console.log(`unknown check: ${name}`);
    failed = 1;
    continue;
  }
  const line = checks[name](args.root);
  console.log(line);
  if (line.includes('failed')) failed = 1;
}
process.exit(failed);
