export type NeonInputState = {
  held: { up: boolean; down: boolean; left: boolean; right: boolean };
  moveX: number;
  moveZ: number;
  aimX: number;
  aimZ: number;
  fireHeld: boolean;
  dashRequested: boolean;
  pauseToggleRequested: boolean;
  restartRequested: boolean;
  upgradeChoiceRequested?: number | undefined;
};

export function createNeonInputState(): NeonInputState {
  return {
    held: { up: false, down: false, left: false, right: false },
    moveX: 0,
    moveZ: 0,
    aimX: 0,
    aimZ: -5,
    fireHeld: false,
    dashRequested: false,
    pauseToggleRequested: false,
    restartRequested: false
  };
}
