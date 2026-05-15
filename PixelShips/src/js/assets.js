const SHIP_SPRITE_PATHS = {
  destroyer: {
    right: "assets/ships/destroyer/destroyer_right.png",
    up: "assets/ships/destroyer/destroyer_up.png",
    down: "assets/ships/destroyer/destroyer_down.png",
    left: "assets/ships/destroyer/destroyer_left.png",
  },
  cruiser: {
    right: "assets/ships/cruiser/cruiser_right.png",
    up: "assets/ships/cruiser/cruiser_up.png",
    down: "assets/ships/cruiser/cruiser_down.png",
    left: "assets/ships/cruiser/cruiser_left.png",
  },
  battleship: {
    right: "assets/ships/battleship/battleship_right.png",
    up: "assets/ships/battleship/battleship_up.png",
    down: "assets/ships/battleship/battleship_down.png",
    left: "assets/ships/battleship/battleship_left.png",
  },
  carrier: {
    right: "assets/ships/carrier/carrier_right.png",
    up: "assets/ships/carrier/carrier_up.png",
    down: "assets/ships/carrier/carrier_down.png",
    left: "assets/ships/carrier/carrier_left.png",
  },
};

const loadedImages = {};

function loadImage(src) {
  if (loadedImages[src]) return loadedImages[src];
  const image = new Image();
  image.src = src;
  loadedImages[src] = image;
  return image;
}

// Preload all ship sprites at startup
for (const classKey of Object.keys(SHIP_SPRITE_PATHS)) {
  for (const dirEntry of Object.values(SHIP_SPRITE_PATHS[classKey])) {
    const src = typeof dirEntry === "string" ? dirEntry : dirEntry.src;
    loadImage(src);
  }
}

function snapDirection(dirX, dirY) {
  if (Math.abs(dirX) >= Math.abs(dirY)) {
    return dirX >= 0 ? "right" : "left";
  }
  return dirY < 0 ? "up" : "down";
}

export function getShipSprite(classKey, dirX, dirY) {
  const dirKey = snapDirection(dirX, dirY);
  const entry = SHIP_SPRITE_PATHS[classKey]?.[dirKey];
  if (!entry) return { image: null };

  if (typeof entry === "string") {
    return { image: loadImage(entry) };
  }
  return { image: loadImage(entry.src) };
}

const SHELL_SPRITE_PATHS = {
  right: "assets/projectiles/shell.png",
  up: "assets/projectiles/shell-up.png",
  down: "assets/projectiles/shell-down.png",
  left: "assets/projectiles/shell-left.png",
};

for (const src of Object.values(SHELL_SPRITE_PATHS)) {
  loadImage(src);
}

export function getShellSprite(dirX, dirY) {
  const dirKey = snapDirection(dirX, dirY);
  return loadImage(SHELL_SPRITE_PATHS[dirKey]);
}

const torpedoSpriteSheet = loadImage("assets/projectiles/trail.png");

export function getTorpedoSpriteSheet() {
  return torpedoSpriteSheet;
}

const bombSprite = loadImage("assets/projectiles/bomb.png");

export function getBombSprite() {
  return bombSprite;
}
