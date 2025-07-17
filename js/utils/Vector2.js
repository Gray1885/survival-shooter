// 2D Vector Math Utility Class
export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    // Static methods for creating vectors
    static zero() {
        return new Vector2(0, 0);
    }
    
    static one() {
        return new Vector2(1, 1);
    }
    
    static up() {
        return new Vector2(0, -1);
    }
    
    static down() {
        return new Vector2(0, 1);
    }
    
    static left() {
        return new Vector2(-1, 0);
    }
    
    static right() {
        return new Vector2(1, 0);
    }
    
    static fromAngle(angle) {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }
    
    static random() {
        const angle = Math.random() * Math.PI * 2;
        return Vector2.fromAngle(angle);
    }
    
    // Instance methods
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    
    copy() {
        return new Vector2(this.x, this.y);
    }
    
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }
    
    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }
    
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    
    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }
    
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    magnitudeSquared() {
        return this.x * this.x + this.y * this.y;
    }
    
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.divide(mag);
        }
        return this;
    }
    
    normalized() {
        return this.copy().normalize();
    }
    
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }
    
    cross(vector) {
        return this.x * vector.y - this.y * vector.x;
    }
    
    angle() {
        return Math.atan2(this.y, this.x);
    }
    
    angleTo(vector) {
        return Math.atan2(vector.y - this.y, vector.x - this.x);
    }
    
    distanceTo(vector) {
        const dx = vector.x - this.x;
        const dy = vector.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    distanceSquaredTo(vector) {
        const dx = vector.x - this.x;
        const dy = vector.y - this.y;
        return dx * dx + dy * dy;
    }
    
    lerp(vector, t) {
        this.x = this.x + (vector.x - this.x) * t;
        this.y = this.y + (vector.y - this.y) * t;
        return this;
    }
    
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.x = x;
        this.y = y;
        return this;
    }
    
    rotated(angle) {
        return this.copy().rotate(angle);
    }
    
    limit(max) {
        if (this.magnitudeSquared() > max * max) {
            this.normalize().multiply(max);
        }
        return this;
    }
    
    reflect(normal) {
        const dot = this.dot(normal);
        this.x = this.x - 2 * dot * normal.x;
        this.y = this.y - 2 * dot * normal.y;
        return this;
    }
    
    equals(vector) {
        return this.x === vector.x && this.y === vector.y;
    }
    
    toString() {
        return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }
}