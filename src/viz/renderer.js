import { CONSTANTS } from '../utils/constants.js';
import { debounce } from '../utils/helpers.js';

// Rendering
export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        // Create offscreen canvas for double buffering
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', debounce(() => this.resize(), 150));
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        // Resize offscreen canvas to match
        this.offscreenCanvas.width = rect.width;
        this.offscreenCanvas.height = rect.height;
    }

    render(env) {
        const ctx = this.offscreenCtx;
        const width = this.offscreenCanvas.width;
        const height = this.offscreenCanvas.height;

        // Clear
        ctx.fillStyle = 'rgba(227, 242, 253, 0.5)';
        ctx.fillRect(0, 0, width, height);

        // Ground
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(0, height * CONSTANTS.GROUND_HEIGHT_RATIO, width, height * (1 - CONSTANTS.GROUND_HEIGHT_RATIO));

        // Track
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height * CONSTANTS.TRACK_Y_RATIO);
        ctx.lineTo(width, height * CONSTANTS.TRACK_Y_RATIO);
        ctx.stroke();

        // Draw boundaries
        const scale = width / 6;
        const leftBoundary = width / 2 - env.xThreshold * scale;
        const rightBoundary = width / 2 + env.xThreshold * scale;

        ctx.strokeStyle = '#f44336';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(leftBoundary, height * 0.5);
        ctx.lineTo(leftBoundary, height * CONSTANTS.CART_Y_RATIO);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rightBoundary, height * 0.5);
        ctx.lineTo(rightBoundary, height * CONSTANTS.CART_Y_RATIO);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cart
        const cartX = width / 2 + env.x * scale;
        const cartY = height * CONSTANTS.CART_Y_RATIO;
        const cartWidth = CONSTANTS.CART_WIDTH;
        const cartHeight = CONSTANTS.CART_HEIGHT;

        ctx.fillStyle = '#1976d2';
        ctx.fillRect(cartX - cartWidth / 2, cartY - cartHeight, cartWidth, cartHeight);

        // Wheels
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(cartX - cartWidth / 3, cartY, CONSTANTS.WHEEL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cartX + cartWidth / 3, cartY, CONSTANTS.WHEEL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Pole
        const poleLength = env.length * 2 * scale;
        const poleX = cartX + poleLength * Math.sin(env.theta);
        const poleY = cartY - cartHeight - poleLength * Math.cos(env.theta);

        // Pole color based on angle
        const angleRatio = Math.abs(env.theta) / env.thetaThreshold;
        let poleColor = '#4caf50'; // green
        if (angleRatio > CONSTANTS.POLE_CRITICAL_THRESHOLD) {
            poleColor = '#f44336'; // red
        } else if (angleRatio > CONSTANTS.POLE_WARNING_THRESHOLD) {
            poleColor = '#ff9800'; // orange
        }

        ctx.strokeStyle = poleColor;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cartX, cartY - cartHeight);
        ctx.lineTo(poleX, poleY);
        ctx.stroke();

        // Pole tip
        ctx.fillStyle = poleColor;
        ctx.beginPath();
        ctx.arc(poleX, poleY, CONSTANTS.POLE_TIP_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Draw angle arc
        ctx.strokeStyle = poleColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(cartX, cartY - cartHeight, CONSTANTS.ANGLE_ARC_RADIUS, -Math.PI / 2, -Math.PI / 2 + env.theta, env.theta > 0);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Draw velocity vector
        if (Math.abs(env.xDot) > 0.1) {
            ctx.strokeStyle = '#2196f3';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cartX, cartY - cartHeight / 2);
            const velocityScale = CONSTANTS.VELOCITY_SCALE;
            ctx.lineTo(cartX + env.xDot * velocityScale, cartY - cartHeight / 2);
            ctx.stroke();

            // Arrow head
            const angle = env.xDot > 0 ? 0 : Math.PI;
            ctx.beginPath();
            ctx.moveTo(cartX + env.xDot * velocityScale, cartY - cartHeight / 2);
            ctx.lineTo(cartX + env.xDot * velocityScale - Math.cos(angle - Math.PI / 6) * CONSTANTS.ARROW_HEAD_SIZE,
                      cartY - cartHeight / 2 - Math.sin(angle - Math.PI / 6) * CONSTANTS.ARROW_HEAD_SIZE);
            ctx.lineTo(cartX + env.xDot * velocityScale - Math.cos(angle + Math.PI / 6) * CONSTANTS.ARROW_HEAD_SIZE,
                      cartY - cartHeight / 2 - Math.sin(angle + Math.PI / 6) * CONSTANTS.ARROW_HEAD_SIZE);
            ctx.closePath();
            ctx.fillStyle = '#2196f3';
            ctx.fill();
        }

        // State info overlay
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`θ: ${(env.theta * 180 / Math.PI).toFixed(1)}°`, 10, 20);
        ctx.fillText(`x: ${env.x.toFixed(2)}`, 10, 40);

        // Warning indicators
        if (Math.abs(env.x) > env.xThreshold * CONSTANTS.WARNING_DISPLAY_THRESHOLD || Math.abs(env.theta) > env.thetaThreshold * CONSTANTS.WARNING_DISPLAY_THRESHOLD) {
            ctx.fillStyle = '#f44336';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText('⚠️ CRITICAL', width - 120, 30);
        }

        // Blit offscreen canvas to visible canvas
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }
}
