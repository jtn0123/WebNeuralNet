import { debounce, getThemeColors } from '../utils/helpers.js';

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
        const colors = getThemeColors();

        // Clear
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, width, height);

        if (this.actorLosses.length === 0) return;

        // Get max values
        const maxActorLoss = Math.max(...this.actorLosses, 0.1);
        const maxCriticLoss = Math.max(...this.criticLosses, 0.1);
        const maxLoss = Math.max(maxActorLoss, maxCriticLoss);

        // Draw axes
        ctx.strokeStyle = colors.textSecondary;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();

        // Calculate point positions for smooth curves
        const actorPoints = this.actorLosses.map((loss, i) => ({
            x: padding + (i / (this.actorLosses.length - 1 || 1)) * (width - 2 * padding),
            y: height - padding - (loss / maxLoss) * (height - 2 * padding)
        }));

        const criticPoints = this.criticLosses.map((loss, i) => ({
            x: padding + (i / (this.criticLosses.length - 1 || 1)) * (width - 2 * padding),
            y: height - padding - (loss / maxLoss) * (height - 2 * padding)
        }));

        // Draw actor loss gradient fill
        const actorGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        actorGradient.addColorStop(0, colors.primary.replace('ff', '30')); // Transparent primary
        actorGradient.addColorStop(1, colors.primary.replace('ff', '05')); // More transparent

        ctx.fillStyle = actorGradient;
        ctx.beginPath();
        ctx.moveTo(actorPoints[0].x, actorPoints[0].y);
        for (let i = 1; i < actorPoints.length; i++) {
            const cp = {
                x: (actorPoints[i - 1].x + actorPoints[i].x) / 2,
                y: (actorPoints[i - 1].y + actorPoints[i].y) / 2
            };
            ctx.quadraticCurveTo(cp.x, cp.y, actorPoints[i].x, actorPoints[i].y);
        }
        ctx.lineTo(actorPoints[actorPoints.length - 1].x, height - padding);
        ctx.lineTo(actorPoints[0].x, height - padding);
        ctx.closePath();
        ctx.fill();

        // Draw actor loss line with smooth curves
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(actorPoints[0].x, actorPoints[0].y);
        for (let i = 1; i < actorPoints.length; i++) {
            const cp = {
                x: (actorPoints[i - 1].x + actorPoints[i].x) / 2,
                y: (actorPoints[i - 1].y + actorPoints[i].y) / 2
            };
            ctx.quadraticCurveTo(cp.x, cp.y, actorPoints[i].x, actorPoints[i].y);
        }
        ctx.stroke();

        // Draw critic loss gradient fill
        const criticGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        criticGradient.addColorStop(0, colors.secondary.replace('ff', '30')); // Transparent secondary
        criticGradient.addColorStop(1, colors.secondary.replace('ff', '05')); // More transparent

        ctx.fillStyle = criticGradient;
        ctx.beginPath();
        ctx.moveTo(criticPoints[0].x, criticPoints[0].y);
        for (let i = 1; i < criticPoints.length; i++) {
            const cp = {
                x: (criticPoints[i - 1].x + criticPoints[i].x) / 2,
                y: (criticPoints[i - 1].y + criticPoints[i].y) / 2
            };
            ctx.quadraticCurveTo(cp.x, cp.y, criticPoints[i].x, criticPoints[i].y);
        }
        ctx.lineTo(criticPoints[criticPoints.length - 1].x, height - padding);
        ctx.lineTo(criticPoints[0].x, height - padding);
        ctx.closePath();
        ctx.fill();

        // Draw critic loss line with smooth curves
        ctx.strokeStyle = colors.secondary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(criticPoints[0].x, criticPoints[0].y);
        for (let i = 1; i < criticPoints.length; i++) {
            const cp = {
                x: (criticPoints[i - 1].x + criticPoints[i].x) / 2,
                y: (criticPoints[i - 1].y + criticPoints[i].y) / 2
            };
            ctx.quadraticCurveTo(cp.x, cp.y, criticPoints[i].x, criticPoints[i].y);
        }
        ctx.stroke();

        // Labels
        ctx.fillStyle = colors.textPrimary;
        ctx.font = '12px sans-serif';
        ctx.fillText('0', padding - 20, height - padding + 5);
        ctx.fillText(maxLoss.toFixed(2), padding - 35, padding + 5);

        // Legend
        ctx.fillStyle = colors.primary;
        ctx.fillRect(width - 180, 10, 12, 12);
        ctx.fillStyle = colors.textSecondary;
        ctx.fillText('Actor Loss', width - 160, 20);

        ctx.fillStyle = colors.secondary;
        ctx.fillRect(width - 180, 30, 12, 12);
        ctx.fillStyle = colors.textSecondary;
        ctx.fillText('Critic Loss', width - 160, 40);
    }

    clear() {
        this.actorLosses = [];
        this.criticLosses = [];
        this.draw();
    }
}
