import { Entity } from '../entities/Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { GAME_CONFIG } from '../config/constants.js';

export class MiniBoss extends Entity {
    constructor(x, y, type = 'brute') {
        const config = MiniBoss.getConfig(type);
        super(x, y, config.radius);
        
        this.bossType = type;
        this.isMiniBoss = true;
        this.maxHealth = config.health;
        this.health = this.maxHealth;
        this.speed = config.speed;
        this.damage = config.damage;
        this.scoreValue = config.scoreValue;
        this.color = config.color;
        this.glowColor = config.glowColor;
        
        // AI properties
        this.target = null;
        this.detectionRange = 1000;
        this.attackRange = 35;
        this.attackCooldown = 1000;
        this.lastAttackTime = 0;
        this.state = 'idle';
        this.stateTimer = 0;
        this.moveDirection = new Vector2(0, 0);
        this.avoidanceForce = new Vector2(0, 0);
        this.wanderAngle = Math.random() * Math.PI * 2;
        
        // 보스 특수 능력
        this.specialAbilityCooldown = 0;
        this.specialAbilityMaxCooldown = config.specialCooldown || 3000;
        this.lastSpecialTime = 0;
        
        // 미사일 발사 쿨다운
        this.missileCooldown = 1500; // 1.5초 기본 쿨다운 (더 빠르게)
        this.lastMissileTime = 0;
        
        // 시각적 효과
        this.glowIntensity = 0;
        this.glowDirection = 1;
        
        // 보스별 특수 속성
        this.initSpecialProperties();
    }
    
    static getConfig(type) {
        const configs = {
            brute: {
                health: 250,
                damage: 25,
                speed: 80,
                radius: 35,
                color: '#8B0000',
                glowColor: '#FF0000',
                scoreValue: 100,
                specialCooldown: 4000
            },
            speed: {
                health: 150,
                damage: 15,
                speed: 200,
                radius: 25,
                color: '#FFD700',
                glowColor: '#FFFF00',
                scoreValue: 150,
                specialCooldown: 3000
            },
            tank: {
                health: 400,
                damage: 35,
                speed: 50,
                radius: 45,
                color: '#696969',
                glowColor: '#C0C0C0',
                scoreValue: 200,
                specialCooldown: 5000
            },
            poison: {
                health: 200,
                damage: 20,
                speed: 100,
                radius: 30,
                color: '#228B22',
                glowColor: '#00FF00',
                scoreValue: 175,
                specialCooldown: 3500
            },
            summoner: {
                health: 300,
                damage: 30,
                speed: 120,
                radius: 40,
                color: '#8A2BE2',
                glowColor: '#DA70D6',
                scoreValue: 250,
                specialCooldown: 6000
            }
        };
        
        return configs[type] || configs.brute;
    }
    
    static getBossTypeForWave(wave) {
        if (wave <= 2) return 'brute';
        if (wave <= 4) return 'speed';
        if (wave <= 6) return 'tank';
        if (wave <= 8) return 'poison';
        return 'summoner';
    }
    
    initSpecialProperties() {
        switch(this.bossType) {
            case 'brute':
                this.chargeSpeed = 400;
                this.isCharging = false;
                break;
            case 'speed':
                this.teleportRange = 200;
                this.afterImageCount = 0;
                break;
            case 'tank':
                this.hasShield = false;
                this.shieldDuration = 0;
                break;
            case 'poison':
                this.poisonRadius = 80;
                this.poisonDamage = 5;
                break;
            case 'summoner':
                this.minionCount = 0;
                this.maxMinions = 3;
                break;
        }
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        // Update AI
        this.updateAI(deltaTime);
        
        // Update movement
        this.updateMovement(deltaTime);
        
        // 특수 능력 쿨다운 업데이트
        if (this.specialAbilityCooldown > 0) {
            this.specialAbilityCooldown -= deltaTime;
        }
        
        // 글로우 효과 업데이트
        this.glowIntensity += this.glowDirection * deltaTime / 1000;
        if (this.glowIntensity >= 1) {
            this.glowIntensity = 1;
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0) {
            this.glowIntensity = 0;
            this.glowDirection = 1;
        }
        
        // 보스별 특수 업데이트
        this.updateSpecialAbility(deltaTime);
        
        super.update(deltaTime);
    }
    
    updateAI(deltaTime) {
        if (!this.target) return;
        
        const distanceToTarget = this.position.distanceTo(this.target.position);
        
        // 미니보스는 항상 플레이어를 쫓아감
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
        
        const currentSpeed = this.state === 'attacking' ? this.speed * 0.7 : this.speed;
        this.velocity = this.moveDirection.copy().multiply(currentSpeed);
        
        this.velocity.add(this.avoidanceForce);
        this.avoidanceForce.set(0, 0);
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
    
    updateSpecialAbility(deltaTime) {
        const now = Date.now();
        
        if (now - this.lastSpecialTime > this.specialAbilityMaxCooldown) {
            this.useSpecialAbility();
            this.lastSpecialTime = now;
        }
        
        switch(this.bossType) {
            case 'brute':
                this.updateCharge(deltaTime);
                break;
            case 'tank':
                this.updateShield(deltaTime);
                break;
        }
    }
    
    useSpecialAbility() {
        switch(this.bossType) {
            case 'brute':
                this.startCharge();
                break;
            case 'speed':
                this.teleportToPlayer();
                break;
            case 'tank':
                this.activateShield();
                break;
            case 'poison':
                this.createPoisonCloud();
                break;
            case 'summoner':
                this.summonMinions();
                break;
        }
        
        // 모든 보스가 추가로 미사일 공격을 할 수 있음 (50% 확률)
        if (Math.random() < 0.5) {
            this.fireMissile();
        }
    }
    
    startCharge() {
        if (!this.target) return;
        
        this.isCharging = true;
        const direction = new Vector2(
            this.target.position.x - this.position.x,
            this.target.position.y - this.position.y
        ).normalize();
        
        this.velocity = direction.multiply(this.chargeSpeed);
        
        // 2초 후 차지 종료
        setTimeout(() => {
            this.isCharging = false;
            this.velocity.multiply(0.1);
        }, 2000);
    }
    
    updateCharge(deltaTime) {
        if (this.isCharging) {
            // 차지 중 데미지 증가
            this.damage = 50;
        } else {
            this.damage = 25;
        }
    }
    
    teleportToPlayer() {
        if (!this.target) return;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 100;
        
        this.position.x = this.target.position.x + Math.cos(angle) * distance;
        this.position.y = this.target.position.y + Math.sin(angle) * distance;
        
        // 텔레포트 이펙트 생성
        this.createTeleportEffect();
    }
    
    activateShield() {
        this.hasShield = true;
        this.shieldDuration = 3000; // 3초
    }
    
    updateShield(deltaTime) {
        if (this.hasShield) {
            this.shieldDuration -= deltaTime;
            if (this.shieldDuration <= 0) {
                this.hasShield = false;
            }
        }
    }
    
    createPoisonCloud() {
        // 독 구름 이펙트는 Game.js에서 처리
        return {
            type: 'poison_cloud',
            position: this.position.copy(),
            radius: this.poisonRadius,
            damage: this.poisonDamage,
            duration: 5000
        };
    }
    
    summonMinions() {
        if (this.minionCount >= this.maxMinions) return;
        
        const minions = [];
        const count = Math.min(2, this.maxMinions - this.minionCount);
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const distance = 80;
            const x = this.position.x + Math.cos(angle) * distance;
            const y = this.position.y + Math.sin(angle) * distance;
            
            minions.push({ x, y });
        }
        
        this.minionCount += count;
        return minions;
    }
    
    fireMissile() {
        if (!this.target) return null;
        
        // 미사일 생성 (캐기망 예측 위치로 발사)
        const targetPosition = this.target.position.copy();
        const targetVelocity = this.target.velocity || new Vector2(0, 0);
        
        // 0.5초 후 플레이어 예상 위치 계산
        const prediction = targetPosition.copy().add(
            targetVelocity.copy().multiply(0.5)
        );
        
        const direction = new Vector2(
            prediction.x - this.position.x,
            prediction.y - this.position.y
        ).normalize();
        
        return {
            type: 'missile',
            position: this.position.copy(),
            direction: direction,
            speed: 300, // 더 빠른 미사일
            damage: 40,
            explosionRadius: 80,
            lifetime: 4000,
            homingStrength: 0.03 // 더 강한 유도
        };
    }
    
    takeDamage(amount) {
        // 탱크 보스는 쉴드가 있을 때 데미지 50% 감소
        if (this.bossType === 'tank' && this.hasShield) {
            amount *= 0.5;
        }
        
        return super.takeDamage(amount);
    }
    
    createTeleportEffect() {
        // 텔레포트 파티클 효과
        return {
            type: 'teleport',
            position: this.position.copy(),
            particles: 20
        };
    }
    
    draw(ctx) {
        // 보스 오오라 효과
        const glowSize = this.radius + 10 + this.glowIntensity * 15;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.glowColor;
        
        // 특수 상태별 효과
        if (this.bossType === 'brute' && this.isCharging) {
            ctx.strokeStyle = '#FF4500';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (this.bossType === 'tank' && this.hasShield) {
            ctx.strokeStyle = '#00BFFF';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 15, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 기본 몸체
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, this.color + '80');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 보스 표시 (왕관 아이콘)
        ctx.fillStyle = '#FFD700';
        ctx.font = `${this.radius}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👑', 0, -this.radius - 20);
        
        // 체력바
        this.drawHealthBar(ctx);
        
        ctx.shadowBlur = 0;
    }
    
    drawHealthBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 8;
        const healthPercent = this.health / this.maxHealth;
        
        // 배경
        ctx.fillStyle = '#333333';
        ctx.fillRect(-barWidth/2, -this.radius - 35, barWidth, barHeight);
        
        // 체력
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-barWidth/2, -this.radius - 35, barWidth * healthPercent, barHeight);
        
        // 테두리
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth/2, -this.radius - 35, barWidth, barHeight);
    }
}