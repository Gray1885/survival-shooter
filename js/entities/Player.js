import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { GAME_CONFIG } from '../config/constants.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, GAME_CONFIG.PLAYER.RADIUS);
        
        this.maxHealth = GAME_CONFIG.PLAYER.MAX_HEALTH;
        this.health = this.maxHealth;
        this.speed = GAME_CONFIG.PLAYER.SPEED;
        this.color = GAME_CONFIG.COLORS.PLAYER;
        
        // Movement
        this.moveDirection = new Vector2(0, 0);
        this.lastDirection = new Vector2(1, 0); // For aiming when not moving
        
        // Dash ability
        this.canDash = true;
        this.dashCooldown = 0;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDirection = new Vector2(0, 0);
        
        // Combat
        this.weapons = [];
        this.currentWeaponIndex = 0;
        this.aimDirection = new Vector2(1, 0);
        this.isShooting = false;
        this.lastShotTime = 0;
        
        // Special ability
        this.skillCooldown = 0;
        this.skillMaxCooldown = 5000; // 5 seconds
        
        // Stats
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.enemiesKilled = 0;
        
        // Effects
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
        
        // Buffs
        this.speedMultiplier = 1;
        this.damageMultiplier = 1;
        this.fireRateMultiplier = 1;
        this.speedBoostTimer = 0;
        this.damageBoostTimer = 0;
        this.hasShield = false;
        this.shieldTimer = 0;
    }
    
    update(deltaTime) {
        // Update timers
        this.updateTimers(deltaTime);
        
        // Update movement
        this.updateMovement(deltaTime);
        
        
        // Update combat
        this.updateCombat(deltaTime);
        
        // Update combo
        this.updateCombo(deltaTime);
        
        // Update buffs
        this.updateBuffs(deltaTime);
        
        super.update(deltaTime);
    }
    
    updateTimers(deltaTime) {
        // Dash cooldown
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
            if (this.dashCooldown <= 0) {
                this.canDash = true;
            }
        }
        
        // Skill cooldown
        if (this.skillCooldown > 0) {
            this.skillCooldown -= deltaTime;
        }
        
        // Invulnerability
        if (this.invulnerable) {
            this.invulnerabilityTimer -= deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
                this.isFlashing = false;
                this.alpha = 1;
            }
        }
    }
    
    updateMovement(deltaTime) {
        if (this.isDashing) return; // Don't apply normal movement during dash
        
        // Apply movement based on input
        const currentSpeed = this.speed * this.speedMultiplier;
        this.velocity = this.moveDirection.copy().multiply(currentSpeed);
        
        // Update last direction for aiming
        if (this.moveDirection.magnitude() > 0) {
            this.lastDirection = this.moveDirection.copy().normalize();
        }
    }
    
    updateDash(deltaTime) {
        if (this.isDashing) {
            this.dashTimer -= deltaTime;
            
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.velocity.multiply(0.1); // Slow down after dash
            } else {
                // Apply dash velocity
                this.velocity = this.dashDirection.copy()
                    .multiply(GAME_CONFIG.PLAYER.DASH_SPEED);
            }
        }
    }
    
    updateCombat(deltaTime) {
        // Update current weapon
        const weapon = this.getCurrentWeapon();
        if (weapon) {
            weapon.update(deltaTime);
        }
        
        // Auto fire if shooting
        if (this.isShooting && this.canShoot()) {
            this.shoot();
        }
    }
    
    updateCombo(deltaTime) {
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
    }
    
    updateBuffs(deltaTime) {
        // Speed boost
        if (this.speedBoostTimer > 0) {
            this.speedBoostTimer -= deltaTime;
            if (this.speedBoostTimer <= 0) {
                this.speedMultiplier = 1;
            }
        }
        
        // Damage boost
        if (this.damageBoostTimer > 0) {
            this.damageBoostTimer -= deltaTime;
            if (this.damageBoostTimer <= 0) {
                this.damageMultiplier = 1;
            }
        }
        
        // Shield
        if (this.hasShield) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) {
                this.hasShield = false;
            }
        }
    }
    
    draw(ctx) {
        // Draw shield effect
        if (this.hasShield) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw player body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw direction indicator
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(
            this.aimDirection.x * (this.radius + 10),
            this.aimDirection.y * (this.radius + 10)
        );
        ctx.stroke();
        
        // Draw crosshair at aim position
        const crosshairSize = 5;
        const crosshairDistance = this.radius + 15;
        const crosshairX = this.aimDirection.x * crosshairDistance;
        const crosshairY = this.aimDirection.y * crosshairDistance;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(crosshairX - crosshairSize, crosshairY);
        ctx.lineTo(crosshairX + crosshairSize, crosshairY);
        ctx.moveTo(crosshairX, crosshairY - crosshairSize);
        ctx.lineTo(crosshairX, crosshairY + crosshairSize);
        ctx.stroke();
    }
    
    // Movement controls
    setMoveDirection(direction) {
        this.moveDirection = direction.copy();
    }
    
    // Aiming
    aimAt(worldX, worldY) {
        this.aimDirection = new Vector2(
            worldX - this.position.x,
            worldY - this.position.y
        ).normalize();
    }
    
    // Shooting
    startShooting() {
        this.isShooting = true;
    }
    
    stopShooting() {
        this.isShooting = false;
    }
    
    canShoot() {
        const weapon = this.getCurrentWeapon();
        if (!weapon) return false;
        
        return weapon.canFire(this.fireRateMultiplier);
    }
    
    shoot() {
        const weapon = this.getCurrentWeapon();
        if (!weapon || !weapon.canFire(this.fireRateMultiplier)) return null;
        
        // Create bullet(s)
        const bullets = weapon.fire(this.position, this.aimDirection, this.damageMultiplier);
        
        return bullets;
    }
    
    // Dash ability
    dash() {
        if (!this.canDash) return false;
        
        this.isDashing = true;
        this.dashTimer = GAME_CONFIG.PLAYER.DASH_DURATION;
        this.dashCooldown = GAME_CONFIG.PLAYER.DASH_COOLDOWN;
        this.canDash = false;
        
        // Use move direction or aim direction for dash
        this.dashDirection = this.moveDirection.magnitude() > 0 
            ? this.moveDirection.copy().normalize()
            : this.aimDirection.copy();
        
        // Brief invulnerability during dash
        this.invulnerable = true;
        this.invulnerabilityTimer = GAME_CONFIG.PLAYER.DASH_DURATION;
        
        return true;
    }
    
    // Special skill
    useSkill() {
        if (this.skillCooldown > 0) return false;
        
        this.skillCooldown = this.skillMaxCooldown;
        
        // Skill effect: Area damage around player
        return {
            type: 'explosion',
            position: this.position.copy(),
            radius: 150,
            damage: 100
        };
    }
    
    // Weapon management
    addWeapon(weapon) {
        this.weapons.push(weapon);
    }
    
    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.currentWeaponIndex = index;
            return true;
        }
        return false;
    }
    
    getCurrentWeapon() {
        return this.weapons[this.currentWeaponIndex] || null;
    }
    
    // Combat
    takeDamage(amount) {
        if (this.invulnerable || this.hasShield) return false;
        
        const killed = super.takeDamage(amount);
        
        if (!killed) {
            // Brief invulnerability after taking damage
            this.invulnerable = true;
            this.invulnerabilityTimer = GAME_CONFIG.PLAYER.INVULNERABILITY_TIME;
            this.flash();
        }
        
        return killed;
    }
    
    heal(amount) {
        const oldHealth = this.health;
        this.health = Math.min(this.health + amount, this.maxHealth);
        return this.health - oldHealth; // 실제로 회복된 양 반환
    }
    
    // Scoring
    addScore(points) {
        const comboMultiplier = Math.min(
            GAME_CONFIG.COMBAT.COMBO_MULTIPLIERS[this.combo] || 1,
            GAME_CONFIG.COMBAT.COMBO_MULTIPLIERS[GAME_CONFIG.COMBAT.COMBO_MULTIPLIERS.length - 1]
        );
        
        const finalScore = Math.floor(points * comboMultiplier);
        this.score += finalScore;
        
        return finalScore;
    }
    
    addKill() {
        this.enemiesKilled++;
        this.combo++;
        this.comboTimer = GAME_CONFIG.COMBAT.COMBO_TIMEOUT;
    }
    
    // Buffs and items
    applySpeedBoost(duration = 5000) {
        this.speedMultiplier = 1.5;
        this.speedBoostTimer = duration;
    }
    
    applyDamageBoost(duration = 5000) {
        this.damageMultiplier = 2;
        this.damageBoostTimer = duration;
    }
    
    applyShield(duration = 3000) {
        this.hasShield = true;
        this.shieldTimer = duration;
    }
    
    // Getters for UI
    getHealthPercent() {
        return this.health / this.maxHealth;
    }
    
    getDashCooldownPercent() {
        return 1 - Math.max(0, this.dashCooldown / GAME_CONFIG.PLAYER.DASH_COOLDOWN);
    }
    
    getSkillCooldownPercent() {
        return 1 - Math.max(0, this.skillCooldown / this.skillMaxCooldown);
    }
}