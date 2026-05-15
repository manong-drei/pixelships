import { ctx } from "./canvas.js";

const explosionImage = new Image();
explosionImage.src = "assets/effects/explosion.png";

const FRAME_COUNT = 8;
const FRAME_W = 352;
const FRAME_H = 366;
const FRAME_DURATION_MS = 100;

const activeExplosions = [];

export function spawnExplosion(x, y, size = 254) {
  activeExplosions.push({ x, y, frame: 0, timer: 0, size });
}

export function updateExplosions(dt) {
  for (let index = activeExplosions.length - 1; index >= 0; index--) {
    const explosion = activeExplosions[index];
    explosion.timer += dt;
    if (explosion.timer >= FRAME_DURATION_MS) {
      explosion.timer -= FRAME_DURATION_MS;
      explosion.frame++;
    }
    if (explosion.frame >= FRAME_COUNT) {
      activeExplosions.splice(index, 1);
    }
  }
}

export function drawExplosions() {
  if (!explosionImage.complete || explosionImage.naturalWidth === 0) return;
  for (const explosion of activeExplosions) {
    const srcY = explosion.frame * FRAME_H;
    ctx.drawImage(
      explosionImage,
      0,
      srcY,
      FRAME_W,
      FRAME_H,
      explosion.x - explosion.size / 2,
      explosion.y - explosion.size / 2,
      explosion.size,
      explosion.size,
    );
  }
}

export function clearExplosions() {
  activeExplosions.length = 0;
}
