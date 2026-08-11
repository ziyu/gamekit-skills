import type { DriverAdapterMap, GameDriver } from "@gamekit/driver-core";
import type { RendererAdapter, RendererBootContext } from "@gamekit/renderer-core";

export type GroundPoint = { x: number; z: number };

export type NeonThreeDriverAdapters = DriverAdapterMap & {
  renderer: RendererAdapter;
};

export type NeonThreeDriver = GameDriver<NeonThreeDriverAdapters> & {
  boot(ctx: RendererBootContext): Promise<void>;
  screenToGround(clientX: number, clientY: number): GroundPoint | undefined;
};
