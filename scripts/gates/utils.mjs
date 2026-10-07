import fs from 'node:fs';
import path from 'node:path';

export const SRC_DIR = path.resolve('src');

/** Fichiers écrits par le lot « commutateur de thème ». */
export const THEME_SCOPE_FILES = [
  'src/components/shared/ThemeToggle.vue',
  'src/layouts/ManagerLayout.vue',
  'src/layouts/EmployeeLayout.vue',
  'src/composables/useTheme.js',
];

export function getAllSourceFiles(dir, extensions = ['.vue', '.js', '.html']) {
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

export function getThemeScopeFiles(extensions) {
  return THEME_SCOPE_FILES
    .map(file => path.resolve(file))
    .filter(file => fs.existsSync(file) && extensions.some(ext => file.endsWith(ext)));
}

export function extractTemplate(content) {
  const match = content.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
  return match ? match[1] : '';
}

export function extractClassTokens(text) {
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

export function findEmojis(files) {
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

export function findNonM3Radii(vueFiles) {
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

export function findProhibitedShadows(vueFiles) {
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

export function findProhibitedTargets(vueFiles) {
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

export function reportIssues(issues, label, heading, formatter) {
  console.error(`FAILURE ${label}: ${heading} (${issues.length}):`);
  issues.forEach(issue => console.error(`  ${formatter(issue)}`));
}


export const countOccurrences = (text, needle) => text.split(needle).length - 1;

export const readScopeFile = (file) => {
  let resolved = path.resolve(file);
  if (!fs.existsSync(resolved)) {
    if (file.startsWith('src/composables/')) {
      const base = path.basename(file);
      for (const sub of ['auth', 'domain', 'infra', 'ui']) {
        const candidate = path.resolve('src/composables', sub, base);
        if (fs.existsSync(candidate)) {
          resolved = candidate;
          break;
        }
      }
    }
  }
  if (!fs.existsSync(resolved)) return null;
  const content = fs.readFileSync(resolved, 'utf8');
  const reexportMatch = content.match(/export\s+\*\s+from\s+['"]\.\/([^'"]+)['"]/);
  if (reexportMatch) {
    const target = path.resolve(path.dirname(resolved), reexportMatch[1]);
    if (fs.existsSync(target)) {
      return fs.readFileSync(target, 'utf8');
    }
  }
  return content;
};
