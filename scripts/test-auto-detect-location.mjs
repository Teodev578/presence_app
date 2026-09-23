import assert from 'node:assert';
import {
  calculateHaversineDistance,
  formatDistance,
  findMatchingLocation,
} from '../src/composables/useGeolocation.js';

console.log('🧪 Lancement des tests de validation pour la détection automatique de sites...');

// 1. Test du formateur de distance
assert.strictEqual(formatDistance(0), '0 m');
assert.strictEqual(formatDistance(45), '45 m');
assert.strictEqual(formatDistance(850), '850 m');
assert.strictEqual(formatDistance(1200), '1.2 km');
assert.strictEqual(formatDistance(4747236), '4747 km');
assert.strictEqual(formatDistance(null), '--');
console.log('✅ formatDistance validé');

// 2. Données de test : sites d'entreprise
const companySites = [
  {
    id: 'site-lome-depot',
    name: 'Dépôt Central Lomé',
    latitude: 6.175193,
    longitude: 1.19926,
    radius_meters: 100,
  },
  {
    id: 'site-lome-port',
    name: 'Chantier Port Autonome',
    latitude: 6.1305,
    longitude: 1.2811,
    radius_meters: 150,
  },
  {
    id: 'site-paris-siege',
    name: 'Siège Administratif Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    radius_meters: 50,
  },
];

// 3. Cas 1 : L'employé est EXACTEMENT sur le Dépôt de Lomé (dans le rayon de 100m)
const coordsAtDepot = { latitude: 6.1753, longitude: 1.1993 };
const matchDepot = findMatchingLocation(coordsAtDepot, companySites);
assert.strictEqual(matchDepot.inPerimeter, true);
assert.strictEqual(matchDepot.matchedLocation.id, 'site-lome-depot');
assert.strictEqual(matchDepot.matchedLocation.name, 'Dépôt Central Lomé');
assert.ok(matchDepot.matchedDistance < 100);
console.log(`✅ Cas 1 (sur site) validé : ${matchDepot.matchedLocation.name}, distance=${matchDepot.matchedDistance}m`);

// 4. Cas 2 : L'employé est à Lomé mais à 500 mètres du Dépôt (hors périmètre de 100m)
const coordsNearDepot = { latitude: 6.1798, longitude: 1.1992 };
const matchNearDepot = findMatchingLocation(coordsNearDepot, companySites);
assert.strictEqual(matchNearDepot.inPerimeter, false);
assert.strictEqual(matchNearDepot.matchedLocation, null);
assert.strictEqual(matchNearDepot.closestLocation.id, 'site-lome-depot');
assert.ok(matchNearDepot.closestDistance > 100 && matchNearDepot.closestDistance < 1000);
console.log(
  `✅ Cas 2 (hors périmètre proche) validé : le plus proche est ${matchNearDepot.closestLocation.name} à ${formatDistance(matchNearDepot.closestDistance)}`
);

// 5. Cas 3 : Liste de sites vide
const matchEmpty = findMatchingLocation(coordsAtDepot, []);
assert.strictEqual(matchEmpty.inPerimeter, false);
assert.strictEqual(matchEmpty.matchedLocation, null);
assert.strictEqual(matchEmpty.closestLocation, null);
console.log('✅ Cas 3 (liste vide) validé');

console.log('🎉 Tous les tests de détection automatique sont validés avec succès !');
