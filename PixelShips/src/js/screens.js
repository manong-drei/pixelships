import { canvas, ctx, mouse } from "./canvas.js";
import { state } from "./state.js";
import { shipConfig } from "./shipConfig.js";
import { player } from "./player.js";
import { enemy } from "./enemy.js";
import { getSplashSprite } from "./assets.js";
import { campaign, missions } from "./campaign.js";

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

function randomClass() {
  return CLASS_KEYS[Math.floor(Math.random() * CLASS_KEYS.length)];
}

function getCardLayout() {
  const cardWidth = canvas.width * 0.215;
  const cardHeight = canvas.height * 0.73;
  const gap = canvas.width * 0.027;
  const totalWidth = 4 * cardWidth + 3 * gap;
  const startCenterX = (canvas.width - totalWidth) / 2 + cardWidth / 2;
  const centerY = canvas.height * 0.545;
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

  if (titleLogoImage.complete && titleLogoImage.naturalWidth > 0) {
    const logoW = canvas.width * 0.45;
    const logoH = logoW / 3;
    const logoX = (canvas.width - logoW) / 2;
    const logoY = canvas.height * 0.28 - logoH / 2;
    ctx.drawImage(titleLogoImage, logoX, logoY, logoW, logoH);
  } else {
    drawTitleText("Pacific Clash");

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
  }

  drawButton(
    canvas.width / 2,
    canvas.height * 0.55,
    220,
    54,
    "PLAY",
    "#2775e3",
  );
  drawButton(
    canvas.width / 2,
    canvas.height * 0.67,
    220,
    54,
    "HOW TO PLAY",
    "#0f766e",
  );
  drawButton(
    canvas.width / 2,
    canvas.height * 0.79,
    220,
    54,
    "QUIT",
    "#566270",
  );
}

export function drawModeHubScreen() {
  // Background
  if (selectionBgImage.complete && selectionBgImage.naturalWidth > 0) {
    ctx.drawImage(selectionBgImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Title
  const titleSize = Math.max(14, Math.floor(canvas.width * 0.025));
  ctx.font = `${titleSize}px "Press Start 2P"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f8fafc";
  ctx.fillText("PIXEL SHIPS", canvas.width / 2, canvas.height * 0.28);

  // Subtitle
  const subSize = Math.max(8, Math.floor(canvas.width * 0.013));
  ctx.font = `${subSize}px "Press Start 2P"`;
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("CHOOSE YOUR BATTLE", canvas.width / 2, canvas.height * 0.36);

  // Buttons — vertically stacked, centered
  const btnW = 220;
  const btnH = 54;
  const btnX = canvas.width / 2;
  const btn1Y = canvas.height * 0.5;
  const btn2Y = canvas.height * 0.62;

  drawButton(btnX, btn1Y, btnW, btnH, "CAMPAIGN", "#f59e0b"); // amber/gold
  drawButton(btnX, btn2Y, btnW, btnH, "CUSTOM", "#2775e3"); // blue

  // Descriptions under each button
  const descSize = Math.max(7, Math.floor(canvas.width * 0.01));
  ctx.font = `${descSize}px "Press Start 2P"`;
  ctx.fillStyle = "#64748b";
  ctx.fillText("5-Mission Solo Campaign", btnX, btn1Y + btnH / 2 + 18);
  ctx.fillText("1P vs CPU · Co-op · PvP", btnX, btn2Y + btnH / 2 + 18);

  // Back button
  drawButton(
    canvas.width * 0.08,
    canvas.height * 0.07,
    120,
    40,
    "BACK",
    "#475569",
  );
}

export function handleModeHubClick(mouseX, mouseY) {
  // BACK — return to start screen
  if (
    isInsideButton(
      mouseX,
      mouseY,
      canvas.width * 0.08,
      canvas.height * 0.07,
      120,
      40,
    )
  ) {
    state.gameState = "start";
    return;
  }

  const btnW = 220;
  const btnH = 54;
  const btnX = canvas.width / 2;
  const btn1Y = canvas.height * 0.5;
  const btn2Y = canvas.height * 0.62;

  // CAMPAIGN
  if (isInsideButton(mouseX, mouseY, btnX, btn1Y, btnW, btnH)) {
    // For now, placeholder — goes to campaign briefing
    // (We'll add the campaign briefing screen later)
    state.gameState = "campaignBriefing";
    return;
  }

  // CUSTOM
  if (isInsideButton(mouseX, mouseY, btnX, btn2Y, btnW, btnH)) {
    state.gameState = "modeSelect";
    return;
  }
}
export function drawCampaignBriefingScreen() {
  if (selectionBgImage.complete && selectionBgImage.naturalWidth > 0) {
    ctx.drawImage(selectionBgImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const mission = missions[campaign.currentMission];
  const cx = canvas.width / 2;

  // Header
  const headerSize = Math.max(9, Math.floor(canvas.width * 0.013));
  ctx.font = `${headerSize}px "Press Start 2P"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f59e0b";
  ctx.fillText("CAMPAIGN", cx, canvas.height * 0.1);

  // Mission title
  const titleSize = Math.max(13, Math.floor(canvas.width * 0.022));
  ctx.font = `${titleSize}px "Press Start 2P"`;
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(
    `MISSION ${campaign.currentMission + 1} — "${mission.title.toUpperCase()}"`,
    cx,
    canvas.height * 0.2,
  );

  // Briefing text (word-wrapped)
  const briefSize = Math.max(8, Math.floor(canvas.width * 0.011));
  ctx.font = `${briefSize}px "Press Start 2P"`;
  ctx.fillStyle = "#94a3b8";
  drawWrappedText(
    mission.briefing,
    cx,
    canvas.height * 0.3,
    canvas.width * 0.6,
    briefSize * 1.8,
  );

  // Enemy forces
  const labelSize = Math.max(8, Math.floor(canvas.width * 0.011));
  ctx.font = `${labelSize}px "Press Start 2P"`;
  ctx.fillStyle = "#f87171";
  const enemyStr = mission.enemies
    .map(
      (e) => `${e.count}x ${e.type.charAt(0).toUpperCase() + e.type.slice(1)}`,
    )
    .join(", ");
  ctx.fillText(`ENEMY: ${enemyStr}`, cx, canvas.height * 0.45);

  // Your ship
  ctx.fillStyle = "#38bdf8";
  if (mission.playerShip === "choose") {
    const selectedLabel = state.playerClass
      ? `YOUR SHIP: ${state.playerClass.toUpperCase()} [LOCKED IN]`
      : "YOUR SHIP: [ SELECT ]";
    ctx.fillText(selectedLabel, cx, canvas.height * 0.53);
  } else {
    ctx.fillText(
      `YOUR SHIP: ${mission.playerShip.toUpperCase()} (ASSIGNED)`,
      cx,
      canvas.height * 0.53,
    );
  }

  // Battle button
  const canStart =
    mission.playerShip !== "choose" || state.playerClass !== null;
  drawButton(
    cx,
    canvas.height * 0.65,
    200,
    54,
    "BATTLE!",
    canStart ? "#22c55e" : "#374151",
  );

  // Select ship button (missions with "choose")
  if (mission.playerShip === "choose" && state.playerClass === null) {
    drawButton(cx, canvas.height * 0.75, 200, 46, "SELECT SHIP", "#2775e3");
  }

  // Progress dots
  const dotRadius = 7;
  const dotGap = 28;
  const dotsStartX = cx - ((missions.length - 1) * dotGap) / 2;
  const dotY = canvas.height * 0.87;
  for (let i = 0; i < missions.length; i++) {
    ctx.beginPath();
    ctx.arc(dotsStartX + i * dotGap, dotY, dotRadius, 0, Math.PI * 2);
    if (campaign.completedMissions.includes(i)) {
      ctx.fillStyle = "#f59e0b";
    } else if (i === campaign.currentMission) {
      ctx.fillStyle = "#38bdf8";
    } else {
      ctx.fillStyle = "#334155";
    }
    ctx.fill();
  }

  const dotLabelSize = Math.max(7, Math.floor(canvas.width * 0.009));
  ctx.font = `${dotLabelSize}px "Press Start 2P"`;
  ctx.fillStyle = "#64748b";
  ctx.fillText(
    `${campaign.completedMissions.length} OF 5 COMPLETE`,
    cx,
    dotY + dotRadius + 18,
  );

  // Back button
  drawButton(
    canvas.width * 0.08,
    canvas.height * 0.07,
    120,
    40,
    "BACK",
    "#475569",
  );
}
export function handleCampaignBriefingClick(mouseX, mouseY) {
  // BACK
  if (
    isInsideButton(
      mouseX,
      mouseY,
      canvas.width * 0.08,
      canvas.height * 0.07,
      120,
      40,
    )
  ) {
    state.playerClass = null;
    state.pendingClass = null;
    state.gameState = "modeHub";
    return;
  }

  const mission = missions[campaign.currentMission];
  const canStart =
    mission.playerShip !== "choose" || state.playerClass !== null;

  // SELECT SHIP (choose missions only, before a class is picked)
  if (mission.playerShip === "choose" && state.playerClass === null) {
    if (
      isInsideButton(
        mouseX,
        mouseY,
        canvas.width / 2,
        canvas.height * 0.75,
        200,
        46,
      )
    ) {
      state.campaignMode = true;
      state.mode = "pvc";
      state.playerClass = null;
      state.pendingClass = null;
      state.enemyClass = null;
      state.gameState = "selection";
      return;
    }
  }

  // BATTLE
  if (canStart) {
    if (
      isInsideButton(
        mouseX,
        mouseY,
        canvas.width / 2,
        canvas.height * 0.65,
        200,
        54,
      )
    ) {
      if (mission.playerShip !== "choose") {
        state.playerClass = mission.playerShip;
      }
      state.campaignMode = true;
      state.mode = "pvc";
      state.enemyClass = mission.enemies[0].type;
      state.gameState = "playing";
      return;
    }
  }
}
export function drawModeSelectScreen() {
  if (selectionBgImage.complete && selectionBgImage.naturalWidth > 0) {
    ctx.drawImage(selectionBgImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const titleSize = Math.max(14, Math.floor(canvas.width * 0.025));
  ctx.font = `${titleSize}px "Press Start 2P"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f8fafc";
  ctx.fillText("SELECT MODE", canvas.width / 2, canvas.height * 0.28);

  const buttonY = canvas.height * 0.5;
  const buttonW = 200;
  const buttonH = 60;
  const gap = canvas.width * 0.05;
  const totalW = 3 * buttonW + 2 * gap;
  const startX = (canvas.width - totalW) / 2 + buttonW / 2;

  drawButton(startX, buttonY, buttonW, buttonH, "1P VS CPU", "#2775e3");
  drawButton(
    startX + buttonW + gap,
    buttonY,
    buttonW,
    buttonH,
    "CO-OP",
    "#9333ea",
  );
  drawButton(
    startX + 2 * (buttonW + gap),
    buttonY,
    buttonW,
    buttonH,
    "PVP",
    "#0f766e",
  );

  const descSize = Math.max(7, Math.floor(canvas.width * 0.011));
  ctx.font = `${descSize}px "Press Start 2P"`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("Player vs AI", startX, buttonY + buttonH / 2 + 20);
  ctx.fillText(
    "Coop vs AI",
    startX + buttonW + gap,
    buttonY + buttonH / 2 + 20,
  );
  ctx.fillText(
    "Player vs Player",
    startX + 2 * (buttonW + gap),
    buttonY + buttonH / 2 + 20,
  );

  drawButton(
    canvas.width * 0.08,
    canvas.height * 0.07,
    120,
    40,
    "BACK",
    "#475569",
  );
}
function drawWrappedText(text, cx, startY, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let y = startY;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cx, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, y);
}
export function drawSelectionScreen() {
  if (selectionBgImage.complete && selectionBgImage.naturalWidth > 0) {
    ctx.drawImage(selectionBgImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const isP1Turn = state.playerClass === null;
  const isP2CoopTurn =
    !isP1Turn && state.mode === "coop" && state.player2Class === null;
  const isCpuTurn =
    !isP1Turn && state.mode === "pvc" && state.enemyClass === null;

  let playerColor, playerLabel, chooseLabel;
  if (isP1Turn) {
    playerColor = "#38bdf8";
    playerLabel = "PLAYER 1";
    chooseLabel = "CHOOSE YOUR SHIP";
  } else if (isP2CoopTurn) {
    playerColor = "#f87171";
    playerLabel = "PLAYER 2";
    chooseLabel = "CHOOSE YOUR SHIP";
  } else if (isCpuTurn) {
    playerColor = "#f59e0b";
    playerLabel = "COMPUTER";
    chooseLabel = "CHOOSE CPU'S SHIP";
  } else {
    playerColor = "#f87171";
    playerLabel = "PLAYER 2";
    chooseLabel = "CHOOSE YOUR SHIP";
  }

  let lockInLabel, lockInColor;
  if (isP1Turn || isP2CoopTurn) {
    lockInLabel = "LOCK IN";
    lockInColor = isP1Turn ? "#2775e3" : "#9333ea";
  } else if (isCpuTurn) {
    lockInLabel = "LOCK IN";
    lockInColor = "#f59e0b";
  } else {
    lockInLabel = "BATTLE!";
    lockInColor = "#22c55e";
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = playerColor;
  ctx.font = `${Math.max(10, Math.floor(canvas.width * 0.016))}px "Press Start 2P"`;
  ctx.fillText(playerLabel, canvas.width / 2, canvas.height * 0.08);

  ctx.fillStyle = "#64748b";
  ctx.font = `${Math.max(8, Math.floor(canvas.width * 0.011))}px "Press Start 2P"`;
  ctx.fillText(chooseLabel, canvas.width / 2, canvas.height * 0.13);

  const cards = getCardLayout();
  cards.forEach(({ key, centerX, centerY, cardWidth, cardHeight }) => {
    const isActive = state.pendingClass === key;
    const isP1Pick = !isP1Turn && state.playerClass === key;
    const isP2Pick = isP2CoopTurn && state.player2Class === key;
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
      isP2Pick,
      isActive ? lockInLabel : null,
      isActive ? lockInColor : null,
    );
  });

  // Back button — upper-left
  drawButton(
    canvas.width * 0.08,
    canvas.height * 0.07,
    120,
    40,
    "BACK",
    "#475569",
  );

  // Randomize button — CPU turn only
  if (isCpuTurn) {
    drawButton(
      canvas.width / 2,
      canvas.height * 0.955,
      210,
      50,
      "RANDOMIZE",
      "#f59e0b",
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
  isP2Pick,
  lockInLabel,
  lockInColor,
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

  const splashSprite = getSplashSprite(classKey);
  if (splashSprite && splashSprite.complete && splashSprite.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgW, imgH, 6);
    ctx.clip();
    ctx.drawImage(splashSprite, imgX, imgY, imgW, imgH);
    ctx.restore();
  } else {
    ctx.fillStyle = "#2d4060";
    ctx.font = `${smallFontSize}px "Press Start 2P"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("[ SHIP ]", centerX, imgY + imgH / 2);
  }

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

  // Lock In button — only on the active (selected) card
  if (lockInLabel) {
    const lockBtnH = Math.max(28, cardHeight * 0.1);
    const lockBtnCY = top + cardHeight * 0.93;
    drawButton(
      centerX,
      lockBtnCY,
      cardWidth * 0.82,
      lockBtnH,
      lockInLabel,
      lockInColor,
    );
  }

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // P1 badge
  if (isP1Pick) {
    drawBadge(
      left,
      top,
      cardWidth,
      cardHeight,
      imgPad,
      smallFontSize,
      "P1",
      "#38bdf8",
    );
  }

  // P2 badge (co-op second player pick shown during AI selection)
  if (isP2Pick) {
    drawBadge(
      left,
      top,
      cardWidth,
      cardHeight,
      imgPad,
      smallFontSize,
      "P2",
      "#f87171",
    );
  }
}

function drawBadge(
  left,
  top,
  cardWidth,
  cardHeight,
  imgPad,
  smallFontSize,
  label,
  color,
) {
  const badgeW = Math.max(24, cardWidth * 0.15);
  const badgeH = Math.max(14, cardHeight * 0.04);
  const badgeX = left + cardWidth - imgPad - badgeW;
  const badgeY = top + 6;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.font = `${smallFontSize}px "Press Start 2P"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, badgeX + badgeW / 2, badgeY + badgeH / 2);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

export function drawWinScreen() {
  const subtitle =
    state.mode === "coop"
      ? "ALL WAVES CLEARED!"
      : `${shipConfig[player?.classKey]?.label ?? "P1"} wins!`;
  drawEndScreen("#22c55e", "VICTORY!", subtitle);
}

export function drawGameOverScreen() {
  const subtitle =
    state.mode === "coop"
      ? "Enemy fleet wins!"
      : `${shipConfig[enemy?.classKey]?.label ?? "Enemy"} wins!`;
  drawEndScreen("#ef4444", "GAME OVER", subtitle);
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
  ctx.fillText(
    `TIME  ${formatTime(state.stats.matchTimeMs)}`,
    cx,
    canvas.height * 0.35,
  );

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

  const colLeft = cardX + cardW * 0.22;
  const colRight = cardX + cardW * 0.78;
  const rowHeader = cardY + cardH * 0.2;
  const rowDmg = cardY + cardH * 0.48;
  const rowShots = cardY + cardH * 0.74;

  const p1Color = player?.color ?? "#38bdf8";
  const p2Color = enemy?.color ?? "#f87171";

  // Column headers
  ctx.font = `bold ${Math.floor(canvas.width * 0.018)}px monospace`;
  ctx.fillStyle = p1Color;
  ctx.textAlign = "center";
  ctx.fillText(
    state.mode === "coop" ? "ALLIED" : "PLAYER 1",
    colLeft,
    rowHeader,
  );
  ctx.fillStyle = p2Color;
  ctx.fillText(
    state.mode === "coop" ? "ENEMY" : "PLAYER 2",
    colRight,
    rowHeader,
  );

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
  ctx.fillText(state.stats.p1ShotsFired, colLeft, rowShots);
  ctx.fillText(state.stats.p2ShotsFired, colRight, rowShots);

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
  drawButton(
    cx,
    cardY + cardH * 0.82,
    cardW * 0.72,
    46,
    "QUIT TO MENU",
    "#475569",
  );
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
    state.gameState = "modeSelect";
    state.playerClass = null;
    state.player2Class = null;
    state.enemyClass = null;
    state.pendingClass = null;
  }
}

function drawButton(
  centerX,
  centerY,
  buttonWidth,
  buttonHeight,
  label,
  _color,
) {
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
  const top = centerY - buttonHeight / 2 + (pressed ? 2 : 0);
  const right = left + buttonWidth;
  const bottom = top + buttonHeight;
  const midY = centerY + (pressed ? 2 : 0);

  // Drop shadow
  if (!pressed) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(left + 3, top + 3, buttonWidth, buttonHeight);
  }

  // Metal plate — gunmetal base, olive tint on hover
  const plateGrad = ctx.createLinearGradient(left, top, left, bottom);
  if (hovered) {
    plateGrad.addColorStop(0, "#4e5a3c");
    plateGrad.addColorStop(0.5, "#3c4630");
    plateGrad.addColorStop(1, "#2c3222");
  } else {
    plateGrad.addColorStop(0, "#3a3e40");
    plateGrad.addColorStop(0.5, "#2c3032");
    plateGrad.addColorStop(1, "#1e2224");
  }
  ctx.fillStyle = plateGrad;
  ctx.fillRect(left, top, buttonWidth, buttonHeight);

  // Bevel — top/left lighter, bottom/right darker
  ctx.fillStyle = "rgba(200,210,200,0.14)";
  ctx.fillRect(left, top, buttonWidth, 2);
  ctx.fillRect(left, top, 2, buttonHeight);

  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.fillRect(left, bottom - 2, buttonWidth, 2);
  ctx.fillRect(right - 2, top, 2, buttonHeight);

  // Subtle wear scratches
  ctx.save();
  ctx.rect(left + 4, top + 4, buttonWidth - 8, buttonHeight - 8);
  ctx.clip();
  ctx.strokeStyle = "rgba(210,220,200,0.055)";
  ctx.lineWidth = 1;
  for (const scratchX of [0.18, 0.57]) {
    ctx.beginPath();
    ctx.moveTo(left + buttonWidth * scratchX, top);
    ctx.lineTo(left + buttonWidth * (scratchX + 0.15), bottom);
    ctx.stroke();
  }
  ctx.restore();

  // Outer border
  ctx.strokeStyle = hovered ? "#6e7c5a" : "#424a4e";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(
    left + 0.75,
    top + 0.75,
    buttonWidth - 1.5,
    buttonHeight - 1.5,
  );

  // Corner rivets
  const rivetRadius = Math.max(2.5, Math.min(4.5, buttonHeight * 0.11));
  const rivetPad = rivetRadius + 4;
  for (const [rx, ry] of [
    [left + rivetPad, top + rivetPad],
    [right - rivetPad, top + rivetPad],
    [left + rivetPad, bottom - rivetPad],
    [right - rivetPad, bottom - rivetPad],
  ]) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.arc(rx + 0.8, ry + 0.8, rivetRadius, 0, Math.PI * 2);
    ctx.fill();

    const rivetGrad = ctx.createRadialGradient(
      rx - rivetRadius * 0.3,
      ry - rivetRadius * 0.3,
      0,
      rx,
      ry,
      rivetRadius,
    );
    rivetGrad.addColorStop(0, "#8a9896");
    rivetGrad.addColorStop(0.6, "#505c5a");
    rivetGrad.addColorStop(1, "#282e2e");
    ctx.fillStyle = rivetGrad;
    ctx.beginPath();
    ctx.arc(rx, ry, rivetRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(220,235,230,0.4)";
    ctx.beginPath();
    ctx.arc(
      rx - rivetRadius * 0.28,
      ry - rivetRadius * 0.32,
      rivetRadius * 0.38,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Stencil label
  const fontSize = Math.max(9, Math.min(14, Math.floor(buttonHeight * 0.38)));
  ctx.font = `${fontSize}px "Press Start 2P"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillText(label, centerX + 1, midY + 1);

  ctx.fillStyle = hovered ? "#d8e2c2" : "#a8b09a";
  ctx.fillText(label, centerX, midY);

  ctx.textBaseline = "alphabetic";
}

const howToPlayImage = new Image();
howToPlayImage.src = "assets/background/howtoplayy.png";

const selectionBgImage = new Image();
selectionBgImage.src = "assets/background/selection.png";

const titleLogoImage = new Image();
titleLogoImage.src = "assets/background/titlelogo.png";

export function drawInstructionsScreen() {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (howToPlayImage.complete && howToPlayImage.naturalWidth > 0) {
    ctx.drawImage(howToPlayImage, 0, 0, canvas.width, canvas.height);
  }

  // BACK button — upper-left
  drawButton(
    canvas.width * 0.08,
    canvas.height * 0.07,
    120,
    40,
    "BACK",
    "#475569",
  );
}

export function handleInstructionsClick(mouseX, mouseY) {
  if (
    isInsideButton(
      mouseX,
      mouseY,
      canvas.width * 0.08,
      canvas.height * 0.07,
      120,
      40,
    )
  ) {
    state.gameState = "start";
  }
}

export function handleStartClick(mouseX, mouseY) {
  if (
    isInsideButton(
      mouseX,
      mouseY,
      canvas.width / 2,
      canvas.height * 0.55,
      220,
      54,
    )
  ) {
    state.gameState = "modeHub";
    return;
  }
  if (
    isInsideButton(
      mouseX,
      mouseY,
      canvas.width / 2,
      canvas.height * 0.67,
      220,
      54,
    )
  ) {
    state.gameState = "instructions";
    return;
  }
  if (
    isInsideButton(
      mouseX,
      mouseY,
      canvas.width / 2,
      canvas.height * 0.79,
      220,
      54,
    )
  ) {
    window.close();
  }
}

export function handleModeSelectClick(mouseX, mouseY) {
  // BACK
  if (
    isInsideButton(
      mouseX,
      mouseY,
      canvas.width * 0.08,
      canvas.height * 0.07,
      120,
      40,
    )
  ) {
    state.gameState = "modeHub";
    return;
  }

  const buttonY = canvas.height * 0.5;
  const buttonW = 200;
  const buttonH = 60;
  const gap = canvas.width * 0.05;
  const totalW = 3 * buttonW + 2 * gap;
  const startX = (canvas.width - totalW) / 2 + buttonW / 2;

  if (isInsideButton(mouseX, mouseY, startX, buttonY, buttonW, buttonH)) {
    state.mode = "pvc";
    state.gameState = "selection";
    return;
  }
  if (
    isInsideButton(
      mouseX,
      mouseY,
      startX + buttonW + gap,
      buttonY,
      buttonW,
      buttonH,
    )
  ) {
    state.mode = "coop";
    state.gameState = "selection";
    return;
  }
  if (
    isInsideButton(
      mouseX,
      mouseY,
      startX + 2 * (buttonW + gap),
      buttonY,
      buttonW,
      buttonH,
    )
  ) {
    state.mode = "pvp";
    state.gameState = "selection";
    return;
  }
}

export function handleSelectionClick(mouseX, mouseY) {
  const isP1Turn = state.playerClass === null;
  const isP2CoopTurn =
    !isP1Turn && state.mode === "coop" && state.player2Class === null;
  const isCpuTurn =
    !isP1Turn && state.mode === "pvc" && state.enemyClass === null;

  // BACK button — upper-left
  if (
    isInsideButton(
      mouseX,
      mouseY,
      canvas.width * 0.08,
      canvas.height * 0.07,
      120,
      40,
    )
  ) {
    state.pendingClass = null;
    if (isP1Turn) {
      state.gameState = "modeSelect";
    } else if (isP2CoopTurn || isCpuTurn) {
      state.playerClass = null;
    } else {
      state.playerClass = null;
      state.enemyClass = null;
    }
    return;
  }

  // Randomize button — CPU turn only
  if (isCpuTurn) {
    if (
      isInsideButton(
        mouseX,
        mouseY,
        canvas.width / 2,
        canvas.height * 0.9,
        210,
        50,
      )
    ) {
      state.enemyClass = randomClass();
      state.pendingClass = null;
      state.gameState = "playing";
      return;
    }
  }

  const cards = getCardLayout();

  // Lock In button on the active card
  if (state.pendingClass) {
    for (const { key, centerX, centerY, cardWidth, cardHeight } of cards) {
      if (key !== state.pendingClass) continue;
      const top = centerY - cardHeight / 2;
      const lockBtnH = Math.max(28, cardHeight * 0.1);
      const lockBtnCY = top + cardHeight * 0.93;
      if (
        isInsideButton(
          mouseX,
          mouseY,
          centerX,
          lockBtnCY,
          cardWidth * 0.82,
          lockBtnH,
        )
      ) {
        if (isP1Turn) {
          state.playerClass = state.pendingClass;
          state.pendingClass = null;
          if (state.campaignMode) {
            state.gameState = "campaignBriefing";
          }
          // Stay on selection screen — CPU now picks in pvc mode (non-campaign)
        } else if (isCpuTurn) {
          state.enemyClass = state.pendingClass;
          state.pendingClass = null;
          state.gameState = "playing";
        } else if (isP2CoopTurn) {
          state.player2Class = state.pendingClass;
          state.pendingClass = null;
          state.enemyClass = null;
          state.gameState = "playing";
        } else {
          // pvp P2 turn
          state.enemyClass = state.pendingClass;
          state.pendingClass = null;
          state.gameState = "playing";
        }
        return;
      }
    }
  }

  // Card clicks — update pending selection
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
  const buttonCenterY = canvas.height * 0.79;
  if (isInsideButton(mouseX, mouseY, buttonCenterX, buttonCenterY, 240, 50)) {
    state.gameState = "selection";
    state.playerClass = null;
    state.player2Class = null;
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
        canvas.height * 0.55,
        220,
        54,
      ) ||
      isInsideButton(
        mouse.x,
        mouse.y,
        canvas.width / 2,
        canvas.height * 0.67,
        220,
        54,
      ) ||
      isInsideButton(
        mouse.x,
        mouse.y,
        canvas.width / 2,
        canvas.height * 0.79,
        220,
        54,
      );
  } else if (state.gameState === "instructions") {
    hovered = isInsideButton(
      mouse.x,
      mouse.y,
      canvas.width * 0.08,
      canvas.height * 0.07,
      120,
      40,
    );
  } else if (state.gameState === "modeSelect") {
    const buttonY = canvas.height * 0.5;
    const buttonW = 200;
    const buttonH = 60;
    const gap = canvas.width * 0.05;
    const totalW = 3 * buttonW + 2 * gap;
    const startX = (canvas.width - totalW) / 2 + buttonW / 2;
    hovered =
      isInsideButton(mouse.x, mouse.y, startX, buttonY, buttonW, buttonH) ||
      isInsideButton(
        mouse.x,
        mouse.y,
        startX + buttonW + gap,
        buttonY,
        buttonW,
        buttonH,
      ) ||
      isInsideButton(
        mouse.x,
        mouse.y,
        startX + 2 * (buttonW + gap),
        buttonY,
        buttonW,
        buttonH,
      ) ||
      isInsideButton(
        mouse.x,
        mouse.y,
        canvas.width * 0.08,
        canvas.height * 0.07,
        120,
        40,
      );
  } else if (state.gameState === "selection") {
    const isCpuTurn =
      state.playerClass !== null &&
      state.mode === "pvc" &&
      state.enemyClass === null;
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
        canvas.width * 0.08,
        canvas.height * 0.07,
        120,
        40,
      );

    if (!hovered && state.pendingClass) {
      for (const { key, centerX, centerY, cardWidth, cardHeight } of cards) {
        if (key !== state.pendingClass) continue;
        const top = centerY - cardHeight / 2;
        const lockBtnH = Math.max(28, cardHeight * 0.1);
        const lockBtnCY = top + cardHeight * 0.93;
        if (
          isInsideButton(
            mouse.x,
            mouse.y,
            centerX,
            lockBtnCY,
            cardWidth * 0.82,
            lockBtnH,
          )
        ) {
          hovered = true;
        }
      }
    }
    if (!hovered && isCpuTurn) {
      hovered = isInsideButton(
        mouse.x,
        mouse.y,
        canvas.width / 2,
        canvas.height * 0.9,
        210,
        50,
      );
    } else if (state.gameState === "campaignBriefing") {
      const mission = missions[campaign.currentMission];
      const canStart =
        mission.playerShip !== "choose" || state.playerClass !== null;
      hovered =
        isInsideButton(
          mouse.x,
          mouse.y,
          canvas.width * 0.08,
          canvas.height * 0.07,
          120,
          40,
        ) ||
        (canStart &&
          isInsideButton(
            mouse.x,
            mouse.y,
            canvas.width / 2,
            canvas.height * 0.65,
            200,
            54,
          )) ||
        (mission.playerShip === "choose" &&
          state.playerClass === null &&
          isInsideButton(
            mouse.x,
            mouse.y,
            canvas.width / 2,
            canvas.height * 0.75,
            200,
            46,
          ));
    }
  } else if (state.gameState === "win" || state.gameState === "gameOver") {
    hovered = isInsideButton(
      mouse.x,
      mouse.y,
      canvas.width / 2,
      canvas.height * 0.79,
      240,
      50,
    );
  }

  canvas.style.cursor = hovered ? "pointer" : "default";
}
