import { defineGameModule } from "@gamekit/core";
import type { GameInstallContext } from "@gamekit/game-runtime";
import { Actor, Player, Position, Velocity } from "../components";
import { ARENA_RADIUS } from "../constants";
import { spawnEffect, spawnProjectile } from "../entities";
import { clampToCircle, normalize } from "../math";
import type { NeonRuntimeState } from "../runtime-state";

const DASH_SPEED = 20;
const DASH_DURATION_MS = 145;

export function createPlayerModule(state: NeonRuntimeState) {
  return defineGameModule<GameInstallContext>({
    id: "neon.player_control",
    install({ systems, eventBus }) {
      systems.register({
        id: "neon.player_control.system",
        update({ world, delta }) {
          if (state.run.phase !== "playing" || state.playerEntity === undefined) {
            return;
          }
          const position = world.get(state.playerEntity, Position);
          const velocity = world.get(state.playerEntity, Velocity);
          const player = world.get(state.playerEntity, Player);
          const actor = world.get(state.playerEntity, Actor);
          if (!position || !velocity || !player || !actor || !actor.alive) {
            return;
          }

          const deltaSeconds = delta / 1000;
          const aim = normalize(state.input.aimX - position.x, state.input.aimZ - position.z);
          if (aim.x !== 0 || aim.z !== 0) {
            position.rotation = Math.atan2(aim.x, aim.z);
          }

          player.fireCooldownMs = Math.max(0, player.fireCooldownMs - delta);
          player.dashCooldownRemainingMs = Math.max(0, player.dashCooldownRemainingMs - delta);
          player.dashRemainingMs = Math.max(0, player.dashRemainingMs - delta);
          player.invulnerableRemainingMs = Math.max(0, player.invulnerableRemainingMs - delta);

          let move = normalize(state.input.moveX, state.input.moveZ);
          if (state.input.dashRequested && player.dashCooldownRemainingMs === 0) {
            if (move.x === 0 && move.z === 0) {
              move = aim;
            }
            player.dashRemainingMs = DASH_DURATION_MS;
            player.invulnerableRemainingMs = DASH_DURATION_MS + 80;
            player.dashCooldownRemainingMs = player.dashCooldownMs;
            spawnEffect(world, position.x, position.z, "dash", 320);
            eventBus.emit("neon.dash_started", {}, "neon.player_control");
          }

          const speed = player.dashRemainingMs > 0 ? DASH_SPEED : player.moveSpeed;
          velocity.x = move.x * speed;
          velocity.z = move.z * speed;
          const next = clampToCircle(
            {
              x: position.x + velocity.x * deltaSeconds,
              z: position.z + velocity.z * deltaSeconds
            },
            ARENA_RADIUS - actor.radius - 0.45
          );
          position.x = next.x;
          position.z = next.z;

          if (state.input.fireHeld && player.fireCooldownMs === 0) {
            fireVolley(state, state.playerEntity, position, player);
            player.fireCooldownMs = player.fireIntervalMs;
          }

          world.set(state.playerEntity, Position, position);
          world.set(state.playerEntity, Velocity, velocity);
          world.set(state.playerEntity, Player, player);
        }
      });
    }
  });
}

function fireVolley(
  state: NeonRuntimeState,
  playerEntity: NonNullable<NeonRuntimeState["playerEntity"]>,
  position: ReturnType<typeof Position.create>,
  player: ReturnType<typeof Player.create>
): void {
  const spread = player.shotCount === 1 ? 0 : 0.115;
  for (let index = 0; index < player.shotCount; index += 1) {
    const offset = (index - (player.shotCount - 1) / 2) * spread;
    spawnProjectile(state.world, {
      owner: playerEntity,
      x: position.x,
      z: position.z,
      rotation: position.rotation + offset,
      speed: player.bulletSpeed,
      damage: player.damage,
      radius: player.bulletRadius,
      pierce: player.pierce
    });
  }
  spawnEffect(
    state.world,
    position.x + Math.sin(position.rotation) * 0.82,
    position.z + Math.cos(position.rotation) * 0.82,
    "muzzle",
    120
  );
  state.eventBus.emit(
    "neon.shot_fired",
    { count: player.shotCount, damage: player.damage },
    "neon.player_control"
  );
}
