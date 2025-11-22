import { CONSTANTS } from '../utils/constants.js';
import { log, copyLogs } from '../utils/helpers.js';
import { Toast } from '../utils/toast.js';
import { CartPole } from '../ml/cartpole.js';
import { ActorCriticNetwork } from '../ml/actor_critic_network.js';
import { Renderer } from '../viz/renderer.js';
import { NetworkVisualizer } from '../viz/network_visualizer.js';
import { TrainingChart } from '../viz/training_chart.js';
import { TrainingLossChart } from '../viz/training_loss_chart.js';
import { StateSpaceHeatmap } from '../viz/state_space_heatmap.js';
import { MetricsDashboard } from '../ui/metrics_dashboard.js';

// Main application
export class RLSandbox {
    constructor() {
        this.env = new CartPole();
        this.network = null;
        this.renderer = new Renderer('cartpole-canvas');
        this.visualizer = new NetworkVisualizer('network-svg');
        this.chart = new TrainingChart('training-chart');

        // Advanced features
        this.lossChart = new TrainingLossChart('training-loss-chart');
        this.metricsDashboard = new MetricsDashboard();
        this.heatmap = new StateSpaceHeatmap('state-space-heatmap');

        this.isTraining = false;
        this.isTesting = false;
        this.isManual = false;
        this.isPaused = false;
        this.episode = 0;
        this.survivalHistory = [];
        this.explorationHistory = [];
        this.currentTrajectory = [];
        this.manualAction = null;
        this.trainingSpeed = CONSTANTS.DEFAULT_TRAINING_SPEED;
        this.exploration = CONSTANTS.INITIAL_EXPLORATION;
        this.explorationDecay = CONSTANTS.EXPLORATION_DECAY;
        this.minExploration = CONSTANTS.MIN_EXPLORATION;
        this.gaeLambda = CONSTANTS.DEFAULT_GAE_LAMBDA;
        this.frameCounter = 0; // For SVG update throttling
        this.initialLearningRate = parseFloat(document.getElementById('learning-rate').value);

        // Training diagnostics
        this.lastGradNorm = 0;
        this.lastAvgAdvantage = 0;
        this.lastAvgReturn = 0;
        this.lastActorLoss = 0;
        this.lastCriticLoss = 0;
        
        this.batchBuffer = [];

        this.initNetwork();
        this.setupControls();
        this.setupKeyboard();
        this.setupGlobalKeyboardShortcuts();
        this.updateMetrics();
        this.updateActionBars();
        this.updateStateDisplay();
        this.updateNetworkStats();
        this.animate();

        log('CartPole RL Sandbox initialized');
        log('Using Actor-Critic with GAE (λ=0.95) and Adam optimizer');
        log('Network sees 4 inputs: position, velocity, angle, angular velocity');
        log('Pole angle & angular velocity are MOST IMPORTANT for balancing!');
        log('Watch Input Importance bars to see what the network focuses on');
        log('Better exploration: ε starts at 0.20, decays slowly to 0.05');
        log('Gradient norm and advantage metrics show training health');
    }

    normalizeState(state) {
        // Normalize inputs to roughly [-1, 1] range for better network performance
        return [
            state[0] / CONSTANTS.MAX_X,
            state[1] / CONSTANTS.MAX_X_DOT,
            state[2] / CONSTANTS.MAX_THETA,
            state[3] / CONSTANTS.MAX_THETA_DOT
        ];
    }

    initNetwork() {
        this.batchBuffer = [];
        const hiddenSize = parseInt(document.getElementById('hidden-size').value);
        const depth = parseInt(document.getElementById('network-depth').value);
        const activation = document.getElementById('activation').value;

        // Create hidden layer configuration
        const hiddenSizes = Array(depth).fill(hiddenSize);

        this.network = new ActorCriticNetwork(4, hiddenSizes, 2, activation);
        this.visualizer.visualize(this.network);
        log(`Network created: 4 → ${hiddenSizes.join(' → ')} → 2 (Actor) + 1 (Critic)`);
        log(`Activation: ${activation.toUpperCase()}, Optimizer: Adam`);
    }

    setupControls() {
        document.getElementById('train-btn').addEventListener('click', () => this.toggleTraining());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('test-btn').addEventListener('click', () => this.testPolicy());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetPolicy());
        document.getElementById('manual-btn').addEventListener('click', () => this.toggleManual());

        // Log Management
        document.getElementById('copy-logs-btn').addEventListener('click', () => copyLogs());

        // Network Management buttons
        document.getElementById('save-network-btn').addEventListener('click', () => this.saveNetwork());
        document.getElementById('load-network-btn').addEventListener('click', () => this.loadNetwork());
        document.getElementById('export-data-btn').addEventListener('click', () => this.exportTrainingData());

        // Preset buttons
        document.getElementById('preset-quick').addEventListener('click', () => this.applyPreset('quick'));
        document.getElementById('preset-deep').addEventListener('click', () => this.applyPreset('deep'));
        document.getElementById('preset-exploration').addEventListener('click', () => this.applyPreset('exploration'));
        document.getElementById('preset-production').addEventListener('click', () => this.applyPreset('production'));

        document.getElementById('hidden-size').addEventListener('change', (e) => {
            const size = parseInt(e.target.value);
            if (size < 16 || size > 256 || size % 8 !== 0) {
                Toast.error('Hidden layer size must be between 16 and 256 (multiples of 8)');
                e.target.value = '32';
                return;
            }
            if (!this.isTraining && !this.isManual) {
                this.initNetwork();
            }
        });

        document.getElementById('network-depth').addEventListener('change', () => {
            if (!this.isTraining && !this.isManual) {
                this.initNetwork();
            }
        });

        document.getElementById('activation').addEventListener('change', () => {
            if (!this.isTraining && !this.isManual) {
                this.initNetwork();
            }
        });

        document.getElementById('learning-rate').addEventListener('change', (e) => {
            const lr = parseFloat(e.target.value);
            if (lr < 0.0001 || lr > 0.01) {
                Toast.error('Learning rate must be between 0.0001 and 0.01');
                e.target.value = '0.003';
                return;
            }
            this.network.setLearningRate(lr);
            log(`Learning rate updated to ${lr}`);
        });

        document.getElementById('discount').addEventListener('change', (e) => {
            const gamma = parseFloat(e.target.value);
            if (gamma < 0.9 || gamma > 1.0) {
                Toast.error('Discount factor must be between 0.9 and 1.0');
                e.target.value = '0.99';
                return;
            }
        });

        document.getElementById('entropy-coef').addEventListener('change', (e) => {
            const entropy = parseFloat(e.target.value);
            if (entropy < 0 || entropy > 0.1) {
                Toast.error('Entropy coefficient must be between 0 and 0.1');
                e.target.value = '0.02';
                return;
            }
        });

        document.getElementById('gae-lambda').addEventListener('input', (e) => {
            this.gaeLambda = parseFloat(e.target.value);
            document.getElementById('gae-lambda-value').textContent = this.gaeLambda.toFixed(2);
        });

        // Heatmap controls
        this.heatmapUpdateInterval = 25;
        document.getElementById('heatmap-x-dim').addEventListener('change', (e) => {
            const xDim = parseInt(e.target.value);
            const yDim = parseInt(document.getElementById('heatmap-y-dim').value);
            if (xDim === yDim) {
                Toast.error('X and Y dimensions cannot be the same');
                e.target.value = '0';
                return;
            }
            this.heatmap.setDimensions(xDim, yDim);
            if (this.heatmap.heatmapData) this.heatmap.draw();
        });

        document.getElementById('heatmap-y-dim').addEventListener('change', (e) => {
            const yDim = parseInt(e.target.value);
            const xDim = parseInt(document.getElementById('heatmap-x-dim').value);
            if (xDim === yDim) {
                Toast.error('X and Y dimensions cannot be the same');
                e.target.value = '2';
                return;
            }
            this.heatmap.setDimensions(xDim, yDim);
            if (this.heatmap.heatmapData) this.heatmap.draw();
        });

        document.getElementById('heatmap-resolution').addEventListener('change', (e) => {
            const size = parseInt(e.target.value);
            this.heatmap.setGridSize(size);
            if (this.heatmap.heatmapData) {
                this.heatmap.computeHeatmap(this.network, this.env);
            }
        });

        document.getElementById('heatmap-refresh-btn').addEventListener('click', () => {
            this.heatmap.computeHeatmap(this.network, this.env);
            Toast.success('Heatmap refreshed');
        });

        document.getElementById('heatmap-update-interval').addEventListener('input', (e) => {
            this.heatmapUpdateInterval = parseInt(e.target.value);
            document.getElementById('update-interval-value').textContent = this.heatmapUpdateInterval;
        });

        const speedSlider = document.getElementById('training-speed');
        speedSlider.addEventListener('input', (e) => {
            this.trainingSpeed = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = `${this.trainingSpeed}x`;
        });
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (!this.isManual) return;

            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.manualAction = 0;
                e.preventDefault();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.manualAction = 1;
                e.preventDefault();
            }
        });

        // Touch controls for mobile
        const touchLeftBtn = document.getElementById('touch-left');
        const touchRightBtn = document.getElementById('touch-right');

        if (touchLeftBtn) {
            touchLeftBtn.addEventListener('touchstart', () => {
                if (this.isManual) this.manualAction = 0;
            });
            touchLeftBtn.addEventListener('touchend', () => {
                if (this.isManual) this.manualAction = null;
            });
            touchLeftBtn.addEventListener('mousedown', () => {
                if (this.isManual) this.manualAction = 0;
            });
            touchLeftBtn.addEventListener('mouseup', () => {
                if (this.isManual) this.manualAction = null;
            });
        }

        if (touchRightBtn) {
            touchRightBtn.addEventListener('touchstart', () => {
                if (this.isManual) this.manualAction = 1;
            });
            touchRightBtn.addEventListener('touchend', () => {
                if (this.isManual) this.manualAction = null;
            });
            touchRightBtn.addEventListener('mousedown', () => {
                if (this.isManual) this.manualAction = 1;
            });
            touchRightBtn.addEventListener('mouseup', () => {
                if (this.isManual) this.manualAction = null;
            });
        }
    }

    setMode(mode) {
        const indicator = document.getElementById('mode-indicator');
        const modes = {
            'IDLE': '',
            'TRAINING': 'mode-training',
            'TESTING': 'mode-testing',
            'MANUAL': 'mode-manual'
        };

        indicator.textContent = mode;
        indicator.className = 'mode-indicator ' + (modes[mode] || '');
    }

    toggleManual() {
        if (this.isTraining || this.isTesting) return;

        this.isManual = !this.isManual;
        const btn = document.getElementById('manual-btn');
        const hint = document.getElementById('keyboard-hint');
        const touchControls = document.getElementById('touch-controls');

        if (this.isManual) {
            btn.textContent = 'Stop Manual';
            btn.className = 'secondary';
            hint.style.display = 'block';
            if (touchControls) {
                touchControls.style.display = 'flex';
            }
            this.setMode('MANUAL');
            this.env.reset();
            log('Manual control enabled - use arrow keys, A/D, or touch buttons');
            this.manualLoop();
        } else {
            btn.textContent = 'Manual Control';
            btn.className = 'secondary';
            hint.style.display = 'none';
            if (touchControls) {
                touchControls.style.display = 'none';
            }
            this.setMode('IDLE');
            log('Manual control disabled');
        }
    }

    async manualLoop() {
        while (this.isManual) {
            if (this.manualAction !== null) {
                const result = this.env.step(this.manualAction);

                // Show what action the network would take
                const state = this.env.getState();
                this.network.forward(this.normalizeState(state));

                if (result.done) {
                    log(`Episode ended: survived ${this.env.steps} steps`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    this.env.reset();
                }

                this.manualAction = null;
            }

            this.updateMetrics();
            this.updateActionBars();
            this.updateStateDisplay();
            this.visualizer.visualize(this.network);

            await new Promise(resolve => setTimeout(resolve, 20));
        }
    }

    toggleTraining() {
        if (this.isManual) {
            this.toggleManual();
        }

        this.isTraining = !this.isTraining;
        const btn = document.getElementById('train-btn');
        const pauseBtn = document.getElementById('pause-btn');
        if (this.isTraining) {
            btn.textContent = 'Stop Training';
            btn.className = 'danger';
            pauseBtn.style.display = 'block';
            pauseBtn.textContent = 'Pause';
            this.isPaused = false;
            this.setMode('TRAINING');
            log('Training started');
            this.trainingLoop();
        } else {
            btn.textContent = 'Start Training';
            btn.className = 'primary';
            pauseBtn.style.display = 'none';
            this.isPaused = false;
            this.setMode('IDLE');
            log('Training stopped');
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        if (this.isPaused) {
            pauseBtn.textContent = 'Resume';
            log('Training paused - inspect metrics without losing progress');
        } else {
            pauseBtn.textContent = 'Pause';
            log('Training resumed');
        }
    }

    async trainingLoop() {
        while (this.isTraining) {
            // Pause/resume support
            if (this.isPaused) {
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }

            await this.runEpisode(true);

            // Adjust delay based on training speed
            const delay = Math.max(1, 50 - this.trainingSpeed * 5);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    async runEpisode(train = false) {
        const state = this.env.reset();
        this.currentTrajectory = [];
        let totalReward = 0;
        let done = false;

        // Adjust step delay based on training speed
        const stepDelay = train ? Math.max(0, 3 - this.trainingSpeed * 0.3) : 20;

        while (!done && (this.isTraining || this.isTesting)) {
            // Normalize state for network
            const normState = this.normalizeState(state);

            // Use reduced epsilon-greedy with entropy bonus (combined exploration)
            const action = train ?
                this.network.selectAction(normState, this.exploration) :
                this.network.selectAction(normState, 0);

            const result = this.env.step(action);

            // Normalized inputs are roughly [-1, 1]
            const xPos = normState[0];
            const thetaPos = normState[2];
            
            // Shaping: Survival (0.1) + Upright Bonus (0.5) + Center Bonus (0.4) - Failure Penalty
            // Using squared penalty for smooth gradients towards 0
            let shapedReward = 0.1; 
            
            if (result.done) {
                 shapedReward = -1.0;
            } else {
                shapedReward += 0.5 * (1.0 - thetaPos * thetaPos);
                shapedReward += 0.4 * (1.0 - xPos * xPos);
            }

            totalReward += shapedReward;
            
            // Store probability of taken action for PPO
            const policy = this.network.lastOutput || [0.5, 0.5];
            const actionProb = policy[action];

            this.currentTrajectory.push({
                state: [...normState], // Store normalized state
                action: action,
                reward: shapedReward,
                prob: actionProb
            });

            Object.assign(state, result.state);
            done = result.done;

            this.updateMetrics();
            this.updateActionBars();
            this.updateStateDisplay();

            // Throttle SVG updates for better performance
            if (this.frameCounter++ % CONSTANTS.SVG_UPDATE_FREQUENCY === 0) {
                this.visualizer.visualize(this.network);
            }

            await new Promise(resolve => setTimeout(resolve, stepDelay));
        }

        if (train && this.currentTrajectory.length > 0) {
            this.batchBuffer.push(this.currentTrajectory);

            if (this.batchBuffer.length >= CONSTANTS.BATCH_SIZE) {
                const gamma = parseFloat(document.getElementById('discount').value);
                const entropyCoef = parseFloat(document.getElementById('entropy-coef').value);

                // Apply learning rate decay: LR *= 0.9995^episode
                const decayedLR = this.initialLearningRate * Math.pow(0.9995, this.episode);
                this.network.setLearningRate(decayedLR);

                const updateMetrics = this.network.update(this.batchBuffer, gamma, entropyCoef, 0.1, 2.0, this.gaeLambda);

                // Store training diagnostics
                this.lastGradNorm = updateMetrics.gradNorm;
                this.lastAvgAdvantage = updateMetrics.avgAdvantage;
                this.lastAvgReturn = updateMetrics.avgReturn;
                this.lastActorLoss = updateMetrics.actorLoss;
                this.lastCriticLoss = updateMetrics.criticLoss;

                // Update loss chart
                this.lossChart.addDataPoint(updateMetrics.actorLoss, updateMetrics.criticLoss);

                // Update metrics dashboard
                this.metricsDashboard.update({
                    gradNorm: updateMetrics.gradNorm,
                    avgAdvantage: updateMetrics.avgAdvantage,
                    avgReturn: updateMetrics.avgReturn
                });
                this.metricsDashboard.render();

                this.batchBuffer = [];
            }

            // Update heatmap at configurable interval
            if (this.episode % this.heatmapUpdateInterval === 0) {
                try {
                    this.heatmap.computeHeatmap(this.network, this.env);
                } catch (e) {
                    console.error('Heatmap update failed:', e);
                }
            }

            // Slower exploration decay
            this.exploration = Math.max(this.minExploration, this.exploration * this.explorationDecay);
        }

        this.episode++;
        this.survivalHistory.push(this.env.steps);
        this.explorationHistory.push(this.exploration);
        if (this.survivalHistory.length > CONSTANTS.SURVIVAL_HISTORY_MAX) {
            this.survivalHistory.shift();
            this.explorationHistory.shift();
        }

        this.chart.addDataPoint(this.episode, this.env.steps);

        if (this.episode % CONSTANTS.LOG_INTERVAL_EPISODES === 0) {
            const avgLast10 = this.survivalHistory.slice(-CONSTANTS.SURVIVAL_HISTORY_WINDOW).reduce((a, b) => a + b, 0) / Math.min(CONSTANTS.SURVIVAL_HISTORY_WINDOW, this.survivalHistory.length);
            const gradInfo = this.lastGradNorm ? ` |∇|=${this.lastGradNorm.toFixed(2)}` : '';
            log(`Ep ${this.episode}: Avg=${avgLast10.toFixed(1)} steps, ε=${this.exploration.toFixed(3)}${gradInfo}`);
        }

        this.updateNetworkStats();
    }

    async testPolicy() {
        if (this.isTraining) {
            this.toggleTraining();
        }
        if (this.isManual) {
            this.toggleManual();
        }

        this.isTesting = true;
        this.setMode('TESTING');
        const btn = document.getElementById('test-btn');
        btn.disabled = true;

        log('Testing current policy...');
        await this.runEpisode(false);

        log(`Test complete: survived ${this.env.steps} steps`);
        this.isTesting = false;
        this.setMode('IDLE');
        btn.disabled = false;
        this.updateStateDisplay();
    }

    resetPolicy() {
        this.isTraining = false;
        this.isTesting = false;
        if (this.isManual) {
            this.toggleManual();
        }

        document.getElementById('train-btn').textContent = 'Start Training';
        document.getElementById('train-btn').className = 'primary';
        this.setMode('IDLE');

        this.episode = 0;
        this.survivalHistory = [];
        this.explorationHistory = [];
        this.batchBuffer = [];
        this.exploration = CONSTANTS.INITIAL_EXPLORATION; // Reset exploration
        this.chart.clear();
        this.lossChart.clear();
        this.heatmap.clear();
        this.initNetwork();
        this.env.reset();
        this.updateMetrics();
        this.updateStateDisplay();
        this.updateNetworkStats();

        log('Policy reset - exploration reset to 0.2 with GAE enabled');
    }

    updateActionBars() {
        if (this.network.lastOutput) {
            const probs = this.network.lastOutput;

            // Update left action bar using CSS transform for better performance
            const leftPct = (probs[0] * 100).toFixed(1);
            document.getElementById('action-left').style.transform = `scaleY(${probs[0]})`;
            document.getElementById('action-left-val').textContent = leftPct + '%';

            // Update right action bar using CSS transform for better performance
            const rightPct = (probs[1] * 100).toFixed(1);
            document.getElementById('action-right').style.transform = `scaleY(${probs[1]})`;
            document.getElementById('action-right-val').textContent = rightPct + '%';
        }
    }


    updateStateDisplay() {
        const state = this.env.getState();
        const [x, xDot, theta, thetaDot] = state;

        // Define reasonable max values for normalization
        const maxX = CONSTANTS.MAX_X;
        const maxXDot = CONSTANTS.MAX_X_DOT;
        const maxTheta = CONSTANTS.MAX_THETA;
        const maxThetaDot = CONSTANTS.MAX_THETA_DOT;

        // Update cart position perception
        const xNorm = Math.min(1, Math.abs(x) / maxX);
        document.getElementById('perception-x-val').textContent = x.toFixed(2);
        document.getElementById('perception-x-bar').style.width = (xNorm * 100) + '%';
        document.getElementById('perception-x').classList.toggle('active', xNorm > 0.6);

        // Update cart velocity perception
        const xDotNorm = Math.min(1, Math.abs(xDot) / maxXDot);
        document.getElementById('perception-xdot-val').textContent = xDot.toFixed(2);
        document.getElementById('perception-xdot-bar').style.width = (xDotNorm * 100) + '%';
        document.getElementById('perception-xdot').classList.toggle('active', xDotNorm > 0.4);

        // Update pole angle perception (CRITICAL)
        const thetaDeg = theta * 180 / Math.PI;
        const thetaNorm = Math.min(1, Math.abs(theta) / maxTheta);
        document.getElementById('perception-theta-val').textContent = thetaDeg.toFixed(1) + '°';
        document.getElementById('perception-theta-bar').style.width = (thetaNorm * 100) + '%';
        document.getElementById('perception-theta').classList.add('active'); // Always active

        // Update angular velocity perception (CRITICAL)
        const thetaDotNorm = Math.min(1, Math.abs(thetaDot) / maxThetaDot);
        document.getElementById('perception-thetadot-val').textContent = thetaDot.toFixed(2);
        document.getElementById('perception-thetadot-bar').style.width = (thetaDotNorm * 100) + '%';
        document.getElementById('perception-thetadot').classList.add('active'); // Always active

        // Update detailed state bars
        const thetaBarPct = 50 + (theta / maxTheta) * 50;
        document.getElementById('theta-bar').style.width = Math.max(0, Math.min(100, thetaBarPct)) + '%';
        document.getElementById('theta-value').textContent = thetaDeg.toFixed(1) + '°';

        const thetaDotBarPct = 50 + (thetaDot / maxThetaDot) * 50;
        document.getElementById('thetadot-bar').style.width = Math.max(0, Math.min(100, thetaDotBarPct)) + '%';
        document.getElementById('thetadot-value').textContent = thetaDot.toFixed(2);

        // Update "What the Network Sees (State Observations)" section
        // Cart position
        document.getElementById('value-x').textContent = x.toFixed(2);
        const xBarPct = 50 + (x / maxX) * 50;
        document.getElementById('indicator-x').style.width = Math.max(0, Math.min(100, xBarPct)) + '%';
        document.getElementById('indicator-x').className = 'state-indicator' + (xNorm > 0.6 ? ' danger' : '');

        // Cart velocity
        document.getElementById('value-xdot').textContent = xDot.toFixed(2);
        const xDotBarPct = 50 + (xDot / maxXDot) * 50;
        document.getElementById('indicator-xdot').style.width = Math.max(0, Math.min(100, xDotBarPct)) + '%';
        document.getElementById('indicator-xdot').className = 'state-indicator' + (xDotNorm > 0.4 ? ' warning' : '');

        // Pole angle
        document.getElementById('value-theta').textContent = thetaDeg.toFixed(1);
        const thetaIndicatorPct = 50 + (theta / maxTheta) * 50;
        document.getElementById('indicator-theta').style.width = Math.max(0, Math.min(100, thetaIndicatorPct)) + '%';
        document.getElementById('indicator-theta').className = 'state-indicator' + (thetaNorm > CONSTANTS.POLE_CRITICAL_THRESHOLD ? ' danger' : thetaNorm > CONSTANTS.POLE_WARNING_THRESHOLD ? ' warning' : '');

        // Angular velocity
        document.getElementById('value-thetadot').textContent = thetaDot.toFixed(2);
        const thetaDotIndicatorPct = 50 + (thetaDot / maxThetaDot) * 50;
        document.getElementById('indicator-thetadot').style.width = Math.max(0, Math.min(100, thetaDotIndicatorPct)) + '%';
        document.getElementById('indicator-thetadot').className = 'state-indicator' + (thetaDotNorm > 0.5 ? ' warning' : '');

        // Calculate and display input importance
        const importance = this.network.getInputImportance(this.normalizeState(state));
        const maxImportance = Math.max(...importance, 0.001);

        const importanceX = (importance[0] / maxImportance * 100);
        const importanceXDot = (importance[1] / maxImportance * 100);
        const importanceTheta = (importance[2] / maxImportance * 100);
        const importanceThetaDot = (importance[3] / maxImportance * 100);

        document.getElementById('importance-x-bar').style.width = importanceX + '%';
        document.getElementById('importance-x-val').textContent = importanceX.toFixed(0) + '%';

        document.getElementById('importance-xdot-bar').style.width = importanceXDot + '%';
        document.getElementById('importance-xdot-val').textContent = importanceXDot.toFixed(0) + '%';

        document.getElementById('importance-theta-bar').style.width = importanceTheta + '%';
        document.getElementById('importance-theta-val').textContent = importanceTheta.toFixed(0) + '%';

        document.getElementById('importance-thetadot-bar').style.width = importanceThetaDot + '%';
        document.getElementById('importance-thetadot-val').textContent = importanceThetaDot.toFixed(0) + '%';
    }

    updateNetworkStats() {
        // Average weights across all hidden layers
        let totalWeight = 0;
        let totalCount = 0;
        for (const layer of this.network.layers) {
            for (let i = 0; i < layer.w.length; i++) {
                for (let j = 0; j < layer.w[i].length; j++) {
                    totalWeight += Math.abs(layer.w[i][j]);
                    totalCount++;
                }
            }
        }
        const avgLayers = totalCount > 0 ? totalWeight / totalCount : 0;

        // Average actor head weights
        const avgActor = this.network.getAvgWeight(this.network.actorHead.w);

        // Entropy
        const entropy = this.network.getEntropy();

        document.getElementById('avg-w1').textContent = avgLayers.toFixed(3);
        document.getElementById('avg-w2').textContent = avgActor.toFixed(3);
        document.getElementById('entropy').textContent = entropy.toFixed(3);
        document.getElementById('exploration-rate').textContent = this.exploration.toFixed(3);

        // Training diagnostics
        document.getElementById('grad-norm').textContent = this.lastGradNorm ? this.lastGradNorm.toFixed(2) : '0.00';
        document.getElementById('avg-advantage').textContent = this.lastAvgAdvantage ? this.lastAvgAdvantage.toFixed(2) : '0.00';
    }

    updateMetrics() {
        document.getElementById('episode-count').textContent = this.episode;
        document.getElementById('steps-count').textContent = this.env.steps;
        document.getElementById('reward-count').textContent = this.env.steps;

        // Update value estimate
        if (this.network.lastValue !== undefined) {
            document.getElementById('value-estimate').textContent = this.network.lastValue.toFixed(1);
        }

        if (this.survivalHistory.length > 0) {
            const last = this.survivalHistory[this.survivalHistory.length - 1];
            const best = Math.max(...this.survivalHistory);
            const avgLast10 = this.survivalHistory.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, this.survivalHistory.length);

            document.getElementById('last-survival').textContent = last;
            document.getElementById('best-survival').textContent = best;
            document.getElementById('avg-survival').textContent = avgLast10.toFixed(1);
        } else {
            document.getElementById('last-survival').textContent = '0';
            document.getElementById('best-survival').textContent = '0';
            document.getElementById('avg-survival').textContent = '0';
        }
    }

    // Save network weights and configuration
    saveNetwork() {
        const data = {
            timestamp: new Date().toISOString(),
            episode: this.episode,
            survivalHistory: this.survivalHistory,
            network: {
                layers: this.network.layers.map(l => ({
                    w: l.w,
                    b: l.b
                })),
                actorHead: {
                    w: this.network.actorHead.w,
                    b: this.network.actorHead.b
                },
                criticHead: {
                    w: this.network.criticHead.w,
                    b: this.network.criticHead.b
                },
                hiddenSizes: this.network.hiddenSizes,
                activation: this.network.activation
            },
            hyperparameters: {
                learningRate: parseFloat(document.getElementById('learning-rate').value),
                discount: parseFloat(document.getElementById('discount').value),
                entropy: parseFloat(document.getElementById('entropy-coef').value),
                hiddenSize: parseInt(document.getElementById('hidden-size').value),
                networkDepth: parseInt(document.getElementById('network-depth').value),
                gaeLambda: this.gaeLambda
            }
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cartpole-network-${data.timestamp.substring(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);

        Toast.success(`Network saved! Trained for ${this.episode} episodes`);
        log(`Saved network with ${this.episode} episodes of training`);
    }

    // Load network weights and configuration
    loadNetwork() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);

                    // Restore hyperparameters
                    if (data.hyperparameters) {
                        document.getElementById('learning-rate').value = data.hyperparameters.learningRate;
                        document.getElementById('discount').value = data.hyperparameters.discount;
                        document.getElementById('entropy-coef').value = data.hyperparameters.entropy;
                        document.getElementById('hidden-size').value = data.hyperparameters.hiddenSize;
                        document.getElementById('network-depth').value = data.hyperparameters.networkDepth;
                        if (data.hyperparameters.gaeLambda !== undefined) {
                            this.gaeLambda = data.hyperparameters.gaeLambda;
                            document.getElementById('gae-lambda').value = data.hyperparameters.gaeLambda;
                            document.getElementById('gae-lambda-value').textContent = data.hyperparameters.gaeLambda.toFixed(2);
                        }
                    }

                    // Reinitialize network with saved config
                    this.initNetwork();

                    // Restore activation function from saved data
                    if (data.network && data.network.activation) {
                        this.network.activation = data.network.activation;
                        document.getElementById('activation').value = data.network.activation;
                    }

                    // Restore weights
                    if (data.network && data.network.layers) {
                        for (let i = 0; i < data.network.layers.length; i++) {
                            this.network.layers[i].w = data.network.layers[i].w;
                            this.network.layers[i].b = data.network.layers[i].b;
                        }
                        this.network.actorHead.w = data.network.actorHead.w;
                        this.network.actorHead.b = data.network.actorHead.b;
                        this.network.criticHead.w = data.network.criticHead.w;
                        this.network.criticHead.b = data.network.criticHead.b;
                    }

                    this.visualizer.visualize(this.network);
                    Toast.success(`Network loaded! ${data.episode} episodes of training restored`);
                    log(`Loaded network trained for ${data.episode} episodes`);
                } catch (err) {
                    Toast.error('Failed to load network: ' + err.message);
                    log('Error loading network: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // Export training data as CSV
    exportTrainingData() {
        let csv = 'Episode,Survival_Steps,Actor_Loss,Critic_Loss,Exploration_Rate\n';

        for (let i = 0; i < this.survivalHistory.length; i++) {
            csv += `${i + 1},${this.survivalHistory[i]},${this.lossChart.actorLosses[i] || 0},${this.lossChart.criticLosses[i] || 0},${this.explorationHistory[i] || 0}\n`;
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cartpole-training-${new Date().toISOString().substring(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        Toast.success(`Training data exported (${this.episode} episodes)`);
        log(`Exported training data: ${this.episode} episodes`);
    }

    // Apply training preset
    applyPreset(preset) {
        const presets = {
            quick: {
                lr: 0.005,
                discount: 0.99,
                entropy: 0.02,
                hidden: 32,
                depth: 1,
                speed: 8,
                gaeLambda: 0.95
            },
            deep: {
                lr: 0.003,
                discount: 0.99,
                entropy: 0.015,
                hidden: 64,
                depth: 2,
                speed: 1,
                gaeLambda: 0.95
            },
            exploration: {
                lr: 0.002,
                discount: 0.95,
                entropy: 0.05,
                hidden: 32,
                depth: 1,
                speed: 3,
                gaeLambda: 0.95
            },
            production: {
                lr: 0.001,
                discount: 0.99,
                entropy: 0.01,
                hidden: 128,
                depth: 2,
                speed: 1,
                gaeLambda: 0.95
            }
        };

        const config = presets[preset];
        if (!config) {
            Toast.error('Unknown preset: ' + preset);
            return;
        }

        // Apply settings
        document.getElementById('learning-rate').value = config.lr;
        document.getElementById('discount').value = config.discount;
        document.getElementById('entropy-coef').value = config.entropy;
        document.getElementById('hidden-size').value = config.hidden;
        document.getElementById('network-depth').value = config.depth;
        this.trainingSpeed = config.speed;
        document.getElementById('training-speed').value = config.speed;
        this.gaeLambda = config.gaeLambda;
        document.getElementById('gae-lambda').value = config.gaeLambda;
        document.getElementById('gae-lambda-value').textContent = config.gaeLambda.toFixed(2);

        // Reinitialize with new config
        this.initNetwork();
        this.heatmap.clear();
        this.lossChart.clear();

        const names = { quick: '⚡ Quick Train', deep: '🧠 Deep Learn', exploration: '🔍 Exploration', production: '🏭 Production' };
        Toast.success(`Preset loaded: ${names[preset]}`);
        log(`Applied ${preset} preset`);
    }

    // Setup keyboard shortcuts
    setupGlobalKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't intercept if typing in input
            if (document.activeElement.tagName === 'INPUT') return;

            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.toggleTraining();
                    break;
                case 't':
                case 'T':
                    if (!this.isTraining && !this.isManual) {
                        this.testPolicy();
                    }
                    break;
                case 'r':
                case 'R':
                    this.resetPolicy();
                    break;
                case 's':
                case 'S':
                    if (!this.isTraining && !this.isTesting && !this.isManual) {
                        this.saveNetwork();
                    }
                    break;
                case 'l':
                case 'L':
                    if (!this.isTraining && !this.isTesting && !this.isManual) {
                        this.loadNetwork();
                    }
                    break;
                case 'm':
                case 'M':
                    if (!this.isTraining && !this.isTesting) {
                        this.toggleManual();
                    }
                    break;
                case 'p':
                case 'P':
                    if (this.isTraining) {
                        this.togglePause();
                    }
                    break;
            }
        }, { passive: false });
    }

    animate() {
        this.renderer.render(this.env);
        this.updateStateDisplay();
        requestAnimationFrame(() => this.animate());
    }
}
