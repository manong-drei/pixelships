import { player } from "./player.js";
import { enemy } from "./enemy.js";
import { playerProjectiles, enemyProjectiles } from "./projectiles.js";
import { state } from "./state.js";
import { spawnExplosion } from "./effects.js";

function overlaps(aX, aY, aWidth, aHeight, bX, bY, bWidth, bHeight) {
  return (
    aX - aWidth / 2 < bX + bWidth / 2 &&
    aX + aWidth / 2 > bX - bWidth / 2 &&
    aY - aHeight / 2 < bY + bHeight / 2 &&
    aY + aHeight / 2 > bY - bHeight / 2
  );
}

function explode(projectile, size) {
  if (projectile.hasExploded) return;
  projectile.hasExploded = true;
  spawnExplosion(projectile.x, projectile.y, size);
}

const BLAST_RADIUS = 60;

const EXPLOSION_SIZE = {
  basic:   40,
  torpedo: 128,
  bomb:    128,
};

export function checkCollisions() {
  if (!player || !enemy) return;

  for (const projectile of playerProjectiles) {
    if (!projectile.active) continue;
    if (projectile.type === "bomb") {
      if (!projectile.detonating) continue;
      explode(projectile, EXPLOSION_SIZE.bomb);
      if (
        Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) <
        BLAST_RADIUS
      ) {
        enemy.health -= projectile.damage;
        if (enemy.health <= 0) state.gameState = "win";
      }
      projectile.active = false;
      continue;
    }
    if (
      overlaps(
        projectile.x,
        projectile.y,
        projectile.width,
        projectile.height,
        enemy.x,
        enemy.y,
        enemy.hitboxW,
        enemy.hitboxH,
      )
    ) {
      explode(projectile, EXPLOSION_SIZE[projectile.type]);
      enemy.health -= projectile.damage;
      projectile.active = false;
      if (enemy.health <= 0) state.gameState = "win";
    }
  }

  for (const projectile of enemyProjectiles) {
    if (!projectile.active) continue;
    if (projectile.type === "bomb") {
      if (!projectile.detonating) continue;
      explode(projectile, EXPLOSION_SIZE.bomb);
      if (
        Math.hypot(projectile.x - player.x, projectile.y - player.y) <
        BLAST_RADIUS
      ) {
        player.health -= projectile.damage;
        if (player.health <= 0) state.gameState = "gameOver";
      }
      projectile.active = false;
      continue;
    }
    if (
      overlaps(
        projectile.x,
        projectile.y,
        projectile.width,
        projectile.height,
        player.x,
        player.y,
        player.hitboxW,
        player.hitboxH,
      )
    ) {
      explode(projectile, EXPLOSION_SIZE[projectile.type]);
      player.health -= projectile.damage;
      projectile.active = false;
      if (player.health <= 0) state.gameState = "gameOver";
    }
  }
}
