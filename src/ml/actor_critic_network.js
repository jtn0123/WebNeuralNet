import { AdamOptimizer } from './adam_optimizer.js';

// Advanced Actor-Critic Neural Network
export class ActorCriticNetwork {
    constructor(inputSize, hiddenSizes, outputSize, activation = 'relu') {
        this.inputSize = inputSize;
        this.hiddenSizes = Array.isArray(hiddenSizes) ? hiddenSizes : [hiddenSizes];
        this.outputSize = outputSize;
        this.activation = activation;

        // Build network architecture
        this.layers = [];
        let prevSize = inputSize;

        // Hidden layers
        for (const hiddenSize of this.hiddenSizes) {
            this.layers.push({
                w: this.heInitialize(prevSize, hiddenSize),
                b: new Float32Array(hiddenSize),
                type: 'hidden'
            });
            prevSize = hiddenSize;
        }

        // Actor head (policy)
        this.actorHead = {
            w: this.heInitialize(prevSize, outputSize),
            b: new Float32Array(outputSize)
        };

        // Critic head (value function)
        this.criticHead = {
            w: this.heInitialize(prevSize, 1),
            b: new Float32Array(1)
        };

        // Initialize Adam optimizers
        this.optimizers = {
            layers: [],
            actor: {
                w: new AdamOptimizer(this.actorHead.w),
                b: new AdamOptimizer(this.actorHead.b)
            },
            critic: {
                w: new AdamOptimizer(this.criticHead.w),
                b: new AdamOptimizer(this.criticHead.b)
            }
        };

        for (const layer of this.layers) {
            this.optimizers.layers.push({
                w: new AdamOptimizer(layer.w),
                b: new AdamOptimizer(layer.b)
            });
        }

        // Store activations for visualization
        this.lastInput = null;
        this.lastHidden = [];
        this.lastOutput = null;
        this.lastValue = 0;
    }

    heInitialize(inputSize, outputSize) {
        // He initialization for Uniform distribution: sqrt(6 / n)
        const scale = Math.sqrt(6.0 / inputSize);
        const matrix = [];
        for (let i = 0; i < inputSize; i++) {
            matrix[i] = new Float32Array(outputSize);
            for (let j = 0; j < outputSize; j++) {
                matrix[i][j] = (Math.random() - 0.5) * 2 * scale;
            }
        }
        return matrix;
    }

    activate(x, derivative = false) {
        switch (this.activation) {
            case 'relu':
                return derivative ? (x > 0 ? 1 : 0) : Math.max(0, x);
            case 'tanh':
                if (derivative) {
                    const t = Math.tanh(x);
                    return 1 - t * t;
                }
                return Math.tanh(x);
            case 'elu':
                const alpha = 1.0;
                if (derivative) {
                    return x > 0 ? 1 : alpha * Math.exp(x);
                }
                return x > 0 ? x : alpha * (Math.exp(x) - 1);
            case 'swish':
                const sigmoid = 1 / (1 + Math.exp(-x));
                if (derivative) {
                    return sigmoid + x * sigmoid * (1 - sigmoid);
                }
                return x * sigmoid;
            default:
                return derivative ? (x > 0 ? 1 : 0) : Math.max(0, x);
        }
    }

    softmax(arr) {
        const max = Math.max(...arr);
        const exps = new Float32Array(arr.length);
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
            exps[i] = Math.exp(arr[i] - max);
            sum += exps[i];
        }
        const result = new Float32Array(arr.length);
        for (let i = 0; i < arr.length; i++) {
            result[i] = exps[i] / sum;
        }
        return result;
    }

    forward(input) {
        this.lastInput = new Float32Array(input);
        this.lastHidden = [];
        this.lastPreActivation = [];

        let current = input;

        // Forward through hidden layers
        for (let layerIdx = 0; layerIdx < this.layers.length; layerIdx++) {
            const layer = this.layers[layerIdx];
            const nextLayer = new Float32Array(layer.b.length);
            const preActivations = new Float32Array(layer.b.length);

            for (let i = 0; i < layer.b.length; i++) {
                let sum = layer.b[i];
                for (let j = 0; j < current.length; j++) {
                    sum += current[j] * layer.w[j][i];
                }
                preActivations[i] = sum;
                nextLayer[i] = this.activate(sum);
            }

            this.lastPreActivation.push(new Float32Array(preActivations));
            this.lastHidden.push(new Float32Array(nextLayer));
            current = nextLayer;
        }

        // Actor output (policy)
        const actorOutput = new Float32Array(this.outputSize);
        for (let i = 0; i < this.outputSize; i++) {
            let sum = this.actorHead.b[i];
            for (let j = 0; j < current.length; j++) {
                sum += current[j] * this.actorHead.w[j][i];
            }
            actorOutput[i] = sum;
        }
        this.lastOutput = this.softmax(actorOutput);

        // Critic output (value)
        let valueSum = this.criticHead.b[0];
        for (let j = 0; j < current.length; j++) {
            valueSum += current[j] * this.criticHead.w[j][0];
        }
        this.lastValue = valueSum;

        return { policy: this.lastOutput, value: this.lastValue };
    }

    selectAction(state, exploration = 0.0) {
        const { policy } = this.forward(state);

        // Epsilon-greedy exploration
        if (exploration > 0 && Math.random() < exploration) {
            return Math.random() < 0.5 ? 0 : 1;
        }

        // Sample from policy distribution
        const rand = Math.random();
        let cumProb = 0;
        for (let i = 0; i < policy.length; i++) {
            cumProb += policy[i];
            if (rand < cumProb) return i;
        }
        return policy.length - 1;
    }

    getEntropy() {
        if (!this.lastOutput) return 0;
        let entropy = 0;
        for (let i = 0; i < this.lastOutput.length; i++) {
            const p = this.lastOutput[i];
            if (p > 0) {
                entropy -= p * Math.log(p);
            }
        }
        return entropy;
    }

    getAvgWeight(weights) {
        let sum = 0;
        let count = 0;
        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < weights[i].length; j++) {
                sum += Math.abs(weights[i][j]);
                count++;
            }
        }
        return count > 0 ? sum / count : 0;
    }

    // Actor-Critic update with GAE (Generalized Advantage Estimation)
    update(trajectory, gamma, entropyCoef = 0.01, valueCoef = 0.5, maxGradNorm = 1.0, gae_lambda = 0.95) {
        // Calculate returns and values
        const returns = [];
        const values = [];
        const advantages = [];
        let totalActorLoss = 0;
        let totalCriticLoss = 0;

        // Forward pass to get all values
        for (let i = 0; i < trajectory.length; i++) {
            const { value } = this.forward(trajectory[i].state);
            values.push(value);
        }

        // Calculate TD residuals and GAE advantages
        let gae = 0;
        for (let i = trajectory.length - 1; i >= 0; i--) {
            const reward = trajectory[i].reward;
            const value = values[i];
            const nextValue = i < trajectory.length - 1 ? values[i + 1] : 0;

            // TD error: δ = r + γV(s') - V(s)
            const delta = reward + gamma * nextValue - value;

            // GAE: A = δ + (γλ)δ' + (γλ)²δ'' + ...
            gae = delta + gamma * gae_lambda * gae;
            advantages.unshift(gae);

            // Return = A + V
            returns.unshift(gae + value);
        }

        // Normalize advantages (critical for stability)
        const advMean = advantages.reduce((a, b) => a + b, 0) / advantages.length;
        const advStd = Math.sqrt(advantages.reduce((a, b) => a + (b - advMean) ** 2, 0) / advantages.length);
        const normalizedAdv = advantages.map(a => (a - advMean) / (advStd + 1e-8));

        // Accumulate gradients with Float32Array
        const layerGrads = this.layers.map(layer => ({
            w: layer.w.map(row => new Float32Array(row.length)),
            b: new Float32Array(layer.b.length)
        }));

        const actorGrad = {
            w: this.actorHead.w.map(row => new Float32Array(row.length)),
            b: new Float32Array(this.actorHead.b.length)
        };

        const criticGrad = {
            w: this.criticHead.w.map(row => new Float32Array(row.length)),
            b: new Float32Array(this.criticHead.b.length)
        };

        for (let t = 0; t < trajectory.length; t++) {
            const { state, action } = trajectory[t];
            const advantage = normalizedAdv[t];
            const returnValue = returns[t];

            // Forward pass
            const { policy, value } = this.forward(state);

            // Actor loss: -log(π(a|s)) * A(s,a) - H(π(s)) * entropy_coef
            const actionProb = policy[action];
            const logProb = Math.log(actionProb + 1e-10);
            let entropy = 0;
            for (const p of policy) {
                if (p > 0) entropy -= p * Math.log(p);
            }
            const actorLoss = -logProb * advantage - entropyCoef * entropy;
            totalActorLoss += actorLoss;

            // Critic loss: MSE between value and return
            const criticLoss = valueCoef * (value - returnValue) ** 2;
            totalCriticLoss += criticLoss;

            // Actor loss gradients (policy gradient with advantage)
            const actorOutputGrad = new Float32Array(policy);

            actorOutputGrad[action] -= 1;
            for (let i = 0; i < this.outputSize; i++) {
                actorOutputGrad[i] *= advantage;
                // Entropy bonus: d(beta * H)/dz = beta * p * (log(p) + H)
                // We want to ascend, so we subtract negative gradient: - ( - beta * ... )
                // Gradient collected is negative of objective gradient.
                actorOutputGrad[i] += entropyCoef * policy[i] * (Math.log(policy[i] + 1e-10) + entropy);
            }

            // Critic loss gradients (MSE with returns)
            const criticOutputGrad = new Float32Array(1);
            criticOutputGrad[0] = 2 * valueCoef * (value - returnValue);

            // Backprop through network
            this.backprop(state, actorOutputGrad, criticOutputGrad, layerGrads, actorGrad, criticGrad);
        }

        // Clip gradients by global norm
        const totalNorm = this.getGradientNorm([...layerGrads, actorGrad, criticGrad]);
        const clipCoef = Math.min(1.0, maxGradNorm / (totalNorm + 1e-10));

        if (clipCoef < 1.0) {
            this.scaleGradients([...layerGrads, actorGrad, criticGrad], clipCoef);
        }

        // Update weights with Adam
        const batchSize = trajectory.length;
        for (let i = 0; i < this.layers.length; i++) {
            const scaledWGrad = layerGrads[i].w.map(row => {
                const scaled = new Float32Array(row.length);
                for (let j = 0; j < row.length; j++) {
                    scaled[j] = row[j] / batchSize;
                }
                return scaled;
            });
            const scaledBGrad = new Float32Array(layerGrads[i].b.length);
            for (let j = 0; j < layerGrads[i].b.length; j++) {
                scaledBGrad[j] = layerGrads[i].b[j] / batchSize;
            }
            this.optimizers.layers[i].w.update(this.layers[i].w, scaledWGrad);
            this.optimizers.layers[i].b.update(this.layers[i].b, scaledBGrad);
        }

        const scaledActorWGrad = actorGrad.w.map(row => {
            const scaled = new Float32Array(row.length);
            for (let j = 0; j < row.length; j++) {
                scaled[j] = row[j] / batchSize;
            }
            return scaled;
        });
        const scaledActorBGrad = new Float32Array(actorGrad.b.length);
        for (let j = 0; j < actorGrad.b.length; j++) {
            scaledActorBGrad[j] = actorGrad.b[j] / batchSize;
        }
        this.optimizers.actor.w.update(this.actorHead.w, scaledActorWGrad);
        this.optimizers.actor.b.update(this.actorHead.b, scaledActorBGrad);

        const scaledCriticWGrad = criticGrad.w.map(row => {
            const scaled = new Float32Array(row.length);
            for (let j = 0; j < row.length; j++) {
                scaled[j] = row[j] / batchSize;
            }
            return scaled;
        });
        const scaledCriticBGrad = new Float32Array(criticGrad.b.length);
        for (let j = 0; j < criticGrad.b.length; j++) {
            scaledCriticBGrad[j] = criticGrad.b[j] / batchSize;
        }
        this.optimizers.critic.w.update(this.criticHead.w, scaledCriticWGrad);
        this.optimizers.critic.b.update(this.criticHead.b, scaledCriticBGrad);

        return {
            avgAdvantage: advantages.reduce((a, b) => a + b, 0) / advantages.length,
            avgReturn: returns.reduce((a, b) => a + b, 0) / returns.length,
            gradNorm: totalNorm,
            actorLoss: totalActorLoss / batchSize,
            criticLoss: totalCriticLoss / batchSize
        };
    }

    getGradientNorm(grads) {
        let sum = 0;
        for (const grad of grads) {
            for (let i = 0; i < grad.w.length; i++) {
                for (let j = 0; j < grad.w[i].length; j++) {
                    sum += grad.w[i][j] * grad.w[i][j];
                }
            }
            for (let i = 0; i < grad.b.length; i++) {
                sum += grad.b[i] * grad.b[i];
            }
        }
        return Math.sqrt(sum);
    }

    scaleGradients(grads, scale) {
        for (const grad of grads) {
            for (let i = 0; i < grad.w.length; i++) {
                for (let j = 0; j < grad.w[i].length; j++) {
                    grad.w[i][j] *= scale;
                }
            }
            for (let i = 0; i < grad.b.length; i++) {
                grad.b[i] *= scale;
            }
        }
    }

    backprop(state, actorOutputGrad, criticOutputGrad, layerGrads, actorGrad, criticGrad) {
        // Get last hidden layer
        const lastHidden = this.lastHidden[this.lastHidden.length - 1];

        // Actor head gradients
        for (let i = 0; i < lastHidden.length; i++) {
            for (let j = 0; j < this.outputSize; j++) {
                actorGrad.w[i][j] += lastHidden[i] * actorOutputGrad[j];
            }
        }
        for (let i = 0; i < this.outputSize; i++) {
            actorGrad.b[i] += actorOutputGrad[i];
        }

        // Critic head gradients
        for (let i = 0; i < lastHidden.length; i++) {
            criticGrad.w[i][0] += lastHidden[i] * criticOutputGrad[0];
        }
        criticGrad.b[0] += criticOutputGrad[0];

        // Backprop to last hidden layer
        let currentGrad = new Float32Array(lastHidden.length);
        for (let i = 0; i < lastHidden.length; i++) {
            for (let j = 0; j < this.outputSize; j++) {
                currentGrad[i] += actorOutputGrad[j] * this.actorHead.w[i][j];
            }
            currentGrad[i] += criticOutputGrad[0] * this.criticHead.w[i][0];
        }

        // Backprop through hidden layers
        for (let layerIdx = this.layers.length - 1; layerIdx >= 0; layerIdx--) {
            const layer = this.layers[layerIdx];
            const hidden = this.lastHidden[layerIdx];
            const preActivation = this.lastPreActivation[layerIdx];
            const prevActivation = layerIdx > 0 ? this.lastHidden[layerIdx - 1] : this.lastInput;

            // Apply activation derivative (using pre-activation values)
            for (let i = 0; i < currentGrad.length; i++) {
                currentGrad[i] *= this.activate(preActivation[i], true);
            }

            // Accumulate weight and bias gradients
            for (let i = 0; i < prevActivation.length; i++) {
                for (let j = 0; j < hidden.length; j++) {
                    layerGrads[layerIdx].w[i][j] += prevActivation[i] * currentGrad[j];
                }
            }
            for (let i = 0; i < hidden.length; i++) {
                layerGrads[layerIdx].b[i] += currentGrad[i];
            }

            // Propagate gradient to previous layer
            if (layerIdx > 0) {
                const nextGrad = new Float32Array(prevActivation.length);
                for (let i = 0; i < prevActivation.length; i++) {
                    for (let j = 0; j < hidden.length; j++) {
                        nextGrad[i] += currentGrad[j] * layer.w[i][j];
                    }
                }
                currentGrad = nextGrad;
            }
        }
    }

    // For visualization compatibility
    get w1() { return this.layers[0]?.w || []; }
    get w2() { return this.layers.length > 1 ? this.layers[1].w : this.actorHead.w; }
    get hiddenSize() { return this.hiddenSizes[0]; }

    setLearningRate(lr) {
        // Update learning rate for all optimizers
        for (const layerOpt of this.optimizers.layers) {
            layerOpt.w.learningRate = lr;
            layerOpt.b.learningRate = lr;
        }
        this.optimizers.actor.w.learningRate = lr;
        this.optimizers.actor.b.learningRate = lr;
        this.optimizers.critic.w.learningRate = lr;
        this.optimizers.critic.b.learningRate = lr;
    }

    // Calculate input importance using gradient magnitude (saliency)
    getInputImportance(state) {
        // Forward pass to get current output
        const { policy, value } = this.forward(state);

        // Calculate how much each input affects the output
        const importance = new Float32Array(state.length);

        // Use first layer weights as proxy for importance
        if (this.layers[0]) {
            const weights = this.layers[0].w;
            for (let i = 0; i < state.length; i++) {
                let totalWeight = 0;
                for (let j = 0; j < weights[i].length; j++) {
                    totalWeight += Math.abs(weights[i][j]);
                }
                // Multiply by absolute state value to get actual influence
                importance[i] = Math.abs(state[i]) * totalWeight;
            }
        }

        return importance;
    }
}
