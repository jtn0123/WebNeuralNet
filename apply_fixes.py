import re
import os

file_path = 'generate.py'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Fix heInitialize
he_init_old = r"""            heInitialize(inputSize, outputSize) {
                const scale = Math.sqrt(2.0 / inputSize);
                const matrix = [];
                for (let i = 0; i < inputSize; i++) {
                    matrix[i] = [];
                    for (let j = 0; j < outputSize; j++) {
                        matrix[i][j] = (Math.random() - 0.5) * 2 * scale;
                    }
                }
                return matrix;
            }"""

he_init_new = r"""            heInitialize(inputSize, outputSize) {
                // He initialization for Uniform distribution: sqrt(6 / n)
                const scale = Math.sqrt(6.0 / inputSize);
                const matrix = [];
                for (let i = 0; i < inputSize; i++) {
                    matrix[i] = [];
                    for (let j = 0; j < outputSize; j++) {
                        matrix[i][j] = (Math.random() - 0.5) * 2 * scale;
                    }
                }
                return matrix;
            }"""

if he_init_old in content:
    content = content.replace(he_init_old, he_init_new)
    print("Fixed heInitialize")
else:
    print("Could not find heInitialize block")

# 2. Fix entropy gradient in update
update_loop_old_pattern = r"""                    // Actor loss gradients \(policy gradient with advantage\)
                    const actorOutputGrad = \[\.\.\.policy\];
                    actorOutputGrad\[action\] -= 1;
                    for \(let i = 0; i < this\.outputSize; i\+\+\) \{
                        actorOutputGrad\[i\] \*= advantage;
                        // Entropy bonus
                        actorOutputGrad\[i\] -= entropyCoef \* \(Math\.log\(policy\[i\] \+ 1e-10\) \+ 1\);
                    \}"""

update_loop_new = r"""                    // Actor loss gradients (policy gradient with advantage)
                    const actorOutputGrad = [...policy];
                    
                    // Calculate current entropy
                    let entropy = 0;
                    for (const p of policy) {
                        if (p > 0) entropy -= p * Math.log(p);
                    }

                    actorOutputGrad[action] -= 1;
                    for (let i = 0; i < this.outputSize; i++) {
                        actorOutputGrad[i] *= advantage;
                        // Entropy bonus: d(beta * H)/dz = beta * p * (log(p) + H)
                        // We want to ascend, so we subtract negative gradient: - ( - beta * ... )
                        // Gradient collected is negative of objective gradient.
                        actorOutputGrad[i] += entropyCoef * policy[i] * (Math.log(policy[i] + 1e-10) + entropy);
                    }"""

new_content = re.sub(update_loop_old_pattern, update_loop_new, content, flags=re.MULTILINE)
if new_content != content:
    print("Fixed entropy gradient")
    content = new_content
else:
    print("Could not find update loop pattern")


# 3. Add normalizeState to RLSandbox and update usages
init_network_pattern = r"""            initNetwork\(\) \{"""
normalize_method = r"""            normalizeState(state) {
                // Normalize inputs to roughly [-1, 1] range for better network performance
                return [
                    state[0] / 2.4,        // Position (limit 2.4)
                    state[1] / 4.0,        // Velocity (approx range)
                    state[2] / 0.21,       // Angle (limit ~0.21 rad / 12 deg)
                    state[3] / 4.0         // Angular velocity (approx range)
                ];
            }

            initNetwork() {"""

new_content = re.sub(init_network_pattern, normalize_method, content)
if new_content != content:
    print("Added normalizeState")
    content = new_content
else:
    print("Could not insert normalizeState")

# Update runEpisode action selection
run_episode_action = r"""                    // Use exploration during training
                    const action = train \?
                        this\.network\.selectAction\(state, this\.exploration\) :
                        this\.network\.selectAction\(state, 0\);"""

run_episode_action_new = r"""                    // Normalize state for network
                    const normState = this.normalizeState(state);

                    // Use exploration during training
                    const action = train ?
                        this.network.selectAction(normState, this.exploration) :
                        this.network.selectAction(normState, 0);"""

new_content = re.sub(run_episode_action, run_episode_action_new, content)
if new_content != content:
    print("Updated runEpisode action selection")
    content = new_content
else:
    print("Could not find runEpisode action pattern")

# Update runEpisode trajectory push
traj_push = r"""                    this\.currentTrajectory\.push\(\{
                        state: \[\.\.\.state\],
                        action: action,
                        reward: shapedReward
                    \}\);"""

traj_push_new = r"""                    this.currentTrajectory.push({
                        state: [...normState], // Store normalized state
                        action: action,
                        reward: shapedReward
                    });"""

new_content = re.sub(traj_push, traj_push_new, content)
if new_content != content:
    print("Updated runEpisode trajectory push")
    content = new_content
else:
    print("Could not find trajectory push pattern")

# Update manualLoop
manual_forward = r"""                        // Show what action the network would take
                        const state = this\.env\.getState\(\);
                        this\.network\.forward\(state\);"""

manual_forward_new = r"""                        // Show what action the network would take
                        const state = this.env.getState();
                        this.network.forward(this.normalizeState(state));"""

new_content = re.sub(manual_forward, manual_forward_new, content)
if new_content != content:
    print("Updated manualLoop")
    content = new_content
else:
    print("Could not find manualLoop pattern")

# Update updateStateDisplay
importance_call = r"""                // Calculate and display input importance
                const importance = this\.network\.getInputImportance\(state\);"""

importance_call_new = r"""                // Calculate and display input importance
                const importance = this.network.getInputImportance(this.normalizeState(state));"""

new_content = re.sub(importance_call, importance_call_new, content)
if new_content != content:
    print("Updated updateStateDisplay")
    content = new_content
else:
    print("Could not find updateStateDisplay pattern")

with open(file_path, 'w') as f:
    f.write(content)

