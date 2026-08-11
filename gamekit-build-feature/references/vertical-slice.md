# GameKit vertical-slice guide

## Contents

1. Slice worksheet
2. Layer selection
3. Frequency and ownership rules
4. Implementation patterns
5. Test matrix
6. Common incomplete features

## 1. Slice worksheet

Fill only the rows relevant to the feature:

| Question | Decision |
| --- | --- |
| What starts the behavior? | Input action, command, world condition, timer, contact, rule, or authority message |
| Who owns authority? | GameModule/system, authority server, GAS/Combat runtime, or another named owner |
| What state changes? | Component/runtime fields and invariants |
| What rejects it? | Preconditions, scope, resources, cooldown, target validity, authority, or lifecycle phase |
| What is observable? | Fact, cue, trace, snapshot field, render/UI/audio change |
| What persists? | Only state required after reload/reconnect |
| How is it deterministic? | Seed, fixed delta, fake clock, explicit command order, or recorded input |
| What proves cleanup? | Handle unbound, listener removed, runtime disposed, system no longer runs |

## 2. Layer selection

### Content

Use DataTypes and DataPacks when values need stable IDs, references, validation, source attribution, editor/mod delivery, or reusable data-driven variants. Keep transient counters and current positions out of DataRegistry.

### World and systems

Use World components and systems for frequently changing state and iteration-heavy behavior: transforms, velocity, movement intent, targeting candidates, physics sync, cooldown tick, proximity, and renderer sync.

### TCA

Use Trigger/Condition/Action for low-frequency, explainable rules such as objective transitions, unlocks, reactions to facts, encounter progression, and content-authored orchestration. Do not parse rule paths or run broad scans every frame.

### GAS and Combat

Use GAS for stable actor, ability, effect, cue, and clue semantics. Use Combat for reusable delivery, hit resolution, target relationship, projectile/hitscan/area execution, and reconciliation semantics. Keep game-specific numbers and policies in app content or app modules.

### Physics, navigation, and AI

Use Physics for collision/query/solver-backed state, Navigation for path requests and backends, and AI for perception memory, goal/task selection, budgets, and trace. Connect them with narrow handles and app-owned intent policies; do not merge them into one game-specific manager.

### Presentation and UI

Use presentation for renderer objects, animation playback, audio cues, camera response, interpolation, and backend-native escape hatches. Use UI for low-frequency views and commands. Neither layer mutates authoritative gameplay as a side effect of rendering.

### Save and multiplayer

Use SaveContributors for durable semantic state. Use multiplayer command/replication bridges at deterministic tick boundaries. The authority path owns rules; client prediction and presentation must reconcile rather than silently overwrite authority.

## 3. Frequency and ownership rules

| Data or behavior | Correct home | Avoid |
| --- | --- | --- |
| Every-frame transform | World/system and renderer sync | EventBus or React state |
| Held input | Input runtime/state | Low-frequency event fan-out |
| Ability activated | GAS/Combat fact and trace | Renderer callback as authority |
| Objective completed | Module/TCA plus low-frequency fact | UI-only boolean |
| Camera follow target | Camera module/controller | App Host service state |
| Animation clip handle | Driver/presentation adapter | DataType or save payload |
| Current save slot | Save service/app flow | GameRuntime core |
| Player profile progress | Game-owned SaveContributor | DataRegistry mutation |
| Provider room object | Multiplayer backend/server | Reusable gameplay public API |
| Inspector selection | DevTools/UI local state | Save or gameplay event |

## 4. Implementation patterns

### Intent to system

Normalize device input to a semantic action. Store held/axis state in an input state object or component. Let a system consume it during tick. Presentation reads the resulting World state.

### Fact to rule

Emit a small low-frequency fact after authoritative state changed. Carry correlation metadata in the event envelope. Let TCA or another module react without using the fact as the high-frequency state store.

### Ability to feedback

Validate and execute the ability through GAS/Combat or an app module. Apply authoritative effects first. Emit a semantic cue or trace. Map it to animation/audio/renderer/UI in presentation.

### Contact to damage

Advance physics at fixed step, convert backend contact to the stable Physics contract, apply app collision policy and Combat resolution, mutate World/GAS state, then produce meaningful hit/death feedback.

### Authority to client presentation

Queue commands at the authority tick boundary, run the same gameplay contract, publish stable snapshots/records, advance client playback even between network messages, reconcile predictions, and apply presented values through app presentation hooks.

### Save round-trip

Capture IDs and long-lived semantic values, include compatibility metadata, validate before restore, restore in a documented order, and let the app explicitly decide pause/resume. Recreate renderer/native objects from restored semantics.

## 5. Test matrix

| Risk | Minimum evidence |
| --- | --- |
| Pure rule/math | Boundary cases and deterministic examples |
| System ordering | Registered IDs/order and behavior after one or more ticks |
| Event/rule chain | Fact envelope, order, correlation, and no duplicate reaction |
| Content | Duplicate, unknown type, missing reference, invalid path/schema, source location |
| Lifecycle | Install, start, stop, dispose, repeated setup, reverse cleanup when relevant |
| Presentation | Stable projection values and cleanup; no native identity assertions |
| Input scope | Gameplay blocked while UI/text/devtools scope owns focus |
| Save | Capture, validate, codec/store, restore, compatibility, migration if version changed |
| Multiplayer | Authority order, invalid command, reconnect/replay behavior, prediction reconciliation |
| Hot path | Benchmark/profiler delta and bounded allocation/trace behavior |

## 6. Common incomplete features

- An import was added without running the package manager, or the manifest/lockfile still lacks the direct dependency.
- A GameKit import does not use the installed npm `@gamekits/*` package name.
- A button or animation exists, but no authoritative rule changes state.
- A rule works, but raw input bypasses scope/context and fires while UI has focus.
- State changes, but no trace explains rejection or execution.
- Visual objects update, but their subscriptions and native handles survive dispose.
- A DataPack loads, but references, duplicates, and source attribution are untested.
- Save writes JSON, but compatibility, contributor scope, and restore order are undefined.
- Multiplayer messages arrive, but authority, command ordering, and reconciliation are ambiguous.
- Tests call internal helpers but never prove the intent-to-outcome chain.
- The feature passes headlessly but the real driver/provider path was never exercised.
- The visible happy path works while stop, retry, invalid target, or duplicate event behavior remains undefined.
