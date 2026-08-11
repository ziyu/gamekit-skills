import { createInputRouter, type NormalizedInputEvent } from "@gamekit/input-core";
import { describe, expect, it } from "vitest";
import { applyNeonInputAction, configureNeonInputRouter } from "../app-input";
import { createNeonInputState } from "../game";

describe("Neon input normalization", () => {
  it("keeps held movement active and clears it on release", () => {
    const router = createInputRouter();
    const input = createNeonInputState();
    configureNeonInputRouter(router);

    route(router, input, key("pressed", "KeyW", 1));
    expect(input.moveZ).toBe(-1);
    for (const event of router.tick({ timestamp: 17, delta: 16 })) {
      applyNeonInputAction(input, event);
    }
    expect(input.held.up).toBe(true);

    route(router, input, key("released", "KeyW", 32));
    expect(input.moveZ).toBe(0);
    expect(router.tick({ timestamp: 48, delta: 16 })).toHaveLength(0);
  });

  it("tracks fire as held input instead of a per-frame EventBus fact", () => {
    const router = createInputRouter();
    const input = createNeonInputState();
    configureNeonInputRouter(router);

    route(router, input, pointer("pressed", 1));
    expect(input.fireHeld).toBe(true);
    route(router, input, pointer("released", 2));
    expect(input.fireHeld).toBe(false);
  });
});

function route(
  router: ReturnType<typeof createInputRouter>,
  state: ReturnType<typeof createNeonInputState>,
  event: NormalizedInputEvent
): void {
  for (const action of router.handle(event)) {
    applyNeonInputAction(state, action);
  }
}

function key(phase: "pressed" | "released", code: string, timestamp: number) {
  return {
    id: `${code}.${timestamp}`,
    device: "keyboard" as const,
    phase,
    code,
    timestamp,
    scope: "game"
  };
}

function pointer(phase: "pressed" | "released", timestamp: number) {
  return {
    id: `pointer.${timestamp}`,
    device: "mouse" as const,
    phase,
    button: "primary",
    pointerId: "1",
    timestamp,
    scope: "game"
  };
}
