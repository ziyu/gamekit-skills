import type { DriverCapabilities, DriverLifecyclePhase } from "@gamekit/driver-core";
import type { RendererBootContext } from "@gamekit/renderer-core";
import { createNeonThreeRenderer } from "./three-renderer";
import { createThreeRuntime, type ThreeRuntime } from "./driver/three-runtime";
import type { NeonThreeDriver, NeonThreeDriverAdapters } from "./types";

export function createNeonThreeDriver(id = "neon.three"): NeonThreeDriver {
  let phase: DriverLifecyclePhase = "registered";
  let runtime: ThreeRuntime | undefined;
  const renderer = createNeonThreeRenderer(() => runtime);
  const adapters: NeonThreeDriverAdapters = { renderer };

  const capabilities = (): DriverCapabilities => ({
    renderer: true,
    scenes: true,
    particles: true,
    custom: {
      groundPicking: true,
      renderObjectTree: true,
      nativeHandles: true
    }
  });

  return {
    id,
    kind: "three-app-local",
    async boot(ctx: RendererBootContext) {
      if (phase === "booted" || phase === "started") {
        return;
      }
      runtime = createThreeRuntime(ctx);
      await renderer.boot(ctx);
      phase = "booted";
    },
    start() {
      runtime?.start();
      phase = "started";
    },
    stop() {
      runtime?.stop();
      phase = "stopped";
    },
    resize(size) {
      runtime?.resize(size.width, size.height);
    },
    dispose() {
      renderer.destroy();
      runtime?.destroy();
      runtime = undefined;
      phase = "disposed";
    },
    capabilities,
    adapters() {
      return adapters;
    },
    snapshot() {
      return {
        id,
        kind: "three-app-local",
        phase,
        capabilities: capabilities(),
        adapters: ["renderer"],
        details: { runtimeReady: runtime !== undefined, rendererId: renderer.id }
      };
    },
    screenToGround(clientX, clientY) {
      return runtime?.screenToGround(clientX, clientY);
    }
  };
}
