import { canvas, ctx } from "./canvas.js";
import { player } from "./player.js";
import * as enemyMod from "./enemy.js";
import { shipConfig } from "./shipConfig.js";
import { state } from "./state.js";

export function drawHUD() {
  if (!player) return;

  if (state.mode === "coop") {
    drawCoopHUD(player, enemyMod.ally, enemyMod.waveEnemies);
  } else {
    const enemy = enemyMod.enemy;
    if (!enemy) return;
    drawStandardHUD(player, enemy);
  }
}

function drawStandardHUD(player, enemy) {
  const enemyLabel = state.mode === "pvc" ? "CPU" : "P2";

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

  // Enemy — right side
  drawHealthBar(canvas.width - 20 - 200, 20, enemy.health, enemy.maxHealth, enemy.color, enemyLabel);
  if (enemy.classKey === "carrier") {
    const torpedoFill = enemy.torpedoSkillTimer > 0 ? 1 - enemy.torpedoSkillTimer / enemy.skillCooldown : 1;
    const diveFill    = enemy.diveSkillTimer    > 0 ? 1 - enemy.diveSkillTimer    / enemy.skillCooldown : 1;
    if (state.mode === "pvp") {
      drawCooldownBar(canvas.width - 20 - 160, 60,  torpedoFill, "#a78bfa", `TORPEDO [P] ${enemy.torpedoPlanesReady}/${enemy.torpedoPlanesMax}`);
      drawCooldownBar(canvas.width - 20 - 160, 100, diveFill,    "#a78bfa", `DIVE [P] ${enemy.diveBombersReady}/${enemy.diveBombersMax}`);
      ctx.fillStyle = "#fde68a";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`MODE [O]: ${enemy.acMode === "torpedoPlanes" ? "TORPEDO" : "DIVE"}`, canvas.width - 20, 138);
    } else {
      drawCooldownBar(canvas.width - 20 - 160, 60,  torpedoFill, "#a78bfa", `TORPEDO ${enemy.torpedoPlanesReady}/${enemy.torpedoPlanesMax}`);
      drawCooldownBar(canvas.width - 20 - 160, 100, diveFill,    "#a78bfa", `DIVE ${enemy.diveBombersReady}/${enemy.diveBombersMax}`);
    }
  } else {
    const enemySkillFill = enemy.skillTimer > 0 ? 1 - enemy.skillTimer / enemy.skillCooldown : 1;
    const skillLabel = state.mode === "pvp" ? "SKILL [P]" : "SKILL";
    drawCooldownBar(canvas.width - 20 - 160, 60, enemySkillFill, "#a78bfa", skillLabel);
    if (enemy.classKey === "destroyer") {
      if (state.mode === "pvp") {
        ctx.fillStyle = enemy.color;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`SPREAD [O]: ${enemy.torpedoMode === "wide" ? "WIDE" : "CLOSE"}`, canvas.width - 20, 100);
      }
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

function drawCoopHUD(player, ally, waveEnemies) {
  // P1 — left side, top
  drawHealthBar(20, 20, player.health, player.maxHealth, player.color, "P1");
  if (player.classKey === "carrier") {
    const torpedoFill = player.torpedoSkillTimer > 0 ? 1 - player.torpedoSkillTimer / player.skillCooldown : 1;
    const diveFill    = player.diveSkillTimer    > 0 ? 1 - player.diveSkillTimer    / player.skillCooldown : 1;
    drawCooldownBar(20, 60, torpedoFill, "#a78bfa", `TORPEDO [E] ${player.torpedoPlanesReady}/${player.torpedoPlanesMax}`);
    drawCooldownBar(20, 100, diveFill,   "#a78bfa", `DIVE [E] ${player.diveBombersReady}/${player.diveBombersMax}`);
    ctx.fillStyle = "#fde68a";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`MODE [Q]: ${player.acMode === "torpedoPlanes" ? "TORPEDO" : "DIVE"}`, 20, 138);
  } else {
    const skillFill = player.skillTimer > 0 ? 1 - player.skillTimer / player.skillCooldown : 1;
    drawCooldownBar(20, 60, skillFill, "#a78bfa", "SKILL [E]");
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

  // P2 (ally) — left side, below P1
  if (ally) {
    drawHealthBar(20, 150, ally.health, ally.maxHealth, ally.color, "P2");
    if (ally.classKey === "carrier") {
      const torpedoFill = ally.torpedoSkillTimer > 0 ? 1 - ally.torpedoSkillTimer / ally.skillCooldown : 1;
      const diveFill    = ally.diveSkillTimer    > 0 ? 1 - ally.diveSkillTimer    / ally.skillCooldown : 1;
      drawCooldownBar(20, 190, torpedoFill, "#a78bfa", `TORPEDO [P] ${ally.torpedoPlanesReady}/${ally.torpedoPlanesMax}`);
      drawCooldownBar(20, 230, diveFill,    "#a78bfa", `DIVE [P] ${ally.diveBombersReady}/${ally.diveBombersMax}`);
      ctx.fillStyle = "#fde68a";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`MODE [O]: ${ally.acMode === "torpedoPlanes" ? "TORPEDO" : "DIVE"}`, 20, 268);
    } else {
      const skillFill = ally.skillTimer > 0 ? 1 - ally.skillTimer / ally.skillCooldown : 1;
      drawCooldownBar(20, 190, skillFill, "#a78bfa", "SKILL [P]");
      if (ally.classKey === "destroyer") {
        ctx.fillStyle = ally.color;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`SPREAD [O]: ${ally.torpedoMode === "wide" ? "WIDE" : "CLOSE"}`, 20, 230);
        drawTurretStatus(20, 245, ally.turrets, ally.color, false);
      } else if (ally.turrets) {
        drawTurretStatus(20, 218, ally.turrets, ally.color, false);
      }
    }
  }

  // Wave counter — top center
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`WAVE ${state.coopWave} / ${state.coopTotalWaves}`, canvas.width / 2, 28);

  // Enemy health bars — right side, stacked
  let enemyBarY = 20;
  for (const waveEnemy of waveEnemies) {
    const shortLabel = shipConfig[waveEnemy.classKey].label.slice(0, 5).toUpperCase();
    drawHealthBar(canvas.width - 20 - 200, enemyBarY, waveEnemy.health, waveEnemy.maxHealth, waveEnemy.color, shortLabel);
    enemyBarY += 26;
  }

  // Ship labels at bottom
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(shipConfig[player.classKey].label + " (P1)", 22, canvas.height - 25);
  if (ally) ctx.fillText(shipConfig[ally.classKey].label + " (P2)", 22, canvas.height - 10);
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
