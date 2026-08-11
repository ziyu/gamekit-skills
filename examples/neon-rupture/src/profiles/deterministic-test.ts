import { createEventBus } from "@gamekit/event-bus";
import { createKootaWorld } from "@gamekit/world-koota";
import { createNeonRuntime, type NeonGame } from "../game";

export type NeonDeterministicTestProfile = {
  game: NeonGame;
  now(): number;
};

export function createNeonDeterministicTestProfile(
  seed = "neon.test.seed"
): NeonDeterministicTestProfile {
  let timestamp = 0;
  const game = createNeonRuntime({
    world: createKootaWorld(),
    eventBus: createEventBus({ clock: () => timestamp++ }),
    seed
  });
  return {
    game,
    now() {
      return timestamp;
    }
  };
}
