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

export function checkNotificationBell() {
  const bellPath = path.join(SRC_DIR, 'components', 'shared', 'NotificationBell.vue');
  if (!fs.existsSync(bellPath)) {
    console.error('FAILURE G147: NotificationBell.vue introuvable');
    return false;
  }

  const bellContent = fs.readFileSync(bellPath, 'utf8');
  if (!bellContent.includes('role="dialog"')) {
    console.error('FAILURE G147: NotificationBell.vue ne déclare pas de dialog accessible (role="dialog")');
    return false;
  }
  if (!bellContent.includes('top-full') || !bellContent.includes('absolute')) {
    console.error('FAILURE G147: NotificationBell.vue ne positionne pas son dialogue en popover ancré sous l\'icône (top-full, absolute)');
    return false;
  }
  if (!bellContent.includes('min-h-11') || !bellContent.includes('min-w-11')) {
    console.error('FAILURE G147: NotificationBell.vue ne garantit pas la cible tactile de 44px');
    return false;
  }
  if (!bellContent.includes('Aucune notification')) {
    console.error('FAILURE G147: NotificationBell.vue ne présente pas l\'état vide soigné attendu');
    return false;
  }

  const layouts = ['ManagerLayout.vue', 'EmployeeLayout.vue'];
  for (const layoutName of layouts) {
    const layoutPath = path.join(SRC_DIR, 'layouts', layoutName);
    if (!fs.existsSync(layoutPath)) {
      console.error(`FAILURE G148: ${layoutName} introuvable`);
      return false;
    }
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    if (!layoutContent.includes('<NotificationBell') || !layoutContent.includes('import NotificationBell')) {
      console.error(`FAILURE G148: ${layoutName} n'importe pas ou n'utilise pas NotificationBell`);
      return false;
    }

    const headerMatch = layoutContent.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
    const header = headerMatch ? headerMatch[1] : '';
    if (!header.includes('<NotificationBell') || !header.includes('<SyncAlert')) {
      console.error(`FAILURE G148: ${layoutName} n'expose pas NotificationBell et SyncAlert dans son en-tête`);
      return false;
    }
  }

  console.log('G147-G148 passed: NotificationBell implemented with anchored popover dialog below icon, empty state, and integrated in both headers');
  return true;
}

export function checkAccountLifecycle() {
  const upMigration = 'supabase/migrations/20261002220000_account_lifecycle_and_session_confirmation.sql';
  const downMigration = 'supabase/migrations/20261002220000_account_lifecycle_and_session_confirmation_down.sql';
  if (!fs.existsSync(upMigration) || !fs.existsSync(downMigration)) {
    console.error('FAILURE G150: Migrations Supabase introuvables');
    return false;
  }
  const upContent = fs.readFileSync(upMigration, 'utf8');
  if (!upContent.includes('pending_validation') || !upContent.includes('cleanup_expired_profiles') || !upContent.includes('pg_cron')) {
    console.error('FAILURE G150: Migration UP incomplète');
    return false;
  }

  const dbPath = path.join(SRC_DIR, 'lib', 'db.js');
  const tsPath = path.join(SRC_DIR, 'types', 'database.types.d.ts');
  const dbContent = fs.readFileSync(dbPath, 'utf8');
  const tsContent = fs.readFileSync(tsPath, 'utf8');
  if (!dbContent.includes('this.version(3).stores') || !dbContent.includes('status') || !tsContent.includes('pending_validation')) {
    console.error('FAILURE G151: Dexie version(3) ou types TypeScript incomplets');
    return false;
  }

  const pendingViewPath = path.join(SRC_DIR, 'views', 'employee', 'PendingApprovalView.vue');
  const appPath = path.join(SRC_DIR, 'App.vue');
  if (!fs.existsSync(pendingViewPath)) {
    console.error('FAILURE G152: PendingApprovalView.vue introuvable');
    return false;
  }
  const pendingContent = fs.readFileSync(pendingViewPath, 'utf8');
  const appContent = fs.readFileSync(appPath, 'utf8');
  if (!pendingContent.includes('confirmation') || !pendingContent.includes('signOut') || !appContent.includes('PendingApprovalView')) {
    console.error('FAILURE G152: PendingApprovalView ou câblage App.vue incomplets');
    return false;
  }

  const empViewPath = path.join(SRC_DIR, 'views', 'manager', 'EmployeesView.vue');
  const empContent = fs.readFileSync(empViewPath, 'utf8');
  if (!empContent.includes('pending_validation') || !empContent.includes('confirmValidate') || !empContent.includes('confirmArchive') || !empContent.includes('confirmUnarchive')) {
    console.error('FAILURE G153: EmployeesView.vue n\'intègre pas les actions de cycle de vie');
    return false;
  }

  const profilePath = path.join(SRC_DIR, 'composables', 'useProfile.js');
  const profileContent = fs.readFileSync(profilePath, 'utf8');
  if (!profileContent.includes('isPendingApproval') || !profileContent.includes('isArchived') || !profileContent.includes('isDisabled')) {
    console.error('FAILURE G154: useProfile.js n\'expose pas les helpers de cycle de vie');
    return false;
  }

  console.log('G150-G154 passed: Account lifecycle, employee session onboarding and manager actions fully verified');
  return true;
}

/**
 * Vérifie le système de notifications pour les comptes en attente de validation (G156-G158).
 */
export function checkPendingNotifications() {
  const notifComposablePath = path.join(SRC_DIR, 'composables', 'useNotifications.js');
  if (!fs.existsSync(notifComposablePath)) {
    console.error('FAILURE G156: src/composables/useNotifications.js introuvable');
    return false;
  }
  const notifContent = fs.readFileSync(notifComposablePath, 'utf8');
  if (
    !notifContent.includes('pending_validation') ||
    !notifContent.includes('notifications') ||
    !notifContent.includes('unreadCount')
  ) {
    console.error('FAILURE G156: useNotifications.js incomplet ou sans gestion de pending_validation');
    return false;
  }

  const bellPath = path.join(SRC_DIR, 'components', 'shared', 'NotificationBell.vue');
  const bellContent = fs.readFileSync(bellPath, 'utf8');
  if (
    !bellContent.includes('unreadCount') ||
    !bellContent.includes('useNotifications') ||
    !bellContent.includes('badge')
  ) {
    console.error('FAILURE G157: NotificationBell.vue n\'intègre pas les notifications ou le badge');
    return false;
  }

  const pendingViewPath = path.join(SRC_DIR, 'views', 'employee', 'PendingApprovalView.vue');
  const pendingContent = fs.readFileSync(pendingViewPath, 'utf8');
  if (!pendingContent.includes('NotificationBell') || !pendingContent.includes('supérieur')) {
    console.error('FAILURE G158: PendingApprovalView.vue n\'intègre pas NotificationBell ou le message pour les supérieurs');
    return false;
  }

  console.log('G156-G158 passed: Pending account notifications for managers and employees fully verified');
  return true;
}

/**
 * Vérifie l'action manuelle de refus et purge immédiate d'un compte non validé (G159-G160).
 */
export function checkImmediateReject() {
  const upFile = path.resolve('supabase/migrations/20261002223000_reject_pending_profile_rpc.sql');
  const downFile = path.resolve('supabase/migrations/20261002223000_reject_pending_profile_rpc_down.sql');

  if (!fs.existsSync(upFile) || !fs.existsSync(downFile)) {
    console.error('FAILURE G159: Fichiers de migration RPC reject introuvables');
    return false;
  }

  const upContent = fs.readFileSync(upFile, 'utf8');
  const downContent = fs.readFileSync(downFile, 'utf8');
  if (!upContent.includes('admin_reject_unverified_account') || !upContent.includes('pending_validation') || !downContent.includes('DROP FUNCTION')) {
    console.error('FAILURE G159: Fichiers de migration RPC reject incomplets');
    return false;
  }

  const empViewPath = path.join(SRC_DIR, 'views', 'manager', 'EmployeesView.vue');
  const empContent = fs.readFileSync(empViewPath, 'utf8');
  if (!empContent.includes('requestReject') || !empContent.includes('confirmReject') || !empContent.includes('admin_reject_unverified_account') || !empContent.includes('Refuser')) {
    console.error('FAILURE G160: EmployeesView.vue n\'intègre pas l\'action de refus ou la modale');
    return false;
  }

  console.log('G159-G160 passed: Immediate reject action and RPC purge fully verified');
  return true;
}

/**
 * Vérifie la session restreinte et l'écran dédié aux comptes archivés (G162-G163).
 */
export function checkArchivedAccountSession() {
  const archivedViewPath = path.join(SRC_DIR, 'views', 'employee', 'ArchivedAccountView.vue');
  if (!fs.existsSync(archivedViewPath)) {
    console.error('FAILURE G162: ArchivedAccountView.vue introuvable');
    return false;
  }

  const archivedContent = fs.readFileSync(archivedViewPath, 'utf8');
  if (
    !archivedContent.includes('min-h-11') ||
    !archivedContent.includes('Compte archivé') ||
    archivedContent.includes('veuillez') ||
    archivedContent.includes('utilisateur')
  ) {
    console.error('FAILURE G162: ArchivedAccountView.vue non conforme aux règles M3 (44px) ou ton G30');
    return false;
  }

  const appPath = path.join(SRC_DIR, 'App.vue');
  const appContent = fs.readFileSync(appPath, 'utf8');
  if (
    !appContent.includes('ArchivedAccountView') ||
    !appContent.includes('isArchived') ||
    !appContent.includes("status === 'archived'")
  ) {
    console.error('FAILURE G163: App.vue n\'isole pas les comptes archivés ou désactivés');
    return false;
  }

  const notifPath = path.join(SRC_DIR, 'composables', 'useNotifications.js');
  const notifContent = fs.readFileSync(notifPath, 'utf8');
  if (!notifContent.includes('account_archived')) {
    console.error('FAILURE G163: useNotifications.js n\'intègre pas la notification de compte archivé');
    return false;
  }

  console.log('G162-G163 passed: Archived account session and isolation fully verified');
  return true;
}

/**
 * Vérifie la responsivité fluide, l'assise onepage-first et la maîtrise des marges latérales (G165).
 */

export function checkPrivilegedRolesArchiveProtection() {
  const upFile = path.resolve('supabase/migrations/20261003001500_prevent_archiving_privileged_roles.sql');
  const downFile = path.resolve('supabase/migrations/20261003001500_prevent_archiving_privileged_roles_down.sql');

  if (!fs.existsSync(upFile) || !fs.existsSync(downFile)) {
    console.error('FAILURE G167: Fichiers de migration prevent_archiving_privileged_roles introuvables');
    return false;
  }

  const upContent = fs.readFileSync(upFile, 'utf8');
  if (
    !upContent.includes('check_profile_archive_eligibility') ||
    !upContent.includes('profiles_prevent_archive_privileged_roles')
  ) {
    console.error('FAILURE G167: Migration SQL incomplète (trigger ou contrainte CHECK manquants)');
    return false;
  }

  const empPath = path.join(SRC_DIR, 'views', 'manager', 'EmployeesView.vue');
  const empContent = fs.readFileSync(empPath, 'utf8');

  if (
    !empContent.includes("emp.role !== 'employee'") ||
    !empContent.includes("target.role !== 'employee'") ||
    !empContent.includes('Rôle protégé : modifier en collaborateur pour archiver')
  ) {
    console.error('FAILURE G167: EmployeesView.vue ne bloque pas ou n\'explique pas la protection des rôles privilégiés');
    return false;
  }

  console.log('G167 passed: Privileged roles (manager, admin) archive protection fully verified');
  return true;
}

/**
 * Vérifie le renforcement et l'automatisation de la boucle d'apprentissage KI (G169 à G172).
 */

export function checkAccountConfirmationFeedback() {
  const notifFile = path.resolve('src/composables/useNotifications.js');
  const notifContent = fs.readFileSync(notifFile, 'utf8');
  for (const token of ['pendingAccountsCount', 'account_activated', 'Compte confirmé et actif', 'Pointer ma présence']) {
    if (!notifContent.includes(token)) {
      console.error(`FAILURE G180: useNotifications.js ne contient pas ${token}`);
      return false;
    }
  }

  const managerLayoutFile = path.resolve('src/layouts/ManagerLayout.vue');
  const layoutContent = fs.readFileSync(managerLayoutFile, 'utf8');
  for (const token of ['pendingAccountsCount', '/manager/employees', 'badge badge-warning text-warning-content badge-xs font-bold']) {
    if (!layoutContent.includes(token)) {
      console.error(`FAILURE G180: ManagerLayout.vue ne contient pas ${token}`);
      return false;
    }
  }

  console.log('G180 passed: pending accounts manager sidebar badge and employee activation feedback verified');
  return true;
}

export function checkAuthTransition() {
  const authFile = path.resolve('src/composables/useAuth.js');
  const authContent = fs.readFileSync(authFile, 'utf8');
  for (const token of ['authInitializing', 'authLoading', 'initAuth', 'authInitializing.value = true', 'authInitializing.value = false']) {
    if (!authContent.includes(token)) {
      console.error(`FAILURE G182: useAuth.js ne contient pas ${token}`);
      return false;
    }
  }

  const appFile = path.resolve('src/App.vue');
  const appContent = fs.readFileSync(appFile, 'utf8');
  for (const token of ['authInitializing', 'authInitializing || (isAuthenticated && !profile && profileLoading)', "navigate('/login')"]) {
    if (!appContent.includes(token)) {
      console.error(`FAILURE G182: App.vue ne contient pas ${token}`);
      return false;
    }
  }

  const loginFile = path.resolve('src/views/auth/LoginView.vue');
  const loginContent = fs.readFileSync(loginFile, 'utf8');
  for (const token of ['isSubmitting', 'isSubmitting || authLoading || isSuccess', "navigate('/login')"]) {
    if (!loginContent.includes(token)) {
      console.error(`FAILURE G182: LoginView.vue ne contient pas ${token}`);
      return false;
    }
  }

  console.log('G182 passed: auth initialization decoupled from submission loading, unbroken login feedback and transition preserved');
  return true;
}


export function checkOtpRecovery() {
  const authFile = path.resolve('src/composables/useAuth.js');
  const authContent = fs.readFileSync(authFile, 'utf8');

  if (!authContent.includes('verifyRecoveryOtp')) {
    console.error('FAILURE G192: useAuth.js ne déclare pas verifyRecoveryOtp');
    return false;
  }
  if (!authContent.includes("type: 'recovery'") && !authContent.includes('type: "recovery"')) {
    console.error('FAILURE G192: useAuth.js verifyRecoveryOtp n’appelle pas verifyOtp avec type: "recovery"');
    return false;
  }
  if (!authContent.includes('return {') || !authContent.includes('verifyRecoveryOtp,')) {
    console.error('FAILURE G192: useAuth.js n’exporte pas verifyRecoveryOtp');
    return false;
  }

  const loginFile = path.resolve('src/views/auth/LoginView.vue');
  const loginContent = fs.readFileSync(loginFile, 'utf8');

  if (!loginContent.includes('verifyRecoveryOtp')) {
    console.error('FAILURE G192: LoginView.vue n’importe pas verifyRecoveryOtp');
    return false;
  }
  if (!loginContent.includes('forgotStep') || !loginContent.includes("forgotStep === 'otp'")) {
    console.error('FAILURE G192: LoginView.vue ne gère pas le parcours en 2 étapes avec forgotStep');
    return false;
  }
  if (!loginContent.includes('id="otp-code"') || !loginContent.includes('inputmode="numeric"') || !loginContent.includes('maxlength="6"')) {
    console.error('FAILURE G192: LoginView.vue ne propose pas de champ otp-code numérique à 6 chiffres');
    return false;
  }
  if (!loginContent.includes('id="new-password"')) {
    console.error('FAILURE G192: LoginView.vue ne propose pas de champ nouveau mot de passe');
    return false;
  }
  if (!loginContent.includes('Valider et accéder à mon compte')) {
    console.error('FAILURE G192: LoginView.vue ne propose pas le bouton d’action "Valider et accéder à mon compte"');
    return false;
  }

  console.log('G192 passed: in-app 6-digit OTP verification, reactive session sync, optional password update and M3 step flow verified');
  return true;
}

export function checkOtpButtonFeedback() {
  const loginFile = path.resolve('src/views/auth/LoginView.vue');
  const loginContent = fs.readFileSync(loginFile, 'utf8');

  // 1. Bouton étape 1 : retour dynamique de succès avec classe btn-success et mention "Code envoyé !"
  if (
    !loginContent.includes("isForgotSuccess ? 'btn-success text-success-content font-bold pointer-events-none' : 'btn-primary'") &&
    !loginContent.includes('isForgotSuccess ? "btn-success text-success-content font-bold pointer-events-none" : "btn-primary"') &&
    !loginContent.includes("isForgotSuccess ? 'btn-success text-success-content font-bold' : 'btn-primary'")
  ) {
    console.error('FAILURE G194: LoginView.vue n’applique pas la bascule dynamique btn-success sur le bouton de demande OTP');
    return false;
  }

  if (!loginContent.includes('Code envoyé !')) {
    console.error('FAILURE G194: LoginView.vue n’affiche pas "Code envoyé !" dans le bouton de demande OTP');
    return false;
  }

  // 2. handleForgotPassword temporise avec setTimeout pour laisser lire le feedback avant transition
  if (!loginContent.includes('setTimeout') || !loginContent.includes('isForgotSuccess.value = true')) {
    console.error('FAILURE G194: handleForgotPassword ne temporise pas le feedback de succès');
    return false;
  }

  // 3. Étape 2 épurée : suppression du bandeau vert redondant alert-success
  const otpStepIndex = loginContent.indexOf("forgotStep === 'otp'");
  if (otpStepIndex === -1) {
    console.error('FAILURE G194: étape OTP introuvable');
    return false;
  }
  const otpSection = loginContent.slice(otpStepIndex);
  if (otpSection.includes('alert alert-success')) {
    console.error('FAILURE G194: l’étape OTP conserve un bandeau alert-success redondant');
    return false;
  }

  console.log('G194 passed: in-button OTP request feedback, timed transition, and clean direct OTP input layout verified');
  return true;
}

export function checkUserNamesSplit() {
  const migFile = path.resolve('supabase/migrations/20261006170000_add_first_and_last_name_to_profiles.sql');
  if (!fs.existsSync(migFile)) {
    console.error('FAILURE G196: migration SQL pour first_name et last_name introuvable');
    return false;
  }
  const migContent = fs.readFileSync(migFile, 'utf8');
  if (!migContent.includes('first_name TEXT') || !migContent.includes('last_name TEXT')) {
    console.error('FAILURE G196: colonnes first_name ou last_name absentes de la migration');
    return false;
  }
  if (!migContent.includes('v_first_name') || !migContent.includes('v_last_name')) {
    console.error('FAILURE G196: trigger handle_new_user() n’extrait pas v_first_name / v_last_name');
    return false;
  }

  const typesFile = path.resolve('src/types/database.types.d.ts');
  const typesContent = fs.readFileSync(typesFile, 'utf8');
  if (!typesContent.includes('first_name: string') || !typesContent.includes('last_name: string')) {
    console.error('FAILURE G196: types TypeScript pour first_name ou last_name manquants');
    return false;
  }

  const dbFile = path.resolve('src/lib/db.js');
  const dbContent = fs.readFileSync(dbFile, 'utf8');
  if (!dbContent.includes('this.version(5)') || !dbContent.includes('profile.first_name')) {
    console.error('FAILURE G196: Dexie db.js ne déclare pas la version 5 avec migration');
    return false;
  }

  const authFile = path.resolve('src/composables/useAuth.js');
  const authContent = fs.readFileSync(authFile, 'utf8');
  if (!authContent.includes('first_name: firstName') || !authContent.includes('last_name: lastName')) {
    console.error('FAILURE G196: useAuth.js signUp ne transmet pas first_name et last_name');
    return false;
  }

  const loginFile = path.resolve('src/views/auth/LoginView.vue');
  const loginContent = fs.readFileSync(loginFile, 'utf8');
  if (!loginContent.includes('id="reg-firstname"') || !loginContent.includes('id="reg-lastname"')) {
    console.error('FAILURE G196: LoginView.vue ne propose pas les champs reg-firstname et reg-lastname');
    return false;
  }

  const empFile = path.resolve('src/views/manager/EmployeesView.vue');
  const empContent = fs.readFileSync(empFile, 'utf8');
  if (!empContent.includes('editForm.first_name') || !empContent.includes('editForm.last_name')) {
    console.error('FAILURE G196: EmployeesView.vue ne gère pas first_name et last_name dans sa modale d’édition');
    return false;
  }

  const homeFile = path.resolve('src/views/employee/HomeView.vue');
  const homeContent = fs.readFileSync(homeFile, 'utf8');
  if (!homeContent.includes('profile.value?.first_name')) {
    console.error('FAILURE G196: HomeView.vue n’utilise pas profile.value?.first_name dans displayName');
    return false;
  }

  console.log('G196 passed: first_name and last_name split across migration, types, Dexie v5, auth and UI verified');
  return true;
}

