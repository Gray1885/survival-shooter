import { Entity } from '../entities/Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { GAME_CONFIG } from '../config/constants.js';

export class Zombie extends Entity {
    constructor(x, y) {
        super(x, y, 20); // radius
        
        // Zombie properties
        this.type = 'zombie';
        this.health = 25;
        this.maxHealth = 25;
        this.speed = 120;
        this.damage = 10;
        this.scoreValue = 10;
        this.detectionRange = 400;
        this.attackRange = 30;
        this.attackCooldown = 1000;
        this.color = '#4a7c59';
        this.glowColor = '#66ff66';
        
        // AI properties
        this.target = null;
        this.lastAttackTime = 0;
        this.state = 'idle'; // idle, chasing, attacking
        this.stateTimer = 0;
        this.moveDirection = new Vector2(0, 0);
        this.avoidanceForce = new Vector2(0, 0);
        this.wanderAngle = Math.random() * Math.PI * 2;
        
        // Zombie specific properties
        this.movePattern = 'straight'; // Can be 'straight' or 'zigzag'
        this.zigzagTimer = 0;
        this.zigzagAngle = 0;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        // Update AI
        this.updateAI(deltaTime);
        
        // Update movement
        this.updateMovement(deltaTime);
        
        super.update(deltaTime);
    }
    
    updateAI(deltaTime) {
        if (!this.target) return;
        
        const distanceToTarget = this.position.distanceTo(this.target.position);
        
        // 좀비는 항상 플레이어를 쫓아감 (거리 상관없이)
        if (distanceToTarget <= this.attackRange) {
            this.state = 'attacking';
            this.tryAttack();
        } else {
            this.state = 'chasing';
        }
        
        this.stateTimer += deltaTime;
    }
    
    updateMovement(deltaTime) {
        if (!this.target) return;
        
        // 항상 플레이어를 향해 이동
        this.moveTowardsTarget();
        
        const currentSpeed = this.state === 'attacking' ? this.speed * 0.8 : this.speed;
        this.velocity = this.moveDirection.copy().multiply(currentSpeed);
        
        // Add slight zigzag movement when chasing
        if (this.state === 'chasing' && this.movePattern === 'zigzag') {
            this.zigzagTimer += deltaTime;
            this.zigzagAngle = Math.sin(this.zigzagTimer * 0.005) * 0.3;
            this.velocity.rotate(this.zigzagAngle);
        }
    }
    
    wander(deltaTime) {
        this.wanderAngle += (Math.random() - 0.5) * 0.5;
        this.moveDirection = Vector2.fromAngle(this.wanderAngle);
    }
    
    moveTowardsTarget() {
        const direction = new Vector2(
            this.target.position.x - this.position.x,
            this.target.position.y - this.position.y
        );
        
        if (direction.magnitude() > 0) {
            this.moveDirection = direction.normalize();
        }
    }
    
    tryAttack() {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return false;
        
        const distanceToTarget = this.position.distanceTo(this.target.position);
        if (distanceToTarget <= this.attackRange) {
            this.lastAttackTime = now;
            return this.attack();
        }
        return false;
    }
    
    attack() {
        if (this.target && this.target.takeDamage) {
            const wasAlive = this.target.alive;
            this.target.takeDamage(this.damage);
            
            const knockbackDirection = new Vector2(
                this.target.position.x - this.position.x,
                this.target.position.y - this.position.y
            ).normalize();
            
            this.target.applyImpulse(
                knockbackDirection.multiply(GAME_CONFIG.PHYSICS.KNOCKBACK_FORCE)
            );
            
            return wasAlive && this.target.alive;
        }
        return false;
    }
    
    setTarget(target) {
        this.target = target;
    }
    
    draw(ctx) {
        // Zombie body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, this.color + '80');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect when chasing
        if (this.state === 'chasing' || this.state === 'attacking') {
            ctx.strokeStyle = this.glowColor + '40';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Eye glow
        const eyeOffset = this.radius * 0.3;
        const eyeSize = 3;
        
        ctx.save();
        ctx.rotate(this.moveDirection.angle());
        
        ctx.fillStyle = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0000';
        
        // Left eye
        ctx.beginPath();
        ctx.arc(eyeOffset, -eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(eyeOffset, eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    onDeath() {
        // 30% chance to drop health
        if (Math.random() < 0.3) {
            // Will implement item drop later
            console.log('Health pack dropped!');
        }
    }
}