# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebNeuralNet is a single-file CartPole reinforcement learning visualization. The project generates an interactive HTML/JavaScript application for training a neural network agent to balance a pole using advanced Actor-Critic methods with Generalized Advantage Estimation (GAE) and Adam optimizer.

## Architecture

The project consists of a Python script that embeds a complete HTML5 application as a string literal:

- **File Structure**: Single entry point in `generate.py`
- **Output**: Generates `cartpole.html` file
- **Technology Stack**:
  - **Frontend**: Pure HTML5 Canvas + SVG, vanilla JavaScript (no frameworks)
  - **RL Algorithm**: Actor-Critic with GAE (Generalized Advantage Estimation, λ=0.95)
  - **Optimizer**: Adam optimizer with adaptive learning rates and momentum
  - **Network Architecture**: Multi-layer configurable (4 → [hidden layers] → 2 Actor + 1 Critic)
  - **Activation Functions**: ReLU, Tanh, ELU, Swish (user-selectable)
  - **Environment**: CartPole physics simulation in JavaScript

## Key Components

### Python Layer
- Stores the HTML string in `html_v3` variable
- Exports the HTML file using `pathlib.Path`

### JavaScript Sections (within HTML)

1. **Adam Optimizer Class**: Adaptive moment estimation optimizer
   - Momentum and adaptive learning rates (β1=0.9, β2=0.999)
   - Bias correction for first and second moment estimates
   - Supports both 1D vectors and 2D matrices

2. **ActorCriticNetwork Class**: Dual-head neural network
   - **Actor Head**: Policy network (softmax output for action probabilities)
   - **Critic Head**: Value function network (predicts state value)
   - Multi-layer architecture with configurable hidden layers
   - Multiple activation functions (ReLU, Tanh, ELU, Swish)
   - GAE advantage estimation with λ parameter
   - Gradient clipping by global norm (prevents divergence)

3. **CartPole Class**: Environment physics
   - State: [x, x_dot, theta, theta_dot]
   - Action: 0 (left) or 1 (right) force
   - Reward: 1 per step until failure or max steps reached
   - Customizable physics parameters (gravity, pole length, friction, force magnitude)

4. **Renderer Class**: Canvas-based visualization
   - Real-time CartPole rendering with physics visualization
   - Color-coded pole angle (green→orange→red based on criticality)
   - Velocity vectors and warning indicators

5. **NetworkVisualizer Class**: Real-time network visualization
   - SVG network graph with dynamic layer support
   - Weight visualization (green=positive, red=negative)
   - Separate coloring for Actor (green), Critic (blue), and hidden layers
   - Node activation opacity based on values

6. **TrainingChart Class**: Episode performance tracking
   - Moving average calculation (10-episode window)
   - Grid-based rendering with Y-axis labels
   - Handles arbitrary number of episodes

7. **RLSandbox Class**: Main application logic
   - Training loop with configurable exploration (ε-greedy)
   - Testing and manual control modes
   - Real-time metric tracking and visualization
   - Learning rate and hyperparameter adjustment during training

### Configuration

Tunable hyperparameters (accessible via UI controls):
- **Learning Rate**: 0.0001 - 0.01, default 0.003 (applies to all Adam optimizers)
- **Discount Factor (γ)**: 0.90 - 1.0, default 0.99
- **Entropy Coefficient**: 0.0 - 0.1, default 0.02 (encourages exploration)
- **Hidden Layer Size**: 16 - 256, default 32
- **Network Depth**: 1-3 hidden layers (configurable architecture)
- **Activation Function**: ReLU (default), Tanh, ELU, or Swish
- **Training Speed**: 1x - 10x (multiplier for episodes per second)
- **GAE Lambda**: Fixed at λ=0.95 (controls variance-bias tradeoff)

## Common Development Tasks

### Modify the Generated HTML

Edit the `html_v3` string in the Python file:
- Update CSS variables at the top (`:root` selector) for theme colors
- Modify JavaScript configuration in the `CFG` object
- Add new controls by extending the HTML form and adding corresponding JavaScript handlers

### Adjust Hyperparameters

Edit the `CFG` object in the JavaScript section:
- `lr`: Learning rate
- `gamma`: Discount factor
- `hidden`: Hidden layer size
- `stepsPerFrame`: Steps per animation frame
- `clip`: Gradient clipping threshold
- `entropy`: Entropy regularization coefficient
- `maxSteps`: Maximum episode length

### Run/Generate the Application

```bash
python3 generate.py
```

This creates `cartpole.html` in the current directory. Then open `cartpole.html` in a web browser.

### Algorithm Details

The training uses an Actor-Critic approach with Generalized Advantage Estimation:

**Forward Pass:**
- State input: [x, x_dot, theta, theta_dot]
- Actor head: Outputs softmax probabilities for 2 actions
- Critic head: Outputs scalar value estimate V(s)

**Advantage Estimation (GAE):**
- TD residuals: δ_t = r_t + γV(s_{t+1}) - V(s_t)
- GAE advantages: A_t = δ_t + (γλ)δ_{t+1} + (γλ)²δ_{t+2} + ...
- λ = 0.95 controls bias-variance tradeoff
- Advantages are normalized (zero-mean, unit-variance)

**Loss Functions:**
- Actor loss: -log(π(a|s)) × A(s,a) - H(π(s)) × entropy_coef
- Critic loss: MSE(V(s), R_t) where R_t = A_t + V(s)
- H(π) = -Σ π(a) log(π(a)) encourages exploration

**Optimization:**
- Adam optimizer with β1=0.9, β2=0.999, ε=1e-8
- Per-parameter adaptive learning rates
- Gradient clipping by global norm (prevents divergence)
- Supports dynamic learning rate adjustment during training

## Mobile Optimization Notes

The UI is optimized for mobile with:
- Flexible layout using CSS flexbox
- Safe area insets for notched devices
- Touch-friendly controls with proper spacing
- Responsive canvas scaling using device pixel ratio
- Viewport constraints to prevent zoom issues

## Performance Considerations

- **Gradient Accumulation**: Gradients accumulated across trajectory before update (no GC pressure)
- **Pre-allocated Buffers**: All matrices/vectors created once in constructor
- **Adam State**: First and second moment estimates maintained separately for stability
- **Batch Processing**: Episode trajectory processed in single update call
- **Learning Rate Decay**: Exploration epsilon decays from 0.2 → 0.05 across training
- **Responsive UI**: Network visualization and metrics update at 60 FPS
- **Configurable Speed**: Training speed (1-10x) adjusts episode execution speed

## Features

- **Multi-layer Networks**: 1-3 configurable hidden layers with sizes from 16-256 neurons
- **Multiple Activations**: Choose between ReLU, Tanh, ELU, or Swish per network
- **Manual Control Mode**: Test the CartPole manually with arrow keys or A/D
- **Real-time Metrics**:
  - Gradient norm and advantage tracking
  - Policy entropy monitoring
  - Value function estimates
  - Input importance visualization
- **Training Diagnostics**: Visible gradient norms, advantage statistics, and exploration rate
