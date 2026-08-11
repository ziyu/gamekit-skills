import { defineGameApp } from "@gamekit/app-host";
import { VIEWPORT } from "./game";

export const neonAppDefinition = defineGameApp({
  id: "neon-rupture",
  configSources: [
    {
      id: "neon.defaults",
      priority: 0,
      values: {
        drivers: VIEWPORT,
        renderer: VIEWPORT
      }
    }
  ],
  services: [
    { id: "drivers", config: VIEWPORT },
    { id: "renderer", config: VIEWPORT, dependencies: ["drivers"] },
    { id: "input", dependencies: ["renderer"] },
    { id: "game", dependencies: ["renderer", "input"] }
  ],
  metadata: {
    genre: "top-down 3d roguelite shooter",
    slice: "movement-to-combat-to-upgrade"
  }
});
