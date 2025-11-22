// Network visualizer with enhanced interactivity and visual improvements
export class NetworkVisualizer {
    constructor(svgId) {
        this.svg = document.getElementById(svgId);
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Create persistent SVG structure
        this.initializeSVG();

        // Tooltip element for hover interactions
        this.tooltip = null;
    }

    initializeSVG() {
        // Define gradients for visual zones
        if (!this.svg.querySelector('defs')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

            // Gradient for layer zone backgrounds
            const inputGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            inputGrad.setAttribute('id', 'input-gradient');
            inputGrad.setAttribute('x1', '0%');
            inputGrad.setAttribute('y1', '0%');
            inputGrad.setAttribute('x2', '100%');
            inputGrad.setAttribute('y2', '0%');
            inputGrad.innerHTML = '<stop offset="0%" style="stop-color:#e3f2fd;stop-opacity:0.3" /><stop offset="100%" style="stop-color:#e3f2fd;stop-opacity:0" />';
            defs.appendChild(inputGrad);

            const hiddenGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            hiddenGrad.setAttribute('id', 'hidden-gradient');
            hiddenGrad.setAttribute('x1', '0%');
            hiddenGrad.setAttribute('y1', '0%');
            hiddenGrad.setAttribute('x2', '100%');
            hiddenGrad.setAttribute('y2', '0%');
            hiddenGrad.innerHTML = '<stop offset="0%" style="stop-color:#f3e5f5;stop-opacity:0" /><stop offset="50%" style="stop-color:#f3e5f5;stop-opacity:0.2" /><stop offset="100%" style="stop-color:#f3e5f5;stop-opacity:0" />';
            defs.appendChild(hiddenGrad);

            const outputGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            outputGrad.setAttribute('id', 'output-gradient');
            outputGrad.setAttribute('x1', '0%');
            outputGrad.setAttribute('y1', '0%');
            outputGrad.setAttribute('x2', '100%');
            outputGrad.setAttribute('y2', '0%');
            outputGrad.innerHTML = '<stop offset="0%" style="stop-color:#f0f4c3;stop-opacity:0" /><stop offset="100%" style="stop-color:#f0f4c3;stop-opacity:0.3" />';
            defs.appendChild(outputGrad);

            this.svg.appendChild(defs);
        }

        // Create layer groups if they don't exist
        if (!this.svg.querySelector('#layer-zones')) {
            const zones = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            zones.setAttribute('id', 'layer-zones');
            this.svg.appendChild(zones);
        }

        if (!this.svg.querySelector('#connections')) {
            const connGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            connGroup.setAttribute('id', 'connections');
            this.svg.appendChild(connGroup);
        }

        if (!this.svg.querySelector('#nodes')) {
            const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            nodeGroup.setAttribute('id', 'nodes');
            this.svg.appendChild(nodeGroup);
        }

        if (!this.svg.querySelector('#labels')) {
            const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            labelGroup.setAttribute('id', 'labels');
            this.svg.appendChild(labelGroup);
        }
    }

    resize() {
        const rect = this.svg.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
    }

    // Calculate Bezier curve control point for smooth connections
    getBezierPath(x1, y1, x2, y2) {
        const midX = (x1 + x2) / 2;
        const controlX = midX;
        const controlY = (y1 + y2) / 2;
        return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
    }

    visualize(network) {
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

        // Calculate optimal spacing
        const maxNodes = Math.max(...layers.map(l => l.size));
        const padding = 40; // Space for labels
        const availableHeight = this.height - padding;
        const spacing = availableHeight / (maxNodes + 1);

        const layerSpacing = this.width / (layers.length + 1);

        // Calculate positions with dynamic spacing
        const positions = layers.map((layer, layerIdx) => {
            const x = layerSpacing * (layerIdx + 1);
            const layerSpacingY = availableHeight / (layer.size + 1);
            const startY = padding / 2 + layerSpacingY;

            return Array.from({ length: layer.size }, (_, i) => ({
                x: x,
                y: startY + i * layerSpacingY
            }));
        });

        // Calculate adaptive node sizes based on layer size
        const maxLayerSize = Math.max(...layers.map(l => l.size));
        const minNodeRadius = 4;
        const maxNodeRadius = 10;

        // Clear groups
        const connectGroup = this.svg.querySelector('#connections');
        const nodeGroup = this.svg.querySelector('#nodes');
        const labelGroup = this.svg.querySelector('#labels');
        const zoneGroup = this.svg.querySelector('#layer-zones');

        connectGroup.innerHTML = '';
        nodeGroup.innerHTML = '';
        labelGroup.innerHTML = '';
        zoneGroup.innerHTML = '';

        // Draw layer background zones
        layers.forEach((layer, layerIdx) => {
            const x = layerSpacing * (layerIdx + 1);
            const zoneWidth = layerSpacing * 0.8;
            let gradId = 'input-gradient';

            if (layer.type === 'hidden') {
                gradId = 'hidden-gradient';
            } else if (layer.type === 'actor' || layer.type === 'critic') {
                gradId = 'output-gradient';
            }

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x - zoneWidth / 2);
            rect.setAttribute('y', 0);
            rect.setAttribute('width', zoneWidth);
            rect.setAttribute('height', this.height);
            rect.setAttribute('fill', `url(#${gradId})`);
            zoneGroup.appendChild(rect);
        });

        // Draw connections with Bezier curves
        for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
            const currentLayer = layers[layerIdx];
            const targets = [];

            if (currentLayer.type === 'input') {
                const nextLayer = layers.find(l => l.type === 'hidden' && l.layerIdx === 0);
                if (nextLayer) {
                    targets.push({
                        layer: nextLayer,
                        weights: network.layers[0].w,
                        idx: layers.indexOf(nextLayer)
                    });
                }
            } else if (currentLayer.type === 'hidden') {
                const nextHidden = layers.find(l => l.type === 'hidden' && l.layerIdx === currentLayer.layerIdx + 1);
                if (nextHidden) {
                    targets.push({
                        layer: nextHidden,
                        weights: network.layers[nextHidden.layerIdx].w,
                        idx: layers.indexOf(nextHidden)
                    });
                } else {
                    const actor = layers.find(l => l.type === 'actor');
                    const critic = layers.find(l => l.type === 'critic');

                    if (actor) {
                        targets.push({
                            layer: actor,
                            weights: network.actorHead.w,
                            idx: layers.indexOf(actor)
                        });
                    }

                    if (critic) {
                        targets.push({
                            layer: critic,
                            weights: network.criticHead.w,
                            idx: layers.indexOf(critic)
                        });
                    }
                }
            }

            // Draw connections to all targets
            for (const target of targets) {
                const nextLayer = target.layer;
                const nextLayerIdx = target.idx;
                const weights = target.weights;

                for (let i = 0; i < currentLayer.size; i++) {
                    for (let j = 0; j < nextLayer.size; j++) {
                        const weight = weights[i][j];
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

                        const x1 = positions[layerIdx][i].x;
                        const y1 = positions[layerIdx][i].y;
                        const x2 = positions[nextLayerIdx][j].x;
                        const y2 = positions[nextLayerIdx][j].y;

                        path.setAttribute('d', this.getBezierPath(x1, y1, x2, y2));
                        path.setAttribute('class', 'network-connection');
                        path.setAttribute('data-weight', weight.toFixed(3));

                        const opacity = Math.min(1, Math.abs(weight) * 2);
                        let color = weight > 0 ? '#4caf50' : '#f44336';

                        if (nextLayer.type === 'critic') {
                            color = weight > 0 ? '#2196f3' : '#ff9800';
                        }

                        path.setAttribute('stroke', color);
                        path.setAttribute('stroke-opacity', opacity * 0.3);
                        path.setAttribute('stroke-width', '1');
                        path.setAttribute('fill', 'none');

                        // Add hover interaction
                        path.addEventListener('mouseenter', (e) => this.showConnectionTooltip(e, weight));
                        path.addEventListener('mouseleave', () => this.hideTooltip());

                        connectGroup.appendChild(path);
                    }
                }
            }
        }

        // Draw nodes
        layers.forEach((layer, layerIdx) => {
            const nodeRadius = minNodeRadius + (maxNodeRadius - minNodeRadius) * (1 - layer.size / maxLayerSize);

            positions[layerIdx].forEach((pos, nodeIdx) => {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', pos.x);
                circle.setAttribute('cy', pos.y);
                circle.setAttribute('r', nodeRadius);
                circle.setAttribute('class', `network-node network-node-${layer.type}`);

                let activation = 0;
                if (layer.type === 'input' && network.lastInput) {
                    activation = network.lastInput[nodeIdx];
                } else if (layer.type === 'hidden' && network.lastHidden[layer.layerIdx]) {
                    activation = network.lastHidden[layer.layerIdx][nodeIdx];
                } else if (layer.type === 'actor' && network.lastOutput) {
                    activation = network.lastOutput[nodeIdx];
                } else if (layer.type === 'critic') {
                    activation = network.lastValue / 100;
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
                circle.setAttribute('data-activation', activation.toFixed(3));

                // Add hover interaction
                circle.addEventListener('mouseenter', (e) => this.showNodeTooltip(e, activation, layer.type));
                circle.addEventListener('mouseleave', () => this.hideTooltip());

                nodeGroup.appendChild(circle);
            });

            // Layer label with statistics
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', layerSpacing * (layerIdx + 1));
            text.setAttribute('y', this.height - 15);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '11');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('class', 'network-label');

            if (layer.type === 'actor') {
                text.setAttribute('fill', '#4caf50');
            } else if (layer.type === 'critic') {
                text.setAttribute('fill', '#2196f3');
            } else {
                text.setAttribute('fill', '#666');
            }

            text.textContent = layer.label;

            // Add click handler for statistics
            text.style.cursor = 'pointer';
            text.addEventListener('click', () => this.showLayerStats(network, layer, layerIdx));

            labelGroup.appendChild(text);
        });
    }

    showNodeTooltip(event, activation, type) {
        const elem = event.target;
        const x = parseFloat(elem.getAttribute('cx'));
        const y = parseFloat(elem.getAttribute('cy'));

        this.showTooltip(x, y, `Activation: ${activation.toFixed(3)}`);
    }

    showConnectionTooltip(event, weight) {
        const path = event.target;
        const d = path.getAttribute('d');
        // Extract approximate midpoint from path
        const matches = d.match(/Q\s+([\d.]+)\s+([\d.]+)/);
        if (matches) {
            const x = parseFloat(matches[1]);
            const y = parseFloat(matches[2]);
            this.showTooltip(x, y, `Weight: ${weight.toFixed(3)}`);
        }
    }

    showTooltip(x, y, text) {
        if (!this.tooltip) {
            this.tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this.tooltip.setAttribute('class', 'network-tooltip');
            this.svg.appendChild(this.tooltip);
        }

        this.tooltip.innerHTML = '';

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x - 40);
        rect.setAttribute('y', y - 25);
        rect.setAttribute('width', '80');
        rect.setAttribute('height', '20');
        rect.setAttribute('fill', '#333');
        rect.setAttribute('rx', '4');
        rect.setAttribute('ry', '4');

        const textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElem.setAttribute('x', x);
        textElem.setAttribute('y', y - 10);
        textElem.setAttribute('text-anchor', 'middle');
        textElem.setAttribute('font-size', '10');
        textElem.setAttribute('fill', 'white');
        textElem.setAttribute('pointer-events', 'none');
        textElem.textContent = text;

        this.tooltip.appendChild(rect);
        this.tooltip.appendChild(textElem);
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.innerHTML = '';
        }
    }

    showLayerStats(network, layer, layerIdx) {
        // Calculate weight statistics for this layer
        let weights = [];

        if (layer.type === 'input') {
            weights = network.layers[0].w.flat();
        } else if (layer.type === 'hidden' && layerIdx < network.layers.length) {
            if (layerIdx === network.layers.length) {
                // Last hidden layer
                weights = network.actorHead.w.flat().concat(network.criticHead.w.flat());
            } else {
                weights = network.layers[layerIdx].w.flat();
            }
        } else if (layer.type === 'actor') {
            weights = network.actorHead.w.flat();
        } else if (layer.type === 'critic') {
            weights = network.criticHead.w.flat();
        }

        if (weights.length > 0) {
            const mean = weights.reduce((a, b) => a + b, 0) / weights.length;
            const variance = weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length;
            const std = Math.sqrt(variance);
            const min = Math.min(...weights);
            const max = Math.max(...weights);

            console.log(`${layer.label} Statistics:`, {
                mean: mean.toFixed(4),
                std: std.toFixed(4),
                min: min.toFixed(4),
                max: max.toFixed(4)
            });
        }
    }

    // Trigger activation animation for a layer
    animateLayerActivation(layerIndex) {
        const nodeGroup = this.svg.querySelector('#nodes');
        if (!nodeGroup) return;

        const nodes = nodeGroup.querySelectorAll('circle');
        let nodeCount = 0;

        nodes.forEach((node) => {
            // Reset animation
            node.classList.remove('active');
            // Trigger reflow to restart animation
            void node.offsetWidth;

            if (nodeCount >= layerIndex && nodeCount < layerIndex + 1) {
                node.classList.add('active');
            }
            nodeCount++;
        });
    }

    // Animate the entire forward pass
    animateForwardPass() {
        const nodeGroup = this.svg.querySelector('#nodes');
        const connGroup = this.svg.querySelector('#connections');

        if (!nodeGroup) return;

        const nodes = Array.from(nodeGroup.querySelectorAll('circle'));
        const conns = Array.from(connGroup.querySelectorAll('path'));

        let delay = 0;

        // Animate nodes with staggered delay
        nodes.forEach((node, idx) => {
            setTimeout(() => {
                node.classList.remove('active');
                void node.offsetWidth;
                node.classList.add('active');
            }, delay);
            delay += 100;
        });

        // Animate connections
        conns.forEach((conn) => {
            conn.classList.remove('active');
        });

        delay = 150;
        conns.forEach((conn) => {
            setTimeout(() => {
                conn.classList.add('active');
            }, delay);
            delay += 50;
        });
    }

    // Update node activation intensity classes
    updateActivationIntensity(network, layers) {
        const nodeGroup = this.svg.querySelector('#nodes');
        if (!nodeGroup) return;

        const nodes = Array.from(nodeGroup.querySelectorAll('circle'));
        let nodeIdx = 0;

        layers.forEach((layer, layerIdx) => {
            const layerSize = layer.size;

            for (let i = 0; i < layerSize; i++) {
                const node = nodes[nodeIdx];
                if (!node) break;

                let activation = 0;
                if (layer.type === 'input' && network.lastInput) {
                    activation = network.lastInput[i];
                } else if (layer.type === 'hidden' && network.lastHidden[layer.layerIdx]) {
                    activation = network.lastHidden[layer.layerIdx][i];
                } else if (layer.type === 'actor' && network.lastOutput) {
                    activation = network.lastOutput[i];
                } else if (layer.type === 'critic') {
                    activation = network.lastValue / 100;
                }

                // Remove old classes
                node.classList.remove('high-activation', 'medium-activation', 'low-activation');

                // Add intensity class based on activation magnitude
                const absActivation = Math.abs(activation);
                if (absActivation > 0.7) {
                    node.classList.add('high-activation');
                } else if (absActivation > 0.3) {
                    node.classList.add('medium-activation');
                } else {
                    node.classList.add('low-activation');
                }

                nodeIdx++;
            }
        });
    }
}
