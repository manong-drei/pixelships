import { canvas, ctx } from "./canvas.js";
import { getShellSprite } from "./assets.js";

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
    useSprite: false,
    hasRangeFalloff: false,
    isStationary: false,
    damage: 10,
  },
  bomb: {
    speedMultiplier: 1,
    color: "#7dd3fc",
    useSprite: false,
    hasRangeFalloff: false,
    isStationary: true,
    damage: 20,
  },
};

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
  }

  for (const projectile of enemyProjectiles) {
    if (!projectile.active) continue;
    if (ProjectileType[projectile.type].isStationary) {
      projectile.lifetime -= dt;
      if (projectile.lifetime <= 0) projectile.detonating = true;
      continue;
    }
    advanceProjectile(projectile, baseSpeed);
  }

  removeInactive(playerProjectiles);
  removeInactive(enemyProjectiles);
}

const SHELL_SIZE = 16;

function drawProjectile(projectile) {
  const typeConfig = ProjectileType[projectile.type];
  ctx.save();
  ctx.translate(projectile.x, projectile.y);

  if (typeConfig.useSprite) {
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
