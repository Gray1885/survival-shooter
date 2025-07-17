import { GAME_CONFIG, GAME_STATES } from '../config/constants.js';
import { InputHandler } from './InputHandler.js';
import { Player } from '../entities/Player.js';
import { Vector2 } from '../utils/Vector2.js';
import { Pistol } from '../weapons/Pistol.js';
import { Zombie } from '../enemies/Zombie.js';
import { MiniBoss } from '../enemies/MiniBoss.js';
import { SoundManager } from '../audio/SoundManager.js';
import { Minimap } from '../ui/Minimap.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Game state
        this.state = GAME_STATES.MENU;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.missiles = [];
        this.items = [];
        this.particles = [];
        
        // Systems
        this.inputHandler = new InputHandler(canvas);
        this.camera = new Vector2(0, 0);
        this.cameraShake = {
            duration: 0,
            intensity: 0,
            offset: new Vector2(0, 0)
        };
        
        // Wave system
        this.currentWave = 1;
        this.waveTimer = 0;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.waveEnemiesKilled = 0; // 현재 웨이브에서 죽인 적
        this.enemiesPerWave = 15; // 더 많은 적 (15마리)
        this.spawnDelay = 200; // 0.2초마다 스폰 (더 빠르게)
        this.lastSpawnTime = 0;
        this.spawnDistance = 350; // 플레이어로부터 스폰 거리
        this.miniBossSpawned = false; // 미니보스 스폰 여부
        this.miniBossSpawnDelay = 3000; // 미니보스 스폰 대기시간
        this.miniBossSpawnTimer = 0;
        
        // UI
        this.showDebug = false;
        
        // 사운드
        this.soundManager = new SoundManager();
        
        // 미니맵
        const minimapCanvas = document.getElementById('minimap');
        this.minimap = minimapCanvas ? new Minimap(minimapCanvas) : null;
        
        // 업그레이드 시스템
        this.upgradeSystem = new UpgradeSystem();
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupUI();
        this.gameLoop();
    }
    
    setupCanvas() {
        // Set canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Setup context
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Set camera
        this.inputHandler.setCamera(this.camera);
    }
    
    setupUI() {
        // Hide all screens except menu
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('mainMenu').classList.add('active');
        
        // Setup button event listeners
        this.setupButtonEvents();
        
        // Setup sound controls
        this.setupSoundControls();
    }
    
    setupButtonEvents() {
        // Main menu buttons
        const startButton = document.getElementById('startButton');
        if (startButton) {
            // Remove any existing listeners
            startButton.replaceWith(startButton.cloneNode(true));
            const newStartButton = document.getElementById('startButton');
            newStartButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Start button clicked!');
                this.startGame();
            });
        } else {
            console.error('Start button not found!');
        }
        
        const highScoresButton = document.getElementById('highScoresButton');
        if (highScoresButton) {
            highScoresButton.addEventListener('click', () => {
                this.showHighScores();
            });
        }
        
        this.addButtonListener('closeHighScoresButton', () => this.closeHighScores());
        
        // Pause menu buttons
        this.addButtonListener('resumeButton', () => this.resume());
        this.addButtonListener('restartButton', () => this.restart());
        this.addButtonListener('mainMenuButton', () => this.mainMenu());
        
        // Game over buttons
        this.addButtonListener('tryAgainButton', () => this.restart());
        this.addButtonListener('gameOverMenuButton', () => this.mainMenu());
    }
    
    startGame() {
        console.log('Start game button clicked!');
        
        this.state = GAME_STATES.PLAYING;
        
        // Hide menu, show game
        document.getElementById('mainMenu').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        
        // Check if wave progress elements exist
        const killedElement = document.getElementById('enemiesKilledCount');
        const totalElement = document.getElementById('totalEnemiesCount');
        console.log('Wave progress elements:', { killedElement, totalElement });
        
        // Initialize game objects
        this.initializeGame();
        
        console.log('Game started! Player created:', this.player);
    }
    
    initializeGame() {
        // Create player at center
        this.player = new Player(0, 0);
        
        // Add initial weapon
        this.player.addWeapon(new Pistol());
        
        // Reset game state
        this.currentWave = 1;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.waveTimer = 0;
        this.waveEnemiesKilled = 0; // 현재 웨이브에서 죽인 적 수
        this.miniBossSpawned = false;
        this.miniBossSpawnTimer = 0;
        
        // Clear arrays
        this.enemies = [];
        this.bullets = [];
        this.items = [];
        this.particles = [];
        
        // Center camera on player
        this.camera.set(0, 0);
        
        // Force update UI to show initial state
        this.updateUI();
        
        // Also update wave progress immediately
        const totalEnemiesThisWave = this.getTotalEnemiesForWave(this.currentWave);
        const killedElement = document.getElementById('enemiesKilledCount');
        const totalElement = document.getElementById('totalEnemiesCount');
        if (killedElement && totalElement) {
            killedElement.textContent = '0';
            totalElement.textContent = totalEnemiesThisWave;
        }
    }
    
    gameLoop(currentTime = 0) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Limit delta time to prevent large jumps
        this.deltaTime = Math.min(this.deltaTime, 50);
        
        this.update();
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        if (this.state !== GAME_STATES.PLAYING) return;
        
        this.handleInput();
        this.updateGameObjects();
        this.updateWaveSystem();
        this.checkCollisions();
        this.updateCamera();
        this.updateUI();
        
        // 미니맵 업데이트
        if (this.minimap) {
            this.minimap.update(this.deltaTime);
        }
        
        // Check game over
        if (this.player && !this.player.alive) {
            this.gameOver();
        }
    }
    
    handleInput() {
        if (!this.player) return;
        
        // Movement
        const movement = this.inputHandler.getMovementVector();
        this.player.setMoveDirection(movement);
        
        // Aiming
        const mousePos = this.inputHandler.getWorldMousePosition();
        this.player.aimAt(mousePos.x, mousePos.y);
        
        // Shooting
        if (this.inputHandler.isShootingPressed()) {
            this.player.startShooting();
            const bullets = this.player.shoot();
            if (bullets) {
                // 발사 사운드 재생
                this.soundManager.playShoot();
                
                if (Array.isArray(bullets)) {
                    this.bullets.push(...bullets);
                } else {
                    this.bullets.push(bullets);
                }
            }
        } else {
            this.player.stopShooting();
        }
        
        // Use skill
        if (this.inputHandler.isSkillPressed()) {
            const skillResult = this.player.useSkill();
            if (skillResult) {
                // 화면 진동 효과
                this.createScreenShake(400, 12);
                
                // Create enhanced explosion effect
                this.createExplosionEffect(skillResult);
                
                // Create additional visual effects
                this.createSkillVisualEffects(skillResult);
                
                // Play skill sound
                this.soundManager.playExplosion();
                
                // Damage nearby enemies
                this.enemies.forEach(enemy => {
                    const distance = enemy.position.distanceTo(skillResult.position);
                    if (distance <= skillResult.radius) {
                        enemy.takeDamage(skillResult.damage);
                        if (!enemy.alive) {
                            this.onEnemyKilled(enemy);
                        }
                    }
                });
            }
        }
        
        // Pause
        if (this.inputHandler.isPausePressed()) {
            this.pause();
        }
        
        // Debug toggle
        if (this.inputHandler.isKeyPressed('KeyF1')) {
            this.showDebug = !this.showDebug;
        }
    }
    
    updateGameObjects() {
        // Update player
        if (this.player) {
            const prevHealth = this.player.health;
            this.player.update(this.deltaTime);
            
            // 플레이어가 데미지를 받았는지 체크
            if (this.player.health < prevHealth && this.player.alive) {
                this.soundManager.playPlayerHurt();
            }
            
            // Keep player in world bounds
            const worldSize = GAME_CONFIG.WORLD_SIZE;
            this.player.keepInBounds(
                -worldSize / 2, -worldSize / 2,
                worldSize / 2, worldSize / 2
            );
        }
        
        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.setTarget(this.player);
            enemy.update(this.deltaTime);
            
            // 미니보스 미사일 공격 처리
            if (enemy.isMiniBoss && enemy.fireMissile) {
                const now = Date.now();
                // 플레이어의 연사 속도 스탯이 미니보스의 미사일 발사 속도에도 영향을 줌
                const missileFireRateBonus = this.player ? (this.player.fireRateMultiplier || 1) : 1;
                const effectiveMissileCooldown = enemy.missileCooldown / missileFireRateBonus;
                
                if (now - enemy.lastMissileTime > effectiveMissileCooldown) {
                    const missile = enemy.fireMissile();
                    if (missile) {
                        this.createMissile(missile);
                        enemy.lastMissileTime = now;
                    }
                }
            }
            
            // Keep enemies in world bounds
            const worldSize = GAME_CONFIG.WORLD_SIZE;
            enemy.keepInBounds(
                -worldSize / 2, -worldSize / 2,
                worldSize / 2, worldSize / 2
            );
        });
        
        // Update bullets
        this.bullets.forEach(bullet => {
            bullet.update(this.deltaTime);
        });
        
        // Update missiles
        this.missiles.forEach(missile => {
            missile.update(this.deltaTime);
        });
        
        // Update items
        this.items.forEach(item => {
            item.update(this.deltaTime);
        });
        
        // Update particles
        this.particles.forEach(particle => {
            particle.update(this.deltaTime);
        });
        
        // Remove dead objects
        this.cleanupObjects();
    }
    
    updateCamera() {
        if (!this.player) return;
        
        // Follow player with smooth camera
        const targetX = this.player.position.x;
        const targetY = this.player.position.y;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        // Update camera shake
        this.updateCameraShake();
        
        this.inputHandler.setCamera(this.camera);
    }
    
    updateCameraShake() {
        if (this.cameraShake.duration > 0) {
            this.cameraShake.duration -= this.deltaTime;
            
            // Random offset for shake effect
            const intensity = this.cameraShake.intensity * (this.cameraShake.duration / 300);
            this.cameraShake.offset.x = (Math.random() - 0.5) * intensity;
            this.cameraShake.offset.y = (Math.random() - 0.5) * intensity;
        } else {
            this.cameraShake.offset.set(0, 0);
        }
    }
    
    createScreenShake(duration, intensity) {
        this.cameraShake.duration = duration;
        this.cameraShake.intensity = intensity;
    }
    
    cleanupObjects() {
        this.enemies = this.enemies.filter(enemy => enemy.alive);
        this.bullets = this.bullets.filter(bullet => bullet.alive);
        this.missiles = this.missiles.filter(missile => missile.alive);
        this.items = this.items.filter(item => item.alive);
        this.particles = this.particles.filter(particle => particle.alive);
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.state !== GAME_STATES.PLAYING) return;
        
        this.ctx.save();
        
        // Apply camera transform with shake
        this.ctx.translate(
            this.canvas.width / 2 - this.camera.x + this.cameraShake.offset.x,
            this.canvas.height / 2 - this.camera.y + this.cameraShake.offset.y
        );
        
        // Draw grid background
        this.drawGrid();
        
        // Draw game objects
        this.items.forEach(item => item.render(this.ctx));
        this.bullets.forEach(bullet => bullet.render(this.ctx));
        this.missiles.forEach(missile => missile.render(this.ctx));
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        this.particles.forEach(particle => particle.render(this.ctx));
        
        // Debug info
        if (this.showDebug) {
            this.drawDebugInfo();
        }
        
        this.ctx.restore();
        
        // 미니맵 그리기
        if (this.minimap && this.player) {
            this.minimap.draw(this.player, this.enemies);
        }
    }
    
    drawGrid() {
        const worldSize = GAME_CONFIG.WORLD_SIZE;
        const theme = this.getWaveTheme();
        
        // 배경 그라데이션
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, worldSize);
        gradient.addColorStop(0, theme.centerColor);
        gradient.addColorStop(0.7, theme.midColor);
        gradient.addColorStop(1, theme.outerColor);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-worldSize/2, -worldSize/2, worldSize, worldSize);
        
        // 테마별 배경 요소
        this.drawThemeElements(theme);
        
        // 그리드 라인
        this.drawGridLines(theme);
        
        // 중앙 스폰 포인트
        this.drawSpawnPoint();
    }
    
    getWaveTheme() {
        if (this.currentWave <= 3) {
            // 폐허 도시
            return {
                name: 'ruins',
                centerColor: '#1a1a2e',
                midColor: '#16213e',
                outerColor: '#0f1419',
                gridColor: '#2d3748',
                accentColor: '#ff6b35'
            };
        } else if (this.currentWave <= 6) {
            // 황무지
            return {
                name: 'wasteland',
                centerColor: '#2d1810',
                midColor: '#1f1108',
                outerColor: '#0f0804',
                gridColor: '#4a2c17',
                accentColor: '#d4af37'
            };
        } else if (this.currentWave <= 9) {
            // 지하 시설
            return {
                name: 'facility',
                centerColor: '#0d2936',
                midColor: '#1a202c',
                outerColor: '#0a0e13',
                gridColor: '#2d5a6b',
                accentColor: '#00ffff'
            };
        } else {
            // 지옥 차원
            return {
                name: 'hell',
                centerColor: '#4a0e0e',
                midColor: '#2d0a0a',
                outerColor: '#1a0606',
                gridColor: '#8b1538',
                accentColor: '#ff0000'
            };
        }
    }
    
    drawThemeElements(theme) {
        const time = Date.now() * 0.001;
        
        switch(theme.name) {
            case 'ruins':
                this.drawRuinsElements();
                break;
            case 'wasteland':
                this.drawWastelandElements();
                break;
            case 'facility':
                this.drawFacilityElements();
                break;
            case 'hell':
                this.drawHellElements(time);
                break;
        }
    }
    
    drawRuinsElements() {
        // 부서진 건물들
        const buildings = [
            {x: -800, y: -600, w: 120, h: 200},
            {x: 600, y: -400, w: 80, h: 150},
            {x: -400, y: 700, w: 100, h: 180},
            {x: 900, y: 500, w: 60, h: 120}
        ];
        
        this.ctx.fillStyle = '#2a2a3a';
        buildings.forEach(building => {
            this.ctx.fillRect(building.x, building.y, building.w, building.h);
            
            // 건물 창문
            this.ctx.fillStyle = '#ffaa00';
            for (let i = 0; i < 3; i++) {
                this.ctx.fillRect(building.x + 10 + i * 30, building.y + 20, 8, 12);
            }
            this.ctx.fillStyle = '#2a2a3a';
        });
    }
    
    drawWastelandElements() {
        // 메마른 나무와 바위
        const objects = [
            {x: -600, y: -800, type: 'tree'},
            {x: 700, y: -300, type: 'rock'},
            {x: -300, y: 600, type: 'tree'},
            {x: 800, y: 400, type: 'rock'}
        ];
        
        objects.forEach(obj => {
            if (obj.type === 'tree') {
                // 메마른 나무
                this.ctx.strokeStyle = '#654321';
                this.ctx.lineWidth = 8;
                this.ctx.beginPath();
                this.ctx.moveTo(obj.x, obj.y);
                this.ctx.lineTo(obj.x, obj.y - 60);
                this.ctx.stroke();
                
                // 가지들
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(obj.x, obj.y - 30);
                this.ctx.lineTo(obj.x - 20, obj.y - 50);
                this.ctx.moveTo(obj.x, obj.y - 20);
                this.ctx.lineTo(obj.x + 15, obj.y - 40);
                this.ctx.stroke();
            } else {
                // 바위
                this.ctx.fillStyle = '#696969';
                this.ctx.beginPath();
                this.ctx.ellipse(obj.x, obj.y, 40, 25, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawFacilityElements() {
        // 금속 타일들
        const tileSize = 100;
        this.ctx.strokeStyle = '#4a5568';
        this.ctx.lineWidth = 2;
        
        for (let x = -1000; x < 1000; x += tileSize * 2) {
            for (let y = -1000; y < 1000; y += tileSize * 2) {
                this.ctx.strokeRect(x, y, tileSize, tileSize);
                
                // 일부 타일에 패널 표시
                if (Math.random() > 0.8) {
                    this.ctx.fillStyle = '#2d5a6b';
                    this.ctx.fillRect(x + 10, y + 10, tileSize - 20, tileSize - 20);
                }
            }
        }
    }
    
    drawHellElements(time) {
        // 용암 균열
        const cracks = [
            {x: -500, y: -700, length: 200},
            {x: 600, y: -200, length: 150},
            {x: -200, y: 500, length: 180}
        ];
        
        cracks.forEach(crack => {
            const glowIntensity = 0.5 + 0.5 * Math.sin(time * 2);
            this.ctx.strokeStyle = `rgba(255, ${Math.floor(100 + 155 * glowIntensity)}, 0, ${glowIntensity})`;
            this.ctx.lineWidth = 6;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#ff4500';
            
            this.ctx.beginPath();
            this.ctx.moveTo(crack.x, crack.y);
            this.ctx.lineTo(crack.x + crack.length, crack.y + Math.sin(time + crack.x * 0.01) * 30);
            this.ctx.stroke();
            
            this.ctx.shadowBlur = 0;
        });
        
        // 화염 파티클
        for (let i = 0; i < 15; i++) {
            const x = Math.sin(time + i) * 400;
            const y = Math.cos(time * 0.7 + i) * 300;
            const size = 3 + Math.sin(time * 3 + i) * 2;
            
            this.ctx.fillStyle = `rgba(255, ${Math.floor(100 + Math.random() * 155)}, 0, 0.6)`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawGridLines(theme) {
        const gridSize = 100;
        const worldSize = GAME_CONFIG.WORLD_SIZE;
        
        this.ctx.strokeStyle = theme.gridColor;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        
        // 세로선
        for (let x = -worldSize/2; x <= worldSize/2; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, -worldSize/2);
            this.ctx.lineTo(x, worldSize/2);
            this.ctx.stroke();
        }
        
        // 가로선
        for (let y = -worldSize/2; y <= worldSize/2; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(-worldSize/2, y);
            this.ctx.lineTo(worldSize/2, y);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawSpawnPoint() {
        const time = Date.now() * 0.003;
        const pulseSize = 80 + Math.sin(time) * 20;
        
        // 중앙 스폰 포인트
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = 0.6;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 작은 내부 원
        this.ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.globalAlpha = 1;
    }
    
    drawDebugInfo() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'left';
        
        const info = [
            `FPS: ${Math.round(1000 / this.deltaTime)}`,
            `Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`,
            `Enemies: ${this.enemies.length}`,
            `Bullets: ${this.bullets.length}`,
            `Particles: ${this.particles.length}`
        ];
        
        info.forEach((text, index) => {
            this.ctx.fillText(text, this.camera.x - this.canvas.width / 2 + 10, 
                             this.camera.y - this.canvas.height / 2 + 30 + index * 20);
        });
    }
    
    updateUI() {
        if (!this.player) return;
        
        // Update HUD
        document.getElementById('waveNumber').textContent = this.currentWave;
        document.getElementById('score').textContent = this.player.score;
        document.getElementById('combo').textContent = `x${this.player.combo}`;
        
        // Update wave progress
        const totalEnemiesThisWave = this.getTotalEnemiesForWave(this.currentWave);
        const killedElement = document.getElementById('enemiesKilledCount');
        const totalElement = document.getElementById('totalEnemiesCount');
        
        if (killedElement && totalElement) {
            killedElement.textContent = this.waveEnemiesKilled;
            totalElement.textContent = totalEnemiesThisWave;
        } else {
            console.error('Wave progress elements not found!');
        }
        
        // Health bar
        const healthPercent = this.player.getHealthPercent();
        document.getElementById('healthFill').style.width = `${healthPercent * 100}%`;
        document.getElementById('healthText').textContent = 
            `${this.player.health}/${this.player.maxHealth}`;
        
        // Weapon info
        const weapon = this.player.getCurrentWeapon();
        const currentAmmoEl = document.getElementById('currentAmmo');
        const maxAmmoEl = document.getElementById('maxAmmo');
        const weaponIconEl = document.getElementById('weaponIcon');
        
        if (weapon && currentAmmoEl && maxAmmoEl && weaponIconEl) {
            // Check if weapon has infinite ammo (pistol)
            if (weapon.infiniteAmmo) {
                currentAmmoEl.textContent = '∞';
                maxAmmoEl.textContent = '∞';
            } else {
                currentAmmoEl.textContent = weapon.currentAmmo;
                maxAmmoEl.textContent = weapon.magazineSize;
            }
            weaponIconEl.textContent = weapon.icon || '🔫';
        }
        
        // Skill cooldown gauge
        const skillPercent = this.player.getSkillCooldownPercent();
        const skillGaugeFill = document.getElementById('skillGaugeFill');
        const skillGaugeText = document.getElementById('skillGaugeText');
        const skillGaugeContainer = document.querySelector('.skill-gauge-container');
        
        if (skillGaugeFill && skillGaugeText && skillGaugeContainer) {
            const remainingTime = Math.ceil((this.player.skillCooldown || 0) / 1000);
            
            // 게이지 바 업데이트
            skillGaugeFill.style.width = `${skillPercent * 100}%`;
            
            if (skillPercent >= 1) {
                // 스킬 사용 가능
                skillGaugeContainer.classList.add('ready');
                skillGaugeText.textContent = 'BOMB';
                skillGaugeText.style.fontSize = '14px';
            } else {
                // 쿨다운 중
                skillGaugeContainer.classList.remove('ready');
                skillGaugeText.style.fontSize = '16px';
                
                // Show cooldown time (5, 4, 3, 2, 1)
                if (remainingTime > 0) {
                    skillGaugeText.textContent = remainingTime.toString();
                } else {
                    skillGaugeText.textContent = 'BOMB';
                }
            }
        }
    }
    
    pause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
            document.getElementById('pauseMenu').classList.add('active');
        }
    }
    
    resume() {
        if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            document.getElementById('pauseMenu').classList.remove('active');
        }
    }
    
    restart() {
        this.state = GAME_STATES.PLAYING;
        
        // Hide all overlays
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.remove('active');
        });
        
        this.initializeGame();
    }
    
    mainMenu() {
        this.state = GAME_STATES.MENU;
        
        // Show menu, hide game
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('mainMenu').classList.add('active');
        
        // Hide overlays
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.remove('active');
        });
    }
    
    gameOver() {
        this.state = GAME_STATES.GAME_OVER;
        
        // Save high score
        const rank = this.saveHighScore(this.player.score, this.currentWave);
        
        // Update final stats
        document.getElementById('finalScore').textContent = this.player.score.toLocaleString();
        document.getElementById('finalWave').textContent = this.currentWave;
        document.getElementById('enemiesKilled').textContent = this.player.enemiesKilled;
        
        // Show high score notification if it's a new record
        if (rank > 0 && rank <= 10) {
            const finalScoreElement = document.getElementById('finalScore');
            finalScoreElement.innerHTML = `${this.player.score.toLocaleString()} <span style="color: var(--primary-color); font-size: 14px;">(#${rank} Best!)</span>`;
        }
        
        // Show game over screen
        document.getElementById('gameOverScreen').classList.add('active');
        
        console.log('Game Over!');
    }
    
    showHighScores() {
        // Load high scores from localStorage
        const highScores = this.getHighScores();
        const highScoresList = document.getElementById('highScoresList');
        
        if (highScores.length === 0) {
            highScoresList.innerHTML = '<div class="no-scores">No high scores yet!</div>';
        } else {
            highScoresList.innerHTML = '';
            highScores.forEach((score, index) => {
                const scoreItem = document.createElement('div');
                scoreItem.className = 'score-item';
                scoreItem.innerHTML = `
                    <span class="rank">${index + 1}.</span>
                    <span class="score">${score.score.toLocaleString()}</span>
                    <span class="wave">Wave ${score.wave}</span>
                `;
                highScoresList.appendChild(scoreItem);
            });
        }
        
        // Show modal
        document.getElementById('highScoresModal').classList.add('active');
    }
    
    closeHighScores() {
        document.getElementById('highScoresModal').classList.remove('active');
    }
    
    getHighScores() {
        try {
            const scores = localStorage.getItem('lastStandHighScores');
            return scores ? JSON.parse(scores) : [];
        } catch (e) {
            console.error('Error loading high scores:', e);
            return [];
        }
    }
    
    saveHighScore(score, wave) {
        try {
            const highScores = this.getHighScores();
            highScores.push({ score, wave, date: new Date().toISOString() });
            
            // Sort by score (descending) and keep only top 10
            highScores.sort((a, b) => b.score - a.score);
            const topScores = highScores.slice(0, 10);
            
            localStorage.setItem('lastStandHighScores', JSON.stringify(topScores));
            
            // Return rank (1-based)
            return topScores.findIndex(s => s.score === score && s.wave === wave) + 1;
        } catch (e) {
            console.error('Error saving high score:', e);
            return -1;
        }
    }
    
    addButtonListener(id, handler) {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                handler();
            });
        }
    }
    
    setupSoundControls() {
        const soundToggle = document.getElementById('sound-toggle');
        const volumeSlider = document.getElementById('volume-slider');
        
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                const enabled = this.soundManager.toggleSound();
                soundToggle.textContent = enabled ? '🔊' : '🔇';
            });
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.soundManager.setVolume(volume);
            });
            
            // 초기 볼륨 설정
            volumeSlider.value = this.soundManager.volume * 100;
        }
    }
    
    handleResize() {
        this.setupCanvas();
    }
    
    updateWaveSystem() {
        const now = Date.now();
        
        // 웨이브별 적 수 계산 (일반 좀비만)
        const enemiesForWave = this.getEnemiesForWave(this.currentWave);
        
        // 일반 좀비 스폰
        if (this.enemiesSpawned < enemiesForWave) {
            if (now - this.lastSpawnTime > this.spawnDelay) {
                // 한 번에 여러 마리 스폰 (웨이브가 높을수록 더 많이)
                const spawnCount = Math.min(Math.ceil(this.currentWave / 2) + 2, 8); // 3~8마리씩 스폰
                for (let i = 0; i < spawnCount && this.enemiesSpawned < enemiesForWave; i++) {
                    this.spawnEnemy();
                }
                this.lastSpawnTime = now;
            }
        }
        
        // 미니보스 스폰 조건: 일반 좀비 모두 스폰 완료 후 3초 대기
        if (this.enemiesSpawned >= enemiesForWave && !this.miniBossSpawned) {
            const normalZombies = this.enemies.filter(enemy => !enemy.isMiniBoss);
            
            if (normalZombies.length === 0) {
                this.miniBossSpawnTimer += now - this.lastSpawnTime;
                
                if (this.miniBossSpawnTimer >= this.miniBossSpawnDelay) {
                    this.spawnMiniBoss();
                    this.miniBossSpawned = true;
                }
            }
        }
        
        // 웨이브 완료 조건: 모든 적 (일반 + 미니보스) 처치
        if (this.enemies.length === 0 && 
            this.enemiesSpawned >= enemiesForWave && 
            this.miniBossSpawned) {
            this.completeWave();
        }
    }
    
    spawnEnemy() {
        if (!this.player) return;
        
        // 플레이어 주변에 더 가깝게 스폰
        const angle = Math.random() * Math.PI * 2;
        const distance = this.spawnDistance + Math.random() * 100; // 300-400 거리
        
        // 플레이어의 실제 위치 기준으로 스폰
        const x = this.player.position.x + Math.cos(angle) * distance;
        const y = this.player.position.y + Math.sin(angle) * distance;
        
        const enemy = new Zombie(x, y);
        this.enemies.push(enemy);
        this.enemiesSpawned++;
        
        console.log(`Spawned zombie ${this.enemiesSpawned}/${this.getEnemiesForWave(this.currentWave)} at distance ${Math.round(distance)}`);
    }
    
    spawnMiniBoss() {
        if (!this.player) return;
        
        // 미니보스 타입 결정
        const bossType = MiniBoss.getBossTypeForWave(this.currentWave);
        
        // 플레이어 주변에 스폰
        const angle = Math.random() * Math.PI * 2;
        const distance = this.spawnDistance + 100; // 일반 좀비보다 더 멀리
        
        const x = this.player.position.x + Math.cos(angle) * distance;
        const y = this.player.position.y + Math.sin(angle) * distance;
        
        const miniBoss = new MiniBoss(x, y, bossType);
        this.enemies.push(miniBoss);
        
        // 미니보스 등장 사운드
        this.soundManager.playWaveStart();
        
        console.log(`Mini boss spawned: ${bossType} at wave ${this.currentWave}`);
    }
    
    getEnemiesForWave(wave) {
        // 웨이브별 고정 적 수 (일반 좀비 + 미니보스 1마리)
        switch(wave) {
            case 1: return 14;  // 웨이브 1: 14마리 + 보스 1마리
            case 2: return 19;  // 웨이브 2: 19마리 + 보스 1마리
            case 3: return 24;  // 웨이브 3: 24마리 + 보스 1마리
            case 4: return 29;  // 웨이브 4: 29마리 + 보스 1마리
            case 5: return 34;  // 웨이브 5: 34마리 + 보스 1마리
            default: return 34 + (wave - 5) * 5; // 이후 5마리씩 증가 + 보스 1마리
        }
    }
    
    getTotalEnemiesForWave(wave) {
        // UI 표시용 - 일반 좀비 + 미니보스 포함
        return this.getEnemiesForWave(wave) + 1;
    }
    
    completeWave() {
        console.log(`Wave ${this.currentWave} completed!`);
        
        // 플레이어 체력 25% 회복
        const healAmount = this.player.maxHealth * 0.25;
        this.player.heal(healAmount);
        
        // 업그레이드 화면 표시
        this.state = GAME_STATES.PAUSED;
        this.upgradeSystem.showUpgradeScreen(this.player, (upgradeKey, effect) => {
            this.applyUpgradeToPlayer(upgradeKey, effect);
            this.nextWave();
        });
    }
    
    nextWave() {
        this.currentWave++;
        this.enemiesSpawned = 0;
        this.waveEnemiesKilled = 0; // 웨이브 킬 카운트 리셋
        this.miniBossSpawned = false; // 미니보스 스폰 리셋
        this.miniBossSpawnTimer = 0;
        this.spawnDelay = Math.max(100, this.spawnDelay - 20); // 더 빠르게 감소, 최소 0.1초
        console.log(`Wave ${this.currentWave} started! Enemies: ${this.getTotalEnemiesForWave(this.currentWave)}`);
        
        // 게임 재개
        this.state = GAME_STATES.PLAYING;
        
        // 웨이브 시작 사운드 재생
        this.soundManager.playWaveStart();
        
        // Force immediate UI update for new wave
        this.updateUI();
    }
    
    applyUpgradeToPlayer(upgradeKey, effect) {
        console.log(`Applying upgrade ${upgradeKey}:`, effect);
        
        // 플레이어에게 업그레이드 효과 적용
        if (effect.maxHealth) {
            this.player.maxHealth += effect.maxHealth;
            if (effect.healAmount) {
                this.player.heal(effect.healAmount);
            }
        }
        
        if (effect.speedMultiplier) {
            this.player.speedMultiplier = (this.player.speedMultiplier || 1) * effect.speedMultiplier;
        }
        
        if (effect.damageMultiplier) {
            this.player.damageMultiplier = (this.player.damageMultiplier || 1) * effect.damageMultiplier;
        }
        
        if (effect.fireRateMultiplier) {
            this.player.fireRateMultiplier = (this.player.fireRateMultiplier || 1) * effect.fireRateMultiplier;
        }
        
        if (effect.skillCooldownMultiplier) {
            this.player.skillCooldownMultiplier = (this.player.skillCooldownMultiplier || 1) * effect.skillCooldownMultiplier;
        }
        
        if (effect.healthRegenRate) {
            this.player.healthRegenRate = (this.player.healthRegenRate || 0) + effect.healthRegenRate;
        }
        
        // 다른 효과들도 필요에 따라 추가
    }
    
    checkCollisions() {
        // Bullet vs Enemy collisions
        this.bullets.forEach(bullet => {
            if (!bullet.alive) return;
            
            this.enemies.forEach(enemy => {
                if (!enemy.alive || !bullet.canHit(enemy)) return;
                
                const distance = bullet.position.distanceTo(enemy.position);
                if (distance < bullet.radius + enemy.radius) {
                    console.log('Bullet hit enemy!');
                    // Check if this hit kills the enemy
                    const enemyKilled = bullet.onHit(enemy);
                    console.log('Enemy killed?', enemyKilled);
                    
                    // If enemy was killed, handle it
                    if (enemyKilled) {
                        console.log('Calling onEnemyKilled...');
                        this.onEnemyKilled(enemy);
                    }
                }
            });
        });
        
        // Enemy vs Player collisions (handled by enemy attack logic)
        // Already implemented in Enemy.js
    }
    
    onEnemyKilled(enemy) {
        this.enemiesKilled++;
        this.waveEnemiesKilled++; // 현재 웨이브 킬 카운트 증가
        console.log(`Enemy killed! Wave progress: ${this.waveEnemiesKilled}/${this.getEnemiesForWave(this.currentWave)}`);
        
        // 적 죽음 사운드 재생
        this.soundManager.playEnemyDeath();
        
        // 즉시 UI 업데이트
        const killedElement = document.getElementById('enemiesKilledCount');
        const totalElement = document.getElementById('totalEnemiesCount');
        if (killedElement && totalElement) {
            killedElement.textContent = this.waveEnemiesKilled;
            totalElement.textContent = this.getTotalEnemiesForWave(this.currentWave);
            console.log(`UI Updated: ${this.waveEnemiesKilled}/${this.getTotalEnemiesForWave(this.currentWave)}`);
        } else {
            console.error('Cannot find wave progress elements!');
        }
        
        this.player.addScore(enemy.scoreValue);
        this.player.addKill();
        
        // Chance to drop items
        if (Math.random() < 0.1) {
            // TODO: Spawn item at enemy position
        }
    }
    
    createExplosionEffect(explosion) {
        // Create main explosion flash
        const flash = {
            position: explosion.position.copy(),
            radius: explosion.radius * 1.5,
            lifetime: 150,
            maxLifetime: 150,
            alive: true,
            update: function(deltaTime) {
                this.lifetime -= deltaTime;
                if (this.lifetime <= 0) {
                    this.alive = false;
                }
            },
            render: function(ctx) {
                const alpha = this.lifetime / this.maxLifetime;
                const size = this.radius * (1 + (1 - alpha) * 0.5);
                
                // Bright flash with gradient
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                
                // Create radial gradient for more realistic explosion
                const gradient = ctx.createRadialGradient(
                    this.position.x, this.position.y, 0,
                    this.position.x, this.position.y, size
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                gradient.addColorStop(0.3, `rgba(255, 200, 0, ${alpha * 0.9})`);
                gradient.addColorStop(0.7, `rgba(255, 100, 0, ${alpha * 0.6})`);
                gradient.addColorStop(1, `rgba(0, 255, 136, ${alpha * 0.3})`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, size, 0, Math.PI * 2);
                ctx.fill();
                
                // Inner bright core
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.shadowBlur = 30;
                ctx.shadowColor = '#00ff88';
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };
        this.particles.push(flash);
        
        // Create explosion particles
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.3;
            const speed = Math.random() * 300 + 150;
            const particle = {
                position: explosion.position.copy(),
                velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
                radius: Math.random() * 8 + 4,
                lifetime: 800 + Math.random() * 400,
                maxLifetime: 1200,
                color: ['#00ff88', '#ffffff', '#88ffaa', '#ffff00', '#ff8800'][Math.floor(Math.random() * 5)],
                alive: true,
                update: function(deltaTime) {
                    this.lifetime -= deltaTime;
                    this.position.x += this.velocity.x * deltaTime / 1000;
                    this.position.y += this.velocity.y * deltaTime / 1000;
                    this.velocity.x *= 0.95;
                    this.velocity.y *= 0.95;
                    this.radius *= 0.98;
                    if (this.lifetime <= 0 || this.radius < 0.5) {
                        this.alive = false;
                    }
                },
                render: function(ctx) {
                    const alpha = this.lifetime / this.maxLifetime;
                    ctx.save();
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = this.color;
                    ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            };
            this.particles.push(particle);
        }
        
        // Create multiple shockwaves
        for (let i = 0; i < 3; i++) {
            const shockwave = {
                position: explosion.position.copy(),
                radius: 0,
                maxRadius: explosion.radius * (1 + i * 0.3),
                lifetime: 400 + i * 100,
                maxLifetime: 400 + i * 100,
                delay: i * 50,
                alive: true,
                update: function(deltaTime) {
                    if (this.delay > 0) {
                        this.delay -= deltaTime;
                        return;
                    }
                    this.lifetime -= deltaTime;
                    this.radius = (1 - this.lifetime / this.maxLifetime) * this.maxRadius;
                    if (this.lifetime <= 0) {
                        this.alive = false;
                    }
                },
                render: function(ctx) {
                    if (this.delay > 0) return;
                    const alpha = this.lifetime / this.maxLifetime;
                    ctx.strokeStyle = `rgba(0, 255, 136, ${alpha * 0.6})`;
                    ctx.lineWidth = 4 - i;
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            };
            this.particles.push(shockwave);
        }
    }
    
    createSkillVisualEffects(explosion) {
        // Create lightning bolts radiating from center
        const boltCount = 8;
        for (let i = 0; i < boltCount; i++) {
            const angle = (Math.PI * 2 / boltCount) * i;
            const lightning = {
                position: explosion.position.copy(),
                angle: angle,
                length: explosion.radius * 1.2,
                maxLength: explosion.radius * 1.5,
                segments: 12,
                lifetime: 200,
                maxLifetime: 200,
                alive: true,
                update: function(deltaTime) {
                    this.lifetime -= deltaTime;
                    if (this.lifetime <= 0) {
                        this.alive = false;
                    }
                },
                render: function(ctx) {
                    const alpha = this.lifetime / this.maxLifetime;
                    const progress = 1 - alpha;
                    const currentLength = this.length * progress;
                    
                    ctx.save();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
                    ctx.lineWidth = 3;
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#00ff88';
                    
                    // Draw zigzag lightning
                    ctx.beginPath();
                    let x = this.position.x;
                    let y = this.position.y;
                    ctx.moveTo(x, y);
                    
                    for (let j = 1; j <= this.segments; j++) {
                        const segmentLength = currentLength / this.segments;
                        const nextX = x + Math.cos(this.angle) * segmentLength;
                        const nextY = y + Math.sin(this.angle) * segmentLength;
                        
                        // Add random offset for zigzag effect
                        const offsetX = (Math.random() - 0.5) * 20;
                        const offsetY = (Math.random() - 0.5) * 20;
                        
                        ctx.lineTo(nextX + offsetX, nextY + offsetY);
                        x = nextX;
                        y = nextY;
                    }
                    ctx.stroke();
                    ctx.restore();
                }
            };
            this.particles.push(lightning);
        }
        
        // Create energy rings
        for (let i = 0; i < 5; i++) {
            const ring = {
                position: explosion.position.copy(),
                radius: 0,
                maxRadius: explosion.radius * (0.5 + i * 0.2),
                lifetime: 600 + i * 50,
                maxLifetime: 600 + i * 50,
                delay: i * 30,
                alive: true,
                update: function(deltaTime) {
                    if (this.delay > 0) {
                        this.delay -= deltaTime;
                        return;
                    }
                    this.lifetime -= deltaTime;
                    this.radius = (1 - this.lifetime / this.maxLifetime) * this.maxRadius;
                    if (this.lifetime <= 0) {
                        this.alive = false;
                    }
                },
                render: function(ctx) {
                    if (this.delay > 0) return;
                    const alpha = this.lifetime / this.maxLifetime;
                    
                    ctx.save();
                    ctx.strokeStyle = `rgba(0, 255, 136, ${alpha * 0.4})`;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            };
            this.particles.push(ring);
        }
        
        // Create screen distortion effect
        const distortion = {
            position: explosion.position.copy(),
            radius: explosion.radius,
            lifetime: 150,
            maxLifetime: 150,
            alive: true,
            update: function(deltaTime) {
                this.lifetime -= deltaTime;
                if (this.lifetime <= 0) {
                    this.alive = false;
                }
            },
            render: function(ctx) {
                const alpha = this.lifetime / this.maxLifetime;
                const size = this.radius * (1 + (1 - alpha) * 0.3);
                
                // Create radial gradient for distortion
                const gradient = ctx.createRadialGradient(
                    this.position.x, this.position.y, 0,
                    this.position.x, this.position.y, size
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.1})`);
                gradient.addColorStop(0.5, `rgba(0, 255, 136, ${alpha * 0.05})`);
                gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
                
                ctx.save();
                ctx.globalCompositeOperation = 'difference';
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };
        this.particles.push(distortion);
    }
    
    createMissile(missileData) {
        const game = this; // Game 인스턴스 참조
        const missile = {
            position: missileData.position.copy(),
            velocity: missileData.direction.multiply(missileData.speed),
            damage: missileData.damage,
            explosionRadius: missileData.explosionRadius,
            lifetime: missileData.lifetime,
            maxLifetime: missileData.lifetime,
            homingStrength: missileData.homingStrength,
            alive: true,
            target: this.player,
            
            update: function(deltaTime) {
                if (!this.alive) return;
                
                this.lifetime -= deltaTime;
                if (this.lifetime <= 0) {
                    this.explode();
                    return;
                }
                
                // 유도 미사일 로직
                if (this.target && this.homingStrength > 0) {
                    const toTarget = new Vector2(
                        this.target.position.x - this.position.x,
                        this.target.position.y - this.position.y
                    ).normalize();
                    
                    this.velocity.add(toTarget.multiply(this.homingStrength * deltaTime));
                    this.velocity.normalize().multiply(missileData.speed);
                }
                
                // 이동
                this.position.add(this.velocity.copy().multiply(deltaTime / 1000));
                
                // 플레이어와 충돌 검사
                if (this.target) {
                    const distance = this.position.distanceTo(this.target.position);
                    if (distance < 30) {
                        this.explode();
                    }
                }
            },
            
            explode: function() {
                this.alive = false;
                
                // 폭발 이팩트 생성
                game.createExplosionEffect({
                    position: this.position.copy(),
                    radius: this.explosionRadius,
                    damage: this.damage
                });
                
                // 플레이어에게 데미지
                const distanceToPlayer = this.position.distanceTo(this.target.position);
                if (distanceToPlayer <= this.explosionRadius) {
                    this.target.takeDamage(this.damage);
                }
                
                // 화면 진동
                game.createScreenShake(200, 5);
                
                // 소리 재생
                game.soundManager.playExplosion();
            },
            
            render: function(ctx) {
                if (!this.alive) return;
                
                // 미사일 모양
                ctx.save();
                
                // 미사일 방향으로 회전
                const angle = Math.atan2(this.velocity.y, this.velocity.x);
                ctx.translate(this.position.x, this.position.y);
                ctx.rotate(angle);
                
                // 미사일 모양 그리기
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.ellipse(0, 0, 15, 5, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 미사일 바디
                ctx.fillStyle = '#ffaa44';
                ctx.beginPath();
                ctx.ellipse(-5, 0, 8, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 꽤리
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(5, 0, 3, 2, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 추진체 효과
                const trailLength = 20;
                const trailAlpha = this.lifetime / this.maxLifetime;
                
                ctx.strokeStyle = `rgba(255, 100, 100, ${trailAlpha * 0.5})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-trailLength, 0);
                ctx.lineTo(-5, 0);
                ctx.stroke();
                
                ctx.restore();
            }
        };
        
        // 미사일 예고 사운드
        this.soundManager.playShoot();
        
        this.missiles.push(missile);
    }
}