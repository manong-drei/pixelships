import { canvas } from "./canvas.js";
import { createShip, updateShip, drawShip } from "./ship.js";
import { createAiState } from "./ai.js";

const AI_HEALTH_MULT = 0.6;
const AI_DAMAGE_MULT = 0.6;

export let enemy = null;
export let ally = null;
export let waveEnemies = [];

const p2Keys = {};
window.addEventListener("keydown", (e) => {
  p2Keys[e.code] = true;
});
window.addEventListener("keyup", (e) => {
  p2Keys[e.code] = false;
});

export function getP2Keys() {
  return p2Keys;
}

export function initEnemy(classKey, isAi = false) {
  enemy = createShip(classKey, canvas.width * 0.9, -1);
  if (isAi) {
    enemy.health = Math.round(enemy.health * AI_HEALTH_MULT);
    enemy.maxHealth = enemy.health;
    enemy.damage = Math.round(enemy.damage * AI_DAMAGE_MULT);
  }
}

export function initAlly(classKey) {
  ally = createShip(classKey, canvas.width * 0.2, 1);
}

export function initWave(enemyClasses, yPositions) {
  waveEnemies = [];
  for (let index = 0; index < enemyClasses.length; index++) {
    const ship = createShip(enemyClasses[index], canvas.width * 0.9, -1);
    ship.y = yPositions[index];
    ship.health = Math.round(ship.health * AI_HEALTH_MULT);
    ship.maxHealth = ship.health;
    ship.damage = Math.round(ship.damage * AI_DAMAGE_MULT);
    ship.aiState = createAiState();
    waveEnemies.push(ship);
  }
}

export function clearWaveEnemies() {
  waveEnemies = [];
}

export function updateEnemy(dt) {
  let moveX = 0,
    moveY = 0;
  if (p2Keys["Numpad8"] || p2Keys["ArrowUp"]) moveY -= 1;
  if (p2Keys["Numpad2"] || p2Keys["ArrowDown"]) moveY += 1;
  if (p2Keys["Numpad4"] || p2Keys["ArrowLeft"]) moveX -= 1;
  if (p2Keys["Numpad6"] || p2Keys["ArrowRight"]) moveX += 1;
  updateShip(enemy, moveX, moveY, dt);
}

export function updateEnemyWithInput(moveX, moveY, dt) {
  updateShip(enemy, moveX, moveY, dt);
}

export function updateWaveShipWithInput(ship, moveX, moveY, dt) {
  updateShip(ship, moveX, moveY, dt);
}

export function updateAlly(dt) {
  let moveX = 0,
    moveY = 0;
  if (p2Keys["Numpad8"] || p2Keys["ArrowUp"]) moveY -= 1;
  if (p2Keys["Numpad2"] || p2Keys["ArrowDown"]) moveY += 1;
  if (p2Keys["Numpad4"] || p2Keys["ArrowLeft"]) moveX -= 1;
  if (p2Keys["Numpad6"] || p2Keys["ArrowRight"]) moveX += 1;
  updateShip(ally, moveX, moveY, dt);
}

export function drawEnemy() {
  drawShip(enemy);
}

export function drawAlly() {
  drawShip(ally);
}

export function drawWaveEnemies() {
  for (const ship of waveEnemies) {
    drawShip(ship);
  }
}
