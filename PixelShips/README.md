    # Pixel Ships — WW2 Naval Battle

    A two-player WW2 naval combat game playable entirely in the browser. Both players share the same keyboard. Pick your warship, outmaneuver your opponent, and send them to the bottom.

    ---

    ## How to Play

    Open `src/index.html` with a local server (e.g. VS Code Live Server). Select a ship for each player on the selection screen, then click **BATTLE!**

    ---

    ## Controls

    | Action | Player 1 | Player 2 |
    |---|---|---|
    | Move | `W` `A` `S` `D` or Arrow keys | `Numpad 8` `4` `2` `6` |
    | Fire | `Space` | `Enter` / `Numpad Enter` |
    | Skill | `E` | `P` |
    | Toggle mode | `Q` | `O` |

    Ships face the direction they last moved. Projectiles travel in that direction.

    ---

    ## Ships

    ### Destroyer
    Fast and agile. Light armor, quick guns.

    - **Skill:** Fires 4 torpedoes in a forward fan.
    - **Toggle (Q/O):** Switch torpedo spread between **Wide** (−15° / −5° / +5° / +15°) and **Close** (−4° / −2° / +2° / +4°).
    - **Turrets:** 2 turrets, 2 rounds each, 500 ms reload per round.

    ### Cruiser
    Balanced all-rounder.

    - **Skill:** Broadside — 3 shots spread at −25°, 0°, +25°.
    - **Turrets:** 4 turrets, 2 rounds each, 3 s reload per round.

    ### Battleship
    Heavily armored. Slow but devastating.

    - **Skill:** Barrage — fires 12 rounds (3 volleys × 4 turrets) in rapid succession, then instantly reloads all turrets to full.
    - **Turrets:** 4 turrets, 3 rounds each, 6 s reload per round.

    ### Aircraft Carrier
    Highest health pool. Launches scout planes that hunt down and strike the enemy.

    - **Basic attack:** Auto-fires weak rounds at close range (≤ 300 px).
    - **Skill (E/P):** Launches 2 planes of the currently selected type per press. Press twice to send all 4. Cooldown starts only after all 4 planes of that type have been launched. Planes return to the carrier after attacking or reaching the map edge, replenishing stock on landing.
    - **Toggle (Q/O):** Switch between **Torpedo Planes** and **Dive Bombers**.
    - **Stock:** 4 torpedo planes + 4 dive bombers. Each type has its own independent cooldown.

    #### Plane behavior
    - Planes launch blind in the carrier's facing direction.
    - On detecting the enemy within **150 px**, they lock on and commit a **predictive strike** — aiming where the target will be, not where it is.
    - **Torpedo planes** drop their torpedo at **400 px** from the target.
    - **Dive bombers** fly to the predicted impact point, drop a stationary bomb with a **600 ms fuse**, then return. Any ship within **60 px** of the blast takes full damage.

    ---

    ## Turret System

    - One keypress fires all loaded turrets **simultaneously**, with an 80 ms stagger between each shot.
    - Bullets from different turrets spread across the ship's width — each turret fires from its own lane.
    - The reload timer starts on the **first shot fired** from a turret, not when it runs empty.
    - Rounds reload **one at a time** per timer cycle until the turret is full.
    - The HUD shows each turret's loaded rounds (colored dots) and reload progress (bar below the dots).

    ---

    ## Projectile Range

    Basic gunfire has a maximum effective range of roughly **40% of the screen width**. Past that, shots lose momentum and fall into the ocean. Players must close the distance to deal damage with guns.

    Torpedoes and carrier planes are not range-limited — they are the long-range options.

    ---

    ## HUD

    | Element | Location |
    |---|---|
    | Health bar | Top left (P1) / top right (P2) |
    | Skill cooldown | Below health bar |
    | Turret status | Dots + reload bar per turret |
    | Destroyer spread mode | `SPREAD [Q/O]: WIDE / CLOSE` |
    | Carrier plane stocks | `TORPEDO x/4` and `DIVE x/4` with individual cooldown bars |
    | Ship class name | Bottom left (P1) / bottom right (P2) |

    Skill and cooldown bars fill left-to-right. A bar is ready when it reaches full and changes color.
