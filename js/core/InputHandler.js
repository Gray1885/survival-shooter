import { Vector2 } from '../utils/Vector2.js';
import { KEYS } from '../config/constants.js';

export class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = new Set();
        this.mousePosition = new Vector2(0, 0);
        this.worldMousePosition = new Vector2(0, 0);
        this.isMouseDown = false;
        this.camera = null;
        
        // 게임 캔버스에 포커스를 주고 필요한 속성 설정
        this.canvas.tabIndex = 0;
        this.canvas.style.outline = 'none';
        this.canvas.focus();
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
            
            // Prevent default for game keys
            if (Object.values(KEYS).includes(e.code)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePosition.set(
                e.clientX - rect.left,
                e.clientY - rect.top
            );
            this.updateWorldMousePosition();
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.isMouseDown = true;
                e.preventDefault();
                
                // 캔버스에 포커스를 주어 키보드 입력을 보장
                this.canvas.focus();
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) { // Left click
                this.isMouseDown = false;
                e.preventDefault();
            }
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevent right-click menu
        });
        
        // Only clear keys when window loses focus completely
        window.addEventListener('blur', () => {
            // 윈도우 자체가 포커스를 잃었을 때만 키 초기화
            this.keys.clear();
            this.isMouseDown = false;
        });
        
        // 게임 캔버스가 포커스를 잃었을 때 - 더 관대하게 처리
        this.canvas.addEventListener('blur', () => {
            // 짧은 지연 후에 실제로 포커스를 잃었는지 확인
            setTimeout(() => {
                // 다른 활성 요소가 있고 그것이 게임 UI가 아닌 경우에만 키 초기화
                const activeElement = document.activeElement;
                if (activeElement && activeElement !== this.canvas && 
                    !activeElement.closest('.game-ui') && 
                    !activeElement.closest('canvas')) {
                    this.keys.clear();
                    this.isMouseDown = false;
                }
            }, 200);
        });
    }
    
    updateWorldMousePosition() {
        if (this.camera) {
            this.worldMousePosition.set(
                this.mousePosition.x - this.canvas.width / 2 + this.camera.x,
                this.mousePosition.y - this.canvas.height / 2 + this.camera.y
            );
        } else {
            this.worldMousePosition = this.mousePosition.copy();
        }
    }
    
    setCamera(camera) {
        this.camera = camera;
        this.updateWorldMousePosition();
    }
    
    isKeyPressed(key) {
        return this.keys.has(key);
    }
    
    isAnyKeyPressed(keyList) {
        return keyList.some(key => this.keys.has(key));
    }
    
    getMovementVector() {
        const movement = new Vector2(0, 0);
        
        if (this.isKeyPressed(KEYS.W)) movement.y -= 1;
        if (this.isKeyPressed(KEYS.S)) movement.y += 1;
        if (this.isKeyPressed(KEYS.A)) movement.x -= 1;
        if (this.isKeyPressed(KEYS.D)) movement.x += 1;
        
        // Normalize diagonal movement
        if (movement.magnitude() > 0) {
            movement.normalize();
        }
        
        return movement;
    }
    
    isShootingPressed() {
        return this.isMouseDown;
    }
    
    isSkillPressed() {
        return this.isKeyPressed(KEYS.SPACE);
    }
    
    isReloadPressed() {
        return this.isKeyPressed(KEYS.R);
    }
    
    isPausePressed() {
        return this.isKeyPressed(KEYS.ESC);
    }
    
    getWeaponSwitchKey() {
        if (this.isKeyPressed(KEYS.ONE)) return 0;
        if (this.isKeyPressed(KEYS.TWO)) return 1;
        if (this.isKeyPressed(KEYS.THREE)) return 2;
        return -1;
    }
    
    getWorldMousePosition() {
        return this.worldMousePosition.copy();
    }
    
    getScreenMousePosition() {
        return this.mousePosition.copy();
    }
}