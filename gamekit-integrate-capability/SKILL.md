---
name: gamekit-integrate-capability
description: Integrate a published GameKit framework capability into an existing TypeScript game while preserving App Host, GameModule, Driver, Adapter, data, lifecycle, package-source, and test boundaries. Use when installing or adding physics, combat, TCA, GAS, AI, navigation, animation, audio, input, camera, rendering, assets, save, multiplayer, platform, UI, DevTools, or another @gamekits/* npm package.
---

# Integrate a GameKit Capability

Add one capability through the existing composition graph. Avoid app-local parallel runtimes that duplicate a GameKit core semantic owner.

## Build the capability baseline

1. Read repository instructions, architecture documents, package manifests, and the current app definition/profile/runtime composition.
2. Inspect the exact installed GameKit scope, package versions, package manager, lockfile, and public exports.
3. Locate the relevant current GameKit module document and the closest upstream app or conformance test.
4. Read the relevant row and notes in [capability-map.md](references/capability-map.md).
5. Search for existing handles, services, modules, DataTypes, adapters, and tests before creating anything.

Do not assume every GameKit capability is published or on the same prerelease version. Add a compatible dependency closure rather than replacing all versions casually.

## Resolve package source before importing

Install GameKit from the npm registry under the `@gamekits/*` scope:

- Verify and install `@gamekits/<slug>` with the project's existing package manager, then import that exact package name.
- Do not add an import unless the published package was added as a direct dependency.
- Never hand-edit package dependencies or the lockfile. Run the package manager so both remain synchronized.
- If npm returns `E404`, report the capability as not currently published and do not invent another source or deep import.

Example for a standalone physics integration:

```bash
corepack pnpm view @gamekits/physics-core dist-tags --json
corepack pnpm view @gamekits/physics-rapier2d dist-tags --json
corepack pnpm add @gamekits/physics-core@alpha @gamekits/physics-rapier2d@alpha
```

```ts
import type { PhysicsBackendAdapter } from "@gamekits/physics-core";
import { initRapier2dPhysicsBackend } from "@gamekits/physics-rapier2d";
```

Read the package's `exports` before using a subpath. Deep-importing unexported `src/` or `dist/` files is forbidden.

## Write the integration contract

State these decisions before editing:

- semantic owner: which `*-core`, facade, or toolkit owns the domain meaning;
- lifecycle owner: App Service, Game Module, Driver, Adapter, or app presentation;
- authoritative state: DataRegistry, World/component state, module runtime, backend, or provider;
- frequency: per-frame hot state, fixed-step state, low-frequency fact, or UI snapshot;
- bridge: service registry, standard module helper, stable handle, EventBus fact, presentation projector, or SaveContributor;
- cleanup: what must unbind, unsubscribe, stop, or dispose;
- evidence: conformance, module, headless composition, integration, and performance tests.

If these answers are ambiguous, inspect upstream design and code until one owner is clear. Do not solve ambiguity by creating another manager.

## Integrate in layers

### 1. Install the semantic package

Run the target repository's package manager to add the core/facade package as a direct dependency of the importing app/package. Add a backend package only when real backend behavior is required. Keep backend-native types behind its adapter, driver, profile, server, or app-specific presentation boundary.

### 2. Register immutable definitions

Register DataTypes and materialized DataPacks before creating gameplay runtimes that consume them. Keep runtime state out of DataRegistry. Validate IDs, references, source attribution, duplicates, and unknown types.

### 3. Compose application lifecycle

Add platform, drivers, renderer, assets, audio, input sources, multiplayer connection, UI, save store, and DevTools through `GameAppDefinition` and profile standard services or extensions.

Use the existing Driver as the sole owner of an integrated external runtime. Select capabilities from it instead of booting another Phaser or Three instance.

### 4. Install session behavior

Add camera, physics, combat, TCA, GAS, AI, navigation, animator, multiplayer command handling, and gameplay save bridges as Game Modules. Prefer a current standard module helper when it matches the requirement. Use an app module when app policies, content, or ordering are specific.

When module order affects behavior, assemble the modules explicitly and test the install/system order and reverse cleanup order.

### 5. Expose a narrow handle

Share session capabilities through the domain's stable handle or facade. Do not put a gameplay runtime in `services.xxx` merely for convenient access. Bind and unbind handles with GameModule lifecycle.

### 6. Add presentation and diagnostics

Project authoritative state to renderer, audio, animator, UI, and multiplayer presentation without moving ownership. Add low-cost snapshots, traces, or diagnostics that explain lifecycle and low-frequency decisions. Keep per-frame patch streams out of EventBus and Host diagnostics.

## Verify the integration

Run the narrowest tests first, then the affected package or app gates. Cover:

- missing adapter/backend and invalid configuration errors;
- boot/start/stop/dispose and cleanup;
- definition/reference validation;
- deterministic system or module behavior;
- headless App Host composition;
- adapter conformance when a new adapter is involved;
- a real visual/provider path when the capability touches one;
- a benchmark or profiler check when a hot path changed.

Compare snapshots only on stable semantic data, never DOM nodes, native handles, absolute wall time, or backend object identity.

## Guardrails

- Reuse core creation functions and lifecycle rather than implementing a parallel session around a third-party library.
- Keep App Host thin; it may resolve dependencies and call a domain factory but must not reimplement gameplay.
- Keep provider room/matchmaking/reconnect behavior in multiplayer backends while gameplay commands and projections remain GameKit/app contracts.
- Use EventBus for low-frequency facts, systems/runtime state for hot paths, and React for low-frequency views.
- Add an ADR and update long-term module/architecture docs when changing package ownership, public protocols, dependency direction, or native escape hatches.
