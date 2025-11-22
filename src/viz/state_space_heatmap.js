import { CONSTANTS } from '../utils/constants.js';

// State space heatmap visualization
export class StateSpaceHeatmap {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.heatmapData = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    computeHeatmap(network, env) {
        const gridSize = 30;
        this.heatmapData = [];

        // Sample grid of states
        const xMin = -env.xThreshold, xMax = env.xThreshold;
        const thetaMin = -env.thetaThreshold, thetaMax = env.thetaThreshold;

        for (let i = 0; i < gridSize; i++) {
            this.heatmapData[i] = [];
            for (let j = 0; j < gridSize; j++) {
                const x = xMin + (xMax - xMin) * (i / gridSize);
                const theta = thetaMin + (thetaMax - thetaMin) * (j / gridSize);
                const state = [x, 0, theta, 0]; // Zero velocity for clean visualization

                // Normalize and get value estimate
                const normState = [
                    state[0] / CONSTANTS.MAX_X,
                    state[1] / CONSTANTS.MAX_X_DOT,
                    state[2] / CONSTANTS.MAX_THETA,
                    state[3] / CONSTANTS.MAX_THETA_DOT
                ];

                const { value } = network.forward(normState);
                this.heatmapData[i][j] = Math.max(0, Math.min(1, (value + 50) / 100)); // Normalize to [0,1]
            }
        }
        this.draw();
    }

    draw() {
        if (!this.heatmapData) {
            const ctx = this.ctx;
            ctx.fillStyle = '#ccc';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#999';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Train network to see state space values', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const gridSize = this.heatmapData.length;

        const cellWidth = width / gridSize;
        const cellHeight = height / gridSize;

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const value = this.heatmapData[i][j];
                // Color gradient: blue (low) -> green -> red (high)
                let color;
                if (value < 0.5) {
                    const r = Math.floor(value * 2 * 255);
                    color = `rgb(0, ${r}, 255)`;
                } else {
                    const b = Math.floor((1 - value) * 2 * 255);
                    const g = 255;
                    const r = 255;
                    color = `rgb(${r}, ${g}, ${b})`;
                }

                ctx.fillStyle = color;
                ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
            }
        }

        // Labels
        ctx.fillStyle = '#333';
        ctx.font = '11px sans-serif';
        ctx.fillText('Position', width / 2, height + 15);
        ctx.save();
        ctx.translate(-15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Angle', 0, 0);
        ctx.restore();
    }

    clear() {
        this.heatmapData = null;
        this.draw();
    }
}
