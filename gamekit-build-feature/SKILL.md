---
name: gamekit-build-feature
description: Implement or complete an end-to-end gameplay feature in an existing GameKit game. Use when adding mechanics, actors, abilities, effects, enemies, objectives, interaction, input actions, content, presentation, UI feedback, persistence, diagnostics, or when turning a partial GameKit feature into a playable and tested vertical slice.
---

# Build a GameKit Feature

Implement one observable gameplay outcome across the minimum required layers. Keep authoritative rules independent from renderer and UI concerns.

## Reconstruct the current feature path

1. Read repository instructions and the app's design, profile, runtime, content, presentation, UI, save, and test files relevant to the request.
2. Inspect the package manager, lockfile, GameKit package scope, installed versions, and public imports before using an API.
3. Trace the nearest working feature from intent through runtime to visible result and tests.
4. Identify the owning module and state. Extend it when appropriate instead of starting a parallel runtime.
5. Read [vertical-slice.md](references/vertical-slice.md) and choose only the layers the feature actually needs.

State assumptions when game design is underspecified, but prefer a coherent small behavior over a broad unfinished system.

## Install missing packages through the package manager

Before adding an import, verify that its package is a direct dependency of the target app/package. Use the repository's existing package manager; never hand-edit the manifest or lockfile.

- Query and install published npm packages under `@gamekits/*` with `alpha` or an exact verified version.
- Import the exact `@gamekits/*` package added to the manifest.
- If npm returns `E404`, report the capability as not currently published and do not invent another source or deep import.

Example for adding GAS to a standalone game:

```bash
corepack pnpm view @gamekits/gas dist-tags --json
corepack pnpm add @gamekits/gas@alpha
```

```ts
import type { GasHandle } from "@gamekits/gas";
```

If the requested package is unavailable, choose an already published capability only when it preserves the user's intent; otherwise report the blocker.

## Define acceptance as a causal chain

Write acceptance in this form:

```text
intent or world fact
→ authoritative rule
→ state transition
→ low-frequency fact/cue when meaningful
→ presentation/UI feedback
→ deterministic assertion
```

Also define rejection and edge behavior: invalid target, cooldown, insufficient resource, duplicate event, pause/stop, disconnect, save compatibility, or cleanup as relevant.

## Place each part correctly

- Put immutable content and references in DataTypes/DataPacks.
- Put hot authoritative state in World components or a bounded session runtime.
- Put per-frame or fixed-step logic in systems.
- Put low-frequency rules in TCA, GAS, Combat, or EventBus handlers when their semantics fit.
- Put normalized input in Input actions/commands, not renderer callbacks.
- Put RenderObject sync, animation, audio, particles, camera response, and native engine access in presentation.
- Put React state in low-frequency UI views, windows, and commands.
- Put long-lived semantic state in explicit SaveContributors.
- Put bounded trace and snapshots beside the owning runtime without making diagnostics authoritative.

Do not add every possible layer. A simple deterministic movement feature may need input, one system, presentation sync, and tests but no TCA, GAS, DataPack, Save, or React.

## Implement from authority outward

1. Add or refine domain types and invariants.
2. Add content definitions only when designers or packages need data-driven variation.
3. Implement the authoritative module/system/rule and lifecycle cleanup.
4. Emit only meaningful low-frequency facts with useful correlation metadata.
5. Add renderer, animator, audio, camera, and UI projections after the rule works headlessly.
6. Add persistence only for state that must survive a session boundary.
7. Add diagnostics that answer why the feature ran, did not run, or failed.
8. Update long-term app/module documentation only when the durable design changed; keep task status in PR, issue, or implementation records.

Preserve existing module/system order. If a new dependency requires reordering, make the ordering explicit and prove it in a composition test.

## Test the whole slice

Build evidence in increasing scope:

1. pure policy or math tests;
2. module/system test with deterministic time and seed;
3. content/reference validation test;
4. headless intent-to-outcome test;
5. presentation projection test without asserting native object identity;
6. save round-trip or migration test when persistent;
7. visual/provider smoke when external runtime behavior changed;
8. performance check when the feature adds work to a hot path.

Include failure-path assertions and dispose cleanup. Use stable semantic snapshots rather than DOM, absolute timestamps, or third-party internals.

## Finish the feature

Before handing off:

- run the narrowest test, affected app/package test, build, lint, and format gates that exist;
- inspect the final package-manager manifest, lockfile, dependency source/scope, and public import changes;
- confirm no backend-native type leaked into reusable gameplay;
- confirm UI and presentation do not own the rule;
- confirm stop/dispose behavior and repeated initialization;
- report deliberate deferrals separately from defects.

Do not describe a partial path as complete merely because the UI is visible or a unit test passes.
