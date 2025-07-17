# 기술 아키텍처 설계

## 1. 디렉토리 구조

```
survival-shooter/
├── index.html
├── css/
│   ├── game.css
│   ├── menu.css
│   └── effects.css
├── js/
│   ├── main.js                 # 진입점
│   ├── config/
│   │   ├── constants.js        # 게임 상수
│   │   ├── weapons.js          # 무기 데이터
│   │   ├── enemies.js          # 적 데이터
│   │   └── items.js            # 아이템 데이터
│   ├── core/
│   │   ├── Game.js             # 메인 게임 루프
│   │   ├── Renderer.js         # 렌더링 엔진
│   │   ├── InputHandler.js     # 입력 처리
│   │   ├── CollisionSystem.js  # 충돌 감지
│   │   └── ParticleSystem.js   # 파티클 효과
│   ├── entities/
│   │   ├── Entity.js           # 기본 엔티티 클래스
│   │   ├── Player.js           # 플레이어
│   │   ├── Enemy.js            # 적 기본 클래스
│   │   ├── Bullet.js           # 탄환
│   │   └── Item.js             # 아이템
│   ├── enemies/
│   │   ├── Zombie.js           # 좀비
│   │   ├── Runner.js           # 러너
│   │   ├── Tank.js             # 탱커
│   │   ├── Shooter.js          # 원거리 공격수
│   │   └── Bomber.js           # 폭발형
│   ├── weapons/
│   │   ├── Weapon.js           # 무기 기본 클래스
│   │   ├── Pistol.js           # 권총
│   │   ├── Shotgun.js          # 샷건
│   │   ├── MachineGun.js       # 기관총
│   │   └── RocketLauncher.js   # 로켓런처
│   ├── systems/
│   │   ├── WaveManager.js      # 웨이브 관리
│   │   ├── SpawnSystem.js      # 적 생성 시스템
│   │   ├── ScoreSystem.js      # 점수 시스템
│   │   ├── ItemDropSystem.js   # 아이템 드롭
│   │   └── AudioManager.js     # 사운드 관리
│   ├── ui/
│   │   ├── HUD.js              # 게임 내 UI
│   │   ├── Menu.js             # 메뉴 시스템
│   │   ├── Minimap.js          # 미니맵
│   │   └── DamageIndicator.js  # 데미지 표시
│   └── utils/
│       ├── Vector2.js          # 2D 벡터 연산
│       ├── MathUtils.js        # 수학 유틸리티
│       └── ObjectPool.js       # 오브젝트 풀링
├── assets/
│   ├── images/
│   │   ├── sprites/            # 스프라이트 시트
│   │   ├── ui/                 # UI 요소
│   │   └── effects/            # 이펙트 이미지
│   ├── sounds/
│   │   ├── weapons/            # 무기 사운드
│   │   ├── enemies/            # 적 사운드
│   │   ├── effects/            # 효과음
│   │   └── music/              # 배경음악
│   └── data/
│       └── levels.json         # 레벨 데이터
└── docs/
    ├── game-design.md
    └── technical-architecture.md
```

## 2. 핵심 클래스 설계

### 2.1 Entity (기본 엔티티)
```javascript
class Entity {
    - position: Vector2
    - velocity: Vector2
    - radius: number (충돌 반경)
    - health: number
    - maxHealth: number
    - speed: number
    - alive: boolean
    
    + update(deltaTime)
    + render(ctx)
    + takeDamage(amount)
    + destroy()
}
```

### 2.2 Player (플레이어)
```javascript
class Player extends Entity {
    - weapons: Weapon[]
    - currentWeapon: number
    - dashCooldown: number
    - invulnerable: boolean
    
    + move(direction)
    + aim(mousePos)
    + shoot()
    + dash()
    + switchWeapon(index)
}
```

### 2.3 Enemy (적)
```javascript
class Enemy extends Entity {
    - target: Player
    - attackDamage: number
    - attackCooldown: number
    - scoreValue: number
    
    + moveTowardsPlayer()
    + attack()
    + onDeath()
}
```

### 2.4 Weapon (무기)
```javascript
class Weapon {
    - damage: number
    - fireRate: number
    - magazineSize: number
    - currentAmmo: number
    - reloadTime: number
    - spread: number
    
    + fire(origin, direction)
    + reload()
    + canFire()
}
```

## 3. 게임 시스템

### 3.1 충돌 감지
- 원형 충돌 감지 (Circle-Circle Collision)
- 공간 분할 (Spatial Hashing) for 성능
- 충돌 레이어 시스템

### 3.2 오브젝트 풀링
- Bullet, Enemy, Particle 재사용
- 메모리 할당 최소화
- 가비지 컬렉션 감소

### 3.3 렌더링 최적화
- 뷰포트 컬링
- 레이어별 렌더링
- 더티 플래그 시스템

## 4. 상태 관리

### 4.1 게임 상태
```
MENU → PLAYING → PAUSED → GAME_OVER
  ↑                           ↓
  └───────────────────────────┘
```

### 4.2 적 AI 상태
```
IDLE → CHASING → ATTACKING → DEAD
  ↑        ↓          ↓
  └────────┴──────────┘
```

## 5. 데이터 구조

### 5.1 웨이브 데이터
```javascript
{
    waveNumber: 1,
    enemies: [
        { type: "zombie", count: 10, spawnDelay: 1000 },
        { type: "runner", count: 5, spawnDelay: 2000 }
    ],
    duration: 60000,
    rewards: ["health_pack", "ammo_box"]
}
```

### 5.2 무기 데이터
```javascript
{
    id: "pistol",
    name: "권총",
    damage: 25,
    fireRate: 300,
    magazineSize: 12,
    reloadTime: 1500,
    bulletSpeed: 800,
    spread: 5,
    penetration: 0
}
```

## 6. 성능 고려사항

### 6.1 최적화 전략
- RequestAnimationFrame 사용
- 고정 시간 스텝 물리 연산
- 오프스크린 캔버스 활용
- 이미지 프리로딩

### 6.2 모바일 대응
- 터치 컨트롤 지원
- 반응형 캔버스 크기
- 성능 모드 옵션
- 자동 품질 조절

## 7. 확장성 설계

### 7.1 플러그인 시스템
- 새로운 무기 추가 용이
- 적 타입 확장 가능
- 아이템 시스템 모듈화

### 7.2 이벤트 시스템
- 커스텀 이벤트 발행/구독
- 느슨한 결합
- 디버깅 용이

이러한 아키텍처를 통해 유지보수가 쉽고 확장 가능한 게임을 개발할 수 있습니다.