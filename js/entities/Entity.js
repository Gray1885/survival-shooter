import { Vector2 } from '../utils/Vector2.js';
import { MathUtils } from '../utils/MathUtils.js';

// Base Entity Class for all game objects
export class Entity {
    constructor(x = 0, y = 0, radius = 20) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.acceleration = new Vector2(0, 0);
        this.radius = radius;
        
        this.health = 100;
        this.maxHealth = 100;
        this.alive = true;
        this.speed = 0;
        
        this.rotation = 0;
        this.rotationSpeed = 0;
        
        // Collision
        this.collisionGroup = 'default';
        this.canCollide = true;
        
        // Rendering
        this.color = '#ffffff';
        this.alpha = 1;
        this.visible = true;
        
        // Effects
        this.isFlashing = false;
        this.flashTimer = 0;
        this.flashDuration = 100;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        const dt = deltaTime / 1000; // Convert to seconds
        
        // Apply acceleration to velocity
        this.velocity.add(
            this.acceleration.copy().multiply(dt)
        );
        
        // Apply velocity to position
        this.position.add(
            this.velocity.copy().multiply(dt)
        );
        
        // Apply friction
        this.velocity.multiply(0.98);
        
        // Update rotation
        this.rotation += this.rotationSpeed * dt;
        
        // Update flash effect
        if (this.isFlashing) {
            this.flashTimer -= deltaTime;
            if (this.flashTimer <= 0) {
                this.isFlashing = false;
                this.alpha = 1;
            } else {
                // Flash effect
                this.alpha = Math.sin(this.flashTimer * 0.05) * 0.5 + 0.5;
            }
        }
        
        // Reset acceleration
        this.acceleration.set(0, 0);
    }
    
    render(ctx) {
        if (!this.visible || !this.alive) return;
        
        ctx.save();
        
        // Apply transformations
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        
        // Draw entity (override in subclasses)
        this.draw(ctx);
        
        // Draw health bar if damaged
        if (this.health < this.maxHealth && this.health > 0) {
            this.drawHealthBar(ctx);
        }
        
        ctx.restore();
    }
    
    draw(ctx) {
        // Default circle drawing
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Debug collision radius
        if (window.DEBUG_MODE) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawHealthBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const barY = -this.radius - 10;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
        
        // Health fill
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#00ff00' : 
                          healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
    }
    
    takeDamage(amount) {
        if (!this.alive || this.isFlashing) return false;
        
        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
            this.onDeath();
            return true; // Enemy was killed
        } else {
            this.flash();
            this.onDamage(amount);
            return false; // Enemy survived
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    
    flash() {
        this.isFlashing = true;
        this.flashTimer = this.flashDuration;
    }
    
    applyForce(force) {
        this.acceleration.add(force);
    }
    
    applyImpulse(impulse) {
        this.velocity.add(impulse);
    }
    
    knockback(angle, force) {
        const knockbackVector = Vector2.fromAngle(angle).multiply(force);
        this.applyImpulse(knockbackVector);
    }
    
    lookAt(target) {
        this.rotation = this.position.angleTo(target);
    }
    
    moveTowards(target, speed) {
        const direction = new Vector2(
            target.x - this.position.x,
            target.y - this.position.y
        ).normalize();
        
        this.velocity = direction.multiply(speed);
    }
    
    isColliding(other) {
        if (!this.canCollide || !other.canCollide) return false;
        if (!this.alive || !other.alive) return false;
        
        return MathUtils.circlesCollide(
            this.position.x, this.position.y, this.radius,
            other.position.x, other.position.y, other.radius
        );
    }
    
    resolveCollision(other) {
        // Calculate overlap
        const distance = this.position.distanceTo(other.position);
        const overlap = this.radius + other.radius - distance;
        
        if (overlap > 0) {
            // Calculate push direction
            const pushDirection = new Vector2(
                this.position.x - other.position.x,
                this.position.y - other.position.y
            ).normalize();
            
            // Push entities apart
            const pushAmount = overlap / 2;
            this.position.add(pushDirection.copy().multiply(pushAmount));
            other.position.subtract(pushDirection.copy().multiply(pushAmount));
        }
    }
    
    // Boundary checking
    keepInBounds(minX, minY, maxX, maxY) {
        this.position.x = MathUtils.clamp(
            this.position.x, 
            minX + this.radius, 
            maxX - this.radius
        );
        this.position.y = MathUtils.clamp(
            this.position.y, 
            minY + this.radius, 
            maxY - this.radius
        );
    }
    
    // Override these in subclasses
    onDeath() {
        // Override in subclasses
    }
    
    onDamage(amount) {
        // Override in subclasses
    }
    
    destroy() {
        this.alive = false;
        this.visible = false;
    }
}