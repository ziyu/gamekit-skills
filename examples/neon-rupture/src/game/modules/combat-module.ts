import { defineGameModule } from "@gamekit/core";
import type { GameInstallContext } from "@gamekit/game-runtime";
import {
  Actor,
  Effect,
  Enemy,
  Player,
  Position,
  Projectile,
  Velocity,
  XpOrb
} from "../components";
import { ARENA_RADIUS } from "../constants";
import { spawnEffect, spawnXpOrb } from "../entities";
import { distanceSquared, normalize } from "../math";
import type { NeonRuntimeState } from "../runtime-state";

export function createCombatModule(state: NeonRuntimeState) {
  return defineGameModule<GameInstallContext>({
    id: "neon.combat",
    install({ systems, rng, eventBus }) {
      systems.register({
        id: "neon.combat.system",
        update({ delta }) {
          if (state.run.phase !== "playing") {
            return;
          }
          updateProjectiles(state, delta);
          resolveEnemyDeaths(state, rng, eventBus);
          updateXpOrbs(state, delta);
          updateEffects(state, delta);
        }
      });
    }
  });
}

function updateProjectiles(state: NeonRuntimeState, delta: number): void {
  const enemies = state.world.query([Enemy, Actor, Position]);
  for (const entity of state.world.query([Projectile, Position, Velocity])) {
    const projectile = state.world.get(entity, Projectile);
    const position = state.world.get(entity, Position);
    const velocity = state.world.get(entity, Velocity);
    if (!projectile || !position || !velocity) {
      continue;
    }
    projectile.ageMs += delta;
    position.x += velocity.x * (delta / 1000);
    position.z += velocity.z * (delta / 1000);

    let destroyed =
      projectile.ageMs >= projectile.lifetimeMs ||
      Math.hypot(position.x, position.z) > ARENA_RADIUS + 2;

    for (const enemyEntity of enemies) {
      if (destroyed || projectile.hitEntities.includes(enemyEntity)) {
        continue;
      }
      const actor = state.world.get(enemyEntity, Actor);
      const enemyPosition = state.world.get(enemyEntity, Position);
      if (!actor?.alive || !enemyPosition) {
        continue;
      }
      const hitRadius = projectile.radius + actor.radius;
      if (distanceSquared(position, enemyPosition) > hitRadius * hitRadius) {
        continue;
      }

      actor.health -= projectile.damage;
      actor.hitFlashUntil = state.run.survivalMs + 90;
      projectile.hitEntities.push(enemyEntity);
      spawnEffect(state.world, position.x, position.z, "impact");
      state.run.screenShake = Math.min(1, state.run.screenShake + 0.1);
      state.world.set(enemyEntity, Actor, actor);
      state.eventBus.emit(
        "neon.projectile_hit",
        { damage: projectile.damage, target: String(enemyEntity) },
        "neon.combat"
      );

      if (projectile.remainingPierce > 0) {
        projectile.remainingPierce -= 1;
      } else {
        destroyed = true;
      }
    }

    if (destroyed) {
      state.world.despawn(entity);
    } else {
      state.world.set(entity, Projectile, projectile);
      state.world.set(entity, Position, position);
    }
  }
}

function resolveEnemyDeaths(
  state: NeonRuntimeState,
  rng: GameInstallContext["rng"],
  eventBus: GameInstallContext["eventBus"]
): void {
  for (const entity of state.world.query([Enemy, Actor, Position])) {
    const actor = state.world.get(entity, Actor);
    const enemy = state.world.get(entity, Enemy);
    const position = state.world.get(entity, Position);
    if (!actor || !enemy || !position || !actor.alive || actor.health > 0) {
      continue;
    }
    actor.alive = false;
    const orbs = enemy.kind === "brute" ? 3 : 1;
    for (let index = 0; index < orbs; index += 1) {
      spawnXpOrb(state.world, rng, position.x, position.z, Math.ceil(enemy.xp / orbs));
    }
    spawnEffect(state.world, position.x, position.z, "death");
    state.run.kills += 1;
    state.run.combo = Math.min(99, state.run.combo + 1);
    state.run.comboRemainingMs = 2100;
    state.run.score += Math.round(80 * state.run.wave * (1 + state.run.combo * 0.08));
    state.run.screenShake = Math.min(1, state.run.screenShake + (enemy.kind === "brute" ? 0.55 : 0.22));
    state.world.despawn(entity);
    eventBus.emit(
      "neon.enemy_killed",
      { kind: enemy.kind, kills: state.run.kills, combo: state.run.combo },
      "neon.combat"
    );
  }
}

function updateXpOrbs(state: NeonRuntimeState, delta: number): void {
  if (state.playerEntity === undefined) {
    return;
  }
  const playerPosition = state.world.get(state.playerEntity, Position);
  const player = state.world.get(state.playerEntity, Player);
  const actor = state.world.get(state.playerEntity, Actor);
  if (!playerPosition || !player || !actor) {
    return;
  }

  for (const entity of state.world.query([XpOrb, Position, Velocity])) {
    const orb = state.world.get(entity, XpOrb);
    const position = state.world.get(entity, Position);
    const velocity = state.world.get(entity, Velocity);
    if (!orb || !position || !velocity) {
      continue;
    }
    orb.phase += delta * 0.006;
    const distance = Math.sqrt(distanceSquared(position, playerPosition));
    if (distance < player.magnetRadius) {
      const direction = normalize(playerPosition.x - position.x, playerPosition.z - position.z);
      const speed = 7 + (player.magnetRadius - distance) * 3.6;
      velocity.x = direction.x * speed;
      velocity.z = direction.z * speed;
      position.x += velocity.x * (delta / 1000);
      position.z += velocity.z * (delta / 1000);
    }
    if (distance < actor.radius + 0.48) {
      state.run.xp += orb.value;
      state.world.despawn(entity);
      continue;
    }
    state.world.set(entity, XpOrb, orb);
    state.world.set(entity, Position, position);
    state.world.set(entity, Velocity, velocity);
  }
}

function updateEffects(state: NeonRuntimeState, delta: number): void {
  for (const entity of state.world.query([Effect])) {
    const effect = state.world.get(entity, Effect);
    if (!effect) {
      continue;
    }
    effect.ageMs += delta;
    if (effect.ageMs >= effect.lifetimeMs) {
      state.world.despawn(entity);
    } else {
      state.world.set(entity, Effect, effect);
    }
  }
}
