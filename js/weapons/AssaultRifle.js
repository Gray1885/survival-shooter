import { Weapon } from './Weapon.js';

export class AssaultRifle extends Weapon {
    constructor() {
        super({
            name: 'Assault Rifle',
            icon: '🔫',
            damage: 35,
            fireRate: 120, // 빠른 연사력
            magazineSize: 30,
            reloadTime: 2500,
            bulletSpeed: 900,
            spread: 8,
            bulletCount: 1,
            penetration: 1,
            infiniteAmmo: false,
            muzzleFlashSize: 20,
            range: 800
        });
    }
}