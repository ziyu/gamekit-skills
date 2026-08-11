# Published GameKit npm package catalog

## Contents

1. Version and installation rules
2. Core and application packages
3. Gameplay foundation packages
4. Presentation, multiplayer, UI, and tooling packages
5. Supported public subpaths
6. Recommended installation bundles
7. Import examples for the gameplay foundation

## 1. Version and installation rules

All packages in this catalog are published under the `@gamekits/*` npm scope. Resolve the active prerelease before installing:

```bash
corepack pnpm view @gamekits/core@alpha version
corepack pnpm view @gamekits/ai-core@alpha version
```

Install with the project's package manager and commit both the manifest and lockfile.

```bash
corepack pnpm add @gamekits/core@alpha @gamekits/ai-core@alpha
```

Use these rules:

- Use `@alpha` or one exact compatible version for every GameKit package in the same app.
- Do not use the bare package name while `latest` can lag behind `alpha`.
- Declare every package imported by the app as a direct dependency.
- Install peer dependencies such as React, ReactDOM, Vitest, and provider SDKs when the selected package declares them.
- Import only the package root or a documented public subpath.
- Confirm the resolved set with `corepack pnpm list '@gamekits/*'` or the package manager's equivalent.

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
| `@gamekits/multiplayer-colyseus/server` | Colyseus room-side runtime integration |
| `@gamekits/react-ui/styles.css` | React UI base styles |
| `@gamekits/devtools-ui/styles.css` | DevTools UI styles |

Gameplay code must use root facades. Do not import `/backend`, `/playback`, `/testing`, or `/server` subpaths into reusable gameplay modules.

## 6. Recommended installation bundles

Start with the headless runtime bundle, then add only the specialized bundle required by the app. If app code imports a transitive GameKit dependency directly, install it directly as well.

### Headless runtime

```bash
corepack pnpm add @gamekits/core@alpha @gamekits/event-bus@alpha @gamekits/game-runtime@alpha @gamekits/world@alpha @gamekits/world-koota@alpha @gamekits/data@alpha
```

### Phaser web application additions

```bash
corepack pnpm add @gamekits/app-host@alpha @gamekits/platform-core@alpha @gamekits/platform-web@alpha @gamekits/driver-core@alpha @gamekits/driver-phaser@alpha @gamekits/renderer-core@alpha @gamekits/renderer-phaser@alpha @gamekits/input-core@alpha @gamekits/input-dom@alpha @gamekits/camera-core@alpha @gamekits/asset@alpha
```

### Three.js web application additions

```bash
corepack pnpm add @gamekits/app-host@alpha @gamekits/platform-core@alpha @gamekits/platform-web@alpha @gamekits/driver-core@alpha @gamekits/driver-three@alpha @gamekits/renderer-core@alpha @gamekits/input-core@alpha @gamekits/input-dom@alpha @gamekits/camera-core@alpha @gamekits/asset@alpha
```

### Combat with Rapier 2D

```bash
corepack pnpm add @gamekits/gas@alpha @gamekits/physics-core@alpha @gamekits/physics-rapier2d@alpha @gamekits/combat@alpha
```

### AI with graph or grid navigation

```bash
corepack pnpm add @gamekits/ai-core@alpha @gamekits/navigation-core@alpha @gamekits/navigation-graph@alpha
corepack pnpm add @gamekits/ai-core@alpha @gamekits/navigation-core@alpha @gamekits/navigation-grid@alpha
```

### AI with Recast navigation

```bash
corepack pnpm add @gamekits/ai-core@alpha @gamekits/navigation-core@alpha @gamekits/navigation-navmesh@alpha @gamekits/navigation-recast@alpha
```

### Animator and audio presentation

```bash
corepack pnpm add @gamekits/animator-core@alpha @gamekits/audio-core@alpha @gamekits/asset@alpha @gamekits/renderer-core@alpha
```

### Multiplayer with Colyseus

```bash
corepack pnpm add @gamekits/multiplayer-core@alpha @gamekits/multiplayer-colyseus@alpha
```

### React UI, DevTools, and tests

```bash
corepack pnpm add @gamekits/ui-core@alpha @gamekits/react-ui@alpha @gamekits/devtools@alpha @gamekits/devtools-ui@alpha react@^18.3.1 react-dom@^18.3.1
corepack pnpm add -D @gamekits/test-utils@alpha vitest@^3.1.3
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
