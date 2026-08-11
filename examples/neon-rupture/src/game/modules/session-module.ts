import { defineGameModule } from "@gamekit/core";
import type { GameInstallContext } from "@gamekit/game-runtime";
import { Actor, Player } from "../components";
import { spawnPlayer } from "../entities";
import { createNeonRunState, type NeonRuntimeState } from "../runtime-state";

export function createSessionModule(state: NeonRuntimeState) {
  return defineGameModule<GameInstallContext>({
    id: "neon.session",
    install({ systems, world, eventBus }) {
      resetRun(state);
      systems.register({
        id: "neon.session.system",
        update({ delta }) {
          if (state.input.restartRequested && state.run.phase === "game-over") {
            resetRun(state);
            eventBus.emit("neon.run_restarted", {}, "neon.session");
          }

          if (state.input.pauseToggleRequested) {
            if (state.run.phase === "playing") {
              state.run.phase = "paused";
            } else if (state.run.phase === "paused") {
              state.run.phase = "playing";
            }
          }

          if (state.run.phase !== "playing") {
            return;
          }

          state.run.survivalMs += delta;
          state.run.wave = Math.floor(state.run.survivalMs / 20_000) + 1;
          state.run.comboRemainingMs = Math.max(0, state.run.comboRemainingMs - delta);
          if (state.run.comboRemainingMs === 0) {
            state.run.combo = 0;
          }
          state.run.screenShake = Math.max(0, state.run.screenShake - delta * 0.0018);

          const playerEntity = state.playerEntity;
          if (playerEntity === undefined || !world.has(playerEntity)) {
            return;
          }
          const actor = world.get(playerEntity, Actor);
          if (actor && actor.health <= 0 && state.run.phase === "playing") {
            actor.health = 0;
            actor.alive = false;
            world.set(playerEntity, Actor, actor);
            state.run.phase = "game-over";
            eventBus.emit(
              "neon.run_ended",
              { survivalMs: state.run.survivalMs, kills: state.run.kills, score: state.run.score },
              "neon.session"
            );
          }
        }
      });
    }
  });
}

export function resetRun(state: NeonRuntimeState): void {
  for (const entity of state.world.query()) {
    state.world.despawn(entity);
  }
  Object.assign(state.run, createNeonRunState());
  Object.assign(state.input.held, { up: false, down: false, left: false, right: false });
  state.input.moveX = 0;
  state.input.moveZ = 0;
  state.input.fireHeld = false;
  state.input.dashRequested = false;
  state.input.pauseToggleRequested = false;
  state.input.restartRequested = false;
  state.input.upgradeChoiceRequested = undefined;
  state.playerEntity = spawnPlayer(state.world);

  const player = state.world.get(state.playerEntity, Player);
  if (!player) {
    throw new Error("Failed to create Neon Rupture player");
  }
}
