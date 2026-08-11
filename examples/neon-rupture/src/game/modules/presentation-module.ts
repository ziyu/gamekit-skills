import { defineGameModule } from "@gamekit/core";
import type { GameInstallContext } from "@gamekit/game-runtime";
import type { RendererAdapter, RenderObjectId } from "@gamekit/renderer-core";
import type { EntityId } from "@gamekit/world";
import {
  Actor,
  Effect,
  Player,
  Position,
  Presentation,
  Projectile,
  XpOrb
} from "../components";
import { ARENA_RADIUS } from "../constants";
import type { NeonRuntimeState } from "../runtime-state";

export function createPresentationModule(state: NeonRuntimeState, renderer: RendererAdapter) {
  return defineGameModule<GameInstallContext>({
    id: "neon.presentation",
    install({ systems, world }) {
      const objects = new Map<EntityId, RenderObjectId>();
      let arena: RenderObjectId | undefined;

      systems.register({
        id: "neon.presentation.system",
        update() {
          arena ??= renderer.createObject({
            id: "neon.arena",
            type: "neon.arena",
            props: { radius: ARENA_RADIUS }
          });
          const visible = new Set<EntityId>();
          for (const entity of world.query([Presentation, Position])) {
            const presentation = world.get(entity, Presentation);
            const position = world.get(entity, Position);
            if (!presentation || !position) {
              continue;
            }
            visible.add(entity);
            let objectId = objects.get(entity);
            if (!objectId) {
              objectId = renderer.createObject({
                type: presentation.type,
                transform: transformFor(presentation.type, position),
                props: { variant: presentation.variant }
              });
              objects.set(entity, objectId);
            }

            const actor = world.get(entity, Actor);
            const effect = world.get(entity, Effect);
            const orb = world.get(entity, XpOrb);
            const projectile = world.get(entity, Projectile);
            const player = world.get(entity, Player);
            renderer.updateObject(objectId, {
              transform: transformFor(presentation.type, position, effect, orb, projectile),
              props: {
                variant: presentation.variant,
                healthRatio: actor ? actor.health / Math.max(1, actor.maxHealth) : 1,
                flash: actor ? actor.hitFlashUntil > state.run.survivalMs : false,
                progress: effect ? effect.ageMs / effect.lifetimeMs : 0,
                radius: projectile?.radius ?? 0,
                dash: player ? player.dashRemainingMs > 0 : false,
                shake: player ? state.run.screenShake : 0,
                phase: orb?.phase ?? 0
              }
            });
          }

          for (const [entity, objectId] of objects) {
            if (!visible.has(entity)) {
              renderer.destroyObject(objectId);
              objects.delete(entity);
            }
          }
        }
      });

      return () => {
        for (const objectId of objects.values()) {
          renderer.destroyObject(objectId);
        }
        objects.clear();
        if (arena !== undefined) {
          renderer.destroyObject(arena);
        }
      };
    }
  });
}

function transformFor(
  type: string,
  position: ReturnType<typeof Position.create>,
  effect?: ReturnType<typeof Effect.create>,
  orb?: ReturnType<typeof XpOrb.create>,
  projectile?: ReturnType<typeof Projectile.create>
) {
  const height = type === "neon.projectile" ? 0.62 : type === "neon.xp" ? 0.42 : 0;
  const progress = effect ? effect.ageMs / effect.lifetimeMs : 0;
  const scale = effect
    ? effect.kind === "death"
      ? 0.5 + progress * 3.2
      : effect.kind === "level-up"
        ? 0.8 + progress * 5
        : 0.4 + progress * 1.7
    : projectile
      ? Math.max(0.7, projectile.radius / 0.18)
      : 1;
  return {
    position: {
      x: position.x,
      y: height + (orb ? Math.sin(orb.phase) * 0.1 : 0),
      z: position.z
    },
    rotation: { y: position.rotation },
    scale: { x: scale, y: scale, z: scale }
  };
}
