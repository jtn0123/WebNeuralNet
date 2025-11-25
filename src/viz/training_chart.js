import { debounce, getThemeColors, hexToRgba } from '../utils/helpers.js';

// Training chart visualizer
export class TrainingChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        this.maxDataPoints = 100;
        this.mousePos = null;
        this.hoverPoint = null;
        this.resize();
        window.addEventListener('resize', debounce(() => this.resize(), 150));

        // Track mouse position for tooltips
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.mousePos = null;
            this.hoverPoint = null;
        });
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        // Find nearest data point
        if (this.data.length > 0) {
            const padding = 40;
            const width = this.canvas.width;
            const height = this.canvas.height;

            const rewards = this.data.map(d => d.reward);
            const minReward = Math.min(...rewards);
            const maxReward = Math.max(...rewards);
            const range = maxReward - minReward || 1;

            let closestPoint = null;
            let closestDist = Infinity;

            this.data.forEach((point, i) => {
                const x = padding + (width - 2 * padding) * i / (this.data.length - 1 || 1);
                const y = padding + (height - 2 * padding) * (1 - (point.reward - minReward) / range);
                const dist = Math.sqrt((this.mousePos.x - x) ** 2 + (this.mousePos.y - y) ** 2);

                if (dist < closestDist && dist < 15) {
                    closestDist = dist;
                    closestPoint = { ...point, index: i, x, y };
                }
            });

            this.hoverPoint = closestPoint;
        }
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

        // Calculate point positions for smooth curves
        const points = this.data.map((point, i) => ({
            x: padding + (width - 2 * padding) * i / (this.data.length - 1 || 1),
            y: padding + (height - 2 * padding) * (1 - (point.reward - minReward) / range)
        }));

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

        // Draw gradient fill under the curve
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, hexToRgba(colors.primary, 0.25)); // Transparent primary
        gradient.addColorStop(1, hexToRgba(colors.primary, 0.02)); // More transparent

        // Fill area under curve
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            const cp = {
                x: (points[i - 1].x + points[i].x) / 2,
                y: (points[i - 1].y + points[i].y) / 2
            };
            ctx.quadraticCurveTo(cp.x, cp.y, points[i].x, points[i].y);
        }

        ctx.lineTo(points[points.length - 1].x, height - padding);
        ctx.lineTo(points[0].x, height - padding);
        ctx.closePath();
        ctx.fill();

        // Draw smooth curve using quadratic Bezier interpolation
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            const cp = { // Control point at midpoint
                x: (points[i - 1].x + points[i].x) / 2,
                y: (points[i - 1].y + points[i].y) / 2
            };
            ctx.quadraticCurveTo(cp.x, cp.y, points[i].x, points[i].y);
        }

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

        // Draw moving average with smooth curves
        if (this.data.length >= 10) {
            const avgPoints = [];
            for (let i = 9; i < this.data.length; i++) {
                const avg = this.data.slice(i - 9, i + 1).reduce((sum, d) => sum + d.reward, 0) / 10;
                avgPoints.push({
                    x: padding + (width - 2 * padding) * i / (this.data.length - 1),
                    y: padding + (height - 2 * padding) * (1 - (avg - minReward) / range)
                });
            }

            // Draw gradient fill under moving average
            const avgGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
            avgGradient.addColorStop(0, hexToRgba(colors.secondary, 0.19)); // Transparent secondary
            avgGradient.addColorStop(1, hexToRgba(colors.secondary, 0.01)); // More transparent

            ctx.fillStyle = avgGradient;
            ctx.beginPath();
            ctx.moveTo(avgPoints[0].x, avgPoints[0].y);

            for (let i = 1; i < avgPoints.length; i++) {
                const cp = {
                    x: (avgPoints[i - 1].x + avgPoints[i].x) / 2,
                    y: (avgPoints[i - 1].y + avgPoints[i].y) / 2
                };
                ctx.quadraticCurveTo(cp.x, cp.y, avgPoints[i].x, avgPoints[i].y);
            }

            ctx.lineTo(avgPoints[avgPoints.length - 1].x, height - padding);
            ctx.lineTo(avgPoints[0].x, height - padding);
            ctx.closePath();
            ctx.fill();

            // Draw the dashed line
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(avgPoints[0].x, avgPoints[0].y);

            for (let i = 1; i < avgPoints.length; i++) {
                const cp = {
                    x: (avgPoints[i - 1].x + avgPoints[i].x) / 2,
                    y: (avgPoints[i - 1].y + avgPoints[i].y) / 2
                };
                ctx.quadraticCurveTo(cp.x, cp.y, avgPoints[i].x, avgPoints[i].y);
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

        // Draw tooltip
        if (this.hoverPoint) {
            const tooltipText = `Episode ${this.hoverPoint.episode}: ${this.hoverPoint.reward.toFixed(0)} steps`;
            const metrics = {
                text: tooltipText,
                width: ctx.measureText(tooltipText).width + 12,
                height: 24
            };

            let tooltipX = this.hoverPoint.x + 10;
            let tooltipY = this.hoverPoint.y - 30;

            // Keep tooltip within bounds
            if (tooltipX + metrics.width > width) {
                tooltipX = this.hoverPoint.x - metrics.width - 10;
            }
            if (tooltipY < 10) {
                tooltipY = this.hoverPoint.y + 20;
            }

            // Draw tooltip background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(tooltipX - 2, tooltipY - metrics.height + 4, metrics.width, metrics.height);

            // Draw tooltip border
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 1;
            ctx.strokeRect(tooltipX - 2, tooltipY - metrics.height + 4, metrics.width, metrics.height);

            // Draw tooltip text
            ctx.fillStyle = colors.textPrimary;
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(tooltipText, tooltipX + 4, tooltipY - 8);

            // Highlight hovered point
            ctx.fillStyle = colors.primary;
            ctx.beginPath();
            ctx.arc(this.hoverPoint.x, this.hoverPoint.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
