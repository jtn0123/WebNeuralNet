// Metrics dashboard
export class MetricsDashboard {
    constructor() {
        this.metrics = {
            gradNorm: 0,
            avgAdvantage: 0,
            avgReturn: 0,
            avgQValue: 0,
            entropy: 0,
            leftAction: 0,
            rightAction: 0
        };
    }

    update(metrics) {
        Object.assign(this.metrics, metrics);
    }

    render() {
        // Update UI elements
        if (document.getElementById('metric-grad-norm')) {
            document.getElementById('metric-grad-norm').textContent = this.metrics.gradNorm.toFixed(3);
        }
        if (document.getElementById('metric-advantage')) {
            document.getElementById('metric-advantage').textContent = this.metrics.avgAdvantage.toFixed(3);
        }
        if (document.getElementById('metric-return')) {
            document.getElementById('metric-return').textContent = this.metrics.avgReturn.toFixed(1);
        }
        if (document.getElementById('metric-qvalue')) {
            document.getElementById('metric-qvalue').textContent = this.metrics.avgQValue.toFixed(2);
        }
        if (document.getElementById('metric-entropy')) {
            document.getElementById('metric-entropy').textContent = this.metrics.entropy.toFixed(3);
        }
        if (document.getElementById('metric-left-action')) {
            document.getElementById('metric-left-action').textContent = (this.metrics.leftAction * 100).toFixed(0) + '%';
        }
        if (document.getElementById('metric-right-action')) {
            document.getElementById('metric-right-action').textContent = (this.metrics.rightAction * 100).toFixed(0) + '%';
        }
    }
}
