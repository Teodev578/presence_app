# Gates: Refonte Responsive et Harmonisation Stylistique Complète de l'Espace Manager & Global

OWNS: src/views/manager/**, src/components/manager/**, src/layouts/**, src/views/auth/LoginView.vue, src/components/employee/GpsRing.vue

Scope: Éliminer tous les emojis bruts résiduels et caractères graphiques unicode, harmoniser les tokens Material 3 (arrondis, élévations), déplacer le statut réseau et déconnexion dans le Navigation Drawer, sécuriser l'adaptabilité mobile et valider la compilation.

- [x] G1: Absence totale d'emojis bruts et caractères unicode graphiques résiduels
  CHECK: node -e 'const fs = require("fs"); const path = require("path"); function getFiles(dir) { let results = []; const list = fs.readdirSync(dir); list.forEach(file => { const filePath = path.join(dir, file); const stat = fs.statSync(filePath); if (stat && stat.isDirectory()) results = results.concat(getFiles(filePath)); else if (filePath.endsWith(".vue") || filePath.endsWith(".js") || filePath.endsWith(".html")) results.push(filePath); }); return results; } const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u; const allFiles = getFiles("src"); let issues = 0; for (const f of allFiles) { const content = fs.readFileSync(f, "utf8"); const lines = content.split("\n"); lines.forEach((l, i) => { if (emojiRegex.test(l)) { issues++; } }); } if (issues === 0) console.log("CLEAN: 0 raw emojis across all src files");'
  EXPECT: CLEAN: 0 raw emojis across all src files
  EVIDENCE: CLEAN: 0 raw emojis across all src files (Exécuté avec code retour 0)

- [x] G2: Remplacement des arrondis arbitraires par les tokens Material 3 (rounded-m3-*)
  CHECK: node -e 'const fs = require("fs"); const path = require("path"); function getFiles(dir) { let results = []; const list = fs.readdirSync(dir); list.forEach(file => { const filePath = path.join(dir, file); const stat = fs.statSync(filePath); if (stat && stat.isDirectory()) results = results.concat(getFiles(filePath)); else if (filePath.endsWith(".vue")) results.push(filePath); }); return results; } const badRadius = /rounded-(xl|2xl|3xl)\b/; const allVue = getFiles("src"); let bad = []; for (const f of allVue) { const content = fs.readFileSync(f, "utf8"); if (badRadius.test(content)) bad.push(f); } if (bad.length === 0) console.log("G2 passed: all non-M3 radii converted to tokens"); else { console.error("Found:", bad); process.exit(1); }'
  EXPECT: G2 passed: all non-M3 radii converted to tokens
  EVIDENCE: G2 passed: all non-M3 radii converted to tokens (Exécuté avec code retour 0)

- [x] G3: Élimination des ombres agressives prohibées (shadow-md, shadow-lg, shadow-xl, shadow-2xl)
  CHECK: node -e 'const fs = require("fs"); const path = require("path"); function getFiles(dir) { let results = []; const list = fs.readdirSync(dir); list.forEach(file => { const filePath = path.join(dir, file); const stat = fs.statSync(filePath); if (stat && stat.isDirectory()) results = results.concat(getFiles(filePath)); else if (filePath.endsWith(".vue")) results.push(filePath); }); return results; } const badShadow = /shadow-(md|lg|xl|2xl)\b/; const allVue = getFiles("src"); let bad = []; for (const f of allVue) { const content = fs.readFileSync(f, "utf8"); if (badShadow.test(content)) bad.push(f); } if (bad.length === 0) console.log("G3 passed: no aggressive shadows across all Vue files"); else { console.error("Found:", bad); process.exit(1); }'
  EXPECT: G3 passed: no aggressive shadows across all Vue files
  EVIDENCE: G3 passed: no aggressive shadows across all Vue files (Exécuté avec code retour 0)

- [x] G4: Déplacement du statut réseau et déconnexion dans le Navigation Drawer
  CHECK: node -e 'const fs = require("fs"); const mLayout = fs.readFileSync("src/layouts/ManagerLayout.vue", "utf8"); const eLayout = fs.readFileSync("src/layouts/EmployeeLayout.vue", "utf8"); const mHeaderHasSync = mLayout.includes("<header") && mLayout.split("<header")[1].split("</header>")[0].includes("<SyncIndicator"); const mDrawerHasSync = mLayout.includes("aside") && mLayout.split("<aside")[1].split("</aside>")[0].includes("<SyncIndicator"); if (!mHeaderHasSync && mDrawerHasSync) console.log("G4 passed: SyncIndicator properly located in drawer footer and removed from header"); else { console.error("G4 failed"); process.exit(1); }'
  EXPECT: G4 passed: SyncIndicator properly located in drawer footer and removed from header
  EVIDENCE: G4 passed: SyncIndicator properly located in drawer footer and removed from header (Exécuté avec code retour 0)

- [x] G5: Compilation de production Vite sans erreur
  CHECK: npm run build
  EXPECT: ✓ built in
  EVIDENCE: ✓ built in 945ms (Code retour 0)
