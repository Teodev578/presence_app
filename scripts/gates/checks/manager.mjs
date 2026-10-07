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

export function checkLocationsForm() {
  const sliceDialog = (text) => {
    const start = text.indexOf('<dialog');
    const end = text.indexOf('</dialog>');
    return start === -1 || end === -1 ? '' : text.slice(start, end + '</dialog>'.length);
  };

  const formGaps = (dialog) => {
    const gaps = [];
    if (!dialog.includes('max-w-xl')) gaps.push('dialogue non élargi');
    if (!dialog.includes('bg-base-100')) gaps.push('dialogue hors élévation 3');
    if (dialog.includes('input-sm')) gaps.push('champ rétréci (input-sm)');
    if (dialog.includes('max-w-md')) gaps.push('largeur étroite (max-w-md)');
    const inputs = dialog.match(/<input[\s\S]*?\/>/g) || [];
    const textInputs = inputs.filter((tag) => /type="(text|number)"/.test(tag));
    if (textInputs.length < 5) gaps.push(`champs texte insuffisants (${textInputs.length})`);
    for (const tag of textInputs) {
      if (!tag.includes('w-full')) gaps.push('champ sans w-full');
      if (!tag.includes('min-h-11')) gaps.push('champ sous 44px');
    }
    const range = inputs.find((tag) => tag.includes('type="range"'));
    if (!range || !range.includes('w-full')) gaps.push('curseur non pleine largeur');
    return gaps;
  };

  // Contrôle négatif : un dialogue étroit aux champs rétrécis doit être refusé.
  const bogus = sliceDialog(
    '<dialog><div class="modal-box max-w-md bg-base-100">'
      + '<input type="text" class="input input-sm" />'
      + '<input type="range" class="range range-xs" /></div></dialog>'
  );
  if (formGaps(bogus).length === 0) {
    console.error('FAILURE G56: le détecteur de dimensionnement est aveugle, oracle invalide');
    return false;
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'LocationsView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G56: LocationsView.vue introuvable');
    return false;
  }
  const content = fs.readFileSync(file, 'utf8');
  const gaps = formGaps(sliceDialog(content));
  const searchFullWidth = /class="input input-bordered flex w-full/.test(content) && !content.includes('sm:w-80');
  if (!searchFullWidth) gaps.push('barre de recherche non pleine largeur');

  if (gaps.length > 0) {
    console.error(`FAILURE G56: le dialogue de site reste sous-dimensionné -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G56 passed: the locations dialog fields and search fill their containers at 44px');
  return true;
}

/**
 * G58 : Les cartes de sites situent le lieu sans jargon : périmètre autorisé explicite,
 * coordonnées nommées par hémisphère, et lien cartographique ouvert à la demande, sans
 * coordonnées brutes étiquetées « Latitude / Longitude ».
 */
export function checkLocationsCards() {
  const cardGaps = (text) => {
    const gaps = [];
    for (const token of ['Périmètre autorisé', 'Voir sur la carte', 'formatCoordinate', 'mapUrl', 'toggle toggle-success', 'type="checkbox"']) {
      if (!text.includes(token)) gaps.push(`carte sans « ${token} »`);
    }
    if (!text.includes('@change="toggleStatus(loc)"')) gaps.push('interrupteur non câblé');
    if (!text.includes('target="_blank"') || !text.includes('rel="noopener noreferrer"')) {
      gaps.push('lien cartographique non sécurisé');
    }
    if (/\bLatitude\s*:/.test(text) || /\bLongitude\s*:/.test(text)) {
      gaps.push('coordonnées brutes conservées');
    }
    if (text.includes('title="Cliquer pour changer le statut"')) {
      gaps.push('ancien badge cliquable conservé');
    }
    if (/\bbtn-sm\b/.test(text)) {
      gaps.push('bouton au texte réduit (btn-sm) désaccordé de l’icône');
    }
    return gaps;
  };

  // Contrôle négatif : une carte portant encore le badge cliquable et les coordonnées brutes doit
  // être refusée, même lorsque tous les autres jetons sont présents.
  const bogus =
    'Périmètre autorisé Voir sur la carte formatCoordinate mapUrl toggle toggle-success type="checkbox" '
    + '@change="toggleStatus(loc)" target="_blank" rel="noopener noreferrer" '
    + 'title="Cliquer pour changer le statut" <span>Latitude :</span><span>Longitude :</span>';
  if (cardGaps(bogus).length === 0) {
    console.error('FAILURE G58: le détecteur de carte de site est aveugle, oracle invalide');
    return false;
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'LocationsView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G58: LocationsView.vue introuvable');
    return false;
  }
  const gaps = cardGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G58: les cartes de sites restent peu lisibles -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G58 passed: site cards show a readable perimeter, position and map link');
  return true;
}

/**
 * G60 : La logique d'affichage actif/inactif est cohérente de bout en bout. Côté vue, les
 * filtres annoncent leurs comptes et chaque état vide décrit sa cause avec l'action utile.
 * Côté données, un prédicat unique `isLocationActive` remplace les comparaisons dispersées
 * du gestionnaire et des deux pointages.
 */
export function checkLocationsFilters() {
  const displayGaps = (text) => {
    const gaps = [];
    for (const token of ['locationCounts', 'emptyState', 'runEmptyAction']) {
      if (!text.includes(token)) gaps.push(`vue sans ${token}`);
    }
    if (!/locationCounts\.all/.test(text) || !/locationCounts\.active/.test(text) || !/locationCounts\.inactive/.test(text)) {
      gaps.push('filtres sans comptes');
    }
    for (const message of ['Aucun site enregistré', 'Aucun résultat', 'Aucun site actif', 'Aucun site inactif']) {
      if (!text.includes(message)) gaps.push(`état vide absent : ${message}`);
    }
    if (/\bloc\.is_active\b/.test(text)) gaps.push('comparaison is_active locale subsistante');
    return gaps;
  };

  // Contrôle négatif : l'ancien état vide unique et l'absence de comptes doivent être refusés.
  const bogus = '<div v-if="filteredLocations.length === 0">Aucun site trouvé — Créez votre premier site.</div>';
  if (displayGaps(bogus).length === 0) {
    console.error('FAILURE G60: le détecteur d’état vide est aveugle, oracle invalide');
    return false;
  }

  const viewPath = path.join(SRC_DIR, 'views', 'manager', 'LocationsView.vue');
  if (!fs.existsSync(viewPath)) {
    console.error('FAILURE G60: LocationsView.vue introuvable');
    return false;
  }
  const viewContent = fs.readFileSync(viewPath, 'utf8');
  const gaps = displayGaps(viewContent);

  const composable = readScopeFile('src/composables/useLocations.js');
  if (composable === null || !/export const isLocationActive/.test(composable)) {
    console.error('FAILURE G60: le prédicat partagé isLocationActive n’est plus exporté');
    return false;
  }
  if (!viewContent.includes('isLocationActive')) gaps.push('la vue n’utilise pas le prédicat partagé');

  for (const [dir, name] of [
    ['employee', 'CheckInView.vue'],
    ['employee', 'CheckOutView.vue'],
    ['manager', 'DashboardView.vue'],
  ]) {
    const file = path.join(SRC_DIR, 'views', dir, name);
    if (!fs.existsSync(file)) {
      console.error(`FAILURE G60: ${name} introuvable`);
      return false;
    }
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('isLocationActive')) gaps.push(`${name} ne consomme pas le prédicat partagé`);
    if (/is_active\s*===\s*(true|1|'true')/.test(content)) gaps.push(`${name} conserve une comparaison locale`);
  }

  if (gaps.length > 0) {
    console.error(`FAILURE G60: la logique actif/inactif reste incohérente -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G60 passed: active/inactive display and data predicate are consistent end to end');
  return true;
}

/**
 * G63 : L'écran Contrôle des Présences partage la grammaire de l'écran Lieux & Sites : en-tête à
 * pastille d'icône, recherche intégrée, filtres à comptes, cartes responsives et états vides
 * distincts. Le tableau brut et le sélecteur natif qui désaccordaient l'écran disparaissent.
 */
export function checkPresencesUi() {
  const uiGaps = (text) => {
    const gaps = [];
    // En-tête unifié : soit inline en h1, soit porté par le composant partagé ManagerPageHeader,
    // dont la grammaire (h1, pastille) est vérifiée séparément.
    const sharedHeader = text.includes('ManagerPageHeader');
    if (!sharedHeader && (!/<h1[^>]*>/.test(text) || /<h2[^>]*>/.test(text))) gaps.push('en-tête non unifié en h1');
    if (!sharedHeader && (!text.includes('bg-primary/10') || !text.includes('border-primary/20'))) gaps.push('pastille d’en-tête absente');
    // Recherche intégrée, pleine largeur et nommée, placeholder allégé de sa consigne chargée (C6)
    if (!/class="input input-bordered flex w-full/.test(text)) gaps.push('recherche non intégrée');
    if (!text.includes('placeholder="Rechercher un nom, un email ou un site"')) gaps.push('placeholder de recherche allégé absent');
    // Filtres à comptes dans une barre join, le statut absent compris (B4)
    for (const token of ['statusCounts.all', 'statusCounts.present', 'statusCounts.late', 'statusCounts.completed', 'statusCounts.absent']) {
      if (!text.includes(token)) gaps.push(`filtre sans compte : ${token}`);
    }
    if (!/\bjoin\b/.test(text)) gaps.push('filtres sans barre join');
    // États vides distincts et action utile
    for (const message of ['Aucun pointage', 'Aucun résultat', 'Aucun pointage pour ce filtre']) {
      if (!text.includes(message)) gaps.push(`état vide absent : ${message}`);
    }
    if (!text.includes('runEmptyAction')) gaps.push('action d’état vide absente');
    // L'état vide n'en propose plus de doublon ni d'action primaire (C1)
    if ((text.match(/Actualiser/g) || []).length > 1) gaps.push('actualisation en double');
    if (/action: 'refresh'/.test(text)) gaps.push('rafraîchissement proposé par l’état vide');
    if (!/v-if="emptyState\.action"/.test(text)) gaps.push('action d’état vide non conditionnée');
    // L'état vide porte une icône de situation, distincte du tracé du titre (C2)
    if (!text.includes("emptyState.icon === 'calendar'") || !text.includes("emptyState.icon === 'search'")) {
      gaps.push('icône de situation d’état vide absente');
    }
    // La journée close se nomme « Terminé » partout (B1), le total se nomme « Pointages » (B3)
    if (!text.includes('Journées terminées')) gaps.push('journée close mal dénommée dans le bandeau');
    if (/Départs validés|Journées clôturées/.test(text)) gaps.push('journée close mal nommée');
    if (/Total pointés/.test(text)) gaps.push('total mal nommé');
    // Les KPI décrivent les temps, leurs sous-titres portent la nuance (B2)
    for (const nuance of ['Arrivées ponctuelles, journées closes comprises', 'Arrivées tardives, journées closes comprises', 'Avec départ enregistré']) {
      if (!text.includes(nuance)) gaps.push(`sous-titre KPI absent : ${nuance}`);
    }
    // Un seul segment actif dominant : la période en primary, le statut atténué (C5)
    if (!text.includes("'btn-primary': filterPeriod")) gaps.push('segment de période non dominant');
    if (!text.includes("'btn-active font-semibold': filterStatus")) gaps.push('segment de statut non atténué');
    // Rigueur typographique : aucune taille arbitraire (C4)
    if (/text-\[11px\]/.test(text)) gaps.push('taille de police arbitraire');
    // Cartes/tableau : identité, temps et précision GPS portés par la vue
    for (const token of ['initials(', 'accuracyBadge(', 'StatusBadge']) {
      if (!text.includes(token)) gaps.push(`ligne sans ${token}`);
    }
    // Retrait du sélecteur natif, des actions rétrécies et du filtrage serveur par statut
    if (/id="f-status"/.test(text)) gaps.push('sélecteur natif conservé');
    if (/\bbtn-sm\b/.test(text)) gaps.push('action rétrécie (btn-sm) désaccordée de l’icône');
    // Les compteurs des filtres exigent la période complète : le statut se filtre côté client
    if (/\.eq\('status'/.test(text) || /\.in\('status'/.test(text)) gaps.push('filtrage de statut appliqué au serveur, compteurs faussés');
    return gaps;
  };

  // Contrôle négatif : l'ancien écran (tableau + select natif + h2) et son vocabulaire divergent doivent être refusés.
  const bogus =
    '<h2>Contrôle des Présences</h2><select id="f-status"></select><table></table>'
    + '<span>Départs validés</span><span>Journées clôturées</span><span>Total pointés</span>'
    + '<span class="text-[11px]">x</span><span>Actualiser</span><span>Actualiser</span>';
  const bogusGaps = uiGaps(bogus);
  if (bogusGaps.length === 0) {
    console.error('FAILURE G63: le détecteur d’interface présences est aveugle, oracle invalide');
    return false;
  }
  for (const expected of ['journée close mal nommée', 'total mal nommé', 'actualisation en double', 'taille de police arbitraire']) {
    if (!bogusGaps.includes(expected)) {
      console.error(`FAILURE G63: contrôle négatif incomplet, ${expected} non détecté`);
      return false;
    }
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'PresencesView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G63: PresencesView.vue introuvable');
    return false;
  }
  const gaps = uiGaps(fs.readFileSync(file, 'utf8'));

  // La grammaire d'en-tête vit désormais dans le composant partagé : il doit porter h1 et pastille.
  const headerFile = path.join(SRC_DIR, 'components', 'manager', 'ManagerPageHeader.vue');
  if (!fs.existsSync(headerFile)) {
    console.error('FAILURE G63: ManagerPageHeader.vue introuvable');
    return false;
  }
  const headerContent = fs.readFileSync(headerFile, 'utf8');
  if (!/<h1[^>]*>/.test(headerContent)) gaps.push('en-tête partagé sans h1');
  if (!headerContent.includes('bg-primary/10') || !headerContent.includes('border-primary/20')) {
    gaps.push('en-tête partagé sans pastille');
  }

  if (gaps.length > 0) {
    console.error(`FAILURE G63: l’écran présences reste incohérent -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G63 passed: presences screen shares the locations grammar');
  return true;
}

/**
 * G64 : Le filtre de date propose d'abord des presets (jour, semaine, mois) puis une plage
 * personnalisée. La plage effective est calculée une fois et appliquée à l'identique au cache
 * local (comparaison de chaînes 'YYYY-MM-DD') et à la requête distante (gte/lte), avec un
 * rechargement piloté par la seule plage.
 */
export function checkPresencesPeriod() {
  const periodGaps = (text) => {
    const gaps = [];
    for (const preset of ["'day'", "'week'", "'month'", "'custom'"]) {
      if (!text.includes(preset)) gaps.push(`preset de période absent : ${preset}`);
    }
    for (const token of ['dateRange', 'customStart', 'customEnd', 'periodLabel']) {
      if (!text.includes(token)) gaps.push(`période sans ${token}`);
    }
    // La plage borne une lecture locale réactive : plus de requête distante, plus de rechargement manuel
    if (!text.includes('useLiveQuery')) gaps.push('période sans lecture réactive Dexie');
    if (!text.includes(".where('work_date')")) gaps.push('plage sans index work_date');
    if (!/\.between\(start, end, true, true\)/.test(text)) gaps.push('plage non appliquée au filtre local');
    if (!text.includes('`${dateRange.value.start}|${dateRange.value.end}`')) {
      gaps.push('plage non déclarée comme dépendance réactive');
    }
    if (/from\('presences'\)/.test(text)) gaps.push('lecture réseau conservée dans la vue');
    // A1 : chaque mode expose son ancre, la semaine et le mois se parcourent par flèches
    if (!text.includes('shiftAnchor')) gaps.push('ancre non navigable');
    for (const label of ['Semaine précédente', 'Semaine suivante', 'Mois précédent', 'Mois suivant']) {
      if (!text.includes(`aria-label="${label}"`)) gaps.push(`flèche absente : ${label}`);
    }
    // A2 et A4 : libellé au-dessus du champ, sans deux-points
    for (const colon of ['Période :', 'Statut :', 'Date :', 'Du :', 'Au :']) {
      if (text.includes(colon)) gaps.push(`deux-points conservé : ${colon}`);
    }
    for (const legend of ['>Période<', '>Statut<', '>Date<', '>Semaine<', '>Mois<', '>Du<', '>Au<']) {
      if (!text.includes(legend)) gaps.push(`libellé manquant : ${legend}`);
    }
    // A3 : le groupe Statut ne flotte plus au bas de la colonne période
    if (text.includes('sm:self-end')) gaps.push('statut encore flottant');
    // C3 : libellé de période et colonne Date passés au format long
    if (!text.includes('formatWorkDate(start, { long: true })')) gaps.push('libellé de période non allongé');
    if (!text.includes('formatWorkDate(p.work_date, { long: true })')) gaps.push('colonne date non allongée');
    // A5 : les champs Du et Au occupent la largeur de la rangée, comme la date du mode jour
    if ((text.match(/fieldset sm:flex-1 min-w-0/g) || []).length !== 2) {
      gaps.push('champs Du/Au non étendus sur la largeur');
    }
    return gaps;
  };

  // Contrôle négatif : l'ancien filtre à date unique (eq + watch(filterDate)) et son gabarit
  // à deux-points doivent être refusés.
  const bogus = "const filterDate = ref(getLocalDateString()); watch(filterDate, loadPresences); supabase.from('presences').select('*').eq('work_date', filterDate.value); Période : Statut :";
  const bogusGaps = periodGaps(bogus);
  if (bogusGaps.length === 0) {
    console.error('FAILURE G64: le détecteur de période est aveugle, oracle invalide');
    return false;
  }
  for (const expected of ['ancre non navigable', 'deux-points conservé : Période :', 'champs Du/Au non étendus sur la largeur', 'lecture réseau conservée dans la vue']) {
    if (!bogusGaps.includes(expected)) {
      console.error(`FAILURE G64: contrôle négatif incomplet, ${expected} non détecté`);
      return false;
    }
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'PresencesView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G64: PresencesView.vue introuvable');
    return false;
  }
  const gaps = periodGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G64: le filtre de période reste incomplet -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G64 passed: presence period filter offers presets and a custom range');
  return true;
}

/**
 * G65 : Les pointages sont présentés dans un vrai tableau balisé (`table`/`thead`/`tbody`),
 * défilable horizontalement, avec les colonnes d'audit — collaborateur, site, date, arrivée,
 * départ, durée, statut, précision GPS, actions — au lieu d'une grille de cartes.
 */
export function checkPresencesTable() {
  const tableGaps = (text) => {
    const gaps = [];
    for (const token of ['<table', '<thead', '<tbody', 'overflow-x-auto', 'table table-sm']) {
      if (!text.includes(token)) gaps.push(`tableau sans ${token}`);
    }
    for (const column of ['Collaborateur', 'Site', 'Date', 'Arrivée', 'Départ', 'Durée', 'Statut', 'Précision GPS']) {
      if (!text.includes(column)) gaps.push(`colonne absente : ${column}`);
    }
    for (const token of ['initials(', 'formatWorkDate(', 'accuracyBadge(', 'StatusBadge', 'formatSessionDuration(']) {
      if (!text.includes(token)) gaps.push(`cellule sans ${token}`);
    }
    if (/grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3/.test(text)) gaps.push('grille de cartes conservée');
    if (/\bbtn-sm\b/.test(text)) gaps.push('action rétrécie (btn-sm) désaccordée de l’icône');
    // D1 : fiches synthétiques sous 640px, tableau d'audit à partir de 640px
    if (!text.includes('sm:hidden divide-y divide-base-300')) gaps.push('fiches mobiles absentes');
    if (!text.includes('hidden sm:block overflow-x-auto')) gaps.push('tableau non réservé au-delà de 640px');
    // D2 : les segments de filtre défilent horizontalement sur mobile, chaque cible restant fixe
    if (!text.includes('join w-full overflow-x-auto')) gaps.push('segments non défilables sur mobile');
    if (!/shrink-0/.test(text)) gaps.push('segments sans cible fixe');
    return gaps;
  };

  // Contrôle négatif : l'ancienne présentation en cartes, sans tableau balisé ni fiches mobiles,
  // doit être refusée.
  const bogus =
    '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">'
    + '<div class="card">Collaborateur Arrivée Départ Durée Statut</div></div>';
  const bogusGaps = tableGaps(bogus);
  if (bogusGaps.length === 0) {
    console.error('FAILURE G65: le détecteur de tableau présences est aveugle, oracle invalide');
    return false;
  }
  for (const expected of ['grille de cartes conservée', 'fiches mobiles absentes']) {
    if (!bogusGaps.includes(expected)) {
      console.error(`FAILURE G65: contrôle négatif incomplet, ${expected} non détecté`);
      return false;
    }
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'PresencesView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G65: PresencesView.vue introuvable');
    return false;
  }
  const gaps = tableGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G65: la présentation tabulaire reste incomplète -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G65 passed: presences render as an audit table');
  return true;
}

/**
 * G66 : Chaque colonne d'audit du tableau se trie par un clic d'en-tête, en alternant croissant
 * et décroissant, avec une icône orientée et `aria-sort` pour les lecteurs d'écran. Les colonnes
 * Arrivée, Départ, Durée et Précision GPS sont triables ; les valeurs absentes finissent en bas.
 */
export function checkPresencesSort() {
  const sortGaps = (text) => {
    const gaps = [];
    for (const token of ['SORTABLE_COLUMNS', 'sortKey', 'sortDir', 'sortedPresences', 'toggleSort', 'aria-sort', 'sortIconPath']) {
      if (!text.includes(token)) gaps.push(`tri sans ${token}`);
    }
    if (!/v-for="col in SORTABLE_COLUMNS"/.test(text)) gaps.push('en-têtes non itérés sur les colonnes triables');
    if (!/v-for="p in sortedPresences"/.test(text)) gaps.push('corps non itéré sur la liste triée');
    for (const column of ["'check_in'", "'check_out'", "'duration'", "'gps'"]) {
      if (!text.includes(column)) gaps.push(`colonne triable absente : ${column}`);
    }
    return gaps;
  };

  // Contrôle négatif : un tableau figé, sans tri ni en-têtes cliquables, doit être refusé.
  const bogus = '<table><thead><tr><th>Arrivée</th></tr></thead><tbody><tr v-for="p in filteredPresences"><td>x</td></tr></tbody></table>';
  if (sortGaps(bogus).length === 0) {
    console.error('FAILURE G66: le détecteur de tri présences est aveugle, oracle invalide');
    return false;
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'PresencesView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G66: PresencesView.vue introuvable');
    return false;
  }
  const gaps = sortGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G66: le tri du tableau reste incomplet -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G66 passed: presence table headers sort both ways');
  return true;
}

/**
 * G72 : Le Contrôle des Présences lit Dexie et rien d'autre. La plage borne une lecture réactive
 * indexée, les profils et les sites sont joints localement, et la correction passe par l'outbox.
 */
export function checkPresencesLocalFirst() {
  const localGaps = (text) => {
    const gaps = [];
    if (/from\('presences'\)/.test(text)) gaps.push('lecture réseau conservée');
    if (!text.includes('useLiveQuery')) gaps.push('aucune lecture réactive Dexie');
    if (!text.includes(".where('work_date')")) gaps.push('plage sans index work_date');
    if (!/\.between\(start, end, true, true\)/.test(text)) gaps.push('plage non bornée');
    if (!text.includes('db.profiles.toArray()')) gaps.push('jointure des profils absente');
    if (!text.includes('db.locations.toArray()')) gaps.push('jointure des sites absente');
    if (!text.includes('syncNow(user?.id)')) gaps.push('actualisation non pilotée par l’engine');
    if (!text.includes('db.presences.update(presenceId, { status: newStatus')) {
      gaps.push('correction locale absente');
    }
    return gaps;
  };

  // Contrôle négatif : une vue qui interroge Supabase et garde un chargement impératif doit être refusée.
  const bogus =
    "const presencesList = ref([])\nasync function loadPresences() {\n  const { data } = await supabase.from('presences').select('*')\n  presencesList.value = data\n}";
  if (localGaps(bogus).length === 0) {
    console.error('FAILURE G72: le détecteur local-first présences est aveugle, oracle invalide');
    return false;
  }

  const file = path.join(SRC_DIR, 'views', 'manager', 'PresencesView.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G72: PresencesView.vue introuvable');
    return false;
  }
  const gaps = localGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G72: l’écran présences n’est pas local-first -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G72 passed: presences screen reads Dexie and only Dexie');
  return true;
}

/**
 * G73 : Le périmètre du pull suit le rôle lu dans le profil local, et profils comme équipes sont
 * rapatriés : sans eux, toute jointure locale rend un nom vide.
 */
export function checkSyncScope() {
  const scopeGaps = (text) => {
    const gaps = [];
    if (!text.includes("from('profiles')")) gaps.push('profils absents du pull');
    if (!text.includes("from('teams')")) gaps.push('équipes absentes du pull');
    if (!text.includes('isSupervisor')) gaps.push('périmètre indifférent au rôle');
    if (!text.includes('db.profiles.get(userId)')) gaps.push('rôle non lu dans le profil local');
    if (!/===\s*'manager'/.test(text)) gaps.push('rôle gestionnaire non reconnu');
    if (!/===\s*'admin'/.test(text)) gaps.push('rôle administrateur non reconnu');
    if (!/presenceQuery = presenceQuery\.eq\('user_id', userId\)/.test(text)) {
      gaps.push('repli employé absent sur les présences');
    }
    if (!/availabilityQuery = availabilityQuery\.eq\('user_id', userId\)/.test(text)) {
      gaps.push('repli employé absent sur les disponibilités');
    }
    return gaps;
  };

  // Contrôle négatif : l'ancien pull, cadenassé sur l'utilisateur et sans profils ni équipes.
  const bogus =
    "const { data } = await supabase.from('presences').select('*').eq('user_id', userId).gt('updated_at', cursor)";
  if (scopeGaps(bogus).length === 0) {
    console.error('FAILURE G73: le détecteur de périmètre de pull est aveugle, oracle invalide');
    return false;
  }

  const syncContent = readScopeFile('src/composables/useSyncEngine.js');
  if (!syncContent) {
    console.error('FAILURE G73: useSyncEngine.js introuvable');
    return false;
  }
  const gaps = scopeGaps(syncContent);
  if (gaps.length > 0) {
    console.error(`FAILURE G73: le pull reste incomplet -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G73 passed: the pull scope follows the role and brings profiles and teams');
  return true;
}

/**
 * G74 : `useLiveQuery` accepte une dépendance réactive et réabonne la requête quand elle change,
 * sans import mort ni souscription unique figée.
 */
export function checkLiveQueryDeps() {
  const depsGaps = (text) => {
    const gaps = [];
    if (!text.includes('dependsOn')) gaps.push('dépendance réactive non supportée');
    if (!/watch\(dependsOn,/.test(text)) gaps.push('dépendance non observée');
    if (!text.includes('const subscribe = ()')) gaps.push('réabonnement non factorisé');
    if (!/cleanup\(\)\s*\n\s*observableSub = Dexie\.liveQuery/.test(text)) {
      gaps.push('ancienne souscription non libérée avant réabonnement');
    }
    if (/\bisRef\b|\bwatchEffect\b/.test(text)) gaps.push('import mort conservé');
    return gaps;
  };

  // Contrôle négatif : l'ancien helper, à souscription unique et imports morts.
  const bogus =
    "import { shallowRef, onScopeDispose, isRef, watchEffect } from 'vue'\n"
    + 'export function useLiveQuery(querier, initialValue) { const o = Dexie.liveQuery(querier); o.subscribe({ next: v => {} }) }';
  if (depsGaps(bogus).length === 0) {
    console.error('FAILURE G74: le détecteur de dépendance liveQuery est aveugle, oracle invalide');
    return false;
  }

  const file = path.join(SRC_DIR, 'lib', 'db.js');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G74: db.js introuvable');
    return false;
  }
  const gaps = depsGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G74: le helper liveQuery reste incomplet -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G74 passed: useLiveQuery resubscribes on an explicit reactive dependency');
  return true;
}

/**
 * G75 : Les trois autres vues gestionnaire lisent Dexie et ne montent plus de requête réseau pour
 * les données qu'elles affichent.
 */
export function checkManagerDexie() {
  const dexieGaps = (text) => {
    const gaps = [];
    for (const table of ['presences', 'availabilities', 'profiles', 'teams']) {
      if (text.includes(`from('${table}')`)) gaps.push(`${table} lu au réseau`);
    }
    if (!text.includes("from '../../lib/db'")) gaps.push('db non importé');
    return gaps;
  };

  // Contrôle négatif : une vue gestionnaire branchée sur Supabase doit être refusée.
  const bogus =
    "import { supabase } from '../../lib/supabase'\nconst { data } = await supabase.from('presences').select('*')";
  if (dexieGaps(bogus).length === 0) {
    console.error('FAILURE G75: le détecteur Dexie des vues gestionnaire est aveugle, oracle invalide');
    return false;
  }

  const gaps = [];
  for (const name of ['DashboardView.vue', 'AvailabilitiesView.vue', 'ExportView.vue']) {
    const file = path.join(SRC_DIR, 'views', 'manager', name);
    if (!fs.existsSync(file)) {
      console.error(`FAILURE G75: ${name} introuvable`);
      return false;
    }
    for (const gap of dexieGaps(fs.readFileSync(file, 'utf8'))) gaps.push(`${name} : ${gap}`);
  }

  if (gaps.length > 0) {
    console.error(`FAILURE G75: des vues gestionnaire restent branchées au réseau -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G75 passed: the remaining manager views read Dexie only');
  return true;
}

/* ---------------------------------------------------------------------------
   Lot « Refonte UI/UX de l'espace gestionnaire »
   --------------------------------------------------------------------------- */


const MANAGER_VIEW_FILES = [
  'DashboardView.vue',
  'EmployeesView.vue',
  'TeamsView.vue',
  'AvailabilitiesView.vue',
  'ExportView.vue',
  'PresencesView.vue',
  'LocationsView.vue',
];

/**
 * G88 : Tous les écrans gestionnaire partagent la grammaire : en-tête porté par ManagerPageHeader,
 * aucun titre h2 résiduel, aucune action input-sm/select-sm/btn-sm, aucune taille de police
 * arbitraire. Les trois composants partagés existent et portent leur contrat.
 */
export function checkManagerGrammar() {
  const grammarGaps = (text) => {
    const gaps = [];
    if (!text.includes('ManagerPageHeader')) gaps.push('en-tête partagé absent');
    if (/<h2[^>]*>/.test(text)) gaps.push('titre h2 conservé');
    if (/\bbtn-sm\b/.test(text)) gaps.push('action rétrécie (btn-sm)');
    if (/\binput-sm\b|\bselect-sm\b/.test(text)) gaps.push('champ rétréci (input-sm/select-sm)');
    if (/text-\[\d+px\]/.test(text)) gaps.push('taille de police arbitraire');
    return gaps;
  };

  // Contrôle négatif : un écran à titre h2, action rétrécie et police arbitraire doit être refusé.
  const bogus =
    '<h2>Titre</h2><button class="btn btn-sm">x</button><input class="input input-sm" /><span class="text-[11px]"></span>';
  const bogusGaps = grammarGaps(bogus);
  if (bogusGaps.length === 0) {
    console.error('FAILURE G88: le détecteur de grammaire gestionnaire est aveugle, oracle invalide');
    return false;
  }
  for (const expected of ['titre h2 conservé', 'action rétrécie (btn-sm)', 'champ rétréci (input-sm/select-sm)', 'taille de police arbitraire']) {
    if (!bogusGaps.includes(expected)) {
      console.error(`FAILURE G88: contrôle négatif incomplet, ${expected} non détecté`);
      return false;
    }
  }

  const gaps = [];
  for (const name of MANAGER_VIEW_FILES) {
    const file = path.join(SRC_DIR, 'views', 'manager', name);
    if (!fs.existsSync(file)) {
      console.error(`FAILURE G88: ${name} introuvable`);
      return false;
    }
    for (const gap of grammarGaps(fs.readFileSync(file, 'utf8'))) gaps.push(`${name} : ${gap}`);
  }

  const headerFile = path.join(SRC_DIR, 'components', 'manager', 'ManagerPageHeader.vue');
  if (!fs.existsSync(headerFile)) {
    console.error('FAILURE G88: ManagerPageHeader.vue introuvable');
    return false;
  }
  const header = fs.readFileSync(headerFile, 'utf8');
  if (!/<h1[^>]*>/.test(header) || !header.includes('bg-primary/10') || !header.includes('border-primary/20')) {
    gaps.push('ManagerPageHeader.vue : grammaire d\u2019en-tête incomplète');
  }
  for (const component of ['ManagerKpiCard.vue', 'ManagerEmptyState.vue']) {
    if (!fs.existsSync(path.join(SRC_DIR, 'components', 'manager', component))) {
      gaps.push(`${component} introuvable`);
    }
  }

  if (gaps.length > 0) {
    console.error(`FAILURE G88: des écrans gestionnaire divergent -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G88 passed: every manager screen shares one grammar');
  return true;
}

/**
 * G89 : Les écrans de données présentent des fiches sous 640px et un tableau au delà ; les filtres
 * défilent horizontalement sur mobile ; la grille d'équipes adopte 2 puis 3 colonnes.
 */
export function checkManagerResponsive() {
  const responsiveGaps = (text) => {
    const gaps = [];
    for (const token of ['sm:hidden', 'hidden sm:block']) {
      if (!text.includes(token)) gaps.push(`bascule fiches/tableau absente : ${token}`);
    }
    return gaps;
  };

  // Contrôle négatif : un écran sans bascule mobile doit être refusé.
  const bogus = '<table></table>';
  if (responsiveGaps(bogus).length === 0) {
    console.error('FAILURE G89: le détecteur responsive gestionnaire est aveugle, oracle invalide');
    return false;
  }

  const gaps = [];
  for (const name of ['DashboardView.vue', 'EmployeesView.vue', 'AvailabilitiesView.vue']) {
    const file = path.join(SRC_DIR, 'views', 'manager', name);
    if (!fs.existsSync(file)) {
      console.error(`FAILURE G89: ${name} introuvable`);
      return false;
    }
    const text = fs.readFileSync(file, 'utf8');
    for (const gap of responsiveGaps(text)) gaps.push(`${name} : ${gap}`);
    if (!text.includes('overflow-x-auto')) gaps.push(`${name} : filtres ou tableau sans défilement horizontal`);
  }

  const teamsFile = path.join(SRC_DIR, 'views', 'manager', 'TeamsView.vue');
  const teams = fs.existsSync(teamsFile) ? fs.readFileSync(teamsFile, 'utf8') : '';
  if (!teams.includes('md:grid-cols-2 lg:grid-cols-3')) gaps.push('TeamsView.vue : grille responsive absente');

  if (gaps.length > 0) {
    console.error(`FAILURE G89: la responsivité gestionnaire est incomplète -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G89 passed: manager screens present cards below 640px and tables above');
  return true;
}

/**
 * G92 : Chaque entrée de navigation gestionnaire déclare une icône non vide, et la passerelle
 * vers l'espace personnel porte son propre tracé. Verrouille le défaut « icône absente ».
 */
export function checkManagerNavIcons() {
  const navGaps = (text) => {
    const gaps = [];
    const entries = [...text.matchAll(/path: '\/manager[^']*',[\s\S]*?icon: createIcon\(\[([\s\S]*?)\]\),/g)];
    if (entries.length < 6) gaps.push(`entrées de navigation incomplètes (${entries.length})`);
    entries.forEach((entry, index) => {
      const body = entry[1].trim();
      if (!body.includes('[')) gaps.push(`entrée ${index + 1} sans tracé`);
    });
    if (!/handleNav\('\/employee'\)[\s\S]*?<svg/.test(text)) gaps.push('passerelle sans icône');
    return gaps;
  };

  // Contrôle négatif : une entrée sans createIcon doit être refusée.
  const bogus = "path: '/manager/x', label: 'X', icon: null,";
  if (navGaps(bogus).length === 0) {
    console.error('FAILURE G92: le détecteur d\u2019icônes de navigation est aveugle, oracle invalide');
    return false;
  }

  const file = path.join(SRC_DIR, 'layouts', 'ManagerLayout.vue');
  if (!fs.existsSync(file)) {
    console.error('FAILURE G92: ManagerLayout.vue introuvable');
    return false;
  }
  const gaps = navGaps(fs.readFileSync(file, 'utf8'));
  if (gaps.length > 0) {
    console.error(`FAILURE G92: des entrées de navigation sont sans icône -> ${gaps.join(', ')}`);
    return false;
  }
  console.log('G92 passed: every manager nav entry declares an icon');
  return true;
}

/**
 * G93 : Passe de finition gestionnaire. Icônes de rail à 22px, focus visible sur les entrées de
 * navigation des deux espaces, bandeau gestionnaire réduit à la marque, titre « Sites » seul,
 * matrice de disponibilités triable par nom avec états vides distincts et grille KPI responsive.
 */
export function checkManagerFinish() {
  const read = (relative) => {
    const file = path.join(SRC_DIR, relative);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };
  const missing = (text, tokens) => tokens.filter((token) => !text.includes(token));

  // Contrôle négatif : le détecteur de jetons doit refuser un texte vide.
  if (missing('', ['grid-cols-2 sm:grid-cols-3']).length === 0) {
    console.error('FAILURE G93: le détecteur de finition est aveugle, oracle invalide');
    return false;
  }

  const gaps = [];

  const css = read('style.css');
  if (css === null) {
    console.error('FAILURE G93: style.css introuvable');
    return false;
  }
  if (!/\.drawer-rail \.rail-entry > svg[\s\S]*?width:\s*1\.375rem/.test(css)) {
    gaps.push('icônes de rail non portées à 22px');
  }

  for (const layout of ['layouts/ManagerLayout.vue', 'layouts/EmployeeLayout.vue']) {
    const text = read(layout);
    if (text === null) {
      console.error(`FAILURE G93: ${layout} introuvable`);
      return false;
    }
    const focused = (text.match(/rail-entry[^"]*focus-visible:outline-2 focus-visible:outline-primary/g) || []).length;
    if (focused < 2) gaps.push(`${layout} : focus des entrées de navigation incomplet`);
  }

  const manager = read('layouts/ManagerLayout.vue');
  if (!manager.includes('barTitle')) gaps.push('titre de bandeau gestionnaire absent');
  const managerHeader = manager.match(/<header[\s\S]*?<\/header>/);
  if (!managerHeader || !/aria-label="Retour"/.test(managerHeader[0])) gaps.push('commande de retour absente du bandeau gestionnaire');

  const employee = read('layouts/EmployeeLayout.vue');
  if (!employee.includes('barTitle')) gaps.push('titre de bandeau employé absent');

  const locations = read('views/manager/LocationsView.vue');
  if (locations.includes('& Lieux')) gaps.push('« & Lieux » conservé');
  if (!locations.includes('title="Gestion des Sites"')) gaps.push('titre de page « Gestion des Sites » absent');

  const availabilities = read('views/manager/AvailabilitiesView.vue');
  gaps.push(...missing(availabilities, [
    'grid-cols-2 sm:grid-cols-3',
    'sortedEmployees',
    'aria-sort',
    'toggleSort',
    'emptyState',
    'Aucun collaborateur pour cette équipe',
    'Aucun résultat',
  ]).map((token) => `disponibilités sans ${token}`));
  if (availabilities.includes("'—'")) gaps.push('taux de tenue rendu par un tiret isolé');

  if (gaps.length > 0) {
    console.error(`FAILURE G93: la passe de finition est incomplète -> ${[...new Set(gaps)].join(', ')}`);
    return false;
  }
  console.log('G93 passed: manager finishing pass applied');
  return true;
}

/**
 * G94 : Passe de finition employé. Aucune taille de police arbitraire, aucune date capitalisée à
 * tort, vocabulaire unifié, sélecteur de lieu de travail à 44px, verrouillage onepage qui cède
 * au défilement sur hauteur courte, bandeau nommant l'espace et le module.
 */
