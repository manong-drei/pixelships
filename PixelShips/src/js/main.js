import { canvas, ctx, mouse } from "./canvas.js";
import { state } from "./state.js";
import {
  drawStartScreen,
  drawModeSelectScreen,
  drawModeHubScreen,
  drawSelectionScreen,
  drawWinScreen,
  drawGameOverScreen,
  drawPauseScreen,
  drawInstructionsScreen,
  drawCampaignBriefingScreen,
  handleStartClick,
  handleModeSelectClick,
  handleModeHubClick,
  handleSelectionClick,
  handleEndClick,
  handlePauseClick,
  handleInstructionsClick,
  handleCampaignBriefingClick,
  drawCampaignCompleteScreen,
  handleCampaignCompleteClick,
  updateCursor,
} from "./screens.js";
import * as playerMod from "./player.js";
import * as enemyMod from "./enemy.js";
import {
  spawnPlayerProjectile,
  spawnEnemyProjectile,
  updateProjectiles,
  drawProjectiles,
  clearProjectiles,
} from "./projectiles.js";
import {
  triggerSkill,
  triggerEnemySkill,
  triggerAllySkill,
  updateSkills,
  updateEnemySkills,
  updateAllySkills,
  toggleAcMode,
  toggleEnemyAcMode,
  toggleAllyAcMode,
  launchEnemyPlanes,
  resetSkills,
} from "./skills.js";
import {
  updatePlanes,
  drawPlanes,
  updateEnemyPlanes,
  drawEnemyPlanes,
  clearPlanes,
} from "./planes.js";
import { checkCollisions } from "./collision.js";
import {
  updateExplosions,
  drawExplosions,
  clearExplosions,
  updateSplashes,
  drawSplashes,
  clearSplashes,
} from "./effects.js";
import { drawHUD } from "./ui.js";
import { createAiState, updateAi } from "./ai.js";
import {
  updateTypewriter,
  resetTypewriter,
  missions,
  campaign,
} from "./campaign.js";

let lastTimestamp = 0;
let prevGameState = null;
let aiState = null;

const BURST_INTERVAL_MS = 80;
const playerBurstQueue = [];
const enemyBurstQueue = [];
const allyBurstQueue = [];

const WAVE_ENEMY_POOL = ["destroyer", "cruiser", "battleship"];
const WAVE_TRANSITION_MS = 2000;

canvas.addEventListener("mousemove", (event) => {
  const canvasBounds = canvas.getBoundingClientRect();
  mouse.x = event.clientX - canvasBounds.left;
  mouse.y = event.clientY - canvasBounds.top;
  updateCursor();
});

canvas.addEventListener("mousedown", () => {
  mouse.pressed = true;
});
canvas.addEventListener("mouseup", () => {
  mouse.pressed = false;
});

canvas.addEventListener("click", (event) => {
  const canvasBounds = canvas.getBoundingClientRect();
  const mouseX = event.clientX - canvasBounds.left;
  const mouseY = event.clientY - canvasBounds.top;
  if (state.paused) {
    handlePauseClick(mouseX, mouseY);
    return;
  }
  if (state.gameState === "start") handleStartClick(mouseX, mouseY);
  else if (state.gameState === "modeHub") handleModeHubClick(mouseX, mouseY);
  else if (state.gameState === "campaignBriefing")
    handleCampaignBriefingClick(mouseX, mouseY);
  else if (state.gameState === "campaignComplete")
    handleCampaignCompleteClick(mouseX, mouseY);
  else if (state.gameState === "instructions")
    handleInstructionsClick(mouseX, mouseY);
  else if (state.gameState === "modeSelect")
    handleModeSelectClick(mouseX, mouseY);
  else if (state.gameState === "selection")
    handleSelectionClick(mouseX, mouseY);
  else if (state.gameState === "win" || state.gameState === "gameOver")
    handleEndClick(mouseX, mouseY);
});

const pressedOnce = {};
const GAME_KEYS = new Set([
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Numpad2",
  "Numpad4",
  "Numpad5",
  "Numpad6",
  "Numpad7",
  "Numpad8",
  "Numpad9",
]);

window.addEventListener("keydown", (event) => {
  if (GAME_KEYS.has(event.code)) event.preventDefault();
  if (pressedOnce[event.code]) return;
  pressedOnce[event.code] = true;

  if (event.code === "Escape" && state.gameState === "playing") {
    state.paused = !state.paused;
    return;
  }

  if (state.paused) return;

  if (state.gameState === "playing") {
    const p1Alive = (playerMod.player?.health ?? 0) > 0;

    // Player 1
    if (p1Alive) {
      if (event.code === "Space" && playerMod.player.classKey !== "carrier")
        fireBasicAttack();
      if (event.code === "KeyE") triggerSkill();
      if (event.code === "KeyQ") toggleAcMode();
    }

    // Player 2 (human) — active in pvp and co-op, suppressed in pvc
    if (state.mode === "pvp") {
      const p2Alive = (enemyMod.enemy?.health ?? 0) > 0;
      if (p2Alive) {
        if (event.code === "Enter" || event.code === "Numpad5")
          fireEnemyAttack();
        if (event.code === "KeyP" || event.code === "Numpad9")
          triggerEnemySkill();
        if (event.code === "KeyO" || event.code === "Numpad7")
          toggleEnemyAcMode();
      }
    } else if (state.mode === "coop") {
      const allyAlive = (enemyMod.ally?.health ?? 0) > 0;
      if (allyAlive) {
        if (event.code === "Enter" || event.code === "Numpad5")
          fireAllyAttack();
        if (event.code === "KeyP" || event.code === "Numpad9")
          triggerAllySkill();
        if (event.code === "KeyO" || event.code === "Numpad7")
          toggleAllyAcMode();
      }
    }
  }
});
window.addEventListener("keyup", (event) => {
  pressedOnce[event.code] = false;
});

function fireBasicAttack() {
  const player = playerMod.player;
  const enemy = enemyMod.enemy;
  if (!player || player.health <= 0) return;

  if (player.classKey === "carrier") {
    const carrierTarget =
      state.mode === "coop" || state.campaignMode
        ? getNearestWaveEnemy(player)
        : enemy;
    if (!carrierTarget || player.fireCooldown > 0) return;
    const deltaX = carrierTarget.x - player.x;
    const deltaY = carrierTarget.y - player.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance > 500) return;
    player.fireCooldown = player.fireRate;
    spawnPlayerProjectile(
      player.x,
      player.y,
      deltaX / distance,
      deltaY / distance,
      player.damage,
      "basic",
    );
    return;
  }

  if (!player.turrets?.some((t) => t.roundsLeft > 0)) return;
  const totalTurrets = player.turrets.length;
  const spread = player.hitboxShort * 0.8;
  const fwdOffset = player.hitboxLong * 0.45;
  let shotIndex = 0;
  for (let turretIndex = 0; turretIndex < totalTurrets; turretIndex++) {
    const turret = player.turrets[turretIndex];
    if (turret.roundsLeft > 0) {
      turret.roundsLeft--;
      if (turret.timer <= 0) turret.timer = turret.cooldownMs;
      const perpOffset =
        totalTurrets > 1
          ? (turretIndex / (totalTurrets - 1) - 0.5) * spread
          : 0;
      playerBurstQueue.push({
        delay: shotIndex * BURST_INTERVAL_MS,
        dirX: player.dir.x,
        dirY: player.dir.y,
        perpOffset,
        fwdOffset,
      });
      shotIndex++;
    }
  }
}

function fireEnemyAttack() {
  const player = playerMod.player;
  const enemy = enemyMod.enemy;
  if (!enemy || enemy.health <= 0 || !player) return;

  if (enemy.classKey === "carrier") {
    if (enemy.fireCooldown > 0) return;
    const deltaX = player.x - enemy.x;
    const deltaY = player.y - enemy.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance > 500) return;
    enemy.fireCooldown = enemy.fireRate;
    spawnEnemyProjectile(
      enemy.x,
      enemy.y,
      deltaX / distance,
      deltaY / distance,
      enemy.damage,
      "basic",
    );
    return;
  }

  if (!enemy.turrets?.some((t) => t.roundsLeft > 0)) return;
  const totalTurrets = enemy.turrets.length;
  const spread = enemy.hitboxShort * 0.8;
  const fwdOffset = enemy.hitboxLong * 0.45;
  let shotIndex = 0;
  for (let turretIndex = 0; turretIndex < totalTurrets; turretIndex++) {
    const turret = enemy.turrets[turretIndex];
    if (turret.roundsLeft > 0) {
      turret.roundsLeft--;
      if (turret.timer <= 0) turret.timer = turret.cooldownMs;
      const perpOffset =
        totalTurrets > 1
          ? (turretIndex / (totalTurrets - 1) - 0.5) * spread
          : 0;
      enemyBurstQueue.push({
        delay: shotIndex * BURST_INTERVAL_MS,
        dirX: enemy.dir.x,
        dirY: enemy.dir.y,
        perpOffset,
        fwdOffset,
      });
      shotIndex++;
    }
  }
}

function fireAllyAttack() {
  const ally = enemyMod.ally;
  if (!ally || ally.health <= 0) return;

  if (ally.classKey === "carrier") {
    const allyTarget =
      state.mode === "coop" ? getNearestWaveEnemy(ally) : enemyMod.enemy;
    if (!allyTarget || ally.fireCooldown > 0) return;
    const deltaX = allyTarget.x - ally.x;
    const deltaY = allyTarget.y - ally.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance > 500) return;
    ally.fireCooldown = ally.fireRate;
    spawnPlayerProjectile(
      ally.x,
      ally.y,
      deltaX / distance,
      deltaY / distance,
      ally.damage,
      "basic",
    );
    return;
  }

  if (!ally.turrets?.some((t) => t.roundsLeft > 0)) return;
  const totalTurrets = ally.turrets.length;
  const spread = ally.hitboxShort * 0.8;
  const fwdOffset = ally.hitboxLong * 0.45;
  let shotIndex = 0;
  for (let turretIndex = 0; turretIndex < totalTurrets; turretIndex++) {
    const turret = ally.turrets[turretIndex];
    if (turret.roundsLeft > 0) {
      turret.roundsLeft--;
      if (turret.timer <= 0) turret.timer = turret.cooldownMs;
      const perpOffset =
        totalTurrets > 1
          ? (turretIndex / (totalTurrets - 1) - 0.5) * spread
          : 0;
      allyBurstQueue.push({
        delay: shotIndex * BURST_INTERVAL_MS,
        dirX: ally.dir.x,
        dirY: ally.dir.y,
        perpOffset,
        fwdOffset,
      });
      shotIndex++;
    }
  }
}

function fireAiCarrierAttack(primaryTarget) {
  const enemy = enemyMod.enemy;
  if (!enemy || !primaryTarget) return;
  if (enemy.fireCooldown > 0) return;
  const deltaX = primaryTarget.x - enemy.x;
  const deltaY = primaryTarget.y - enemy.y;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance > 500) return;
  enemy.fireCooldown = enemy.fireRate;
  spawnEnemyProjectile(
    enemy.x,
    enemy.y,
    deltaX / distance,
    deltaY / distance,
    enemy.damage,
    "basic",
  );
}

function clampShipToCanvas(ship) {
  ship.x = Math.max(
    ship.width / 2,
    Math.min(canvas.width - ship.width / 2, ship.x),
  );
  ship.y = Math.max(
    ship.height / 2,
    Math.min(canvas.height - ship.height / 2, ship.y),
  );
}

function resolveShipCollisions() {
  const liveShips = [];
  if (playerMod.player?.health > 0) liveShips.push(playerMod.player);
  if (state.mode === "coop" || state.campaignMode) {
    if (enemyMod.ally?.health > 0) liveShips.push(enemyMod.ally);
    for (const waveEnemy of enemyMod.waveEnemies) {
      if (waveEnemy.health > 0) liveShips.push(waveEnemy);
    }
  } else if (enemyMod.enemy?.health > 0) {
    liveShips.push(enemyMod.enemy);
  }

  for (let i = 0; i < liveShips.length; i++) {
    for (let j = i + 1; j < liveShips.length; j++) {
      const shipA = liveShips[i];
      const shipB = liveShips[j];
      const dx = shipB.x - shipA.x;
      const dy = shipB.y - shipA.y;
      const dist = Math.hypot(dx, dy);
      const minDist =
        (shipA.hitboxLong + shipA.hitboxShort) / 4 +
        (shipB.hitboxLong + shipB.hitboxShort) / 4;
      if (dist > 0 && dist < minDist) {
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        shipA.x -= nx * overlap * 0.5;
        shipA.y -= ny * overlap * 0.5;
        shipB.x += nx * overlap * 0.5;
        shipB.y += ny * overlap * 0.5;
        clampShipToCanvas(shipA);
        clampShipToCanvas(shipB);
      }
    }
  }
}

function getNearestWaveEnemy(fromShip) {
  let nearest = null;
  let nearestDist = Infinity;
  for (const waveEnemy of enemyMod.waveEnemies) {
    if (waveEnemy.health <= 0) continue;
    const dist = Math.hypot(waveEnemy.x - fromShip.x, waveEnemy.y - fromShip.y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = waveEnemy;
    }
  }
  return nearest;
}

function fireWaveEnemyAttack(waveEnemy) {
  if (!waveEnemy.turrets?.some((turret) => turret.roundsLeft > 0)) return;
  const totalTurrets = waveEnemy.turrets.length;
  const spread = waveEnemy.hitboxShort * 0.8;
  const fwdOffset = waveEnemy.hitboxLong * 0.45;
  let shotIndex = 0;
  for (let turretIndex = 0; turretIndex < totalTurrets; turretIndex++) {
    const turret = waveEnemy.turrets[turretIndex];
    if (turret.roundsLeft > 0) {
      turret.roundsLeft--;
      if (turret.timer <= 0) turret.timer = turret.cooldownMs;
      const perpOffset =
        totalTurrets > 1
          ? (turretIndex / (totalTurrets - 1) - 0.5) * spread
          : 0;
      enemyBurstQueue.push({
        delay: shotIndex * BURST_INTERVAL_MS,
        dirX: waveEnemy.dir.x,
        dirY: waveEnemy.dir.y,
        perpOffset,
        fwdOffset,
        sourceShip: waveEnemy,
      });
      shotIndex++;
    }
  }
}

function spawnNextWave() {
  state.coopWave++;
  const count = state.coopWave;
  const classes = Array.from(
    { length: count },
    () => WAVE_ENEMY_POOL[Math.floor(Math.random() * WAVE_ENEMY_POOL.length)],
  );
  const padding = canvas.height * 0.15;
  const yPositions =
    count === 1
      ? [canvas.height / 2]
      : Array.from(
          { length: count },
          (_, i) => padding + ((canvas.height - padding * 2) / (count - 1)) * i,
        );
  enemyMod.initWave(classes, yPositions);
  enemyBurstQueue.length = 0;
}

function drawWaveTransitionOverlay() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#f8fafc";
  ctx.font = `bold ${Math.floor(canvas.width * 0.06)}px monospace`;
  ctx.fillText(
    `WAVE ${state.coopWave + 1}`,
    canvas.width / 2,
    canvas.height * 0.42,
  );

  ctx.fillStyle = "#94a3b8";
  ctx.font = `bold ${Math.floor(canvas.width * 0.025)}px monospace`;
  ctx.fillText("GET READY!", canvas.width / 2, canvas.height * 0.56);

  ctx.textBaseline = "alphabetic";
}

function initGame() {
  playerMod.initPlayer(state.playerClass);
  if (state.campaignMode) {
    const missionSpawns = {
      0: { px: 0.3, py: 0.5 },
    };
    const spawn = missionSpawns[campaign.currentMission];
    if (spawn) {
      playerMod.player.x = canvas.width * spawn.px;
      playerMod.player.y = canvas.height * spawn.py;
    }
  }
  if (state.mode === "coop") {
    enemyMod.initAlly(state.player2Class);
    // Place both players side by side on the left
    playerMod.player.x = canvas.width * 0.15;
    playerMod.player.y = canvas.height * 0.37;
    enemyMod.ally.x = canvas.width * 0.15;
    enemyMod.ally.y = canvas.height * 0.63;
    enemyMod.clearWaveEnemies();
    state.coopWave = 0;
    state.waveTransitionTimer = 0;
    spawnNextWave();
    aiState = null;
  } else {
    if (state.campaignMode) {
      const missionEnemies = missions[campaign.currentMission].enemies;
      const classes = missionEnemies.flatMap((e) =>
        Array(e.count).fill(e.type),
      );
      const count = classes.length;
      const padding = canvas.height * 0.15;
      const yPositions =
        count === 1
          ? [canvas.height / 2]
          : Array.from(
              { length: count },
              (_, i) =>
                padding + ((canvas.height - padding * 2) / (count - 1)) * i,
            );
      enemyMod.initWave(classes, yPositions);
      aiState = null;
      if (campaign.currentMission === 2) {
        for (const waveEnemy of enemyMod.waveEnemies) {
          waveEnemy.x = canvas.width * 0.7;
          waveEnemy.y = canvas.height * 0.5;
        }
      }
      if (campaign.currentMission === 4) {
        for (const waveEnemy of enemyMod.waveEnemies) {
          waveEnemy.x = canvas.width * 0.5;
          waveEnemy.y = canvas.height * 0.3;
        }
      }
    } else {
      enemyMod.initEnemy(state.enemyClass, state.mode !== "pvp");
      enemyMod.clearWaveEnemies();
      aiState = state.mode !== "pvp" ? createAiState() : null;
    }
  }

  clearProjectiles();
  clearPlanes();
  clearExplosions();
  clearSplashes();
  resetSkills();
  playerBurstQueue.length = 0;
  enemyBurstQueue.length = 0;
  allyBurstQueue.length = 0;
  state.paused = false;
  state.stats.p1ShotsFired = 0;
  state.stats.p2ShotsFired = 0;
  state.stats.p1DamageDealt = 0;
  state.stats.p2DamageDealt = 0;
  state.stats.matchTimeMs = 0;
}

const backgroundImage = new Image();
backgroundImage.src = "assets/background/arena.png";
const arenaImages = {
  0: new Image(),
  2: new Image(),
  4: new Image(),
};
arenaImages[0].src = "assets/background/arena1.png";
arenaImages[2].src = "assets/background/arena2.png";
arenaImages[4].src = "assets/background/arena3.png";
const titleBackgroundImage = new Image();
titleBackgroundImage.src = "assets/background/title-background.png";

function drawOcean() {
  const activeImage =
    state.campaignMode && arenaImages[state.campaignMission]
      ? arenaImages[state.campaignMission]
      : backgroundImage;
  if (activeImage.complete && activeImage.naturalWidth > 0) {
    ctx.drawImage(activeImage, 0, 0, canvas.width, canvas.height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#0c4a6e");
    gradient.addColorStop(1, "#164e63");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawBoundaryZone() {
  const mx = canvas.width * 0.02;
  const my = canvas.height * 0.02;
  ctx.fillStyle = "rgba(0, 0, 20, 0.28)";
  ctx.fillRect(0, 0, mx, canvas.height);
  ctx.fillRect(canvas.width - mx, 0, mx, canvas.height);
  ctx.fillRect(mx, 0, canvas.width - 2 * mx, my);
  ctx.fillRect(mx, canvas.height - my, canvas.width - 2 * mx, my);
}

function tickBurstQueues(dt) {
  const player = playerMod.player;
  const enemy = enemyMod.enemy;
  const ally = enemyMod.ally;

  for (let index = playerBurstQueue.length - 1; index >= 0; index--) {
    playerBurstQueue[index].delay -= dt;
    if (playerBurstQueue[index].delay <= 0) {
      const shot = playerBurstQueue.splice(index, 1)[0];
      if (player) {
        const perpX = -player.dir.y * shot.perpOffset;
        const perpY = player.dir.x * shot.perpOffset;
        const fwdX = player.dir.x * shot.fwdOffset;
        const fwdY = player.dir.y * shot.fwdOffset;
        spawnPlayerProjectile(
          player.x + perpX + fwdX,
          player.y + perpY + fwdY,
          shot.dirX,
          shot.dirY,
          player.damage,
          "basic",
        );
      }
    }
  }

  for (let index = enemyBurstQueue.length - 1; index >= 0; index--) {
    enemyBurstQueue[index].delay -= dt;
    if (enemyBurstQueue[index].delay <= 0) {
      const shot = enemyBurstQueue.splice(index, 1)[0];
      const source = shot.sourceShip ?? enemy;
      if (source && source.health > 0) {
        const perpX = -source.dir.y * shot.perpOffset;
        const perpY = source.dir.x * shot.perpOffset;
        const fwdX = source.dir.x * shot.fwdOffset;
        const fwdY = source.dir.y * shot.fwdOffset;
        spawnEnemyProjectile(
          source.x + perpX + fwdX,
          source.y + perpY + fwdY,
          shot.dirX,
          shot.dirY,
          source.damage,
          "basic",
        );
      }
    }
  }

  for (let index = allyBurstQueue.length - 1; index >= 0; index--) {
    allyBurstQueue[index].delay -= dt;
    if (allyBurstQueue[index].delay <= 0) {
      const shot = allyBurstQueue.splice(index, 1)[0];
      if (ally) {
        const perpX = -ally.dir.y * shot.perpOffset;
        const perpY = ally.dir.x * shot.perpOffset;
        const fwdX = ally.dir.x * shot.fwdOffset;
        const fwdY = ally.dir.y * shot.fwdOffset;
        spawnPlayerProjectile(
          ally.x + perpX + fwdX,
          ally.y + perpY + fwdY,
          shot.dirX,
          shot.dirY,
          ally.damage,
          "basic",
        );
      }
    }
  }
}

function update(dt) {
  // Handle campaign briefing state
  if (state.gameState === "campaignBriefing") {
    if (prevGameState !== "campaignBriefing") resetTypewriter();
    updateTypewriter(dt);
  }

  // Handle playing state
  if (state.gameState === "playing") {
    if (prevGameState !== "playing") initGame();
    if (state.paused) return;
    state.stats.matchTimeMs += dt;

    if (playerMod.player?.health > 0) {
      playerMod.updatePlayer(dt);
      if (playerMod.player.classKey === "carrier") fireBasicAttack();
    }

    if (state.mode === "pvp") {
      enemyMod.updateEnemy(dt);
      if (enemyMod.enemy?.classKey === "carrier") fireEnemyAttack();
    } else if (state.mode === "coop") {
      // Wave transition countdown
      if (state.waveTransitionTimer > 0) {
        state.waveTransitionTimer -= dt;
        if (
          state.waveTransitionTimer <= 0 &&
          state.coopWave < state.coopTotalWaves
        ) {
          spawnNextWave();
        }
      }

      // Wave enemy AI (skipped while transition overlay is showing)
      if (state.waveTransitionTimer <= 0) {
        const liveTargets = [];
        if (playerMod.player && playerMod.player.health > 0)
          liveTargets.push(playerMod.player);
        if (enemyMod.ally && enemyMod.ally.health > 0)
          liveTargets.push(enemyMod.ally);

        for (const waveEnemy of enemyMod.waveEnemies) {
          if (waveEnemy.health <= 0) continue;
          if (liveTargets.length > 0) {
            const aiResult = updateAi(
              waveEnemy,
              liveTargets,
              waveEnemy.aiState,
              dt,
            );

            enemyMod.updateWaveShipWithInput(
              waveEnemy,
              aiResult.moveX,
              aiResult.moveY,
              dt,
            );
            waveEnemy.dir.x = aiResult.aimX;
            waveEnemy.dir.y = aiResult.aimY;
            if (aiResult.fire) fireWaveEnemyAttack(waveEnemy);
            // useSkill intentionally ignored — wave enemies fire turrets only
          } else {
            enemyMod.updateWaveShipWithInput(waveEnemy, 0, 0, dt);
          }
        }

        // Wave clear check
        if (
          enemyMod.waveEnemies.length > 0 &&
          enemyMod.waveEnemies.every((waveEnemy) => waveEnemy.health <= 0)
        ) {
          if (state.coopWave >= state.coopTotalWaves) {
            state.gameState = "win";
          } else {
            state.waveTransitionTimer = WAVE_TRANSITION_MS;
          }
        }
      }

      // P2 ally (human keyboard)
      if (enemyMod.ally && enemyMod.ally.health > 0) {
        enemyMod.updateAlly(dt);
        if (enemyMod.ally.classKey === "carrier") fireAllyAttack();
        updateAllySkills(dt);
      }
    } else {
      if (state.campaignMode) {
        // campaign — AI controls waveEnemies, no ally
        const liveTargets = [];
        if (playerMod.player && playerMod.player.health > 0)
          liveTargets.push(playerMod.player);
        for (const waveEnemy of enemyMod.waveEnemies) {
          if (waveEnemy.health <= 0) continue;
          if (liveTargets.length > 0) {
            const aiResult = updateAi(
              waveEnemy,
              liveTargets,
              waveEnemy.aiState,
              dt,
            );
            enemyMod.updateWaveShipWithInput(
              waveEnemy,
              aiResult.moveX,
              aiResult.moveY,
              dt,
            );
            waveEnemy.dir.x = aiResult.aimX;
            waveEnemy.dir.y = aiResult.aimY;
            if (aiResult.fire) fireWaveEnemyAttack(waveEnemy);
          }
        }
        if (
          enemyMod.waveEnemies.length > 0 &&
          enemyMod.waveEnemies.every((e) => e.health <= 0)
        ) {
          state.gameState = "win";
        }
        if (!playerMod.player || playerMod.player.health <= 0)
          state.gameState = "gameOver";
      } else {
        // pvc — AI controls single enemy
        const liveTargets = [];
        if (playerMod.player && playerMod.player.health > 0)
          liveTargets.push(playerMod.player);

        if (
          liveTargets.length > 0 &&
          enemyMod.enemy &&
          enemyMod.enemy.health > 0 &&
          aiState
        ) {
          const ai = updateAi(enemyMod.enemy, liveTargets, aiState, dt);
          enemyMod.updateEnemyWithInput(ai.moveX, ai.moveY, dt);
          if (enemyMod.enemy) {
            enemyMod.enemy.dir.x = ai.aimX;
            enemyMod.enemy.dir.y = ai.aimY;
          }
          if (ai.fire) {
            if (enemyMod.enemy?.classKey === "carrier") {
              fireAiCarrierAttack(liveTargets[0]);
            } else {
              fireEnemyAttack();
            }
          }
          if (ai.useSkill) {
            if (enemyMod.enemy?.classKey === "carrier") {
              const skillTarget = liveTargets.reduce((lowest, target) =>
                target.health < lowest.health ? target : lowest,
              );
              launchEnemyPlanes(skillTarget);
            } else {
              triggerEnemySkill();
            }
          }
          if (ai.toggleMode) toggleEnemyAcMode();
        } else if (enemyMod.enemy) {
          enemyMod.updateEnemyWithInput(0, 0, dt);
        }
      }
    }

    resolveShipCollisions();
    tickBurstQueues(dt);
    updateProjectiles(dt);
    updateSkills(dt);
    if (state.mode !== "coop") updateEnemySkills(dt);
    updatePlanes(dt);
    updateEnemyPlanes(dt);
    checkCollisions();
    updateExplosions(dt);
    updateSplashes(dt);
  }
  prevGameState = state.gameState;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state.gameState === "start") {
    drawStartScreen(titleBackgroundImage);
  } else if (state.gameState === "modeHub") {
    drawModeHubScreen();
  } else if (state.gameState === "campaignBriefing") {
    drawCampaignBriefingScreen();
  } else if (state.gameState === "campaignComplete") {
    drawCampaignCompleteScreen();
  } else if (state.gameState === "instructions") {
    drawInstructionsScreen();
  } else if (state.gameState === "modeSelect") {
    drawModeSelectScreen();
  } else if (state.gameState === "selection") {
    drawSelectionScreen();
  } else if (state.gameState === "playing") {
    drawOcean();
    drawBoundaryZone();
    drawProjectiles();
    drawPlanes();
    drawEnemyPlanes();
    playerMod.drawPlayer();
    if (state.mode === "coop" || state.campaignMode) {
      enemyMod.drawWaveEnemies();
      if (enemyMod.ally) enemyMod.drawAlly();
    } else {
      enemyMod.drawEnemy();
    }
    drawExplosions();
    drawSplashes();
    drawHUD();
    if (state.mode === "coop" && state.waveTransitionTimer > 0)
      drawWaveTransitionOverlay();
    if (state.paused) drawPauseScreen();
  } else if (state.gameState === "win") {
    drawOcean();
    drawBoundaryZone();
    playerMod.drawPlayer();
    if (state.mode === "coop" || state.campaignMode) {
      enemyMod.drawWaveEnemies();
      if (enemyMod.ally) enemyMod.drawAlly();
    } else {
      enemyMod.drawEnemy();
    }
    drawWinScreen();
  } else if (state.gameState === "gameOver") {
    drawOcean();
    drawBoundaryZone();
    playerMod.drawPlayer();
    if (state.mode === "coop" || state.campaignMode) {
      enemyMod.drawWaveEnemies();
      if (enemyMod.ally) enemyMod.drawAlly();
    } else {
      enemyMod.drawEnemy();
    }
    drawGameOverScreen();
  }
}

function gameLoop(timestamp) {
  const dt = timestamp - lastTimestamp;
  lastTimestamp = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame((timestamp) => {
  lastTimestamp = timestamp;
  requestAnimationFrame(gameLoop);
});
