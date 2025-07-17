export class Minimap {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.size = 150;
        this.scale = 0.1; // 실제 맵의 10%
        this.radarRange = 500; // 레이더 감지 범위
        
        // 캔버스 크기 설정
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        
        // 레이더 스타일
        this.backgroundColor = 'rgba(0, 20, 0, 0.8)';
        this.borderColor = '#00ff00';
        this.gridColor = 'rgba(0, 255, 0, 0.2)';
        this.playerColor = '#00ff88';
        this.enemyColor = '#ff0000';
        this.scanLineAngle = 0;
    }
    
    update(deltaTime) {
        // 레이더 스캔 라인 회전
        this.scanLineAngle += (deltaTime / 1000) * Math.PI; // 초당 180도 회전
    }
    
    draw(player, enemies) {
        // 배경 그리기
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.size, this.size);
        
        // 테두리
        this.ctx.strokeStyle = this.borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.size, this.size);
        
        // 레이더 그리드 (원형)
        this.drawRadarGrid();
        
        // 스캔 라인
        this.drawScanLine();
        
        // 플레이어 (중앙)
        this.ctx.fillStyle = this.playerColor;
        this.ctx.beginPath();
        this.ctx.arc(this.size / 2, this.size / 2, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 플레이어 방향 표시
        const playerAngle = player.aimAngle;
        this.ctx.strokeStyle = this.playerColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.size / 2, this.size / 2);
        this.ctx.lineTo(
            this.size / 2 + Math.cos(playerAngle) * 15,
            this.size / 2 + Math.sin(playerAngle) * 15
        );
        this.ctx.stroke();
        
        // 적들 표시
        enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const dx = enemy.position.x - player.position.x;
            const dy = enemy.position.y - player.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 레이더 범위 내의 적만 표시
            if (distance <= this.radarRange) {
                const relativeX = (dx / this.radarRange) * (this.size / 2);
                const relativeY = (dy / this.radarRange) * (this.size / 2);
                
                const blipX = this.size / 2 + relativeX;
                const blipY = this.size / 2 + relativeY;
                
                // 스캔 효과 (스캔 라인이 지나갈 때 밝게)
                const angleToEnemy = Math.atan2(dy, dx);
                const angleDiff = Math.abs(angleToEnemy - this.scanLineAngle) % (Math.PI * 2);
                const brightness = angleDiff < 0.5 ? 1 : 0.6;
                
                this.ctx.fillStyle = `rgba(255, 0, 0, ${brightness})`;
                this.ctx.beginPath();
                this.ctx.arc(blipX, blipY, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // 거리 표시
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${this.radarRange}m`, this.size - 5, this.size - 5);
    }
    
    drawRadarGrid() {
        const centerX = this.size / 2;
        const centerY = this.size / 2;
        
        // 원형 그리드
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 1;
        
        // 동심원
        for (let i = 1; i <= 3; i++) {
            const radius = (this.size / 2) * (i / 3);
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // 십자선
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, 0);
        this.ctx.lineTo(centerX, this.size);
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(this.size, centerY);
        this.ctx.stroke();
    }
    
    drawScanLine() {
        const centerX = this.size / 2;
        const centerY = this.size / 2;
        const radius = this.size / 2;
        
        // 스캔 라인
        const gradient = this.ctx.createLinearGradient(
            centerX,
            centerY,
            centerX + Math.cos(this.scanLineAngle) * radius,
            centerY + Math.sin(this.scanLineAngle) * radius
        );
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 255, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0.5)');
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(
            centerX + Math.cos(this.scanLineAngle) * radius,
            centerY + Math.sin(this.scanLineAngle) * radius
        );
        this.ctx.stroke();
    }
}