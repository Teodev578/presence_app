import assert from 'node:assert';
import {
  getLocalDateString,
  calculateWorkDuration,
  calculateElapsedTime,
  formatTime,
} from '../src/lib/dateUtils.js';

console.log('🧪 Lancement des tests de robustesse des présences et des dates...');

// 1. Validation de getLocalDateString
const todayStr = getLocalDateString();
assert.match(todayStr, /^\d{4}-\d{2}-\d{2}$/);

const testDate = new Date(2026, 8, 23, 23, 45, 0); // 23 septembre 2026 23:45
assert.strictEqual(getLocalDateString(testDate), '2026-09-23');

// Vérification contre les décalages UTC : une date à 23h30 locale doit rester sur la date locale
assert.strictEqual(getLocalDateString(new Date('2026-09-23T23:30:00')), '2026-09-23');
console.log('✅ getLocalDateString validé (sécurité fuseau local)');

// 2. Validation de calculateWorkDuration
const d1 = calculateWorkDuration('2026-09-23T08:30:00.000Z', '2026-09-23T17:15:00.000Z');
assert.strictEqual(d1, '8h 45min');

const d2 = calculateWorkDuration('2026-09-23T09:00:00.000Z', '2026-09-23T09:45:00.000Z');
assert.strictEqual(d2, '45 min');

const d3 = calculateWorkDuration('2026-09-23T08:00:00.000Z', '2026-09-23T16:00:00.000Z');
assert.strictEqual(d3, '8 h');

const dInvalid = calculateWorkDuration('2026-09-23T18:00:00.000Z', '2026-09-23T08:00:00.000Z');
assert.strictEqual(dInvalid, null);
console.log('✅ calculateWorkDuration validé');

// 3. Validation de calculateElapsedTime
const start = new Date(Date.now() - 3600000 * 3.5); // il y a 3h30
const elapsed = calculateElapsedTime(start.toISOString());
assert.strictEqual(elapsed, '3h 30min');
console.log('✅ calculateElapsedTime validé');

// 4. Validation de formatTime
const timeStr = formatTime('2026-09-23T08:30:00');
assert.match(timeStr, /^\d{2}:\d{2}$/);
assert.strictEqual(formatTime(null), '--:--');
console.log('✅ formatTime validé');

console.log('🎉 Tous les tests de robustesse date & présence sont validés avec succès !');
