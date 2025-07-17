// Math Utilities
export const MathUtils = {
    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    // Linear interpolation
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    // Map value from one range to another
    map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },
    
    // Random float between min and max
    randomRange(min, max) {
        return min + Math.random() * (max - min);
    },
    
    // Random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Convert degrees to radians
    degToRad(degrees) {
        return degrees * Math.PI / 180;
    },
    
    // Convert radians to degrees
    radToDeg(radians) {
        return radians * 180 / Math.PI;
    },
    
    // Distance between two points
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // Distance squared (faster for comparisons)
    distanceSquared(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    },
    
    // Angle between two points
    angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    // Normalize angle to 0-2π
    normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle > Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    },
    
    // Check if circles collide
    circlesCollide(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < r1 + r2;
    },
    
    // Check if point is in circle
    pointInCircle(px, py, cx, cy, radius) {
        const dx = px - cx;
        const dy = py - cy;
        return dx * dx + dy * dy <= radius * radius;
    },
    
    // Check if circles overlap (returns overlap amount)
    circleOverlap(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return Math.max(0, r1 + r2 - distance);
    },
    
    // Smooth step function
    smoothStep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    },
    
    // Ease in quad
    easeInQuad(t) {
        return t * t;
    },
    
    // Ease out quad
    easeOutQuad(t) {
        return t * (2 - t);
    },
    
    // Ease in out quad
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    
    // Random point in circle
    randomPointInCircle(centerX, centerY, radius) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * radius;
        return {
            x: centerX + Math.cos(angle) * r,
            y: centerY + Math.sin(angle) * r
        };
    },
    
    // Random point on circle edge
    randomPointOnCircle(centerX, centerY, radius) {
        const angle = Math.random() * Math.PI * 2;
        return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        };
    },
    
    // Weighted random selection
    weightedRandom(weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return i;
            }
        }
        
        return weights.length - 1;
    }
};