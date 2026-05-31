// arenaCollision.js
import { canvas } from "./canvas.js";
import { state } from "./state.js";

// Rects are defined as fractions of canvas dimensions [xFrac, yFrac, wFrac, hFrac]
// xFrac/yFrac = center of the blocked zone
const ARENA_RECTS = {
  // Mission 1 — Arena 3: island at left edge
  0: [{ xF: 0.0, yF: 0.45, wF: 0.16, hF: 0.55 }],
  // Mission 3 — Arena 2: two islands top and bottom
  2: [
    { xF: 0.5, yF: 0.0, wF: 0.45, hF: 0.2 },
    { xF: 0.5, yF: 1.0, wF: 0.45, hF: 0.2 },
  ],
  // Mission 5 — Arena 1: island/base at bottom-right
  4: [{ xF: 0.92, yF: 0.55, wF: 0.18, hF: 0.55 }],
};

export function isBlockedByIsland(x, y, halfW, halfH) {
  if (!state.campaignMode) return false;
  const rects = ARENA_RECTS[state.campaignMission];
  if (!rects) return false;

  for (const r of rects) {
    const rx = r.xF * canvas.width;
    const ry = r.yF * canvas.height;
    const rHalfW = (r.wF * canvas.width) / 2;
    const rHalfH = (r.hF * canvas.height) / 2;

    if (
      x + halfW > rx - rHalfW &&
      x - halfW < rx + rHalfW &&
      y + halfH > ry - rHalfH &&
      y - halfH < ry + rHalfH
    ) {
      return true;
    }
  }
  return false;
}
