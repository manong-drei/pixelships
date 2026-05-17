import {
  spawnPlayerProjectile,
  spawnEnemyProjectile,
  ProjectileType,
} from "./projectiles.js";
import { planePending, enemyPlanePending } from "./planes.js";
import * as playerMod from "./player.js";
import * as enemyMod from "./enemy.js";

const pendingBarrage = [];
const pendingEnemyBarrage = [];
const pendingAllyBarrage = [];

const OVERDRIVE_BOOST_MS = 3000;
const OVERDRIVE_SLOW_MS = 1500;
const OVERDRIVE_SPEED_MULT = 2.5;
const OVERDRIVE_SLOW_SPEED = 0.3;

const playerOverdrive = {
  phase: "none",
  timer: 0,
  baseSpeed: 0,
  baseCooldownMs: 0,
};
const enemyOverdrive = {
  phase: "none",
  timer: 0,
  baseSpeed: 0,
  baseCooldownMs: 0,
};
const allyOverdrive = {
  phase: "none",
  timer: 0,
  baseSpeed: 0,
  baseCooldownMs: 0,
};

export function triggerSkill() {
  const player = playerMod.player;
  if (!player) return;
  if (player.classKey === "carrier") {
    launchPlanes();
    return;
  }
  if (player.skillTimer > 0) return;
  player.skillTimer = player.skillCooldown;
  switch (player.classKey) {
    case "destroyer":
      fireTorpedo(player);
      break;
    case "cruiser":
      activateOverdrive(player, playerOverdrive);
      break;
    case "battleship":
      scheduleBarrage(player);
      break;
  }
}

export function triggerEnemySkill() {
  const enemy = enemyMod.enemy;
  if (!enemy) return;
  if (enemy.classKey === "carrier") {
    launchEnemyPlanes();
    return;
  }
  if (enemy.skillTimer > 0) return;
  enemy.skillTimer = enemy.skillCooldown;
  switch (enemy.classKey) {
    case "destroyer":
      fireEnemyTorpedo(enemy);
      break;
    case "cruiser":
      activateOverdrive(enemy, enemyOverdrive);
      break;
    case "battleship":
      scheduleEnemyBarrage(enemy);
      break;
  }
}

export function triggerAllySkill() {
  const ally = enemyMod.ally;
  if (!ally) return;
  if (ally.classKey === "carrier") {
    launchAllyPlanes();
    return;
  }
  if (ally.skillTimer > 0) return;
  ally.skillTimer = ally.skillCooldown;
  switch (ally.classKey) {
    case "destroyer":
      fireAllyTorpedo(ally);
      break;
    case "cruiser":
      activateOverdrive(ally, allyOverdrive);
      break;
    case "battleship":
      scheduleAllyBarrage(ally);
      break;
  }
}

function fireTorpedo(player) {
  const baseAngle = Math.atan2(player.dir.y, player.dir.x);
  const angles =
    player.torpedoMode === "wide" ? [-8, -4, 4, 8] : [-4, -2, 2, 4];
  for (const spreadDegrees of angles) {
    const fireAngle = baseAngle + spreadDegrees * (Math.PI / 180);
    spawnPlayerProjectile(
      player.x,
      player.y,
      Math.cos(fireAngle),
      Math.sin(fireAngle),
      ProjectileType.torpedo.damage,
      "torpedo",
    );
  }
}

function fireAllyTorpedo(ally) {
  const baseAngle = Math.atan2(ally.dir.y, ally.dir.x);
  const angles =
    ally.torpedoMode === "wide" ? [-8, -4, 4, 8] : [-4, -2, 2, 4];
  for (const spreadDegrees of angles) {
    const fireAngle = baseAngle + spreadDegrees * (Math.PI / 180);
    spawnPlayerProjectile(
      ally.x,
      ally.y,
      Math.cos(fireAngle),
      Math.sin(fireAngle),
      ProjectileType.torpedo.damage,
      "torpedo",
    );
  }
}

function activateOverdrive(ship, overdriveState) {
  if (overdriveState.phase !== "none") return;
  overdriveState.baseSpeed = ship.speed;
  overdriveState.baseCooldownMs = ship.turrets ? ship.turrets[0].cooldownMs : 0;
  overdriveState.phase = "boost";
  overdriveState.timer = OVERDRIVE_BOOST_MS;
  ship.speed = ship.speed * OVERDRIVE_SPEED_MULT;
  if (ship.turrets) {
    for (const turret of ship.turrets) {
      turret.cooldownMs = Math.round(turret.cooldownMs / 2);
    }
  }
}

function scheduleBarrage(player) {
  const totalTurrets = player.turrets.length;
  const spread = player.hitboxShort * 0.8;
  const fwdOffset = player.hitboxLong * 0.45;
  const VOLLEY_COUNT = 3;
  const SHOT_INTERVAL = 80;
  const VOLLEY_INTERVAL = 100;

  for (let volleyIndex = 0; volleyIndex < VOLLEY_COUNT; volleyIndex++) {
    for (let turretIndex = 0; turretIndex < totalTurrets; turretIndex++) {
      const perpOffset =
        totalTurrets > 1
          ? (turretIndex / (totalTurrets - 1) - 0.5) * spread
          : 0;
      const isLastShot =
        volleyIndex === VOLLEY_COUNT - 1 && turretIndex === totalTurrets - 1;
      pendingBarrage.push({
        delay: volleyIndex * VOLLEY_INTERVAL + turretIndex * SHOT_INTERVAL,
        dirX: player.dir.x,
        dirY: player.dir.y,
        perpOffset,
        fwdOffset,
        reloadOnFire: isLastShot,
      });
    }
  }
}

function scheduleAllyBarrage(ally) {
  const totalTurrets = ally.turrets.length;
  const spread = ally.hitboxShort * 0.8;
  const fwdOffset = ally.hitboxLong * 0.45;
  const VOLLEY_COUNT = 3;
  const SHOT_INTERVAL = 80;
  const VOLLEY_INTERVAL = 100;

  for (let volleyIndex = 0; volleyIndex < VOLLEY_COUNT; volleyIndex++) {
    for (let turretIndex = 0; turretIndex < totalTurrets; turretIndex++) {
      const perpOffset =
        totalTurrets > 1
          ? (turretIndex / (totalTurrets - 1) - 0.5) * spread
          : 0;
      const isLastShot =
        volleyIndex === VOLLEY_COUNT - 1 && turretIndex === totalTurrets - 1;
      pendingAllyBarrage.push({
        delay: volleyIndex * VOLLEY_INTERVAL + turretIndex * SHOT_INTERVAL,
        dirX: ally.dir.x,
        dirY: ally.dir.y,
        perpOffset,
        fwdOffset,
        reloadOnFire: isLastShot,
      });
    }
  }
}

function fireEnemyTorpedo(enemy) {
  const baseAngle = Math.atan2(enemy.dir.y, enemy.dir.x);
  const angles = enemy.torpedoMode === "wide" ? [-8, -4, 4, 8] : [-4, -2, 2, 4];
  for (const spreadDegrees of angles) {
    const fireAngle = baseAngle + spreadDegrees * (Math.PI / 180);
    spawnEnemyProjectile(
      enemy.x,
      enemy.y,
      Math.cos(fireAngle),
      Math.sin(fireAngle),
      ProjectileType.torpedo.damage,
      "torpedo",
    );
  }
}

function scheduleEnemyBarrage(enemy) {
  const totalTurrets = enemy.turrets.length;
  const spread = enemy.hitboxShort * 0.8;
  const fwdOffset = enemy.hitboxLong * 0.45;
  const VOLLEY_COUNT = 3;
  const SHOT_INTERVAL = 80;
  const VOLLEY_INTERVAL = 100;

  for (let volleyIndex = 0; volleyIndex < VOLLEY_COUNT; volleyIndex++) {
    for (let turretIndex = 0; turretIndex < totalTurrets; turretIndex++) {
      const perpOffset =
        totalTurrets > 1
          ? (turretIndex / (totalTurrets - 1) - 0.5) * spread
          : 0;
      const isLastShot =
        volleyIndex === VOLLEY_COUNT - 1 && turretIndex === totalTurrets - 1;
      pendingEnemyBarrage.push({
        delay: volleyIndex * VOLLEY_INTERVAL + turretIndex * SHOT_INTERVAL,
        dirX: enemy.dir.x,
        dirY: enemy.dir.y,
        perpOffset,
        fwdOffset,
        reloadOnFire: isLastShot,
      });
    }
  }
}

function launchPlanes() {
  const player = playerMod.player;
  const target = enemyMod.enemy ?? enemyMod.waveEnemies.find((waveEnemy) => waveEnemy.health > 0) ?? null;
  if (!player || !target) return;
  const isTorpedo = player.acMode === "torpedoPlanes";
  const timer = isTorpedo ? player.torpedoSkillTimer : player.diveSkillTimer;
  if (timer > 0) return;
  const available = isTorpedo
    ? player.torpedoPlanesReady
    : player.diveBombersReady;
  if (available <= 0) return;
  const planeType = isTorpedo ? "torpedo" : "dive";
  const launchCount = Math.min(available, 2);
  const baseAngle = Math.atan2(player.dir.y, player.dir.x);
  const spreads = launchCount === 2 ? [-10, 10] : [0];
  for (const spreadDeg of spreads) {
    const angle = baseAngle + spreadDeg * (Math.PI / 180);
    planePending.push({
      type: planeType,
      startX: player.x,
      startY: player.y,
      target,
      carrier: player,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
    });
  }
  if (isTorpedo) {
    player.torpedoPlanesReady -= launchCount;
    if (player.torpedoPlanesReady <= 0)
      player.torpedoSkillTimer = player.skillCooldown;
  } else {
    player.diveBombersReady -= launchCount;
    if (player.diveBombersReady <= 0)
      player.diveSkillTimer = player.skillCooldown;
  }
}

function launchAllyPlanes() {
  const ally = enemyMod.ally;
  const target = enemyMod.enemy ?? enemyMod.waveEnemies.find((waveEnemy) => waveEnemy.health > 0) ?? null;
  if (!ally || !target) return;
  const isTorpedo = ally.acMode === "torpedoPlanes";
  const timer = isTorpedo ? ally.torpedoSkillTimer : ally.diveSkillTimer;
  if (timer > 0) return;
  const available = isTorpedo
    ? ally.torpedoPlanesReady
    : ally.diveBombersReady;
  if (available <= 0) return;
  const planeType = isTorpedo ? "torpedo" : "dive";
  const launchCount = Math.min(available, 2);
  const baseAngle = Math.atan2(ally.dir.y, ally.dir.x);
  const spreads = launchCount === 2 ? [-10, 10] : [0];
  for (const spreadDeg of spreads) {
    const angle = baseAngle + spreadDeg * (Math.PI / 180);
    planePending.push({
      type: planeType,
      startX: ally.x,
      startY: ally.y,
      target,
      carrier: ally,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
    });
  }
  if (isTorpedo) {
    ally.torpedoPlanesReady -= launchCount;
    if (ally.torpedoPlanesReady <= 0)
      ally.torpedoSkillTimer = ally.skillCooldown;
  } else {
    ally.diveBombersReady -= launchCount;
    if (ally.diveBombersReady <= 0) ally.diveSkillTimer = ally.skillCooldown;
  }
}

export function launchEnemyPlanes(targetShip) {
  const enemy = enemyMod.enemy;
  if (!enemy) return;
  const target = targetShip ?? playerMod.player;
  if (!target) return;
  const isTorpedo = enemy.acMode === "torpedoPlanes";
  const timer = isTorpedo ? enemy.torpedoSkillTimer : enemy.diveSkillTimer;
  if (timer > 0) return;
  const available = isTorpedo
    ? enemy.torpedoPlanesReady
    : enemy.diveBombersReady;
  if (available <= 0) return;
  const planeType = isTorpedo ? "torpedo" : "dive";
  const launchCount = Math.min(available, 2);
  const baseAngle = Math.atan2(enemy.dir.y, enemy.dir.x);
  const spreads = launchCount === 2 ? [-10, 10] : [0];
  for (const spreadDeg of spreads) {
    const angle = baseAngle + spreadDeg * (Math.PI / 180);
    enemyPlanePending.push({
      type: planeType,
      startX: enemy.x,
      startY: enemy.y,
      target,
      carrier: enemy,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
    });
  }
  if (isTorpedo) {
    enemy.torpedoPlanesReady -= launchCount;
    if (enemy.torpedoPlanesReady <= 0)
      enemy.torpedoSkillTimer = enemy.skillCooldown;
  } else {
    enemy.diveBombersReady -= launchCount;
    if (enemy.diveBombersReady <= 0) enemy.diveSkillTimer = enemy.skillCooldown;
  }
}

function tickOverdrive(dt, overdriveState, ship) {
  if (overdriveState.phase === "none" || !ship) return;
  overdriveState.timer -= dt;
  if (overdriveState.timer > 0) return;

  if (overdriveState.phase === "boost") {
    ship.speed = OVERDRIVE_SLOW_SPEED;
    if (ship.turrets) {
      for (const turret of ship.turrets) {
        turret.cooldownMs = overdriveState.baseCooldownMs;
      }
    }
    overdriveState.phase = "slowdown";
    overdriveState.timer = OVERDRIVE_SLOW_MS;
  } else if (overdriveState.phase === "slowdown") {
    ship.speed = overdriveState.baseSpeed;
    overdriveState.phase = "none";
  }
}

export function updateSkills(dt) {
  tickOverdrive(dt, playerOverdrive, playerMod.player);

  for (let index = pendingBarrage.length - 1; index >= 0; index--) {
    pendingBarrage[index].delay -= dt;
    if (pendingBarrage[index].delay <= 0) {
      const shot = pendingBarrage.splice(index, 1)[0];
      const player = playerMod.player;
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
        if (shot.reloadOnFire && player.turrets) {
          for (const turret of player.turrets) {
            turret.roundsLeft = turret.maxRounds;
            turret.timer = 0;
          }
        }
      }
    }
  }
}

export function updateEnemySkills(dt) {
  tickOverdrive(dt, enemyOverdrive, enemyMod.enemy);

  for (let index = pendingEnemyBarrage.length - 1; index >= 0; index--) {
    pendingEnemyBarrage[index].delay -= dt;
    if (pendingEnemyBarrage[index].delay <= 0) {
      const shot = pendingEnemyBarrage.splice(index, 1)[0];
      const enemy = enemyMod.enemy;
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
        if (shot.reloadOnFire && enemy.turrets) {
          for (const turret of enemy.turrets) {
            turret.roundsLeft = turret.maxRounds;
            turret.timer = 0;
          }
        }
      }
    }
  }
}

export function updateAllySkills(dt) {
  tickOverdrive(dt, allyOverdrive, enemyMod.ally);

  for (let index = pendingAllyBarrage.length - 1; index >= 0; index--) {
    pendingAllyBarrage[index].delay -= dt;
    if (pendingAllyBarrage[index].delay <= 0) {
      const shot = pendingAllyBarrage.splice(index, 1)[0];
      const ally = enemyMod.ally;
      if (ally) {
        const perpX = -ally.dir.y * shot.perpOffset;
        const perpY = ally.dir.x * shot.perpOffset;
        const fwdX = ally.dir.x * shot.fwdOffset;
        const fwdY = ally.dir.y * shot.fwdOffset;
        spawnPlayerProjectile(
          ally.x + perpX + fwdX,
          ally.y + perpY + fwdY,
          shot.dirX,
          shot.dirY,
          ally.damage,
          "basic",
        );
        if (shot.reloadOnFire && ally.turrets) {
          for (const turret of ally.turrets) {
            turret.roundsLeft = turret.maxRounds;
            turret.timer = 0;
          }
        }
      }
    }
  }
}

export function resetSkills() {
  pendingBarrage.length = 0;
  pendingEnemyBarrage.length = 0;
  pendingAllyBarrage.length = 0;
  playerOverdrive.phase = "none";
  enemyOverdrive.phase = "none";
  allyOverdrive.phase = "none";
}

export function toggleAcMode() {
  const player = playerMod.player;
  if (!player) return;
  if (player.classKey === "carrier") {
    player.acMode =
      player.acMode === "torpedoPlanes" ? "diveBombers" : "torpedoPlanes";
  } else if (player.classKey === "destroyer") {
    player.torpedoMode = player.torpedoMode === "wide" ? "close" : "wide";
  }
}

export function toggleEnemyAcMode() {
  const enemy = enemyMod.enemy;
  if (!enemy) return;
  if (enemy.classKey === "carrier") {
    enemy.acMode =
      enemy.acMode === "torpedoPlanes" ? "diveBombers" : "torpedoPlanes";
  } else if (enemy.classKey === "destroyer") {
    enemy.torpedoMode = enemy.torpedoMode === "wide" ? "close" : "wide";
  }
}

export function toggleAllyAcMode() {
  const ally = enemyMod.ally;
  if (!ally) return;
  if (ally.classKey === "carrier") {
    ally.acMode =
      ally.acMode === "torpedoPlanes" ? "diveBombers" : "torpedoPlanes";
  } else if (ally.classKey === "destroyer") {
    ally.torpedoMode = ally.torpedoMode === "wide" ? "close" : "wide";
  }
}
