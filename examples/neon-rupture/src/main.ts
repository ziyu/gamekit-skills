import "./styles.css";
import { createConfiguredAppHost } from "@gamekit/app-host";
import type { InputActionEvent } from "@gamekit/input-core";
import { applyNeonInputAction, NEON_ACTION } from "./app-input";
import { neonAppDefinition } from "./app-definition";
import { createNeonWebProfile, type NeonAppContext } from "./app-profile";
import { createNeonHud } from "./ui/create-hud";

const app = document.querySelector<HTMLElement>("#app");
if (!app) {
  throw new Error("Missing #app mount");
}

void boot(app).catch((error) => {
  app.textContent = `Neon Rupture failed to boot: ${error instanceof Error ? error.message : String(error)}`;
  throw error;
});

async function boot(mount: HTMLElement): Promise<void> {
  const rendererRoot = document.createElement("div");
  rendererRoot.className = "neon-renderer";
  rendererRoot.addEventListener("contextmenu", (event) => event.preventDefault());
  const context: NeonAppContext = { rendererRoot };
  const hud = createNeonHud(mount, rendererRoot, {
    chooseUpgrade(index) {
      context.game?.chooseUpgrade(index);
    },
    restart() {
      context.game?.restart();
    }
  });

  const configured = createConfiguredAppHost({
    app: neonAppDefinition,
    profile: createNeonWebProfile(),
    context
  });
  await configured.host.boot();
  if (!context.game || !context.inputRouter || !context.threeDriver) {
    throw new Error("GameKit services did not expose the Neon runtime");
  }

  const unsubscribeInput = context.inputRouter.onAction((event) => {
    applyNeonInputAction(context.game!.input, toWorldInput(event, context));
  });
  const onPointerMove = (event: PointerEvent) => hud.setAim(event.clientX, event.clientY);
  rendererRoot.addEventListener("pointermove", onPointerMove);

  await configured.host.start();
  hud.update(context.game.snapshot());
  let lastTime: number | undefined;
  let frameId = 0;
  const frame = (now: number) => {
    const delta = lastTime === undefined ? 0 : Math.max(0, Math.min(42, now - lastTime));
    lastTime = now;
    configured.host.tick(delta, now);
    hud.update(context.game!.snapshot());
    frameId = requestAnimationFrame(frame);
  };
  frameId = requestAnimationFrame(frame);

  window.addEventListener(
    "beforeunload",
    () => {
      cancelAnimationFrame(frameId);
      rendererRoot.removeEventListener("pointermove", onPointerMove);
      unsubscribeInput();
      void configured.host.dispose();
    },
    { once: true }
  );
}

function toWorldInput(event: InputActionEvent, context: NeonAppContext): InputActionEvent {
  if (
    event.actionId !== NEON_ACTION.aim ||
    event.input.x === undefined ||
    event.input.y === undefined
  ) {
    return event;
  }
  const world = context.threeDriver?.screenToGround(event.input.x, event.input.y);
  if (!world) {
    return event;
  }
  return {
    ...event,
    input: {
      ...event.input,
      x: world.x,
      y: world.z
    }
  };
}
