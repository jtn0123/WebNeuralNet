import { debounce } from '../utils/helpers.js';

// Loss tracking visualization
export class TrainingLossChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.actorLosses = [];
        this.criticLosses = [];
        this.resize();
        window.addEventListener('resize', debounce(() => this.resize(), 150));
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    addDataPoint(actorLoss, criticLoss) {
        this.actorLosses.push(actorLoss);
        this.criticLosses.push(criticLoss);
        // Keep only last 200 episodes to avoid memory bloat
        if (this.actorLosses.length > 200) {
            this.actorLosses.shift();
            this.criticLosses.shift();
        }
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = 40;

        // Clear
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        if (this.actorLosses.length === 0) return;

        // Get max values
        const maxActorLoss = Math.max(...this.actorLosses, 0.1);
        const maxCriticLoss = Math.max(...this.criticLosses, 0.1);
        const maxLoss = Math.max(maxActorLoss, maxCriticLoss);

        // Draw axes
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();

        // Draw actor loss line
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < this.actorLosses.length; i++) {
            const x = padding + (i / (this.actorLosses.length - 1 || 1)) * (width - 2 * padding);
            const y = height - padding - (this.actorLosses[i] / maxLoss) * (height - 2 * padding);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw critic loss line
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < this.criticLosses.length; i++) {
            const x = padding + (i / (this.criticLosses.length - 1 || 1)) * (width - 2 * padding);
            const y = height - padding - (this.criticLosses[i] / maxLoss) * (height - 2 * padding);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.fillText('0', padding - 20, height - padding + 5);
        ctx.fillText(maxLoss.toFixed(2), padding - 35, padding + 5);

        // Legend
        ctx.fillStyle = '#667eea';
        ctx.fillRect(width - 180, 10, 12, 12);
        ctx.fillStyle = '#333';
        ctx.fillText('Actor Loss', width - 160, 20);

        ctx.fillStyle = '#ff9800';
        ctx.fillRect(width - 180, 30, 12, 12);
        ctx.fillStyle = '#333';
        ctx.fillText('Critic Loss', width - 160, 40);
    }

    clear() {
        this.actorLosses = [];
        this.criticLosses = [];
        this.draw();
    }
}
