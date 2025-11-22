// Replay buffer for experience replay
export class ReplayBuffer {
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
