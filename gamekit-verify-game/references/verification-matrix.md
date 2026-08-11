# GameKit verification matrix

## Contents

1. Baseline inspection
2. Architecture matrix
3. Behavior matrix
4. Lifecycle matrix
5. Data, save, and multiplayer matrix
6. Presentation and UI matrix
7. Performance matrix
8. Completion criteria

## 1. Baseline inspection

Collect before judging code:

- repository instructions and dirty state;
- package manager and actual scripts;
- installed GameKit scope, package source, versions, dist-tag, package exports, and lockfile entries;
- app `GameAppDefinition`, profiles, service graph, and standard/app module assembly;
- closest upstream example and module design document;
- feature tests, integration tests, conformance helpers, and benchmarks already present.

GameKit packages are published under `@gamekits/*`. Every import must match a direct npm dependency installed with a verified dist-tag or exact version. Importing an undeclared package, bypassing the package manager, or missing lockfile evidence is a defect.

Verify npm provenance with the target package manager, for example:

```bash
corepack pnpm view @gamekits/core dist-tags --json
corepack pnpm why @gamekits/core
```

GameKit packages can use different alpha versions or have different publication availability. A version difference is not automatically a defect; incompatible public contracts, source/import mismatch, missing lockfile evidence, or accidental broad upgrades are.

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

## 5. Data, save, and multiplayer matrix

### Data and assets

- duplicate and unknown DataTypes fail clearly;
- missing references include source pack, type, ID, field path, and target when available;
- assets resolve from stable references and AssetManager owns load state;
- load failure is not mislabeled as DataRegistry schema failure;
- runtime state never writes back into immutable definitions.

### Save

- contributors declare stable IDs, scope/tags, version, capture, validate, and restore behavior;
- capture excludes UI focus, selection, held input, renderer/native handles, adapter caches, and diagnostic history;
- compatibility and migrations are tested when versions changed;
- restore order and app pause/resume policy are explicit;
- save/load does not implicitly tick GameRuntime.

### Multiplayer

- authority, peer role, command kind, and command order are explicit;
- commands enter gameplay at a deterministic tick boundary;
- invalid/late/duplicate commands have defined handling;
- local authority can reuse the gameplay contract where appropriate;
- provider room/Schema/transport objects remain backend or app server details;
- client playback advances between snapshots and prediction reconciles to authority;
- disconnect/reconnect/dispose releases subscriptions and runtime ownership.

## 6. Presentation and UI matrix

- renderer sync patches only changed/required state and does not broadcast per-frame patches through EventBus;
- native escape hatches are explicit, typed, owned, and disposed;
- animation/audio/camera cues follow authoritative facts or snapshots;
- React and DOM views refresh at bounded frequency and do not subscribe to every World transform;
- gameplay input is blocked by UI, editor, text-input, or DevTools focus scopes;
- interactive UI avoids `innerHTML`, HTML strings, and unstable node replacement;
- animations respect reduced motion and never block gameplay commands;
- tests assert stable projection state rather than native object identity or DOM implementation details.

## 7. Performance matrix

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

## 8. Completion criteria

A GameKit change is ready when:

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
