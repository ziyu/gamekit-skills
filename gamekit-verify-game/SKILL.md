---
name: gamekit-verify-game
description: Audit, test, diagnose, and close completeness gaps in a GameKits-based TypeScript game. Use when reviewing architecture boundaries, validating App Host or GameModule lifecycle, checking forbidden backend/UI coupling, assessing feature readiness, adding missing tests or diagnostics, investigating regressions, or preparing a GameKits app for handoff or release.
---

# Verify a GameKits Game

Prove behavior and architecture with repository evidence. Treat the bundled audit as a triage aid, not a substitute for reading code and running tests.

## Establish scope

1. Read repository instructions, current changes, package scripts, app definitions/profiles, and relevant GameKits design documents.
2. Inspect the package manager, manifest, lockfile, installed GameKits scope, versions, source, and public exports.
3. Determine whether the request is diagnosis/review only or authorizes fixes. Do not mutate code for a review-only request.
4. Read [verification-matrix.md](references/verification-matrix.md) and select checks proportional to the affected layers, including cancellation, failed lifecycle cleanup, shared assets, save conflicts/staged recovery, and managed prediction when relevant.

## Verify package provenance

Confirm that dependencies come from published npm packages under `@gamekits/*`:

- Every GameKits import must use the exact installed `@gamekits/*` package name.
- Every imported GameKits package must be a direct dependency of the importing app/package.
- GameKits uses lockstep releases: verify one exact resolved version across the manifest, lockfile, and installed selected package set. A shared moving tag does not prove version alignment; bare packages, `latest`, and `*` are not acceptable prerelease pins.
- Manifest and lockfile changes must come from the repository's package manager, not manual edits.
- `/testing` is test-only, `/backend` and `/playback` belong in adapter/driver code, and `/server` belongs in server integration. Gameplay code uses package-root facades.

For npm consumers, verify the installed channel and source explicitly:

```bash
corepack pnpm view @gamekits/core dist-tags --json
corepack pnpm why @gamekits/core
corepack pnpm list '@gamekits/*'
```

Treat an `E404` for `@gamekits/<slug>` as evidence that the capability is not currently published. Do not invent another source or deep import.

## Run the static boundary audit

Run from this skill directory or use the absolute skill path:

```bash
node scripts/audit-gamekit-boundaries.mjs /path/to/game
```

Use `--json` for machine-readable output and `--strict` only in a gate that should fail on findings:

```bash
node scripts/audit-gamekit-boundaries.mjs /path/to/game --json
node scripts/audit-gamekit-boundaries.mjs /path/to/game --strict
```

Review every finding in context. The script recognizes legacy scope usage, Character Controller as a reusable toolkit, and IndexedDB Save as a concrete adapter. Some native imports and listener patterns are warnings because app composition and explicit escape hatches may be valid. It does not resolve lockfiles, prove direct-dependency coverage, or verify lifecycle behavior; check those separately.

When changing this audit, run its regression fixtures with `node --test scripts/audit-gamekit-boundaries.test.mjs`.

## Trace the runtime path

For the behavior under review, follow:

```text
definition/profile boot
→ service dependencies
→ GameModule install order
→ normalized intent or fact
→ system/rule/authority transition
→ presentation/UI/save/replication projection
→ stop/dispose cleanup
```

Identify the semantic owner and state owner at each step. Flag parallel runtimes, ambiguous authority, and backend-native types crossing reusable boundaries.

## Execute verification in layers

1. Run the narrowest failing or feature-specific test.
2. Run pure policy, module/system, and lifecycle tests.
3. Run DataPack/reference and save/migration checks when relevant.
4. Run headless App Host composition with deterministic time/seed/input.
5. Run adapter conformance for new or changed adapters.
6. Run the affected app/package build, lint, and format checks.
7. Exercise the real browser, driver, native platform, or multiplayer provider path when it changed.
8. Run the relevant benchmark/profiler gate when a hot path, fan-out, snapshot, trace, or UI refresh changed.

Discover real commands from manifests. Do not invent a standard command that the repository does not provide.

## Evaluate findings

Classify each issue by impact:

- correctness: wrong state, order, authority, validation, or restore behavior;
- lifecycle: resource/subscription/handle leaks or work after stop/dispose;
- boundary: service/module, driver/adapter, core/backend, gameplay/presentation, or UI/runtime crossing;
- observability: failures or rejected actions cannot be explained;
- performance: hot-path allocation, scans, fan-out, or UI/native work lacks budget evidence;
- completeness: only one layer or happy path is implemented.

Prefer concrete file/test evidence. Separate verified defects from risks and deliberate native escape hatches.

## Apply fixes when authorized

Fix the owning layer and add a regression test. Avoid broad refactors during verification. Re-run the narrowest test after each fix, then the relevant broader gates and the audit.

When public package ownership, dependency direction, or long-term protocol changes, update the proper architecture/module docs and add an ADR if the decision is high impact. Keep transient verification status in the task, PR, or implementation record.

## Handoff

Report:

- verified behavior and boundaries;
- verified package source, scope, version channel, and package-manager/lockfile evidence;
- actionable defects with severity and evidence;
- commands run and their results;
- audit warnings accepted as intentional and why;
- unverified external paths or missing tooling;
- remaining risks or deliberate deferrals.

Do not claim readiness when only static inspection or only a visual happy path was completed.
