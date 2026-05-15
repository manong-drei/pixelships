import { canvas, ctx } from "./canvas.js";
import {
  getShellSprite,
  getTorpedoSpriteSheet,
  getBombSprite,
} from "./assets.js";
import { spawnSplash } from "./effects.js";
import { state } from "./state.js";

export const playerProjectiles = [];
export const enemyProjectiles = [];

export const ProjectileType = {
  basic: {
    speedMultiplier: 1,
    color: "#7dd3fc",
    useSprite: true,
    hasRangeFalloff: true,
    isStationary: false,
    damage: null,
  },
  torpedo: {
    speedMultiplier: 0.35,
    color: "#fde68a",
    useSprite: true,
    hasRangeFalloff: false,
    isStationary: false,
    damage: 10,
  },
  bomb: {
    speedMultiplier: 1,
    color: "#7dd3fc",
    useSprite: true,
    hasRangeFalloff: false,
    isStationary: true,
    damage: 20,
  },
};

const TORPEDO_COLS = 4;
const TORPEDO_ROWS = 2;
const TORPEDO_FRAME_COUNT = TORPEDO_COLS * TORPEDO_ROWS;
const TORPEDO_FRAME_DURATION = 80;
const TORPEDO_DRAW_SIZE = 32;

function createProjectile(posX, posY, dirX, dirY, damage, type, lifetime) {
  return {
    x: posX,
    y: posY,
    dirX,
    dirY,
    damage,
    type,
    width: 3,
    height: 6,
    active: true,
    lifetime,
    detonating: false,
    hasExploded: false,
    distanceTraveled: 0,
    frame: 0,
    frameTimer: 0,
  };
}

export function spawnPlayerProjectile(
  posX,
  posY,
  dirX,
  dirY,
  damage,
  type = "basic",
) {
  state.stats.p1ShotsFired++;
  playerProjectiles.push(
    createProjectile(
      posX,
      posY,
      dirX,
      dirY,
      damage,
      type,
      type === "bomb" ? 600 : null,
    ),
  );
}

export function spawnEnemyProjectile(
  posX,
  posY,
  dirX,
  dirY,
  damage,
  type = "basic",
) {
  state.stats.p2ShotsFired++;
  enemyProjectiles.push(
    createProjectile(
      posX,
      posY,
      dirX,
      dirY,
      damage,
      type,
      type === "bomb" ? 700 : null,
    ),
  );
}

const BASIC_MAX_RANGE = () => canvas.width * 0.4;
const BASIC_FALLOFF_RANGE = () => canvas.width * 0.08;

function advanceProjectile(projectile, baseSpeed) {
  const typeConfig = ProjectileType[projectile.type];
  let speed = baseSpeed * typeConfig.speedMultiplier;

  if (typeConfig.hasRangeFalloff) {
    const maxRange = BASIC_MAX_RANGE();
    const falloffRange = BASIC_FALLOFF_RANGE();
    const overshoot = projectile.distanceTraveled - maxRange;
    if (overshoot > 0) {
      speed *= Math.max(0, 1 - overshoot / falloffRange);
      if (speed < 0.3) {
        projectile.active = false;
        if (projectile.type === "basic") spawnSplash(projectile.x, projectile.y);
        return;
      }
    }
    projectile.distanceTraveled += speed;
  }

  projectile.x += projectile.dirX * speed;
  projectile.y += projectile.dirY * speed;

  if (
    projectile.x < 0 ||
    projectile.x > canvas.width ||
    projectile.y < 0 ||
    projectile.y > canvas.height
  ) {
    projectile.active = false;
  }
}

export function updateProjectiles(dt) {
  const baseSpeed = 9;

  for (const projectile of playerProjectiles) {
    if (!projectile.active) continue;
    if (ProjectileType[projectile.type].isStationary) {
      projectile.lifetime -= dt;
      if (projectile.lifetime <= 0) projectile.detonating = true;
      continue;
    }
    advanceProjectile(projectile, baseSpeed);
    if (projectile.type === "torpedo") advanceTorpedoFrame(projectile, dt);
  }

  for (const projectile of enemyProjectiles) {
    if (!projectile.active) continue;
    if (ProjectileType[projectile.type].isStationary) {
      projectile.lifetime -= dt;
      if (projectile.lifetime <= 0) projectile.detonating = true;
      continue;
    }
    advanceProjectile(projectile, baseSpeed);
    if (projectile.type === "torpedo") advanceTorpedoFrame(projectile, dt);
  }

  removeInactive(playerProjectiles);
  removeInactive(enemyProjectiles);
}

function advanceTorpedoFrame(projectile, dt) {
  projectile.frameTimer += dt;
  if (projectile.frameTimer >= TORPEDO_FRAME_DURATION) {
    projectile.frameTimer -= TORPEDO_FRAME_DURATION;
    projectile.frame = (projectile.frame + 1) % TORPEDO_FRAME_COUNT;
  }
}

const SHELL_SIZE = 16;

function drawProjectile(projectile) {
  const typeConfig = ProjectileType[projectile.type];
  ctx.save();
  ctx.translate(projectile.x, projectile.y);

  if (projectile.type === "torpedo") {
    const sheet = getTorpedoSpriteSheet();
    if (sheet.complete && sheet.naturalWidth > 0) {
      const frameW = sheet.naturalWidth / TORPEDO_COLS;
      const frameH = sheet.naturalHeight / TORPEDO_ROWS;
      const col = projectile.frame % TORPEDO_COLS;
      const row = Math.floor(projectile.frame / TORPEDO_COLS);
      ctx.rotate(Math.atan2(projectile.dirY, projectile.dirX) + Math.PI);
      ctx.drawImage(
        sheet,
        col * frameW,
        row * frameH,
        frameW,
        frameH,
        -TORPEDO_DRAW_SIZE / 2,
        -TORPEDO_DRAW_SIZE / 2,
        TORPEDO_DRAW_SIZE,
        TORPEDO_DRAW_SIZE,
      );
    } else {
      ctx.fillStyle = typeConfig.color;
      ctx.rotate(Math.atan2(projectile.dirY, projectile.dirX) + Math.PI / 2);
      ctx.fillRect(
        -projectile.width / 2,
        -projectile.height / 2,
        projectile.width,
        projectile.height,
      );
    }
  } else if (projectile.type === "bomb") {
    const sprite = getBombSprite();
    if (sprite.complete && sprite.naturalWidth > 0) {
      const bombSize = 24;
      ctx.drawImage(sprite, -bombSize / 2, -bombSize / 2, bombSize, bombSize);
    } else {
      ctx.fillStyle = typeConfig.color;
      ctx.fillRect(
        -projectile.width / 2,
        -projectile.height / 2,
        projectile.width,
        projectile.height,
      );
    }
  } else if (typeConfig.useSprite) {
    const sprite = getShellSprite(projectile.dirX, projectile.dirY);
    if (sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(
        sprite,
        -SHELL_SIZE / 2,
        -SHELL_SIZE / 2,
        SHELL_SIZE,
        SHELL_SIZE,
      );
    } else {
      ctx.fillStyle = typeConfig.color;
      ctx.rotate(Math.atan2(projectile.dirY, projectile.dirX) + Math.PI / 2);
      ctx.fillRect(
        -projectile.width / 2,
        -projectile.height / 2,
        projectile.width,
        projectile.height,
      );
    }
  } else {
    ctx.fillStyle = typeConfig.color;
    ctx.rotate(Math.atan2(projectile.dirY, projectile.dirX) + Math.PI / 2);
    ctx.fillRect(
      -projectile.width / 2,
      -projectile.height / 2,
      projectile.width,
      projectile.height,
    );
  }

  ctx.restore();
}

export function drawProjectiles() {
  for (const projectile of playerProjectiles) {
    if (!projectile.active) continue;
    drawProjectile(projectile);
  }

  for (const projectile of enemyProjectiles) {
    if (!projectile.active) continue;
    drawProjectile(projectile);
  }
}

export function clearProjectiles() {
  playerProjectiles.length = 0;
  enemyProjectiles.length = 0;
}

function removeInactive(projectileArray) {
  for (let index = projectileArray.length - 1; index >= 0; index--) {
    if (!projectileArray[index].active) projectileArray.splice(index, 1);
  }
}
