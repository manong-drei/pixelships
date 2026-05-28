# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build Tailwind CSS (one-time)
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css

# Watch mode during development
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch
```

Open `src/index.html` with a local HTTP server, such as VS Code Live Server. The game uses ES modules, so loading directly from `file://` may fail in some browsers.

There are no tests, no linter, and no build step beyond Tailwind.

---

## Architecture

### How the game loop works

`main.js` is the only file that calls `requestAnimationFrame`. Every frame it calls `update(dt)` then `draw()`. `dt` is milliseconds since the last frame — all cooldown timers (`fireCooldown`, `skillTimer`, turret timers) count down in milliseconds using `dt`.

State transitions are driven by `state.gameState` (in `state.js`). The loop checks this string every frame and routes to the correct update/draw path. The transition from `"selection"` → `"playing"` is detected in `update()` by comparing `prevGameState !== "playing"`, which triggers `initGame()` exactly once.

### Game modes

| Mode | `state.mode` | Description |
|---|---|---|
| Player vs Player | `"pvp"` | Two humans, P1 left / P2 right |
| 1P vs CPU | `"pvc"` | One human vs single AI enemy |
| Co-op wave | `"coop"` | Two humans on left vs 5 waves of AI from right |

In `"coop"` mode `enemy` is always `null`. The opponents are stored in `enemyMod.waveEnemies[]`.

### Selection screen flow

The selection screen is shared across all ship-pick turns. The active turn is derived from state — no separate `gameState` value:

| Condition | Turn |
|---|---|
| `state.playerClass === null` | P1 picks |
| `mode === "coop" && state.player2Class === null` | P2 (co-op) picks |
| `mode === "pvc" && state.enemyClass === null` | Player picks CPU's ship |
| otherwise | P2 (PvP) picks |

In `"pvc"` mode, after P1 locks in, the screen transitions to the CPU-pick phase (amber header, "CHOOSE CPU'S SHIP") instead of starting the game immediately. A **Randomize** button is shown during this phase to pick and start instantly. The **Lock In** / **Battle!** button appears directly on the selected card, not in a separate bottom button.

### Module responsibilities

| Module | Owns | Does NOT own |
|---|---|---|
| `state.js` | `gameState`, `mode`, selected classes, pause flag, wave counters, match stats | Ship objects and gameplay logic |
| `canvas.js` | `canvas` element, `ctx`, resize | No game logic |
| `shipConfig.js` | All ship stats (hp, speed, damage, rates, cooldowns, turretSpec) | No objects |
| `ship.js` | Shared ship creation, movement, turret reload ticking, drawing | Player/enemy ownership, firing |
| `player.js` | `player` object, P1 keyboard state (`keys`), movement, drawing | Firing (main.js fires on Space) |
| `enemy.js` | `enemy` (P2/CPU), `ally` (co-op P2), `waveEnemies[]`, P2 keyboard state, movement, drawing | Firing (main.js), AI logic |
| `ai.js` | `createAiState()`, `updateAi()` — 4-tactic movement AI, returns move/aim/fire/skill decisions; `AI_HEALTH_MULT`, `AI_DAMAGE_MULT` constants | Ship state, firing |
| `projectiles.js` | Both projectile arrays, movement, drawing | Collision |
| `collision.js` | AABB hit detection, writes health, sets win/gameOver; branches on mode | No drawing |
| `skills.js` | Skill dispatch, barrage queue, torpedo/AC mode toggle, ally skill variants | Plane flight paths |
| `planes.js` | `planePending` queue, active plane flight, torpedo/bomb spawning | Skill trigger logic |
| `effects.js` | Explosion and splash sprite effects | Collision/projectile decisions |
| `ui.js` | HUD drawing only | No state mutation |
| `screens.js` | All non-gameplay screen drawing + click hit-testing | No game objects |
| `assets.js` | Ship sprite preloading, directional sprite lookup by ship type + `dir` | No game logic |

### The live binding pattern

`player`, `enemy`, `ally`, and `waveEnemies` are exported as `let` / `[]` from their modules. Any module that imports them gets a live binding — the value updates automatically when `initPlayer()` / `initEnemy()` / `initWave()` reassigns them. **Exception:** `main.js` imports them as `import * as playerMod` / `import * as enemyMod` and accesses `.player` / `.enemy` / `.waveEnemies` inside functions (not at module scope) to ensure it always reads the current value.

### Layout and coordinate system

- Origin `(0, 0)` is top-left.
- P1 initially spawns at `canvas.width * 0.1, canvas.height / 2` — left side, facing right.
- P2 (PvP/PvC enemy) spawns at `canvas.width * 0.9, canvas.height / 2` — right side, facing left.
- In co-op, `initGame()` repositions P1 and ally to `canvas.width * 0.15`, at `canvas.height * 0.37` and `canvas.height * 0.63` respectively.
- Wave enemies spawn at `canvas.width * 0.9`, y staggered by wave count with 15% canvas padding, facing left.
- All positions are relative to canvas dimensions — never hardcoded pixel values.
- `ship.dir` is a normalized `{x, y}` vector updated on movement. Projectiles and skill effects use this vector for direction.

### Turret system

Each non-carrier ship has a `turrets` array of `{ roundsLeft, maxRounds, timer, cooldownMs }` objects, initialized from `shipConfig.turretSpec`. Firing logic lives in `main.js`:

- On keypress, all loaded turrets fire simultaneously. Each shot is pushed into a burst queue with an 80 ms stagger.
- When a turret fires its first round, its reload timer starts immediately (not only when empty).
- On expiry the timer restores 1 round and restarts until the turret is full.
- Bullet spawn positions are offset perpendicular to `ship.dir`, spread evenly across `ship.height * 0.8` — one lane per turret.

### Burst queue

`playerBurstQueue`, `enemyBurstQueue`, and `allyBurstQueue` in `main.js` hold pending shots with `{ delay, dirX, dirY, perpOffset, fwdOffset, sourceShip? }`. Each frame `tickBurstQueues(dt)` decrements delays and spawns projectiles when they reach zero.

The enemy burst queue entries fired by wave ships carry a `sourceShip` reference. `tickBurstQueues` reads `shot.sourceShip ?? enemyMod.enemy` as the position origin, and skips the shot if `source.health <= 0` (prevents dead wave enemies from firing queued shots).

The queues are cleared on `initGame()`. Enemy burst queue is also cleared when `spawnNextWave()` runs.

### AI system

`ai.js` exports `createAiState()` and `updateAi(aiShip, targets, aiState, dt)`.

`updateAi` returns `{ moveX, moveY, aimX, aimY, fire, useSkill, toggleMode }`. The caller sets `ship.dir` from `aimX/aimY` after calling movement, so firing always aims at the target regardless of movement direction.

Tactics cycle through: **approach → strafe → retreat** based on distance to ideal range. A **dodge** override (800 ms) triggers when an incoming torpedo is detected within 300 px. Each wave enemy carries its own `ship.aiState` object set at creation time.

In co-op mode, `useSkill` / `toggleMode` decisions from `updateAi` are intentionally ignored for wave enemies — they fire turrets only.

### Co-op wave mode

- `state.coopWave` is 1-based; starts at 0 and is incremented by `spawnNextWave()`.
- `state.coopTotalWaves` is currently 5. Wave N spawns N enemy ships.
- `state.waveTransitionTimer` is a countdown in ms. While > 0 a "GET READY!" overlay is shown and AI is paused.
- Wave clear is detected by polling `waveEnemies.every(e => e.health <= 0)` each frame. On clear, if more waves remain the timer is set to `WAVE_TRANSITION_MS (2000)`. If last wave, `state.gameState = "win"`.
- Win detection for co-op lives entirely in `main.js update()` — `collision.js` does not set win in co-op.

### Player firing vs. skill firing

Basic attack (Space / Enter) is handled entirely in `main.js` — it manipulates turret state and pushes to the burst queue. Skills (E / P) go through `skills.js → triggerSkill()` / `triggerAllySkill()`, which use `ship.skillTimer`. The two cooldowns are independent fields on the ship object.

### Projectile pools

- `playerProjectiles` — spawned by P1 and the co-op ally; checked against the enemy (PvP/PvC) or each wave enemy (co-op).
- `enemyProjectiles` — spawned by the CPU enemy (PvC) or wave enemies (co-op); checked against player and ally.

Ally shots go into `playerProjectiles` (same pool as P1) so collision already handles them against enemy targets.

### Ship-level state

Every ship object carries all its own state. No ship state lives in `state.js`. Key fields:

| Field | Purpose |
|---|---|
| `turrets` | Array of turret reload state (non-carrier only) |
| `skillTimer` / `skillCooldown` | Skill readiness |
| `fireCooldown` / `fireRate` | Carrier auto-fire rate limiter |
| `acMode` | `"torpedoPlanes"` or `"diveBombers"` (carrier only) |
| `torpedoMode` | `"wide"` or `"close"` (destroyer only) |
| `dir` | Normalized facing vector, updated on movement |
| `aiState` | Per-ship AI state object (wave enemies only) |

### Skills overview

| Ship | Skill (E/P) | Toggle (Q/O) |
|---|---|---|
| Destroyer | 4 torpedoes in a fan | Switch torpedo spread: wide / close |
| Cruiser | Overdrive — speed + fire rate boost | — |
| Battleship | 9-bullet barrage (3 volleys × 3 turrets), then full reload | — |
| Carrier | Launch 2 scout planes | Switch plane type: torpedo / dive bomber |

Enemy/wave ships have the same skill infrastructure but skills are not triggered in AI-controlled ships during co-op wave mode.

### Planes flow

`skills.js` pushes plane specs into `planePending` / `enemyPlanePending` (exported arrays from `planes.js`). Each frame, `updatePlanes()` / `updateEnemyPlanes()` drains the queue into `activePlanes` / `activeEnemyPlanes`, advances the flight state machine, and spawns projectiles at the drop point. This decouples skill trigger timing from flight logic.

Plane state machine: **outbound scanning → detection (within 150 px radius) → committed dive or torpedo drop → returning to carrier**. Predictive aiming: at commit/drop time the target position is offset by `target.dir * target.speed * LEAD_FRAMES`.

Carrier planes launched by P1 or ally in co-op target the nearest live wave enemy via a fallback: `enemyMod.enemy ?? waveEnemies.find(e => e.health > 0)`.

### AI health and damage multipliers

Wave enemies and the CPU enemy in PvC have health and damage reduced by multipliers defined at the top of `ai.js` (`AI_HEALTH_MULT`, `AI_DAMAGE_MULT`) and exported to `enemy.js`, where they are applied at ship creation time. Edit those two constants in `ai.js` to tune AI difficulty.

### Adding a new ship class

1. Add an entry to `shipConfig.js` with all required fields (`health`, `speed`, `damage`, `fireRate`, `skillCooldown`, `skillType`, `color`, `turretSpec`).
2. Add a `case` to the `switch` in `triggerSkill()`, `triggerEnemySkill()`, and `triggerAllySkill()` in `skills.js`.
3. The selection screen in `screens.js` iterates `Object.keys(shipConfig)` automatically — no changes needed there.
4. If the ship should be available in co-op wave mode, add its key to `WAVE_ENEMY_POOL` in `main.js` (carriers are excluded by default).

### Tailwind usage

Tailwind only styles the `<body>` tag (`m-0 p-0 overflow-hidden bg-black`). All gameplay visuals are drawn on the canvas with the Canvas 2D API — Tailwind has no role inside the game itself.
