import type { InputActionEvent, InputRouter } from "@gamekit/input-core";
import type { NeonInputState } from "./game";

export const NEON_INPUT_CONTEXT = "neon.gameplay";

export const NEON_ACTION = {
  moveUp: "neon.move.up",
  moveDown: "neon.move.down",
  moveLeft: "neon.move.left",
  moveRight: "neon.move.right",
  aim: "neon.aim",
  fire: "neon.fire",
  dash: "neon.dash",
  pause: "neon.pause",
  restart: "neon.restart",
  choose1: "neon.upgrade.1",
  choose2: "neon.upgrade.2",
  choose3: "neon.upgrade.3"
} as const;

export function configureNeonInputRouter(router: InputRouter): void {
  router.addContext({
    id: NEON_INPUT_CONTEXT,
    priority: 100,
    scopes: ["game"],
    capture: true,
    actionIds: Object.values(NEON_ACTION)
  });
  registerMovement(router, NEON_ACTION.moveUp, "Move up", "KeyW");
  registerMovement(router, NEON_ACTION.moveDown, "Move down", "KeyS");
  registerMovement(router, NEON_ACTION.moveLeft, "Move left", "KeyA");
  registerMovement(router, NEON_ACTION.moveRight, "Move right", "KeyD");
  register(router, NEON_ACTION.aim, "Aim", [{ device: "mouse", phase: "moved" }]);
  register(router, NEON_ACTION.fire, "Fire", [
    { device: "mouse", button: "primary", phase: "pressed" },
    { device: "mouse", button: "primary", phase: "held" },
    { device: "mouse", button: "primary", phase: "released" }
  ]);
  register(router, NEON_ACTION.dash, "Dash", [
    { device: "keyboard", code: "Space", phase: "pressed" }
  ]);
  register(router, NEON_ACTION.pause, "Pause", [
    { device: "keyboard", code: "Escape", phase: "pressed" }
  ]);
  register(router, NEON_ACTION.restart, "Restart", [
    { device: "keyboard", code: "KeyR", phase: "pressed" }
  ]);
  register(router, NEON_ACTION.choose1, "Upgrade 1", [
    { device: "keyboard", code: "Digit1", phase: "pressed" }
  ]);
  register(router, NEON_ACTION.choose2, "Upgrade 2", [
    { device: "keyboard", code: "Digit2", phase: "pressed" }
  ]);
  register(router, NEON_ACTION.choose3, "Upgrade 3", [
    { device: "keyboard", code: "Digit3", phase: "pressed" }
  ]);
}

export function applyNeonInputAction(state: NeonInputState, event: InputActionEvent): void {
  if (event.actionId === NEON_ACTION.moveUp) {
    state.held.up = isActive(event);
    updateMovement(state);
  } else if (event.actionId === NEON_ACTION.moveDown) {
    state.held.down = isActive(event);
    updateMovement(state);
  } else if (event.actionId === NEON_ACTION.moveLeft) {
    state.held.left = isActive(event);
    updateMovement(state);
  } else if (event.actionId === NEON_ACTION.moveRight) {
    state.held.right = isActive(event);
    updateMovement(state);
  } else if (event.actionId === NEON_ACTION.aim) {
    state.aimX = event.input.x ?? state.aimX;
    state.aimZ = event.input.y ?? state.aimZ;
  } else if (event.actionId === NEON_ACTION.fire) {
    state.fireHeld = isActive(event);
  } else if (event.actionId === NEON_ACTION.dash) {
    state.dashRequested = true;
  } else if (event.actionId === NEON_ACTION.pause) {
    state.pauseToggleRequested = true;
  } else if (event.actionId === NEON_ACTION.restart) {
    state.restartRequested = true;
  } else if (event.actionId === NEON_ACTION.choose1) {
    state.upgradeChoiceRequested = 0;
  } else if (event.actionId === NEON_ACTION.choose2) {
    state.upgradeChoiceRequested = 1;
  } else if (event.actionId === NEON_ACTION.choose3) {
    state.upgradeChoiceRequested = 2;
  }
}

function registerMovement(router: InputRouter, id: string, name: string, code: string): void {
  register(router, id, name, [
    { device: "keyboard", code, phase: "pressed" },
    { device: "keyboard", code, phase: "held" },
    { device: "keyboard", code, phase: "released" }
  ]);
}

function register(
  router: InputRouter,
  id: string,
  name: string,
  defaultBindings: Parameters<InputRouter["registerAction"]>[0]["defaultBindings"]
): void {
  router.registerAction({ id, name, category: "gameplay", scopes: ["game"], defaultBindings });
}

function isActive(event: InputActionEvent): boolean {
  return event.phase !== "released" && event.phase !== "cancelled";
}

function updateMovement(state: NeonInputState): void {
  state.moveX = (state.held.right ? 1 : 0) - (state.held.left ? 1 : 0);
  state.moveZ = (state.held.down ? 1 : 0) - (state.held.up ? 1 : 0);
}
