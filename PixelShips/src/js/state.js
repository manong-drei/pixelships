export const state = {
  gameState: "start",
  playerClass: null,
  enemyClass: null,
  pendingClass: null,
  paused: false,
  stats: {
    p1ShotsFired: 0,
    p2ShotsFired: 0,
    p1DamageDealt: 0,
    p2DamageDealt: 0,
    matchTimeMs: 0,
  },
};
