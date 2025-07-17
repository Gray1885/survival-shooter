import { Weapon } from './Weapon.js';

export class Sniper extends Weapon {
    constructor() {
        super({
            name: 'Sniper Rifle',
            icon: '🎯',
            damage: 120,
            fireRate: 1500, // 매우 느린 연사력
            magazineSize: 5,
            reloadTime: 3000,
            bulletSpeed: 1500,
            spread: 0, // 완벽한 정확도
            bulletCount: 1,
            penetration: 3, // 높은 관통력
            infiniteAmmo: false,
            muzzleFlashSize: 30,
            range: 1200 // 긴 사거리
        });
    }
}