import type { Actor, Player } from "./components";

export type PlayerState = ReturnType<typeof Player.create>;
export type ActorState = ReturnType<typeof Actor.create>;

export type UpgradeDefinition = {
  id: string;
  title: string;
  detail: string;
  glyph: string;
  apply(player: PlayerState, actor: ActorState): void;
};

export const UPGRADES: readonly UpgradeDefinition[] = [
  {
    id: "overclock",
    title: "OVERCLOCK",
    detail: "+24% firing rate",
    glyph: "//",
    apply(player) {
      player.fireIntervalMs = Math.max(52, player.fireIntervalMs * 0.76);
    }
  },
  {
    id: "twin-shot",
    title: "FORKED BARREL",
    detail: "+1 projectile, wider spread",
    glyph: "Y",
    apply(player) {
      player.shotCount = Math.min(5, player.shotCount + 1);
    }
  },
  {
    id: "heavy-rounds",
    title: "DENSE CORE",
    detail: "+8 damage, larger rounds",
    glyph: "◆",
    apply(player) {
      player.damage += 8;
      player.bulletRadius = Math.min(0.42, player.bulletRadius + 0.035);
    }
  },
  {
    id: "phase-pierce",
    title: "PHASE NEEDLE",
    detail: "+1 enemy penetration",
    glyph: "→",
    apply(player) {
      player.pierce += 1;
    }
  },
  {
    id: "kinetic-boots",
    title: "KINETIC BOOTS",
    detail: "+16% movement speed",
    glyph: ">>",
    apply(player) {
      player.moveSpeed *= 1.16;
    }
  },
  {
    id: "flux-magnet",
    title: "FLUX MAGNET",
    detail: "+55% pickup radius",
    glyph: "◎",
    apply(player) {
      player.magnetRadius *= 1.55;
    }
  },
  {
    id: "blink-loop",
    title: "BLINK LOOP",
    detail: "Dash recharges 25% faster",
    glyph: "↯",
    apply(player) {
      player.dashCooldownMs = Math.max(430, player.dashCooldownMs * 0.75);
    }
  },
  {
    id: "nanoforge",
    title: "NANOFORGE",
    detail: "+20 max integrity, full repair",
    glyph: "+",
    apply(_player, actor) {
      actor.maxHealth += 20;
      actor.health = actor.maxHealth;
    }
  }
] as const;
