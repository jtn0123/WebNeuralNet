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
                w: this.orthogonalInitialize(prevSize, hiddenSize),
                b: new Float32Array(hiddenSize),
                type: 'hidden'
            });
            prevSize = hiddenSize;
        }

        // Actor head (policy)
        this.actorHead = {
            w: this.orthogonalInitialize(prevSize, outputSize),
            b: new Float32Array(outputSize)
        };

        // Critic head (value function)
        this.criticHead = {
            w: this.orthogonalInitialize(prevSize, 1),
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

        // Track gradient magnitudes for gradient flow visualization
        this.lastGradientMagnitudes = {
            layers: this.layers.map(() => ({ w: 0, b: 0 })),
            actor: { w: 0, b: 0 },
            critic: { w: 0, b: 0 }
        };

        // Pre-allocate reusable buffers for performance
        this.bufferPool = {
            softmax: {
                exps: new Float32Array(this.outputSize),
                result: new Float32Array(this.outputSize)
            },
            forward: {
                input: new Float32Array(this.inputSize),
                hidden: this.hiddenSizes.map(size => new Float32Array(size)),
                preActivations: this.hiddenSizes.map(size => new Float32Array(size)),
                actorOutput: new Float32Array(this.outputSize),
                criticOutput: new Float32Array(1)
            },
            gradients: {
                layers: this.layers.map(layer => ({
                    w: layer.w.map(row => new Float32Array(row.length)),
                    b: new Float32Array(layer.b.length)
                })),
                actor: {
                    w: this.actorHead.w.map(row => new Float32Array(row.length)),
                    b: new Float32Array(this.actorHead.b.length)
                },
                critic: {
                    w: this.criticHead.w.map(row => new Float32Array(row.length)),
                    b: new Float32Array(this.criticHead.b.length)
                }
            },
            actorOutputGrad: new Float32Array(this.outputSize)
        };
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

    // Orthogonal initialization for better convergence
    orthogonalInitialize(inputSize, outputSize) {
        const a = [];
        for (let i = 0; i < Math.max(inputSize, outputSize); i++) {
            a[i] = new Float32Array(Math.max(inputSize, outputSize));
            for (let j = 0; j < Math.max(inputSize, outputSize); j++) {
                a[i][j] = Math.random() * 2 - 1; // Normal-ish random
            }
        }

        // QR decomposition (simplified Gram-Schmidt)
        for (let i = 0; i < Math.max(inputSize, outputSize); i++) {
            let norm = 0;
            for (let k = 0; k < i; k++) {
                let dot = 0;
                for (let j = 0; j < Math.max(inputSize, outputSize); j++) {
                    dot += a[i][j] * a[k][j];
                }
                for (let j = 0; j < Math.max(inputSize, outputSize); j++) {
                    a[i][j] -= dot * a[k][j];
                }
            }
            for (let j = 0; j < Math.max(inputSize, outputSize); j++) {
                norm += a[i][j] * a[i][j];
            }
            norm = Math.sqrt(norm);
            if (norm > 1e-10) {
                for (let j = 0; j < Math.max(inputSize, outputSize); j++) {
                    a[i][j] /= norm;
                }
            }
        }

        // Extract to proper size
        const matrix = [];
        for (let i = 0; i < inputSize; i++) {
            matrix[i] = new Float32Array(outputSize);
            for (let j = 0; j < outputSize; j++) {
                matrix[i][j] = a[i][j];
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
        const exps = this.bufferPool.softmax.exps;
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
            exps[i] = Math.exp(arr[i] - max);
            sum += exps[i];
        }
        const result = this.bufferPool.softmax.result;
        for (let i = 0; i < arr.length; i++) {
            result[i] = exps[i] / sum;
        }
        // Return a copy to prevent external mutation of pooled buffer
        return new Float32Array(result);
    }

    forward(input) {
        this.lastInput = new Float32Array(input);
        this.lastHidden = [];
        this.lastPreActivation = [];

        let current = input;

        // Forward through hidden layers
        for (let layerIdx = 0; layerIdx < this.layers.length; layerIdx++) {
            const layer = this.layers[layerIdx];
            const preActivations = this.bufferPool.forward.preActivations[layerIdx];
            const nextLayer = this.bufferPool.forward.hidden[layerIdx];

            for (let i = 0; i < layer.b.length; i++) {
                let sum = layer.b[i];
                for (let j = 0; j < current.length; j++) {
                    sum += current[j] * layer.w[j][i];
                }
                preActivations[i] = sum;
                nextLayer[i] = this.activate(sum);
            }

            // Store copies for visualization
            this.lastPreActivation.push(new Float32Array(preActivations));
            this.lastHidden.push(new Float32Array(nextLayer));
            current = nextLayer;
        }

        // Actor output (policy)
        const actorOutput = this.bufferPool.forward.actorOutput;
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
        // Store raw value without clipping (PPO clipping happens in loss, not output)
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

            // Zero out pooled gradient buffers for this epoch (instead of allocating)
            const layerGrads = this.bufferPool.gradients.layers;
            const actorGrad = this.bufferPool.gradients.actor;
            const criticGrad = this.bufferPool.gradients.critic;

            // Zero all gradients
            for (let layerIdx = 0; layerIdx < layerGrads.length; layerIdx++) {
                for (let i = 0; i < layerGrads[layerIdx].w.length; i++) {
                    layerGrads[layerIdx].w[i].fill(0);
                }
                layerGrads[layerIdx].b.fill(0);
            }
            for (let i = 0; i < actorGrad.w.length; i++) {
                actorGrad.w[i].fill(0);
            }
            actorGrad.b.fill(0);
            for (let i = 0; i < criticGrad.w.length; i++) {
                criticGrad.w[i].fill(0);
            }
            criticGrad.b.fill(0);

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

                const actorOutputGrad = this.bufferPool.actorOutputGrad;
                actorOutputGrad.set(policy);

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


                // Critic Loss: PPO Value Clipping with Huber Loss
                // PPO clips the value prediction between old value and new value
                const oldValue = value; // From initial forward pass
                const valueClipEpsilon = 0.2; // PPO value clip range
                const clippedValue = oldValue + Math.max(-valueClipEpsilon, Math.min(valueClipEpsilon, currentValue - oldValue));

                // Calculate both unclipped and clipped losses (Huber)
                const diff = currentValue - returnValue;
                const diffClipped = clippedValue - returnValue;
                const huberDelta = 1.0;

                // Unclipped loss
                let unclippedLoss;
                if (Math.abs(diff) <= huberDelta) {
                    unclippedLoss = 0.5 * diff * diff;
                } else {
                    unclippedLoss = huberDelta * (Math.abs(diff) - 0.5 * huberDelta);
                }

                // Clipped loss
                let clippedLoss;
                if (Math.abs(diffClipped) <= huberDelta) {
                    clippedLoss = 0.5 * diffClipped * diffClipped;
                } else {
                    clippedLoss = huberDelta * (Math.abs(diffClipped) - 0.5 * huberDelta);
                }

                // Use max loss (PPO-style, protects old policy)
                const valueLoss = Math.max(unclippedLoss, clippedLoss);
                epochCriticLoss += valueLoss;

                // Use gradient from whichever loss is larger
                let gradFactor;
                if (unclippedLoss >= clippedLoss) {
                    // Gradient from unclipped
                    const absDiff = Math.abs(diff);
                    gradFactor = absDiff <= huberDelta ? diff : huberDelta * Math.sign(diff);
                } else {
                    // Gradient from clipped (which means gradient is zero if clipped is protecting)
                    const absDiffClipped = Math.abs(diffClipped);
                    gradFactor = absDiffClipped <= huberDelta ? diffClipped : huberDelta * Math.sign(diffClipped);
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

                // Calculate gradient magnitudes for visualization
                for (let i = 0; i < layerGrads.length; i++) {
                    let wMag = 0, bMag = 0;
                    for (let j = 0; j < layerGrads[i].w.length; j++) {
                        for (let k = 0; k < layerGrads[i].w[j].length; k++) {
                            wMag += layerGrads[i].w[j][k] * layerGrads[i].w[j][k];
                        }
                    }
                    for (let j = 0; j < layerGrads[i].b.length; j++) {
                        bMag += layerGrads[i].b[j] * layerGrads[i].b[j];
                    }
                    this.lastGradientMagnitudes.layers[i].w = Math.sqrt(wMag) / (layerGrads[i].w.length + 1e-10);
                    this.lastGradientMagnitudes.layers[i].b = Math.sqrt(bMag) / (layerGrads[i].b.length + 1e-10);
                }

                // Actor and critic gradient magnitudes
                let actorWMag = 0, actorBMag = 0;
                for (let j = 0; j < actorGrad.w.length; j++) {
                    for (let k = 0; k < actorGrad.w[j].length; k++) {
                        actorWMag += actorGrad.w[j][k] * actorGrad.w[j][k];
                    }
                }
                for (let j = 0; j < actorGrad.b.length; j++) {
                    actorBMag += actorGrad.b[j] * actorGrad.b[j];
                }
                this.lastGradientMagnitudes.actor.w = Math.sqrt(actorWMag) / (actorGrad.w.length + 1e-10);
                this.lastGradientMagnitudes.actor.b = Math.sqrt(actorBMag) / (actorGrad.b.length + 1e-10);

                let criticWMag = 0, criticBMag = 0;
                for (let j = 0; j < criticGrad.w.length; j++) {
                    for (let k = 0; k < criticGrad.w[j].length; k++) {
                        criticWMag += criticGrad.w[j][k] * criticGrad.w[j][k];
                    }
                }
                for (let j = 0; j < criticGrad.b.length; j++) {
                    criticBMag += criticGrad.b[j] * criticGrad.b[j];
                }
                this.lastGradientMagnitudes.critic.w = Math.sqrt(criticWMag) / (criticGrad.w.length + 1e-10);
                this.lastGradientMagnitudes.critic.b = Math.sqrt(criticBMag) / (criticGrad.b.length + 1e-10);
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
