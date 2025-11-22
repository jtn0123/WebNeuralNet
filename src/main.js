// Import all modules
import { CONSTANTS } from './utils/constants.js';
import { log, createZeroFloat32Array } from './utils/helpers.js';
import { Toast } from './utils/toast.js';
import { CartPole } from './ml/cartpole.js';
import { AdamOptimizer } from './ml/adam_optimizer.js';
import { ActorCriticNetwork } from './ml/actor_critic_network.js';
import { Renderer } from './viz/renderer.js';
import { NetworkVisualizer } from './viz/network_visualizer.js';
import { TrainingChart } from './viz/training_chart.js';
import { TrainingLossChart } from './viz/training_loss_chart.js';
import { StateSpaceHeatmap } from './viz/state_space_heatmap.js';
import { MetricsDashboard } from './ui/metrics_dashboard.js';
import { ReplayBuffer } from './ui/replay_buffer.js';
import { RLSandbox } from './app/rl_sandbox.js';

// Initialize the application
const sandbox = new RLSandbox();
window.sandbox = sandbox; // Make available globally for debugging

// Log initialization
log('CartPole RL Sandbox initialized successfully');
