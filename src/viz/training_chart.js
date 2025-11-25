import { debounce, getThemeColors } from '../utils/helpers.js';

// Training chart visualizer
export class TrainingChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        this.maxDataPoints = 100;
        this.resize();
        window.addEventListener('resize', debounce(() => this.resize(), 150));
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    addDataPoint(episode, reward) {
        this.data.push({ episode, reward });
        if (this.data.length > this.maxDataPoints) {
            this.data.shift();
        }
        this.render();
    }

    clear() {
        this.data = [];
        this.render();
    }

    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = 40;
        const colors = getThemeColors();

        // Clear
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, width, height);

        if (this.data.length === 0) {
            ctx.fillStyle = colors.textSecondary;
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Training data will appear here...', width / 2, height / 2);
            return;
        }

        // Find min/max
        const rewards = this.data.map(d => d.reward);
        const minReward = Math.min(...rewards);
        const maxReward = Math.max(...rewards);
        const range = maxReward - minReward || 1;

        // Draw grid
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (height - 2 * padding) * i / 5;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();

            // Y-axis labels
            const value = maxReward - (range * i / 5);
            ctx.fillStyle = colors.textSecondary;
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(value.toFixed(0), padding - 5, y + 4);
        }

        // Draw line
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();

        this.data.forEach((point, i) => {
            const x = padding + (width - 2 * padding) * i / (this.data.length - 1 || 1);
            const y = padding + (height - 2 * padding) * (1 - (point.reward - minReward) / range);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points
        ctx.fillStyle = colors.primary;
        this.data.forEach((point, i) => {
            const x = padding + (width - 2 * padding) * i / (this.data.length - 1 || 1);
            const y = padding + (height - 2 * padding) * (1 - (point.reward - minReward) / range);

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw moving average
        if (this.data.length >= 10) {
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();

            for (let i = 9; i < this.data.length; i++) {
                const avg = this.data.slice(i - 9, i + 1).reduce((sum, d) => sum + d.reward, 0) / 10;
                const x = padding + (width - 2 * padding) * i / (this.data.length - 1);
                const y = padding + (height - 2 * padding) * (1 - (avg - minReward) / range);

                if (i === 9) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Labels
        ctx.fillStyle = colors.textPrimary;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Episode', width / 2, height - 5);

        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Survival Time', 0, 0);
        ctx.restore();

        // Legend
        ctx.textAlign = 'left';
        ctx.fillStyle = colors.primary;
        ctx.fillRect(width - 150, 10, 15, 3);
        ctx.fillStyle = colors.textSecondary;
        ctx.fillText('Episode Reward', width - 130, 15);

        ctx.fillStyle = colors.secondary;
        ctx.fillRect(width - 150, 25, 15, 3);
        ctx.fillStyle = colors.textSecondary;
        ctx.fillText('10-Ep Average', width - 130, 30);
    }
}
