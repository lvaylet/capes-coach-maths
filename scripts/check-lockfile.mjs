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

const lockfileContent = fs.readFileSync(lockfilePath, "utf-8");
const lockfile = JSON.parse(lockfileContent);

const invalidResolved = [];

function checkPackages(packages) {
  if (!packages) return;
  for (const [pkgPath, pkgData] of Object.entries(packages)) {
    if (pkgData && typeof pkgData.resolved === "string") {
      const resolved = pkgData.resolved;
      // Tolérer uniquement les registres publics autorisés
      const isPublic =
        resolved.startsWith("https://registry.npmjs.org/") ||
        resolved.startsWith("https://registry.yarnpkg.com/") ||
        resolved.startsWith("git+") ||
        resolved.startsWith("https://github.com/");

      const isPrivateOrInternal =
        resolved.includes("airlock-proxy") ||
        resolved.includes(".goog:") ||
        resolved.includes("internal") ||
        resolved.startsWith("http://");

      if (!isPublic || isPrivateOrInternal) {
        invalidResolved.push({
          pkg: pkgPath || pkgData.name || "racine",
          resolved,
        });
      }
    }
  }
}

// Vérifier les packages modernes (lockfileVersion 2 et 3)
checkPackages(lockfile.packages);

// Vérifier les dépendances v1/v2 imbriquées si présentes
function checkDependencies(dependencies, prefix = "") {
  if (!dependencies) return;
  for (const [depName, depData] of Object.entries(dependencies)) {
    if (depData && typeof depData.resolved === "string") {
      const resolved = depData.resolved;
      const isPublic =
        resolved.startsWith("https://registry.npmjs.org/") ||
        resolved.startsWith("https://registry.yarnpkg.com/") ||
        resolved.startsWith("git+") ||
        resolved.startsWith("https://github.com/");

      const isPrivateOrInternal =
        resolved.includes("airlock-proxy") ||
        resolved.includes(".goog:") ||
        resolved.includes("internal") ||
        resolved.startsWith("http://");

      if (!isPublic || isPrivateOrInternal) {
        invalidResolved.push({
          pkg: prefix ? `${prefix} > ${depName}` : depName,
          resolved,
        });
      }
    }
    if (depData.dependencies) {
      checkDependencies(
        depData.dependencies,
        prefix ? `${prefix} > ${depName}` : depName
      );
    }
  }
}

checkDependencies(lockfile.dependencies);

if (invalidResolved.length > 0) {
  console.error(
    `\n❌ [ERREUR SÉCURITÉ / CI] ${invalidResolved.length} URL(s) non publique(s) ou proxy interne détectée(s) dans package-lock.json :\n`
  );
  for (const item of invalidResolved) {
    console.error(`  - ${item.pkg} :`);
    console.error(`    ${item.resolved}`);
  }
  console.error(
    "\n💡 Ces URLs provoquent l'échec immédiat de npm ci sur GitHub Pages / CI."
  );
  console.error(
    '💡 Exécutez "npm run fix:lockfile" pour les rediriger automatiquement vers https://registry.npmjs.org/\n'
  );
  process.exit(1);
}

console.log(
  "✅ package-lock.json : toutes les URLs sont conformes au registre public npmjs.org."
);
process.exit(0);
