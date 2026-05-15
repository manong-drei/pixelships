import { canvas } from "./canvas.js";
import { createShip, updateShip, drawShip } from "./ship.js";

export let player = null;

const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

export function getKeys() {
  return keys;
}

export function initPlayer(classKey) {
  player = createShip(classKey, canvas.width * 0.1, 1);
}

export function updatePlayer(dt) {
  let moveX = 0,
    moveY = 0;
  if (keys["KeyW"]) moveY -= 1;
  if (keys["KeyS"]) moveY += 1;
  if (keys["KeyA"]) moveX -= 1;
  if (keys["KeyD"]) moveX += 1;
  updateShip(player, moveX, moveY, dt);
}

export function drawPlayer() {
  drawShip(player);
}
