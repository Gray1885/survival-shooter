import { Game } from './core/Game.js';

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    window.game = new Game(canvas);
    
    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    // Handle window resize
    window.addEventListener('resize', () => {
        window.game.handleResize();
    });
    
    // Handle visibility change (pause when tab is not active)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && window.game.state === 'playing') {
            window.game.pause();
        }
    });
    
    console.log('Last Stand: Circle Defense initialized!');
});