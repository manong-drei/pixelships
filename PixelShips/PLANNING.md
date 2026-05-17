# Pixel Ships — Project Planning Document

---

## 1. Project Overview

A browser-based WW2 naval battle game built with HTML5 Canvas API and vanilla JavaScript ES modules. Three game modes: player vs player, 1 player vs AI, and 2-player co-op vs AI waves.

---

## 2. Technology Stack

- HTML5 + Canvas API
- TailwindCSS 4 (via `@tailwindcss/cli`, `input.css` → `output.css`)
- Vanilla JavaScript (ES Modules)
- No frameworks, no bundlers beyond Tailwind CLI

---

## 3. Canvas Configuration

- Fullscreen dynamic canvas using `window.innerWidth` and `window.innerHeight`
- Resize listener updates canvas dimensions
- All positions are relative to `canvas.width` / `canvas.height` — never hardcoded

---

## 4. Folder Structure

```
PixelShips/src/
├── index.html
├── input.css / output.css       # Tailwind
└── js/
    ├── main.js                  # Game loop, firing logic, wave management
    ├── canvas.js                # Canvas setup, resize, mouse state
    ├── state.js                 # Global game state (gameState, mode, wave counters)
    ├── shipConfig.js            # All ship stats and definitions
    ├── player.js                # P1 ship object, keyboard, movement, drawing
    ├── enemy.js                 # P2/CPU ship, ally ship, wave enemies array
    ├── ai.js                    # AI brain: createAiState, updateAi
    ├── projectiles.js           # Both projectile arrays, movement, drawing
    ├── skills.js                # Skill dispatch, barrage queues, overdrive, planes trigger
    ├── planes.js                # Plane flight state machine, torpedo/bomb drop
    ├── collision.js             # AABB + blast radius collision, health writes
    ├── ui.js                    # HUD drawing (health bars, cooldowns, wave counter)
    ├── screens.js               # All menu screens + click hit-testing
    ├── effects.js               # Explosions and splash effects
    └── assets.js                # Ship sprite preloading and directional lookup
```

---

## 5. Game States

```js
state.gameState  // "start" | "modeSelect" | "selection" | "playing" | "win" | "gameOver"
state.mode       // "pvp" | "pvc" | "coop"
```

| State | Description |
|---|---|
| `start` | Title screen |
| `modeSelect` | Choose PvP / Co-op / 1P vs CPU |
| `selection` | Ship class selection (P1, then P2 or CPU) |
| `playing` | Active gameplay |
| `win` | All enemies defeated |
| `gameOver` | Player(s) eliminated |

---

## 6. Ship Classes

All defined in `shipConfig.js`. The selection screen auto-generates cards from `Object.keys(shipConfig)`.

| Ship | HP | DMG | Speed | Turrets | Skill |
|---|---|---|---|---|---|
| Destroyer | 64 | 2 | 1.3 | 2 × 2 rounds | 4-torpedo fan |
| Cruiser | 128 | 2 | 1.25 | 3 × 2 rounds | Overdrive (speed + fire boost) |
| Battleship | 512 | 4 | 1.0 | 3 × 3 rounds | 12-bullet barrage + full reload |
| Carrier | 254 | 1 | 0.7 | none | Launch 2 torpedo/dive planes |

AI-controlled ships (CPU enemy, wave enemies) have HP and damage reduced to **60%** of base values.

---

## 7. Controls

### Player 1
| Key | Action |
|---|---|
| W / A / S / D | Move |
| Space | Fire |
| E | Skill |
| Q | Toggle mode (carrier/destroyer) |

### Player 2 (PvP) / Co-op Ally
| Key | Action |
|---|---|
| Arrow keys / Numpad 8-4-2-6 | Move |
| Enter / Numpad 5 | Fire |
| P / Numpad 9 | Skill |
| O / Numpad 7 | Toggle mode |

---

## 8. Game Mode Rules

### PvP
- P1 spawns left, P2 spawns right.
- Both controlled by keyboard. First to 0 HP loses.

### 1P vs CPU
- P1 controlled by keyboard. CPU uses the AI brain.
- CPU health and damage at 60%. CPU uses all skills.

### Co-op Wave Mode
- Both P1 and P2 spawn on the left.
- Three waves of AI ships spawn from the right (1, 2, then 3 ships).
- Wave ships are drawn randomly from: Destroyer, Cruiser, Battleship.
- Wave ships fire turrets only — no skills used.
- Wave ship HP and damage at 60%.
- Clearing a wave starts a 2-second transition before the next wave spawns.
- Win = clear all 3 waves. Lose = both players at 0 HP.

---

## 9. AI Brain (`ai.js`)

`updateAi(aiShip, targets[], aiState, dt)` returns `{ moveX, moveY, aimX, aimY, fire, useSkill, toggleMode }`.

### Tactics
| Tactic | Trigger |
|---|---|
| Approach | Distance > ideal range |
| Strafe | Distance within ideal range |
| Retreat | Distance < min range |
| Dodge | Incoming torpedo within 300 px (overrides for 800 ms) |

Aim direction is returned separately from move direction so the caller can override `ship.dir` for correct firing.

---

## 10. Collision System (`collision.js`)

- Branches on `state.mode === "coop"` — calls `checkCoopCollisions(ally)` which checks `playerProjectiles` against each live wave enemy, and `enemyProjectiles` against player and ally.
- PvP/PvC path unchanged: `playerProjectiles` → enemy, `enemyProjectiles` → player.
- Win detection in co-op is **not** in collision.js — `main.js` polls wave clear each frame.

---

## 11. Burst Queue System

`playerBurstQueue`, `enemyBurstQueue`, `allyBurstQueue` each hold `{ delay, dirX, dirY, perpOffset, fwdOffset, sourceShip? }` entries. `tickBurstQueues(dt)` drains them each frame.

Wave enemy shots carry `sourceShip` pointing to the firing wave enemy. The drain reads `shot.sourceShip ?? enemyMod.enemy` and skips the shot if `source.health <= 0`.

---

## 12. Projectile Pools

- `playerProjectiles` — P1 and co-op ally; collides with enemy/wave enemies
- `enemyProjectiles` — CPU enemy and wave enemies; collides with player and ally

---

## 13. HUD Layout

### PvP / 1P vs CPU
- P1 bars top-left, P2/CPU bars top-right
- Turret dots + reload bars below health
- Ship labels bottom corners

### Co-op
- P1 bars top-left, P2 bars below P1 on left
- Wave counter top-center: `WAVE X / 3`
- Enemy health bars top-right (one per wave enemy)
- Ship labels bottom-left

---

## 14. Implemented Features

- [x] Title screen, mode select, ship selection, pause menu, end screens
- [x] Four ship classes with unique stats, turret systems, and skills
- [x] PvP mode — two human players
- [x] 1P vs CPU — full AI brain with 4 tactics and skill use
- [x] Co-op wave mode — 3 waves, 2-second transitions, wave counter HUD
- [x] Carrier planes (torpedo + dive bomber) with predictive targeting
- [x] Explosion and splash effects
- [x] Match stats on end screen (damage dealt, shots fired, time)
- [x] AI health/damage multipliers (60%)
- [x] Per-ship AI state for simultaneous wave enemies
- [x] Dead wave enemy shot cancellation (sourceShip guard)

---

## 15. Potential Future Features

- Ship sprites replacing colored rectangles
- Sound effects and background music
- Mobile touch controls
- Additional wave stages or difficulty scaling
- Armor / damage type system (AP vs HE)
- Ship upgrade or loadout system
- High score / leaderboard
