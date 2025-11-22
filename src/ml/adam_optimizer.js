import { createZeroFloat32Array } from '../utils/helpers.js';

// Adam Optimizer
export class AdamOptimizer {
    constructor(shape, learningRate = 0.001, beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8) {
        this.learningRate = learningRate;
        this.beta1 = beta1;
        this.beta2 = beta2;
        this.epsilon = epsilon;
        this.t = 0;

        // Initialize moments with Float32Array
        this.m = createZeroFloat32Array(shape);
        this.v = createZeroFloat32Array(shape);
    }

    update(param, grad) {
        this.t++;

        if (param[0] && typeof param[0].length === 'number') {
            // 2D array (matrix of Float32Arrays or arrays)
            for (let i = 0; i < param.length; i++) {
                for (let j = 0; j < param[i].length; j++) {
                    this.m[i][j] = this.beta1 * this.m[i][j] + (1 - this.beta1) * grad[i][j];
                    this.v[i][j] = this.beta2 * this.v[i][j] + (1 - this.beta2) * grad[i][j] * grad[i][j];

                    const mHat = this.m[i][j] / (1 - Math.pow(this.beta1, this.t));
                    const vHat = this.v[i][j] / (1 - Math.pow(this.beta2, this.t));

                    param[i][j] -= this.learningRate * mHat / (Math.sqrt(vHat) + this.epsilon);
                }
            }
        } else {
            // 1D array (vector)
            for (let i = 0; i < param.length; i++) {
                this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * grad[i];
                this.v[i] = this.beta2 * this.v[i] + (1 - this.beta2) * grad[i] * grad[i];

                const mHat = this.m[i] / (1 - Math.pow(this.beta1, this.t));
                const vHat = this.v[i] / (1 - Math.pow(this.beta2, this.t));

                param[i] -= this.learningRate * mHat / (Math.sqrt(vHat) + this.epsilon);
            }
        }
    }
}
