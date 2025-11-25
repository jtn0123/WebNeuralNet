import { getThemeColors } from '../utils/helpers.js';

// Particle system for visual effects
export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 200;
    }

    // Create victory burst particles
    createVictoryBurst(x, y, count = 30) {
        const colors = ['#6bcf7f', '#00d4ff', '#ffd93d', '#ff6b6b'];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const velocity = 2 + Math.random() * 4;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: 1.0,
                maxLife: 1.0,
                radius: 2 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
        this.limitParticles();
    }

    // Create stress/danger particles around pole
    createStressParticles(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 0.5 + Math.random() * 1.5;
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: 1.0,
                maxLife: 0.8,
                radius: 1 + Math.random() * 2,
                color: '#f44336'
            });
        }
        this.limitParticles();
    }

    // Create dust particles under cart
    createDustParticles(x, y, count = 3) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + Math.random() * 10,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 0.5,
                life: 1.0,
                maxLife: 0.6,
                radius: 1 + Math.random() * 2,
                color: 'rgba(141, 110, 99, 0.6)'
            });
        }
        this.limitParticles();
    }

    update(dt = 0.016) {
        this.particles = this.particles.filter(p => p.life > 0);

        for (let particle of this.particles) {
            // Physics
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.15; // gravity

            // Decay
            particle.life -= dt / particle.maxLife;
        }
    }

    draw(ctx) {
        for (let particle of this.particles) {
            const alpha = Math.max(0, particle.life);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    limitParticles() {
        if (this.particles.length > this.maxParticles) {
            this.particles = this.particles.slice(-this.maxParticles);
        }
    }

    clear() {
        this.particles = [];
    }
}
