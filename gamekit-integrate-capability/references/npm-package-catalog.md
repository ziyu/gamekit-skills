# Published GameKits npm package catalog

## Contents

1. Version and installation rules
2. Core and application packages
3. Gameplay foundation packages
4. Presentation, multiplayer, UI, and tooling packages
5. Supported public subpaths
6. Recommended installation bundles
7. Import examples for the gameplay foundation

## 1. Version and installation rules

This catalog was checked against GameKits `0.1.0-alpha.9` (43 public packages, upstream commit `96c6ad6`). Recheck the selected version's manifests and `exports` before using it with another release. Upstream evidence: [package manifests](https://github.com/ziyu/gamekits/tree/main/packages) and [release model](https://github.com/ziyu/gamekits/blob/main/docs/release.md).

All packages in this catalog use the `@gamekits/*` npm scope. GameKits uses lockstep releases. For a new app or requested upgrade, resolve the chosen channel once:

```bash
corepack pnpm view @gamekits/core@alpha version
corepack pnpm view @gamekits/ai-core@0.1.0-alpha.9 version
```

Verify every selected package at the resolved exact version, then install with the project's package manager. The commands below use the verified `0.1.0-alpha.9` baseline; substitute the selected exact version throughout. For capability additions, reuse the existing app version unless upgrading is part of the request. Preserve both the manifest and lockfile.

```bash
corepack pnpm add --save-exact @gamekits/core@0.1.0-alpha.9 @gamekits/ai-core@0.1.0-alpha.9
```

Use these rules:

- Pin one exact version across the selected GameKits package set and its internal dependency closure. Independently resolving `@alpha` for each installation can drift during a release.
- Do not use the bare package name while `latest` can lag behind `alpha`.
- Declare every package imported by the app as a direct dependency.
- Install peer dependencies such as React, ReactDOM, Vitest, and provider SDKs when the selected package declares them.
- Import only the package root or a documented public subpath.
- Confirm the resolved set with `corepack pnpm list '@gamekits/*'` or the package manager's equivalent.

When upgrading across the namespace change, inspect named exports too: React UI uses `GameKitsUiShell`, `GameKitsStyleProvider`, and `createGameKitsUiAnimator`; the Colyseus server entry uses `GameKitsColyseusRoom` and `createGameKitsColyseusServer`. Existing domain names such as `GameRuntime` remain unchanged. The npm scope is already `@gamekits/*`; do not invent package aliases during migration.

## 2. Core and application packages

| Package | Responsibility | Placement |
| --- | --- | --- |
| `@gamekits/core` | Registry, Clock, RNG, GameModule, errors, common contracts | Core runtime |
| `@gamekits/event-bus` | Low-frequency gameplay/runtime facts | Core runtime |
| `@gamekits/game-runtime` | World, module installation, systems, clock, tick lifecycle | Core runtime |
| `@gamekits/world` | Backend-neutral ECS facade | Runtime facade |
| `@gamekits/world-koota` | Koota implementation of World | Adapter |
| `@gamekits/data` | DataTypes, DataPacks, validation, references, source tracking | App Service |
| `@gamekits/asset` | Asset definitions, load state, loader delegation | App Service |
| `@gamekits/save` | Slots, store, codec, migrations, contributor registry | Service + contributor bridge |
| `@gamekits/save-indexeddb` | Transactional browser slots, revision conflicts, integrity checks, one backup | Concrete store adapter selected by the app/profile |
| `@gamekits/app-host` | Service composition, profiles, lifecycle, diagnostics | Composition |
| `@gamekits/platform-core` | Platform capability facade | App Service facade |
| `@gamekits/platform-web` | Browser platform implementation | Adapter |
| `@gamekits/driver-core` | Driver registry, capabilities, native boundary | App Service facade |
| `@gamekits/driver-phaser` | Phaser runtime owner and capability provider | Driver |
| `@gamekits/driver-three` | Three.js runtime owner and capability provider | Driver |
| `@gamekits/renderer-core` | RenderObject, RenderNode, commands, renderer contract | App Service facade |
| `@gamekits/renderer-phaser` | Phaser renderer mapping | Adapter |
| `@gamekits/input-core` | Input normalization, actions, contexts, scopes | Service + module bridge |
| `@gamekits/input-dom` | DOM keyboard, pointer, and gamepad sources | Adapter |
| `@gamekits/camera-core` | Camera controller, rig, action and sync helpers | Game Module toolkit |

## 3. Gameplay foundation packages

| Package | Responsibility | Key boundary |
| --- | --- | --- |
| `@gamekits/tca` | Trigger/Condition/Action rules and trace | Low-frequency rules, not per-frame logic |
| `@gamekits/gas` | Actors, abilities, effects, execution phases, cues | Gameplay semantics backed by World state |
| `@gamekits/physics-core` | Bodies, colliders, queries, contacts, fixed-step module | Core owns semantics; backend owns solving |
| `@gamekits/physics-rapier2d` | Rapier 2D physics backend | Backend adapter |
| `@gamekits/physics-rapier3d` | Rapier 3D physics backend | Backend adapter |
| `@gamekits/character-controller` | Compiled motor profiles, buffered control intent, deterministic locomotion state and commands | Optional gameplay toolkit; consumes Physics contracts without owning the solver |
| `@gamekits/combat` | Delivery, target relationship, hits, projectiles, GAS effect bridge | Uses World, Physics, and GAS; owns none of them |
| `@gamekits/ai-core` | Perception memory, utility goals, tasks, scheduler, intents, trace | Authority-only decision toolkit |
| `@gamekits/navigation-core` | Layouts, path/field requests, route sampling, revisions, budgets | Backend-neutral navigation facade |
| `@gamekits/navigation-graph` | Authored graph paths and route fields | Sparse semantic routes |
| `@gamekits/navigation-grid` | Deterministic grid paths and route fields | Tile/raster spaces |
| `@gamekits/navigation-navmesh` | Backend-neutral navmesh authoring data | Serializable source contract |
| `@gamekits/navigation-recast` | Recast/Detour generation and navigation backend | WASM/native adapter boundary |

Integration order for AI-driven combat:

```text
Navigation backend/module
→ AI module and intent sink
→ gameplay movement/ability intent
→ GAS execution phase
→ Combat delivery
→ Physics query/contact
→ GAS effect
→ Animator/Audio/Renderer presentation
```

## 4. Presentation, multiplayer, UI, and tooling packages

| Package | Responsibility | Placement |
| --- | --- | --- |
| `@gamekits/animator-core` | Semantic graphs, parameters, layers, transitions, markers, playback frames | Session presentation module |
| `@gamekits/audio-core` | Music, SFX, dialogue, mix, spatial audio, logical playback | App Service + presentation mapping |
| `@gamekits/multiplayer-core` | Sessions, commands, authority binding, replication, prediction, diagnostics | Service + Game Module bridge |
| `@gamekits/multiplayer-memory` | Deterministic local/memory multiplayer backend | Test/offline backend |
| `@gamekits/multiplayer-colyseus` | Colyseus client and room-side integration | Backend adapter |
| `@gamekits/ui-core` | Headless windows, panels, focus, commands | UI facade |
| `@gamekits/react-ui` | React implementation and shared styles | UI adapter |
| `@gamekits/devtools` | Diagnostics, data sources, trace, profiler, panels | Tooling service |
| `@gamekits/devtools-ui` | React DevTools shell and standard styles | Tooling UI |
| `@gamekits/test-utils` | Memory fixtures and conformance helpers | Development dependency |

## 5. Supported public subpaths

Use subpaths only for their intended audience:

| Import | Consumer |
| --- | --- |
| `@gamekits/ai-core/testing` | AI conformance and memory fixtures in tests |
| `@gamekits/animator-core/playback` | Driver/adapter playback implementations |
| `@gamekits/animator-core/testing` | Animator conformance and memory playback adapter |
| `@gamekits/audio-core/backend` | Audio backend/driver implementations |
| `@gamekits/audio-core/testing` | Audio backend conformance, Memory and Null backends |
| `@gamekits/navigation-core/backend` | Graph/Grid/NavMesh/worker backend implementations |
| `@gamekits/navigation-core/testing` | Navigation conformance and memory/deferred backends |
| `@gamekits/physics-core/testing` | Physics backend conformance and deterministic memory fixtures in tests |
| `@gamekits/multiplayer-colyseus/server` | Colyseus room-side runtime integration |
| `@gamekits/react-ui/styles.css` | React UI base styles |
| `@gamekits/devtools-ui/styles.css` | DevTools UI styles |

Gameplay code must use root facades. Do not import `/backend`, `/playback`, `/testing`, or `/server` subpaths into reusable gameplay modules.

## 6. Recommended installation bundles

Start with the headless runtime bundle, then add only the specialized bundle required by the app. If app code imports a transitive GameKits dependency directly, install it directly as well.

### Headless runtime

```bash
corepack pnpm add --save-exact @gamekits/core@0.1.0-alpha.9 @gamekits/event-bus@0.1.0-alpha.9 @gamekits/game-runtime@0.1.0-alpha.9 @gamekits/world@0.1.0-alpha.9 @gamekits/world-koota@0.1.0-alpha.9 @gamekits/data@0.1.0-alpha.9
```

### Phaser web application additions

```bash
corepack pnpm add --save-exact @gamekits/app-host@0.1.0-alpha.9 @gamekits/platform-core@0.1.0-alpha.9 @gamekits/platform-web@0.1.0-alpha.9 @gamekits/driver-core@0.1.0-alpha.9 @gamekits/driver-phaser@0.1.0-alpha.9 @gamekits/renderer-core@0.1.0-alpha.9 @gamekits/renderer-phaser@0.1.0-alpha.9 @gamekits/input-core@0.1.0-alpha.9 @gamekits/input-dom@0.1.0-alpha.9 @gamekits/camera-core@0.1.0-alpha.9 @gamekits/asset@0.1.0-alpha.9
```

### Three.js web application additions

```bash
corepack pnpm add --save-exact @gamekits/app-host@0.1.0-alpha.9 @gamekits/platform-core@0.1.0-alpha.9 @gamekits/platform-web@0.1.0-alpha.9 @gamekits/driver-core@0.1.0-alpha.9 @gamekits/driver-three@0.1.0-alpha.9 @gamekits/renderer-core@0.1.0-alpha.9 @gamekits/input-core@0.1.0-alpha.9 @gamekits/input-dom@0.1.0-alpha.9 @gamekits/camera-core@0.1.0-alpha.9 @gamekits/asset@0.1.0-alpha.9
```

### Combat with Rapier 2D

```bash
corepack pnpm add --save-exact @gamekits/gas@0.1.0-alpha.9 @gamekits/physics-core@0.1.0-alpha.9 @gamekits/physics-rapier2d@0.1.0-alpha.9 @gamekits/combat@0.1.0-alpha.9
```

### Character movement with Rapier 3D

```bash
corepack pnpm add --save-exact @gamekits/character-controller@0.1.0-alpha.9 @gamekits/physics-core@0.1.0-alpha.9 @gamekits/physics-rapier3d@0.1.0-alpha.9
```

Use the toolkit when its locomotion semantics fit; verify backend support before promising equivalent 2D behavior. Attacks, damage, and camera control remain app concerns.

### Durable browser saves

```bash
corepack pnpm add --save-exact @gamekits/save@0.1.0-alpha.9 @gamekits/save-indexeddb@0.1.0-alpha.9
```

Select the store in app/profile composition. For replacement of a running session, `createSaveSessionController` comes from `@gamekits/app-host`; install that package directly if imported.

### AI with graph or grid navigation

```bash
corepack pnpm add --save-exact @gamekits/ai-core@0.1.0-alpha.9 @gamekits/navigation-core@0.1.0-alpha.9 @gamekits/navigation-graph@0.1.0-alpha.9
corepack pnpm add --save-exact @gamekits/ai-core@0.1.0-alpha.9 @gamekits/navigation-core@0.1.0-alpha.9 @gamekits/navigation-grid@0.1.0-alpha.9
```

### AI with Recast navigation

```bash
corepack pnpm add --save-exact @gamekits/ai-core@0.1.0-alpha.9 @gamekits/navigation-core@0.1.0-alpha.9 @gamekits/navigation-navmesh@0.1.0-alpha.9 @gamekits/navigation-recast@0.1.0-alpha.9
```

### Animator and audio presentation

```bash
corepack pnpm add --save-exact @gamekits/animator-core@0.1.0-alpha.9 @gamekits/audio-core@0.1.0-alpha.9 @gamekits/asset@0.1.0-alpha.9 @gamekits/renderer-core@0.1.0-alpha.9
```

### Multiplayer with Colyseus

```bash
corepack pnpm add --save-exact @gamekits/multiplayer-core@0.1.0-alpha.9 @gamekits/multiplayer-colyseus@0.1.0-alpha.9
```

### React UI, DevTools, and tests

```bash
corepack pnpm add --save-exact @gamekits/ui-core@0.1.0-alpha.9 @gamekits/react-ui@0.1.0-alpha.9 @gamekits/devtools@0.1.0-alpha.9 @gamekits/devtools-ui@0.1.0-alpha.9 react@^18.3.1 react-dom@^18.3.1
corepack pnpm add --save-exact -D @gamekits/test-utils@0.1.0-alpha.9 vitest@^3.1.3
```

## 7. Import examples for the gameplay foundation

```ts
import { createAiDataTypes, createAiHandle, createAiModule } from "@gamekits/ai-core";
import {
  createNavigationDataTypes,
  createNavigationHandle,
  createNavigationModule
} from "@gamekits/navigation-core";
import { createGraphNavigationBackendFactory } from "@gamekits/navigation-graph";
import { createGridNavigationBackendFactory } from "@gamekits/navigation-grid";
import { createNavigationNavMeshDataType } from "@gamekits/navigation-navmesh";
```

```ts
import { createCombatDataTypes, createCombatHandle, createCombatModule } from "@gamekits/combat";
import { createAnimatorDataTypes, createAnimatorHandle, createAnimatorModule } from "@gamekits/animator-core";
import { createGameAudio } from "@gamekits/audio-core";
import {
  compileCharacterMotorDefinition,
  createCharacterControlIntentBuffer,
  observeCharacterEnvironment,
  stepCharacterMotor
} from "@gamekits/character-controller";
// App/profile composition only:
import { createIndexedDbSaveStore } from "@gamekits/save-indexeddb";
import { createSaveSessionController } from "@gamekits/app-host";
```

Use type-only imports for public declaration-only subpaths:

```ts
import type { AnimationPlaybackAdapter } from "@gamekits/animator-core/playback";
import type { AudioBackend } from "@gamekits/audio-core/backend";
```

For Recast, initialize its runtime before creating the backend factory:

```ts
import {
  createRecastNavigationBackendFactory,
  initializeRecastNavigation
} from "@gamekits/navigation-recast";
```
