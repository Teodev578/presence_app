import fs from 'node:fs';
import path from 'node:path';
import {
  SRC_DIR,
  getAllSourceFiles,
  extractTemplate,
  extractClassTokens,
  findEmojis,
  findNonM3Radii,
  findProhibitedShadows,
  findProhibitedTargets,
  reportIssues,
  readScopeFile,
  countOccurrences
} from '../utils.mjs';

export function checkSyncIndicatorPreserved() {
  const layoutFiles = ['src/layouts/ManagerLayout.vue', 'src/layouts/EmployeeLayout.vue'];
  let ok = true;

  for (const relativePath of layoutFiles) {
    const current = fs.readFileSync(relativePath, 'utf8');
    const headerMatch = current.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
    const headerContent = headerMatch ? headerMatch[1] : '';
    if (!/<SyncAlert\b/i.test(headerContent)) {
      console.error(`FAILURE G17: ${relativePath} n'expose pas le statut réseau unifié dans son en-tête`);
      ok = false;
    }
    const asideMatch = current.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i);
    const asideContent = asideMatch ? asideMatch[1] : '';
    if (/<SyncIndicator\b/i.test(asideContent)) {
      console.error(`FAILURE G17: ${relativePath} conserve l'ancien indicateur dans son tiroir`);
      ok = false;
    }
  }

  if (!ok) return false;
  console.log('G17 passed: each space unifies network status in header via SyncAlert and cleans drawer');
  return true;
}


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
    const content = readScopeFile(file);
    if (!content) {
      console.error(`FAILURE G18: ${file} introuvable`);
      ok = false;
      continue;
    }
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

    const syncAlerts = countOccurrences(content, '<SyncAlert');
    if (syncAlerts !== 1) {
      console.error(`FAILURE G20: ${name} doit exposer un seul statut réseau unifié (${syncAlerts})`);
      ok = false;
    }
    if (!header.includes('<SyncAlert')) {
      console.error(`FAILURE G20: ${name} n'expose pas le statut réseau unifié dans son en-tête`);
      ok = false;
    }
    if (aside.includes('<SyncIndicator') || aside.includes('<SyncAlert')) {
      console.error(`FAILURE G20: ${name} conserve un indicateur réseau dans son tiroir`);
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

    if (/<SyncIndicator\b/.test(aside)) {
      console.error(`FAILURE G22: ${layoutName} conserve le badge réseau dans son tiroir`);
      ok = false;
    }
  }

  if (!ok) return false;
  console.log('G22 passed: drawer is dedicated to navigation with appearance and network offloaded');
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
 * Le tiroir est dédié à la navigation pure. L'apparence, l'identité et la déconnexion
 * vivent sur la page Paramètres, et le statut réseau vit dans le bandeau supérieur.
 */
export function checkDrawerFooter() {
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

    for (const prohibited of ['userInitial', 'aria-label="Se déconnecter"', 'handleLogout', '<ThemeToggle', '<SyncIndicator']) {
      if (aside.includes(prohibited)) {
        console.error(`FAILURE G35: ${layoutName} conserve « ${prohibited} » dans son tiroir`);
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
  console.log('G35 passed: the drawer is dedicated to navigation, network status unified in app bar, settings live on the page');
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
    const beforeSpace = nav.slice(0, nav.indexOf('Mon espace'));
    if (!/<div class="mt-5 border-t border-base-content\/20"/.test(beforeSpace)) {
      console.error(`FAILURE G40: ${layout} ne sépare pas la section Mon espace d'un filet visible en rail`);
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

  const RAIL_HIDE_MIN = 5;
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
    if (!content.includes('useSidebarNav') || !/const\s*\{\s*isRail,[^}]*toggleRail\s*\}\s*=\s*useSidebarNav\(\)/.test(content)) {
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
  pageGaps.push(
    ...[
      'text-base font-semibold',
      'md:grid-cols-2',
      'max-w-md',
      'En ligne',
      'aria-hidden="true"',
      'focus-visible:outline-2 focus-visible:outline-primary',
    ].filter((token) => !settings.includes(token))
  );
  if (settings.includes('Connecté')) pageGaps.push('état réseau ambigu « Connecté »');
  if (settings.includes('>Déconnexion</h2>')) pageGaps.push('titre de section Déconnexion conservé');
  if (settings.includes('items-start')) pageGaps.push('tuiles de la grille non égalisées (items-start conservé)');

  const sectionOrder = ['>Compte<', '>Synchronisation<', '>Apparence<'].map((token) => settings.indexOf(token));
  if (sectionOrder.some((index) => index === -1) || !(sectionOrder[0] < sectionOrder[1] && sectionOrder[1] < sectionOrder[2])) {
    pageGaps.push('ordre des sections non conforme (Compte, Synchronisation, Apparence attendu)');
  } else if (settings.indexOf('Se déconnecter') < sectionOrder[2]) {
    pageGaps.push('déconnexion non placée après l\u2019apparence');
  }
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

  const gear = (text) =>
    text.includes('Ouvrir les paramètres') &&
    /navigate\('\/\w+\/settings'\)/.test(text) &&
    text.includes("v-if=\"!onSettings\"") &&
    text.includes('onSettings = computed');
  for (const layout of ['layouts/ManagerLayout.vue', 'layouts/EmployeeLayout.vue']) {
    const text = read(layout);
    if (text === null) {
      console.error(`FAILURE G95: ${layout} introuvable`);
      return false;
    }
    if (!gear(text)) {
      console.error(`FAILURE G95: ${layout} sans icône d\u2019engrenage vers les paramètres, ou engrenage non masqué sur l\u2019écran Paramètres`);
      return false;
    }
    if (!text.includes('<SyncAlert v-if="!onSettings"')) {
      console.error(`FAILURE G95: ${layout} n'applique pas le masquage de SyncAlert sur la page Paramètres (v-if="!onSettings")`);
      return false;
    }
    if (!text.includes('<NotificationBell v-if="!onSettings"')) {
      console.error(`FAILURE G95: ${layout} n'applique pas le masquage de NotificationBell sur la page Paramètres (v-if="!onSettings")`);
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

/**
 * G97 : Navigation de retour en bandeau. Chaque espace définit une table de routes portant le titre
 * de l'écran et la cible de retour, le bandeau offre un bouton retour nommé et une cible de 44px, le
 * hamburger lui cède la place sur les écrans descendants, et plus aucune vue de contenu ne porte son
 * propre bouton Retour.
 */

export function checkBackNavigation() {
  const read = (relative) => {
    const file = path.join(SRC_DIR, relative);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };

  const layoutGaps = (name, text) => {
    const gaps = [];
    if (!/ROUTES\s*=\s*\{/.test(text)) gaps.push(`${name} : table de routes absente`);
    if (!text.includes("title: 'Paramètres'")) gaps.push(`${name} : écran Paramètres absent de la table`);
    if (!/class="[^"]*min-w-11 min-h-11[^"]*"\s+aria-label="Retour"/.test(text)) {
      gaps.push(`${name} : bouton de retour sans cible de 44px ou sans nom accessible`);
    }
    if (!/v-if="!showBack"/.test(text)) gaps.push(`${name} : hamburger non cédé au retour`);
    if (!text.includes('barTitle')) gaps.push(`${name} : titre de bandeau absent`);
    return gaps;
  };

  // Contrôle négatif : un bouton de contenu libellé Retour doit être refusé.
  const contentRetour = (text) => />\s*Retour\s*</.test(text);
  if (!contentRetour('<button>Retour</button>')) {
    console.error('FAILURE G97: le détecteur de retour de contenu est aveugle, oracle invalide');
    return false;
  }

  const manager = read('layouts/ManagerLayout.vue');
  const employee = read('layouts/EmployeeLayout.vue');
  if (manager === null || employee === null) {
    console.error('FAILURE G97: une des mises en page est introuvable');
    return false;
  }

  const gaps = [...layoutGaps('ManagerLayout.vue', manager), ...layoutGaps('EmployeeLayout.vue', employee)];

  for (const relative of [
    'views/employee/CheckInView.vue',
    'views/employee/CheckOutView.vue',
    'views/employee/AvailabilitiesView.vue',
    'views/SettingsView.vue',
  ]) {
    const text = read(relative);
    if (text === null) {
      console.error(`FAILURE G97: ${relative} introuvable`);
      return false;
    }
    if (contentRetour(text)) gaps.push(`${relative} : bouton Retour de contenu conservé`);
  }

  const settings = read('views/SettingsView.vue') || '';
  if (settings.includes('>Paramètres</h1>')) gaps.push('views/SettingsView.vue : en-tête de page conservé');

  if (gaps.length > 0) {
    console.error(`FAILURE G97: navigation de retour incomplète -> ${gaps.join(', ')}`);
    return false;
  }
  console.log('G97 passed: the back command lives in the app bar and no content duplicates it');
  return true;
}

