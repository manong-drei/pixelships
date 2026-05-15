# Warship Clash - Project Planning Document

---

## 1. Project Overview

A 1v1 browser-based WW2 naval battle game built with HTML, CSS, and JavaScript using the Canvas API. The player selects their ship class and the opponent's ship class, then battles in a fullscreen ocean arena. The enemy is stationary AI for the current version.

---

## 2. Technology Stack

- HTML5 + Canvas API
- TailwindCSS 4 (via `@tailwindcss/cli`, `input.css` → `output.css`)
- Vanilla JavaScript (ES Modules)
- No frameworks, no bundlers beyond Tailwind CLI

---

## 3. Canvas Configuration

- Fullscreen dynamic canvas using `window.innerWidth` and `window.innerHeight`
- Resize listener to update canvas dimensions
- All positions must be relative to `canvas.width` and `canvas.height`, never hardcoded

---

## 4. Folder Structure

```txt
warship-clash/
│
├── index.html
├── style.css
├── PLANNING.md
│
├── js/
│   ├── main.js              # Entry point, game loop
│   ├── canvas.js            # Canvas setup, resize handling
│   ├── state.js             # Game state management
│   ├── shipConfig.js        # All ship class stats and definitions
│   ├── player.js            # Player object, movement, input
│   ├── enemy.js             # Enemy object, AI behavior
│   ├── projectiles.js       # All projectile types and movement
│   ├── skills.js            # All skill logic per ship class
│   ├── collision.js         # All collision detection
│   ├── ui.js                # HUD, health, score display
│   └── screens.js           # Start, selection, win, game over screens
│
└── assets/
    ├── background/
    ├── ships/
    │   ├── destroyer/
    │   ├── cruiser/
    │   ├── battleship/
    │   └── carrier/
    ├── projectiles/
    └── effects/
```

---

## 5. Game States

```js
let gameState = "start"; 
```

| State | Description |
|---|---|
| start | Title/start screen |
| selection | Ship class selection screen |
| playing | Active gameplay |
| win | Player destroyed enemy |
| gameOver | Player health reached zero |

---

## 6. Ship Class Configuration

All ship classes are defined in `shipConfig.js` and referenced by every other module.

| Ship Class | Health | Speed | Basic Attack | Fire Rate | Skill | Skill Cooldown |
|---|---|---|---|---|---|---|
| Destroyer | 4 | 6 | Turret shot (medium damage) | Fast | Torpedo (straight line, high damage) | Medium |
| Cruiser | 6 | 4 | Turret shot (medium damage) | Medium | Broadside (3-shot spread cone) | Medium |
| Battleship | 10 | 2 | Turret shot (high damage) | Slow | Cannon Barrage (sequential spread) | Long |
| Aircraft Carrier | 14 | 1 | AA guns (low damage, short range) | Very Fast | Toggle: Torpedo Planes / Dive Bombers | Long |

### Skill Details

| Skill | Behavior |
|---|---|
| Torpedo | Single projectile, travels in a straight line, high damage, medium cooldown |
| Broadside | Fires 3 shots simultaneously in a spread cone, medium cooldown |
| Cannon Barrage | Fires multiple shots sequentially in a spread, long cooldown |
| Torpedo Planes | Planes fly horizontally across screen, drop torpedoes at enemy X position |
| Dive Bombers | Planes dive diagonally toward enemy last known position, AOE on impact |

---

## 7. Controls

| Key | Action |
|---|---|
| W / Arrow Up | Move Up |
| S / Arrow Down | Move Down |
| A / Arrow Left | Move Left |
| D / Arrow Right | Move Right |
| Spacebar | Basic Attack |
| E | Skill (changes based on ship class) |
| Q | Aircraft Carrier mode toggle (Torpedo Planes / Dive Bombers) |

---

## 8. Game Mode Rules

- 1v1: Player vs single enemy
- Player selects their own ship class AND the enemy ship class on the selection screen
- Enemy is stationary (does not move) in this version
- Enemy AI fires basic attacks toward the player automatically on a timer
- Enemy AI does not use skills in this version
- Player has access to basic attack and skill

---

## 9. Win and Lose Conditions

**Win:** Enemy health reaches zero

**Lose:** Player health reaches zero

---

## 10. UI Elements (HUD)

Displayed during gameplay:

- Player health bar
- Enemy health bar
- Player ship class label
- Enemy ship class label
- Skill cooldown indicator
- AC mode indicator (only when player is Aircraft Carrier)
- Score (optional for 1v1)

---

## 11. Development Phases

> Each phase has a clear objective and expected output.
> Do not proceed to the next phase until the current one works correctly.
> Claude Code should assist phase by phase, not generate the entire codebase at once.

---

### Phase 1: Project Setup

**Objective:** Create all files, connect them, confirm the module system works.

**Tasks:**
- Create `index.html` with a `<canvas>` element
- Create `style.css` with margin/padding reset and canvas display block
- Create all JS files inside `js/` as empty modules
- Connect `main.js` to `index.html` using `type="module"`
- Confirm no console errors on load

**Expected Output:** Blank page loads with no errors in the browser console.

---

### Phase 2: Canvas Setup

**Objective:** Make the canvas fill the full screen and handle resizing.

**Tasks:**
- Write `canvas.js` to select the canvas and get the 2D context
- Set `canvas.width = window.innerWidth` and `canvas.height = window.innerHeight`
- Add `window.addEventListener('resize', ...)` to update canvas size
- Export canvas and context for use in other modules
- Import and initialize in `main.js`

**Expected Output:** Canvas fills the entire browser window. Resizing the window updates the canvas.

---

### Phase 3: Game State and Game Loop

**Objective:** Set up the central game state and the main game loop.

**Tasks:**
- Write `state.js` to export and manage `gameState`
- Write the `update()` function in `main.js`
- Write the `draw()` function in `main.js`
- Write `gameLoop()` using `requestAnimationFrame`
- Draw a solid blue rectangle as a placeholder ocean background

**Expected Output:** Game loop runs continuously. Blue background fills the canvas.

---

### Phase 4: Ship Class Configuration

**Objective:** Define all ship class data in one place so every module can reference it.

**Tasks:**
- Write `shipConfig.js` with all four ship class objects
- Each class contains: health, speed, fireRate, fireCooldown, damage, skillCooldown, skillType
- Export the config as a single object or named exports
- No drawing yet, just data

**Expected Output:** `shipConfig.js` exports clean ship class data. Confirm values in console.

---

### Phase 5: Start Screen and Ship Selection Screen

**Objective:** Build the screens before gameplay begins.

**Tasks:**
- Write `screens.js` to draw the start screen on the canvas
- Add a start button that changes `gameState` to `"selection"`
- Draw the ship selection screen with four ship class options for player and enemy
- Store the selected player class and enemy class
- Add a confirm button that changes `gameState` to `"playing"`

**Expected Output:** Player sees start screen, clicks start, selects both ship classes, and proceeds to a blank playing state.

---

### Phase 6: Draw Player Ship

**Objective:** Spawn and draw the player ship based on the selected class.

**Tasks:**
- Write `player.js` to create the player object using selected ship class stats from `shipConfig.js`
- Position player at bottom center of canvas (relative to canvas size)
- Draw a placeholder rectangle for now
- Export the player object

**Expected Output:** A rectangle representing the player ship appears at the bottom center of the screen after class selection.

---

### Phase 7: Player Movement

**Objective:** Allow the player to move the ship in four directions.

**Tasks:**
- Add `keydown` and `keyup` event listeners
- Store pressed keys in a `keys` object
- Move player based on pressed keys using the class speed stat
- Update player direction based on movement
- Prevent player from leaving canvas boundaries

**Expected Output:** Player rectangle moves smoothly around the canvas and cannot leave the screen.

---

### Phase 8: Draw Enemy Ship

**Objective:** Spawn and draw the enemy ship based on the selected class.

**Tasks:**
- Write `enemy.js` to create the enemy object using selected ship class stats
- Position enemy at top center of canvas (relative to canvas size)
- Draw a placeholder rectangle
- Export the enemy object

**Expected Output:** Enemy rectangle appears at the top center after selection.

---

### Phase 9: Player Basic Attack

**Objective:** Allow the player to fire basic attack projectiles.

**Tasks:**
- Write `projectiles.js` with a player cannonball array
- Create `shootPlayerProjectile()` function
- Fire on spacebar press with cooldown using the class fire rate stat
- Move projectiles based on player direction
- Remove projectiles that leave the canvas

**Expected Output:** Player fires projectiles in their facing direction with proper cooldown.

---

### Phase 10: Enemy Basic Attack

**Objective:** Make the enemy AI fire at the player automatically.

**Tasks:**
- Add enemy cannonball array in `projectiles.js`
- Enemy fires toward player position on a timer using the class fire rate stat
- Move enemy projectiles toward player
- Remove projectiles that leave the canvas

**Expected Output:** Enemy fires projectiles toward the player at regular intervals.

---

### Phase 11: Collision Detection

**Objective:** Make projectiles deal damage.

**Tasks:**
- Write `collision.js` with rectangle overlap checks
- Check player projectiles against enemy
- Check enemy projectiles against player
- Reduce health on hit
- Remove projectile after hit
- Trigger win or game over condition when health reaches zero

**Expected Output:** Both sides take damage. Game ends when one side reaches zero health.

---

### Phase 12: Win, Lose, and Restart

**Objective:** Handle end states and allow restart.

**Tasks:**
- Draw win screen when `gameState === "win"`
- Draw game over screen when `gameState === "gameOver"`
- Add restart button that resets all objects back to initial state
- Return to selection screen on restart

**Expected Output:** Game ends cleanly. Restart returns player to ship selection.

---

### Phase 13: Player Skills - Destroyer and Cruiser

**Objective:** Implement torpedo and broadside skills.

**Tasks:**
- Write `skills.js` with skill handler function
- Trigger skill on E key press with cooldown check
- Implement Torpedo: single fast straight projectile, high damage
- Implement Broadside: 3 projectiles fired in a spread cone simultaneously
- Add cooldown indicator to UI

**Expected Output:** Destroyer fires torpedo on E. Cruiser fires 3-shot broadside on E. Both have cooldowns.

---

### Phase 14: Player Skills - Battleship

**Objective:** Implement cannon barrage skill.

**Tasks:**
- Implement Cannon Barrage in `skills.js`
- Fire multiple projectiles sequentially with slight delay between each
- Spread across a wider angle than broadside
- Long cooldown

**Expected Output:** Battleship fires a sequential spread barrage on E with a long cooldown.

---

### Phase 15: Player Skills - Aircraft Carrier

**Objective:** Implement AC toggle and plane-based skills.

**Tasks:**
- Add AC mode state: `"torpedoPlanes"` or `"diveBombers"`
- Q key toggles between modes
- Implement Torpedo Planes: planes move horizontally, drop torpedo at enemy X position
- Implement Dive Bombers: planes dive diagonally toward enemy position, AOE on impact
- Show current AC mode on HUD

**Expected Output:** AC can toggle between two skill modes and launch each correctly on E.

---

### Phase 16: HUD and UI Polish

**Objective:** Display all necessary game information clearly.

**Tasks:**
- Write `ui.js` to draw HUD elements
- Player and enemy health bars
- Ship class labels
- Skill cooldown indicator
- AC mode indicator (carrier only)

**Expected Output:** Player can read all relevant game info during battle.

---

### Phase 17: Asset Integration

**Objective:** Replace all placeholder rectangles with actual sprites.

**Tasks:**
- Load ship sprites per class and per direction
- Load projectile sprites
- Load background image
- Draw images instead of rectangles
- Handle image loading before game starts

**Expected Output:** Game uses actual WW2 warship visuals.

---

### Phase 18: Polish and Effects

**Objective:** Improve game feel.

**Tasks:**
- Explosion effect on ship destruction
- Hit flash effect on damage
- Screen shake on heavy hits (Battleship, Barrage)
- Wave animation on background
- Sound effects: cannon fire, torpedo launch, explosion, plane engine
- Background music

**Expected Output:** Game feels responsive and polished.

---

### Phase 19: Final Testing

**Objective:** Verify all systems work correctly together.

**Checklist:**
```txt
[ ] All four ship classes selectable
[ ] Player and enemy spawn correctly per class
[ ] Player movement works and respects boundaries
[ ] Player direction updates correctly
[ ] Basic attack fires with correct cooldown per class
[ ] Enemy AI fires toward player correctly
[ ] Torpedo travels straight and deals high damage
[ ] Broadside fires 3-shot spread
[ ] Cannon Barrage fires sequential spread
[ ] AC AA guns fire correctly
[ ] Torpedo Planes behave correctly
[ ] Dive Bombers behave correctly
[ ] Q toggles AC mode correctly
[ ] E skill fires correct skill per class
[ ] Collision detection works for all projectile types
[ ] Health decreases correctly for both sides
[ ] Win condition triggers correctly
[ ] Game over triggers correctly
[ ] Restart resets all state correctly
[ ] No console errors
[ ] Canvas resizes correctly on window resize
```

---

## 12. Future Features (Not in Current Scope)

- Moving enemy AI
- Enemy AI uses skills
- Bullet type toggle: High Explosive vs Armor Piercing
- Armor rating system
- Multiple enemy ships
- Level or wave system
- Mobile touch controls
- High score system
- Ship upgrade system
