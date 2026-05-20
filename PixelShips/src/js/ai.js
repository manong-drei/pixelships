import { canvas } from "./canvas.js";
import { playerProjectiles } from "./projectiles.js";

export const AI_HEALTH_MULT = 0.9;
export const AI_DAMAGE_MULT = 0.95;

const AIM_THRESHOLD_RAD = 0.25;
const DODGE_RANGE = 300;
const DODGE_DURATION_MS = 800;
const TORPEDO_ATTACK_RANGE = 300;
const TORPEDO_AIM_RAD = 0.52; // ~30 degrees
const BARRAGE_ATTACK_RANGE = 400;

// Per-class tactic personality: range fractions and how often the AI reconsiders its tactic
const CLASS_PROFILES = {
  destroyer: {
    idealRangeFrac: 0.2,
    minRangeFrac: 0.07,
    tacticMinMs: 600,
    tacticMaxMs: 1400,
  },
  cruiser: {
    idealRangeFrac: 0.35,
    minRangeFrac: 0.15,
    tacticMinMs: 1500,
    tacticMaxMs: 3500,
  },
  battleship: {
    idealRangeFrac: 0.55,
    minRangeFrac: 0.3,
    tacticMinMs: 2500,
    tacticMaxMs: 5000,
  },
  carrier: {
    idealRangeFrac: 0.35,
    minRangeFrac: 0.15,
    tacticMinMs: 1500,
    tacticMaxMs: 3500,
  },
};

export function createAiState() {
  return {
    tactic: "approach",
    tacticTimer: 0,
    strafeDir: 1,
    dodgeTimer: 0,
    dodgePerpX: 0,
    dodgePerpY: 0,
    prevTactic: "approach",
    desiredAcMode: null,
  };
}

export function updateAi(aiShip, targets, aiState, dt) {
  if (!aiShip || targets.length === 0) {
    return {
      moveX: 0,
      moveY: 0,
      aimX: aiShip?.dir.x ?? 1,
      aimY: aiShip?.dir.y ?? 0,
      fire: false,
      useSkill: false,
      toggleMode: false,
    };
  }

  const profile = CLASS_PROFILES[aiShip.classKey] ?? CLASS_PROFILES.cruiser;
  const idealRange = canvas.width * profile.idealRangeFrac;
  const minRange = canvas.width * profile.minRangeFrac;

  // Primary target: nearest living
  const primaryTarget = nearestTarget(aiShip, targets);
  // Skill target: lowest health living
  const skillTarget = lowestHealthTarget(targets);

  const toTargetX = primaryTarget.x - aiShip.x;
  const toTargetY = primaryTarget.y - aiShip.y;
  const dist = Math.hypot(toTargetX, toTargetY) || 1;
  const normToTargetX = toTargetX / dist;
  const normToTargetY = toTargetY / dist;

  // Aim direction always faces primary target
  const aimX = normToTargetX;
  const aimY = normToTargetY;

  // --- Dodge override ---
  let dodging = false;
  if (aiState.dodgeTimer > 0) {
    aiState.dodgeTimer -= dt;
    dodging = aiState.dodgeTimer > 0;
  }

  if (!dodging) {
    // Scan incoming player projectiles for torpedoes on collision course
    for (const projectile of playerProjectiles) {
      if (!projectile.active) continue;
      const toAiX = aiShip.x - projectile.x;
      const toAiY = aiShip.y - projectile.y;
      const projDist = Math.hypot(toAiX, toAiY);
      if (projDist > DODGE_RANGE) continue;
      // Check if projectile is heading toward AI (dot product > 0)
      const dot =
        (projectile.dirX * toAiX) / projDist +
        (projectile.dirY * toAiY) / projDist;
      if (dot > 0.5) {
        // Dodge perpendicular to projectile direction
        aiState.dodgePerpX = -projectile.dirY;
        aiState.dodgePerpY = projectile.dirX;
        aiState.dodgeTimer = DODGE_DURATION_MS;
        dodging = true;
        break;
      }
    }
  }

  let moveX = 0;
  let moveY = 0;

  if (dodging) {
    moveX = aiState.dodgePerpX;
    moveY = aiState.dodgePerpY;
  } else {
    // --- Tactic state machine ---
    aiState.tacticTimer -= dt;
    if (aiState.tacticTimer <= 0) {
      aiState.tacticTimer =
        profile.tacticMinMs +
        Math.random() * (profile.tacticMaxMs - profile.tacticMinMs);
      // Re-evaluate tactic based on distance
      if (aiState.tactic === "strafe") {
        // Randomly flip strafe direction
        aiState.strafeDir *= -1;
      }
    }

    // Forced tactic transitions based on distance
    if (aiState.tactic === "approach" && dist <= idealRange) {
      aiState.tactic = "strafe";
      aiState.tacticTimer =
        profile.tacticMinMs +
        Math.random() * (profile.tacticMaxMs - profile.tacticMinMs);
    } else if (aiState.tactic === "strafe" && dist < minRange) {
      aiState.tactic = "retreat";
      aiState.tacticTimer =
        profile.tacticMinMs +
        Math.random() * (profile.tacticMaxMs - profile.tacticMinMs);
    } else if (aiState.tactic === "retreat" && dist >= idealRange) {
      aiState.tactic = "approach";
      aiState.tacticTimer =
        profile.tacticMinMs +
        Math.random() * (profile.tacticMaxMs - profile.tacticMinMs);
    }

    if (aiState.tactic === "approach") {
      moveX = normToTargetX;
      moveY = normToTargetY;
    } else if (aiState.tactic === "strafe") {
      // Perpendicular to target vector
      moveX = -normToTargetY * aiState.strafeDir;
      moveY = normToTargetX * aiState.strafeDir;
    } else if (aiState.tactic === "retreat") {
      moveX = -normToTargetX;
      moveY = -normToTargetY;
    }
  }

  // --- Fire decision ---
  // Check dot product of current aim vs facing direction
  const facingDot = aiShip.dir.x * aimX + aiShip.dir.y * aimY;
  const aimAngle = Math.acos(Math.max(-1, Math.min(1, facingDot)));
  const fire = aimAngle < AIM_THRESHOLD_RAD;

  // --- Skill decision ---
  const toSkillTargetX = skillTarget.x - aiShip.x;
  const toSkillTargetY = skillTarget.y - aiShip.y;
  const skillDist = Math.hypot(toSkillTargetX, toSkillTargetY) || 1;

  let useSkill = false;
  let toggleMode = false;

  if (aiShip.classKey === "destroyer") {
    if (aiShip.skillTimer <= 0 && skillDist < TORPEDO_ATTACK_RANGE) {
      const skillAimDot =
        (aiShip.dir.x * toSkillTargetX) / skillDist +
        (aiShip.dir.y * toSkillTargetY) / skillDist;
      const skillAngle = Math.acos(Math.max(-1, Math.min(1, skillAimDot)));
      if (skillAngle < TORPEDO_AIM_RAD) useSkill = true;
    }
    // Toggle torpedo mode based on distance
    const desiredMode = skillDist < 150 ? "close" : "wide";
    if (aiShip.torpedoMode !== desiredMode) toggleMode = true;
  } else if (aiShip.classKey === "cruiser") {
    if (aiShip.skillTimer <= 0) {
      const lowHealth = aiShip.health / aiShip.maxHealth < 0.4;
      if (lowHealth || aiState.tactic === "approach") useSkill = true;
    }
  } else if (aiShip.classKey === "battleship") {
    if (aiShip.skillTimer <= 0 && skillDist < BARRAGE_ATTACK_RANGE) {
      useSkill = true;
    }
  } else if (aiShip.classKey === "carrier") {
    // Skill cooldowns managed per plane type on the ship itself
    useSkill = true;
    // Toggle ac mode based on health
    const desiredMode =
      aiShip.health / aiShip.maxHealth < 0.5 ? "diveBombers" : "torpedoPlanes";
    if (aiShip.acMode !== desiredMode) {
      aiState.desiredAcMode = desiredMode;
      toggleMode = true;
    }
  }

  return { moveX, moveY, aimX, aimY, fire, useSkill, toggleMode };
}

function nearestTarget(aiShip, targets) {
  let nearest = targets[0];
  let nearestDist = Math.hypot(
    targets[0].x - aiShip.x,
    targets[0].y - aiShip.y,
  );
  for (let index = 1; index < targets.length; index++) {
    const distance = Math.hypot(
      targets[index].x - aiShip.x,
      targets[index].y - aiShip.y,
    );
    if (distance < nearestDist) {
      nearestDist = distance;
      nearest = targets[index];
    }
  }
  return nearest;
}

function lowestHealthTarget(targets) {
  let lowest = targets[0];
  for (let index = 1; index < targets.length; index++) {
    if (targets[index].health < lowest.health) {
      lowest = targets[index];
    }
  }
  return lowest;
}
