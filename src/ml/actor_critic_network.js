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

        // Epsilon-greedy exploration with reduced probability
        if (exploration > 0 && Math.random() < exploration * 0.5) {
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

    // Actor-Critic update with PPO-Clip and GAE
    update(trajectories, gamma, entropyCoef = 0.01, valueCoef = 0.1, maxGradNorm = 1.0, gae_lambda = 0.95, epochs = 4) {
        // Handle single trajectory case for backward compatibility
        if (!Array.isArray(trajectories[0])) {
            trajectories = [trajectories];
        }

        const allAdvantages = [];
        const allReturns = [];
        const allValues = [];
        const flatTrajectory = [];

        let totalActorLoss = 0;
        let totalCriticLoss = 0;

        // 1. Calculate Returns and Advantages for each trajectory
        for (const trajectory of trajectories) {
            const values = [];
            
            // Forward pass to get values (Value function target calculation)
            for (let i = 0; i < trajectory.length; i++) {
                const { value } = this.forward(trajectory[i].state);
                values.push(value);
                flatTrajectory.push(trajectory[i]);
                allValues.push(value);
            }

            // Calculate TD residuals and GAE
            let gae = 0;
            const trajectoryAdvantages = new Array(trajectory.length);
            const trajectoryReturns = new Array(trajectory.length);

            for (let i = trajectory.length - 1; i >= 0; i--) {
                const reward = trajectory[i].reward;
                const value = values[i];
                const nextValue = i < trajectory.length - 1 ? values[i + 1] : 0;

                // TD error: δ = r + γV(s') - V(s)
                const delta = reward + gamma * nextValue - value;

                // GAE: A = δ + (γλ)δ' + (γλ)²δ'' + ...
                gae = delta + gamma * gae_lambda * gae;
                
                trajectoryAdvantages[i] = gae;
                trajectoryReturns[i] = gae + value;
            }
            
            allAdvantages.push(...trajectoryAdvantages);
            allReturns.push(...trajectoryReturns);
        }

        // 2. Normalize advantages across the entire batch (Critical for PPO)
        const advMean = allAdvantages.reduce((a, b) => a + b, 0) / allAdvantages.length;
        const advStd = Math.sqrt(allAdvantages.reduce((a, b) => a + (b - advMean) ** 2, 0) / allAdvantages.length);
        const normalizedAdv = allAdvantages.map(a => (a - advMean) / Math.max(advStd, 1e-8));

        const batchSize = flatTrajectory.length;
        const ppoEpsilon = 0.2; // PPO clip parameter

        // PPO Loop: Multiple epochs over the same batch
        for (let epoch = 0; epoch < epochs; epoch++) {
            
            // Initialize gradient accumulators for this epoch
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

            let epochActorLoss = 0;
            let epochCriticLoss = 0;

            // Iterate through all samples in batch
            for (let i = 0; i < flatTrajectory.length; i++) {
                const { state, action, prob: oldProb } = flatTrajectory[i];
                const advantage = normalizedAdv[i];
                const returnValue = allReturns[i];
                const value = allValues[i]; // Using fixed targets for stability within epochs
                
                // Re-forward to get CURRENT policy probabilities
                const { policy, value: currentValue } = this.forward(state);
                const newProb = policy[action];

                // Calculate Ratio: r(theta) = pi_new / pi_old
                // Handle minimal probability to avoid NaN
                const ratio = newProb / Math.max(oldProb || 1.0 / this.outputSize, 1e-10);

                // PPO Actor Loss
                // L^CLIP = min(r*A, clip(r, 1-e, 1+e)*A)
                
                const unclippedObj = ratio * advantage;
                const clippedRatio = Math.max(1 - ppoEpsilon, Math.min(1 + ppoEpsilon, ratio));
                const clippedObj = clippedRatio * advantage;
                
                // We minimize Negative Loss, so maximizing Objective
                // Loss = -min(unclipped, clipped)
                
                // Calculate Entropy
                let entropy = 0;
                for (const p of policy) {
                    if (p > 0) entropy -= p * Math.log(p);
                }

                // Total Actor Loss for Stats
                const actorLoss = -Math.min(unclippedObj, clippedObj) - entropyCoef * entropy;
                epochActorLoss += actorLoss;

                // PPO Gradient Calculation
                // If clipped term is smaller, gradient is 0 (unless we are moving back towards range).
                // Ideally: gradient is A * r * (1/newProb) * grad(newProb) IF not clipped.
                // Gradient w.r.t LOGITS (z):
                // dL/dz = - A * r * (1 - p_new) if action=target
                // dL/dz = A * r * p_new if action!=target
                // This simplifies to: grad_input = - A * ratio * (onehot - p_new)

                // Check if we should update (unclipped or improving)
                let ppoGradFactor = 0;

                if (unclippedObj <= clippedObj) {
                    // Unclipped region: normal gradient scaled by ratio
                    ppoGradFactor = ratio;
                } else {
                    // Clipped region: gradient is zero
                     ppoGradFactor = 0;
                }

                const actorOutputGrad = new Float32Array(policy);

                // Standard PG Logic adjusted for PPO:
                // Standard: (p - 1) * A
                // PPO: (p - 1) * A * ratio

                actorOutputGrad[action] -= 1;
                for (let j = 0; j < this.outputSize; j++) {
                    actorOutputGrad[j] *= advantage * ppoGradFactor; // Apply ratio scale if unclipped

                    // Add entropy gradient (scaled by actual entropy, not constant)
                    const p = policy[j];
                    if (p > 1e-10) {
                        actorOutputGrad[j] -= entropyCoef * (Math.log(p + 1e-10) + entropy) * p;
                    }
                }


                // Critic Loss: Huber Loss
                // Using currentValue from this forward pass for gradients
                const diff = currentValue - returnValue;
                const absDiff = Math.abs(diff);
                const huberDelta = 1.0;
                let gradFactor;

                if (absDiff <= huberDelta) {
                    epochCriticLoss += 0.5 * diff * diff;
                    gradFactor = diff;
                } else {
                    epochCriticLoss += huberDelta * (absDiff - 0.5 * huberDelta);
                    gradFactor = huberDelta * Math.sign(diff);
                }
                
                // Critic gradients
                const criticOutputGrad = new Float32Array(1);
                criticOutputGrad[0] = valueCoef * gradFactor;

                // Backprop
                this.backprop(state, actorOutputGrad, criticOutputGrad, layerGrads, actorGrad, criticGrad);
            }
            
            // Average gradients
            const allGrads = [...layerGrads, actorGrad, criticGrad];
            for (const grad of allGrads) {
                for (let i = 0; i < grad.w.length; i++) {
                    for (let j = 0; j < grad.w[i].length; j++) {
                        grad.w[i][j] /= batchSize;
                    }
                }
                for (let i = 0; i < grad.b.length; i++) {
                    grad.b[i] /= batchSize;
                }
            }

            // Clip gradients
            const totalNorm = this.getGradientNorm(allGrads);
            const clipCoef = Math.min(1.0, maxGradNorm / (totalNorm + 1e-10));
            if (clipCoef < 1.0) {
                this.scaleGradients(allGrads, clipCoef);
            }

            // Apply updates
            for (let i = 0; i < this.layers.length; i++) {
                this.optimizers.layers[i].w.update(this.layers[i].w, layerGrads[i].w);
                this.optimizers.layers[i].b.update(this.layers[i].b, layerGrads[i].b);
            }
            this.optimizers.actor.w.update(this.actorHead.w, actorGrad.w);
            this.optimizers.actor.b.update(this.actorHead.b, actorGrad.b);
            this.optimizers.critic.w.update(this.criticHead.w, criticGrad.w);
            this.optimizers.critic.b.update(this.criticHead.b, criticGrad.b);

            // Keep stats for last epoch
            if (epoch === epochs - 1) {
                 totalActorLoss = epochActorLoss / batchSize;
                 totalCriticLoss = epochCriticLoss / batchSize;
            }
        }

        return {
            avgAdvantage: advMean,
            avgReturn: allReturns.reduce((a, b) => a + b, 0) / allReturns.length,
            gradNorm: 0, // Not meaningful over multiple epochs/batches usually, or use last
            actorLoss: totalActorLoss,
            criticLoss: totalCriticLoss
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
