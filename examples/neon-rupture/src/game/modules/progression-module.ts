import { defineGameModule } from "@gamekit/core";
import type { GameInstallContext } from "@gamekit/game-runtime";
import { Actor, Player, Position } from "../components";
import { spawnEffect } from "../entities";
import type { NeonRuntimeState } from "../runtime-state";
import { UPGRADES, type UpgradeDefinition } from "../upgrades";

export function createProgressionModule(state: NeonRuntimeState) {
  return defineGameModule<GameInstallContext>({
    id: "neon.progression",
    install({ systems, rng, eventBus }) {
      systems.register({
        id: "neon.progression.system",
        update({ world }) {
          if (state.playerEntity === undefined) {
            return;
          }

          if (state.run.phase === "playing" && state.run.xp >= state.run.xpNext) {
            state.run.xp -= state.run.xpNext;
            state.run.level += 1;
            state.run.xpNext = Math.round(state.run.xpNext * 1.28 + 10);
            state.run.upgradeChoices = pickChoices(rng);
            state.run.phase = "upgrade";
            const position = world.get(state.playerEntity, Position);
            if (position) {
              spawnEffect(world, position.x, position.z, "level-up", 850);
            }
            eventBus.emit(
              "neon.level_gained",
              { level: state.run.level, choices: state.run.upgradeChoices.map((item) => item.id) },
              "neon.progression"
            );
          }

          if (
            state.run.phase !== "upgrade" ||
            state.input.upgradeChoiceRequested === undefined
          ) {
            return;
          }
          const choice = state.run.upgradeChoices[state.input.upgradeChoiceRequested];
          const player = world.get(state.playerEntity, Player);
          const actor = world.get(state.playerEntity, Actor);
          if (!choice || !player || !actor) {
            return;
          }
          choice.apply(player, actor);
          world.set(state.playerEntity, Player, player);
          world.set(state.playerEntity, Actor, actor);
          state.run.upgradeChoices = [];
          state.run.phase = "playing";
          eventBus.emit(
            "neon.upgrade_selected",
            { id: choice.id, level: state.run.level },
            "neon.progression"
          );
        }
      });
    }
  });
}

function pickChoices(rng: GameInstallContext["rng"]): UpgradeDefinition[] {
  const pool = [...UPGRADES];
  const choices: UpgradeDefinition[] = [];
  while (choices.length < 3 && pool.length > 0) {
    choices.push(pool.splice(rng.int(0, pool.length), 1)[0]!);
  }
  return choices;
}
