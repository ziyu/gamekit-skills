# GameKits verification matrix

## Contents

1. Baseline inspection
2. Architecture matrix
3. Behavior matrix
4. Lifecycle matrix
5. Gameplay foundation matrix
6. Data, save, and multiplayer matrix
7. Presentation and UI matrix
8. Performance matrix
9. Completion criteria

## 1. Baseline inspection

Collect before judging code:

- repository instructions and dirty state;
- package manager and actual scripts;
- installed GameKits scope, package source, versions, dist-tag, package exports, and lockfile entries;
- app `GameAppDefinition`, profiles, service graph, and standard/app module assembly;
- closest upstream example and module design document;
- feature tests, integration tests, conformance helpers, and benchmarks already present.

GameKits packages are published under `@gamekits/*`. Every import must match a direct npm dependency installed with a verified dist-tag or exact version. Importing an undeclared package, bypassing the package manager, or missing lockfile evidence is a defect.

Verify npm provenance with the target package manager, for example:

```bash
corepack pnpm view @gamekits/core dist-tags --json
corepack pnpm why @gamekits/core
corepack pnpm list '@gamekits/*'
```

GameKits uses lockstep releases. Check one exact version across selected direct and internal dependencies using manifest, lockfile, and installed package evidence; tags alone do not prove alignment. Bare package names, `latest`, `*`, source/import mismatch, missing lockfile evidence, incompatible public contracts, and accidental broad upgrades are defects or release blockers according to impact. Legacy `@gamekit/*` imports and dependency aliases need migration to the actual installed `@gamekits/*` package.

Review public subpaths by consumer: `/testing` belongs in tests, `/backend` and `/playback` belong in adapters/drivers, and `/server` belongs in server integration. Reusable gameplay imports package-root facades.

## 2. Architecture matrix

| Boundary | Pass condition |
| --- | --- |
| Core-first semantics | One core/facade owns lifecycle, state shape, snapshot, diagnostics, and errors; backend maps rather than duplicates |
| App Host vs runtime | Host owns services/external handles; GameRuntime owns modules, clock, systems, world, and low-frequency facts |
| Service vs module | Platform/driver/assets/input source/UI/save store/connection are services; gameplay/session behavior is a module |
| Driver vs adapter | Driver solely owns cross-protocol external runtime; adapter maps a single contract |
| Gameplay vs native | Reusable gameplay types contain no Phaser/Three/Koota/Rapier/Colyseus/DOM/Tauri/React/GSAP types |
| Authority vs presentation | Runtime/server owns outcomes; renderer/audio/animation/UI project them |
| Data vs runtime state | DataRegistry stores definitions and references; World/module runtime stores changing state |
| Hot vs low-frequency | Systems/state handle per-frame work; EventBus/TCA/trace handle bounded meaningful facts |
| Save boundary | Manager is domain-neutral; contributors own concrete long-lived game state |
| Documentation | Long-term design, ADR, and transient execution status live in their correct locations |
| Package provenance | Scope matches source, imported packages are declared directly, and package-manager/lockfile evidence is present |

## 3. Behavior matrix

For each user-visible feature, verify:

1. semantic intent is normalized before gameplay;
2. rejection/precondition behavior is explicit;
3. authoritative state changes once and in deterministic order;
4. low-frequency events represent facts after the state transition;
5. correlation metadata is preserved across derived facts when used;
6. presentation and UI read the result without becoming authority;
7. the outcome is provable headlessly;
8. retries, duplicates, pause/stop, and invalid inputs have defined behavior.

Prefer state and trace assertions over internal function-call assertions.

## 4. Lifecycle matrix

| Phase | Verify |
| --- | --- |
| Construct | No hidden external boot, invalid configuration fails with context |
| Install | Module/system/listener order is deterministic; handles bind once |
| Boot | Service dependencies are ready before consumers; diagnostics identify failing service/stage |
| Start | Runtime enters running state once; adapters/sources start as intended |
| Tick | Fixed and variable step semantics are explicit; stopped runtime does no work |
| Stop | Tick/system work stops but module subscriptions remain only when contract requires it |
| Dispose | Reverse cleanup, listener removal, handle unbind, driver/backend/native destruction |
| Repeat | Recreate/restart behavior does not retain stale global/module/native state |

Test cleanup directly. Garbage collection assumptions are not lifecycle evidence.

Include failed and overlapping lifecycle requests: Host hooks are awaited and serialized; a failed dependency prevents consumers from starting; dispose is terminal even with queued start requests. Failed module installation releases already installed modules; the failing module cleans up resources acquired before returning its cleanup. Stop/dispose continues after a listener or cleanup throws and reports all failures. Do not require `stop()` to remove subscriptions that the module contract retains until dispose.

Input tests cover held state becoming neutral on `cancelAll()`, context/scope loss, blur and stop without physical release. Polling sources run before held ticks and own no private RAF/timer. One-shot actions must not accidentally fire from cancellation.

## 5. Gameplay foundation matrix

### Character Controller

- compile and validate motor definitions once; identical state/intent/observation/fixed delta yields identical output;
- preserve jump/dive edges between render sampling and fixed ticks, consuming each sequence once;
- cover relevant ground, slope, step, ceiling, coyote/jump buffer, moving platform and external impulse behavior with the selected backend;
- player and AI share the same intent/motor path, without camera/native/animation state in checkpoints;
- prediction restores body and motor timers at the same tick and resets contributors on generation/membership changes;
- use `physics-core/testing` only in tests; a memory fixture does not prove native collision behavior.

### AI

- perception updates, utility ranking, task selection, interruption, and scheduling order are deterministic;
- work budgets are bounded and exhaustion has defined continuation behavior;
- tasks emit semantic intents through an app-owned sink instead of mutating Physics, Navigation, GAS, or presentation directly;
- task cancellation and module disposal release pending work and handles;
- traces explain goal/task choice and rejection without becoming an unbounded hot-path log.

### Navigation

- `@gamekits/navigation-core` owns request, path/field, status, route sampling, revision, and budget semantics;
- exactly one selected Graph, Grid, or Recast backend owns backend-native queries and data;
- layouts are registered before requests, revisions invalidate stale routes predictably, and released routes cannot be sampled;
- pending, success, unreachable, invalid, cancelled, and backend-failure outcomes are covered;
- query budgets, worker/native cleanup, and module ordering before AI are verified.

### Combat

- app policy owns factions, target relationships, damage formulas, and friendly-fire decisions;
- Combat owns reusable targeting/delivery/hit/projectile semantics without taking ownership from World, Physics, or GAS;
- duplicate contacts and one-hit policies do not apply effects twice;
- projectiles, hitscan, and area delivery have deterministic lifetime, ordering, rejection, and cleanup;
- authoritative effects occur before presentation cues and are proved headlessly.

### Animator

- definitions, parameters, transition priority, layers, markers, and playback frames behave deterministically;
- marker bounds, repeated transitions, stop/dispose, and playback adapter failures are tested;
- clips and markers never decide authoritative damage, movement completion, cooldown, or other gameplay outcomes;
- native clip/mixer objects stay in driver/adapter or presentation code.

### Audio

- music, SFX, dialogue, category/mix, spatial state, pause/resume, and stop semantics are tested as used;
- logical audio state is testable without native devices or node identity;
- owner/category cleanup stops the intended playback and module/app disposal releases backend resources;
- backend failure is observable and gameplay never depends on sound completion for authority.

## 6. Data, save, and multiplayer matrix

### Data and assets

- duplicate and unknown DataTypes fail clearly;
- missing references include source pack, type, ID, field path, and target when available;
- assets resolve from stable references and AssetManager owns load state;
- load failure is not mislabeled as DataRegistry schema failure;
- runtime state never writes back into immutable definitions.

For scoped assets, verify independent/same-name scopes, shared ownership, last-owner unload, cancellation with another waiter, cleanup of late results, and repeated dispose. Test residency limits with retained assets and valid `estimatedBytes`; unowned cache may be evicted, retained resources may not. Confirm objects/playback are destroyed before scope/manager/Driver cleanup, and inspect lifecycle diagnostics instead of assuming native resources were freed.

### Save

- contributors declare stable IDs, scope/tags, version, capture, validate, and restore behavior;
- capture excludes UI focus, selection, held input, renderer/native handles, adapter caches, and diagnostic history;
- compatibility and migrations are tested when versions changed;
- restore order and app pause/resume policy are explicit;
- save/load does not implicitly tick GameRuntime.

All selected required sections, identity and exact versions are validated before any restore. Test candidate construction, restore and activation failures with the old session intact; a successful switch plus old cleanup failure returns `cleanupError` without reapplying the save. Candidate mutable state and SaveManagers are isolated; shared store/Driver ownership survives candidate failure. Save entrypoints stay suspended during load.

For IndexedDB, cover unobserved/stale revision conflicts across connections, failed transaction/quota preserving old data, corrupted primary recovery, explicit backup selection, and connection disposal/versionchange. Use a browser smoke as well as a test-only IndexedDB fixture. `list/exists` must not silently authorize overwrite. File adapters require atomic `replaceFile` and `remove`; do not claim storage transactions imply arbitrary restore rollback.

### Multiplayer

- authority, peer role, command kind, and command order are explicit;
- commands enter gameplay at a deterministic tick boundary;
- invalid/late/duplicate commands have defined handling;
- local authority can reuse the gameplay contract where appropriate;
- provider room/Schema/transport objects remain backend or app server details;
- client playback advances between snapshots and prediction reconciles to authority;
- disconnect/reconnect/dispose releases subscriptions and runtime ownership.

Ordinary clients use Core-managed `clientReplication`; callbacks do not duplicate playback/predict/reconcile scheduling. Test stale generation rejection, complete membership/definition resets, prediction lead and history limits, and loss/reordering with bounded redundant delivery. Acknowledgements advance only over simulated contiguous input. Physics islands restore complete authority-declared membership and motor/body state together; replay does not duplicate gameplay/presentation effects. Include diagnostics for exhausted resimulation budgets.

## 7. Presentation and UI matrix

- renderer sync patches only changed/required state and does not broadcast per-frame patches through EventBus;
- native escape hatches are explicit, typed, owned, and disposed;
- animation/audio/camera cues follow authoritative facts or snapshots;
- React and DOM views refresh at bounded frequency and do not subscribe to every World transform;
- gameplay input is blocked by UI, editor, text-input, or DevTools focus scopes;
- interactive UI avoids `innerHTML`, HTML strings, and unstable node replacement;
- animations respect reduced motion and never block gameplay commands;
- tests assert stable projection state rather than native object identity or DOM implementation details.

## 8. Performance matrix

Check the dimension touched by the change:

- runtime tick and individual systems;
- fixed-step physics and interpolation;
- combat/projectile/AI/navigation budgets;
- EventBus/TCA/GAS fan-out;
- snapshot serialization and replication;
- asset preload and service boot waterfall;
- renderer sync/native calls;
- DevTools trace volume and UI refresh;
- save capture/codec/store/restore.

Profiler disabled paths should not allocate large temporary arrays, objects, closures, or React state every frame. Deep trace/detail modes should be opt-in and bounded. Use repository benchmarks as trend gates rather than writing brittle absolute-time unit tests.

## 9. Completion criteria

A GameKits change is ready when:

- acceptance behavior and important rejection paths pass deterministically;
- state, lifecycle, and authority owners are unambiguous;
- public and native dependency boundaries are preserved;
- stop/dispose and repeated setup are verified;
- relevant data, save, replication, presentation, and diagnostics paths are covered;
- actual package/app gates pass;
- real external runtime behavior is smoke-tested when changed;
- hot-path changes have measured evidence;
- documentation matches durable architecture;
- unverified paths and deferrals are explicitly reported.
