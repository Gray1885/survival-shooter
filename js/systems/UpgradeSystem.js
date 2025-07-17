export class UpgradeSystem {
    constructor() {
        this.upgrades = {
            vitality: {
                name: '💪 체력 강화',
                description: ['최대 체력 +25', '최대 체력 +40, 즉시 회복', '최대 체력 +60, 데미지 감소 5%'],
                maxLevel: 3,
                currentLevel: 0,
                icon: '💪',
                effects: [
                    { maxHealth: 25, healAmount: 25 },
                    { maxHealth: 40, healAmount: 40 },
                    { maxHealth: 60, healAmount: 60, damageReduction: 0.05 }
                ]
            },
            agility: {
                name: '🏃 민첩성',
                description: ['이동속도 +20%', '이동속도 +35%, 회피 5%', '이동속도 +50%, 대시 거리 증가'],
                maxLevel: 3,
                currentLevel: 0,
                icon: '🏃',
                effects: [
                    { speedMultiplier: 1.2 },
                    { speedMultiplier: 1.35, dodgeChance: 0.05 },
                    { speedMultiplier: 1.5, dashDistance: 1.5 }
                ]
            },
            firepower: {
                name: '🔥 화력 증강',
                description: ['데미지 +30%', '데미지 +50%, 치명타 +10%', '데미지 +75%, 관통 +1'],
                maxLevel: 3,
                currentLevel: 0,
                icon: '🔥',
                effects: [
                    { damageMultiplier: 1.3 },
                    { damageMultiplier: 1.5, critChance: 0.1 },
                    { damageMultiplier: 1.75, penetration: 1 }
                ]
            },
            rateOfFire: {
                name: '⚡ 연사력',
                description: ['발사속도 +25%', '발사속도 +45%, 재장전 -20%', '발사속도 +70%, 탄창 +50%'],
                maxLevel: 3,
                currentLevel: 0,
                icon: '⚡',
                effects: [
                    { fireRateMultiplier: 1.25 },
                    { fireRateMultiplier: 1.45, reloadSpeedMultiplier: 1.2 },
                    { fireRateMultiplier: 1.7, magazineMultiplier: 1.5 }
                ]
            },
            skillPower: {
                name: '🌟 스킬 마스터',
                description: ['폭발 범위 +30%', '폭발 범위 +50%, 데미지 +50%', '폭발 범위 +70%, 데미지 +100%, 2번 사용'],
                maxLevel: 3,
                currentLevel: 0,
                icon: '🌟',
                effects: [
                    { skillRangeMultiplier: 1.3 },
                    { skillRangeMultiplier: 1.5, skillDamageMultiplier: 1.5 },
                    { skillRangeMultiplier: 1.7, skillDamageMultiplier: 2.0, skillCharges: 2 }
                ]
            },
            survivability: {
                name: '🩹 생존력',
                description: ['초당 3 HP 회복', '초당 5 HP, 무적시간 +50%', '초당 8 HP, 부활 1회'],
                maxLevel: 3,
                currentLevel: 0,
                icon: '🩹',
                effects: [
                    { healthRegenRate: 3 },
                    { healthRegenRate: 5, invulnerabilityMultiplier: 1.5 },
                    { healthRegenRate: 8, reviveCount: 1 }
                ]
            }
        };
        
        this.isUpgradeScreenActive = false;
        this.selectedUpgrades = [];
    }
    
    getRandomUpgrades(count = 3) {
        const availableUpgrades = Object.keys(this.upgrades).filter(key => {
            return this.upgrades[key].currentLevel < this.upgrades[key].maxLevel;
        });
        
        if (availableUpgrades.length === 0) {
            return []; // 모든 업그레이드 완료
        }
        
        // 랜덤하게 섞어서 선택
        const shuffled = availableUpgrades.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, availableUpgrades.length));
    }
    
    showUpgradeScreen(player, callback) {
        this.isUpgradeScreenActive = true;
        this.selectedUpgrades = this.getRandomUpgrades(3);
        
        // 업그레이드 화면 HTML 생성
        this.createUpgradeUI(callback);
    }
    
    createUpgradeUI(callback) {
        // 기존 업그레이드 화면 제거
        const existingScreen = document.getElementById('upgradeScreen');
        if (existingScreen) {
            existingScreen.remove();
        }
        
        const upgradeScreen = document.createElement('div');
        upgradeScreen.id = 'upgradeScreen';
        upgradeScreen.className = 'screen overlay';
        upgradeScreen.style.display = 'flex';
        
        const content = document.createElement('div');
        content.className = 'upgrade-content';
        
        content.innerHTML = `
            <h2>레벨 업!</h2>
            <p>능력을 선택하세요</p>
            <div class="upgrade-options">
                ${this.selectedUpgrades.map((upgradeKey, index) => {
                    const upgrade = this.upgrades[upgradeKey];
                    const nextLevel = upgrade.currentLevel;
                    return `
                        <div class="upgrade-option" data-upgrade="${upgradeKey}">
                            <div class="upgrade-icon">${upgrade.icon}</div>
                            <div class="upgrade-info">
                                <h3>${upgrade.name}</h3>
                                <p>${upgrade.description[nextLevel]}</p>
                                <span class="upgrade-level">레벨 ${nextLevel + 1}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="upgrade-timer">
                <span id="upgradeTimer">10</span>초 남음
            </div>
        `;
        
        upgradeScreen.appendChild(content);
        document.getElementById('gameContainer').appendChild(upgradeScreen);
        
        // 타이머 시작
        this.startUpgradeTimer(callback);
        
        // 클릭 이벤트 추가
        content.querySelectorAll('.upgrade-option').forEach(option => {
            option.addEventListener('click', () => {
                const upgradeKey = option.getAttribute('data-upgrade');
                this.selectUpgrade(upgradeKey, callback);
            });
        });
    }
    
    startUpgradeTimer(callback) {
        let timeLeft = 10;
        const timerElement = document.getElementById('upgradeTimer');
        
        const timer = setInterval(() => {
            timeLeft--;
            if (timerElement) {
                timerElement.textContent = timeLeft;
            }
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                // 랜덤 선택
                const randomUpgrade = this.selectedUpgrades[Math.floor(Math.random() * this.selectedUpgrades.length)];
                this.selectUpgrade(randomUpgrade, callback);
            }
        }, 1000);
    }
    
    selectUpgrade(upgradeKey, callback) {
        if (!this.upgrades[upgradeKey] || this.upgrades[upgradeKey].currentLevel >= this.upgrades[upgradeKey].maxLevel) {
            return;
        }
        
        const upgrade = this.upgrades[upgradeKey];
        const effect = upgrade.effects[upgrade.currentLevel];
        
        // 업그레이드 적용
        this.applyUpgrade(upgradeKey, effect);
        upgrade.currentLevel++;
        
        // 화면 제거
        const upgradeScreen = document.getElementById('upgradeScreen');
        if (upgradeScreen) {
            upgradeScreen.remove();
        }
        
        this.isUpgradeScreenActive = false;
        
        // 콜백 실행
        if (callback) {
            callback(upgradeKey, effect);
        }
    }
    
    applyUpgrade(upgradeKey, effect) {
        // 업그레이드 효과는 Player 클래스에서 적용
        console.log(`Applied upgrade: ${upgradeKey}`, effect);
    }
    
    getUpgradeMultipliers() {
        // 현재 적용된 모든 업그레이드 효과 반환
        const multipliers = {
            speedMultiplier: 1,
            damageMultiplier: 1,
            fireRateMultiplier: 1,
            skillCooldownMultiplier: 1,
            skillRangeMultiplier: 1,
            skillDamageMultiplier: 1,
            reloadSpeedMultiplier: 1,
            magazineMultiplier: 1,
            damageReduction: 0,
            dodgeChance: 0,
            critChance: 0,
            penetration: 0,
            healthRegenRate: 0,
            invulnerabilityMultiplier: 1,
            dashDistance: 1,
            skillCharges: 1,
            reviveCount: 0
        };
        
        Object.keys(this.upgrades).forEach(key => {
            const upgrade = this.upgrades[key];
            for (let i = 0; i < upgrade.currentLevel; i++) {
                const effect = upgrade.effects[i];
                Object.keys(effect).forEach(statKey => {
                    if (multipliers.hasOwnProperty(statKey)) {
                        if (statKey.includes('Multiplier') || statKey.includes('Multi')) {
                            multipliers[statKey] *= effect[statKey];
                        } else {
                            multipliers[statKey] += effect[statKey];
                        }
                    }
                });
            }
        });
        
        return multipliers;
    }
}