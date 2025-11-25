// Running statistics for online mean and variance calculation
export class RunningStats {
    constructor(size) {
        this.size = size;
        this.mean = new Float32Array(size);
        this.m2 = new Float32Array(size); // Sum of squared differences
        this.count = 0;
        this.variance = new Float32Array(size);
    }

    // Welford's online algorithm for numerically stable mean/variance
    update(values) {
        if (values.length !== this.size) {
            console.warn('RunningStats: value size mismatch');
            return;
        }

        this.count++;

        for (let i = 0; i < this.size; i++) {
            const delta = values[i] - this.mean[i];
            this.mean[i] += delta / this.count;
            const delta2 = values[i] - this.mean[i];
            this.m2[i] += delta * delta2;
        }

        // Update variance
        if (this.count > 1) {
            for (let i = 0; i < this.size; i++) {
                this.variance[i] = this.m2[i] / (this.count - 1);
            }
        }
    }

    // Get current standard deviation
    getStd() {
        const std = new Float32Array(this.size);
        for (let i = 0; i < this.size; i++) {
            std[i] = Math.sqrt(this.variance[i] + 1e-8);
        }
        return std;
    }

    // Normalize values using running mean and std
    normalize(values) {
        const normalized = new Float32Array(this.size);
        const std = this.getStd();

        for (let i = 0; i < this.size; i++) {
            normalized[i] = (values[i] - this.mean[i]) / std[i];
        }

        return normalized;
    }

    // Reset statistics
    reset() {
        this.mean.fill(0);
        this.m2.fill(0);
        this.variance.fill(0);
        this.count = 0;
    }
}
