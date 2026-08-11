import { defineGameModule } from "@gamekit/core";
import type { GameInstallContext } from "@gamekit/game-runtime";
import type { NeonRuntimeState } from "../runtime-state";

export function createInputResetModule(state: NeonRuntimeState) {
  return defineGameModule<GameInstallContext>({
    id: "neon.input_reset",
    install({ systems }) {
      systems.register({
        id: "neon.input_reset.system",
        update() {
          state.input.dashRequested = false;
          state.input.pauseToggleRequested = false;
          state.input.restartRequested = false;
          state.input.upgradeChoiceRequested = undefined;
        }
      });
    }
  });
}
