# GameKit game blueprint

## Contents

1. Starting choices
2. Recommended project shape
3. Package sources and installation
4. Capability presets
5. Composition sequence
6. First-slice acceptance contract
7. Upstream examples

## 1. Starting choices

Answer these from the requested game, not from a generic template:

| Decision | Small default | Choose more only when required |
| --- | --- | --- |
| Runtime | `core`, `event-bus`, `game-runtime`, `world`, one world adapter | Never install every gameplay package by default |
| Renderer | Phaser for an integrated 2D runtime; Three for 3D; headless for simulation-first work | Keep one owner for each external runtime |
| UI | No framework for a tiny lab; React UI for durable game screens | React stays outside the tick loop |
| Data | App-owned DataTypes and one DataPack | Add Assets only when definitions reference loadable payloads |
| Rules | Plain system for hot state; TCA for low-frequency rules; GAS for actors/abilities/effects | Use the smallest semantic layer that fits |
| Platform | Web by default; Tauri through the platform adapter | Platform APIs do not enter gameplay |
| Persistence | Add Save only after long-lived state exists | Do not save transient focus, hover, render handles, or caches |
| Multiplayer | Start local-authority with the same command contract | Add a provider backend only for real room/transport needs |
| AI and paths | `ai-core` plus Graph for sparse authored routes or Grid for tile spaces | Add NavMesh/Recast only when free-form navigation requires it |
| Feedback | `animator-core` and `audio-core` only when the slice has semantic animation or sound cues | Gameplay remains authoritative over timing and outcomes |

## 2. Recommended project shape

Adapt this layout to the repository. Do not create empty directories for capabilities the slice does not use.

```text
src/
  app-definition.ts
  main.ts
  profiles/
    web.ts
    deterministic-test.ts
  content/
    data-types.ts
    pack.ts
  game/
    create-runtime.ts
    components.ts
    modules/
      player-module.ts
  presentation/
    player-presentation.ts
  ui/
    GameApp.tsx
  test/
    game-slice.test.ts
```

Responsibilities:

- `app-definition.ts`: serializable service requirements and configuration sources.
- `profiles/*`: platform/runtime objects, drivers, adapters, and environment-specific parameters.
- `content/*`: immutable definitions and references, never hot runtime state.
- `game/*`: authoritative session state, systems, rules, and GameModule lifecycle.
- `presentation/*`: state projection, render objects, cues, animation, and native escape hatches.
- `ui/*`: low-frequency view state and commands.
- `test/*`: deterministic runtime and boundary evidence.

## 3. Package source and installation

Install GameKit from the npm registry under the `@gamekits/*` scope. Use `alpha` or an exact version after verifying the requested package and dist-tag.

```bash
corepack pnpm view @gamekits/core dist-tags --json
corepack pnpm add @gamekits/core@alpha
```

Import the exact installed package name:

```ts
import { Clock } from "@gamekits/core";
```

Apply the same rule to every package in this guide. For example, install `@gamekits/app-host@alpha` before importing `@gamekits/app-host`.

Before installing a capability, run `corepack pnpm view @gamekits/<slug> dist-tags --json`. If npm returns `E404`, report that the package is not currently published and omit that capability. Do not invent another package source or import a private file path.

Run package-manager commands from the project root so the manifest and lockfile update together. Use the project's existing package manager when it is not pnpm.
Keep the selected GameKit packages on one verified prerelease channel or explicitly compatible exact versions. Confirm the installed set after every preset:

```bash
corepack pnpm list '@gamekits/*'
```

## 4. Capability presets

Verify current npm availability, package exports, and versions before installing a preset.

### Minimal deterministic simulation

- `@gamekits/core`
- `@gamekits/event-bus`
- `@gamekits/game-runtime`
- `@gamekits/world`
- one World implementation, commonly `@gamekits/world-koota`
- `@gamekits/test-utils` for compatible fixtures when available

Standalone npm example:

```bash
corepack pnpm add @gamekits/core@alpha @gamekits/event-bus@alpha @gamekits/game-runtime@alpha @gamekits/world@alpha @gamekits/world-koota@alpha
corepack pnpm add -D @gamekits/test-utils@alpha vitest@^3.1.3
```

### Visual 2D game

Add:

- `@gamekits/app-host`
- `@gamekits/platform-web`
- `@gamekits/driver-phaser`
- `@gamekits/renderer-core`
- `@gamekits/input-core`
- optionally `@gamekits/input-dom`
- `@gamekits/asset` and `@gamekits/data` when content is asset-backed

Standalone npm example:

```bash
corepack pnpm add @gamekits/app-host@alpha @gamekits/platform-web@alpha @gamekits/driver-phaser@alpha @gamekits/renderer-core@alpha @gamekits/input-core@alpha @gamekits/input-dom@alpha @gamekits/asset@alpha @gamekits/data@alpha
```

Let the Phaser Driver own the shared Phaser runtime and derive renderer, input, camera, asset, animator, audio, or physics capabilities that it actually exposes. Do not create separate competing Phaser runtimes.

### Visual 3D game

Add:

- `@gamekits/app-host`
- `@gamekits/platform-web`
- `@gamekits/driver-three`
- `@gamekits/renderer-core`
- an input source and camera module appropriate to the game

Verify `@gamekits/driver-three` exists before adding 3D support. If it is unavailable, report the capability as unavailable.

Keep native Three scene/camera access in presentation, profile, backend, or an explicitly named native boundary.

### Data-driven action game

Add only the semantic layers the design uses:

- `@gamekits/data` for definitions and source tracking;
- `@gamekits/asset` for load state and adapter delegation;
- `@gamekits/tca` for Trigger/Condition/Action rules;
- `@gamekits/gas` for actors, abilities, effects, cues, and clues;
- `@gamekits/physics-core` plus one backend for physical state;
- `@gamekits/combat` for reusable delivery and hit-resolution semantics;
- `@gamekits/ai-core` plus navigation packages for agent decisions and paths;
- `@gamekits/animator-core` and `@gamekits/audio-core` for semantic presentation control.

Install only the bundle required by the first slice.

#### Combat with Rapier 2D

```bash
corepack pnpm add @gamekits/gas@alpha @gamekits/physics-core@alpha @gamekits/physics-rapier2d@alpha @gamekits/combat@alpha
```

`@gamekits/combat` owns reusable delivery and hit-resolution semantics. The app still owns target relationships, damage formulas, and gameplay policy; Physics owns queries/contacts and GAS owns effects.

#### AI with Graph or Grid navigation

```bash
corepack pnpm add @gamekits/ai-core@alpha @gamekits/navigation-core@alpha @gamekits/navigation-graph@alpha
corepack pnpm add @gamekits/ai-core@alpha @gamekits/navigation-core@alpha @gamekits/navigation-grid@alpha
```

Use Graph for sparse authored routes and Grid for deterministic tile/raster spaces. Install the navigation module before the AI module so tasks can request paths through a ready handle.

#### AI with Recast navigation

```bash
corepack pnpm add @gamekits/ai-core@alpha @gamekits/navigation-core@alpha @gamekits/navigation-navmesh@alpha @gamekits/navigation-recast@alpha
```

Keep Recast initialization and native data inside the navigation backend boundary. Gameplay and AI consume `@gamekits/navigation-core` handles and route semantics.

#### Animator and audio presentation

```bash
corepack pnpm add @gamekits/animator-core@alpha @gamekits/audio-core@alpha @gamekits/asset@alpha @gamekits/renderer-core@alpha
```

Use `@gamekits/animator-core` for semantic states, transitions, layers, parameters, and markers. Use `@gamekits/audio-core` for logical music, SFX, dialogue, mix, and spatial playback. Native clips, mixers, audio nodes, and device APIs stay in drivers or adapters.

## 5. Composition sequence

Keep startup observable and ordered:

```text
resolve app/profile config
→ create platform and drivers
→ register DataTypes
→ register materialized DataPacks
→ prepare assets
→ create World/EventBus/GameRuntime
→ install standard and app GameModules in explicit order
→ boot/start application services
→ enter the app-owned frame loop
```

Use a headless profile to reuse the same definition and module graph without browser or native UI handles. A production server profile should inject real server platform, physics, and multiplayer owners rather than silently substituting memory fixtures.

## 6. First-slice acceptance contract

A bootstrap is complete when all are true:

- One real player intent reaches a normalized action or command.
- Authoritative state changes in a system or module.
- Presentation or UI observes the result without owning it.
- The same rule can be proven without the visual renderer.
- Module install order is explicit when order affects behavior.
- Stop/dispose behavior is tested.
- Diagnostics identify boot failures or gameplay facts at the correct layer.
- No external backend type crosses a reusable gameplay boundary.

## 7. Upstream examples

Use the closest current example from the [official GameKit GitHub repository](https://github.com/ziyu/gamekit) as evidence, not as a template to copy blindly:

- [Abyss Delve](https://github.com/ziyu/gamekit/tree/main/apps/abyss-delve): real single-player game composition.
- [Multiplayer Outpost Siege](https://github.com/ziyu/gamekit/tree/main/apps/multiplayer-outpost-siege-demo): comprehensive multi-profile and authority composition.
- [Multiplayer Demo](https://github.com/ziyu/gamekit/tree/main/apps/multiplayer-demo): focused multiplayer contract and diagnostics.
- [Physics 2D Lab](https://github.com/ziyu/gamekit/tree/main/apps/physics-2d-lab) and [Physics 3D Lab](https://github.com/ziyu/gamekit/tree/main/apps/physics-3d-lab): backend and renderer labs.
- [Three Demo](https://github.com/ziyu/gamekit/tree/main/apps/three-demo): Three Driver composition.
- [Sandbox scenes](https://github.com/ziyu/gamekit/tree/main/apps/sandbox/src/scenes): isolated capability experiments, not sources of reusable game domain protocols.

Always compare the example's package version and public imports with the target project before adapting it.
