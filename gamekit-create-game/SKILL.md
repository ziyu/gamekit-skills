---
name: gamekit-create-game
description: Create a new TypeScript game or playable prototype on top of the ziyu/gamekit framework. Use when Codex needs to bootstrap a GameKit app, choose packages and a renderer/platform profile, define the initial GameAppDefinition and AppProfile, create a headless test path, or turn a game idea into the first tested vertical slice.
---

# Create a GameKit Game

Create the smallest playable, testable slice first. Treat GameKit as a composable game framework, not a monolithic engine or a source tree to copy wholesale.

## Establish the live baseline

1. Read the target repository instructions and existing design documents.
2. Inspect the package manager, installed `@gamekits/*` versions, public exports, scripts, and TypeScript settings.
3. Read current official GameKit documentation and the closest official example on GitHub when architecture detail is needed.
4. Prefer installed declarations and package exports over remembered APIs. GameKit packages may be prereleases; resolve the active channel before selecting versions.
5. Read [game-blueprint.md](references/game-blueprint.md) before choosing the initial package set or file layout.

If upstream source is unavailable, inspect the installed package manifests and declaration files. Do not invent an API from package names alone.

## Install GameKit packages

Use the target repository's existing package manager. Do not hand-edit dependencies or the lockfile.

- Install GameKit exclusively from the npm registry under the `@gamekits/*` scope.
- Verify every requested package and dist-tag before installation.
- Use one verified prerelease channel or an explicitly compatible exact-version set across the selected GameKit packages.
- If `@gamekits/<slug>` returns `E404`, report that the capability is not currently published and do not invent another source or deep import.
- Install every package the app imports directly, even when another GameKit package currently depends on it transitively.
- Import only the package root or documented `exports` subpaths.

For a project using the npm alpha channel:

```bash
corepack pnpm view @gamekits/core dist-tags --json
corepack pnpm add @gamekits/core@alpha @gamekits/event-bus@alpha
corepack pnpm list '@gamekits/*'
```

```ts
import { Clock } from "@gamekits/core";
```

## Define the first vertical slice

Write a compact slice contract before adding dependencies:

- player intent: the input or command;
- runtime change: the authoritative state mutation;
- visible feedback: renderer, audio, or UI result;
- outcome: a win, loss, resource, movement, or other observable rule;
- verification: a deterministic headless or module-level test.

Defer unrelated menus, content breadth, editor tooling, multiplayer, persistence, and visual polish unless the slice requires them.

## Choose the composition boundary

Use `GameAppDefinition` to declare which services the app needs. Use `AppProfile` or `createStandardAppProfile` to provide environment-specific adapters, drivers, runtime objects, and boot parameters.

Classify each capability before implementing it:

- Put platform, driver, renderer, assets, audio, input sources, multiplayer connection, UI shell, save store, and DevTools lifecycle in App Services.
- Put world/tick behavior, camera, physics, combat, TCA, GAS, AI, navigation, animator control, replication command handling, and gameplay save bridges in Game Modules.
- Put Phaser or Three runtime ownership in a Driver. Use an Adapter only for a single protocol mapping.
- Keep game-specific content, policies, schemas, and presentation in the app.

Do not make `GameRuntime` own application adapters. Do not put gameplay rules in the App Host.

## Implement in dependency order

1. Create app definition and configuration defaults without DOM or native runtime handles.
2. Create at least one production-facing profile and one deterministic/headless test profile when the app has meaningful runtime behavior.
3. Create the world, EventBus, runtime, and game modules through public GameKit APIs.
4. Register only the DataTypes and DataPacks required by the initial slice.
5. Add the selected driver/adapter and keep native access inside profile, presentation, backend, or explicitly named native files.
6. Normalize input into actions or commands before gameplay consumes it.
7. Synchronize runtime state to renderer/audio/UI through presentation code; do not make presentation authoritative.
8. Add cleanup for subscriptions, observers, animation frames, adapters, drivers, and module handles.
9. Add a deterministic test that proves the slice from intent to outcome.

Preserve a thin `src/index.ts`; use it only for exports. Keep content, runtime modules, presentation, UI, profiles, and tests in separate files.

## Validate the bootstrap

Discover and run the repository's real commands. At minimum, validate:

- the narrowest relevant test;
- TypeScript or package build;
- lint and format checks when configured;
- a headless lifecycle path: boot, start, tick, stop, dispose;
- the visual app when a renderer or UI was added.

Check that `stop()` prevents further systems from running and `dispose()` releases module subscriptions and external runtime resources. Report commands that were unavailable instead of silently replacing them.

## Guardrails

- Do not turn Sandbox-specific concepts into framework protocols.
- Do not import Koota, Phaser, Three, GSAP, Tauri, Colyseus, Rapier, or other backend types into reusable gameplay contracts.
- Do not use EventBus for per-frame position, raw pointer movement, render patches, or held input.
- Do not use React as the gameplay loop or authoritative state store.
- Do not write runtime state back into DataRegistry.
- Do not add a framework abstraction without a real second consumer or variation point.
- If the initial slice exposes a missing reusable GameKit capability, stop treating it as app-local only after checking the framework extension and ADR requirements.
