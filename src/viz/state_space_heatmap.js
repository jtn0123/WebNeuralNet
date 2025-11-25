import { CONSTANTS } from '../utils/constants.js';
import { debounce, getThemeColors } from '../utils/helpers.js';

// State space heatmap visualization with advanced features
export class StateSpaceHeatmap {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.heatmapData = null;
        this.valueStats = null;
        this.lastUpdateEpisode = 0;

        // Configuration
        this.gridSize = 30;
        this.xDim = 0; // 0=x, 1=x_dot
        this.yDim = 2; // 2=theta, 3=theta_dot
        this.xFixed = 0;
        this.yFixed = 0;

        // Dimension metadata
        this.dims = [
            { name: 'Position', abbr: 'x', min: -2.4, max: 2.4, min_norm: -CONSTANTS.MAX_X, max_norm: CONSTANTS.MAX_X },
            { name: 'Velocity', abbr: 'ẋ', min: -3, max: 3, min_norm: -CONSTANTS.MAX_X_DOT, max_norm: CONSTANTS.MAX_X_DOT },
            { name: 'Angle', abbr: 'θ', min: -0.21, max: 0.21, min_norm: -CONSTANTS.MAX_THETA, max_norm: CONSTANTS.MAX_THETA },
            { name: 'Ang Velocity', abbr: 'θ̇', min: -2.5, max: 2.5, min_norm: -CONSTANTS.MAX_THETA_DOT, max_norm: CONSTANTS.MAX_THETA_DOT }
        ];

        this.resize();
        window.addEventListener('resize', debounce(() => this.resize(), 150));
    }

    setDimensions(xDim, yDim) {
        if (xDim !== yDim) {
            this.xDim = xDim;
            this.yDim = yDim;
        }
    }

    setFixedValues(xFixed, yFixed) {
        this.xFixed = xFixed;
        this.yFixed = yFixed;
    }

    setGridSize(size) {
        this.gridSize = size;
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    computeHeatmap(network, env) {
        try {
            this.heatmapData = [];
            const rawValues = [];

            // Get dimension bounds
            const xDim = this.dims[this.xDim];
            const yDim = this.dims[this.yDim];
            const xMin = xDim.min, xMax = xDim.max;
            const yMin = yDim.min, yMax = yDim.max;

            // Sample grid of states
            for (let i = 0; i < this.gridSize; i++) {
                this.heatmapData[i] = [];
                for (let j = 0; j < this.gridSize; j++) {
                    const xVal = xMin + (xMax - xMin) * (i / (this.gridSize - 1));
                    const yVal = yMin + (yMax - yMin) * (j / (this.gridSize - 1));

                    // Build full state [x, x_dot, theta, theta_dot]
                    const state = [0, 0, 0, 0];
                    state[this.xDim] = xVal;
                    state[this.yDim] = yVal;
                    // Set fixed values for other dimensions
                    if (this.xDim !== 0 && this.yDim !== 0) state[0] = this.xFixed;
                    if (this.xDim !== 1 && this.yDim !== 1) state[1] = this.yFixed;
                    if (this.xDim !== 2 && this.yDim !== 2) state[2] = this.xFixed;
                    if (this.xDim !== 3 && this.yDim !== 3) state[3] = this.yFixed;

                    // Normalize state
                    const normState = [
                        state[0] / CONSTANTS.MAX_X,
                        state[1] / CONSTANTS.MAX_X_DOT,
                        state[2] / CONSTANTS.MAX_THETA,
                        state[3] / CONSTANTS.MAX_THETA_DOT
                    ];

                    const { value } = network.forward(normState);
                    this.heatmapData[i][j] = value;
                    rawValues.push(value);
                }
            }

            // Calculate value statistics for dynamic normalization
            this.calculateValueStats(rawValues);
            this.lastUpdateEpisode = env.episode || 0;
        } catch (error) {
            console.error('Failed to compute heatmap:', error);
            this.heatmapData = null;
        }
        this.draw();
    }

    calculateValueStats(values) {
        values.sort((a, b) => a - b);
        const n = values.length;
        const p5 = values[Math.floor(n * 0.05)] || values[0];
        const p50 = values[Math.floor(n * 0.5)] || values[Math.floor(n / 2)];
        const p95 = values[Math.floor(n * 0.95)] || values[n - 1];

        this.valueStats = {
            min: values[0],
            max: values[n - 1],
            p5, p50, p95,
            range: p95 - p5 || 1
        };
    }

    valueToColor(value) {
        // Normalize to [-1, 1] using percentile-based scaling
        let normalized;
        if (!this.valueStats) {
            normalized = (value + 50) / 100; // Fallback
        } else {
            // Midpoint is at median
            const mid = this.valueStats.p50;
            if (value < mid) {
                normalized = -Math.abs((mid - value) / (this.valueStats.p5 - mid)) || 0;
            } else {
                normalized = (value - mid) / (this.valueStats.p95 - mid) || 0;
            }
            normalized = Math.max(-1, Math.min(1, normalized));
        }

        // Diverging color scale: Blue (-1) -> White (0) -> Red (1)
        let r, g, b;
        if (normalized < 0) {
            // Blue to White
            const t = 1 + normalized; // 0 to 1
            r = Math.floor(255 * t);
            g = Math.floor(200 * t);
            b = 255;
        } else {
            // White to Red
            const t = normalized; // 0 to 1
            r = 255;
            g = Math.floor(200 * (1 - t));
            b = Math.floor(200 * (1 - t));
        }
        return `rgb(${r}, ${g}, ${b})`;
    }

    draw() {
        const colors = getThemeColors();

        if (!this.heatmapData) {
            const ctx = this.ctx;
            ctx.fillStyle = colors.background;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = colors.textSecondary;
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Train network to see state space values', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const gridSize = this.heatmapData.length;
        const padding = 45;
        const legendWidth = 20;

        const cellWidth = (width - padding - legendWidth - 10) / gridSize;
        const cellHeight = (height - padding - 20) / gridSize;

        // Draw heatmap cells with bilinear interpolation
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const value = this.heatmapData[i][j];
                const color = this.valueToColor(value);
                ctx.fillStyle = color;
                ctx.fillRect(padding + i * cellWidth, 10 + j * cellHeight, cellWidth, cellHeight);

                // Optional: grid lines for clarity
                ctx.strokeStyle = colors.border;
                ctx.lineWidth = 0.5;
                ctx.strokeRect(padding + i * cellWidth, 10 + j * cellHeight, cellWidth, cellHeight);
            }
        }

        // Draw legend
        this.drawLegend(ctx, padding + gridSize * cellWidth + 5, 10, legendWidth, gridSize * cellHeight, colors);

        // Draw failure boundaries as annotations
        this.drawAnnotations(ctx, padding, 10, gridSize * cellWidth, gridSize * cellHeight);

        // Draw axes and labels
        this.drawAxes(ctx, padding, 10, gridSize * cellWidth, gridSize * cellHeight, colors);

        // Draw info text
        if (this.valueStats) {
            ctx.fillStyle = colors.textSecondary;
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'left';
            const infoY = height - 6;
            const minVal = this.valueStats.min.toFixed(1);
            const maxVal = this.valueStats.max.toFixed(1);
            const rangeText = `Value range: ${minVal} to ${maxVal}  |  Updated: Episode ${this.lastUpdateEpisode}`;
            ctx.fillText(rangeText, padding, infoY);
        }
    }

    drawAnnotations(ctx, x, y, width, height) {
        // Draw failure boundaries based on current dimensions
        const xDim = this.dims[this.xDim];
        const yDim = this.dims[this.yDim];

        // CartPole failure boundaries
        const failureRanges = {
            0: [-2.4, 2.4], // Position (x)
            1: [-3, 3],     // Velocity (x_dot) - no hard limit
            2: [-0.21, 0.21], // Angle (theta)
            3: [-2.5, 2.5]  // Angular velocity - no hard limit
        };

        const xRange = failureRanges[this.xDim];
        const yRange = failureRanges[this.yDim];

        // Draw failure boundaries as dashed lines
        ctx.strokeStyle = 'rgba(244, 67, 54, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);

        // X boundaries
        if (Math.abs(xRange[0]) < Math.abs(xDim.max - xDim.min) / 2) {
            const xMin = x + ((-xRange[0] - xDim.min) / (xDim.max - xDim.min)) * width;
            ctx.beginPath();
            ctx.moveTo(xMin, y);
            ctx.lineTo(xMin, y + height);
            ctx.stroke();
        }
        if (Math.abs(xRange[1]) < Math.abs(xDim.max - xDim.min) / 2) {
            const xMax = x + ((xRange[1] - xDim.min) / (xDim.max - xDim.min)) * width;
            ctx.beginPath();
            ctx.moveTo(xMax, y);
            ctx.lineTo(xMax, y + height);
            ctx.stroke();
        }

        // Y boundaries
        if (Math.abs(yRange[0]) < Math.abs(yDim.max - yDim.min) / 2) {
            const yMin = y + ((yDim.max - (-yRange[0])) / (yDim.max - yDim.min)) * height;
            ctx.beginPath();
            ctx.moveTo(x, yMin);
            ctx.lineTo(x + width, yMin);
            ctx.stroke();
        }
        if (Math.abs(yRange[1]) < Math.abs(yDim.max - yDim.min) / 2) {
            const yMax = y + ((yDim.max - yRange[1]) / (yDim.max - yDim.min)) * height;
            ctx.beginPath();
            ctx.moveTo(x, yMax);
            ctx.lineTo(x + width, yMax);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    drawLegend(ctx, x, y, width, height, colors) {
        if (!this.valueStats) return;

        const steps = 256;
        for (let i = 0; i < steps; i++) {
            const normalized = (i / steps) * 2 - 1; // -1 to 1
            const color = this.valueToColor(
                this.valueStats.p50 + normalized * (this.valueStats.p95 - this.valueStats.p5)
            );
            ctx.fillStyle = color;
            ctx.fillRect(x, y + (height * i / steps), width, height / steps + 1);
        }

        // Legend border
        ctx.strokeStyle = colors.textPrimary;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Legend labels
        ctx.fillStyle = colors.textPrimary;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(this.valueStats.p5.toFixed(1), x + width + 3, y + 8);
        ctx.fillText(this.valueStats.p50.toFixed(1), x + width + 3, y + height / 2 + 3);
        ctx.fillText(this.valueStats.p95.toFixed(1), x + width + 3, y + height - 3);
    }

    drawAxes(ctx, x, y, width, height, colors) {
        const xDim = this.dims[this.xDim];
        const yDim = this.dims[this.yDim];

        // X-axis label
        ctx.fillStyle = colors.textPrimary;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(xDim.name, x + width / 2, y + height + 30);

        // Y-axis label
        ctx.save();
        ctx.translate(15, y + height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(yDim.name, 0, 0);
        ctx.restore();

        // Axis ticks and values
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(xDim.min.toFixed(2), x - 5, y + height + 10);
        ctx.fillText(xDim.max.toFixed(2), x + width + 5, y + height + 10);
    }

    clear() {
        this.heatmapData = null;
        this.valueStats = null;
        this.draw();
    }
}
