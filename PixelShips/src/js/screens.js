import { canvas, ctx, mouse } from "./canvas.js";
import { state } from "./state.js";
import { shipConfig } from "./shipConfig.js";
import { player } from "./player.js";
import { enemy } from "./enemy.js";

const CLASS_KEYS = Object.keys(shipConfig);

const SHIP_INFO = {
  destroyer: {
    description: "Fast & nimble",
    skillName: "TORPEDO SPREAD",
    skillDesc: "Fan of 4 torpedoes",
  },
  cruiser: {
    description: "Balanced warship",
    skillName: "OVERDRIVE",
    skillDesc: "Boosted speed & fire rate",
  },
  battleship: {
    description: "Heavily armored",
    skillName: "BARRAGE",
    skillDesc: "12-bullet triple volley",
  },
  carrier: {
    description: "Air superiority",
    skillName: "LAUNCH PLANES",
    skillDesc: "Torpedo / dive bombers",
  },
};

function getCardLayout() {
  const cardWidth = canvas.width * 0.2;
  const cardHeight = canvas.height * 0.58;
  const gap = canvas.width * 0.033;
  const totalWidth = 4 * cardWidth + 3 * gap;
  const startCenterX = (canvas.width - totalWidth) / 2 + cardWidth / 2;
  const centerY = canvas.height * 0.48;
  return CLASS_KEYS.map((key, index) => ({
    key,
    centerX: startCenterX + index * (cardWidth + gap),
    centerY,
    cardWidth,
    cardHeight,
  }));
}

function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function drawTitleText(text) {
  const fontSize = Math.max(16, Math.floor(canvas.width * 0.045));
  ctx.font = `${fontSize}px "Press Start 2P"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillText(text, canvas.width / 2 + 3, canvas.height * 0.32 + 3);

  ctx.fillStyle = "#f8fafc";
  ctx.fillText(text, canvas.width / 2, canvas.height * 0.32);

  ctx.textBaseline = "alphabetic";
}

export function drawStartScreen(titleBg) {
  if (titleBg && titleBg.complete && titleBg.naturalWidth > 0) {
    ctx.drawImage(titleBg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawTitleText("Pixel Ships");

  const subtitleSize = Math.max(8, Math.floor(canvas.width * 0.015));
  ctx.font = `${subtitleSize}px "Press Start 2P"`;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillText(
    "WW2 Naval Battle",
    canvas.width / 2 + 2,
    canvas.height * 0.44 + 2,
  );
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("WW2 Naval Battle", canvas.width / 2, canvas.height * 0.44);

  drawButton(canvas.width / 2, canvas.height * 0.6, 220, 54, "PLAY", "#2775e3");
  drawButton(
    canvas.width / 2,
    canvas.height * 0.72,
    220,
    54,
    "QUIT",
    "#566270",
  );
}

export function drawSelectionScreen() {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const isP1Turn = state.playerClass === null;
  const playerColor = isP1Turn ? "#38bdf8" : "#f87171";
  const playerLabel = isP1Turn ? "PLAYER 1" : "PLAYER 2";

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = playerColor;
  ctx.font = `${Math.max(10, Math.floor(canvas.width * 0.016))}px "Press Start 2P"`;
  ctx.fillText(playerLabel, canvas.width / 2, canvas.height * 0.08);

  ctx.fillStyle = "#64748b";
  ctx.font = `${Math.max(8, Math.floor(canvas.width * 0.011))}px "Press Start 2P"`;
  ctx.fillText("CHOOSE YOUR SHIP", canvas.width / 2, canvas.height * 0.13);

  const cards = getCardLayout();
  cards.forEach(({ key, centerX, centerY, cardWidth, cardHeight }) => {
    const isActive = state.pendingClass === key;
    const isP1Pick = !isP1Turn && state.playerClass === key;
    const isHovered = isInsideButton(
      mouse.x,
      mouse.y,
      centerX,
      centerY,
      cardWidth,
      cardHeight,
    );
    drawShipCard(
      key,
      centerX,
      centerY,
      cardWidth,
      cardHeight,
      isActive,
      isHovered,
      isP1Pick,
    );
  });

  drawButton(
    canvas.width * 0.12,
    canvas.height * 0.89,
    140,
    44,
    "BACK",
    "#475569",
  );

  if (state.pendingClass) {
    const lockLabel = isP1Turn ? "LOCK IN" : "BATTLE!";
    const lockColor = isP1Turn ? "#2775e3" : "#22c55e";
    drawButton(
      canvas.width / 2,
      canvas.height * 0.89,
      220,
      50,
      lockLabel,
      lockColor,
    );
  }
}

function drawShipCard(
  classKey,
  centerX,
  centerY,
  cardWidth,
  cardHeight,
  isActive,
  isHovered,
  isP1Pick,
) {
  const config = shipConfig[classKey];
  const info = SHIP_INFO[classKey];
  const left = centerX - cardWidth / 2;
  const top = centerY - cardHeight / 2;
  const p = (f) => top + cardHeight * f;
  const radius = 10;
  const imgPad = cardWidth * 0.07;

  const nameFontSize = Math.max(9, Math.floor(cardWidth * 0.058));
  const bodyFontSize = Math.max(8, Math.floor(cardWidth * 0.042));
  const smallFontSize = Math.max(7, Math.floor(cardWidth * 0.036));

  // Drop shadow
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.roundRect(left + 5, top + 5, cardWidth, cardHeight, radius);
  ctx.fill();

  // Card background
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.roundRect(left, top, cardWidth, cardHeight, radius);
  ctx.fill();

  if (isActive) {
    ctx.fillStyle = hexAlpha(config.color, 0.1);
    ctx.beginPath();
    ctx.roundRect(left, top, cardWidth, cardHeight, radius);
    ctx.fill();
  }

  if (isHovered && !isActive) {
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.beginPath();
    ctx.roundRect(left, top, cardWidth, cardHeight, radius);
    ctx.fill();
  }

  // Border
  ctx.strokeStyle = isActive
    ? config.color
    : isHovered
      ? hexAlpha(config.color, 0.55)
      : "#2d3f55";
  ctx.lineWidth = isActive ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.roundRect(left, top, cardWidth, cardHeight, radius);
  ctx.stroke();

  // Image placeholder
  const imgX = left + imgPad;
  const imgY = p(0.02);
  const imgW = cardWidth - imgPad * 2;
  const imgH = cardHeight * 0.4;

  ctx.fillStyle = "#0d1a2b";
  ctx.beginPath();
  ctx.roundRect(imgX, imgY, imgW, imgH, 6);
  ctx.fill();

  ctx.fillStyle = "#2d4060";
  ctx.font = `${smallFontSize}px "Press Start 2P"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("[ SHIP ]", centerX, imgY + imgH / 2);

  // Ship name
  ctx.fillStyle = config.color;
  ctx.font = `${nameFontSize}px "Press Start 2P"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(config.label.toUpperCase(), centerX, p(0.48));

  // Description
  ctx.fillStyle = "#94a3b8";
  ctx.font = `${bodyFontSize}px "Press Start 2P"`;
  ctx.fillText(info.description, centerX, p(0.56));

  // Stats
  ctx.font = `${smallFontSize}px "Press Start 2P"`;
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "left";
  ctx.fillText(`HP ${config.health}`, left + imgPad, p(0.64));
  ctx.textAlign = "center";
  ctx.fillText(`SPD ${config.speed}`, centerX, p(0.64));
  ctx.textAlign = "right";
  ctx.fillText(`DMG ${config.damage}`, left + cardWidth - imgPad, p(0.64));

  // Divider
  ctx.strokeStyle = "#2d3f55";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left + imgPad, p(0.7));
  ctx.lineTo(left + cardWidth - imgPad, p(0.7));
  ctx.stroke();

  // Skill name
  ctx.fillStyle = "#fbbf24";
  ctx.font = `${bodyFontSize}px "Press Start 2P"`;
  ctx.textAlign = "center";
  ctx.fillText(info.skillName, centerX, p(0.77));

  // Skill desc
  ctx.fillStyle = "#64748b";
  ctx.font = `${smallFontSize}px "Press Start 2P"`;
  ctx.fillText(info.skillDesc, centerX, p(0.85));

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // P1 badge (shown on P1's pick during P2 turn)
  if (isP1Pick) {
    const badgeW = Math.max(24, cardWidth * 0.15);
    const badgeH = Math.max(14, cardHeight * 0.04);
    const badgeX = left + cardWidth - imgPad - badgeW;
    const badgeY = top + 6;
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = `${smallFontSize}px "Press Start 2P"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("P1", badgeX + badgeW / 2, badgeY + badgeH / 2);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
  }
}

export function drawWinScreen() {
  drawEndScreen("#22c55e", "VICTORY!", `${shipConfig[player?.classKey]?.label ?? "P1"} wins!`);
}

export function drawGameOverScreen() {
  drawEndScreen("#ef4444", "GAME OVER", `${shipConfig[enemy?.classKey]?.label ?? "P2"} wins!`);
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function drawEndScreen(titleColor, titleText, subtitleText) {
  ctx.fillStyle = "rgba(15,23,42,0.95)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;

  // Title
  ctx.fillStyle = titleColor;
  ctx.font = `bold ${Math.floor(canvas.width * 0.065)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(titleText, cx, canvas.height * 0.18);

  // Subtitle
  ctx.fillStyle = "#94a3b8";
  ctx.font = `${Math.floor(canvas.width * 0.02)}px monospace`;
  ctx.fillText(subtitleText, cx, canvas.height * 0.27);

  // Match time
  ctx.fillStyle = "#f8fafc";
  ctx.font = `bold ${Math.floor(canvas.width * 0.022)}px monospace`;
  ctx.fillText(`TIME  ${formatTime(state.stats.matchTimeMs)}`, cx, canvas.height * 0.35);

  // Stats card
  const cardW = canvas.width * 0.52;
  const cardH = canvas.height * 0.26;
  const cardX = cx - cardW / 2;
  const cardY = canvas.height * 0.4;

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 10);
  ctx.fill();
  ctx.strokeStyle = "#1e3a5f";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 10);
  ctx.stroke();

  const colLeft  = cardX + cardW * 0.22;
  const colRight = cardX + cardW * 0.78;
  const rowHeader = cardY + cardH * 0.2;
  const rowDmg    = cardY + cardH * 0.48;
  const rowShots  = cardY + cardH * 0.74;

  const p1Color = player?.color ?? "#38bdf8";
  const p2Color = enemy?.color  ?? "#f87171";

  // Column headers
  ctx.font = `bold ${Math.floor(canvas.width * 0.018)}px monospace`;
  ctx.fillStyle = p1Color;
  ctx.textAlign = "center";
  ctx.fillText("PLAYER 1", colLeft, rowHeader);
  ctx.fillStyle = p2Color;
  ctx.fillText("PLAYER 2", colRight, rowHeader);

  // Divider line
  ctx.strokeStyle = "#1e3a5f";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 16, rowHeader + 10);
  ctx.lineTo(cardX + cardW - 16, rowHeader + 10);
  ctx.stroke();

  // Center labels
  ctx.fillStyle = "#475569";
  ctx.font = `${Math.floor(canvas.width * 0.013)}px monospace`;
  ctx.fillText("DMG", cx, rowDmg);
  ctx.fillText("SHOTS", cx, rowShots);

  // Values
  ctx.font = `bold ${Math.floor(canvas.width * 0.022)}px monospace`;
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(state.stats.p1DamageDealt, colLeft, rowDmg);
  ctx.fillText(state.stats.p2DamageDealt, colRight, rowDmg);
  ctx.fillText(state.stats.p1ShotsFired,  colLeft,  rowShots);
  ctx.fillText(state.stats.p2ShotsFired,  colRight, rowShots);

  ctx.textBaseline = "alphabetic";

  drawButton(cx, canvas.height * 0.79, 240, 50, "PLAY AGAIN", "#0ea5e9");
}

export function drawPauseScreen() {
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cardW = canvas.width * 0.34;
  const cardH = canvas.height * 0.42;
  const cardX = cx - cardW / 2;
  const cardY = canvas.height * 0.26;

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 14);
  ctx.fill();
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 14);
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.font = `bold ${Math.floor(canvas.width * 0.035)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PAUSED", cx, cardY + cardH * 0.22);

  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 20, cardY + cardH * 0.35);
  ctx.lineTo(cardX + cardW - 20, cardY + cardH * 0.35);
  ctx.stroke();

  ctx.textBaseline = "alphabetic";

  drawButton(cx, cardY + cardH * 0.57, cardW * 0.72, 46, "RESUME", "#22c55e");
  drawButton(cx, cardY + cardH * 0.82, cardW * 0.72, 46, "QUIT TO MENU", "#475569");
}

export function handlePauseClick(mouseX, mouseY) {
  const cx = canvas.width / 2;
  const cardH = canvas.height * 0.42;
  const cardY = canvas.height * 0.26;
  const buttonW = canvas.width * 0.34 * 0.72;

  if (isInsideButton(mouseX, mouseY, cx, cardY + cardH * 0.57, buttonW, 46)) {
    state.paused = false;
    return;
  }
  if (isInsideButton(mouseX, mouseY, cx, cardY + cardH * 0.82, buttonW, 46)) {
    state.paused = false;
    state.gameState = "selection";
    state.playerClass = null;
    state.enemyClass = null;
    state.pendingClass = null;
  }
}

function drawButton(centerX, centerY, buttonWidth, buttonHeight, label, color) {
  const hovered = isInsideButton(
    mouse.x,
    mouse.y,
    centerX,
    centerY,
    buttonWidth,
    buttonHeight,
  );
  const pressed = hovered && mouse.pressed;

  const left = centerX - buttonWidth / 2;
  const top = centerY - buttonHeight / 2;

  // Shadow (offset down-right, skipped when pressed)
  if (!pressed) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.roundRect(left + 4, top + 4, buttonWidth, buttonHeight, 10);
    ctx.fill();
  }

  // Base fill
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(left, pressed ? top + 3 : top, buttonWidth, buttonHeight, 10);
  ctx.fill();

  // Hover highlight overlay
  if (hovered && !pressed) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.beginPath();
    ctx.roundRect(left, top, buttonWidth, buttonHeight, 10);
    ctx.fill();
  }

  // Press darken overlay
  if (pressed) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.beginPath();
    ctx.roundRect(left, top + 3, buttonWidth, buttonHeight, 10);
    ctx.fill();
  }

  // Label
  ctx.fillStyle = "#000000";
  ctx.font = `14px "Press Start 2P"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, centerX, pressed ? centerY + 3 : centerY);
  ctx.textBaseline = "alphabetic";
}

export function handleStartClick(mouseX, mouseY) {
  if (
    isInsideButton(
      mouseX,
      mouseY,
      canvas.width / 2,
      canvas.height * 0.6,
      220,
      54,
    )
  ) {
    state.gameState = "selection";
    return;
  }
  if (
    isInsideButton(
      mouseX,
      mouseY,
      canvas.width / 2,
      canvas.height * 0.72,
      220,
      54,
    )
  ) {
    window.close();
  }
}

export function handleSelectionClick(mouseX, mouseY) {
  const isP1Turn = state.playerClass === null;

  // BACK button
  if (
    isInsideButton(
      mouseX,
      mouseY,
      canvas.width * 0.12,
      canvas.height * 0.89,
      140,
      44,
    )
  ) {
    state.pendingClass = null;
    if (isP1Turn) {
      state.gameState = "start";
    } else {
      state.playerClass = null;
      state.enemyClass = null;
    }
    return;
  }

  // LOCK IN / BATTLE button
  if (state.pendingClass) {
    if (
      isInsideButton(
        mouseX,
        mouseY,
        canvas.width / 2,
        canvas.height * 0.89,
        220,
        50,
      )
    ) {
      if (isP1Turn) {
        state.playerClass = state.pendingClass;
        state.pendingClass = null;
      } else {
        state.enemyClass = state.pendingClass;
        state.pendingClass = null;
        state.gameState = "playing";
      }
      return;
    }
  }

  // Card clicks — update pending selection
  const cards = getCardLayout();
  for (const { key, centerX, centerY, cardWidth, cardHeight } of cards) {
    if (
      isInsideButton(mouseX, mouseY, centerX, centerY, cardWidth, cardHeight)
    ) {
      state.pendingClass = state.pendingClass === key ? null : key;
      return;
    }
  }
}

export function handleEndClick(mouseX, mouseY) {
  const buttonCenterX = canvas.width / 2;
  const buttonCenterY = canvas.height * 0.63;
  if (isInsideButton(mouseX, mouseY, buttonCenterX, buttonCenterY, 240, 54)) {
    state.gameState = "selection";
    state.playerClass = null;
    state.enemyClass = null;
    state.pendingClass = null;
  }
}

function isInsideButton(
  mouseX,
  mouseY,
  centerX,
  centerY,
  buttonWidth,
  buttonHeight,
) {
  return (
    mouseX >= centerX - buttonWidth / 2 &&
    mouseX <= centerX + buttonWidth / 2 &&
    mouseY >= centerY - buttonHeight / 2 &&
    mouseY <= centerY + buttonHeight / 2
  );
}

export function updateCursor() {
  let hovered = false;

  if (state.paused) {
    const cx = canvas.width / 2;
    const cardH = canvas.height * 0.42;
    const cardY = canvas.height * 0.26;
    const buttonW = canvas.width * 0.34 * 0.72;
    hovered =
      isInsideButton(mouse.x, mouse.y, cx, cardY + cardH * 0.57, buttonW, 46) ||
      isInsideButton(mouse.x, mouse.y, cx, cardY + cardH * 0.82, buttonW, 46);
    canvas.style.cursor = hovered ? "pointer" : "default";
    return;
  }

  if (state.gameState === "start") {
    hovered =
      isInsideButton(
        mouse.x,
        mouse.y,
        canvas.width / 2,
        canvas.height * 0.6,
        220,
        54,
      ) ||
      isInsideButton(
        mouse.x,
        mouse.y,
        canvas.width / 2,
        canvas.height * 0.72,
        220,
        54,
      );
  } else if (state.gameState === "selection") {
    const cards = getCardLayout();
    hovered =
      cards.some(({ centerX, centerY, cardWidth, cardHeight }) =>
        isInsideButton(
          mouse.x,
          mouse.y,
          centerX,
          centerY,
          cardWidth,
          cardHeight,
        ),
      ) ||
      isInsideButton(
        mouse.x,
        mouse.y,
        canvas.width * 0.12,
        canvas.height * 0.89,
        140,
        44,
      );

    if (!hovered && state.pendingClass) {
      hovered = isInsideButton(
        mouse.x,
        mouse.y,
        canvas.width / 2,
        canvas.height * 0.89,
        220,
        50,
      );
    }
  } else if (state.gameState === "win" || state.gameState === "gameOver") {
    hovered = isInsideButton(
      mouse.x,
      mouse.y,
      canvas.width / 2,
      canvas.height * 0.63,
      240,
      54,
    );
  }

  canvas.style.cursor = hovered ? "pointer" : "default";
}
