import {
  checkEmojis,
  checkRadii,
  checkShadows,
  checkTouchTargets,
  checkLayout,
  checkEmployeeDesktop,
  checkResponsiveCards,
  checkCardDesktop,
  checkPastDaysDisabled,
  checkConfirmationOverlayMarkup,
  checkFeedbackWiring,
  checkWeekSummaryWiring,
  checkMotionConformance,
  checkEmployeeFeedbackConformance,
  checkVoiceConformance,
  checkToneRuleRegistered,
  checkEmployeeFinish,
  checkResponsiveOnepageViews,
} from './checks/ui.mjs';

import {
  checkThemeEmojis,
  checkThemeRadii,
  checkThemeShadows,
  checkThemeTargets,
  checkThemePlacement,
  checkThemeCss,
  checkForgotPasswordTheme,
} from './checks/theme.mjs';

import {
  checkSyncIndicatorPreserved,
  checkOpenSessionWiring,
  checkOpenSessionConformance,
  checkHeaderDeduplication,
  checkUxConformance,
  checkDrawerSettingsLayout,
  checkAppearanceControlMarkup,
  checkSyncBadgeTruncation,
  checkManagerRamp,
  checkDrawerParity,
  checkManagerNavTargets,
  checkDrawerFooter,
  checkGatewayNeutral,
  checkManagerTonalRamp,
  checkDrawerSharedGrammar,
  checkNavigationDocking,
  checkSidebarRail,
  checkSidebarHandle,
  checkSettingsPage,
  checkCrossSpaceGateways,
  checkBackNavigation,
} from './checks/navigation.mjs';

import {
  checkLocationsForm,
  checkLocationsCards,
  checkLocationsFilters,
  checkPresencesUi,
  checkPresencesPeriod,
  checkPresencesTable,
  checkPresencesSort,
  checkPresencesLocalFirst,
  checkSyncScope,
  checkLiveQueryDeps,
  checkManagerDexie,
  checkManagerGrammar,
  checkManagerResponsive,
  checkManagerNavIcons,
  checkManagerFinish,
} from './checks/manager.mjs';

import {
  checkNotificationBell,
  checkAccountLifecycle,
  checkPendingNotifications,
  checkImmediateReject,
  checkArchivedAccountSession,
  checkPrivilegedRolesArchiveProtection,
  checkAccountConfirmationFeedback,
  checkAuthTransition,
  checkOtpRecovery,
  checkOtpButtonFeedback,
  checkUserNamesSplit,
} from './checks/auth-accounts.mjs';

import {
  checkAbsenceModel,
  checkAbsenceSync,
  checkAbsenceNotifications,
  checkAbsenceUi,
} from './checks/absence.mjs';

import {
  checkBuild,
  checkKnowledgeLoop,
  checkAppLoading,
  checkAppIdentity,
  checkLoadingMargins,
} from './checks/system.mjs';

/**
 * Registre des oracles individuels accessibles via le CLI
 */
export const ORACLES_MAP = new Map([
  ['--emojis', checkEmojis],
  ['--user-names-split', checkUserNamesSplit],
  ['--radii', checkRadii],
  ['--shadows', checkShadows],
  ['--targets', checkTouchTargets],
  ['--layout', checkLayout],
  ['--employee-desktop', checkEmployeeDesktop],
  ['--responsive', checkResponsiveCards],
  ['--card-desktop', checkCardDesktop],
  ['--past-days', checkPastDaysDisabled],
  ['--build', () => checkBuild()],
  ['--theme-placement', checkThemePlacement],
  ['--theme-css', checkThemeCss],
  ['--theme-emojis', checkThemeEmojis],
  ['--theme-radii', checkThemeRadii],
  ['--theme-shadows', checkThemeShadows],
  ['--theme-targets', checkThemeTargets],
  ['--sync-indicator-preserved', checkSyncIndicatorPreserved],
  ['--open-session-wiring', checkOpenSessionWiring],
  ['--open-session-conformance', checkOpenSessionConformance],
  ['--header-deduplication', checkHeaderDeduplication],
  ['--ux-conformance', checkUxConformance],
  ['--drawer-settings-layout', checkDrawerSettingsLayout],
  ['--appearance-control-markup', checkAppearanceControlMarkup],
  ['--sync-badge-truncation', checkSyncBadgeTruncation],
  ['--check-overlay-markup', checkConfirmationOverlayMarkup],
  ['--check-feedback-wiring', checkFeedbackWiring],
  ['--check-week-summary-wiring', checkWeekSummaryWiring],
  ['--motion-conformance', checkMotionConformance],
  ['--employee-feedback-conformance', checkEmployeeFeedbackConformance],
  ['--voice-conformance', checkVoiceConformance],
  ['--tone-rule-registered', checkToneRuleRegistered],
  ['--manager-ramp', checkManagerRamp],
  ['--drawer-parity', checkDrawerParity],
  ['--manager-nav-targets', checkManagerNavTargets],
  ['--drawer-footer', checkDrawerFooter],
  ['--gateway-neutral', checkGatewayNeutral],
  ['--manager-tonal-ramp', checkManagerTonalRamp],
  ['--drawer-shared-grammar', checkDrawerSharedGrammar],
  ['--nav-docking', checkNavigationDocking],
  ['--sidebar-handle', checkSidebarHandle],
  ['--sidebar-rail', checkSidebarRail],
  ['--locations-form', checkLocationsForm],
  ['--locations-cards', checkLocationsCards],
  ['--locations-filters', checkLocationsFilters],
  ['--presences-ui', checkPresencesUi],
  ['--presences-period', checkPresencesPeriod],
  ['--presences-table', checkPresencesTable],
  ['--presences-sort', checkPresencesSort],
  ['--presences-localfirst', checkPresencesLocalFirst],
  ['--sync-scope', checkSyncScope],
  ['--livequery-deps', checkLiveQueryDeps],
  ['--manager-dexie', checkManagerDexie],
  ['--manager-grammar', checkManagerGrammar],
  ['--manager-responsive', checkManagerResponsive],
  ['--manager-nav-icons', checkManagerNavIcons],
  ['--manager-finish', checkManagerFinish],
  ['--employee-finish', checkEmployeeFinish],
  ['--settings-page', checkSettingsPage],
  ['--cross-space-gateways', checkCrossSpaceGateways],
  ['--back-navigation', checkBackNavigation],
  ['--sidebar-build', () => checkBuild('G48', 'production build succeeds with exit code 0')],
  ['--manager-build', () => checkBuild('G39', 'production build succeeds with exit code 0')],
  ['--notification-bell', checkNotificationBell],
  ['--account-lifecycle', checkAccountLifecycle],
  ['--pending-notifications', checkPendingNotifications],
  ['--immediate-reject', checkImmediateReject],
  ['--archived-session', checkArchivedAccountSession],
  ['--responsive-views', checkResponsiveOnepageViews],
  ['--absence-model', checkAbsenceModel],
  ['--absence-sync', checkAbsenceSync],
  ['--absence-notifications', checkAbsenceNotifications],
  ['--absence-ui', checkAbsenceUi],
  ['--account-feedback', checkAccountConfirmationFeedback],
  ['--auth-transition', checkAuthTransition],
  ['--app-loading', checkAppLoading],
  ['--app-identity', checkAppIdentity],
  ['--loading-margins', checkLoadingMargins],
  ['--forgot-password-theme', checkForgotPasswordTheme],
  ['--otp-recovery', checkOtpRecovery],
  ['--otp-button-feedback', checkOtpButtonFeedback],
  ['--archive-protection', checkPrivilegedRolesArchiveProtection],
  ['--knowledge-loop', checkKnowledgeLoop],
]);

/**
 * Exécute la suite complète ordonnée de vérification (--all)
 */
export function runAll() {
  const r1 = checkEmojis();
  const r2 = checkRadii();
  const r3 = checkShadows();
  const r4 = checkTouchTargets();
  const r5 = checkLayout();
  const r6 = checkEmployeeDesktop();
  const r7 = checkResponsiveCards();
  const r9 = checkCardDesktop();
  const r10 = checkPastDaysDisabled();
  const r8 = checkBuild();
  const r11 = checkThemePlacement();
  const r12 = checkThemeCss();
  const r13 = checkThemeEmojis();
  const r14 = checkThemeRadii();
  const r15 = checkThemeShadows();
  const r16 = checkThemeTargets();
  const r17 = checkSyncIndicatorPreserved();
  const r18 = checkOpenSessionWiring();
  const r19 = checkOpenSessionConformance();
  const r20 = checkHeaderDeduplication();
  const r21 = checkUxConformance();
  const r25 = checkConfirmationOverlayMarkup();
  const r26 = checkFeedbackWiring();
  const r27 = checkWeekSummaryWiring();
  const r28 = checkMotionConformance();
  const r29 = checkEmployeeFeedbackConformance();
  const r30 = checkVoiceConformance();
  const r31 = checkToneRuleRegistered();
  const r32 = checkManagerRamp();
  const r33 = checkDrawerParity();
  const r34 = checkManagerNavTargets();
  const r35 = checkDrawerFooter();
  const r36 = checkGatewayNeutral();
  const r37 = checkManagerTonalRamp();
  const r39 = checkBuild('G39', 'production build succeeds with exit code 0');
  const r40 = checkDrawerSharedGrammar();
  const r43 = checkNavigationDocking();
  const r45 = checkSidebarRail();
  const r49 = checkSidebarHandle();
  const r56 = checkLocationsForm();
  const r58 = checkLocationsCards();
  const r60 = checkLocationsFilters();
  const r63 = checkPresencesUi();
  const r64 = checkPresencesPeriod();
  const r65 = checkPresencesTable();
  const r66 = checkPresencesSort();
  const r72 = checkPresencesLocalFirst();
  const r73 = checkSyncScope();
  const r74 = checkLiveQueryDeps();
  const r75 = checkManagerDexie();
  const r88 = checkManagerGrammar();
  const r89 = checkManagerResponsive();
  const r92 = checkManagerNavIcons();
  const r93 = checkManagerFinish();
  const r94 = checkEmployeeFinish();
  const r95 = checkSettingsPage();
  const r96 = checkCrossSpaceGateways();
  const r97 = checkBackNavigation();
  const r147 = checkNotificationBell();
  const r150 = checkAccountLifecycle();
  const r156 = checkPendingNotifications();
  const r159 = checkImmediateReject();
  const r162 = checkArchivedAccountSession();
  const r165 = checkResponsiveOnepageViews();
  const r167 = checkPrivilegedRolesArchiveProtection();
  const r169 = checkKnowledgeLoop();
  const r175 = checkAbsenceModel();
  const r176 = checkAbsenceSync();
  const r177 = checkAbsenceNotifications();
  const r178 = checkAbsenceUi();
  const r180 = checkAccountConfirmationFeedback();
  const r182 = checkAuthTransition();
  const r184 = checkAppLoading();
  const r186 = checkAppIdentity();
  const r188 = checkLoadingMargins();
  const r190 = checkForgotPasswordTheme();
  const r192 = checkOtpRecovery();
  const r194 = checkOtpButtonFeedback();
  const r196 = checkUserNamesSplit();
  const r48 = r39; // Une seule compilation sert les portes de build G39 et G48

  return (
    r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8 && r9 && r10 &&
    r11 && r12 && r13 && r14 && r15 && r16 && r17 && r18 && r19 && r20 &&
    r21 && r25 && r26 && r27 && r28 && r29 && r30 && r31 && r32 && r33 &&
    r34 && r35 && r36 && r37 && r39 && r40 && r43 && r45 && r49 && r48 &&
    r56 && r58 && r60 && r63 && r64 && r65 && r66 && r72 && r73 && r74 &&
    r75 && r88 && r89 && r92 && r93 && r94 && r95 && r96 && r97 && r147 &&
    r150 && r156 && r159 && r162 && r165 && r167 && r169 && r175 && r176 &&
    r177 && r178 && r180 && r182 && r184 && r186 && r188 && r190 && r192 &&
    r194 && r196
  );
}

/**
 * Point d'entrée d'exécution en ligne de commande
 */
export function runCli(argv = process.argv.slice(2)) {
  const arg = argv[0] || '--all';

  if (arg === '--all') {
    const success = runAll();
    process.exit(success ? 0 : 1);
  }

  const handler = ORACLES_MAP.get(arg);
  if (handler) {
    const success = handler();
    process.exit(success ? 0 : 1);
  }

  const flagList = Array.from(ORACLES_MAP.keys()).join('|');
  console.error(`Usage: node scripts/verify-gates.mjs [${flagList}|--all]`);
  process.exit(1);
}
