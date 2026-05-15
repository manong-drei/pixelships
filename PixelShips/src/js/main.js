import { canvas, ctx, mouse } from "./canvas.js";
import { state } from "./state.js";
import {
  drawStartScreen,
  drawSelectionScreen,
  drawWinScreen,
  drawGameOverScreen,
  drawPauseScreen,
  handleStartClick,
  handleSelectionClick,
  handleEndClick,
  handlePauseClick,
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
  updateSkills,
  updateEnemySkills,
  toggleAcMode,
  toggleEnemyAcMode,
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

let lastTimestamp = 0;
let prevGameState = null;

const BURST_INTERVAL_MS = 80;
const playerBurstQueue = [];
const enemyBurstQueue = [];

canvas.addEventListener("mousemove", (event) => {
  const canvasBounds = canvas.getBoundingClientRect();
  mouse.x = event.clientX - canvasBounds.left;
  mouse.y = event.clientY - canvasBounds.top;
  updateCursor();
});

canvas.addEventListener("mousedown", () => { mouse.pressed = true; });
canvas.addEventListener("mouseup", () => { mouse.pressed = false; });

canvas.addEventListener("click", (event) => {
  const canvasBounds = canvas.getBoundingClientRect();
  const mouseX = event.clientX - canvasBounds.left;
  const mouseY = event.clientY - canvasBounds.top;
  if (state.paused) { handlePauseClick(mouseX, mouseY); return; }
  if (state.gameState === "start") handleStartClick(mouseX, mouseY);
  else if (state.gameState === "selection")
    handleSelectionClick(mouseX, mouseY);
  else if (state.gameState === "win" || state.gameState === "gameOver")
    handleEndClick(mouseX, mouseY);
});

const pressedOnce = {};
window.addEventListener("keydown", (event) => {
  if (pressedOnce[event.code]) return;
  pressedOnce[event.code] = true;

  if (event.code === "Escape" && state.gameState === "playing") {
    state.paused = !state.paused;
    return;
  }

  if (state.paused) return;

  if (state.gameState === "playing") {
    // Player 1
    if (event.code === "Space" && playerMod.player?.classKey !== "carrier")
      fireBasicAttack();
    if (event.code === "KeyE") triggerSkill();
    if (event.code === "KeyQ") toggleAcMode();

    // Player 2
    if (event.code === "Enter" || event.code === "Numpad5") fireEnemyAttack();
    if (event.code === "KeyP" || event.code === "Numpad9") triggerEnemySkill();
    if (event.code === "KeyO" || event.code === "Numpad7") toggleEnemyAcMode();
  }
});
window.addEventListener("keyup", (event) => {
  pressedOnce[event.code] = false;
});

function fireBasicAttack() {
  const player = playerMod.player;
  const enemy = enemyMod.enemy;
  if (!player) return;

  if (player.classKey === "carrier") {
    if (!enemy || player.fireCooldown > 0) return;
    const deltaX = enemy.x - player.x;
    const deltaY = enemy.y - player.y;
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
  if (!enemy || !player) return;

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

function initGame() {
  playerMod.initPlayer(state.playerClass);
  enemyMod.initEnemy(state.enemyClass);
  clearProjectiles();
  clearPlanes();
  clearExplosions();
  clearSplashes();
  resetSkills();
  playerBurstQueue.length = 0;
  enemyBurstQueue.length = 0;
  state.paused = false;
  state.stats.p1ShotsFired = 0;
  state.stats.p2ShotsFired = 0;
  state.stats.p1DamageDealt = 0;
  state.stats.p2DamageDealt = 0;
  state.stats.matchTimeMs = 0;
}

const backgroundImage = new Image();
backgroundImage.src = "assets/background/arena1.png";

const titleBackgroundImage = new Image();
titleBackgroundImage.src = "assets/background/title-background.png";

function drawOcean() {
  if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#0c4a6e");
    gradient.addColorStop(1, "#164e63");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function tickBurstQueues(dt) {
  const player = playerMod.player;
  const enemy = enemyMod.enemy;

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
      if (enemy) {
        const perpX = -enemy.dir.y * shot.perpOffset;
        const perpY = enemy.dir.x * shot.perpOffset;
        const fwdX = enemy.dir.x * shot.fwdOffset;
        const fwdY = enemy.dir.y * shot.fwdOffset;
        spawnEnemyProjectile(
          enemy.x + perpX + fwdX,
          enemy.y + perpY + fwdY,
          shot.dirX,
          shot.dirY,
          enemy.damage,
          "basic",
        );
      }
    }
  }
}

function update(dt) {
  if (state.gameState === "playing") {
    if (prevGameState !== "playing") initGame();
    if (state.paused) return;
    state.stats.matchTimeMs += dt;
    playerMod.updatePlayer(dt);
    if (playerMod.player?.classKey === "carrier") fireBasicAttack();
    enemyMod.updateEnemy(dt);
    if (enemyMod.enemy?.classKey === "carrier") fireEnemyAttack();
    tickBurstQueues(dt);
    updateProjectiles(dt);
    updateSkills(dt);
    updateEnemySkills(dt);
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
  } else if (state.gameState === "selection") {
    drawSelectionScreen();
  } else if (state.gameState === "playing") {
    drawOcean();
    drawProjectiles();
    drawPlanes();
    drawEnemyPlanes();
    playerMod.drawPlayer();
    enemyMod.drawEnemy();
    drawExplosions();
    drawSplashes();
    drawHUD();
    if (state.paused) drawPauseScreen();
  } else if (state.gameState === "win") {
    drawOcean();
    playerMod.drawPlayer();
    enemyMod.drawEnemy();
    drawWinScreen();
  } else if (state.gameState === "gameOver") {
    drawOcean();
    playerMod.drawPlayer();
    enemyMod.drawEnemy();
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
