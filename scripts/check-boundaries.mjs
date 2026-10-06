#!/usr/bin/env node
/**
 * Enforces feature-boundary rules with zero dependencies:
 *
 *  1. A file under src/features/<a>/ must never import from src/features/<b>/
 *     (a !== b). No exceptions.
 *  2. Files under src/app/ and src/shared/ must never import from
 *     src/features/ at all, except the sanctioned composition points below.
 *     (src/routes/ is the composition layer and may import feature pages.)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const FEATURES = path.join(SRC, "features");

// Sanctioned imports of feature code from outside src/features. Each entry is
// an importing file (relative to src/) plus the import specifiers it may use.
const ALLOWLIST = [
  // The domain registry composes feature configs (feature package roots only).
  { file: "app/registry/domainRegistry.ts", allowed: /^@\/features\/[\w-]+$/ },
  // The command palette registry composes feature palette actions.
  { file: "app/layout/CommandPalette/registry.ts", allowed: /^@\/features\/[\w-]+\/palette$/ },
  // MainLayout mounts the onboarding trial banner.
  { file: "app/layout/MainLayout.tsx", allowed: /^@\/features\/onboarding$/ },
];

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* walk(full);
    } else if (SOURCE_EXTENSIONS.has(path.extname(full))) {
      yield full;
    }
  }
}

const IMPORT_PATTERNS = [
  /\bfrom\s+["']([^"']+)["']/g, // import ... from "x"; export ... from "x"
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g, // import("x")
  /^\s*import\s+["']([^"']+)["']/gm, // side-effect import "x"
];

function importSpecifiers(source) {
  const specs = new Set();
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      specs.add(match[1]);
    }
  }
  return specs;
}

/** Resolves an import specifier to an absolute path inside src/, or null. */
function resolveToSrc(spec, importerDir) {
  if (spec.startsWith("@/")) return path.join(SRC, spec.slice(2));
  if (spec.startsWith("@app/")) return path.join(SRC, "app", spec.slice(5));
  if (spec.startsWith("@shared/")) return path.join(SRC, "shared", spec.slice(8));
  if (spec.startsWith("@config/")) return path.join(SRC, "config", spec.slice(8));
  if (spec.startsWith(".")) return path.resolve(importerDir, spec);
  return null; // bare package import
}

function featureOf(absolutePath) {
  const rel = path.relative(FEATURES, absolutePath);
  if (rel.startsWith("..")) return null;
  return rel.split(path.sep)[0];
}

const violations = [];

function checkFile(file) {
  const relFile = path.relative(SRC, file);
  const importerFeature = featureOf(file);
  const allowEntry = ALLOWLIST.find((entry) => entry.file === relFile);
  const source = readFileSync(file, "utf8");

  for (const spec of importSpecifiers(source)) {
    const resolved = resolveToSrc(spec, path.dirname(file));
    if (resolved === null) continue;
    const targetFeature = featureOf(resolved);
    if (targetFeature === null) continue;

    if (importerFeature !== null) {
      if (targetFeature !== importerFeature) {
        violations.push(`${relFile}: cross-feature import "${spec}"`);
      }
      continue;
    }

    if (allowEntry?.allowed.test(spec)) continue;
    violations.push(`${relFile}: feature import "${spec}" outside sanctioned composition points`);
  }
}

for (const scope of [FEATURES, path.join(SRC, "app"), path.join(SRC, "shared")]) {
  for (const file of walk(scope)) {
    checkFile(file);
  }
}

if (violations.length > 0) {
  console.error("Feature boundary violations:\n");
  for (const violation of violations) {
    console.error(`  ${violation}`);
  }
  console.error(`\n${violations.length} violation(s).`);
  process.exit(1);
}

console.log("check-boundaries: OK");
