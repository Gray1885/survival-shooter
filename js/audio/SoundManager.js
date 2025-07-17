export class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        
        // 사운드 목록 정의
        this.soundList = {
            shoot: { src: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE', volume: 0.3 },
            enemyHit: { src: 'data:audio/wav;base64,UklGRkwCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSgCAAD//wAAAAC8/7z/vP+8/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', volume: 0.4 },
            enemyDeath: { src: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE', volume: 0.5 },
            playerHurt: { src: 'data:audio/wav;base64,UklGRkwCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSgCAAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA', volume: 0.6 },
            reload: { src: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE', volume: 0.3 },
            waveStart: { src: 'data:audio/wav;base64,UklGRkwCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSgCAAAAAAC8/wAAvP8AAAAAAAC8/wAAvP8AAAAAAAC8/wAAvP8AAAAAAAC8/wAAvP8AAAAAAA', volume: 0.7 },
            explosion: { src: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE', volume: 0.8 }
        };
        
        this.bgMusic = null;
        this.bgMusicVolume = 0.2;
        
        this.init();
    }
    
    init() {
        // 사운드 프리로드
        Object.keys(this.soundList).forEach(key => {
            this.loadSound(key, this.soundList[key].src);
        });
        
        // 배경음악 생성
        this.createBackgroundMusic();
    }
    
    loadSound(name, src) {
        const audio = new Audio(src);
        audio.volume = this.soundList[name].volume * this.volume;
        this.sounds[name] = audio;
    }
    
    createBackgroundMusic() {
        // 간단한 배경음악 (웹 오디오 API 사용)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 기본 신스 사운드 생성
        const createTone = (frequency, startTime, duration) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.bgMusicVolume * this.volume, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };
        
        // 간단한 루프 패턴
        const playPattern = () => {
            const now = audioContext.currentTime;
            const notes = [130.81, 146.83, 164.81, 174.61]; // C3, D3, E3, F3
            
            notes.forEach((note, index) => {
                createTone(note, now + index * 0.2, 0.15);
            });
            
            // 4초마다 반복
            setTimeout(playPattern, 4000);
        };
        
        // 사용자 상호작용 후 시작
        document.addEventListener('click', () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    playPattern();
                });
            }
        }, { once: true });
    }
    
    play(soundName) {
        if (!this.enabled) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            // 사운드 복제하여 중복 재생 가능하게
            const clone = sound.cloneNode();
            clone.volume = this.soundList[soundName].volume * this.volume;
            clone.play().catch(e => console.log('Sound play failed:', e));
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // 모든 사운드 볼륨 업데이트
        Object.keys(this.sounds).forEach(key => {
            this.sounds[key].volume = this.soundList[key].volume * this.volume;
        });
    }
    
    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    playShoot() {
        this.play('shoot');
    }
    
    playEnemyHit() {
        this.play('enemyHit');
    }
    
    playEnemyDeath() {
        this.play('enemyDeath');
    }
    
    playPlayerHurt() {
        this.play('playerHurt');
    }
    
    playReload() {
        this.play('reload');
    }
    
    playWaveStart() {
        this.play('waveStart');
    }
    
    playExplosion() {
        this.play('explosion');
    }
}