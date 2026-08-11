import type { EventBus } from "@gamekit/event-bus";
import type { GameRuntime } from "@gamekit/game-runtime";
import type { NeonInputState } from "./input-state";
import type { TraceEntry } from "./runtime-state";
import type { UpgradeDefinition } from "./upgrades";

export type NeonSnapshot = {
  running: boolean;
  phase: "playing" | "paused" | "upgrade" | "game-over";
  timeMs: number;
  wave: number;
  level: number;
  xp: number;
  xpNext: number;
  kills: number;
  score: number;
  combo: number;
  enemyCount: number;
  projectileCount: number;
  player: {
    health: number;
    maxHealth: number;
    dashReady: number;
    damage: number;
    fireIntervalMs: number;
    shotCount: number;
    pierce: number;
  };
  upgradeChoices: UpgradeDefinition[];
  trace: TraceEntry[];
};

export type NeonGame = {
  runtime: GameRuntime;
  eventBus: EventBus;
  input: NeonInputState;
  snapshot(): NeonSnapshot;
  chooseUpgrade(index: number): void;
  restart(): void;
};
