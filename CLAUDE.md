# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebNeuralNet is a single-file CartPole V3 reinforcement learning visualization. The project generates an interactive HTML/JavaScript application for training a neural network agent to balance a pole using policy gradient methods (actor-critic style training).

## Architecture

The project consists of a Python script that embeds a complete HTML5 application as a string literal:

- **File Structure**: Single entry point in `from pathlib import Path.html`
- **Output**: Generates `cartpole-v3-mobile-optimized.html` file
- **Technology Stack**:
  - **Frontend**: Pure HTML5 Canvas + SVG, vanilla JavaScript (no frameworks)
  - **RL Algorithm**: Policy gradient with baseline (advantage actor-critic variant)
  - **Network Architecture**: 2-layer feed-forward neural network (4 → hidden → 2)
  - **Environment**: CartPole physics simulation in JavaScript

## Key Components

### Python Layer
- Stores the HTML string in `html_v3` variable
- Exports the HTML file using `pathlib.Path`

### JavaScript Sections (within HTML)

1. **Math Module (`M`)**: Low-level matrix operations optimized for speed
   - Matrix creation and initialization
   - Vector-matrix multiplication
   - Activation functions (ReLU, softmax)
   - Gradient clipping

2. **Agent Class**: Neural network policy
   - Forward pass: state → probabilities (softmax output)
   - Training: policy gradient with entropy regularization
   - Parameters: W1, b1 (hidden layer), W2, b2 (output layer)

3. **CartPole Class**: Environment physics
   - State: [x, x_dot, theta, theta_dot]
   - Action: 0 (left) or 1 (right) force
   - Reward: 1 per step until failure or max steps reached

4. **Visualization (`Vis`)**: Real-time network visualization
   - SVG network graph with weight colors (cyan=positive, magenta=negative)
   - Node activation visualization
   - Layer-wise activations (input, hidden, output)

5. **App Logic**: Training loop and UI interaction
   - `loop()`: Main animation frame handler
   - Episode management and metrics tracking
   - Canvas-based CartPole environment rendering

### Configuration

Tunable hyperparameters (accessible via UI sliders):
- Learning Rate (0.001 - 0.05, default 0.01)
- Gamma/Discount Factor (0.90 - 0.999, default 0.99)
- Entropy Bonus (0.0 - 0.02, default 0.005)
- Steps Per Frame (1-60, default 15)
- Max Episode Steps (200-5000, default 1000)
- Hidden Layer Size (8, 16, 24, 32, 48, 64)

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
python "from pathlib import Path.html"
```

This creates `cartpole-v3-mobile-optimized.html` in the current directory.

### Algorithm Details

The training uses a policy gradient approach with:
- State: Normalized CartPole observations
- Action sampling: Categorical distribution from softmax output
- Returns: Discounted sum of rewards (G) computed backward
- Baseline: Exponential moving average of returns for advantage estimation
- Entropy bonus: Augments return to encourage exploration
- Gradient clipping: Prevents large weight updates

## Mobile Optimization Notes

The UI is optimized for mobile with:
- Flexible layout using CSS flexbox
- Safe area insets for notched devices
- Touch-friendly controls with proper spacing
- Responsive canvas scaling using device pixel ratio
- Viewport constraints to prevent zoom issues

## Performance Considerations

- **No garbage collection during forward pass**: Pre-allocated buffers used throughout
- **Float32Array**: All numerical computations use typed arrays for speed
- **SVG caching**: Network visualization cached after initialization
- **Canvas optimization**: Only redraws on actual state changes
- **Steps per frame**: Configurable to balance accuracy and responsiveness
