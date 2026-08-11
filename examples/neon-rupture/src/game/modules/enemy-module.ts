import { defineGameModule } from "@gamekit/core";
import type { GameInstallContext } from "@gamekit/game-runtime";
import { Actor, Enemy, Player, Position, Velocity, type EnemyKind } from "../components";
import { MAX_ENEMIES } from "../constants";
import { spawnEffect, spawnEnemy } from "../entities";
import { distanceSquared, normalize } from "../math";
import type { NeonRuntimeState } from "../runtime-state";

export function createEnemyModule(state: NeonRuntimeState) {
  return defineGameModule<GameInstallContext>({
    id: "neon.enemy_director",
    install({ systems, rng, eventBus }) {
      systems.register({
        id: "neon.enemy_director.system",
        update({ world, delta }) {
          if (state.run.phase !== "playing" || state.playerEntity === undefined) {
            return;
          }

          const enemies = world.query([Enemy, Actor, Position]);
          let spawned = 0;
          while (
            state.run.survivalMs >= state.run.nextSpawnAtMs &&
            enemies.length + spawned < MAX_ENEMIES &&
            spawned < 5
          ) {
            const kind = pickEnemyKind(rng.next(), state.run.wave);
            spawnEnemy(world, rng, kind, state.run.wave);
            spawned += 1;
            const interval = Math.max(135, 820 - state.run.survivalMs * 0.0043);
            state.run.nextSpawnAtMs += interval;
          }
          if (spawned > 0) {
            eventBus.emit(
              "neon.enemy_wave_spawned",
              { count: spawned, wave: state.run.wave },
              "neon.enemy_director"
            );
          }

          const playerPosition = world.get(state.playerEntity, Position);
          const playerActor = world.get(state.playerEntity, Actor);
          const player = world.get(state.playerEntity, Player);
          if (!playerPosition || !playerActor || !player || !playerActor.alive) {
            return;
          }

          for (const entity of world.query([Enemy, Actor, Position, Velocity])) {
            const enemy = world.get(entity, Enemy);
            const actor = world.get(entity, Actor);
            const position = world.get(entity, Position);
            const velocity = world.get(entity, Velocity);
            if (!enemy || !actor || !position || !velocity || !actor.alive) {
              continue;
            }
            enemy.contactCooldownRemainingMs = Math.max(
              0,
              enemy.contactCooldownRemainingMs - delta
            );
            const direction = normalize(
              playerPosition.x - position.x,
              playerPosition.z - position.z
            );
            velocity.x = direction.x * enemy.speed;
            velocity.z = direction.z * enemy.speed;
            position.x += velocity.x * (delta / 1000);
            position.z += velocity.z * (delta / 1000);
            position.rotation = Math.atan2(direction.x, direction.z);

            const contactRadius = actor.radius + playerActor.radius;
            if (
              enemy.contactCooldownRemainingMs === 0 &&
              distanceSquared(position, playerPosition) <= contactRadius * contactRadius
            ) {
              enemy.contactCooldownRemainingMs = 620;
              if (player.invulnerableRemainingMs === 0) {
                playerActor.health -= enemy.damage;
                playerActor.hitFlashUntil = state.run.survivalMs + 110;
                player.invulnerableRemainingMs = 1_000;
                state.run.screenShake = Math.min(1, state.run.screenShake + 0.5);
                spawnEffect(world, playerPosition.x, playerPosition.z, "impact", 180);
                eventBus.emit(
                  "neon.player_damaged",
                  { damage: enemy.damage, health: Math.max(0, playerActor.health) },
                  "neon.enemy_director"
                );
              }
            }

            world.set(entity, Enemy, enemy);
            world.set(entity, Position, position);
            world.set(entity, Velocity, velocity);
          }
          world.set(state.playerEntity, Actor, playerActor);
          world.set(state.playerEntity, Player, player);
        }
      });
    }
  });
}

function pickEnemyKind(value: number, wave: number): EnemyKind {
  const bruteChance = Math.min(0.24, 0.02 + wave * 0.025);
  if (value < bruteChance) {
    return "brute";
  }
  const runnerChance = Math.min(0.48, 0.18 + wave * 0.025);
  return value < bruteChance + runnerChance ? "runner" : "drone";
}
