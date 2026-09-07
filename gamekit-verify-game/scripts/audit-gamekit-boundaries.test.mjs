import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const auditPath = fileURLToPath(new URL("./audit-gamekit-boundaries.mjs", import.meta.url));
const version = "0.1.0-alpha.9";

async function audit(t, files, manifest = { name: "fixture" }) {
  const root = await mkdtemp(join(tmpdir(), "gamekits-audit-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [path, content] of Object.entries({
    "package.json": JSON.stringify(manifest),
    ...files
  })) {
    const absolute = join(root, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, content);
  }
  const result = spawnSync(process.execPath, [auditPath, root, "--json", "--strict"], {
    encoding: "utf8"
  });
  assert.ifError(result.error);
  assert.ok(result.status === 0 || result.status === 1, result.stderr || result.stdout);
  return { status: result.status, ...JSON.parse(result.stdout) };
}

for (const source of [
  'import { Clock } from "@gamekit/core";',
  'import type { GameModule } from "@gamekit/core";',
  'export { Clock } from "@gamekit/core";',
  'const core = await import("@gamekit/core");',
  'const core = require("@gamekit/core");',
  'import "@gamekit/core";'
]) {
  test(`rejects legacy scope: ${source}`, async (t) => {
    const result = await audit(t, { "src/game/module.ts": source });
    assert.equal(result.status, 1);
    assert.deepEqual(
      result.findings.map(({ rule, line }) => ({ rule, line })),
      [{ rule: "legacy-gamekit-scope", line: 1 }]
    );
  });
}

test("rejects legacy dependency names and aliased registry targets", async (t) => {
  const result = await audit(
    t,
    {},
    {
      name: "fixture",
      dependencies: { "@gamekit/core": version },
      devDependencies: { oldCore: `npm:@gamekit/core@${version}` }
    }
  );
  assert.equal(result.status, 1);
  assert.equal(result.findings.filter(({ rule }) => rule === "legacy-gamekit-scope").length, 2);
});

test("reports concrete IndexedDB selection in gameplay for review", async (t) => {
  const result = await audit(
    t,
    {
      "src/game/save.ts": 'import { createIndexedDbSaveStore } from "@gamekits/save-indexeddb";'
    },
    { name: "fixture", dependencies: { "@gamekits/save-indexeddb": version } }
  );
  assert.equal(result.status, 1);
  assert.deepEqual(
    result.findings.map(({ rule, severity }) => ({ rule, severity })),
    [{ rule: "concrete-gamekit-import-review", severity: "warning" }]
  );
});

for (const dependency of ["phaser", "@gamekits/save-indexeddb"]) {
  test(`rejects ${dependency} in the reusable character toolkit manifest`, async (t) => {
    const result = await audit(
      t,
      {},
      {
        name: "@gamekits/character-controller",
        dependencies: { [dependency]: dependency === "phaser" ? "3.90.0" : version }
      }
    );
    assert.equal(result.status, 1);
    assert.ok(
      result.findings.some(
        ({ rule, severity }) => rule === "core-concrete-dependency" && severity === "error"
      )
    );
  });
}

test("rejects native and concrete imports in character toolkit source", async (t) => {
  const result = await audit(t, {
    "packages/character-controller/src/motor.ts": [
      'import Phaser from "phaser";',
      'import { createIndexedDbSaveStore } from "@gamekits/save-indexeddb";'
    ].join("\n")
  });
  assert.equal(result.summary.errors, 2);
  assert.deepEqual(
    result.findings.map(({ rule }) => rule),
    ["native-import-in-core", "concrete-gamekit-in-core"]
  );
});

test("allows profile-selected storage, pure character gameplay and test fixtures", async (t) => {
  const result = await audit(
    t,
    {
      "src/profiles/web.ts": 'import { createIndexedDbSaveStore } from "@gamekits/save-indexeddb";',
      "src/game/movement.ts":
        'import { stepCharacterMotor } from "@gamekits/character-controller";',
      "src/test/physics.test.ts": 'import * as fixtures from "@gamekits/physics-core/testing";',
      "packages/save-indexeddb/src/store.ts": 'import type { SaveStore } from "@gamekits/save";'
    },
    {
      name: "fixture",
      dependencies: {
        "@gamekits/save-indexeddb": version,
        "@gamekits/character-controller": version,
        "@gamekits/save": version
      },
      devDependencies: { "@gamekits/physics-core": version }
    }
  );
  assert.equal(result.status, 0);
  assert.deepEqual(result.findings, []);
});

test("rejects the physics testing subpath in production, including side-effect imports", async (t) => {
  const result = await audit(t, {
    "src/game/movement.ts": 'import "@gamekits/physics-core/testing";'
  });
  assert.equal(result.status, 1);
  assert.ok(result.findings.some(({ rule }) => rule === "testing-subpath-outside-test"));
});
