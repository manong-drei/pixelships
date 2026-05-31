import { player } from "./player.js";
import * as enemyMod from "./enemy.js";
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
  basic: 40,
  torpedo: 128,
  bomb: 128,
};

function checkGameOver() {
  const playerDead = !player || player.health <= 0;
  const ally = enemyMod.ally;
  if (state.mode === "coop") {
    const allyDead = !ally || ally.health <= 0;
    if (playerDead && allyDead) state.gameState = "gameOver";
  } else {
    if (playerDead) state.gameState = "gameOver";
  }
}

export function checkCollisions() {
  if (!player) return;

  const ally = enemyMod.ally;

  if (state.mode === "coop" || state.campaignMode) {
    checkCoopCollisions(ally);
    return;
  }

  const enemy = enemyMod.enemy;
  if (!enemy) return;

  // Player projectiles → enemy
  for (const projectile of playerProjectiles) {
    if (!projectile.active) continue;
    if (projectile.type === "bomb") {
      if (!projectile.detonating) continue;
      explode(projectile, EXPLOSION_SIZE.bomb);
      if (
        Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) <
        BLAST_RADIUS
      ) {
        const dmg = Math.min(projectile.damage, enemy.health);
        enemy.health -= dmg;
        state.stats.p1DamageDealt += dmg;
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
      const dmg = Math.min(projectile.damage, enemy.health);
      enemy.health -= dmg;
      state.stats.p1DamageDealt += dmg;
      projectile.active = false;
      if (enemy.health <= 0) state.gameState = "win";
    }
  }

  // Enemy projectiles → player (and ally in co-op)
  for (const projectile of enemyProjectiles) {
    if (!projectile.active) continue;
    if (projectile.type === "bomb") {
      if (!projectile.detonating) continue;
      explode(projectile, EXPLOSION_SIZE.bomb);
      if (
        player.health > 0 &&
        Math.hypot(projectile.x - player.x, projectile.y - player.y) <
          BLAST_RADIUS
      ) {
        const dmg = Math.min(projectile.damage, player.health);
        player.health -= dmg;
        state.stats.p2DamageDealt += dmg;
        checkGameOver();
      }
      projectile.active = false;
      continue;
    }
    if (
      player.health > 0 &&
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
      const dmg = Math.min(projectile.damage, player.health);
      player.health -= dmg;
      state.stats.p2DamageDealt += dmg;
      projectile.active = false;
      checkGameOver();
    }
  }
}

function checkCoopCollisions(ally) {
  // Player projectiles → each live wave enemy
  for (const projectile of playerProjectiles) {
    if (!projectile.active) continue;
    for (const waveEnemy of enemyMod.waveEnemies) {
      if (waveEnemy.health <= 0) continue;
      if (projectile.type === "bomb") {
        if (!projectile.detonating) continue;
        explode(projectile, EXPLOSION_SIZE.bomb);
        if (
          Math.hypot(projectile.x - waveEnemy.x, projectile.y - waveEnemy.y) <
          BLAST_RADIUS
        ) {
          const dmg = Math.min(projectile.damage, waveEnemy.health);
          waveEnemy.health -= dmg;
          state.stats.p1DamageDealt += dmg;
        }
        projectile.active = false;
        break;
      }
      if (
        overlaps(
          projectile.x,
          projectile.y,
          projectile.width,
          projectile.height,
          waveEnemy.x,
          waveEnemy.y,
          waveEnemy.hitboxW,
          waveEnemy.hitboxH,
        )
      ) {
        explode(projectile, EXPLOSION_SIZE[projectile.type]);
        const dmg = Math.min(projectile.damage, waveEnemy.health);
        waveEnemy.health -= dmg;
        state.stats.p1DamageDealt += dmg;
        projectile.active = false;
        break;
      }
    }
  }

  // Enemy projectiles → player and ally
  for (const projectile of enemyProjectiles) {
    if (!projectile.active) continue;
    if (projectile.type === "bomb") {
      if (!projectile.detonating) continue;
      explode(projectile, EXPLOSION_SIZE.bomb);
      if (
        player.health > 0 &&
        Math.hypot(projectile.x - player.x, projectile.y - player.y) <
          BLAST_RADIUS
      ) {
        const dmg = Math.min(projectile.damage, player.health);
        player.health -= dmg;
        state.stats.p2DamageDealt += dmg;
        checkGameOver();
      }
      if (
        ally &&
        ally.health > 0 &&
        Math.hypot(projectile.x - ally.x, projectile.y - ally.y) < BLAST_RADIUS
      ) {
        const dmg = Math.min(projectile.damage, ally.health);
        ally.health -= dmg;
        checkGameOver();
      }
      projectile.active = false;
      continue;
    }
    if (
      player.health > 0 &&
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
      const dmg = Math.min(projectile.damage, player.health);
      player.health -= dmg;
      state.stats.p2DamageDealt += dmg;
      projectile.active = false;
      checkGameOver();
      continue;
    }
    if (
      ally &&
      ally.health > 0 &&
      overlaps(
        projectile.x,
        projectile.y,
        projectile.width,
        projectile.height,
        ally.x,
        ally.y,
        ally.hitboxW,
        ally.hitboxH,
      )
    ) {
      explode(projectile, EXPLOSION_SIZE[projectile.type]);
      const dmg = Math.min(projectile.damage, ally.health);
      ally.health -= dmg;
      projectile.active = false;
      checkGameOver();
    }
  }
}
