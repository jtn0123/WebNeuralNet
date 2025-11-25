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

// Debounce function to prevent excessive handler calls
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Convert hex color (#RRGGBB) to rgba format with alpha
export function hexToRgba(hex, alpha) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Get theme-aware colors for canvas rendering
export function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    return {
        background: isDark ? '#0a0e27' : '#ffffff',
        textPrimary: isDark ? '#e8eaed' : '#1a1a1a',
        textSecondary: isDark ? '#9aa0b8' : '#666666',
        border: isDark ? '#2d3550' : '#e0e0e0',
        primary: '#00d4ff',  // Cyan (works on both themes)
        secondary: '#ff9800', // Orange (works on both themes)
        success: '#6bcf7f',
        grid: isDark ? '#2d3550' : '#e0e0e0',
        placeholder: isDark ? '#999999' : '#999999'
    };
}

// Copy all logs to clipboard
export async function copyLogs() {
    const logDiv = document.getElementById('log');
    const entries = Array.from(logDiv.querySelectorAll('.log-entry'));
    const logsText = entries.map(entry => entry.textContent).join('\n');

    try {
        await navigator.clipboard.writeText(logsText);
        // Provide visual feedback
        const btn = document.getElementById('copy-logs-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = '#ffff00';
        btn.style.color = '#000000';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.style.color = '';
        }, 1500);
        return true;
    } catch (err) {
        console.error('Failed to copy logs:', err);
        return false;
    }
}
