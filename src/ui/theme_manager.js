// Theme management for light/dark mode switching
export class ThemeManager {
    constructor() {
        // Check localStorage for saved theme, default to 'dark'
        this.currentTheme = localStorage.getItem('theme') || 'dark';

        // Apply saved theme on initialization
        this.applyTheme(this.currentTheme);

        // Set up toggle button listener
        this.setupToggle();
    }

    setupToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => this.toggleTheme());

        // Set initial icon
        this.updateToggleIcon();
    }

    toggleTheme() {
        // Switch between dark and light
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';

        // Apply new theme
        this.applyTheme(this.currentTheme);

        // Save preference
        localStorage.setItem('theme', this.currentTheme);
    }

    applyTheme(theme) {
        // Set data-theme attribute on root element
        document.documentElement.setAttribute('data-theme', theme);

        // Update toggle button icon
        this.updateToggleIcon();
    }

    updateToggleIcon() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        // Show moon icon for dark theme, sun icon for light theme
        const icon = this.currentTheme === 'dark' ? '☀️' : '🌙';
        toggleBtn.textContent = icon;
        toggleBtn.title = this.currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}
