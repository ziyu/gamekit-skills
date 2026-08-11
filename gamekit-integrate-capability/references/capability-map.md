# GameKit capability map

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
- **Adapter**: mapping for one GameKit protocol.
- **Toolkit/facade**: stable semantic contract consumed by a service or module.
- **App**: game-specific definitions, policies, content, presentation, and provider projections.

## 2. Package scope and installation

Install published GameKit packages from npm under `@gamekits/*`. Always use the package manager already selected by the project; these examples use pnpm.

```bash
corepack pnpm view @gamekits/app-host dist-tags --json
corepack pnpm add @gamekits/app-host@alpha @gamekits/core@alpha
```

Import the exact installed package name:

```ts
import { defineGameApp } from "@gamekits/app-host";
```

Verify each `@gamekits/<slug>` separately. If npm returns `E404`, report that the capability is not currently published and omit it.

Install GameKit packages that the target imports as direct dependencies. Install peers such as React, ReactDOM, Vitest, or Tauri APIs explicitly when the selected published package declares them.
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
| Assets | `asset` plus driver/loader adapter | Service | Asset definitions come from Data; AssetManager owns load state and delegates payload loading |
| Physics | `physics-core`, `physics-rapier2d`, `physics-rapier3d`, or another backend | Module + backend adapter | Core owns GameKit scene/body/query semantics; backend owns solving/native objects |
| Combat | `combat` | Module toolkit | App supplies relationships, targets, and formulas; toolkit supplies reusable delivery semantics |
| TCA | `tca` | Module | Use for low-frequency Trigger/Condition/Action rules with trace; not frame-by-frame movement |
| GAS | `gas` | Module | Use for actor/ability/effect semantics with World-backed hot state and trace |
| Navigation | `navigation-core` plus graph/grid/navmesh/recast backend | Module + backend | Core owns request/path semantics; backend owns graph, grid, navmesh, or native query details |
| AI | `ai-core` | Module toolkit | AI owns perception memory, goals, tasks, budgets, trace; app owns behaviors and intent sink |
| Animator | `animator-core` plus driver playback adapter | Module + presentation adapter | Core owns semantic graph/controller/layers; driver owns native clips and mixers |
| Audio | `audio-core` plus backend/driver | Service facade used by presentation | Gameplay emits semantic cues; backend owns channels/nodes/native playback |
| Multiplayer | `multiplayer-core`, `multiplayer-memory`, `multiplayer-colyseus` | Service connection + module command bridge + backend | Core owns stable command/replication semantics; provider owns room/transport/presence/reconnect |
| Save | `save` | Service manager + module contributors | Manager owns slots/store/codec/migrations; contributors capture game-owned long-lived state |
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
→ loader/driver preload
→ presentation uses stable AssetRef
```

Do not make DataRegistry manage binary load state. Do not make the asset adapter interpret gameplay definitions.

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

### Save/load

```text
pause policy owned by app
→ SaveManager selects contributors
→ contributors capture long-lived semantic state
→ codec/store
→ compatibility and migration check
→ contributors validate/restore
→ app resumes explicitly
```

Do not save selection, hover, held input, renderer handles, React state, diagnostic timelines, or adapter caches.

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
