import { CONSTANTS } from './constants.js';

// Helper function to create zero-initialized Float32Array
export function createZeroFloat32Array(shape) {
    // Check if shape[0] is array-like (either regular array or Float32Array)
    if (shape[0] && typeof shape[0].length === 'number') {
        // 2D matrix: array of Float32Array
        return shape.map(row => new Float32Array(row.length));
    }
    // 1D vector: Float32Array
    return new Float32Array(shape.length);
}

// Utility function for logging
export function log(message) {
    const logDiv = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;

    // Keep only last entries
    while (logDiv.children.length > CONSTANTS.LOG_MAX_ENTRIES) {
        logDiv.removeChild(logDiv.firstChild);
    }
}
