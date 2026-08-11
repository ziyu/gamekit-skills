import type { EventBus } from "@gamekit/event-bus";
import type { EntityId, GameWorld } from "@gamekit/world";
import type { NeonInputState } from "./input-state";
import type { UpgradeDefinition } from "./upgrades";

export type RunPhase = "playing" | "paused" | "upgrade" | "game-over";

export type TraceEntry = {
  id: number;
  type: string;
  payload: unknown;
};

export type NeonRunState = {
  phase: RunPhase;
  survivalMs: number;
  kills: number;
  score: number;
  wave: number;
  level: number;
  xp: number;
  xpNext: number;
  combo: number;
  comboRemainingMs: number;
  nextSpawnAtMs: number;
  upgradeChoices: UpgradeDefinition[];
  screenShake: number;
};

export type NeonRuntimeState = {
  world: GameWorld;
  eventBus: EventBus;
  input: NeonInputState;
  run: NeonRunState;
  trace: TraceEntry[];
  playerEntity?: EntityId | undefined;
  traceSequence: number;
};

export function createNeonRunState(): NeonRunState {
  return {
    phase: "playing",
    survivalMs: 0,
    kills: 0,
    score: 0,
    wave: 1,
    level: 1,
    xp: 0,
    xpNext: 35,
    combo: 0,
    comboRemainingMs: 0,
    nextSpawnAtMs: 1_200,
    upgradeChoices: [],
    screenShake: 0
  };
}
