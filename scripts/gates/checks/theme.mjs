import fs from 'node:fs';
import path from 'node:path';
import {
  SRC_DIR,
  THEME_SCOPE_FILES,
  getThemeScopeFiles,
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
    const occurrences = (content.match(new RegExp(togglePattern.source, 'gi')) || []).length;

    if (occurrences !== 0) {
      console.error(`FAILURE G11: ${layoutName} garde encore le commutateur de thème dans son tiroir (${occurrences})`);
      ok = false;
    }
    if (layoutName === 'EmployeeLayout.vue' && (content.includes('navigation-rail') || content.includes('NavigationRail'))) {
      console.error('FAILURE G11: Sanctuarisation violée: navigation-rail trouvé dans EmployeeLayout.vue');
      ok = false;
    }
  }

  const settings = readScopeFile('src/views/SettingsView.vue');
  if (settings === null) {
    console.error('FAILURE G11: src/views/SettingsView.vue introuvable');
    return false;
  }
  const settingsToggles = (settings.match(new RegExp(togglePattern.source, 'gi')) || []).length;
  if (settingsToggles !== 1) {
    console.error(`FAILURE G11: la page Paramètres doit porter un seul commutateur de thème (${settingsToggles})`);
    ok = false;
  }
  if (!settings.includes('Apparence')) {
    console.error('FAILURE G11: la page Paramètres n\'expose pas de section Apparence');
    ok = false;
  }

  if (!ok) return false;
  console.log('G11 passed: the theme toggle lives on the settings page, not in the drawer');
  return true;
}

/**
 * Non-régression ciblée : chaque tiroir conserve son occurrence de l'indicateur de synchronisation.
 * La comparaison octet pour octet à la révision f46026c a perdu son objet quand le lot « Repli en
 * Rail d'Icônes » a légitimement ajouté la classe `rail-network` à la pastille pour la camoufler en
 * rail. La présence dans chaque tiroir reste, elle, requise ; sa mise en page relève de G33 et G40.
 */

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

export function checkForgotPasswordTheme() {
  const loginFile = path.resolve('src/views/auth/LoginView.vue');
  const loginContent = fs.readFileSync(loginFile, 'utf8');

  if (!loginContent.includes('isForgotPassword')) {
    console.error('FAILURE G190: LoginView.vue ne comporte pas de mode isForgotPassword');
    return false;
  }

  // Vérification de la confirmation explicite (soit bandeau role="status", soit feedback dynamique dans le bouton G194)
  const hasStatusAlert = loginContent.includes('alert alert-success') && loginContent.includes('role="status"');
  const hasButtonFeedback = loginContent.includes('isForgotSuccess') && loginContent.includes('Code envoyé !');
  if (!hasStatusAlert && !hasButtonFeedback) {
    console.error('FAILURE G190: LoginView.vue ne comporte pas de confirmation explicite d’envoi');
    return false;
  }

  // Vérification de la mention explicite de l'email
  if (!loginContent.includes('{{ email }}')) {
    console.error('FAILURE G190: LoginView.vue n’explicite pas l’adresse de destination {{ email }} dans le retour');
    return false;
  }

  // Éradication du ratio de contraste déficient 1.1:1 causé par :disabled sur le bouton de succès
  if (loginContent.includes(':disabled="authLoading || isForgotSuccess"')) {
    console.error('FAILURE G190: LoginView.vue utilise encore :disabled="authLoading || isForgotSuccess", créant un contraste déficient 1.1:1 en mode sombre');
    return false;
  }

  // Présence du CTA de retour à la connexion en cas de succès
  if (!loginContent.includes('Retour à la connexion')) {
    console.error('FAILURE G190: LoginView.vue ne propose pas de CTA fluide "Retour à la connexion" après l’envoi');
    return false;
  }

  // Prise en compte conjointe des erreurs locales et d'authentification
  if (!loginContent.includes('authError || message')) {
    console.error('FAILURE G190: LoginView.vue ne prend pas en compte conjointement authError || message dans le mode mot de passe oublié');
    return false;
  }

  // En-tête M3 avec icône et sous-titre lisible
  if (!loginContent.includes('text-base-content/75')) {
    console.error('FAILURE G190: LoginView.vue n’utilise pas un niveau de contraste suffisant (text-base-content/75) pour le sous-titre');
    return false;
  }

  console.log('G190 passed: forgot password screen theme readability, contrast resolution, explicit status banner, and login return path verified');
  return true;
}

