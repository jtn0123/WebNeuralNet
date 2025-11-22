// CartPole environment
export class CartPole {
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
