#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import { resolve, relative, extname } from "node:path";

const args = process.argv.slice(2);
const json = args.includes("--json");
const strict = args.includes("--strict");
const positional = args.filter((arg) => !arg.startsWith("--"));
const root = resolve(positional[0] ?? process.cwd());

const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "public",
  "target"
]);
const sourceExtensions = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"]);
const nativePackages = [
  "phaser",
  "three",
  "koota",
  "gsap",
  "matter-js",
  "recast-navigation",
  "xstate",
  "yuka",
  "@tauri-apps/",
  "@colyseus/",
  "@dimforge/rapier"
];
const concreteGamekitPackages = [
  "@gamekits/driver-phaser",
  "@gamekits/driver-three",
  "@gamekits/input-dom",
  "@gamekits/multiplayer-colyseus",
  "@gamekits/navigation-graph",
  "@gamekits/navigation-grid",
  "@gamekits/navigation-navmesh",
  "@gamekits/navigation-recast",
  "@gamekits/physics-rapier2d",
  "@gamekits/physics-rapier3d",
  "@gamekits/platform-tauri",
  "@gamekits/platform-web",
  "@gamekits/renderer-phaser",
  "@gamekits/world-koota"
];
const reusableCorePackages = new Set([
  "@gamekits/ai-core",
  "@gamekits/animator-core",
  "@gamekits/audio-core",
  "@gamekits/camera-core",
  "@gamekits/combat",
  "@gamekits/core",
  "@gamekits/data",
  "@gamekits/devtools",
  "@gamekits/driver-core",
  "@gamekits/event-bus",
  "@gamekits/game-runtime",
  "@gamekits/gas",
  "@gamekits/input-core",
  "@gamekits/multiplayer-core",
  "@gamekits/navigation-core",
  "@gamekits/physics-core",
  "@gamekits/platform-core",
  "@gamekits/renderer-core",
  "@gamekits/save",
  "@gamekits/tca",
  "@gamekits/ui-core",
  "@gamekits/world"
]);

const findings = [];
const stats = { files: 0, packages: 0 };

function add(severity, rule, file, message, line) {
  findings.push({ severity, rule, file, ...(line ? { line } : {}), message });
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

function isTestPath(path) {
  return /(?:^|\/)(?:test|tests|__tests__)(?:\/|$)|\.(?:test|spec)\.[^.]+$/i.test(path);
}

function isNativeBoundary(path) {
  return /(?:^|\/)(?:adapter|adapters|backend|backends|driver|drivers|native|presentation|profiles?|realtime|renderer|server|ui|devtools)(?:\/|[-_.])/i.test(path) ||
    /(?:^|\/)packages\/(?:devtools-ui|driver-phaser|driver-three|input-dom|multiplayer-colyseus|multiplayer-memory|navigation-graph|navigation-grid|navigation-navmesh|navigation-recast|physics-rapier2d|physics-rapier3d|platform-tauri|platform-web|react-ui|renderer-phaser|world-koota)(?:\/|$)/i.test(path);
}

function isGameplayPath(path) {
  return /(?:^|\/)(?:content|domain|game|gameplay|modules?|systems?)(?:\/|[-_.])/i.test(path);
}

function isReusableCorePath(path) {
  return /^packages\/(?:ai-core|animator-core|audio-core|camera-core|combat|core|data|devtools|driver-core|event-bus|game-runtime|gas|input-core|multiplayer-core|navigation-core|physics-core|platform-core|renderer-core|save|tca|ui-core|world)(?:\/|$)/i.test(path);
}

function matchesPackage(specifier, packageName) {
  return specifier === packageName || specifier.startsWith(`${packageName}/`) ||
    (packageName.endsWith("/") && specifier.startsWith(packageName));
}

function importsFrom(text) {
  const values = [];
  const pattern = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)["']([^"']+)["']/g;
  for (const match of text.matchAll(pattern)) {
    values.push({ specifier: match[1], index: match.index ?? 0 });
  }
  return values;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(absolute);
    } else if (entry.isFile()) {
      const path = relative(root, absolute).replaceAll("\\", "/");
      if (entry.name === "package.json") await auditPackage(absolute, path);
      if (sourceExtensions.has(extname(entry.name))) await auditSource(absolute, path);
    }
  }
}

async function auditPackage(absolute, path) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(absolute, "utf8"));
  } catch (error) {
    add("error", "invalid-package-json", path, `Cannot parse package.json: ${error.message}`);
    return;
  }
  stats.packages += 1;
  const dependencies = {
    ...(manifest.dependencies ?? {}),
    ...(manifest.peerDependencies ?? {}),
    ...(manifest.optionalDependencies ?? {})
  };

  if (!reusableCorePackages.has(manifest.name)) return;
  for (const dependency of Object.keys(dependencies).sort()) {
    if (nativePackages.some((name) => matchesPackage(dependency, name)) ||
        concreteGamekitPackages.some((name) => matchesPackage(dependency, name))) {
      add(
        "error",
        "core-concrete-dependency",
        path,
        `${manifest.name} depends on concrete/backend package ${dependency}`
      );
    }
  }
}

async function auditSource(absolute, path) {
  const text = await readFile(absolute, "utf8");
  stats.files += 1;
  const test = isTestPath(path);
  const nativeBoundary = isNativeBoundary(path);
  const gameplay = isGameplayPath(path);

  for (const match of text.matchAll(/\b(?:innerHTML\s*=|insertAdjacentHTML\s*\()/g)) {
    add("error", "unsafe-html-construction", path, "Use React or explicit DOM nodes/textContent instead of HTML string construction", lineOf(text, match.index ?? 0));
  }

  for (const imported of importsFrom(text)) {
    const native = nativePackages.find((name) => matchesPackage(imported.specifier, name));
    const concrete = concreteGamekitPackages.find((name) => matchesPackage(imported.specifier, name));
    const react = imported.specifier === "react" || imported.specifier.startsWith("react-dom");

    if (!test && react && gameplay && !nativeBoundary) {
      add("error", "react-in-gameplay", path, `${imported.specifier} is imported by gameplay/domain code`, lineOf(text, imported.index));
    }
    if (!test && concrete && gameplay && !nativeBoundary) {
      const reusable = isReusableCorePath(path);
      add(reusable ? "error" : "warning", reusable ? "concrete-gamekit-in-core" : "concrete-gamekit-import-review", path, reusable ? `${concrete} crosses into a reusable core/facade package` : `${concrete} is selected inside gameplay/domain code; confirm this is app orchestration rather than a reusable contract`, lineOf(text, imported.index));
    }
    if (!test && native && !nativeBoundary) {
      const reusable = isReusableCorePath(path);
      add(reusable ? "error" : "warning", reusable ? "native-import-in-core" : "native-import-review", path, reusable ? `${native} crosses into a reusable core/facade package` : `${native} import is outside an obvious driver/adapter/profile/presentation/server/UI boundary`, lineOf(text, imported.index));
    }
  }

  if (!test && /\bnew\s+(?:Phaser\.Game|THREE\.WebGLRenderer)\s*\(/.test(text) && !/(?:^|\/)drivers?(?:\/|[-_.])/i.test(path)) {
    add("error", "external-runtime-owner", path, "Create Phaser/Three runtime through its GameKit Driver, not directly here");
  }

  if (/(?:^|\/)src\/index\.ts$/.test(path) && /\b(?:function|class)\s+\w+|\b(?:const|let|var)\s+\w+\s*=/.test(text)) {
    add("warning", "index-implementation", path, "src/index.ts appears to contain implementation instead of only public exports");
  }

  for (const match of test ? [] : text.matchAll(/\.(?:emit|publish)\s*\(\s*["']([^"']+)["']/g)) {
    if (/(?:position|transform|pointer[._-]?move|mouse[._-]?move|render.*patch|raw.*input|held.*input)/i.test(match[1])) {
      add("warning", "high-frequency-event-review", path, `Review potentially high-frequency event '${match[1]}'`, lineOf(text, match.index ?? 0));
    }
  }

  if (!test && text.includes("addEventListener(") && !text.includes("removeEventListener(") && !/\bonce\s*:\s*true\b/.test(text) && !/\bsignal\s*:/.test(text)) {
    add("warning", "listener-cleanup-review", path, "Event listener has no visible removal, once option, or AbortSignal in the same file");
  }
}

try {
  await walk(root);
} catch (error) {
  const result = { root, error: error.message, findings: [], summary: { errors: 1, warnings: 0, ...stats } };
  if (json) console.log(JSON.stringify(result, null, 2));
  else console.error(`Audit failed for ${root}: ${error.message}`);
  process.exitCode = 2;
  process.exit();
}

findings.sort((left, right) =>
  left.file.localeCompare(right.file) ||
  (left.line ?? 0) - (right.line ?? 0) ||
  left.rule.localeCompare(right.rule)
);
const summary = {
  errors: findings.filter((finding) => finding.severity === "error").length,
  warnings: findings.filter((finding) => finding.severity === "warning").length,
  ...stats
};
const result = { root, findings, summary };

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`GameKit boundary audit: ${root}`);
  for (const finding of findings) {
    const location = `${finding.file}${finding.line ? `:${finding.line}` : ""}`;
    console.log(`${finding.severity.toUpperCase()} ${finding.rule} ${location} — ${finding.message}`);
  }
  console.log(`Summary: ${summary.errors} error(s), ${summary.warnings} warning(s), ${summary.files} source file(s), ${summary.packages} package manifest(s)`);
}

if (strict && findings.length > 0) process.exitCode = 1;
