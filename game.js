/* CYBER STRIKE 2D - MAIN GAME ENGINE (JUICE & POLISH OVERHAUL) */

// WEAPONS ARSENAL DEFINITIONS
const WEAPONS = {
    pistol: {
        id: 'pistol',
        name: 'P1-TACTICAL',
        damage: 28,
        fireRate: 220,      // ms between shots
        clipSize: 12,
        reserveAmmo: 96,
        reloadTime: 1200,   // ms
        spread: 0.04,
        bulletsPerShot: 1,
        speed: 1600,        // px/s
        color: '#60a5fa',
        sound: 'playPistol',
        shake: 2,
        laser: false,
        recoilForce: 4
    },
    ar: {
        id: 'ar',
        name: 'AR-15 ASSAULT',
        damage: 24,
        fireRate: 110,
        clipSize: 30,
        reserveAmmo: 180,
        reloadTime: 1800,
        spread: 0.08,
        bulletsPerShot: 1,
        speed: 1800,
        color: '#facc15',
        sound: 'playRifle',
        shake: 3.5,
        laser: false,
        recoilForce: 6
    },
    shotgun: {
        id: 'shotgun',
        name: 'SG-12 SHOTGUN',
        damage: 18,        // 18 per pellet * 8 pellets = 144 max point blank
        fireRate: 850,
        clipSize: 8,
        reserveAmmo: 48,
        reloadTime: 2400,
        spread: 0.22,
        bulletsPerShot: 8,
        speed: 1500,
        color: '#f97316',
        sound: 'playShotgun',
        shake: 9,
        laser: false,
        recoilForce: 14
    },
    smg: {
        id: 'smg',
        name: 'SMG-9 SPECTRUM',
        damage: 16,
        fireRate: 75,
        clipSize: 35,
        reserveAmmo: 210,
        reloadTime: 1400,
        spread: 0.14,
        bulletsPerShot: 1,
        speed: 1700,
        color: '#a855f7',
        sound: 'playSmg',
        shake: 2.5,
        laser: false,
        recoilForce: 3
    },
    sniper: {
        id: 'sniper',
        name: 'SR-50 HEAVY SNIPER',
        damage: 110,        // One-shot kill body hit
        fireRate: 1300,
        clipSize: 5,
        reserveAmmo: 25,
        reloadTime: 2800,
        spread: 0.005,
        bulletsPerShot: 1,
        speed: 2400,
        color: '#ef4444',
        sound: 'playSniper',
        shake: 14,
        laser: true,
        recoilForce: 18
    },
    rocket: {
        id: 'rocket',
        name: 'PLASMA ROCKET',
        damage: 150,
        fireRate: 1500,
        clipSize: 3,
        reserveAmmo: 12,
        reloadTime: 3000,
        spread: 0.02,
        bulletsPerShot: 1,
        speed: 1000,
        color: '#00f0ff',
        sound: 'playRocket',
        shake: 18,
        isRocket: true,
        splashRadius: 160,
        recoilForce: 20
    }
};

// ENTITY CLASS (PLAYER & BOTS WITH DETAILED HAND-CRAFTED AVATARS)
class Entity {
    constructor(id, name, team, x, y, isPlayer = false) {
        this.id = id;
        this.name = name;
        this.team = team; // 'blue' or 'red'
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.angle = 0;
        this.isPlayer = isPlayer;

        this.maxHealth = 100;
        this.health = 100;
        this.maxArmor = 50;
        this.armor = 50;
        this.alive = true;
        this.respawnTimer = 0;

        this.baseSpeed = 250;
        this.vx = 0;
        this.vy = 0;
        this.recoilKick = 0;

        // Stamina & Dash
        this.stamina = 100;
        this.maxStamina = 100;
        this.isSprinting = false;
        this.dashCooldown = 0;
        this.dashTimer = 0;

        // Footstep animation timer
        this.stepTimer = 0;

        // Stats & Multi-Killstreak Tracker
        this.kills = 0;
        this.deaths = 0;
        this.score = 0;
        this.totalShots = 0;
        this.totalHits = 0;
        this.totalDamage = 0;
        this.recentKills = 0;
        this.lastKillTime = 0;

        // Inventory
        this.weapon = { ...WEAPONS.ar, ammoInClip: WEAPONS.ar.clipSize, reserveAmmo: WEAPONS.ar.reserveAmmo };
        this.inventory = ['pistol', 'ar', 'shotgun', 'smg', 'sniper', 'rocket'];
        this.lastShotTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;

        this.ai = null;
    }

    equipWeapon(weaponId) {
        if (!WEAPONS[weaponId]) return;
        const wDef = WEAPONS[weaponId];
        this.weapon = {
            ...wDef,
            ammoInClip: wDef.clipSize,
            reserveAmmo: wDef.reserveAmmo
        };
        this.isReloading = false;
    }

    move(dx, dy, dt) {
        if (!this.alive) return;

        let speed = this.baseSpeed;
        if (this.isSprinting && this.stamina > 0) {
            speed *= 1.4;
            this.stamina = Math.max(0, this.stamina - dt * 0.035);
        } else if (!this.isSprinting && this.stamina < this.maxStamina) {
            this.stamina = Math.min(this.maxStamina, this.stamina + dt * 0.02);
        }

        if (this.dashTimer > 0) {
            speed *= 2.2;
            this.dashTimer -= dt;
        }

        const len = Math.hypot(dx, dy);
        if (len > 0) {
            this.vx = (dx / len) * speed;
            this.vy = (dy / len) * speed;

            // Footstep dust timer
            this.stepTimer += dt;
            if (this.stepTimer > 180) {
                this.stepTimer = 0;
                if (window.gameInstance) {
                    window.gameInstance.particles.spawnDust(this.x, this.y);
                }
            }
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        // Apply recoil pushback decay
        if (this.recoilKick > 0) {
            this.recoilKick = Math.max(0, this.recoilKick - dt * 0.05);
        }

        // Integrate Position
        this.x += this.vx * (dt / 1000);
        this.y += this.vy * (dt / 1000);

        if (this.dashCooldown > 0) this.dashCooldown -= dt;
    }

    dash() {
        if (this.dashCooldown <= 0 && this.stamina >= 30) {
            this.dashTimer = 200;
            this.dashCooldown = 1500;
            this.stamina -= 30;
            soundManager.playPickup();
        }
    }

    reload() {
        if (this.isReloading) return;
        if (this.weapon.ammoInClip >= this.weapon.clipSize) return;
        if (this.weapon.reserveAmmo <= 0) return;

        this.isReloading = true;
        this.reloadStartTime = Date.now();
        if (this.isPlayer) soundManager.playReload();
    }

    updateReload() {
        if (!this.isReloading) return;

        const elapsed = Date.now() - this.reloadStartTime;
        if (elapsed >= this.weapon.reloadTime) {
            const needed = this.weapon.clipSize - this.weapon.ammoInClip;
            const transfer = Math.min(needed, this.weapon.reserveAmmo);
            this.weapon.ammoInClip += transfer;
            this.weapon.reserveAmmo -= transfer;
            this.isReloading = false;
        }
    }

    shoot(gameState) {
        if (!this.alive || this.isReloading) return false;

        const now = Date.now();
        if (now - this.lastShotTime < this.weapon.fireRate) return false;

        if (this.weapon.ammoInClip <= 0) {
            if (this.isPlayer) soundManager.playEmptyClick();
            this.reload();
            return false;
        }

        this.weapon.ammoInClip--;
        this.lastShotTime = now;
        this.totalShots++;
        this.recoilKick = this.weapon.recoilForce || 5;

        // Trigger Audio & Screen Shake
        if (this.isPlayer) {
            if (soundManager[this.weapon.sound]) soundManager[this.weapon.sound]();
            gameState.addCameraShake(this.weapon.shake);
        }

        // Spawn Muzzle Flash
        const gunLength = 32;
        const barrelX = this.x + Math.cos(this.angle) * gunLength;
        const barrelY = this.y + Math.sin(this.angle) * gunLength;

        gameState.particles.spawnMuzzleFlash(barrelX, barrelY, this.angle, this.weapon.color);
        gameState.particles.spawnCasing(barrelX, barrelY, this.angle);

        // Spawn Projectiles
        for (let i = 0; i < this.weapon.bulletsPerShot; i++) {
            const spreadAngle = (Math.random() - 0.5) * this.weapon.spread * 2;
            const projAngle = this.angle + spreadAngle;

            gameState.projectiles.push({
                owner: this,
                x: barrelX,
                y: barrelY,
                vx: Math.cos(projAngle) * this.weapon.speed,
                vy: Math.sin(projAngle) * this.weapon.speed,
                damage: this.weapon.damage,
                color: this.weapon.color,
                life: 1.5,
                isRocket: !!this.weapon.isRocket,
                splashRadius: this.weapon.splashRadius || 0
            });
        }

        return true;
    }

    takeDamage(amount, attacker, gameState) {
        if (!this.alive) return;

        let hpDamage = amount;
        if (this.armor > 0) {
            const armorAbsorb = Math.min(this.armor, amount * 0.5);
            this.armor -= armorAbsorb;
            hpDamage -= armorAbsorb;
        }

        this.health -= hpDamage;

        // Spawn Blood Splatter & Floor Decal Stain
        const bloodColor = this.team === 'blue' ? '#00f0ff' : '#ef4444';
        gameState.particles.spawnBloodSplatter(this.x, this.y, bloodColor);
        gameState.map.addFloorDecal(this.x, this.y, 'blood', bloodColor);

        // Floating Damage Number
        const isCrit = amount >= 100;
        gameState.spawnFloatingDamage(this.x, this.y, Math.round(amount), isCrit);

        if (attacker && attacker.isPlayer) {
            soundManager.playHitmark();
            attacker.totalHits++;
            attacker.totalDamage += amount;
            gameState.hitmarkerTime = 150; // Hitmarker X display timer
        }

        if (this.isPlayer) {
            gameState.triggerDamageVignette();
        }

        if (this.health <= 0) {
            this.die(attacker, gameState);
        }
    }

    die(attacker, gameState) {
        this.alive = false;
        this.health = 0;
        this.deaths++;
        this.respawnTimer = 3500;

        if (attacker) {
            attacker.kills++;
            attacker.score += 100;

            // Track Multi-Kill Streak (within 3s window)
            const now = Date.now();
            if (now - attacker.lastKillTime < 3000) {
                attacker.recentKills++;
            } else {
                attacker.recentKills = 1;
            }
            attacker.lastKillTime = now;

            if (attacker.isPlayer) {
                soundManager.playKill();

                // Multi-kill Announcement
                if (attacker.recentKills === 2) gameState.triggerStreakBanner('DOUBLE KILL!');
                if (attacker.recentKills === 3) gameState.triggerStreakBanner('TRIPLE KILL!');
                if (attacker.recentKills === 4) gameState.triggerStreakBanner('RAMPAGE!');
                if (attacker.recentKills >= 5) gameState.triggerStreakBanner('UNSTOPPABLE!');
            }

            gameState.addKillfeedEntry(attacker, this, attacker.weapon.name);
        }

        // Explosion Debris & Scorch Decal on floor
        gameState.particles.spawnExplosion(this.x, this.y, 15, '#ff2a55');
        gameState.map.addFloorDecal(this.x, this.y, 'scorch');
    }

    respawn(spawnPos) {
        this.x = spawnPos.x;
        this.y = spawnPos.y;
        this.health = this.maxHealth;
        this.armor = this.maxArmor;
        this.stamina = this.maxStamina;
        this.alive = true;
        this.isReloading = false;
        this.weapon.ammoInClip = this.weapon.clipSize;
        this.weapon.reserveAmmo = this.weapon.reserveAmmo;
    }

    // HAND-CRAFTED CHARACTER SPRITE DRAWING (AVATAR WITH HANDS & DETAILED GUNS)
    draw(ctx, camera) {
        if (!this.alive) return;

        ctx.save();
        // Calculate recoil offset kickback position
        const renderX = this.x - Math.cos(this.angle) * this.recoilKick;
        const renderY = this.y - Math.sin(this.angle) * this.recoilKick;

        ctx.translate(renderX, renderY);
        ctx.rotate(this.angle);

        // 1. Character Soft Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(2, 4, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Main Body Suit & Tactical Armor Plate
        ctx.fillStyle = this.team === 'blue' ? '#0055cc' : '#cc0033';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Body Armor Vest Outlines
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-8, -12, 16, 24);

        // Armor Chest Accent
        ctx.fillStyle = this.team === 'blue' ? '#00f0ff' : '#ff4466';
        ctx.fillRect(-4, -8, 8, 16);

        // 3. Detailed Weapon Rendering & Dual Hands Holding Gun
        this.drawDetailedWeapon(ctx);

        // 4. Tactical Helmet & Visor
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        // Helmet Outline
        ctx.strokeStyle = this.isPlayer ? '#00f0ff' : '#ffffff';
        ctx.lineWidth = this.isPlayer ? 3 : 1.5;
        ctx.stroke();

        // Glowing Visor Line
        ctx.fillStyle = this.isPlayer ? '#00f0ff' : (this.team === 'blue' ? '#38bdf8' : '#f87171');
        ctx.fillRect(4, -5, 6, 10);

        ctx.restore();

        // 5. Laser Sight Line for Heavy Sniper
        if (this.weapon.laser && this.alive) {
            const endX = this.x + Math.cos(this.angle) * 900;
            const endY = this.y + Math.sin(this.angle) * 900;

            const wallHit = camera.map.raycastWall(this.x, this.y, endX, endY);
            const targetX = wallHit ? wallHit.x : endX;
            const targetY = wallHit ? wallHit.y : endY;

            ctx.strokeStyle = 'rgba(255, 42, 85, 0.65)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(targetX, targetY);
            ctx.stroke();
        }

        // Overhead Health Bar
        if (this.health < this.maxHealth) {
            const barW = 44;
            const barH = 5;
            const barX = this.x - barW / 2;
            const barY = this.y - 32;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX, barY, barW, barH);

            const hpPct = Math.max(0, this.health / this.maxHealth);
            ctx.fillStyle = this.team === 'blue' ? '#00f0ff' : '#ff2a55';
            ctx.fillRect(barX, barY, barW * hpPct, barH);
        }

        // Entity Name Tag
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, this.y - 38);
    }

    drawDetailedWeapon(ctx) {
        const wId = this.weapon.id;

        // Left Hand & Right Hand Colors
        const handColor = '#fbcfe8'; // Skin tone gloves

        if (wId === 'pistol') {
            // Pistol Gun Barrel & Slide
            ctx.fillStyle = '#334155';
            ctx.fillRect(8, -3, 16, 6);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(16, -2, 6, 4);

            // Hands holding pistol
            ctx.fillStyle = handColor;
            ctx.beginPath(); ctx.arc(10, -5, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(10, 5, 4, 0, Math.PI * 2); ctx.fill();
        } else if (wId === 'ar') {
            // Assault Rifle Barrel, Magazine, Stock
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(6, -4, 28, 8);
            ctx.fillStyle = '#facc15'; // Curved mag accent
            ctx.fillRect(14, 4, 6, 7);
            ctx.fillStyle = '#475569';
            ctx.fillRect(28, -2, 8, 4);

            // Dual Hands
            ctx.fillStyle = handColor;
            ctx.beginPath(); ctx.arc(8, -6, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(22, 5, 4, 0, Math.PI * 2); ctx.fill();
        } else if (wId === 'shotgun') {
            // Pump Shotgun Heavy Barrel & Grip
            ctx.fillStyle = '#334155';
            ctx.fillRect(6, -5, 26, 10);
            ctx.fillStyle = '#f97316'; // Pump grip
            ctx.fillRect(16, -6, 8, 12);

            // Dual Hands
            ctx.fillStyle = handColor;
            ctx.beginPath(); ctx.arc(8, -6, 4.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(20, 6, 4.5, 0, Math.PI * 2); ctx.fill();
        } else if (wId === 'smg') {
            // Compact SMG
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(6, -4, 20, 8);
            ctx.fillStyle = '#a855f7';
            ctx.fillRect(12, 4, 4, 8);

            ctx.fillStyle = handColor;
            ctx.beginPath(); ctx.arc(8, -5, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(16, 5, 4, 0, Math.PI * 2); ctx.fill();
        } else if (wId === 'sniper') {
            // Heavy Sniper Long Barrel & Dual Scope
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(6, -4, 38, 8);
            ctx.fillStyle = '#ef4444'; // Scope Rings
            ctx.fillRect(16, -7, 10, 3);

            ctx.fillStyle = handColor;
            ctx.beginPath(); ctx.arc(8, -6, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(26, 6, 4, 0, Math.PI * 2); ctx.fill();
        } else {
            // Rocket Launcher Tube
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(4, -7, 32, 14);
            ctx.fillStyle = '#00f0ff'; // Warhead Front Tip
            ctx.fillRect(30, -6, 8, 12);

            ctx.fillStyle = handColor;
            ctx.beginPath(); ctx.arc(10, -8, 5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(22, 8, 5, 0, Math.PI * 2); ctx.fill();
        }
    }
}

// PARTICLE ENGINE WITH FLOATING DAMAGE NUMBERS & DUST
class ParticleEngine {
    constructor() {
        this.particles = [];
    }

    spawnMuzzleFlash(x, y, angle, color) {
        this.particles.push({
            type: 'muzzle',
            x, y, angle, color,
            life: 0.05, maxLife: 0.05
        });
    }

    spawnCasing(x, y, angle) {
        const perp = angle + Math.PI / 2;
        this.particles.push({
            type: 'casing',
            x, y,
            vx: Math.cos(perp) * (80 + Math.random() * 40),
            vy: Math.sin(perp) * (80 + Math.random() * 40),
            rot: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 10,
            life: 0.4, maxLife: 0.4
        });
    }

    spawnBloodSplatter(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 120;
            this.particles.push({
                type: 'spark',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color,
                life: 0.3, maxLife: 0.3
            });
        }
    }

    spawnDust(x, y) {
        this.particles.push({
            type: 'dust',
            x, y,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            size: 3 + Math.random() * 5,
            color: 'rgba(255, 255, 255, 0.25)',
            life: 0.25, maxLife: 0.25
        });
    }

    spawnExplosion(x, y, radius, color = '#ef4444') {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 250;
            this.particles.push({
                type: 'smoke',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 6 + Math.random() * 14,
                color: i % 2 === 0 ? color : '#f97316',
                life: 0.6, maxLife: 0.6
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt / 1000;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            if (p.vx) p.x += p.vx * (dt / 1000);
            if (p.vy) p.y += p.vy * (dt / 1000);
            if (p.vRot) p.rot += p.vRot * (dt / 1000);
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            ctx.save();
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;

            if (p.type === 'muzzle') {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(10, 0, 16, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'casing') {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = '#eab308';
                ctx.fillRect(-2, -1, 5, 2);
            } else if (p.type === 'spark' || p.type === 'dust' || p.type === 'smoke') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }
}

// MAIN GAME CLASS
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');

        this.map = new GameMap('industrial');
        this.particles = new ParticleEngine();

        this.player = null;
        this.entities = [];
        this.projectiles = [];
        this.floatingDamages = [];

        // Game Settings
        this.mode = 'TDM';
        this.difficulty = 'medium';
        this.botCount = 6;
        this.targetScore = 30;
        this.matchTimeMs = 300000;

        this.camera = { x: 0, y: 0, shake: 0 };
        this.mousePos = { x: 0, y: 0, worldX: 0, worldY: 0 };
        this.keys = {};
        this.hitmarkerTime = 0;

        this.isRunning = false;
        this.isPaused = false;
        this.lastFrameTime = 0;

        this.blueScore = 0;
        this.redScore = 0;

        this.initEventListeners();
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            if (e.key === 'Tab') {
                e.preventDefault();
                document.getElementById('scoreboard-modal').classList.add('active');
                this.updateScoreboardUI();
            }

            if (e.key === 'Escape') {
                this.togglePause();
            }

            if (e.key === 'r' || e.key === 'R') {
                if (this.player) this.player.reload();
            }

            if (e.key === ' ') {
                if (this.player) this.player.dash();
            }

            if (['1','2','3','4','5','6'].includes(e.key)) {
                const slots = ['pistol', 'ar', 'shotgun', 'smg', 'sniper', 'rocket'];
                const weaponId = slots[parseInt(e.key) - 1];
                if (this.player && weaponId) {
                    this.player.equipWeapon(weaponId);
                    this.updateHotbarUI(parseInt(e.key));
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;

            if (e.key === 'Tab') {
                document.getElementById('scoreboard-modal').classList.remove('active');
            }
        });

        window.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.isRunning && !this.isPaused) {
                if (this.player) this.player.shoot(this);
            }
        });

        this.setupMenuUI();
    }

    setupMenuUI() {
        document.querySelectorAll('#mode-select .btn-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#mode-select .btn-toggle').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.mode = btn.dataset.value;
            });
        });

        document.querySelectorAll('#difficulty-select .btn-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#difficulty-select .btn-toggle').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.value;
            });
        });

        const botSlider = document.getElementById('bot-count');
        const botLabel = document.getElementById('bot-count-label');
        botSlider.addEventListener('input', () => {
            botLabel.textContent = botSlider.value;
            this.botCount = parseInt(botSlider.value);
        });

        document.querySelectorAll('#map-select .map-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('#map-select .map-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.map = new GameMap(card.dataset.map);
            });
        });

        document.querySelectorAll('#weapon-select .loadout-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('#weapon-select .loadout-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                this.selectedLoadout = opt.dataset.weapon;
            });
        });

        document.getElementById('btn-start').addEventListener('click', () => this.startMatch());

        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-restart').addEventListener('click', () => this.startMatch());
        document.getElementById('btn-quit').addEventListener('click', () => this.quitToMenu());

        document.getElementById('btn-rematch').addEventListener('click', () => this.startMatch());
        document.getElementById('btn-menu').addEventListener('click', () => this.quitToMenu());
    }

    startMatch() {
        document.getElementById('main-menu').classList.remove('active');
        document.getElementById('pause-modal').classList.remove('active');
        document.getElementById('gameover-modal').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');

        this.blueScore = 0;
        this.redScore = 0;
        this.matchTimeMs = 300000;
        this.projectiles = [];
        this.entities = [];
        this.floatingDamages = [];

        const playerSpawn = this.map.spawnsBlue[0] || { x: 300, y: 300 };
        this.player = new Entity('p1', 'YOU', 'blue', playerSpawn.x, playerSpawn.y, true);
        const startingGun = this.selectedLoadout || 'ar';
        this.player.equipWeapon(startingGun);
        this.entities.push(this.player);

        const roles = ['scout', 'soldier', 'heavy', 'sniper'];
        const totalBots = this.botCount;
        for (let i = 0; i < totalBots; i++) {
            const isBlue = this.mode === 'TDM' ? (i % 2 === 1) : false;
            const team = isBlue ? 'blue' : 'red';
            const spawnArr = team === 'blue' ? this.map.spawnsBlue : this.map.spawnsRed;
            const spawn = spawnArr[i % spawnArr.length] || { x: 1200, y: 1200 };

            const botRole = roles[i % roles.length];
            const botName = `BOT-${i + 1} [${botRole.toUpperCase()}]`;
            const bot = new Entity(`bot_${i}`, botName, team, spawn.x, spawn.y, false);

            bot.ai = new BotAI(bot, this.difficulty, botRole);
            this.entities.push(bot);
        }

        this.isRunning = true;
        this.isPaused = false;
        this.lastFrameTime = performance.now();

        document.getElementById('hud-mode-tag').textContent = `${this.mode} - ${this.difficulty.toUpperCase()}`;

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    togglePause() {
        if (!this.isRunning) return;
        this.isPaused = !this.isPaused;
        const pauseModal = document.getElementById('pause-modal');
        if (this.isPaused) {
            pauseModal.classList.add('active');
        } else {
            pauseModal.classList.remove('active');
            this.lastFrameTime = performance.now();
            requestAnimationFrame((ts) => this.gameLoop(ts));
        }
    }

    quitToMenu() {
        this.isRunning = false;
        this.isPaused = false;
        document.getElementById('pause-modal').classList.remove('active');
        document.getElementById('gameover-modal').classList.remove('active');
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('main-menu').classList.add('active');
    }

    addCameraShake(amount) {
        if (document.getElementById('toggle-shake').checked) {
            this.camera.shake = Math.min(25, this.camera.shake + amount);
        }
    }

    spawnFloatingDamage(x, y, amount, isCrit = false) {
        this.floatingDamages.push({
            x: x + (Math.random() - 0.5) * 15,
            y: y - 10,
            text: isCrit ? `${amount} CRIT!` : `${amount}`,
            color: isCrit ? '#facc15' : '#ffffff',
            size: isCrit ? 18 : 14,
            life: 0.75,
            maxLife: 0.75
        });
    }

    triggerStreakBanner(text) {
        soundManager.playKillstreak();
        const banner = document.getElementById('streak-banner');
        banner.textContent = text;
        banner.classList.add('show');
        setTimeout(() => {
            banner.classList.remove('show');
        }, 1800);
    }

    triggerDamageVignette() {
        const vig = document.getElementById('damage-vignette');
        vig.style.boxShadow = 'inset 0 0 100px rgba(255, 0, 0, 0.8)';
        setTimeout(() => {
            vig.style.boxShadow = 'inset 0 0 100px rgba(255, 0, 0, 0)';
        }, 200);
    }

    addKillfeedEntry(killer, victim, weaponName) {
        const killfeed = document.getElementById('killfeed');
        const entry = document.createElement('div');
        entry.className = 'kill-entry';

        const killerClass = killer.team === 'red' ? 'red' : 'blue';
        entry.innerHTML = `
            <span class="kill-killer ${killerClass}">${killer.name}</span>
            <span class="kill-weapon">[${weaponName}]</span>
            <span class="kill-victim">${victim.name}</span>
        `;

        killfeed.prepend(entry);
        setTimeout(() => {
            if (entry.parentNode) entry.parentNode.removeChild(entry);
        }, 5000);
    }

    // MAIN GAME LOOP
    gameLoop(timestamp) {
        if (!this.isRunning || this.isPaused) return;

        const dt = Math.min(50, timestamp - this.lastFrameTime);
        this.lastFrameTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    update(dt) {
        this.matchTimeMs -= dt;
        if (this.matchTimeMs <= 0) {
            this.endMatch();
            return;
        }

        if (this.camera.shake > 0) {
            this.camera.shake *= 0.9;
            if (this.camera.shake < 0.2) this.camera.shake = 0;
        }

        if (this.hitmarkerTime > 0) {
            this.hitmarkerTime -= dt;
        }

        this.mousePos.worldX = this.mousePos.x + this.camera.x;
        this.mousePos.worldY = this.mousePos.y + this.camera.y;

        // Player Controls
        if (this.player && this.player.alive) {
            let dx = 0, dy = 0;
            if (this.keys['w']) dy -= 1;
            if (this.keys['s']) dy += 1;
            if (this.keys['a']) dx -= 1;
            if (this.keys['d']) dx += 1;

            this.player.isSprinting = !!this.keys['shift'];
            this.player.move(dx, dy, dt);

            this.player.angle = Math.atan2(
                this.mousePos.worldY - this.player.y,
                this.mousePos.worldX - this.player.x
            );

            if (this.keys['mouse0']) {
                this.player.shoot(this);
            }

            this.player.updateReload();
        }

        // Camera Smooth Tracking with aim lead
        if (this.player) {
            const targetCamX = this.player.x - this.canvas.width / 2 + (this.mousePos.x - this.canvas.width / 2) * 0.22;
            const targetCamY = this.player.y - this.canvas.height / 2 + (this.mousePos.y - this.canvas.height / 2) * 0.22;

            this.camera.x += (targetCamX - this.camera.x) * 0.1;
            this.camera.y += (targetCamY - this.camera.y) * 0.1;
        }

        this.map.update(dt);

        // Update Entities & AI
        this.entities.forEach(ent => {
            if (!ent.alive) {
                ent.respawnTimer -= dt;
                if (ent.respawnTimer <= 0) {
                    const spawnArr = ent.team === 'blue' ? this.map.spawnsBlue : this.map.spawnsRed;
                    const spawn = spawnArr[Math.floor(Math.random() * spawnArr.length)];
                    ent.respawn(spawn);
                }
                return;
            }

            if (ent.ai) {
                ent.ai.update(dt, this);
                ent.updateReload();
            }

            const wallColl = this.map.checkCircleWallCollision(ent.x, ent.y, ent.radius);
            if (wallColl.collided) {
                ent.x += wallColl.resolveX;
                ent.y += wallColl.resolveY;
            }

            this.map.pickups.forEach(p => {
                if (p.active) {
                    const dist = Math.hypot(p.x - ent.x, p.y - ent.y);
                    if (dist < ent.radius + 16) {
                        if (p.type === 'health' && ent.health < ent.maxHealth) {
                            ent.health = Math.min(ent.maxHealth, ent.health + 40);
                            p.active = false;
                            if (ent.isPlayer) soundManager.playPickup();
                        } else if (p.type === 'armor' && ent.armor < ent.maxArmor) {
                            ent.armor = Math.min(ent.maxArmor, ent.armor + 50);
                            p.active = false;
                            if (ent.isPlayer) soundManager.playPickup();
                        } else if (p.type === 'ammo') {
                            ent.weapon.reserveAmmo += ent.weapon.clipSize * 3;
                            p.active = false;
                            if (ent.isPlayer) soundManager.playPickup();
                        }
                    }
                }
            });
        });

        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.life -= dt / 1000;

            if (proj.life <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }

            const nextX = proj.x + proj.vx * (dt / 1000);
            const nextY = proj.y + proj.vy * (dt / 1000);

            const wallHit = this.map.raycastWall(proj.x, proj.y, nextX, nextY);
            if (wallHit) {
                if (proj.isRocket) {
                    this.triggerExplosion(wallHit.x, wallHit.y, proj.splashRadius, proj.damage, proj.owner);
                } else {
                    this.particles.spawnBloodSplatter(wallHit.x, wallHit.y, '#fcfcfc');
                    this.map.addFloorDecal(wallHit.x, wallHit.y, 'scorch', '#3f3f46');
                }
                this.projectiles.splice(i, 1);
                continue;
            }

            let hitBarrel = false;
            for (const b of this.map.barrels) {
                if (b.exploded) continue;
                const dist = Math.hypot(b.x - nextX, b.y - nextY);
                if (dist < b.radius) {
                    b.hp -= proj.damage;
                    b.flashTimer = 100;
                    if (b.hp <= 0) {
                        b.exploded = true;
                        this.triggerExplosion(b.x, b.y, 180, 140, proj.owner);
                    }
                    hitBarrel = true;
                    break;
                }
            }

            if (hitBarrel) {
                this.projectiles.splice(i, 1);
                continue;
            }

            let hitEntity = false;
            for (const ent of this.entities) {
                if (!ent.alive || ent === proj.owner) continue;

                if (this.mode === 'TDM' && ent.team === proj.owner.team) continue;

                const dist = Math.hypot(ent.x - nextX, ent.y - nextY);
                if (dist < ent.radius) {
                    if (proj.isRocket) {
                        this.triggerExplosion(nextX, nextY, proj.splashRadius, proj.damage, proj.owner);
                    } else {
                        ent.takeDamage(proj.damage, proj.owner, this);
                    }
                    hitEntity = true;
                    break;
                }
            }

            if (hitEntity) {
                this.projectiles.splice(i, 1);
                continue;
            }

            proj.x = nextX;
            proj.y = nextY;
        }

        // Update Floating Damage Numbers
        for (let i = this.floatingDamages.length - 1; i >= 0; i--) {
            const fd = this.floatingDamages[i];
            fd.life -= dt / 1000;
            fd.y -= 30 * (dt / 1000);
            if (fd.life <= 0) {
                this.floatingDamages.splice(i, 1);
            }
        }

        this.particles.update(dt);
        this.updateHUD();
    }

    triggerExplosion(x, y, radius, maxDamage, attacker) {
        soundManager.playExplosion();
        this.addCameraShake(18);
        this.particles.spawnExplosion(x, y, radius);
        this.map.addFloorDecal(x, y, 'scorch');

        this.entities.forEach(ent => {
            if (!ent.alive) return;
            const dist = Math.hypot(ent.x - x, ent.y - y);
            if (dist < radius) {
                const dmgFactor = 1 - (dist / radius);
                const dmg = Math.round(maxDamage * dmgFactor);
                ent.takeDamage(dmg, attacker, this);
            }
        });
    }

    updateHUD() {
        if (!this.player) return;

        const hpBar = document.getElementById('health-bar');
        const hpText = document.getElementById('health-text');
        const armorBar = document.getElementById('armor-bar');
        const armorText = document.getElementById('armor-text');
        const staminaBar = document.getElementById('stamina-bar');

        const hpPct = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
        hpBar.style.width = `${hpPct}%`;
        hpText.textContent = `${Math.ceil(this.player.health)} / ${this.player.maxHealth}`;

        const armorPct = Math.max(0, (this.player.armor / this.player.maxArmor) * 100);
        armorBar.style.width = `${armorPct}%`;
        armorText.textContent = `${Math.ceil(this.player.armor)} / ${this.player.maxArmor}`;

        staminaBar.style.width = `${this.player.stamina}%`;

        const warning = document.getElementById('low-health-warning');
        if (this.player.health <= 30 && this.player.alive) {
            warning.style.opacity = '1';
        } else {
            warning.style.opacity = '0';
        }

        const reloadPrompt = document.getElementById('reload-indicator');
        if (this.player.isReloading) {
            reloadPrompt.style.display = 'block';
        } else {
            reloadPrompt.style.display = 'none';
        }

        document.getElementById('hud-weapon-name').textContent = this.player.weapon.name;
        document.getElementById('hud-ammo-cur').textContent = this.player.weapon.ammoInClip;
        document.getElementById('hud-ammo-res').textContent = this.player.weapon.reserveAmmo;

        this.blueScore = this.entities.filter(e => e.team === 'blue').reduce((a, b) => a + b.kills, 0);
        this.redScore = this.entities.filter(e => e.team === 'red').reduce((a, b) => a + b.kills, 0);

        document.getElementById('blue-score-val').textContent = this.blueScore;
        document.getElementById('red-score-val').textContent = this.redScore;

        const seconds = Math.max(0, Math.ceil(this.matchTimeMs / 1000));
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        document.getElementById('hud-timer').textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;

        if (this.blueScore >= this.targetScore || this.redScore >= this.targetScore) {
            this.endMatch();
        }
    }

    updateHotbarUI(activeSlot) {
        document.querySelectorAll('#weapon-hotbar .hotbar-slot').forEach(slot => {
            slot.classList.remove('active');
            if (parseInt(slot.dataset.slot) === activeSlot) {
                slot.classList.add('active');
            }
        });
    }

    updateScoreboardUI() {
        const blueTbody = document.getElementById('blue-scoreboard-body');
        const redTbody = document.getElementById('red-scoreboard-body');
        blueTbody.innerHTML = '';
        redTbody.innerHTML = '';

        const sorted = [...this.entities].sort((a, b) => b.score - a.score);

        sorted.forEach(ent => {
            const tr = document.createElement('tr');
            if (ent.isPlayer) tr.className = 'is-player';
            tr.innerHTML = `
                <td>${ent.name}</td>
                <td>${ent.kills}</td>
                <td>${ent.deaths}</td>
                <td>${ent.score}</td>
            `;

            if (ent.team === 'blue') {
                blueTbody.appendChild(tr);
            } else {
                redTbody.appendChild(tr);
            }
        });
    }

    endMatch() {
        this.isRunning = false;

        const isWin = this.blueScore >= this.redScore;
        const badge = document.getElementById('gameover-header-badge');
        const title = document.getElementById('gameover-title');

        if (isWin) {
            badge.textContent = 'VICTORY';
            badge.style.background = 'var(--accent-cyan)';
            title.textContent = 'BLUE TEAM VICTORIOUS';
        } else {
            badge.textContent = 'DEFEAT';
            badge.style.background = 'var(--accent-red)';
            title.textContent = 'RED TEAM DEFEATED YOU';
        }

        document.getElementById('stat-kills').textContent = this.player.kills;
        document.getElementById('stat-deaths').textContent = this.player.deaths;

        const kd = this.player.deaths === 0 ? this.player.kills : (this.player.kills / this.player.deaths).toFixed(2);
        document.getElementById('stat-kd').textContent = kd;

        const acc = this.player.totalShots === 0 ? 0 : Math.round((this.player.totalHits / this.player.totalShots) * 100);
        document.getElementById('stat-accuracy').textContent = `${acc}%`;
        document.getElementById('stat-damage').textContent = this.player.totalDamage;

        document.getElementById('gameover-modal').classList.add('active');
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        let shakeX = 0, shakeY = 0;
        if (this.camera.shake > 0) {
            shakeX = (Math.random() - 0.5) * this.camera.shake;
            shakeY = (Math.random() - 0.5) * this.camera.shake;
        }

        this.ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

        // 1. Draw Map & Floor Decals
        this.map.draw(this.ctx, this);

        // 2. Draw Particles
        this.particles.draw(this.ctx);

        // 3. Draw Projectiles
        for (const proj of this.projectiles) {
            this.ctx.save();
            this.ctx.fillStyle = proj.color;
            this.ctx.shadowColor = proj.color;
            this.ctx.shadowBlur = 8;

            if (proj.isRocket) {
                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, 3.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        }

        // 4. Draw Detailed Character Avatars (Player & Bots)
        for (const ent of this.entities) {
            ent.draw(this.ctx, this);
        }

        // 5. Draw Dynamic Vision Cone & Fog Layer
        this.map.drawVisionLighting(this.ctx, this.player, this.canvas.width, this.canvas.height);

        // 6. Draw Floating Damage Numbers
        for (const fd of this.floatingDamages) {
            this.ctx.save();
            const alpha = Math.max(0, fd.life / fd.maxLife);
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = fd.color;
            this.ctx.font = `bold ${fd.size}px Orbitron`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(fd.text, fd.x, fd.y);
            this.ctx.restore();
        }

        this.ctx.restore();

        // 7. Draw Dynamic Reticle Crosshair & Hitmarker
        this.drawDynamicCrosshair();

        // 8. Render Minimap
        this.drawMinimap();
    }

    drawDynamicCrosshair() {
        const mx = this.mousePos.x;
        const my = this.mousePos.y;
        const ctx = this.ctx;

        ctx.save();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;

        let gap = 6;
        if (this.player) {
            if (this.player.vx !== 0 || this.player.vy !== 0) gap += 4;
            if (Date.now() - this.player.lastShotTime < 150) gap += 6;
        }

        const len = 10;
        ctx.beginPath();
        // Top
        ctx.moveTo(mx, my - gap); ctx.lineTo(mx, my - gap - len);
        // Bottom
        ctx.moveTo(mx, my + gap); ctx.lineTo(mx, my + gap + len);
        // Left
        ctx.moveTo(mx - gap, my); ctx.lineTo(mx - gap - len, my);
        // Right
        ctx.moveTo(mx + gap, my); ctx.lineTo(mx + gap + len, my);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fill();

        // Hitmarker X Flash overlay when landing hits
        if (this.hitmarkerTime > 0) {
            ctx.strokeStyle = '#ff2a55';
            ctx.lineWidth = 2.5;
            const hSize = 8;
            ctx.beginPath();
            ctx.moveTo(mx - hSize, my - hSize); ctx.lineTo(mx + hSize, my + hSize);
            ctx.moveTo(mx + hSize, my - hSize); ctx.lineTo(mx - hSize, my + hSize);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawMinimap() {
        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;

        ctx.fillStyle = 'rgba(5, 10, 20, 0.9)';
        ctx.fillRect(0, 0, w, h);

        const scaleX = w / this.map.width;
        const scaleY = h / this.map.height;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (const wall of this.map.walls) {
            ctx.fillRect(wall.x * scaleX, wall.y * scaleY, wall.w * scaleX, wall.h * scaleY);
        }

        for (const ent of this.entities) {
            if (!ent.alive) continue;
            ctx.fillStyle = ent.isPlayer ? '#00f0ff' : (ent.team === 'blue' ? '#0077ff' : '#ff2a55');
            ctx.beginPath();
            ctx.arc(ent.x * scaleX, ent.y * scaleY, ent.isPlayer ? 4 : 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Initialize Game Instance on Load
window.addEventListener('load', () => {
    window.gameInstance = new Game();
});
