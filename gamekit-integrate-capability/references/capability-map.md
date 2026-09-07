# GameKits capability map

## Contents

1. Placement legend
2. Package scope and installation
3. Capability table
4. Integration chains
5. High-risk boundary checks
6. Evidence to collect

## 1. Placement legend

- **Service**: application/window/platform/external-handle lifecycle managed through App Host.
- **Module**: session/gameplay lifecycle installed into GameRuntime.
- **Driver**: sole owner of a cross-protocol external runtime.
- **Adapter**: mapping for one GameKits protocol.
- **Toolkit/facade**: stable semantic contract consumed by a service or module.
- **App**: game-specific definitions, policies, content, presentation, and provider projections.

## 2. Package scope and installation

Install published GameKits packages from npm under `@gamekits/*`. Use the app’s installed exact release for additions; resolve a channel once for a new app or requested upgrade. GameKits publishes in lockstep. Commands here show the verified `0.1.0-alpha.9` baseline; substitute the selected version throughout. Use the project’s existing package manager.

```bash
corepack pnpm view @gamekits/app-host dist-tags --json
corepack pnpm add --save-exact @gamekits/app-host@0.1.0-alpha.9 @gamekits/core@0.1.0-alpha.9
```

Import the exact installed package name:

```ts
import { defineGameApp } from "@gamekits/app-host";
```

Verify each `@gamekits/<slug>` separately. If npm returns `E404`, report that the capability is not currently published and omit it.

Install GameKits packages that the target imports as direct dependencies. Install peers such as React, ReactDOM, Vitest, or Tauri APIs explicitly when the selected published package declares them.
Use [npm-package-catalog.md](npm-package-catalog.md) for the complete published package list, supported public subpaths, and ready-to-run installation bundles.

## 3. Capability table

Verify the current upstream docs and package exports before implementation.

| Capability | Semantic packages | Typical placement | Main integration rule |
| --- | --- | --- | --- |
| Core runtime | `core`, `event-bus`, `game-runtime` | Runtime facade + modules | Keep GameRuntime limited to modules, clock, systems, world, and low-frequency events |
| World/ECS | `world`, `world-koota` | Facade + adapter | Gameplay imports `world`; Koota remains in its adapter |
| App composition | `app-host` | Service composition | Definition declares needs; profile supplies environment objects and parameters |
| Platform | `platform-core`, `platform-web`, `platform-tauri` | Service + adapter | Files, storage, clipboard, permissions, paths, and window APIs stay behind platform facade |
| Driver | `driver-core`, `driver-phaser`, `driver-three` | Driver service | One owner creates the external runtime and exposes capabilities |
| Renderer | `renderer-core`, `renderer-phaser`, driver capability | Service facade + adapter | Use RenderObject/RenderNode/RenderCommand; do not make Sprite the public contract |
| Input | `input-core`, `input-dom`, driver capability | Service source + module bridge | Normalize raw input, then apply context/scope/action rules before gameplay |
| Camera | `camera-core` plus renderer camera adapter | Module toolkit | Camera state is session behavior; sync it to the renderer through a bridge |
| Data | `data` | Service | Register immutable typed definitions and reference graph; never store hot state here |
| Assets | `asset` plus driver/loader adapter | Service + consumer scopes | AssetManager owns loading/residency; scopes retain resources; adapters own native unload |
| Physics | `physics-core`, `physics-rapier2d`, `physics-rapier3d`, or another backend | Module + backend adapter | Core owns GameKits scene/body/query semantics; backend owns solving/native objects |
| Character movement | `character-controller` + `physics-core` | Session gameplay toolkit | Compile profiles once; player/AI share intent; fixed ticks own motor state and Physics commands |
| Combat | `combat` | Module toolkit | App supplies relationships, targets, and formulas; toolkit supplies reusable delivery semantics |
| TCA | `tca` | Module | Use for low-frequency Trigger/Condition/Action rules with trace; not frame-by-frame movement |
| GAS | `gas` | Module | Use for actor/ability/effect semantics with World-backed hot state and trace |
| Navigation | `navigation-core` plus graph/grid/navmesh/recast backend | Module + backend | Core owns request/path semantics; backend owns graph, grid, navmesh, or native query details |
| AI | `ai-core` | Module toolkit | AI owns perception memory, goals, tasks, budgets, trace; app owns behaviors and intent sink |
| Animator | `animator-core` plus driver playback adapter | Module + presentation adapter | Core owns semantic graph/controller/layers; driver owns native clips and mixers |
| Audio | `audio-core` plus backend/driver | Service facade used by presentation | Gameplay emits semantic cues; backend owns channels/nodes/native playback |
| Multiplayer | `multiplayer-core`, `multiplayer-memory`, `multiplayer-colyseus` | Service connection + module command bridge + backend | Core owns stable command/replication semantics; provider owns room/transport/presence/reconnect |
| Save | `save`, optional `save-indexeddb` | Service + store adapter + module contributors | Contributors own semantic state; app owns store and candidate-session activation |
| UI | `ui-core`, `react-ui` | Service/UI shell | UI consumes low-frequency snapshots and sends commands; React does not run gameplay |
| DevTools | `devtools`, `devtools-ui` | Service/tool UI | Observe stable sources and bounded traces without becoming a gameplay dependency |
| Test utilities | `test-utils` | Test only | Reuse protocol-compatible memory/headless fixtures and conformance helpers |

The package names in this table are slugs. Install and import them with the full npm scope, for example `@gamekits/ai-core`, `@gamekits/combat`, and `@gamekits/navigation-grid`.

## 4. Integration chains

### Data-backed asset

```text
DataType definition
→ DataPack registration
→ AssetDefinition/reference validation
→ AssetManager registration
→ consumer AssetScope load or Host preload scope
→ presentation uses stable AssetRef
→ destroy render objects / stop playback
→ await scope release/dispose
```

Do not make DataRegistry manage binary load state. Do not make the asset adapter interpret gameplay definitions.

Scoped loading requires loader `unload` support; custom AssetManager implementations must implement the current lifecycle contract. Each scope retains an asset once, and shared assets survive until other owners release them. Plain `load/loadGroup` remains cache-oriented; residency limits evict only unowned entries. A byte budget requires manifest `estimatedBytes`, not measured GPU memory. Inspect `lifecycleSnapshot()` for load/residency pressure.

Cancellation releases one caller's wait; only the last waiter cancels the shared request. Adapters clean up late results. Await cleanup before reusing the same resource identity. Disposal order is objects/playback → scopes → manager → Driver; a shared manager may opt out of Host disposal while the Host still releases its own scopes.

### Character locomotion

```text
compileCharacterMotorDefinition at setup
→ app maps player/camera-relative or AI input to world-space intent
→ createCharacterControlIntentBuffer preserves discrete edges
→ fixed tick consumes intent and observes the Physics environment
→ stepCharacterMotor produces state and body commands
→ Physics step → presentation reads motor facts/state
```

Jump/dive edges are consumed by simulation ticks, not cleared by render frames. Apply app modifiers before compilation; no definition parsing belongs in each fixed tick. Keep camera, input devices, native handles, and animation timing out of motor state. Use `createCharacterMotorPredictionContributor` when joining a Physics prediction island so body and motor timers restore at the same tick.

### Physics-backed combat

```text
app content/policy
→ physics body/collider materialization
→ fixed-step physics module
→ contact/query result
→ combat delivery/hit resolution
→ GAS or app state mutation
→ low-frequency fact/cue
→ presentation
```

Keep collision response and every-step transforms in hot runtime state. Emit only meaningful facts.

### Navigation-backed AI

```text
app behavior definitions
→ AI perception/goal/task budget
→ intent sink
→ navigation request/handle
→ backend path query
→ movement system or physics intent
→ bounded trace
```

AI does not own World, Physics, or the navigation backend. Navigation does not implement app behavior.

### Multiplayer authority

```text
normalized client command
→ multiplayer command queue at tick boundary
→ authority gameplay module/system
→ authoritative snapshot or semantic replication
→ client playback/projector
→ presentation apply hook
```

Reuse the same gameplay command contract for local authority where practical. Keep provider Schema and room objects app/backend-local.

Use the standard Multiplayer GameModule's `clientReplication` configuration for ordinary clients. Declare decoder/binding, remote tracks, deterministic transition, predicted fields, and final frame writer; Core owns input sampling/send, acknowledgement reconciliation, playback, and correction. Network callbacks and app render loops must not become a second scheduler.

Choose prediction per behavior: input replay for controlled movement, managed lifecycle domains for event-driven predicted objects, snapshot interpolation for remote objects, and Physics islands for interacting bodies. Generation, membership, and definition changes require a complete baseline reset. Bound history, prediction lead, resimulation, and duplicate side effects. Strict fixed-step delivery uses the managed redundant bundle/inbox, acknowledging only simulated contiguous sequences; do not handwrite resend windows or silently skip gaps.

### Save/load

```text
save: contributors capture semantic state → codec → selected store commits
load: app suspends save entrypoints → capture and migrate one envelope
→ validate all selected required sections before any restore
→ restore and activate an isolated candidate session
→ switch current → dispose old session → app resumes explicitly
```

Do not save selection, hover, held input, renderer handles, React state, diagnostic timelines, or adapter caches.

Select `createIndexedDbSaveStore` in app/profile composition and inject it into the standard Save service. The app owns its connection. Read existing slots before overwrite/delete; `list/exists` does not accept a revision. Handle `save.write_conflict` by rereading and letting the app choose progress, not blind retry. Quota/size failures preserve old data. Integrity recovery can select one valid backup; `load(id, { backup: true })` explicitly requests the previous version. Notify users of progress rollback. Do not automatically migrate or delete legacy storage/file slots.

For replacing a live session, use App Host's `createSaveSessionController`. Its factory creates independent World/Physics/GAS/TCA state and a separate SaveManager; it may share the app-owned store/Driver. Consumers read `controller.current()` rather than caching an old session. Candidate failure disposes the candidate; `cleanupError` after a committed switch is a separate cleanup failure. Suspend autosave and manual save during load: the controller does not serialize direct SaveManager calls. Validation does not roll back arbitrary restore/activation side effects.

File-backed stores require platform support for same-directory atomic `replaceFile` and `remove`. Storage atomicity and session restore isolation are distinct guarantees.

### Failure-safe lifecycle and input

Await Host/Driver hooks. Host requests are serialized; boot/start failure stops the dependent chain, and recovery recreates the Host after disposal. Stop/dispose attempts all reverse cleanups and reports collected errors; dispose is terminal. A module that throws before returning cleanup releases its own partially installed resources.

Consume both `released` and `cancelled` for sustained actions. Host stop invokes `router.cancelAll()`; focus/scope loss may cancel without physical release. Polling sources use Host-controlled `poll(frame)` before Router held ticks, without private RAF/timers.

## 5. High-risk boundary checks

Treat these as design failures unless a documented native escape hatch applies:

- `GameRuntime` imports or creates platform, driver, renderer, input, asset, UI, save store, or connection backends.
- Gameplay modules expose Phaser, Three, Koota, Rapier, Colyseus, DOM, Tauri, React, or GSAP types.
- A renderer/input/camera/asset adapter creates a second runtime already owned by a Driver.
- App Host implements physics, AI, combat, TCA, GAS, or multiplayer gameplay semantics instead of calling the domain factory.
- A concrete backend recreates core lifecycle, snapshot, diagnostics, or session semantics in parallel.
- React subscribes to per-frame World transforms or drives runtime time.
- EventBus carries raw input, pointer movement, every-frame transforms, or render patches.
- SaveManager understands concrete gameplay components instead of contributor contracts.

## 6. Evidence to collect

For a normal capability integration, keep evidence proportional to risk:

1. package-manager command, package source/scope, manifest diff, lockfile diff, and public import diff;
2. definition/profile/module composition test;
3. domain behavior test;
4. lifecycle cleanup test;
5. diagnostics or trace assertion;
6. conformance test for a new adapter;
7. real browser/provider smoke for external runtime work;
8. benchmark or profiler comparison for hot paths.
