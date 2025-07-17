import { Weapon } from './Weapon.js';

export class Shotgun extends Weapon {
    constructor() {
        super({
            name: 'Shotgun',
            icon: '🔫',
            damage: 40,
            fireRate: 800, // 낮은 연사력
            magazineSize: 6,
            reloadTime: 2000,
            bulletSpeed: 600,
            spread: 25, // 넓은 산탄
            bulletCount: 8, // 8개의 펠릿
            penetration: 0,
            infiniteAmmo: false,
            muzzleFlashSize: 25,
            range: 300 // 짧은 사거리
        });
    }
}