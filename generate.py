from pathlib import Path

html_v3 = r"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CartPole Actor-Critic RL Sandbox</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        h1 {
            text-align: center;
            color: #667eea;
            margin-bottom: 24px;
            font-size: 32px;
        }

        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }

        .full-width {
            grid-column: 1 / -1;
        }

        .panel {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .panel h2 {
            font-size: 18px;
            margin-bottom: 12px;
            color: #667eea;
        }

        #cartpole-canvas {
            width: 100%;
            height: 300px;
            background: linear-gradient(to bottom, #e3f2fd 0%, #fff 100%);
            border-radius: 8px;
            border: 2px solid #667eea;
        }

        #network-svg {
            width: 100%;
            height: 300px;
            background: white;
            border-radius: 8px;
            border: 2px solid #667eea;
        }

        .controls {
            display: flex;
            gap: 10px;
            margin-top: 12px;
            flex-wrap: wrap;
        }

        button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        button.primary {
            background: #667eea;
            color: white;
        }

        button.success {
            background: #4caf50;
            color: white;
        }

        button.danger {
            background: #f44336;
            color: white;
        }

        button.secondary {
            background: #6c757d;
            color: white;
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
        }

        .metric {
            background: white;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .metric-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
        }

        .settings {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            margin-top: 12px;
        }

        .setting {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .setting label {
            font-size: 12px;
            color: #666;
            font-weight: 600;
        }

        .setting input {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }

        .log {
            background: #1e1e1e;
            color: #00ff00;
            padding: 12px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 150px;
            overflow-y: auto;
            margin-top: 12px;
        }

        .log-entry {
            margin-bottom: 4px;
        }

        #training-chart {
            width: 100%;
            height: 200px;
            background: white;
            border-radius: 8px;
            border: 2px solid #667eea;
        }

        .action-bars {
            display: flex;
            gap: 12px;
            margin-top: 12px;
            height: 80px;
        }

        .action-bar {
            flex: 1;
            background: #f0f0f0;
            border-radius: 8px;
            position: relative;
            overflow: hidden;
            border: 2px solid #ddd;
        }

        .action-bar-fill {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, #667eea, #764ba2);
            transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform-origin: bottom;
        }

        .action-bar-label {
            position: absolute;
            top: 8px;
            left: 0;
            right: 0;
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            color: #333;
            z-index: 1;
        }

        .action-bar-value {
            position: absolute;
            bottom: 8px;
            left: 0;
            right: 0;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            color: white;
            z-index: 1;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        .slider-control {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .slider-control input[type="range"] {
            flex: 1;
            height: 6px;
            border-radius: 3px;
            background: #ddd;
            outline: none;
            -webkit-appearance: none;
        }

        .slider-control input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #667eea;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider-control input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #667eea;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider-control label {
            min-width: 120px;
            font-size: 13px;
            font-weight: 600;
            color: #666;
        }

        .slider-control span {
            min-width: 50px;
            text-align: right;
            font-weight: bold;
            color: #667eea;
        }

        .training-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 12px;
        }

        .training-stat {
            background: white;
            padding: 8px;
            border-radius: 6px;
            text-align: center;
            font-size: 11px;
        }

        .training-stat-value {
            font-size: 16px;
            font-weight: bold;
            color: #667eea;
            margin-top: 4px;
        }

        .mode-indicator {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            margin-left: 8px;
        }

        .mode-training {
            background: #4caf50;
            color: white;
        }

        .mode-testing {
            background: #ff9800;
            color: white;
        }

        .mode-manual {
            background: #2196f3;
            color: white;
        }

        .keyboard-hint {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 8px 12px;
            border-radius: 6px;
            margin-top: 8px;
            font-size: 12px;
            text-align: center;
            color: #856404;
        }

        .feature-panel {
            background: white;
            padding: 12px;
            border-radius: 8px;
            margin-top: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .feature-panel h3 {
            margin: 0 0 10px 0;
            font-size: 13px;
            font-weight: bold;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .feature-buttons {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }

        .feature-btn {
            padding: 8px 12px;
            border: 1px solid #ddd;
            background: white;
            color: #333;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .feature-btn:hover {
            background: #f5f5f5;
            border-color: #667eea;
            color: #667eea;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .feature-btn:active {
            transform: translateY(0);
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .preset-btn {
            grid-column: span 1;
        }

        .shortcuts-legend {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            font-size: 12px;
        }

        .shortcut-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px;
            background: #f8f8f8;
            border-radius: 4px;
        }

        .shortcut-row kbd {
            background: #333;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 11px;
            font-weight: bold;
            min-width: 40px;
            text-align: center;
            display: inline-block;
            border: 1px solid #000;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .shortcut-row span {
            color: #666;
            flex: 1;
        }

        .state-bars {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 12px;
        }

        .state-bar-container {
            background: white;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .state-bar-label {
            font-size: 11px;
            font-weight: bold;
            color: #666;
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .state-bar-value {
            font-size: 14px;
            color: #667eea;
            font-weight: bold;
        }

        .state-bar-track {
            height: 24px;
            background: #f0f0f0;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
            border: 1px solid #ddd;
        }

        .state-bar-fill {
            position: absolute;
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: left 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
            border-radius: 12px;
        }

        .state-bar-center {
            position: absolute;
            left: 50%;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #333;
            z-index: 1;
        }

        .state-importance {
            display: inline-block;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 10px;
            background: #e0e0e0;
            color: #666;
        }

        .state-importance.high {
            background: #ff5722;
            color: white;
        }

        .state-importance.medium {
            background: #ff9800;
            color: white;
        }

        .state-importance.low {
            background: #4caf50;
            color: white;
        }

        .network-perception {
            background: white;
            padding: 12px;
            border-radius: 8px;
            margin-top: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .perception-title {
            font-size: 12px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 8px;
        }

        .perception-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
        }

        .perception-input {
            text-align: center;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 6px;
            border: 2px solid transparent;
            transition: all 0.2s;
        }

        .perception-input.active {
            border-color: #667eea;
            background: #e3f2fd;
        }

        .perception-input-label {
            font-size: 9px;
            color: #666;
            margin-bottom: 4px;
        }

        .perception-input-value {
            font-size: 13px;
            font-weight: bold;
            color: #333;
        }

        .perception-input-bar {
            height: 4px;
            background: #ddd;
            border-radius: 2px;
            margin-top: 4px;
            overflow: hidden;
        }

        .perception-input-bar-fill {
            height: 100%;
            background: #667eea;
            transition: width 0.1s ease;
        }

        .state-display {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 12px;
        }

        .state-item {
            background: white;
            padding: 10px;
            border-radius: 8px;
            border: 2px solid #ddd;
        }

        .state-item.active {
            border-color: #667eea;
            box-shadow: 0 0 8px rgba(102, 126, 234, 0.3);
        }

        .state-label {
            font-size: 11px;
            color: #666;
            font-weight: bold;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .state-icon {
            font-size: 16px;
        }

        .state-bar-container {
            width: 100%;
            height: 20px;
            background: #f0f0f0;
            border-radius: 4px;
            position: relative;
            overflow: hidden;
        }

        .state-bar {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.1s ease;
            border-radius: 4px;
        }

        .state-value {
            font-size: 13px;
            font-weight: bold;
            color: #667eea;
            margin-top: 4px;
            text-align: center;
        }

        .state-center-line {
            position: absolute;
            left: 50%;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #333;
            opacity: 0.3;
        }

        .state-indicator {
            display: block;
            position: absolute;
            top: 0;
            left: 50%;
            width: 4px;
            height: 100%;
            background: #4caf50;
            transition: left 0.1s ease;
            box-shadow: 0 0 4px rgba(76, 175, 80, 0.5);
        }

        .state-indicator.warning {
            background: #ff9800;
            box-shadow: 0 0 4px rgba(255, 152, 0, 0.5);
        }

        .state-indicator.danger {
            background: #f44336;
            box-shadow: 0 0 4px rgba(244, 67, 54, 0.5);
        }

        .input-importance {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-top: 12px;
        }

        .importance-bar {
            height: 60px;
            background: #f0f0f0;
            border-radius: 6px;
            position: relative;
            overflow: hidden;
            border: 2px solid #ddd;
        }

        .importance-fill {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, #4caf50, #81c784);
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform-origin: bottom;
        }

        .importance-label {
            position: absolute;
            bottom: 4px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            color: white;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            z-index: 1;
        }

        @media (max-width: 900px) {
            .main-grid {
                grid-template-columns: 1fr;
            }

            .training-stats {
                grid-template-columns: repeat(2, 1fr);
            }

            .metrics {
                grid-template-columns: repeat(2, 1fr);
            }

            .perception-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }

            .settings {
                grid-template-columns: 1fr;
            }

            h1 {
                font-size: 24px;
            }
        }

        @media (max-width: 600px) {
            .container {
                padding: 12px;
            }

            .panel {
                padding: 12px;
            }

            h1 {
                font-size: 20px;
                margin-bottom: 16px;
            }

            h2 {
                font-size: 16px;
            }

            .controls {
                flex-direction: column;
            }

            button {
                width: 100%;
            }

            .perception-input-label {
                font-size: 10px;
            }

            .perception-input-value {
                font-size: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>CartPole Actor-Critic RL Sandbox</h1>

        <div class="main-grid">
            <div class="panel">
                <h2>CartPole Environment <span class="mode-indicator" id="mode-indicator">IDLE</span></h2>
                <canvas id="cartpole-canvas"></canvas>
                <div class="action-bars">
                    <div class="action-bar">
                        <div class="action-bar-label">LEFT</div>
                        <div class="action-bar-fill" id="action-left"></div>
                        <div class="action-bar-value" id="action-left-val">0%</div>
                    </div>
                    <div class="action-bar">
                        <div class="action-bar-label">RIGHT</div>
                        <div class="action-bar-fill" id="action-right"></div>
                        <div class="action-bar-value" id="action-right-val">0%</div>
                    </div>
                </div>
                <div class="controls">
                    <button class="primary" id="train-btn">Start Training</button>
                    <button class="secondary" id="pause-btn" style="display: none;">Pause</button>
                    <button class="success" id="test-btn">Test Policy</button>
                    <button class="danger" id="reset-btn">Reset Policy</button>
                    <button class="secondary" id="manual-btn">Manual Control</button>
                </div>
                <div id="keyboard-hint" class="keyboard-hint" style="display: none;">
                    Use LEFT/RIGHT arrow keys or A/D to control the cart
                </div>

                <!-- Network Management Panel -->
                <div class="feature-panel">
                    <h3>Network Management</h3>
                    <div class="feature-buttons">
                        <button class="feature-btn" id="save-network-btn">💾 Save</button>
                        <button class="feature-btn" id="load-network-btn">📂 Load</button>
                        <button class="feature-btn" id="export-data-btn">📊 Export CSV</button>
                    </div>
                </div>

                <!-- Quick Presets Panel -->
                <div class="feature-panel">
                    <h3>Training Presets</h3>
                    <div class="feature-buttons">
                        <button class="feature-btn preset-btn" id="preset-quick">⚡ Quick</button>
                        <button class="feature-btn preset-btn" id="preset-deep">🧠 Deep</button>
                        <button class="feature-btn preset-btn" id="preset-exploration">🔍 Explore</button>
                        <button class="feature-btn preset-btn" id="preset-production">🏭 Prod</button>
                    </div>
                </div>

                <!-- Keyboard Shortcuts Legend -->
                <div class="feature-panel">
                    <h3>Keyboard Shortcuts</h3>
                    <div class="shortcuts-legend">
                        <div class="shortcut-row"><kbd>SPACE</kbd> <span>Train/Pause</span></div>
                        <div class="shortcut-row"><kbd>T</kbd> <span>Test Policy</span></div>
                        <div class="shortcut-row"><kbd>R</kbd> <span>Reset</span></div>
                        <div class="shortcut-row"><kbd>S</kbd> <span>Save Network</span></div>
                        <div class="shortcut-row"><kbd>L</kbd> <span>Load Network</span></div>
                        <div class="shortcut-row"><kbd>M</kbd> <span>Manual Control</span></div>
                        <div class="shortcut-row"><kbd>P</kbd> <span>Pause Training</span></div>
                    </div>
                </div>

                <div class="network-perception">
                    <div class="perception-title">Network Input (What the AI "Sees")</div>
                    <div class="perception-grid">
                        <div class="perception-input" id="perception-x">
                            <div class="perception-input-label">Cart Position</div>
                            <div class="perception-input-value" id="perception-x-val">0.00</div>
                            <div class="perception-input-bar">
                                <div class="perception-input-bar-fill" id="perception-x-bar"></div>
                            </div>
                        </div>
                        <div class="perception-input" id="perception-xdot">
                            <div class="perception-input-label">Cart Velocity</div>
                            <div class="perception-input-value" id="perception-xdot-val">0.00</div>
                            <div class="perception-input-bar">
                                <div class="perception-input-bar-fill" id="perception-xdot-bar"></div>
                            </div>
                        </div>
                        <div class="perception-input" id="perception-theta">
                            <div class="perception-input-label">Pole Angle</div>
                            <div class="perception-input-value" id="perception-theta-val">0.00</div>
                            <div class="perception-input-bar">
                                <div class="perception-input-bar-fill" id="perception-theta-bar"></div>
                            </div>
                        </div>
                        <div class="perception-input" id="perception-thetadot">
                            <div class="perception-input-label">Angular Vel</div>
                            <div class="perception-input-value" id="perception-thetadot-val">0.00</div>
                            <div class="perception-input-bar">
                                <div class="perception-input-bar-fill" id="perception-thetadot-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="network-perception">
                    <div class="perception-title">Input Importance (Gradient Highlights)</div>
                    <div class="perception-grid">
                        <div class="perception-input">
                            <div class="perception-input-label">Position</div>
                            <div class="perception-input-bar">
                                <div class="perception-input-bar-fill" id="importance-x-bar" style="background: #ff9800;"></div>
                            </div>
                            <div class="perception-input-value" id="importance-x-val">0%</div>
                        </div>
                        <div class="perception-input">
                            <div class="perception-input-label">Velocity</div>
                            <div class="perception-input-bar">
                                <div class="perception-input-bar-fill" id="importance-xdot-bar" style="background: #ff9800;"></div>
                            </div>
                            <div class="perception-input-value" id="importance-xdot-val">0%</div>
                        </div>
                        <div class="perception-input">
                            <div class="perception-input-label">Angle</div>
                            <div class="perception-input-bar">
                                <div class="perception-input-bar-fill" id="importance-theta-bar" style="background: #ff5722;"></div>
                            </div>
                            <div class="perception-input-value" id="importance-theta-val">0%</div>
                        </div>
                        <div class="perception-input">
                            <div class="perception-input-label">Ang Vel</div>
                            <div class="perception-input-bar">
                                <div class="perception-input-bar-fill" id="importance-thetadot-bar" style="background: #ff5722;"></div>
                            </div>
                            <div class="perception-input-value" id="importance-thetadot-val">0%</div>
                        </div>
                    </div>
                </div>

                <div class="state-bars">
                    <div class="state-bar-container">
                        <div class="state-bar-label">
                            <span>Pole Angle (θ)</span>
                            <span class="state-bar-value" id="theta-value">0.0</span>
                        </div>
                        <div class="state-bar-track">
                            <div class="state-bar-center"></div>
                            <div class="state-bar-fill" id="theta-bar"></div>
                        </div>
                    </div>
                    <div class="state-bar-container">
                        <div class="state-bar-label">
                            <span>Angular Velocity</span>
                            <span class="state-bar-value" id="thetadot-value">0.00</span>
                        </div>
                        <div class="state-bar-track">
                            <div class="state-bar-center"></div>
                            <div class="state-bar-fill" id="thetadot-bar"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="panel">
                <h2>Neural Network Visualizer</h2>
                <svg id="network-svg"></svg>
                <div class="training-stats">
                    <div class="training-stat">
                        <div>Avg Weight (Layers)</div>
                        <div class="training-stat-value" id="avg-w1">0.00</div>
                    </div>
                    <div class="training-stat">
                        <div>Avg Weight (Actor)</div>
                        <div class="training-stat-value" id="avg-w2">0.00</div>
                    </div>
                    <div class="training-stat">
                        <div>Policy Entropy</div>
                        <div class="training-stat-value" id="entropy">0.00</div>
                    </div>
                    <div class="training-stat">
                        <div>Exploration (ε)</div>
                        <div class="training-stat-value" id="exploration-rate">0.20</div>
                    </div>
                    <div class="training-stat">
                        <div>Gradient Norm</div>
                        <div class="training-stat-value" id="grad-norm">0.00</div>
                    </div>
                    <div class="training-stat">
                        <div>Avg Advantage</div>
                        <div class="training-stat-value" id="avg-advantage">0.00</div>
                    </div>
                </div>
            </div>

            <div class="panel full-width">
                <h2>What the Network Sees (State Observations)</h2>
                <div class="state-display">
                    <div class="state-item" id="state-x">
                        <div class="state-label">
                            <span class="state-icon">↔️</span>
                            <span>Cart Position (x)</span>
                        </div>
                        <div class="state-bar-container">
                            <div class="state-center-line"></div>
                            <div class="state-indicator" id="indicator-x"></div>
                        </div>
                        <div class="state-value" id="value-x">0.00</div>
                    </div>

                    <div class="state-item" id="state-xdot">
                        <div class="state-label">
                            <span class="state-icon">💨</span>
                            <span>Cart Velocity (ẋ)</span>
                        </div>
                        <div class="state-bar-container">
                            <div class="state-center-line"></div>
                            <div class="state-indicator" id="indicator-xdot"></div>
                        </div>
                        <div class="state-value" id="value-xdot">0.00</div>
                    </div>

                    <div class="state-item" id="state-theta">
                        <div class="state-label">
                            <span class="state-icon">📐</span>
                            <span>Pole Angle (θ)</span>
                        </div>
                        <div class="state-bar-container">
                            <div class="state-center-line"></div>
                            <div class="state-indicator" id="indicator-theta"></div>
                        </div>
                        <div class="state-value" id="value-theta">0.0</div>
                    </div>

                    <div class="state-item" id="state-thetadot">
                        <div class="state-label">
                            <span class="state-icon">🔄</span>
                            <span>Pole Angular Velocity (θ̇)</span>
                        </div>
                        <div class="state-bar-container">
                            <div class="state-center-line"></div>
                            <div class="state-indicator" id="indicator-thetadot"></div>
                        </div>
                        <div class="state-value" id="value-thetadot">0.00</div>
                    </div>
                </div>
            </div>

            <div class="panel full-width">
                <h2>Training Progress</h2>
                <canvas id="training-chart"></canvas>
            </div>

            <div class="panel full-width">
                <h2>Training Loss Over Time</h2>
                <canvas id="training-loss-chart" style="height: 200px;"></canvas>
            </div>

            <div class="panel full-width">
                <h2>Advanced Training Metrics</h2>
                <div class="metrics">
                    <div class="metric">
                        <div class="metric-label">Gradient Norm</div>
                        <div class="metric-value" id="metric-grad-norm">0.000</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Avg Advantage</div>
                        <div class="metric-value" id="metric-advantage">0.000</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Avg Return</div>
                        <div class="metric-value" id="metric-return">0.0</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Avg Q-Value</div>
                        <div class="metric-value" id="metric-qvalue">0.00</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Policy Entropy</div>
                        <div class="metric-value" id="metric-entropy">0.000</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Left Action %</div>
                        <div class="metric-value" id="metric-left-action">50%</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Right Action %</div>
                        <div class="metric-value" id="metric-right-action">50%</div>
                    </div>
                </div>
            </div>

            <div class="panel full-width">
                <h2>State Space Value Function Heatmap</h2>
                <canvas id="state-space-heatmap" style="height: 250px;"></canvas>
                <p style="font-size: 11px; color: #666; margin-top: 8px; text-align: center;">
                    Blue = Low Value | Green/Yellow = Medium | Red = High Value | Updates every 25 episodes
                </p>
            </div>
        </div>

        <div class="panel">
            <h2>Metrics</h2>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-label">Episode</div>
                    <div class="metric-value" id="episode-count">0</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Steps This Episode</div>
                    <div class="metric-value" id="steps-count">0</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Reward This Episode</div>
                    <div class="metric-value" id="reward-count">0</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Last Survival</div>
                    <div class="metric-value" id="last-survival">0</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Best Survival</div>
                    <div class="metric-value" id="best-survival">0</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Avg Last 10</div>
                    <div class="metric-value" id="avg-survival">0</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Value Estimate</div>
                    <div class="metric-value" id="value-estimate">0.0</div>
                </div>
            </div>

            <div class="settings">
                <div class="setting">
                    <label>Learning Rate</label>
                    <input type="number" id="learning-rate" value="0.003" step="0.0001" min="0.0001" max="0.01">
                </div>
                <div class="setting">
                    <label>Discount Factor (γ)</label>
                    <input type="number" id="discount" value="0.99" step="0.01" min="0.9" max="1.0">
                </div>
                <div class="setting">
                    <label>Hidden Layer Size</label>
                    <input type="number" id="hidden-size" value="32" step="8" min="16" max="256">
                </div>
                <div class="setting">
                    <label>Network Depth</label>
                    <select id="network-depth">
                        <option value="1">1 Layer</option>
                        <option value="2" selected>2 Layers</option>
                        <option value="3">3 Layers</option>
                    </select>
                </div>
                <div class="setting">
                    <label>Activation Function</label>
                    <select id="activation">
                        <option value="relu" selected>ReLU</option>
                        <option value="tanh">Tanh</option>
                        <option value="elu">ELU</option>
                        <option value="swish">Swish</option>
                    </select>
                </div>
                <div class="setting">
                    <label>Entropy Coefficient</label>
                    <input type="number" id="entropy-coef" value="0.02" step="0.001" min="0" max="0.1">
                </div>
            </div>

            <div class="slider-control" style="margin-top: 16px;">
                <label>Training Speed:</label>
                <input type="range" id="training-speed" min="1" max="10" value="5" step="1">
                <span id="speed-value">5x</span>
            </div>

            <div class="log" id="log"></div>
        </div>
    </div>

    <script>
        // Utility functions
        function log(message) {
            const logDiv = document.getElementById('log');
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            logDiv.appendChild(entry);
            logDiv.scrollTop = logDiv.scrollHeight;

            // Keep only last entries
            while (logDiv.children.length > CONSTANTS.LOG_MAX_ENTRIES) {
                logDiv.removeChild(logDiv.firstChild);
            }
        }

        // Constants for magic numbers
        const CONSTANTS = {
            // Log management
            LOG_MAX_ENTRIES: 50,

            // CartPole physics and thresholds
            CART_WIDTH: 50,
            CART_HEIGHT: 30,
            WHEEL_RADIUS: 8,
            POLE_TIP_RADIUS: 10,
            ANGLE_ARC_RADIUS: 30,
            VELOCITY_SCALE: 20,
            ARROW_HEAD_SIZE: 8,
            GROUND_HEIGHT_RATIO: 0.7,
            TRACK_Y_RATIO: 0.7,
            CART_Y_RATIO: 0.7,

            // Pole color thresholds (ratio of angle to threshold)
            POLE_CRITICAL_THRESHOLD: 0.7,
            POLE_WARNING_THRESHOLD: 0.4,
            WARNING_DISPLAY_THRESHOLD: 0.7,

            // Reward shaping
            ANGLE_PENALTY: 0.05,
            POSITION_PENALTY: 0.001,
            FAILURE_REWARD: -1.0,

            // Training parameters
            INITIAL_EXPLORATION: 0.2,
            EXPLORATION_DECAY: 0.998,
            MIN_EXPLORATION: 0.05,
            DEFAULT_TRAINING_SPEED: 5,

            // Network visualization
            NODE_RADIUS: 7,
            NODE_SPACING_MIN: 25,

            // Rendering and visualization
            SVG_UPDATE_FREQUENCY: 3, // Update every N frames

            // History management
            SURVIVAL_HISTORY_MAX: 100,
            LOG_INTERVAL_EPISODES: 10,

            // State normalization
            MAX_X: 2.4,
            MAX_X_DOT: 4.0,
            MAX_THETA: 0.21,
            MAX_THETA_DOT: 4.0,

            // Feedback windows
            SURVIVAL_HISTORY_WINDOW: 10
        };

        // Helper function to create zero-initialized Float32Array
        function createZeroFloat32Array(shape) {
            if (Array.isArray(shape[0])) {
                // 2D matrix: array of Float32Array
                return shape.map(row => new Float32Array(row.length));
            }
            // 1D vector: Float32Array
            return new Float32Array(shape.length);
        }

        // Adam Optimizer
        class AdamOptimizer {
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

                if (Array.isArray(param[0])) {
                    // 2D array (matrix)
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

        // Advanced Actor-Critic Neural Network
        class ActorCriticNetwork {
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

        // CartPole environment
        class CartPole {
            constructor() {
                this.gravity = 9.8;
                this.massCart = 1.0;
                this.massPole = 0.1;
                this.totalMass = this.massCart + this.massPole;
                this.length = 0.5; // half the pole length
                this.poleMassLength = this.massPole * this.length;
                this.forceMag = 10.0;
                this.tau = 0.02; // time step

                this.thetaThreshold = 12 * Math.PI / 180;
                this.xThreshold = 2.4;

                this.reset();
            }

            reset() {
                this.x = (Math.random() - 0.5) * 0.1;
                this.xDot = (Math.random() - 0.5) * 0.1;
                this.theta = (Math.random() - 0.5) * 0.1;
                this.thetaDot = (Math.random() - 0.5) * 0.1;
                this.steps = 0;
                return this.getState();
            }

            getState() {
                return [this.x, this.xDot, this.theta, this.thetaDot];
            }

            step(action) {
                const force = action === 1 ? this.forceMag : -this.forceMag;
                const cosTheta = Math.cos(this.theta);
                const sinTheta = Math.sin(this.theta);

                const temp = (force + this.poleMassLength * this.thetaDot * this.thetaDot * sinTheta) / this.totalMass;
                const thetaAcc = (this.gravity * sinTheta - cosTheta * temp) /
                    (this.length * (4.0/3.0 - this.massPole * cosTheta * cosTheta / this.totalMass));
                const xAcc = temp - this.poleMassLength * thetaAcc * cosTheta / this.totalMass;

                this.x += this.tau * this.xDot;
                this.xDot += this.tau * xAcc;
                this.theta += this.tau * this.thetaDot;
                this.thetaDot += this.tau * thetaAcc;

                this.steps++;

                const done = this.x < -this.xThreshold ||
                            this.x > this.xThreshold ||
                            this.theta < -this.thetaThreshold ||
                            this.theta > this.thetaThreshold ||
                            this.steps >= 500;

                const reward = done ? 0 : 1;

                return {
                    state: this.getState(),
                    reward: reward,
                    done: done
                };
            }
        }

        // Rendering
        class Renderer {
            constructor(canvasId) {
                this.canvas = document.getElementById(canvasId);
                this.ctx = this.canvas.getContext('2d');
                // Create offscreen canvas for double buffering
                this.offscreenCanvas = document.createElement('canvas');
                this.offscreenCtx = this.offscreenCanvas.getContext('2d');
                this.resize();
                window.addEventListener('resize', () => this.resize());
            }

            resize() {
                const rect = this.canvas.getBoundingClientRect();
                this.canvas.width = rect.width;
                this.canvas.height = rect.height;
                // Resize offscreen canvas to match
                this.offscreenCanvas.width = rect.width;
                this.offscreenCanvas.height = rect.height;
            }

            render(env) {
                const ctx = this.offscreenCtx;
                const width = this.offscreenCanvas.width;
                const height = this.offscreenCanvas.height;

                // Clear
                ctx.fillStyle = 'rgba(227, 242, 253, 0.5)';
                ctx.fillRect(0, 0, width, height);

                // Ground
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(0, height * CONSTANTS.GROUND_HEIGHT_RATIO, width, height * (1 - CONSTANTS.GROUND_HEIGHT_RATIO));

                // Track
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, height * CONSTANTS.TRACK_Y_RATIO);
                ctx.lineTo(width, height * CONSTANTS.TRACK_Y_RATIO);
                ctx.stroke();

                // Draw boundaries
                const scale = width / 6;
                const leftBoundary = width / 2 - env.xThreshold * scale;
                const rightBoundary = width / 2 + env.xThreshold * scale;

                ctx.strokeStyle = '#f44336';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(leftBoundary, height * 0.5);
                ctx.lineTo(leftBoundary, height * CONSTANTS.CART_Y_RATIO);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(rightBoundary, height * 0.5);
                ctx.lineTo(rightBoundary, height * CONSTANTS.CART_Y_RATIO);
                ctx.stroke();
                ctx.setLineDash([]);

                // Cart
                const cartX = width / 2 + env.x * scale;
                const cartY = height * CONSTANTS.CART_Y_RATIO;
                const cartWidth = CONSTANTS.CART_WIDTH;
                const cartHeight = CONSTANTS.CART_HEIGHT;

                ctx.fillStyle = '#1976d2';
                ctx.fillRect(cartX - cartWidth / 2, cartY - cartHeight, cartWidth, cartHeight);

                // Wheels
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(cartX - cartWidth / 3, cartY, CONSTANTS.WHEEL_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cartX + cartWidth / 3, cartY, CONSTANTS.WHEEL_RADIUS, 0, Math.PI * 2);
                ctx.fill();

                // Pole
                const poleLength = env.length * 2 * scale;
                const poleX = cartX + poleLength * Math.sin(env.theta);
                const poleY = cartY - cartHeight - poleLength * Math.cos(env.theta);

                // Pole color based on angle
                const angleRatio = Math.abs(env.theta) / env.thetaThreshold;
                let poleColor = '#4caf50'; // green
                if (angleRatio > CONSTANTS.POLE_CRITICAL_THRESHOLD) {
                    poleColor = '#f44336'; // red
                } else if (angleRatio > CONSTANTS.POLE_WARNING_THRESHOLD) {
                    poleColor = '#ff9800'; // orange
                }

                ctx.strokeStyle = poleColor;
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(cartX, cartY - cartHeight);
                ctx.lineTo(poleX, poleY);
                ctx.stroke();

                // Pole tip
                ctx.fillStyle = poleColor;
                ctx.beginPath();
                ctx.arc(poleX, poleY, CONSTANTS.POLE_TIP_RADIUS, 0, Math.PI * 2);
                ctx.fill();

                // Draw angle arc
                ctx.strokeStyle = poleColor;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(cartX, cartY - cartHeight, CONSTANTS.ANGLE_ARC_RADIUS, -Math.PI / 2, -Math.PI / 2 + env.theta, env.theta > 0);
                ctx.stroke();
                ctx.globalAlpha = 1.0;

                // Draw velocity vector
                if (Math.abs(env.xDot) > 0.1) {
                    ctx.strokeStyle = '#2196f3';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(cartX, cartY - cartHeight / 2);
                    const velocityScale = CONSTANTS.VELOCITY_SCALE;
                    ctx.lineTo(cartX + env.xDot * velocityScale, cartY - cartHeight / 2);
                    ctx.stroke();

                    // Arrow head
                    const angle = env.xDot > 0 ? 0 : Math.PI;
                    ctx.beginPath();
                    ctx.moveTo(cartX + env.xDot * velocityScale, cartY - cartHeight / 2);
                    ctx.lineTo(cartX + env.xDot * velocityScale - Math.cos(angle - Math.PI / 6) * CONSTANTS.ARROW_HEAD_SIZE,
                              cartY - cartHeight / 2 - Math.sin(angle - Math.PI / 6) * CONSTANTS.ARROW_HEAD_SIZE);
                    ctx.lineTo(cartX + env.xDot * velocityScale - Math.cos(angle + Math.PI / 6) * CONSTANTS.ARROW_HEAD_SIZE,
                              cartY - cartHeight / 2 - Math.sin(angle + Math.PI / 6) * CONSTANTS.ARROW_HEAD_SIZE);
                    ctx.closePath();
                    ctx.fillStyle = '#2196f3';
                    ctx.fill();
                }

                // State info overlay
                ctx.fillStyle = '#333';
                ctx.font = 'bold 14px monospace';
                ctx.fillText(`θ: ${(env.theta * 180 / Math.PI).toFixed(1)}°`, 10, 20);
                ctx.fillText(`x: ${env.x.toFixed(2)}`, 10, 40);

                // Warning indicators
                if (Math.abs(env.x) > env.xThreshold * CONSTANTS.WARNING_DISPLAY_THRESHOLD || Math.abs(env.theta) > env.thetaThreshold * CONSTANTS.WARNING_DISPLAY_THRESHOLD) {
                    ctx.fillStyle = '#f44336';
                    ctx.font = 'bold 16px sans-serif';
                    ctx.fillText('⚠️ CRITICAL', width - 120, 30);
                }

                // Blit offscreen canvas to visible canvas
                this.ctx.drawImage(this.offscreenCanvas, 0, 0);
            }
        }

        // Network visualizer
        class NetworkVisualizer {
            constructor(svgId) {
                this.svg = document.getElementById(svgId);
                this.resize();
                window.addEventListener('resize', () => this.resize());
            }

            resize() {
                const rect = this.svg.getBoundingClientRect();
                this.width = rect.width;
                this.height = rect.height;
            }

            visualize(network) {
                // Clear
                this.svg.innerHTML = '';

                // Build layer structure
                const layers = [{ size: network.inputSize, label: 'Input', type: 'input' }];

                // Add hidden layers
                for (let i = 0; i < network.hiddenSizes.length; i++) {
                    layers.push({
                        size: network.hiddenSizes[i],
                        label: `Hidden ${i + 1}`,
                        type: 'hidden',
                        layerIdx: i
                    });
                }

                // Add output layers (actor and critic)
                layers.push({ size: network.outputSize, label: 'Actor', type: 'actor' });
                layers.push({ size: 1, label: 'Critic', type: 'critic' });

                const layerSpacing = this.width / (layers.length + 1);
                const nodeRadius = 7;

                // Calculate positions
                const positions = layers.map((layer, layerIdx) => {
                    const x = layerSpacing * (layerIdx + 1);
                    const maxNodes = Math.max(...layers.map(l => l.size));
                    const spacing = Math.min(25, this.height / (maxNodes + 1));
                    const startY = (this.height - (layer.size - 1) * spacing) / 2;

                    return Array.from({ length: layer.size }, (_, i) => ({
                        x: x,
                        y: startY + i * spacing
                    }));
                });

                // Draw connections
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

                for (let layerIdx = 0; layerIdx < layers.length - 1; layerIdx++) {
                    const currentLayer = layers[layerIdx];
                    const nextLayer = layers[layerIdx + 1];

                    let weights = null;

                    // Get appropriate weights
                    if (currentLayer.type === 'input' && nextLayer.type === 'hidden') {
                        weights = network.layers[0].w;
                    } else if (currentLayer.type === 'hidden' && nextLayer.type === 'hidden') {
                        weights = network.layers[nextLayer.layerIdx].w;
                    } else if (currentLayer.type === 'hidden' && nextLayer.type === 'actor') {
                        weights = network.actorHead.w;
                    } else if (currentLayer.type === 'hidden' && nextLayer.type === 'critic') {
                        weights = network.criticHead.w;
                    }

                    if (weights) {
                        for (let i = 0; i < currentLayer.size; i++) {
                            for (let j = 0; j < nextLayer.size; j++) {
                                const weight = weights[i][j];
                                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                line.setAttribute('x1', positions[layerIdx][i].x);
                                line.setAttribute('y1', positions[layerIdx][i].y);
                                line.setAttribute('x2', positions[layerIdx + 1][j].x);
                                line.setAttribute('y2', positions[layerIdx + 1][j].y);

                                const opacity = Math.min(1, Math.abs(weight) * 2);
                                let color = weight > 0 ? '#4caf50' : '#f44336';

                                // Different color for critic
                                if (nextLayer.type === 'critic') {
                                    color = weight > 0 ? '#2196f3' : '#ff9800';
                                }

                                line.setAttribute('stroke', color);
                                line.setAttribute('stroke-opacity', opacity * 0.3);
                                line.setAttribute('stroke-width', '1');
                                g.appendChild(line);
                            }
                        }
                    }
                }

                this.svg.appendChild(g);

                // Draw nodes
                layers.forEach((layer, layerIdx) => {
                    positions[layerIdx].forEach((pos, nodeIdx) => {
                        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        circle.setAttribute('cx', pos.x);
                        circle.setAttribute('cy', pos.y);
                        circle.setAttribute('r', nodeRadius);

                        // Color by activation
                        let activation = 0;
                        if (layer.type === 'input' && network.lastInput) {
                            activation = network.lastInput[nodeIdx];
                        } else if (layer.type === 'hidden' && network.lastHidden[layer.layerIdx]) {
                            activation = network.lastHidden[layer.layerIdx][nodeIdx];
                        } else if (layer.type === 'actor' && network.lastOutput) {
                            activation = network.lastOutput[nodeIdx];
                        } else if (layer.type === 'critic') {
                            activation = network.lastValue / 100; // Normalize for visualization
                        }

                        const normalizedActivation = Math.min(1, Math.abs(activation));
                        let color = '#667eea';

                        if (layer.type === 'critic') {
                            color = '#2196f3';
                        } else if (layer.type === 'actor') {
                            color = '#4caf50';
                        }

                        circle.setAttribute('fill', color);
                        circle.setAttribute('fill-opacity', 0.3 + normalizedActivation * 0.7);
                        circle.setAttribute('stroke', '#333');
                        circle.setAttribute('stroke-width', '2');

                        this.svg.appendChild(circle);
                    });

                    // Layer label
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', layerSpacing * (layerIdx + 1));
                    text.setAttribute('y', this.height - 10);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('font-size', '11');
                    text.setAttribute('font-weight', 'bold');

                    if (layer.type === 'actor') {
                        text.setAttribute('fill', '#4caf50');
                    } else if (layer.type === 'critic') {
                        text.setAttribute('fill', '#2196f3');
                    } else {
                        text.setAttribute('fill', '#666');
                    }

                    text.textContent = layer.label;
                    this.svg.appendChild(text);
                });
            }
        }

        // Training chart visualizer
        class TrainingChart {
            constructor(canvasId) {
                this.canvas = document.getElementById(canvasId);
                this.ctx = this.canvas.getContext('2d');
                this.data = [];
                this.maxDataPoints = 100;
                this.resize();
                window.addEventListener('resize', () => this.resize());
            }

            resize() {
                const rect = this.canvas.getBoundingClientRect();
                this.canvas.width = rect.width;
                this.canvas.height = rect.height;
            }

            addDataPoint(episode, reward) {
                this.data.push({ episode, reward });
                if (this.data.length > this.maxDataPoints) {
                    this.data.shift();
                }
                this.render();
            }

            clear() {
                this.data = [];
                this.render();
            }

            render() {
                const ctx = this.ctx;
                const width = this.canvas.width;
                const height = this.canvas.height;
                const padding = 40;

                // Clear
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);

                if (this.data.length === 0) {
                    ctx.fillStyle = '#999';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Training data will appear here...', width / 2, height / 2);
                    return;
                }

                // Find min/max
                const rewards = this.data.map(d => d.reward);
                const minReward = Math.min(...rewards);
                const maxReward = Math.max(...rewards);
                const range = maxReward - minReward || 1;

                // Draw grid
                ctx.strokeStyle = '#e0e0e0';
                ctx.lineWidth = 1;
                for (let i = 0; i <= 5; i++) {
                    const y = padding + (height - 2 * padding) * i / 5;
                    ctx.beginPath();
                    ctx.moveTo(padding, y);
                    ctx.lineTo(width - padding, y);
                    ctx.stroke();

                    // Y-axis labels
                    const value = maxReward - (range * i / 5);
                    ctx.fillStyle = '#666';
                    ctx.font = '11px sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText(value.toFixed(0), padding - 5, y + 4);
                }

                // Draw line
                ctx.strokeStyle = '#667eea';
                ctx.lineWidth = 2;
                ctx.beginPath();

                this.data.forEach((point, i) => {
                    const x = padding + (width - 2 * padding) * i / (this.data.length - 1 || 1);
                    const y = padding + (height - 2 * padding) * (1 - (point.reward - minReward) / range);

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });

                ctx.stroke();

                // Draw points
                ctx.fillStyle = '#667eea';
                this.data.forEach((point, i) => {
                    const x = padding + (width - 2 * padding) * i / (this.data.length - 1 || 1);
                    const y = padding + (height - 2 * padding) * (1 - (point.reward - minReward) / range);

                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Draw moving average
                if (this.data.length >= 10) {
                    ctx.strokeStyle = '#ff9800';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();

                    for (let i = 9; i < this.data.length; i++) {
                        const avg = this.data.slice(i - 9, i + 1).reduce((sum, d) => sum + d.reward, 0) / 10;
                        const x = padding + (width - 2 * padding) * i / (this.data.length - 1);
                        const y = padding + (height - 2 * padding) * (1 - (avg - minReward) / range);

                        if (i === 9) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }

                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // Labels
                ctx.fillStyle = '#333';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Episode', width / 2, height - 5);

                ctx.save();
                ctx.translate(15, height / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText('Survival Time', 0, 0);
                ctx.restore();

                // Legend
                ctx.textAlign = 'left';
                ctx.fillStyle = '#667eea';
                ctx.fillRect(width - 150, 10, 15, 3);
                ctx.fillStyle = '#666';
                ctx.fillText('Episode Reward', width - 130, 15);

                ctx.fillStyle = '#ff9800';
                ctx.fillRect(width - 150, 25, 15, 3);
                ctx.fillStyle = '#666';
                ctx.fillText('10-Ep Average', width - 130, 30);
            }
        }

        // Loss tracking visualization
        class TrainingLossChart {
            constructor(canvasId) {
                this.canvas = document.getElementById(canvasId);
                this.ctx = this.canvas.getContext('2d');
                this.actorLosses = [];
                this.criticLosses = [];
                this.resize();
                window.addEventListener('resize', () => this.resize());
            }

            resize() {
                const rect = this.canvas.getBoundingClientRect();
                this.canvas.width = rect.width;
                this.canvas.height = rect.height;
            }

            addDataPoint(actorLoss, criticLoss) {
                this.actorLosses.push(actorLoss);
                this.criticLosses.push(criticLoss);
                // Keep only last 200 episodes to avoid memory bloat
                if (this.actorLosses.length > 200) {
                    this.actorLosses.shift();
                    this.criticLosses.shift();
                }
                this.draw();
            }

            draw() {
                const ctx = this.ctx;
                const width = this.canvas.width;
                const height = this.canvas.height;
                const padding = 40;

                // Clear
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);

                if (this.actorLosses.length === 0) return;

                // Get max values
                const maxActorLoss = Math.max(...this.actorLosses, 0.1);
                const maxCriticLoss = Math.max(...this.criticLosses, 0.1);
                const maxLoss = Math.max(maxActorLoss, maxCriticLoss);

                // Draw axes
                ctx.strokeStyle = '#999';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(padding, height - padding);
                ctx.lineTo(width - padding, height - padding);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(padding, padding);
                ctx.lineTo(padding, height - padding);
                ctx.stroke();

                // Draw actor loss line
                ctx.strokeStyle = '#667eea';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < this.actorLosses.length; i++) {
                    const x = padding + (i / (this.actorLosses.length - 1 || 1)) * (width - 2 * padding);
                    const y = height - padding - (this.actorLosses[i] / maxLoss) * (height - 2 * padding);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // Draw critic loss line
                ctx.strokeStyle = '#ff9800';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < this.criticLosses.length; i++) {
                    const x = padding + (i / (this.criticLosses.length - 1 || 1)) * (width - 2 * padding);
                    const y = height - padding - (this.criticLosses[i] / maxLoss) * (height - 2 * padding);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // Labels
                ctx.fillStyle = '#333';
                ctx.font = '12px sans-serif';
                ctx.fillText('0', padding - 20, height - padding + 5);
                ctx.fillText(maxLoss.toFixed(2), padding - 35, padding + 5);

                // Legend
                ctx.fillStyle = '#667eea';
                ctx.fillRect(width - 180, 10, 12, 12);
                ctx.fillStyle = '#333';
                ctx.fillText('Actor Loss', width - 160, 20);

                ctx.fillStyle = '#ff9800';
                ctx.fillRect(width - 180, 30, 12, 12);
                ctx.fillStyle = '#333';
                ctx.fillText('Critic Loss', width - 160, 40);
            }

            clear() {
                this.actorLosses = [];
                this.criticLosses = [];
                this.draw();
            }
        }

        // Metrics dashboard
        class MetricsDashboard {
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

        // Replay buffer for experience replay
        class ReplayBuffer {
            constructor(maxSize = 10000) {
                this.maxSize = maxSize;
                this.buffer = [];
                this.priorities = [];
            }

            add(transition, tdError = 1.0) {
                this.buffer.push(transition);
                this.priorities.push(Math.abs(tdError) + 0.01); // Add small epsilon to prevent zero priority

                if (this.buffer.length > this.maxSize) {
                    this.buffer.shift();
                    this.priorities.shift();
                }
            }

            sampleBatch(batchSize) {
                if (this.buffer.length === 0) return [];

                const batch = [];
                const totalPriority = this.priorities.reduce((a, b) => a + b, 0);

                for (let i = 0; i < Math.min(batchSize, this.buffer.length); i++) {
                    let rand = Math.random() * totalPriority;
                    for (let j = 0; j < this.buffer.length; j++) {
                        rand -= this.priorities[j];
                        if (rand <= 0) {
                            batch.push(this.buffer[j]);
                            break;
                        }
                    }
                }

                return batch;
            }

            updatePriorities(transitions, tdErrors) {
                // Update priorities based on new TD errors
                for (let i = 0; i < Math.min(transitions.length, this.buffer.length); i++) {
                    this.priorities[this.buffer.length - 1 - i] = Math.abs(tdErrors[i]) + 0.01;
                }
            }

            clear() {
                this.buffer = [];
                this.priorities = [];
            }

            size() {
                return this.buffer.length;
            }
        }

        // State space heatmap visualization
        class StateSpaceHeatmap {
            constructor(canvasId) {
                this.canvas = document.getElementById(canvasId);
                this.ctx = this.canvas.getContext('2d');
                this.heatmapData = null;
                this.resize();
                window.addEventListener('resize', () => this.resize());
            }

            resize() {
                const rect = this.canvas.getBoundingClientRect();
                this.canvas.width = rect.width;
                this.canvas.height = rect.height;
            }

            computeHeatmap(network, env) {
                const gridSize = 30;
                this.heatmapData = [];

                // Sample grid of states
                const xMin = -env.xThreshold, xMax = env.xThreshold;
                const thetaMin = -env.thetaThreshold, thetaMax = env.thetaThreshold;

                for (let i = 0; i < gridSize; i++) {
                    this.heatmapData[i] = [];
                    for (let j = 0; j < gridSize; j++) {
                        const x = xMin + (xMax - xMin) * (i / gridSize);
                        const theta = thetaMin + (thetaMax - thetaMin) * (j / gridSize);
                        const state = [x, 0, theta, 0]; // Zero velocity for clean visualization

                        // Normalize and get value estimate
                        const normState = [
                            state[0] / CONSTANTS.MAX_X,
                            state[1] / CONSTANTS.MAX_X_DOT,
                            state[2] / CONSTANTS.MAX_THETA,
                            state[3] / CONSTANTS.MAX_THETA_DOT
                        ];

                        const { value } = network.forward(normState);
                        this.heatmapData[i][j] = Math.max(0, Math.min(1, (value + 50) / 100)); // Normalize to [0,1]
                    }
                }
                this.draw();
            }

            draw() {
                if (!this.heatmapData) {
                    const ctx = this.ctx;
                    ctx.fillStyle = '#ccc';
                    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    ctx.fillStyle = '#999';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Train network to see state space values', this.canvas.width / 2, this.canvas.height / 2);
                    return;
                }

                const ctx = this.ctx;
                const width = this.canvas.width;
                const height = this.canvas.height;
                const gridSize = this.heatmapData.length;

                const cellWidth = width / gridSize;
                const cellHeight = height / gridSize;

                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        const value = this.heatmapData[i][j];
                        // Color gradient: blue (low) -> green -> red (high)
                        let color;
                        if (value < 0.5) {
                            const r = Math.floor(value * 2 * 255);
                            color = `rgb(0, ${r}, 255)`;
                        } else {
                            const b = Math.floor((1 - value) * 2 * 255);
                            const g = 255;
                            const r = 255;
                            color = `rgb(${r}, ${g}, ${b})`;
                        }

                        ctx.fillStyle = color;
                        ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
                    }
                }

                // Labels
                ctx.fillStyle = '#333';
                ctx.font = '11px sans-serif';
                ctx.fillText('Position', width / 2, height + 15);
                ctx.save();
                ctx.translate(-15, height / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.textAlign = 'center';
                ctx.fillText('Angle', 0, 0);
                ctx.restore();
            }

            clear() {
                this.heatmapData = null;
                this.draw();
            }
        }

        // Toast notification system
        class Toast {
            static show(message, type = 'info', duration = 3000) {
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                toast.textContent = message;
                toast.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#667eea'};
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    z-index: 10000;
                    font-size: 14px;
                    animation: slideIn 0.3s ease;
                `;
                document.body.appendChild(toast);

                setTimeout(() => {
                    toast.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => toast.remove(), 300);
                }, duration);
            }

            static success(message) { this.show(message, 'success'); }
            static error(message) { this.show(message, 'error'); }
            static info(message) { this.show(message, 'info'); }
        }

        // Add toast animations to CSS
        if (!document.querySelector('style[data-toast-animations]')) {
            const style = document.createElement('style');
            style.setAttribute('data-toast-animations', 'true');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        // Main application
        class RLSandbox {
            constructor() {
                this.env = new CartPole();
                this.network = null;
                this.renderer = new Renderer('cartpole-canvas');
                this.visualizer = new NetworkVisualizer('network-svg');
                this.chart = new TrainingChart('training-chart');

                // Advanced features
                this.lossChart = new TrainingLossChart('training-loss-chart');
                this.metricsDashboard = new MetricsDashboard();
                this.replayBuffer = new ReplayBuffer();
                this.heatmap = new StateSpaceHeatmap('state-space-heatmap');
                this.useReplayBuffer = false;

                this.isTraining = false;
                this.isTesting = false;
                this.isManual = false;
                this.isPaused = false;
                this.episode = 0;
                this.survivalHistory = [];
                this.currentTrajectory = [];
                this.manualAction = null;
                this.trainingSpeed = CONSTANTS.DEFAULT_TRAINING_SPEED;
                this.exploration = CONSTANTS.INITIAL_EXPLORATION;
                this.explorationDecay = CONSTANTS.EXPLORATION_DECAY;
                this.minExploration = CONSTANTS.MIN_EXPLORATION;
                this.frameCounter = 0; // For SVG update throttling

                // Training diagnostics
                this.lastGradNorm = 0;
                this.lastAvgAdvantage = 0;
                this.lastAvgReturn = 0;
                this.lastActorLoss = 0;
                this.lastCriticLoss = 0;

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

                // Network Management buttons
                document.getElementById('save-network-btn').addEventListener('click', () => this.saveNetwork());
                document.getElementById('load-network-btn').addEventListener('click', () => this.loadNetwork());
                document.getElementById('export-data-btn').addEventListener('click', () => this.exportTrainingData());

                // Preset buttons
                document.getElementById('preset-quick').addEventListener('click', () => this.applyPreset('quick'));
                document.getElementById('preset-deep').addEventListener('click', () => this.applyPreset('deep'));
                document.getElementById('preset-exploration').addEventListener('click', () => this.applyPreset('exploration'));
                document.getElementById('preset-production').addEventListener('click', () => this.applyPreset('production'));

                document.getElementById('hidden-size').addEventListener('change', () => {
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
                    this.network.setLearningRate(lr);
                    log(`Learning rate updated to ${lr}`);
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

                if (this.isManual) {
                    btn.textContent = 'Stop Manual';
                    btn.className = 'secondary';
                    hint.style.display = 'block';
                    this.setMode('MANUAL');
                    this.env.reset();
                    log('Manual control enabled - use arrow keys or A/D');
                    this.manualLoop();
                } else {
                    btn.textContent = 'Manual Control';
                    btn.className = 'secondary';
                    hint.style.display = 'none';
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

                    // Use exploration during training
                    const action = train ?
                        this.network.selectAction(normState, this.exploration) :
                        this.network.selectAction(normState, 0);

                    const result = this.env.step(action);

                    // Simpler reward shaping - less harsh penalties
                    let shapedReward = result.reward;
                    if (!result.done) {
                        // Base reward for staying alive
                        shapedReward = 1.0;

                        // Small penalty for large angles (encourage vertical)
                        shapedReward -= CONSTANTS.ANGLE_PENALTY * Math.abs(this.env.theta);

                        // Tiny penalty for being off-center
                        shapedReward -= CONSTANTS.POSITION_PENALTY * Math.abs(this.env.x);
                    } else {
                        // Failure penalty proportional to how early it failed
                        shapedReward = CONSTANTS.FAILURE_REWARD;
                    }

                    totalReward += shapedReward;
                    this.currentTrajectory.push({
                        state: [...normState], // Store normalized state
                        action: action,
                        reward: shapedReward
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
                    const gamma = parseFloat(document.getElementById('discount').value);
                    const entropyCoef = parseFloat(document.getElementById('entropy-coef').value);
                    const updateMetrics = this.network.update(this.currentTrajectory, gamma, entropyCoef);

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

                    // Update heatmap every 25 episodes
                    if (this.episode % 25 === 0) {
                        try {
                            this.heatmap.computeHeatmap(this.network, this.env);
                        } catch (e) {
                            // Silently fail if heatmap canvas not available
                        }
                    }

                    // Slower exploration decay
                    this.exploration = Math.max(this.minExploration, this.exploration * this.explorationDecay);
                }

                this.episode++;
                this.survivalHistory.push(this.env.steps);
                if (this.survivalHistory.length > CONSTANTS.SURVIVAL_HISTORY_MAX) {
                    this.survivalHistory.shift();
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
                this.exploration = CONSTANTS.INITIAL_EXPLORATION; // Reset exploration
                this.chart.clear();
                this.lossChart.clear();
                this.heatmap.clear();
                this.replayBuffer.clear();
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
                        activation: this.network.activationType
                    },
                    hyperparameters: {
                        learningRate: parseFloat(document.getElementById('learning-rate').value),
                        discount: parseFloat(document.getElementById('discount').value),
                        entropy: parseFloat(document.getElementById('entropy-coef').value),
                        hiddenSize: parseInt(document.getElementById('hidden-size').value),
                        networkDepth: parseInt(document.getElementById('network-depth').value)
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
                            }

                            // Reinitialize network with saved config
                            this.initNetwork();

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
                    csv += `${i + 1},${this.survivalHistory[i]},${this.lossChart.actorLosses[i] || 0},${this.lossChart.criticLosses[i] || 0},${this.exploration}\n`;
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
                        speed: 8
                    },
                    deep: {
                        lr: 0.003,
                        discount: 0.99,
                        entropy: 0.015,
                        hidden: 64,
                        depth: 2,
                        speed: 1
                    },
                    exploration: {
                        lr: 0.002,
                        discount: 0.95,
                        entropy: 0.05,
                        hidden: 32,
                        depth: 1,
                        speed: 3
                    },
                    production: {
                        lr: 0.001,
                        discount: 0.99,
                        entropy: 0.01,
                        hidden: 128,
                        depth: 2,
                        speed: 1
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

        // Start the application
        window.addEventListener('load', () => {
            new RLSandbox();
        });
    </script>
</body>
</html>
"""

path = Path("cartpole.html")
path.write_text(html_v3, encoding="utf-8")
str(path)
