// Game Constants
export const GAME_CONFIG = {
    CANVAS_WIDTH: 1920,
    CANVAS_HEIGHT: 1080,
    WORLD_SIZE: 4000, // Larger than viewport for movement (확대: 2000 -> 4000)
    
    // Player
    PLAYER: {
        MAX_HEALTH: 100,
        SPEED: 300, // pixels per second
        RADIUS: 20,
        DASH_SPEED: 800,
        DASH_DURATION: 200, // ms
        DASH_COOLDOWN: 2000, // ms
        INVULNERABILITY_TIME: 100, // ms after being hit
    },
    
    // Combat
    COMBAT: {
        BASE_DAMAGE_MULTIPLIER: 1,
        CRIT_CHANCE: 0.1,
        CRIT_MULTIPLIER: 2,
        COMBO_TIMEOUT: 2000, // ms
        COMBO_MULTIPLIERS: [1, 1.5, 2, 2.5, 3, 4, 5],
    },
    
    // Wave System
    WAVES: {
        INITIAL_ENEMY_COUNT: 10,
        ENEMY_INCREASE_PER_WAVE: 5,
        SPAWN_DELAY_MIN: 500, // ms
        SPAWN_DELAY_MAX: 2000, // ms
        WAVE_BREAK_TIME: 5000, // ms between waves
        BOSS_WAVE_INTERVAL: 5,
    },
    
    // Spawn System
    SPAWN_DISTANCE: 400, // Distance from player to spawn enemies
    
    // Physics
    PHYSICS: {
        FRICTION: 0.9,
        BULLET_SPEED: 1000,
        KNOCKBACK_FORCE: 200,
    },
    
    // UI
    UI: {
        MINIMAP_SIZE: 150,
        MINIMAP_SCALE: 0.1,
        DAMAGE_NUMBER_DURATION: 1000,
        HUD_OPACITY: 0.8,
    },
    
    // Colors
    COLORS: {
        PLAYER: '#00ff88',
        ENEMY_ZOMBIE: '#666666',
        ENEMY_RUNNER: '#ff6600',
        ENEMY_TANK: '#0066ff',
        ENEMY_SHOOTER: '#ff00ff',
        ENEMY_BOMBER: '#ffff00',
        BULLET_PLAYER: '#00ffff',
        BULLET_ENEMY: '#ff0000',
        HEALTH_BAR: '#ff3333',
        ITEM_GLOW: '#ffffff',
        GRID: '#1a1a1a',
    }
};

// Game States
export const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    WAVE_COMPLETE: 'wave_complete',
};

// Enemy Types
export const ENEMY_TYPES = {
    ZOMBIE: 'zombie',
    RUNNER: 'runner',
    TANK: 'tank',
    SHOOTER: 'shooter',
    BOMBER: 'bomber',
    BOSS: 'boss',
};

// Item Types
export const ITEM_TYPES = {
    HEALTH_SMALL: 'health_small',
    HEALTH_LARGE: 'health_large',
    AMMO: 'ammo',
    SPEED_BOOST: 'speed_boost',
    DAMAGE_BOOST: 'damage_boost',
    SHIELD: 'shield',
    BOMB: 'bomb',
};

// Weapon Types
export const WEAPON_TYPES = {
    PISTOL: 'pistol',
    SHOTGUN: 'shotgun',
    MACHINE_GUN: 'machine_gun',
    SNIPER: 'sniper',
    ROCKET_LAUNCHER: 'rocket_launcher',
};

// Input Keys
export const KEYS = {
    W: 'KeyW',
    A: 'KeyA',
    S: 'KeyS',
    D: 'KeyD',
    R: 'KeyR',
    SPACE: 'Space',
    ESC: 'Escape',
    ONE: 'Digit1',
    TWO: 'Digit2',
    THREE: 'Digit3',
};

// Directions
export const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
    UP_LEFT: { x: -0.707, y: -0.707 },
    UP_RIGHT: { x: 0.707, y: -0.707 },
    DOWN_LEFT: { x: -0.707, y: 0.707 },
    DOWN_RIGHT: { x: 0.707, y: 0.707 },
};