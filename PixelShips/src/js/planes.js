import { canvas, ctx } from "./canvas.js";
import {
  spawnPlayerProjectile,
  spawnEnemyProjectile,
  ProjectileType,
} from "./projectiles.js";
import { playSFX } from "./audio.js";
const planeImage = new Image();
planeImage.src = "assets/ships/carrier/torpedo_bomber.png";

const PLANE_COLS = 4;
const PLANE_ROWS = 2;
const PLANE_FRAME_W = 177;
const PLANE_FRAME_H = 177;
const PLANE_FRAME_STRIDE_X = 178;
const PLANE_FRAME_STRIDE_Y = 178;
const PLANE_ANIM_MS = 120;
const PLANE_DRAW_SIZE = 32;

const DIVE_LEAD_FRAMES = 40;
const TORPEDO_LEAD_FRAMES = 25;

export const planePending = [];
const activePlanes = [];

export const enemyPlanePending = [];
const activeEnemyPlanes = [];

const DETECTION_RADIUS = 200;
const TORPEDO_DROP_RADIUS = 200;

function buildPlane(spec) {
  return {
    type: spec.type,
    x: spec.startX,
    y: spec.startY,
    target: spec.target,
    carrier: spec.carrier,
    returning: false,
    committed: false,
    committedX: 0,
    committedY: 0,
    dropped: false,
    done: false,
    dirX: spec.dirX,
    dirY: spec.dirY,
    frame: 0,
    frameTimer: 0,
  };
}

function advancePlane(plane, spawnProjectile, dt) {
  const speed = 3.5;

  plane.frameTimer += dt;
  if (plane.frameTimer >= PLANE_ANIM_MS) {
    plane.frameTimer -= PLANE_ANIM_MS;
    plane.frame = (plane.frame + 1) % (PLANE_COLS * PLANE_ROWS);
  }

  const targetX = plane.target.x;
  const targetY = plane.target.y;

  const distToTarget = Math.hypot(plane.x - targetX, plane.y - targetY);

  // Steer toward carrier while returning; land when close enough
  if (plane.returning) {
    const distToCarrier = Math.hypot(
      plane.x - plane.carrier.x,
      plane.y - plane.carrier.y,
    );
    if (distToCarrier < 30) {
      plane.done = true;
      if (plane.type === "torpedo")
        plane.carrier.torpedoPlanesReady = Math.min(
          plane.carrier.torpedoPlanesReady + 1,
          plane.carrier.torpedoPlanesMax,
        );
      else
        plane.carrier.diveBombersReady = Math.min(
          plane.carrier.diveBombersReady + 1,
          plane.carrier.diveBombersMax,
        );
      return;
    }
    plane.dirX = (plane.carrier.x - plane.x) / distToCarrier;
    plane.dirY = (plane.carrier.y - plane.y) / distToCarrier;
  }

  if (plane.type === "torpedo") {
    plane.x += plane.dirX * speed;
    plane.y += plane.dirY * speed;
    if (!plane.dropped && distToTarget < TORPEDO_DROP_RADIUS) {
      const predictedX =
        targetX + plane.target.dir.x * plane.target.speed * TORPEDO_LEAD_FRAMES;
      const predictedY =
        targetY + plane.target.dir.y * plane.target.speed * TORPEDO_LEAD_FRAMES;
      const dropDeltaX = predictedX - plane.x;
      const dropDeltaY = predictedY - plane.y;
      const dropDist = Math.hypot(dropDeltaX, dropDeltaY) || 1;
      playSFX("torpedo");
      spawnProjectile(
        plane.x,
        plane.y,
        dropDeltaX / dropDist,
        dropDeltaY / dropDist,
        ProjectileType.torpedo.damage,
        "torpedo",
      );
      plane.dropped = true;
      playSFX("bomb_drop");
      plane.returning = true;
    }
    const margin = PLANE_DRAW_SIZE / 2;
    const outOfBounds =
      plane.x < margin ||
      plane.x > canvas.width - margin ||
      plane.y < margin ||
      plane.y > canvas.height - margin;
    if (outOfBounds && !plane.returning) plane.returning = true;
  } else {
    if (!plane.dropped && !plane.committed && distToTarget < DETECTION_RADIUS) {
      plane.returning = false;
      plane.committed = true;
      plane.committedX =
        targetX + plane.target.dir.x * plane.target.speed * DIVE_LEAD_FRAMES;
      plane.committedY =
        targetY + plane.target.dir.y * plane.target.speed * DIVE_LEAD_FRAMES;
      const toDeltaX = plane.committedX - plane.x;
      const toDeltaY = plane.committedY - plane.y;
      const toDist = Math.hypot(toDeltaX, toDeltaY) || 1;
      plane.dirX = toDeltaX / toDist;
      plane.dirY = toDeltaY / toDist;
    }
    plane.x += plane.dirX * speed;
    plane.y += plane.dirY * speed;
    if (!plane.dropped && plane.committed) {
      const dropDist = Math.hypot(
        plane.x - plane.committedX,
        plane.y - plane.committedY,
      );
      if (dropDist < 20) {
        spawnProjectile(
          plane.x,
          plane.y,
          0,
          0,
          ProjectileType.bomb.damage,
          "bomb",
        );
        plane.dropped = true;
        playSFX("bomb_drop");
        plane.returning = true;
      }
    }
    const margin = PLANE_DRAW_SIZE / 2;
    const outOfBounds =
      plane.x < margin ||
      plane.x > canvas.width - margin ||
      plane.y < margin ||
      plane.y > canvas.height - margin;
    if (outOfBounds && !plane.returning) {
      plane.returning = true;
      plane.committed = false;
    }
  }
}

export function updatePlanes(dt) {
  while (planePending.length > 0)
    activePlanes.push(buildPlane(planePending.shift()));
  for (const plane of activePlanes) {
    if (!plane.done) advancePlane(plane, spawnPlayerProjectile, dt);
  }
  for (let i = activePlanes.length - 1; i >= 0; i--) {
    if (activePlanes[i].done) activePlanes.splice(i, 1);
  }
}

export function updateEnemyPlanes(dt) {
  while (enemyPlanePending.length > 0)
    activeEnemyPlanes.push(buildPlane(enemyPlanePending.shift()));
  for (const plane of activeEnemyPlanes) {
    if (!plane.done) advancePlane(plane, spawnEnemyProjectile, dt);
  }
  for (let i = activeEnemyPlanes.length - 1; i >= 0; i--) {
    if (activeEnemyPlanes[i].done) activeEnemyPlanes.splice(i, 1);
  }
}

function drawPlaneShape(plane) {
  ctx.save();
  ctx.translate(plane.x, plane.y);
  ctx.rotate(Math.atan2(plane.dirY, plane.dirX) + Math.PI / 2);

  if (planeImage.complete && planeImage.naturalWidth > 0) {
    const col = plane.frame % PLANE_COLS;
    const row = Math.floor(plane.frame / PLANE_COLS);
    const srcX = col * PLANE_FRAME_STRIDE_X;
    const srcY = row * PLANE_FRAME_STRIDE_Y;
    ctx.drawImage(
      planeImage,
      srcX,
      srcY,
      PLANE_FRAME_W,
      PLANE_FRAME_H,
      -PLANE_DRAW_SIZE / 2,
      -PLANE_DRAW_SIZE / 2,
      PLANE_DRAW_SIZE,
      PLANE_DRAW_SIZE,
    );
  } else {
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(-12, -5, 24, 10);
    ctx.fillRect(-4, -12, 8, 10);
  }

  ctx.restore();
}

export function drawPlanes() {
  for (const plane of activePlanes) drawPlaneShape(plane);
}

export function drawEnemyPlanes() {
  for (const plane of activeEnemyPlanes) drawPlaneShape(plane);
}

export function clearPlanes() {
  planePending.length = 0;
  activePlanes.length = 0;
  enemyPlanePending.length = 0;
  activeEnemyPlanes.length = 0;
}
