import { defineGameModule } from "@gamekit/core";
import { createEventBus, type EventBus } from "@gamekit/event-bus";
import { createGame, type GameInstallContext } from "@gamekit/game-runtime";
import type { RendererAdapter } from "@gamekit/renderer-core";
import type { GameWorld } from "@gamekit/world";
import { Actor, Enemy, Player, Projectile } from "./components";
import { GAME_SEED } from "./constants";
import { createNeonInputState } from "./input-state";
import { createCombatModule } from "./modules/combat-module";
import { createEnemyModule } from "./modules/enemy-module";
import { createInputResetModule } from "./modules/input-reset-module";
import { createPlayerModule } from "./modules/player-module";
import { createPresentationModule } from "./modules/presentation-module";
import { createProgressionModule } from "./modules/progression-module";
import { createSessionModule } from "./modules/session-module";
import { createNeonRunState, type NeonRuntimeState } from "./runtime-state";
import type { NeonGame, NeonSnapshot } from "./types";

export type CreateNeonRuntimeOptions = {
  world: GameWorld;
  eventBus?: EventBus | undefined;
  renderer?: RendererAdapter | undefined;
  seed?: string | undefined;
};

export function createNeonRuntime(options: CreateNeonRuntimeOptions): NeonGame {
  const world = options.world;
  const eventBus = options.eventBus ?? createEventBus({ clock: () => Date.now() });
  const state: NeonRuntimeState = {
    world,
    eventBus,
    input: createNeonInputState(),
    run: createNeonRunState(),
    trace: [],
    traceSequence: 0
  };

  const modules = [
    createTraceModule(state),
    createSessionModule(state),
    createPlayerModule(state),
    createEnemyModule(state),
    createCombatModule(state),
    createProgressionModule(state),
    ...(options.renderer ? [createPresentationModule(state, options.renderer)] : []),
    createInputResetModule(state)
  ];
  const runtime = createGame({
    modules,
    world,
    eventBus,
    seed: options.seed ?? GAME_SEED
  });

  return {
    runtime,
    eventBus,
    input: state.input,
    snapshot() {
      return createSnapshot(state, runtime.isRunning());
    },
    chooseUpgrade(index) {
      state.input.upgradeChoiceRequested = index;
    },
    restart() {
      state.input.restartRequested = true;
    }
  };
}

function createTraceModule(state: NeonRuntimeState) {
  return defineGameModule<GameInstallContext>({
    id: "neon.trace",
    install({ eventBus }) {
      return eventBus.onAny((event) => {
        if (!event.type.startsWith("neon.")) {
          return;
        }
        state.traceSequence += 1;
        state.trace.unshift({
          id: state.traceSequence,
          type: event.type,
          payload: event.payload
        });
        if (state.trace.length > 48) {
          state.trace.pop();
        }
      });
    }
  });
}

function createSnapshot(state: NeonRuntimeState, running: boolean): NeonSnapshot {
  const playerEntity = state.playerEntity;
  const actor = playerEntity === undefined ? undefined : state.world.get(playerEntity, Actor);
  const player = playerEntity === undefined ? undefined : state.world.get(playerEntity, Player);
  return {
    running,
    phase: state.run.phase,
    timeMs: state.run.survivalMs,
    wave: state.run.wave,
    level: state.run.level,
    xp: state.run.xp,
    xpNext: state.run.xpNext,
    kills: state.run.kills,
    score: state.run.score,
    combo: state.run.combo,
    enemyCount: state.world.query([Enemy, Actor]).length,
    projectileCount: state.world.query([Projectile]).length,
    player: {
      health: actor?.health ?? 0,
      maxHealth: actor?.maxHealth ?? 1,
      dashReady: player
        ? 1 - player.dashCooldownRemainingMs / Math.max(1, player.dashCooldownMs)
        : 0,
      damage: player?.damage ?? 0,
      fireIntervalMs: player?.fireIntervalMs ?? 0,
      shotCount: player?.shotCount ?? 0,
      pierce: player?.pierce ?? 0
    },
    upgradeChoices: [...state.run.upgradeChoices],
    trace: [...state.trace]
  };
}
