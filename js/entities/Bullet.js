import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { GAME_CONFIG } from '../config/constants.js';

export class Bullet extends Entity {
    constructor(x, y, direction, config = {}) {
        super(x, y, config.radius || 3);
        
        // Bullet properties
        this.damage = config.damage || 25;
        this.speed = config.speed || GAME_CONFIG.PHYSICS.BULLET_SPEED;
        this.penetration = config.penetration || 0;
        this.lifeTime = config.lifeTime || 2000; // 2 seconds
        this.maxDistance = config.maxDistance || 1500;
        
        // Owner info
        this.owner = config.owner || null;
        this.isPlayerBullet = config.isPlayerBullet || false;
        
        // Movement
        this.direction = direction.normalized();
        this.velocity = this.direction.copy().multiply(this.speed);
        
        // Visuals
        this.color = this.isPlayerBullet ? 
            GAME_CONFIG.COLORS.BULLET_PLAYER : 
            GAME_CONFIG.COLORS.BULLET_ENEMY;
        this.trailLength = 5;
        this.trail = [];
        
        // Tracking
        this.distanceTraveled = 0;
        this.startPosition = new Vector2(x, y);
        this.pierceCount = 0;
        
        // Effects
        this.hasTrail = true;
        this.glowEffect = true;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        const dt = deltaTime / 1000;
        
        // Store previous position for trail
        if (this.hasTrail) {
            this.trail.push({
                x: this.position.x,
                y: this.position.y,
                alpha: 1
            });
            
            // Limit trail length
            if (this.trail.length > this.trailLength) {
                this.trail.shift();
            }
            
            // Fade trail
            this.trail.forEach((point, index) => {
                point.alpha = (index + 1) / this.trail.length * 0.5;
            });
        }
        
        // Update position
        const movement = this.velocity.copy().multiply(dt);
        this.position.add(movement);
        this.distanceTraveled += movement.magnitude();
        
        // Update lifetime
        this.lifeTime -= deltaTime;
        
        // Check if bullet should be destroyed
        if (this.lifeTime <= 0 || this.distanceTraveled >= this.maxDistance) {
            this.destroy();
        }
        
        // Check world bounds
        const worldSize = GAME_CONFIG.WORLD_SIZE;
        if (Math.abs(this.position.x) > worldSize / 2 || 
            Math.abs(this.position.y) > worldSize / 2) {
            this.destroy();
        }
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        
        // Draw trail
        if (this.hasTrail && this.trail.length > 0) {
            ctx.strokeStyle = this.color;
            ctx.lineCap = 'round';
            
            this.trail.forEach((point, index) => {
                if (index === 0) return;
                
                const prevPoint = this.trail[index - 1];
                ctx.globalAlpha = point.alpha;
                ctx.lineWidth = this.radius * 2 * (index / this.trail.length);
                
                ctx.beginPath();
                ctx.moveTo(prevPoint.x, prevPoint.y);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            });
        }
        
        // Draw bullet
        ctx.globalAlpha = 1;
        ctx.translate(this.position.x, this.position.y);
        
        // Glow effect
        if (this.glowEffect) {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 3);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(0.5, this.color + '80');
            gradient.addColorStop(1, this.color + '00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Main bullet
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner bright core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    onHit(target) {
        // Apply damage and return if target was killed
        let targetKilled = false;
        if (target && target.takeDamage) {
            targetKilled = target.takeDamage(this.damage);
        }
        
        // Handle penetration
        this.pierceCount++;
        if (this.pierceCount > this.penetration) {
            this.destroy();
        }
        
        return targetKilled;
    }
    
    canHit(target) {
        // Check if bullet can hit the target
        if (!target || !target.alive) return false;
        
        // Player bullets can't hit player, enemy bullets can't hit enemies
        if (this.isPlayerBullet && target.constructor.name === 'Player') return false;
        if (!this.isPlayerBullet && target.constructor.name !== 'Player') return false;
        
        return true;
    }
}