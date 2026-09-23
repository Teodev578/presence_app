import assert from 'node:assert';
import { parseGeoInput, parseAndResolveGeoInput, isValidLatLng } from '../src/lib/geoParser.js';

console.log('🧪 Lancement des tests de validation pour geoParser...');

// 1. Validation des bornes
assert.strictEqual(isValidLatLng(48.8566, 2.3522), true);
assert.strictEqual(isValidLatLng(-91, 10), false);
assert.strictEqual(isValidLatLng(48, 185), false);
assert.strictEqual(isValidLatLng(NaN, 2), false);

// 2. Google Maps complet avec place et @lat,lng
const gmaps1 = parseGeoInput('https://www.google.com/maps/place/Tour+Eiffel/@48.8583701,2.2944813,17z/data=!3m1!4b1');
assert.strictEqual(gmaps1.success, true);
assert.strictEqual(gmaps1.latitude, 48.85837);
assert.strictEqual(gmaps1.longitude, 2.294481);
assert.strictEqual(gmaps1.name, 'Tour Eiffel');
assert.strictEqual(gmaps1.source, 'Google Maps');

// 3. Google Maps avec query q
const gmaps2 = parseGeoInput('https://maps.google.com/?q=48.858370,2.294481');
assert.strictEqual(gmaps2.success, true);
assert.strictEqual(gmaps2.latitude, 48.85837);
assert.strictEqual(gmaps2.longitude, 2.294481);

// 4. Google Maps issu d'une redirection mobile avec /place/lat,lng et !3d!4d
const gmapsMobileRedirect = parseGeoInput(
  'https://www.google.com/maps/place/6.175193,1.199260/data=!4m6!3m5!1s0!7e2!8m2!3d6.1751933!4d1.1992599!18m1!1e1?utm_source=mstt_1'
);
assert.strictEqual(gmapsMobileRedirect.success, true);
assert.strictEqual(gmapsMobileRedirect.latitude, 6.175193);
assert.strictEqual(gmapsMobileRedirect.longitude, 1.19926);

// 5. Apple Maps avec ll et q
const apple1 = parseGeoInput('https://maps.apple.com/?ll=48.858370,2.294481&q=Tour+Eiffel');
assert.strictEqual(apple1.success, true);
assert.strictEqual(apple1.latitude, 48.85837);
assert.strictEqual(apple1.longitude, 2.294481);
assert.strictEqual(apple1.name, 'Tour Eiffel');
assert.strictEqual(apple1.source, 'Apple Maps');

// 6. OpenStreetMap
const osm = parseGeoInput('https://www.openstreetmap.org/#map=19/48.85837/2.29448');
assert.strictEqual(osm.success, true);
assert.strictEqual(osm.latitude, 48.85837);
assert.strictEqual(osm.longitude, 2.29448);

// 7. Coordonnées brutes décimales
const dec = parseGeoInput('48.858370, 2.294481');
assert.strictEqual(dec.success, true);
assert.strictEqual(dec.latitude, 48.85837);
assert.strictEqual(dec.longitude, 2.294481);

// 8. Coordonnées DMS
const dms = parseGeoInput('48°51\'29.8"N 2°17\'40.2"E');
assert.strictEqual(dms.success, true);
assert.ok(Math.abs(dms.latitude - 48.858278) < 0.001);
assert.ok(Math.abs(dms.longitude - 2.294500) < 0.001);

// 9. Lien court Google Maps - synchrone (détection lien court)
const shortUrl = parseGeoInput('https://maps.app.goo.gl/AbCdEfGh123');
assert.strictEqual(shortUrl.success, false);
assert.strictEqual(shortUrl.isShortUrl, true);

// 10. Résolution asynchrone du lien court réel de l'utilisateur via l'Edge Function Supabase
async function runAsyncTest() {
  console.log('🌐 Test de résolution asynchrone pour le lien utilisateur maps.app.goo.gl...');
  const userShortUrl = 'https://maps.app.goo.gl/4qyKLJJevx7Hs3q86?g_st=ac';
  const resolved = await parseAndResolveGeoInput(userShortUrl, {
    supabaseUrl: 'https://pvquzkpfdjrequbwnhur.supabase.co',
    supabaseKey: 'sb_publishable_frpb_ALYwiVAwPEycfFjTw_zj9NlWzn',
  });

  assert.strictEqual(resolved.success, true);
  assert.strictEqual(resolved.latitude, 6.175193);
  assert.strictEqual(resolved.longitude, 1.19926);
  console.log(`✅ Lien résolu : lat=${resolved.latitude}, lng=${resolved.longitude}, source="${resolved.source}"`);
}

runAsyncTest().then(() => {
  console.log('✅ Tous les tests unitaires et d’intégration geoParser ont réussi !');
});
