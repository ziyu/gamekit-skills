import type { Rng } from "@gamekit/core";
import type { EntityId, GameWorld } from "@gamekit/world";
import { ARENA_RADIUS, PLAYER_MAX_HEALTH, PLAYER_RADIUS } from "./constants";
import {
  Actor,
  Effect,
  Enemy,
  Player,
  Position,
  Presentation,
  Projectile,
  Velocity,
  XpOrb,
  type EnemyKind
} from "./components";

export function spawnPlayer(world: GameWorld): EntityId {
  const entity = world.spawn();
  world.add(entity, Position, { x: 0, z: 0, rotation: Math.PI });
  world.add(entity, Velocity);
  world.add(entity, Actor, {
    faction: "player",
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    radius: PLAYER_RADIUS
  });
  world.add(entity, Player);
  world.add(entity, Presentation, { type: "neon.player", variant: "vanguard" });
  return entity;
}

export function spawnEnemy(
  world: GameWorld,
  rng: Rng,
  kind: EnemyKind,
  wave: number
): EntityId {
  const angle = rng.next() * Math.PI * 2;
  const radius = ARENA_RADIUS - 0.7 - rng.next() * 0.8;
  const entity = world.spawn();
  const stats = enemyStats(kind, wave);
  world.add(entity, Position, {
    x: Math.sin(angle) * radius,
    z: Math.cos(angle) * radius,
    rotation: angle + Math.PI
  });
  world.add(entity, Velocity);
  world.add(entity, Actor, {
    faction: "enemy",
    health: stats.health,
    maxHealth: stats.health,
    radius: stats.radius
  });
  world.add(entity, Enemy, {
    kind,
    speed: stats.speed,
    damage: stats.damage,
    xp: stats.xp
  });
  world.add(entity, Presentation, { type: "neon.enemy", variant: kind });
  return entity;
}

export function spawnProjectile(
  world: GameWorld,
  input: {
    owner: EntityId;
    x: number;
    z: number;
    rotation: number;
    speed: number;
    damage: number;
    radius: number;
    pierce: number;
  }
): EntityId {
  const entity = world.spawn();
  world.add(entity, Position, {
    x: input.x + Math.sin(input.rotation) * 0.82,
    z: input.z + Math.cos(input.rotation) * 0.82,
    rotation: input.rotation
  });
  world.add(entity, Velocity, {
    x: Math.sin(input.rotation) * input.speed,
    z: Math.cos(input.rotation) * input.speed
  });
  world.add(entity, Projectile, {
    owner: input.owner,
    damage: input.damage,
    radius: input.radius,
    remainingPierce: input.pierce
  });
  world.add(entity, Presentation, { type: "neon.projectile", variant: "plasma" });
  return entity;
}

export function spawnXpOrb(
  world: GameWorld,
  rng: Rng,
  x: number,
  z: number,
  value: number
): EntityId {
  const entity = world.spawn();
  const angle = rng.next() * Math.PI * 2;
  const offset = 0.25 + rng.next() * 0.35;
  world.add(entity, Position, {
    x: x + Math.sin(angle) * offset,
    z: z + Math.cos(angle) * offset,
    rotation: angle
  });
  world.add(entity, Velocity);
  world.add(entity, XpOrb, { value, phase: rng.next() * Math.PI * 2 });
  world.add(entity, Presentation, { type: "neon.xp", variant: "shard" });
  return entity;
}

export function spawnEffect(
  world: GameWorld,
  x: number,
  z: number,
  kind: ReturnType<typeof Effect.create>["kind"],
  lifetimeMs = kind === "death" ? 520 : 240
): EntityId {
  const entity = world.spawn();
  world.add(entity, Position, { x, z, rotation: 0 });
  world.add(entity, Effect, { kind, lifetimeMs });
  world.add(entity, Presentation, { type: "neon.fx", variant: kind });
  return entity;
}

function enemyStats(kind: EnemyKind, wave: number) {
  const pressure = 1 + (wave - 1) * 0.14;
  if (kind === "runner") {
    return {
      health: 18 * pressure,
      radius: 0.43,
      speed: 4.4 + wave * 0.05,
      damage: 3.5 + wave * 0.25,
      xp: 6
    };
  }
  if (kind === "brute") {
    return {
      health: 76 * pressure,
      radius: 0.9,
      speed: 1.65 + wave * 0.025,
      damage: 9 + wave * 0.45,
      xp: 17
    };
  }
  return {
    health: 30 * pressure,
    radius: 0.58,
    speed: 2.65 + wave * 0.035,
    damage: 5 + wave * 0.3,
    xp: 8
  };
}
