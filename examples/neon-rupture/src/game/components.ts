import { defineComponent, type EntityId } from "@gamekit/world";

export type EnemyKind = "drone" | "runner" | "brute";
export type ActorFaction = "player" | "enemy";

export const Position = defineComponent<{ x: number; z: number; rotation: number }>({
  id: "neon.position",
  create: (data) => ({ x: 0, z: 0, rotation: 0, ...data })
});

export const Velocity = defineComponent<{ x: number; z: number }>({
  id: "neon.velocity",
  create: (data) => ({ x: 0, z: 0, ...data })
});

export const Actor = defineComponent<{
  faction: ActorFaction;
  health: number;
  maxHealth: number;
  radius: number;
  alive: boolean;
  hitFlashUntil: number;
}>({
  id: "neon.actor",
  create: (data) => ({
    faction: "enemy",
    health: 1,
    maxHealth: 1,
    radius: 0.5,
    alive: true,
    hitFlashUntil: 0,
    ...data
  })
});

export const Player = defineComponent<{
  moveSpeed: number;
  damage: number;
  fireIntervalMs: number;
  fireCooldownMs: number;
  bulletSpeed: number;
  bulletRadius: number;
  shotCount: number;
  pierce: number;
  magnetRadius: number;
  dashCooldownMs: number;
  dashCooldownRemainingMs: number;
  dashRemainingMs: number;
  invulnerableRemainingMs: number;
}>({
  id: "neon.player",
  create: (data) => ({
    moveSpeed: 7.5,
    damage: 15,
    fireIntervalMs: 145,
    fireCooldownMs: 0,
    bulletSpeed: 22,
    bulletRadius: 0.18,
    shotCount: 1,
    pierce: 0,
    magnetRadius: 4.5,
    dashCooldownMs: 1050,
    dashCooldownRemainingMs: 0,
    dashRemainingMs: 0,
    invulnerableRemainingMs: 0,
    ...data
  })
});

export const Enemy = defineComponent<{
  kind: EnemyKind;
  speed: number;
  damage: number;
  xp: number;
  contactCooldownRemainingMs: number;
}>({
  id: "neon.enemy",
  create: (data) => ({
    kind: "drone",
    speed: 2.5,
    damage: 9,
    xp: 5,
    contactCooldownRemainingMs: 0,
    ...data
  })
});

export const Projectile = defineComponent<{
  owner: EntityId;
  damage: number;
  radius: number;
  ageMs: number;
  lifetimeMs: number;
  remainingPierce: number;
  hitEntities: EntityId[];
}>({
  id: "neon.projectile",
  create: (data) => ({
    owner: "",
    damage: 1,
    radius: 0.15,
    ageMs: 0,
    lifetimeMs: 1100,
    remainingPierce: 0,
    hitEntities: [],
    ...data
  })
});

export const XpOrb = defineComponent<{ value: number; phase: number }>({
  id: "neon.xp_orb",
  create: (data) => ({ value: 1, phase: 0, ...data })
});

export const Effect = defineComponent<{
  kind: "muzzle" | "impact" | "death" | "dash" | "level-up";
  ageMs: number;
  lifetimeMs: number;
}>({
  id: "neon.effect",
  create: (data) => ({ kind: "impact", ageMs: 0, lifetimeMs: 240, ...data })
});

export const Presentation = defineComponent<{
  type: string;
  variant: string;
  objectId?: string | undefined;
}>({
  id: "neon.presentation",
  create: (data) => ({ type: "neon.fx", variant: "default", ...data })
});
