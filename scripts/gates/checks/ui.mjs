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
  readScopeFile
} from '../utils.mjs';

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

    const syncInHeader = /<SyncAlert\b|<sync-alert\b/i.test(headerContent);
    const syncInAside = /<SyncIndicator\b|<sync-indicator\b/i.test(asideContent);

    if (!syncInHeader) {
      console.error(`FAILURE G5: ${layoutName} is missing SyncAlert in <header>`);
      allPassed = false;
    }

    if (syncInAside) {
      console.error(`FAILURE G5: ${layoutName} still contains SyncIndicator in <aside>`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('G5 passed: Network status unified in header via SyncAlert and removed from sidebar drawers');
    return true;
  }
  return false;
}

const countOccurrences = (text, needle) => text.split(needle).length - 1;

/**
 * Le commutateur de thème est consultatif : une seule occurrence par espace, dans le tiroir.
 */

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
  if (!content.includes(':disabled="d.isPast"') && !content.includes(':disabled="d.isPast || d.isToday"')) {
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


/** Fichiers écrits par le lot « feedback de pointage & résumé de disponibilités ». */
const FEEDBACK_SCOPE_FILES = [
  'src/components/employee/CheckConfirmationOverlay.vue',
  'src/components/employee/AvailabilitySummary.vue',
  'src/lib/availabilitySummary.js',
  'src/views/employee/CheckInView.vue',
  'src/views/employee/CheckOutView.vue',
  'src/components/employee/WeekGrid.vue',
];

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
    { name: 'CheckInView.vue', label: 'Arrivée enregistrée' },
    { name: 'CheckOutView.vue', label: 'Départ enregistré' },
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

  for (const file of ['src/App.vue', 'src/components/employee/CheckConfirmationOverlay.vue', 'src/components/employee/AvailabilitySummary.vue']) {
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
  'valider',
  'validation',
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


export function checkEmployeeFinish() {
  const read = (relative) => {
    const file = path.join(SRC_DIR, relative);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };
  const missing = (text, tokens) => tokens.filter((token) => !text.includes(token));

  if (missing('', ['employee-onepage']).length === 0) {
    console.error('FAILURE G94: le détecteur de finition employé est aveugle, oracle invalide');
    return false;
  }

  const gaps = [];
  const employeeFiles = [
    'components/employee/DayCard.vue',
    'components/employee/WeekSummaryCard.vue',
    'components/employee/WeekGrid.vue',
    'components/employee/GpsRing.vue',
    'components/employee/AvailabilitySummary.vue',
    'components/employee/CheckConfirmationOverlay.vue',
    'views/employee/HomeView.vue',
    'views/employee/CheckInView.vue',
    'views/employee/CheckOutView.vue',
    'views/employee/AvailabilitiesView.vue',
  ];

  for (const relative of employeeFiles) {
    const text = read(relative);
    if (text === null) {
      console.error(`FAILURE G94: ${relative} introuvable`);
      return false;
    }
    if (/text-\[\d+px\]/.test(text)) gaps.push(`${relative} : taille de police arbitraire`);
  }

  for (const relative of ['components/employee/DayCard.vue', 'components/employee/WeekSummaryCard.vue', 'components/employee/WeekGrid.vue']) {
    if ((read(relative) || '').includes('capitalize')) gaps.push(`${relative} : date capitalisée à tort`);
  }

  const layout = read('layouts/EmployeeLayout.vue') || '';
  gaps.push(...missing(layout, ["label: 'Pointage'", "label: 'Ma disponibilité'"]).map((token) => `navigation employé sans ${token}`));
  if (layout.includes('Mes disponibilités')) gaps.push('navigation employé conserve « Mes disponibilités »');
  if (!layout.includes('barTitle')) gaps.push('bandeau employé sans titre');

  const availabilities = read('views/employee/AvailabilitiesView.vue') || '';
  if (!availabilities.includes('>Ma disponibilité<')) gaps.push('page disponibilité mal nommée');

  const checkout = read('views/employee/CheckOutView.vue') || '';
  if (checkout.includes('En cours de service')) gaps.push('« En cours de service » conservé');

  const checkin = read('views/employee/CheckInView.vue') || '';
  if (checkin.includes('select-xs')) gaps.push('sélecteur de lieu sous 44px');

  const css = read('style.css') || '';
  if (!css.includes('.employee-onepage')) gaps.push('marqueur onepage employé absent');
  if (!/max-height:\s*760px/.test(css)) gaps.push('repli onepage sur hauteur courte absent');

  if (gaps.length > 0) {
    console.error(`FAILURE G94: la passe de finition employé est incomplète -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G94 passed: employee finishing pass applied');
  return true;
}

/**
 * G95 : Page Paramètres dédiée. Une seule vue partagée, portant synchronisation, compte et
 * déconnexion, sans contrôle d'apparence (le tiroir le garde). Le bandeau des deux espaces
 * expose une icône d'engrenage vers la page, et App.vue route les deux chemins.
 */

export function checkResponsiveOnepageViews() {
  const views = [
    path.join(SRC_DIR, 'views', 'employee', 'ArchivedAccountView.vue'),
    path.join(SRC_DIR, 'views', 'employee', 'PendingApprovalView.vue'),
  ];

  for (const viewPath of views) {
    if (!fs.existsSync(viewPath)) {
      console.error(`FAILURE G165: Vue introuvable: ${viewPath}`);
      return false;
    }
    const content = fs.readFileSync(viewPath, 'utf8');

    // Vérification du conteneur parent onepage
    if (!content.includes('h-dvh') || !content.includes('overflow-hidden')) {
      console.error(`FAILURE G165: Conteneur onepage manquant dans ${path.basename(viewPath)}`);
      return false;
    }

    // Vérification du défilement sans troncature et paddings fins
    if (!content.includes('overflow-y-auto') || !content.includes('my-auto') || !content.includes('px-2')) {
      console.error(`FAILURE G165: Logique de scroll ou paddings fins non respectés dans ${path.basename(viewPath)}`);
      return false;
    }

    // Vérification de la largeur noble desktop et des cibles tactiles
    if (!content.includes('max-w-xl') && !content.includes('lg:max-w-2xl')) {
      console.error(`FAILURE G165: Largeur maximale desktop non optimisée dans ${path.basename(viewPath)}`);
      return false;
    }

    if (!content.includes('min-h-11')) {
      console.error(`FAILURE G165: Cible tactile 44px (min-h-11) manquante dans ${path.basename(viewPath)}`);
      return false;
    }
  }

  console.log('G165 passed: Responsive onepage-first and lateral padding fully verified');
  return true;
}

/**
 * Vérifie l'interdiction stricte d'archiver un administrateur ou un gestionnaire (G167).
 */
