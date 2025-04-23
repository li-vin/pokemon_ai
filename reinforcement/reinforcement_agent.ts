abstract class Agent {
    protected index: number;
    constructor(index: number = 0) {
        this.index = index;
    }
    abstract getAction(state);
}

abstract class ValueEstimationAgent extends Agent {
    protected alpha: number;
    protected epsilon: number;
    protected discount: number;
    protected numTraining: number;
    constructor(
        alpha: number = 1.0,
        epsilon: number = 0.05,
        gamma: number = 0.8,
        numTraining: number = 10,
        index: number = 0
    ) {
        super(index);
        this.alpha = alpha;
        this.epsilon = epsilon;
        this.discount = gamma;
        this.numTraining = numTraining;
    }

    abstract getQValue(state, action): number;
    abstract getValue(state): number;
    abstract getPolicy(state);
}

abstract class ReinforcementAgent extends ValueEstimationAgent {
    protected actionFn;
    protected episodesSoFar;
    protected accumTrainRewards;
    protected accumTestRewards;
    protected episodeRewards;
    protected lastState;
    protected lastAction;
    constructor(
        numTraining: number = 100,
        epsilon: number = 0.5,
        alpha: number = 0.5,
        gamma: number = 1,
        actionFn = undefined
    ) {
        super(alpha, epsilon, gamma, numTraining);
        this.actionFn = actionFn;
        if (!actionFn) {
            this.actionFn = (state) => state.getLegalActions();
        }
        this.episodesSoFar = 0;
        this.accumTrainRewards = 0;
        this.accumTestRewards = 0;
    }
    abstract update(state, action, nexState, reward);
    getLegalActions(state) {
        return this.actionFn(state);
    }
    observeTransition(state, action, nextState, deltaReward) {
        this.episodeRewards += deltaReward;
        this.update(state, action, nextState, deltaReward);
    }
    startEpisode() {
        this.lastState = undefined;
        this.lastAction = undefined;
        this.episodeRewards = 0;
    }
    stopEpisode() {
        if (this.episodesSoFar < this.numTraining) {
            this.accumTrainRewards += this.episodeRewards;
        } else {
            this.accumTestRewards += this.episodeRewards;
        }
        this.episodesSoFar++;
        if (this.episodesSoFar >= this.numTraining) {
            this.epsilon = 0;
            this.alpha = 0;
        }
    }
    isInTraining() {
        return this.episodesSoFar < this.numTraining;
    }
    isInTesting() {
        return !this.isInTraining();
    }
    setEpsilon(epsilon) {
        this.epsilon = epsilon;
    }
    setLearningRate(alpha) {
        this.alpha = alpha;
    }
    setDiscount(discount) {
        this.discount = discount;
    }
    doAaction(state, action) {
        this.lastState = state;
        this.lastAction = action;
    }
    observationFunction(state) {
        if (this.lastState) {
            const reward = state.getScore() - this.lastState.getScore();
            this.observeTransition(
                this.lastState,
                this.lastAction,
                state,
                reward
            );
        }
        return state;
    }
    registerInitialState(state) {
        this.startEpisode();
        if (this.episodesSoFar === 0) {
            console.log(`Beginning ${this.numTraining} episodes of Training`);
        }
    }
    final(state) {
        const deltaReward = state.getScore() - this.lastState.getScore();
        this.observeTransition(
            this.lastState,
            this.lastAction,
            state,
            deltaReward
        );
        this.stopEpisode();

        // TODO???
    }
}
export default ReinforcementAgent;
