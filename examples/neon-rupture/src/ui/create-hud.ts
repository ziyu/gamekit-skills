import type { NeonSnapshot } from "../game";

export type NeonHud = {
  update(snapshot: NeonSnapshot): void;
  setAim(clientX: number, clientY: number): void;
};

export function createNeonHud(
  mount: HTMLElement,
  rendererRoot: HTMLElement,
  actions: { chooseUpgrade(index: number): void; restart(): void }
): NeonHud {
  const shell = element("main", "neon-shell");
  const masthead = element("header", "neon-masthead");
  const brand = element("div", "neon-brand");
  brand.append(
    text("span", "neon-brand__index", "GK // 01"),
    text("h1", "neon-brand__title", "NEON RUPTURE"),
    text("p", "neon-brand__tag", "SURVIVE THE SIGNAL")
  );
  const signal = element("div", "neon-signal");
  signal.append(text("i", "neon-signal__dot", ""), text("span", "", "SYSTEM LINKED"));
  masthead.append(brand, signal);

  const stage = element("section", "neon-stage");
  stage.append(rendererRoot);
  const scanlines = element("div", "neon-scanlines");
  const vignette = element("div", "neon-vignette");
  const reticle = element("div", "neon-reticle");
  reticle.append(element("i", ""), element("i", ""));

  const xpTrack = element("div", "neon-xp");
  const xpFill = element("i", "neon-xp__fill");
  const levelLabel = text("span", "neon-xp__level", "LV 01");
  xpTrack.append(xpFill, levelLabel);

  const topStatus = element("div", "neon-top-status");
  const timer = text("strong", "neon-timer", "00:00");
  const wave = text("span", "neon-wave", "WAVE 01");
  const threats = text("span", "neon-threats", "0 SIGNALS");
  topStatus.append(wave, timer, threats);

  const bottomHud = element("div", "neon-bottom-hud");
  const integrity = element("section", "neon-integrity");
  const integrityHeader = element("div", "neon-meter-header");
  const healthValue = text("strong", "", "100 / 100");
  integrityHeader.append(text("span", "", "INTEGRITY"), healthValue);
  const healthTrack = element("div", "neon-health-track");
  const healthFill = element("i", "neon-health-fill");
  healthTrack.append(healthFill);
  const dashTrack = element("div", "neon-dash-track");
  const dashFill = element("i", "neon-dash-fill");
  dashTrack.append(dashFill);
  integrity.append(integrityHeader, healthTrack, text("small", "", "SPACE // BLINK"), dashTrack);

  const combatReadout = element("section", "neon-combat-readout");
  const combo = text("strong", "neon-combo", "");
  const kills = text("span", "", "KILLS 000");
  const score = text("span", "", "SCORE 000000");
  combatReadout.append(combo, kills, score);

  const weapon = element("section", "neon-weapon");
  const weaponName = text("strong", "", "ARC NEEDLER");
  const weaponStats = text("span", "", "15 DMG // 6.9 RPS // 1X");
  weapon.append(text("small", "", "PRIMARY ARRAY"), weaponName, weaponStats);
  bottomHud.append(integrity, combatReadout, weapon);

  const controls = text(
    "div",
    "neon-controls",
    "WASD MOVE   //   MOUSE AIM   //   LMB FIRE   //   SPACE BLINK"
  );
  const phaseLayer = element("div", "neon-phase-layer");
  stage.append(scanlines, vignette, reticle, xpTrack, topStatus, bottomHud, controls, phaseLayer);

  const footer = element("footer", "neon-footer");
  const latestTrace = text("span", "neon-trace", "AWAITING HOST BOOT");
  footer.append(
    text("span", "", "GAMEKIT RUNTIME / THREE APP-LOCAL DRIVER"),
    latestTrace,
    text("span", "", "BUILD 0.1.0-A")
  );
  shell.append(masthead, stage, footer);
  mount.replaceChildren(shell);

  let renderedPhase = "";
  let renderedChoices = "";

  return {
    update(snapshot) {
      const healthRatio = snapshot.player.health / Math.max(1, snapshot.player.maxHealth);
      healthFill.style.width = `${Math.max(0, healthRatio) * 100}%`;
      healthValue.textContent = `${Math.ceil(snapshot.player.health)} / ${Math.ceil(snapshot.player.maxHealth)}`;
      dashFill.style.width = `${Math.max(0, Math.min(1, snapshot.player.dashReady)) * 100}%`;
      xpFill.style.width = `${Math.min(1, snapshot.xp / snapshot.xpNext) * 100}%`;
      levelLabel.textContent = `LV ${String(snapshot.level).padStart(2, "0")}`;
      timer.textContent = formatTime(snapshot.timeMs);
      wave.textContent = `WAVE ${String(snapshot.wave).padStart(2, "0")}`;
      threats.textContent = `${snapshot.enemyCount} SIGNAL${snapshot.enemyCount === 1 ? "" : "S"}`;
      kills.textContent = `KILLS ${String(snapshot.kills).padStart(3, "0")}`;
      score.textContent = `SCORE ${String(snapshot.score).padStart(6, "0")}`;
      combo.textContent = snapshot.combo > 1 ? `×${snapshot.combo} CHAIN` : "";
      weaponStats.textContent = `${Math.round(snapshot.player.damage)} DMG // ${(1000 / Math.max(1, snapshot.player.fireIntervalMs)).toFixed(1)} RPS // ${snapshot.player.shotCount}X${snapshot.player.pierce > 0 ? ` // P${snapshot.player.pierce}` : ""}`;
      latestTrace.textContent = readableTrace(snapshot.trace[0]?.type);

      const choicesKey = snapshot.upgradeChoices.map((choice) => choice.id).join(":");
      if (snapshot.phase !== renderedPhase || choicesKey !== renderedChoices) {
        renderedPhase = snapshot.phase;
        renderedChoices = choicesKey;
        renderPhase(phaseLayer, snapshot, actions);
      }
      stage.dataset.phase = snapshot.phase;
    },
    setAim(clientX, clientY) {
      const rect = stage.getBoundingClientRect();
      reticle.style.left = "0";
      reticle.style.top = "0";
      reticle.style.transform = `translate3d(${clientX - rect.left}px, ${clientY - rect.top}px, 0)`;
    }
  };
}

function renderPhase(
  layer: HTMLElement,
  snapshot: NeonSnapshot,
  actions: { chooseUpgrade(index: number): void; restart(): void }
): void {
  layer.replaceChildren();
  if (snapshot.phase === "playing") {
    return;
  }
  const panel = element("section", `neon-phase-panel neon-phase-panel--${snapshot.phase}`);
  if (snapshot.phase === "upgrade") {
    panel.append(
      text("p", "neon-eyebrow", `LEVEL ${String(snapshot.level).padStart(2, "0")} // SIGNAL MUTATION`),
      text("h2", "", "CHOOSE AN AUGMENT"),
      text("span", "neon-phase-copy", "Time is suspended. Recompile the chassis.")
    );
    const cards = element("div", "neon-upgrade-grid");
    snapshot.upgradeChoices.forEach((choice, index) => {
      const button = element("button", "neon-upgrade-card");
      button.type = "button";
      button.addEventListener("click", () => actions.chooseUpgrade(index), { once: true });
      button.append(
        text("kbd", "", String(index + 1)),
        text("i", "neon-upgrade-glyph", choice.glyph),
        text("strong", "", choice.title),
        text("span", "", choice.detail)
      );
      cards.append(button);
    });
    panel.append(cards);
  } else if (snapshot.phase === "paused") {
    panel.append(
      text("p", "neon-eyebrow", "RUNTIME INTERRUPT"),
      text("h2", "", "SIGNAL PAUSED"),
      text("span", "neon-phase-copy", "Press ESC to re-enter the rupture.")
    );
  } else {
    panel.append(
      text("p", "neon-eyebrow", "CHASSIS OFFLINE"),
      text("h2", "", "TRANSMISSION LOST"),
      text(
        "span",
        "neon-phase-copy",
        `${formatTime(snapshot.timeMs)} survived // ${snapshot.kills} targets erased // ${snapshot.score} score`
      )
    );
    const restart = text("button", "neon-restart", "REBOOT RUN  [R]");
    restart.type = "button";
    restart.addEventListener("click", actions.restart, { once: true });
    panel.append(restart);
  }
  layer.append(panel);
}

function readableTrace(type: string | undefined): string {
  if (!type) {
    return "HOST ONLINE // AWAITING INPUT";
  }
  return type.replace("neon.", "").replaceAll("_", " ").toUpperCase();
}

function formatTime(timeMs: number): string {
  const total = Math.floor(timeMs / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  return node;
}

function text<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, value: string) {
  const node = element(tag, className);
  node.textContent = value;
  return node;
}
