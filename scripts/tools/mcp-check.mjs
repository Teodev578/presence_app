#!/usr/bin/env node
/**
 * Oracle déterministe de la configuration MCP Supabase.
 *
 * Vérifie que les deux fichiers de configuration (OpenCode et Claude Code) portent
 * le même serveur scopé au projet, que le moindre privilège est respecté par la
 * config (règle 05) et qu'aucun secret ne traîne dans les fichiers versionnés.
 *
 * Usage : node scripts/mcp-check.mjs [--root <dir>] [--config|--scoping|--secrets|--all]
 * `--root` pointe l'oracle sur une fixture pour les contrôles négatifs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, '../..');

const PROJECT_REF = 'pvquzkpfdjrequbwnhur';
const BASE_URL = 'https://mcp.supabase.com/mcp?';
const REQUIRED_SERVERS = ['supabase', 'supabase-readonly'];
const FORBIDDEN_GROUPS = ['branching', 'storage', 'account', 'account-management', 'account_management'];
const SCANNED_FILES = ['opencode.json', '.mcp.json', 'docs/agents/mcp-supabase.md'];
const SECRET_PATTERNS = [
  [/\bBearer\s+[A-Za-z0-9._-]{8,}/, 'Authorization Bearer en clair'],
  [/\bntn_[A-Za-z0-9]{10,}/, 'token Notion'],
  [/\bsbp_[A-Za-z0-9]{10,}/, 'token Supabase'],
  [/\beyJ[A-Za-z0-9_-]{20,}/, 'JWT'],
  [/sb-secret-|sb_publishable_/, 'clé Supabase'],
];

function parseArgs(argv) {
  const args = { root: DEFAULT_ROOT, checks: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--root') {
      args.root = path.resolve(argv[i + 1] ?? '');
      i += 1;
    } else if (a === '--all') {
      args.checks = ['config', 'scoping', 'secrets'];
    } else if (a.startsWith('--')) {
      args.checks.push(a.slice(2));
    }
  }
  if (args.checks.length === 0 || args.checks.includes('all')) {
    args.checks = ['config', 'scoping', 'secrets'];
  }
  return args;
}

function loadConfigs(root) {
  const out = {};
  for (const name of REQUIRED_SERVERS) out[name] = {};
  const files = {
    'opencode.json': (json) => json.mcp ?? {},
    '.mcp.json': (json) => json.mcpServers ?? {},
  };
  for (const [file, extract] of Object.entries(files)) {
    const raw = fs.readFileSync(path.join(root, file), 'utf8');
    out[file] = extract(JSON.parse(raw));
  }
  return out;
}

function serverUrl(block, name) {
  const entry = block[name];
  return entry ? entry.url ?? null : null;
}

const checks = {
  config(root) {
    for (const file of ['opencode.json', '.mcp.json']) {
      if (!fs.existsSync(path.join(root, file))) return `G84 failed: ${file} is missing`;
    }
    let blocks;
    try {
      blocks = loadConfigs(root);
    } catch (err) {
      return `G84 failed: invalid JSON (${err.message})`;
    }
    for (const name of REQUIRED_SERVERS) {
      const urlOpen = serverUrl(blocks['opencode.json'], name);
      const urlClaude = serverUrl(blocks['.mcp.json'], name);
      if (!urlOpen) return `G84 failed: opencode.json misses server "${name}"`;
      if (!urlClaude) return `G84 failed: .mcp.json misses server "${name}"`;
      if (urlOpen !== urlClaude) return `G84 failed: URL drift between opencode.json and .mcp.json for "${name}"`;
    }
    return 'G84 passed: both configs declare the same scoped servers';
  },

  scoping(root) {
    let blocks;
    try {
      blocks = loadConfigs(root);
    } catch (err) {
      return `G85 failed: invalid JSON (${err.message})`;
    }
    for (const file of ['opencode.json', '.mcp.json']) {
      for (const name of REQUIRED_SERVERS) {
        const url = serverUrl(blocks[file], name);
        if (!url) return `G85 failed: ${file} misses server "${name}"`;
        if (!url.startsWith(BASE_URL)) return `G85 failed: ${file} "${name}" is not the hosted Supabase MCP endpoint`;
        const params = new URLSearchParams(url.slice(BASE_URL.length));
        if (params.get('project_ref') !== PROJECT_REF) {
          return `G85 failed: ${file} "${name}" is not scoped to project_ref=${PROJECT_REF}`;
        }
        const groups = (params.get('features') ?? '').split(',').filter(Boolean);
        if (!groups.includes('database')) return `G85 failed: ${file} "${name}" drops the database group`;
        for (const forbidden of FORBIDDEN_GROUPS) {
          if (groups.includes(forbidden)) return `G85 failed: ${file} "${name}" enables forbidden group "${forbidden}"`;
        }
        const readOnly = params.get('read_only') === 'true';
        if (name === 'supabase-readonly' && !readOnly) return `G85 failed: ${file} "${name}" is not read-only`;
        if (name === 'supabase' && readOnly) return `G85 failed: ${file} "${name}" must stay writable`;
      }
    }
    const open = blocks['opencode.json'];
    if (open.supabase?.enabled !== false) return 'G85 failed: opencode.json must disable the writable server by default';
    if (open['supabase-readonly']?.enabled !== true) return 'G85 failed: opencode.json must enable the read-only server';
    return 'G85 passed: least privilege enforced by configuration';
  },

  secrets(root) {
    for (const file of SCANNED_FILES) {
      const full = path.join(root, file);
      if (!fs.existsSync(full)) return `G86 failed: ${file} is missing`;
      const raw = fs.readFileSync(full, 'utf8');
      for (const [pattern, label] of SECRET_PATTERNS) {
        if (pattern.test(raw)) return `G86 failed: ${file} contains a ${label}`;
      }
    }
    return 'G86 passed: no credential in the versioned MCP configuration';
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
