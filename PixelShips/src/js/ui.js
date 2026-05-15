import { canvas, ctx } from "./canvas.js";
import { player } from "./player.js";
import { enemy } from "./enemy.js";
import { shipConfig } from "./shipConfig.js";

export function drawHUD() {
  if (!player || !enemy) return;

  // Player 1 — left side
  drawHealthBar(20, 20, player.health, player.maxHealth, player.color, "P1");
  if (player.classKey === "carrier") {
    const torpedoFill = player.torpedoSkillTimer > 0 ? 1 - player.torpedoSkillTimer / player.skillCooldown : 1;
    const diveFill    = player.diveSkillTimer    > 0 ? 1 - player.diveSkillTimer    / player.skillCooldown : 1;
    drawCooldownBar(20, 60,  torpedoFill, "#a78bfa", `TORPEDO [E] ${player.torpedoPlanesReady}/${player.torpedoPlanesMax}`);
    drawCooldownBar(20, 100, diveFill,    "#a78bfa", `DIVE [E] ${player.diveBombersReady}/${player.diveBombersMax}`);
    ctx.fillStyle = "#fde68a";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`MODE [Q]: ${player.acMode === "torpedoPlanes" ? "TORPEDO" : "DIVE"}`, 20, 138);
  } else {
    const skillFillPercent = player.skillTimer > 0 ? 1 - player.skillTimer / player.skillCooldown : 1;
    drawCooldownBar(20, 60, skillFillPercent, "#a78bfa", "SKILL [E]");
    if (player.classKey === "destroyer") {
      ctx.fillStyle = player.color;
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SPREAD [Q]: ${player.torpedoMode === "wide" ? "WIDE" : "CLOSE"}`, 20, 100);
      drawTurretStatus(20, 115, player.turrets, player.color, false);
    } else if (player.turrets) {
      drawTurretStatus(20, 93, player.turrets, player.color, false);
    }
  }

  // Player 2 — right side
  drawHealthBar(canvas.width - 20 - 200, 20, enemy.health, enemy.maxHealth, enemy.color, "P2");
  if (enemy.classKey === "carrier") {
    const torpedoFill = enemy.torpedoSkillTimer > 0 ? 1 - enemy.torpedoSkillTimer / enemy.skillCooldown : 1;
    const diveFill    = enemy.diveSkillTimer    > 0 ? 1 - enemy.diveSkillTimer    / enemy.skillCooldown : 1;
    drawCooldownBar(canvas.width - 20 - 160, 60,  torpedoFill, "#a78bfa", `TORPEDO [P] ${enemy.torpedoPlanesReady}/${enemy.torpedoPlanesMax}`);
    drawCooldownBar(canvas.width - 20 - 160, 100, diveFill,    "#a78bfa", `DIVE [P] ${enemy.diveBombersReady}/${enemy.diveBombersMax}`);
    ctx.fillStyle = "#fde68a";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`MODE [O]: ${enemy.acMode === "torpedoPlanes" ? "TORPEDO" : "DIVE"}`, canvas.width - 20, 138);
  } else {
    const enemySkillFill = enemy.skillTimer > 0 ? 1 - enemy.skillTimer / enemy.skillCooldown : 1;
    drawCooldownBar(canvas.width - 20 - 160, 60, enemySkillFill, "#a78bfa", "SKILL [P]");
    if (enemy.classKey === "destroyer") {
      ctx.fillStyle = enemy.color;
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`SPREAD [O]: ${enemy.torpedoMode === "wide" ? "WIDE" : "CLOSE"}`, canvas.width - 20, 100);
      const turretBlockWidth = enemy.turrets.length * 50 - 6;
      drawTurretStatus(canvas.width - 20 - turretBlockWidth, 115, enemy.turrets, enemy.color, true);
    } else if (enemy.turrets) {
      const turretBlockWidth = enemy.turrets.length * 50 - 6;
      drawTurretStatus(canvas.width - 20 - turretBlockWidth, 93, enemy.turrets, enemy.color, true);
    }
  }

  // Ship labels at bottom
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(shipConfig[player.classKey].label, 22, canvas.height - 10);
  ctx.textAlign = "right";
  ctx.fillText(shipConfig[enemy.classKey].label, canvas.width - 22, canvas.height - 10);
}

function drawTurretStatus(startX, startY, turrets, color, alignRight) {
  const slotWidth   = 44;
  const slotGap     = 6;
  const dotSize     = 8;
  const dotGap      = 3;
  const barHeight   = 4;

  turrets.forEach((turret, index) => {
    const slotX = alignRight
      ? startX + (turrets.length - 1 - index) * (slotWidth + slotGap)
      : startX + index * (slotWidth + slotGap);

    // Round dots
    for (let round = 0; round < turret.maxRounds; round++) {
      const loaded = round < turret.roundsLeft;
      ctx.fillStyle = loaded ? color : "#1e293b";
      ctx.fillRect(slotX + round * (dotSize + dotGap), startY, dotSize, dotSize);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      ctx.strokeRect(slotX + round * (dotSize + dotGap), startY, dotSize, dotSize);
    }

    // Cooldown bar below dots
    const barY = startY + dotSize + 3;
    const barWidth = turret.maxRounds * (dotSize + dotGap) - dotGap;
    const coolFill = turret.timer > 0 ? 1 - turret.timer / turret.cooldownMs : 1;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(slotX, barY, barWidth, barHeight);
    ctx.fillStyle = coolFill >= 1 ? color : "#475569";
    ctx.fillRect(slotX, barY, barWidth * coolFill, barHeight);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(slotX, barY, barWidth, barHeight);
  });
}

function drawHealthBar(posX, posY, currentHealth, maxHealth, color, label) {
  const barWidth  = 200;
  const barHeight = 18;
  const fillPercent = Math.max(0, currentHealth / maxHealth);

  ctx.fillStyle = "#1e293b";
  ctx.fillRect(posX, posY, barWidth, barHeight);

  ctx.fillStyle = color;
  ctx.fillRect(posX, posY, barWidth * fillPercent, barHeight);

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  ctx.strokeRect(posX, posY, barWidth, barHeight);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`${label}  ${currentHealth}/${maxHealth}`, posX + 4, posY + 13);
}

function drawCooldownBar(posX, posY, fillPercent, color, label) {
  const barWidth  = 160;
  const barHeight = 12;

  ctx.fillStyle = "#1e293b";
  ctx.fillRect(posX, posY, barWidth, barHeight);

  ctx.fillStyle = fillPercent >= 1 ? color : "#334155";
  ctx.fillRect(posX, posY, barWidth * fillPercent, barHeight);

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  ctx.strokeRect(posX, posY, barWidth, barHeight);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(fillPercent >= 1 ? `${label} READY` : label, posX, posY + barHeight + 12);
}
