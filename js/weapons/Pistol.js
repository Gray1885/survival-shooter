import { Weapon } from './Weapon.js';

export class Pistol extends Weapon {
    constructor() {
        super({
            name: 'Pistol',
            icon: '🔫',
            damage: 25,
            fireRate: 300, // 200 RPM
            magazineSize: 12,
            reloadTime: 1500,
            bulletSpeed: 800,
            spread: 5,
            bulletCount: 1,
            penetration: 0,
            infiniteAmmo: true, // Pistol has infinite ammo as starter weapon
            muzzleFlashSize: 15
        });
    }
}