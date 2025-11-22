// Network visualizer
export class NetworkVisualizer {
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

        for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
            const currentLayer = layers[layerIdx];
            const targets = [];

            if (currentLayer.type === 'input') {
                // Connect to first hidden layer
                const nextLayer = layers.find(l => l.type === 'hidden' && l.layerIdx === 0);
                if (nextLayer) {
                    targets.push({
                        layer: nextLayer,
                        weights: network.layers[0].w,
                        idx: layers.indexOf(nextLayer)
                    });
                }
            } else if (currentLayer.type === 'hidden') {
                // Connect to next hidden layer if it exists
                const nextHidden = layers.find(l => l.type === 'hidden' && l.layerIdx === currentLayer.layerIdx + 1);
                if (nextHidden) {
                    targets.push({
                        layer: nextHidden,
                        weights: network.layers[nextHidden.layerIdx].w,
                        idx: layers.indexOf(nextHidden)
                    });
                } else {
                    // Last hidden layer connects to BOTH Actor and Critic
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
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', positions[layerIdx][i].x);
                        line.setAttribute('y1', positions[layerIdx][i].y);
                        line.setAttribute('x2', positions[nextLayerIdx][j].x);
                        line.setAttribute('y2', positions[nextLayerIdx][j].y);

                        const opacity = Math.min(1, Math.abs(weight) * 2);
                        let color = weight > 0 ? '#4caf50' : '#f44336';

                        // Different color for critic connections
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
