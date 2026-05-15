import { ctx } from "./canvas.js";

const explosionImage = new Image();
explosionImage.src = "assets/effects/explosion.png";

const splashImage = new Image();
splashImage.src = "assets/effects/splash.png";

const SPLASH_COLS = 4;
const SPLASH_ROWS = 2;
const SPLASH_FRAME_COUNT = SPLASH_COLS * SPLASH_ROWS;
const SPLASH_FRAME_DURATION_MS = 80;
const SPLASH_SIZE = 48;

const activeSplashes = [];

export function spawnSplash(x, y) {
  activeSplashes.push({ x, y, frame: 0, timer: 0 });
}

export function updateSplashes(dt) {
  for (let index = activeSplashes.length - 1; index >= 0; index--) {
    const splash = activeSplashes[index];
    splash.timer += dt;
    if (splash.timer >= SPLASH_FRAME_DURATION_MS) {
      splash.timer -= SPLASH_FRAME_DURATION_MS;
      splash.frame++;
    }
    if (splash.frame >= SPLASH_FRAME_COUNT) {
      activeSplashes.splice(index, 1);
    }
  }
}

export function drawSplashes() {
  if (!splashImage.complete || splashImage.naturalWidth === 0) return;
  const frameW = splashImage.naturalWidth / SPLASH_COLS;
  const frameH = splashImage.naturalHeight / SPLASH_ROWS;
  for (const splash of activeSplashes) {
    const col = splash.frame % SPLASH_COLS;
    const row = Math.floor(splash.frame / SPLASH_COLS);
    ctx.drawImage(
      splashImage,
      col * frameW, row * frameH, frameW, frameH,
      splash.x - SPLASH_SIZE / 2, splash.y - SPLASH_SIZE / 2,
      SPLASH_SIZE, SPLASH_SIZE,
    );
  }
}

export function clearSplashes() {
  activeSplashes.length = 0;
}

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
