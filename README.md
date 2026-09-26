# 🎯 CYBER STRIKE 2D - Tactical 2D Action Shooter

[![HTML5 Canvas](https://img.shields.io/badge/Engine-HTML5_Canvas-00f0ff?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Web Audio API](https://img.shields.io/badge/Audio-Web_Audio_API-00ff66?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-ff2a55?style=flat-square)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-ffb700?style=flat-square)](#)

**Cyber Strike 2D** is a lightweight, high-performance top-down 2D action arena shooter inspired by classic fast-paced action titles like *Hotline Miami*, *CS 2D*, and *Enter the Gungeon*. Built entirely with vanilla HTML5 Canvas, JavaScript ES6+, and Web Audio API synthesis with **zero external libraries or asset downloads**.

---

## 🚀 Quick Start (Play Immediately)

No installation or node setup required!

1. Open `index.html` directly in your browser:
   - **Chrome / Edge / Firefox / Brave**: Double-click `index.html` or drag & drop it into your web browser.
2. Alternatively, serve via any local web server:
   ```bash
   npx serve .
   # OR
   python -m http.server 8080
   ```

---

## 🔥 Key Features

### 1. 🔫 Arsenal & Weapons
- **P1-Tactical Pistol**: High precision sidearm with low recoil and fast mobility.
- **AR-15 Assault Rifle**: Balanced automatic fire rate, clip capacity, and medium range.
- **SG-12 Pump Shotgun**: 8-pellet spread dealing devastating close-range burst damage.
- **SMG-9 Spectrum**: Rapid-fire submachine gun designed for close skirmishes.
- **SR-50 Heavy Sniper Rifle**: High-caliber precision rifle featuring a target-tracking laser sight line and one-shot kill power.
- **Plasma Rocket Launcher**: Heavy ordinance firing explosive plasma rounds with radial splash damage.

### 2. 🤖 Bot AI & Difficulty Scaling
- **Finite State Machine (FSM)**: Autonomous bot decision tree handling patrolling, target acquisition, cover seeking, flanking, low-health retreat to health spawners, and reloading.
- **4 Bot Roles**:
  - 🏃 **Scout**: High mobility, aggressive flanking with SMG.
  - 🎖️ **Soldier**: Balanced cover-oriented assault rifle combatant.
  - 🛡️ **Heavy**: High HP tank wielding Shotguns/Rockets.
  - 🎯 **Sniper**: Long-distance marksman utilizing laser sight tracking.
- **4 Difficulty Levels**:
  - `Rookie` (Easy): Slower reaction (~450ms), wide aim spread, low speed.
  - `Veteran` (Medium): Balanced combat reaction (~220ms), cover-seeking.
  - `Elite` (Hard): Rapid reaction (~90ms), high accuracy, aggressive flanking.
  - `Nightmare`: Lethal pinpoint accuracy (~25ms reaction), aggressive rushes.

### 3. 🗺️ Maps & Dynamic Environments
- **Industrial Complex**: Narrow corridors, metal crates, explosive fuel barrels.
- **Cyber Neon Arena**: Symmetrical crossfire zones, reflective barriers, fast skirmishes.
- **Desert Outpost**: Sandbag bunkers, shipping containers, wide sniper sightlines.
- **Dynamic Interactive Objects**: Explosive fuel barrels explode when shot, dealing radial area-of-effect damage; health (+40 HP), armor (+50 Shield), and ammo spawners periodically respawn.

### 4. 🎨 Hand-Crafted Visual Juice & Aesthetics
- **Detailed Character Avatars**: Players and bots feature tactical helmets with glowing visors, body armor plates, and dual hands holding realistic weapon sprites.
- **Recoil Impulse Physics**: Character sprites physically kick back when firing heavy weapons.
- **Persistent Floor Decals**: Blood splatters, bullet impacts, and blast scorches stick permanently to map floor tiles throughout the match.
- **Floating Damage Text**: Numbers float up above damaged targets (`24`, `110 CRIT!`).
- **Dynamic Reticle Crosshair**: Custom canvas crosshair that opens up with recoil/movement spread and tightens when stationary, featuring a hitmarker `X` indicator.
- **Multi-Killstreak Announcer**: Animated popups (`DOUBLE KILL!`, `TRIPLE KILL!`, `RAMPAGE!`, `UNSTOPPABLE!`) with triumphant chord chimes.
- **Vision Cone Lighting**: Soft ambient darkness with a flashlight vision cone surrounding the player.

### 5. 🔊 Procedural Web Audio Synthesizer
- Generates procedural gunshots, reload mechanical clicks, shell casing drops, hitmarkers, kill cues, low health heartbeat pulses, and explosions using the browser's Web Audio API **without requiring external `.mp3` or `.wav` files**.

---

## 🎮 Game Controls

| Key | Action |
| --- | --- |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Move Character |
| <kbd>Mouse</kbd> | Aim Crosshair |
| <kbd>Left Click</kbd> | Shoot Weapon |
| <kbd>1</kbd> - <kbd>6</kbd> | Switch Weapon Hotbar Slot |
| <kbd>R</kbd> | Reload Weapon |
| <kbd>Shift</kbd> | Sprint |
| <kbd>Space</kbd> | Dodge Dash |
| <kbd>TAB</kbd> | Hold for Scoreboard Modal |
| <kbd>ESC</kbd> | Pause / Audio & Graphic Settings |

---

## 📁 Project File Structure

```
2d-action-shooter/
├── index.html        # Main HTML layout (Menus, HUD Overlay, Scoreboard, Modals)
├── styles.css        # Tactical dark cyberpunk styling, animations & UI layout
├── game.js          # Core engine loop, weapon physics, recoil, particles & HUD controller
├── map.js           # Map layouts, AABB wall collision, raycasting & persistent floor decals
├── ai.js            # Bot AI finite state machine, difficulty parameters & roles
├── audio.js         # Web Audio API sound synthesizer for procedural SFX
└── README.md        # Project documentation
```

---

## 🛠️ Customization & Hacking

You can easily tweak weapon stats or game parameters inside `game.js`:

```javascript
// Modify weapon stats in game.js
const WEAPONS = {
    ar: {
        damage: 24,       // Base damage per hit
        fireRate: 110,    // Delay in ms between shots
        clipSize: 30,     // Magazine capacity
        spread: 0.08,     // Bullet accuracy spread angle
        recoilForce: 6    // Visual kickback force
    }
    // ...
};
```

Adjust bot difficulty parameters inside `ai.js`:

```javascript
// Adjust difficulty profiles in ai.js
const configs = {
    nightmare: {
        aimSpread: 0.015,     // Pinpoint accuracy spread
        reactionMs: 25,       // Bot reaction latency in ms
        speedMult: 1.25       // Movement speed multiplier
    }
};
```

---

## 📜 License

Distributed under the MIT License. Feel free to use, modify, and distribute for personal or commercial projects.
