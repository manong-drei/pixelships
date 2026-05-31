import { canvas, ctx } from "./canvas.js";
import { shipConfig } from "./shipConfig.js";
import { getShipSprite } from "./assets.js";
import { isBlockedByIsland } from "./arenaCollision.js";

export function createShip(classKey, spawnX, initialDirX) {
  const config = shipConfig[classKey];
  return {
    classKey,
    x: spawnX,
    y: canvas.height / 2,
    width: config.width,
    height: config.height,
    health: config.health,
    maxHealth: config.health,
    speed: config.speed,
    damage: config.damage,
    fireRate: config.fireRate,
    fireCooldown: 0,
    turrets: config.turretSpec
      ? Array.from({ length: config.turretSpec.count }, () => ({
          roundsLeft: config.turretSpec.maxRounds,
          maxRounds: config.turretSpec.maxRounds,
          timer: 0,
          cooldownMs: config.turretSpec.cooldownMs,
        }))
      : null,
    skillCooldown: config.skillCooldown,
    skillTimer: 0,
    torpedoMode: "wide",
    acMode: "torpedoPlanes",
    torpedoPlanesReady: config.planeStock ? config.planeStock.torpedo : 0,
    torpedoPlanesMax: config.planeStock ? config.planeStock.torpedo : 0,
    diveBombersReady: config.planeStock ? config.planeStock.dive : 0,
    diveBombersMax: config.planeStock ? config.planeStock.dive : 0,
    torpedoSkillTimer: 0,
    diveSkillTimer: 0,
    color: config.color,
    dir: { x: initialDirX, y: 0 },
    hitboxLong: config.hitboxLong,
    hitboxShort: config.hitboxShort,
    hitboxW: config.hitboxLong,
    hitboxH: config.hitboxShort,
  };
}

export function updateShip(ship, moveX, moveY, dt) {
  if (!ship) return;

  if (moveX !== 0 || moveY !== 0) {
    const moveLength = Math.hypot(moveX, moveY);
    ship.dir.x = moveX / moveLength;
    ship.dir.y = moveY / moveLength;
  }

  // Slow ships down inside the boundary zone (8% margin from each edge)
  const marginX = canvas.width * 0.08;
  const marginY = canvas.height * 0.08;
  const halfW = ship.width / 2;
  const halfH = ship.height / 2;
  const edgeLeft = ship.x - halfW;
  const edgeRight = canvas.width - ship.x - halfW;
  const edgeTop = ship.y - halfH;
  const edgeBottom = canvas.height - ship.y - halfH;
  const speedMult = Math.min(
    edgeLeft < marginX ? 0.25 + (0.75 * Math.max(0, edgeLeft)) / marginX : 1,
    edgeRight < marginX ? 0.25 + (0.75 * Math.max(0, edgeRight)) / marginX : 1,
    edgeTop < marginY ? 0.25 + (0.75 * Math.max(0, edgeTop)) / marginY : 1,
    edgeBottom < marginY
      ? 0.25 + (0.75 * Math.max(0, edgeBottom)) / marginY
      : 1,
  );

  const prevX = ship.x;
  const prevY = ship.y;
  ship.x += moveX * ship.speed * speedMult;
  ship.y += moveY * ship.speed * speedMult;

  const hW = ship.width / 2;
  const hH = ship.height / 2;
  if (isBlockedByIsland(ship.x, ship.y, hW, hH)) {
    // Try sliding along each axis independently
    if (!isBlockedByIsland(prevX, ship.y, hW, hH)) {
      ship.x = prevX; // blocked on X, slide on Y
    } else if (!isBlockedByIsland(ship.x, prevY, hW, hH)) {
      ship.y = prevY; // blocked on Y, slide on X
    } else {
      ship.x = prevX; // blocked on both, full stop
      ship.y = prevY;
    }
  }

  const halfWidth = ship.width / 2;
  const halfHeight = ship.height / 2;
  ship.x = Math.max(halfWidth, Math.min(canvas.width - halfWidth, ship.x));
  ship.y = Math.max(halfHeight, Math.min(canvas.height - halfHeight, ship.y));

  const isVertical = Math.abs(ship.dir.y) > Math.abs(ship.dir.x);
  ship.hitboxW = isVertical ? ship.hitboxShort : ship.hitboxLong;
  ship.hitboxH = isVertical ? ship.hitboxLong : ship.hitboxShort;

  if (ship.fireCooldown > 0) ship.fireCooldown -= dt;
  if (ship.skillTimer > 0) ship.skillTimer -= dt;
  if (ship.torpedoSkillTimer > 0) ship.torpedoSkillTimer -= dt;
  if (ship.diveSkillTimer > 0) ship.diveSkillTimer -= dt;

  if (ship.turrets) {
    for (const turret of ship.turrets) {
      if (turret.timer > 0) {
        turret.timer -= dt;
        if (turret.timer <= 0 && turret.roundsLeft < turret.maxRounds) {
          turret.roundsLeft++;
          if (turret.roundsLeft < turret.maxRounds)
            turret.timer = turret.cooldownMs;
        }
      }
    }
  }
}

export function drawShip(ship) {
  if (!ship) return;

  const { image, flipX } = getShipSprite(ship.classKey, ship.dir.x, ship.dir.y);
  const isVertical = Math.abs(ship.dir.y) > Math.abs(ship.dir.x);
  const drawW = isVertical ? ship.height : ship.width;
  const drawH = isVertical ? ship.width : ship.height;

  ctx.save();
  ctx.translate(ship.x, ship.y);
  if (flipX) ctx.scale(-1, 1);

  if (image && image.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    ctx.fillStyle = ship.color;
    ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
  }

  ctx.restore();
}
