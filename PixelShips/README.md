# Pixel Ships — WW2 Naval Battle

A browser-based WW2 naval combat game with three game modes. Choose your warship, fight alone or with a friend, and send the enemy to the bottom.

---

## Game Modes

| Mode | Description |
|---|---|
| **1P vs CPU** | One human fights a single AI-controlled enemy ship. The player also picks which ship the CPU will use (or hits Randomize to let the game decide). |
| **Co-op** | Two humans share the left side of the map and fight through 3 waves of AI enemies |
| **PvP** | Two humans face off — P1 on the left, P2 on the right |

---

## How to Play

Open `src/index.html` with a local server (e.g. VS Code Live Server). Choose a mode, select your ship (co-op selects two ships), then battle.

### Ship selection

- Click a ship card to select it. A **Lock In** button appears on the card itself.
- Click **Lock In** to confirm. In PvP the final player's button reads **Battle!** and starts the match.
- In **1P vs CPU** mode, after P1 locks in, a second selection screen appears so the player can choose the CPU's ship. Hit **Randomize** to skip straight to battle with a random CPU ship.
- A **Back** button in the upper-left corner returns to the previous screen at any point.

---

## Controls

### Player 1 (all modes)

| Action | Keys |
|---|---|
| Move | `W` `A` `S` `D` |
| Fire | `Space` |
| Skill | `E` |
| Toggle mode | `Q` |

### Player 2 — PvP

| Action | Keys |
|---|---|
| Move | Arrow keys or `Numpad 8` `4` `2` `6` |
| Fire | `Enter` / `Numpad 5` |
| Skill | `P` / `Numpad 9` |
| Toggle mode | `O` / `Numpad 7` |

### Player 2 — Co-op (ally)

Same keys as PvP Player 2. Both players spawn on the **left** side of the map and fight incoming waves from the right.

Ships face the direction they last moved. Projectiles travel in that direction.

---

## Ships

### Destroyer
Fast and agile. Light armor, quick guns.

- **Skill:** Fires 4 torpedoes in a forward fan.
- **Toggle (Q/O):** Switch torpedo spread between **Wide** and **Close**.
- **Turrets:** 2 turrets, 2 rounds each, 500 ms reload per round.

### Cruiser
Balanced all-rounder.

- **Skill:** Overdrive — temporarily boosts speed and fire rate.
- **Turrets:** 3 turrets, 2 rounds each, 3 s reload per round.

### Battleship
Heavily armored. Slow but devastating.

- **Skill:** Barrage — fires 12 rounds (3 volleys × 4 turrets) in rapid succession, then instantly reloads all turrets.
- **Turrets:** 3 turrets, 3 rounds each, 6 s reload per round.

### Aircraft Carrier
Highest health pool. Launches planes that hunt and strike the enemy.

- **Basic attack:** Auto-fires weak rounds at close range (≤ 500 px).
- **Skill (E/P):** Launches 2 planes per press (up to 4 total). Cooldown starts after all planes of that type are launched. Planes return and replenish stock on landing.
- **Toggle (Q/O):** Switch between **Torpedo Planes** and **Dive Bombers**.
- **Stock:** 4 torpedo planes + 4 dive bombers. Each type has its own cooldown.

#### Plane behavior
- Planes launch in the carrier's facing direction and scan for targets within **150 px**.
- On detection they commit a **predictive strike** — aiming where the target will be.
- **Torpedo planes** drop their torpedo at **400 px** from the target.
- **Dive bombers** fly to the predicted point, drop a stationary bomb with a **600 ms fuse**. Any ship within **60 px** takes full damage.

---

## Turret System

- One keypress fires all loaded turrets simultaneously with an 80 ms stagger between shots.
- Bullets from different turrets spread across the ship's width — each turret fires from its own lane.
- Reload timer starts on the **first shot fired**, not when the turret runs empty.
- Rounds reload one at a time per timer cycle until full.
- HUD shows each turret's loaded rounds (colored dots) and reload progress (bar below dots).

---

## Projectile Range

Basic gunfire has a maximum effective range of roughly **40% of screen width**. Past that, shots fall into the ocean. Close the distance to deal damage with guns.

Torpedoes and carrier planes are not range-limited — they are the long-range options.

---

## Co-op Wave Mode

- Both players spawn on the **left** side.
- **Wave 1:** 1 enemy ship. **Wave 2:** 2 ships. **Wave 3:** 3 ships. **Wave 4:** 4 ships. **Wave 5:** 5 ships.
- Enemy ships are randomly drawn from: Destroyer, Cruiser, Battleship. No carriers.
- AI enemies fire turrets only — no skills.
- AI enemy health and damage are scaled by `AI_HEALTH_MULT` / `AI_DAMAGE_MULT` in `src/js/ai.js`.
- Clearing a wave shows a 2-second "GET READY!" overlay before the next wave spawns.
- **Win:** Clear all 5 waves. **Lose:** Both players reach 0 HP.

---

## HUD

### PvP / 1P vs CPU

| Element | Location |
|---|---|
| Health bar | Top left (P1) / top right (P2 or CPU) |
| Skill cooldown | Below health bar |
| Turret status | Dots + reload bar per turret |
| Destroyer spread mode | `SPREAD [Q/O]: WIDE / CLOSE` |
| Carrier plane stocks | Torpedo + Dive bars with independent cooldowns |
| Ship class name | Bottom left (P1) / bottom right (P2) |

### Co-op

| Element | Location |
|---|---|
| P1 health + cooldowns | Top left |
| P2 health + cooldowns | Left side, below P1 |
| Wave counter | Top center (`WAVE X / 3`) |
| Enemy health bars | Top right (one bar per wave enemy) |
| Ship class names | Bottom left |
