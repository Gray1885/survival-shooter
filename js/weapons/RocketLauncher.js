import { Weapon } from './Weapon.js';

export class RocketLauncher extends Weapon {
    constructor() {
        super({
            name: 'Rocket Launcher',
            icon: '🚀',
            damage: 200,
            fireRate: 2500, // 매우 느린 연사력
            magazineSize: 1,
            reloadTime: 4000,
            bulletSpeed: 500,
            spread: 3,
            bulletCount: 1,
            penetration: 0,
            infiniteAmmo: false,
            muzzleFlashSize: 40,
            range: 600,
            explosionRadius: 100, // 폭발 반경
            explosionDamage: 150 // 폭발 데미지
        });
        
        this.isExplosive = true;
    }
}