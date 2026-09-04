#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lockfilePath = path.resolve(__dirname, "../package-lock.json");

if (!fs.existsSync(lockfilePath)) {
  console.error("❌ Fichier package-lock.json introuvable.");
  process.exit(1);
}

const raw = fs.readFileSync(lockfilePath, "utf-8");

// Remplacer les préfixes de proxy internes connus
const INTERNAL_PATTERNS = [
  /http:\/\/airlock-proxy\.uplink\.goog:\d+\/npm\/[^/]+\/[^/]+\//g,
  /http:\/\/[a-zA-Z0-9.-]+\.goog:\d+\/npm\/[^/]+\/[^/]+\//g,
];

let updated = raw;
let count = 0;

for (const pattern of INTERNAL_PATTERNS) {
  const matches = updated.match(pattern);
  if (matches) {
    count += matches.length;
    updated = updated.replace(pattern, "https://registry.npmjs.org/");
  }
}

if (count === 0) {
  console.log(
    "ℹ️ Aucune URL de proxy interne détectée à remplacer dans package-lock.json."
  );
} else {
  fs.writeFileSync(lockfilePath, updated, "utf-8");
  console.log(
    `✅ ${count} URL(s) de proxy interne remplacée(s) par https://registry.npmjs.org/ dans package-lock.json.`
  );
}
