import { Vector2 } from '../utils/Vector2.js';
import { Bullet } from '../entities/Bullet.js';
import { MathUtils } from '../utils/MathUtils.js';

export class Weapon {
    constructor(config = {}) {
        // Basic properties
        this.name = config.name || 'Weapon';
        this.icon = config.icon || '🔫';
        
        // Combat stats
        this.damage = config.damage || 25;
        this.fireRate = config.fireRate || 300; // milliseconds between shots
        this.magazineSize = config.magazineSize || 30;
        this.reloadTime = config.reloadTime || 2000; // milliseconds
        this.bulletSpeed = config.bulletSpeed || 1000;
        this.spread = config.spread || 0; // degrees
        this.bulletCount = config.bulletCount || 1; // bullets per shot
        this.penetration = config.penetration || 0;
        
        // Current state
        this.currentAmmo = this.magazineSize;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.lastFireTime = 0;
        
        // Visual/Audio
        this.muzzleFlashSize = config.muzzleFlashSize || 20;
        this.soundVolume = config.soundVolume || 0.5;
        
        // Ammo management
        this.infiniteAmmo = config.infiniteAmmo || false;
        this.totalAmmo = config.totalAmmo || this.magazineSize * 10;
    }
    
    update(deltaTime) {
        // Update reload timer
        if (this.isReloading) {
            this.reloadTimer -= deltaTime;
            if (this.reloadTimer <= 0) {
                this.finishReload();
            }
        }
    }
    
    canFire(fireRateMultiplier = 1) {
        if (this.isReloading) return false;
        if (this.currentAmmo <= 0) return false;
        
        const now = Date.now();
        const effectiveFireRate = this.fireRate / fireRateMultiplier; // 배수가 클수록 빨라짐
        return now - this.lastFireTime >= effectiveFireRate;
    }
    
    fire(position, direction, damageMultiplier = 1) {
        if (!this.canFire()) return null;
        
        this.lastFireTime = Date.now();
        
        // Consume ammo
        if (!this.infiniteAmmo) {
            this.currentAmmo--;
        }
        
        // Auto reload when empty
        if (this.currentAmmo <= 0 && this.totalAmmo > 0) {
            this.reload();
        }
        
        // Create bullets
        const bullets = [];
        
        for (let i = 0; i < this.bulletCount; i++) {
            // Apply spread
            let bulletDirection = direction.copy();
            if (this.spread > 0) {
                const spreadAngle = MathUtils.randomRange(-this.spread, this.spread) * Math.PI / 180;
                bulletDirection.rotate(spreadAngle);
            }
            
            // Create bullet with weapon config
            const bullet = new Bullet(position.x, position.y, bulletDirection, {
                damage: this.damage * damageMultiplier,
                speed: this.bulletSpeed,
                penetration: this.penetration,
                isPlayerBullet: true
            });
            
            bullets.push(bullet);
        }
        
        // Return single bullet or array
        return this.bulletCount === 1 ? bullets[0] : bullets;
    }
    
    reload() {
        if (this.isReloading) return false;
        if (this.currentAmmo === this.magazineSize) return false;
        if (!this.infiniteAmmo && this.totalAmmo <= 0) return false;
        
        this.isReloading = true;
        this.reloadTimer = this.reloadTime;
        
        return true;
    }
    
    finishReload() {
        this.isReloading = false;
        
        if (this.infiniteAmmo) {
            this.currentAmmo = this.magazineSize;
        } else {
            const ammoNeeded = this.magazineSize - this.currentAmmo;
            const ammoToReload = Math.min(ammoNeeded, this.totalAmmo);
            
            this.currentAmmo += ammoToReload;
            this.totalAmmo -= ammoToReload;
        }
    }
    
    addAmmo(amount) {
        if (!this.infiniteAmmo) {
            this.totalAmmo += amount;
        }
    }
    
    getAmmoPercent() {
        return this.currentAmmo / this.magazineSize;
    }
    
    getReloadPercent() {
        if (!this.isReloading) return 1;
        return 1 - (this.reloadTimer / this.reloadTime);
    }
    
    getInfo() {
        return {
            name: this.name,
            icon: this.icon,
            currentAmmo: this.currentAmmo,
            magazineSize: this.magazineSize,
            totalAmmo: this.infiniteAmmo ? '∞' : this.totalAmmo,
            isReloading: this.isReloading,
            reloadPercent: this.getReloadPercent()
        };
    }
}