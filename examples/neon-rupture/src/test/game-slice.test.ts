import type { EntityId, GameWorld } from "@gamekit/world";
import { describe, expect, it } from "vitest";
import {
  Actor,
  Enemy,
  Player,
  Position,
  Projectile,
  Velocity,
  XpOrb,
  type NeonGame
} from "../game";
import { createNeonDeterministicTestProfile } from "../profiles/deterministic-test";

describe("Neon Rupture vertical slice", () => {
  it("runs movement and fire intent through authoritative systems", () => {
    const game = createHarness();
    const player = requirePlayer(game);
    const before = { ...game.runtime.world.get(player, Position)! };

    game.input.moveZ = -1;
    game.input.aimX = 0;
    game.input.aimZ = -8;
    game.input.fireHeld = true;
    game.runtime.tick(100);

    const after = game.runtime.world.get(player, Position)!;
    expect(after.z).toBeLessThan(before.z);
    expect(game.runtime.world.query([Projectile]).length).toBeGreaterThan(0);
    expect(game.snapshot().trace.some((entry) => entry.type === "neon.shot_fired")).toBe(true);
  });

  it("runs projectile hits through death, XP, level-up, and upgrade selection", () => {
    const game = createHarness();
    game.input.aimX = 0;
    game.input.aimZ = -8;
    game.input.fireHeld = true;

    for (let kill = 0; kill < 5; kill += 1) {
      const playerState = game.runtime.world.get(requirePlayer(game), Player)!;
      playerState.fireCooldownMs = 0;
      game.runtime.world.set(requirePlayer(game), Player, playerState);
      spawnFragileEnemy(game.runtime.world, kill + 1);
      game.runtime.tick(16);
      collectAllXp(game);
      game.runtime.tick(16);
      if (game.snapshot().phase === "upgrade") {
        break;
      }
    }

    const before = game.snapshot();
    expect(before.kills).toBeGreaterThanOrEqual(5);
    expect(before.phase).toBe("upgrade");
    expect(before.upgradeChoices).toHaveLength(3);
    const selectedId = before.upgradeChoices[0]!.id;

    game.chooseUpgrade(0);
    game.runtime.tick(16);

    const after = game.snapshot();
    expect(after.phase).toBe("playing");
    expect(after.level).toBe(2);
    expect(
      after.trace.some(
        (entry) =>
          entry.type === "neon.upgrade_selected" &&
          (entry.payload as { id?: string }).id === selectedId
      )
    ).toBe(true);
  });

  it("stops ticks, cleans trace subscriptions, and supports a clean restart", () => {
    const game = createHarness();
    const player = requirePlayer(game);
    const actor = game.runtime.world.get(player, Actor)!;
    actor.health = 0;
    game.runtime.world.set(player, Actor, actor);
    game.runtime.tick(16);
    expect(game.snapshot().phase).toBe("game-over");

    game.restart();
    game.runtime.tick(16);
    expect(game.snapshot().phase).toBe("playing");
    expect(game.snapshot().player.health).toBe(game.snapshot().player.maxHealth);

    const positionBeforeStop = { ...game.runtime.world.get(requirePlayer(game), Position)! };
    game.input.moveX = 1;
    game.runtime.stop();
    game.runtime.tick(500);
    expect(game.runtime.world.get(requirePlayer(game), Position)).toEqual(positionBeforeStop);

    game.runtime.dispose();
    const traceCount = game.snapshot().trace.length;
    game.eventBus.emit("neon.external_probe", {}, "test");
    expect(game.snapshot().trace).toHaveLength(traceCount);
    expect(game.runtime.isRunning()).toBe(false);
  });
});

function createHarness(): NeonGame {
  const { game } = createNeonDeterministicTestProfile();
  game.runtime.start();
  return game;
}

function requirePlayer(game: NeonGame): EntityId {
  const player = game.runtime.world.query([Player, Actor])[0];
  if (player === undefined) {
    throw new Error("Missing player");
  }
  return player;
}

function spawnFragileEnemy(world: GameWorld, index: number): EntityId {
  const entity = world.spawn();
  world.add(entity, Position, { x: 0, z: -1.35, rotation: 0 });
  world.add(entity, Velocity);
  world.add(entity, Actor, {
    faction: "enemy",
    health: 1,
    maxHealth: 1,
    radius: 0.55
  });
  world.add(entity, Enemy, {
    kind: "drone",
    speed: 0,
    damage: 0,
    xp: 8 + (index % 2)
  });
  return entity;
}

function collectAllXp(game: NeonGame): void {
  const player = requirePlayer(game);
  const playerPosition = game.runtime.world.get(player, Position)!;
  for (const orb of game.runtime.world.query([XpOrb, Position])) {
    game.runtime.world.set(orb, Position, {
      x: playerPosition.x,
      z: playerPosition.z
    });
  }
}
