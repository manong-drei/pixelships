import { canvas } from "./canvas.js";
import { createShip, updateShip, drawShip } from "./ship.js";

export let enemy = null;

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

export function initEnemy(classKey) {
  enemy = createShip(classKey, canvas.width * 0.9, -1);
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

export function drawEnemy() {
  drawShip(enemy);
}
