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

export function checkAbsenceModel() {
  const migrationFile = path.resolve('supabase/migrations/20261005170000_create_absence_requests.sql');
  if (!fs.existsSync(migrationFile)) {
    console.error('FAILURE G175: migration supabase absence_requests introuvable');
    return false;
  }
  const migrationContent = fs.readFileSync(migrationFile, 'utf8');
  for (const token of ['CREATE TABLE IF NOT EXISTS public.absence_requests', 'CHECK (status IN', 'ENABLE ROW LEVEL SECURITY', 'absence_requests_decide_manager']) {
    if (!migrationContent.includes(token)) {
      console.error(`FAILURE G175: migration supabase manque le fragment ${token}`);
      return false;
    }
  }

  const typesFile = path.resolve('src/types/database.types.d.ts');
  const typesContent = fs.readFileSync(typesFile, 'utf8');
  if (!typesContent.includes('absence_requests: {')) {
    console.error('FAILURE G175: src/types/database.types.d.ts ne déclare pas absence_requests');
    return false;
  }

  const dbFile = path.resolve('src/lib/db.js');
  const dbContent = fs.readFileSync(dbFile, 'utf8');
  if (!dbContent.includes("absence_requests: 'id, user_id, week_start, status, client_mutation_id, updated_at, deleted_at'")) {
    console.error('FAILURE G175: src/lib/db.js n’enregistre pas absence_requests en version 4');
    return false;
  }

  console.log('G175 passed: absence_requests supabase migration, types, and Dexie v4 store verified');
  return true;
}

/**
 * G176 : Synchronisation Outbox, Pull par rôle et composable useAbsenceRequests
 */
export function checkAbsenceSync() {
  const syncFile = path.resolve('src/composables/useSyncEngine.js');
  const syncContent = fs.readFileSync(syncFile, 'utf8');
  if (!syncContent.includes("from('absence_requests')") || !syncContent.includes("table: 'absence_requests'")) {
    console.error('FAILURE G176: useSyncEngine.js n’intègre pas le pull et realtime de absence_requests');
    return false;
  }

  const composableFile = path.resolve('src/composables/useAbsenceRequests.js');
  if (!fs.existsSync(composableFile)) {
    console.error('FAILURE G176: useAbsenceRequests.js introuvable');
    return false;
  }
  const composableContent = fs.readFileSync(composableFile, 'utf8');
  for (const method of ['submitRequest', 'cancelRequest', 'validateRequest', 'refuseRequest', 'currentWeekRequest']) {
    if (!composableContent.includes(method)) {
      console.error(`FAILURE G176: useAbsenceRequests.js manque la méthode ${method}`);
      return false;
    }
  }

  console.log('G176 passed: absence requests sync engine integration and composable logic verified');
  return true;
}

/**
 * G177 : Notifications croisées réactives pour gestionnaires et collaborateurs
 */
export function checkAbsenceNotifications() {
  const notifFile = path.resolve('src/composables/useNotifications.js');
  const notifContent = fs.readFileSync(notifFile, 'utf8');
  if (!notifContent.includes('absence_requests') || !notifContent.includes('Demande d’absence en attente') || !notifContent.includes('myAbsenceRequests')) {
    console.error('FAILURE G177: useNotifications.js n’intègre pas les notifications réactives d’absence');
    return false;
  }

  const bellFile = path.resolve('src/components/shared/NotificationBell.vue');
  const bellContent = fs.readFileSync(bellFile, 'utf8');
  if (!bellContent.includes('item.badge')) {
    console.error('FAILURE G177: NotificationBell.vue ne supporte pas les badges d’état d’absence');
    return false;
  }

  console.log('G177 passed: absence request notification reactive queries and bell integration verified');
  return true;
}

/**
 * G178 : Ergonomie employé (demande/annulation/contour vert) et arbitrage manager
 */
export function checkAbsenceUi() {
  const weekGridFile = path.resolve('src/components/employee/WeekGrid.vue');
  const weekGridContent = fs.readFileSync(weekGridFile, 'utf8');
  for (const token of ['Demande d\'absence', 'Annuler ma demande', 'border-success', 'isRequestValidated', 'useAbsenceRequests']) {
    if (!weekGridContent.includes(token)) {
      console.error(`FAILURE G178: WeekGrid.vue ne contient pas le fragment ${token}`);
      return false;
    }
  }

  const managerViewFile = path.resolve('src/views/manager/AvailabilitiesView.vue');
  const managerContent = fs.readFileSync(managerViewFile, 'utf8');
  for (const token of ['Demandes d’absence à traiter', 'handleValidateAbsence', 'openRefuseModal', 'Absence validée', 'useAbsenceRequests']) {
    if (!managerContent.includes(token)) {
      console.error(`FAILURE G178: AvailabilitiesView.vue manager ne contient pas ${token}`);
      return false;
    }
  }

  console.log('G178 passed: absence employee and manager UI interactions and M3 styling verified');
  return true;
}

/** Vérifie le badge de collaborateurs en attente côté manager et la confirmation d'activation collaborateur. */
