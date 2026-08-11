import { createStandardAppProfile, type AppProfile } from "@gamekit/app-host";
import { createInputRouter, type InputRouter } from "@gamekit/input-core";
import { createDomInputAdapter } from "@gamekit/input-dom";
import type { RendererAdapter, RendererBootContext } from "@gamekit/renderer-core";
import { createKootaWorld } from "@gamekit/world-koota";
import { configureNeonInputRouter } from "./app-input";
import { createNeonRuntime, VIEWPORT, type NeonGame } from "./game";
import {
  createNeonThreeDriver,
  type NeonThreeDriver
} from "./presentation/native-three";

export type NeonAppContext = {
  rendererRoot: HTMLElement;
  game?: NeonGame | undefined;
  inputRouter?: InputRouter | undefined;
  renderer?: RendererAdapter | undefined;
  threeDriver?: NeonThreeDriver | undefined;
};

export function createNeonWebProfile(): AppProfile<NeonAppContext> {
  const threeDriver = createNeonThreeDriver();
  const inputRouter = createInputRouter();

  return createStandardAppProfile({
    id: "web",
    expose({ context, state }) {
      context.inputRouter = state.input;
      context.renderer = state.renderer;
      context.threeDriver = threeDriver;
    },
    services: {
      drivers: {
        drivers: [threeDriver],
        boot({ context, requireConfig }) {
          const config = requireConfig() as { width?: number; height?: number };
          const boot: RendererBootContext = {
            container: context.rendererRoot,
            width: config.width ?? VIEWPORT.width,
            height: config.height ?? VIEWPORT.height
          };
          return boot;
        }
      },
      renderer: {
        driver: "neon.three"
      },
      input: {
        router: inputRouter,
        configure(_ctx, router) {
          configureNeonInputRouter(router);
        },
        adapters({ context }, router) {
          return [
            createDomInputAdapter({
              target: window,
              capture: true,
              source: "neon.dom",
              scope: "game",
              eventFilter(event) {
                return isKeyboardEvent(event) || isPointerInRenderer(context, event);
              },
              onInput(event) {
                router.handle(event);
              }
            })
          ];
        }
      },
      game: {
        createRuntime({ context, state }) {
          if (!state.renderer) {
            throw new Error("Neon renderer service is unavailable");
          }
          const game = createNeonRuntime({ renderer: state.renderer, world: createKootaWorld() });
          context.game = game;
          return game.runtime;
        }
      }
    }
  });
}

function isKeyboardEvent(event: Event): boolean {
  return event.type === "keydown" || event.type === "keyup";
}

function isPointerInRenderer(context: NeonAppContext, event: Event): boolean {
  return (
    event.type.startsWith("pointer") &&
    event.target instanceof Node &&
    context.rendererRoot.contains(event.target)
  );
}
