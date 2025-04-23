import ReinforcementAgent from "./reinforcement_agent";

type Key<S, A> = {
    state: S;
    action: A;
};

class QLearningAgent<State, Action> extends ReinforcementAgent {
    private values: Map<Key<State, Action>, number>;
    constructor(epsilon = 0.05, gamma = 0.8, alpha = 0.2, numTraining = 0) {
        super(numTraining, epsilon, alpha, gamma);
        this.values = new Map<Key<State, Action>, number>();
    }
    update(state: State, action: Action, nexState: State, reward: any) {
        const correction =
            reward +
            this.discount * this.computeValueFromQValues(nexState) -
            this.getQValue(state, action);
        this.values.set(
            { state, action } as Key<State, Action>,
            this.getQValue(state, action) + this.alpha * correction
        );
    }
    getQValue(state: State, action: Action): number {
        return this.values.get({ state, action } as Key<State, Action>) ?? 0;
    }
    computeValueFromQValues(state: State): number {
        const legalActions = this.getLegalActions(state);
        if (legalActions.length == 0) {
            return 0;
        }
        const q_values = legalActions.map((action) =>
            this.getQValue(state, action)
        );
        return Math.max(...q_values);
    }
    computeActionFromQValues(state: State): Action {
        const legalActions = this.getLegalActions(state);
        const q_values = legalActions.map((action) => {
            return { action: action, value: this.getQValue(state, action) };
        });
        let best = q_values[0];
        for (const q_value of q_values) {
            if (q_value.value > best.value) {
                best = q_value;
            }
        }
        return best.action;
    }
    getAction(state: State): Action {
        const legalActions = this.getLegalActions(state);
        if (Math.random() < this.epsilon) {
            return legalActions[
                Math.floor(legalActions.length * Math.random())
            ];
        }
        const action = this.computeActionFromQValues(state);
        return action;
    }
    getValue(state: any): number {
        return this.computeValueFromQValues(state);
    }
    getPolicy(state: any) {
        return this.computeActionFromQValues(state);
    }
}

class ApproximateQAgent<State, Action, Features> extends QLearningAgent<
    State,
    Action
> {
    protected featureExtractor;
    protected weights: Features;
    constructor(
        featureExtractor,
        initialWeights: Features,
        epsilon = 0.05,
        gamma = 0.8,
        alpha = 0.2,
        numTraining = 0
    ) {
        super(epsilon, gamma, alpha, numTraining);
        this.featureExtractor = featureExtractor;
        this.weights = initialWeights;
    }
    getWeights() {
        return this.weights;
    }
    getQValue(state: State, action: Action): number {
        const features = this.featureExtractor(state, action);
        let res = 0;
        for (const feature in features) {
            res += features[feature] * this.weights[feature];
        }
        return res;
    }
    update(state: State, action: Action, nextState: State, reward: number) {
        const difference =
            reward +
            this.discount * this.computeValueFromQValues(nextState) -
            this.getQValue(state, action);
        const features = this.featureExtractor(state, action);
        for (const feature in features) {
            this.weights[feature] +=
                this.alpha * difference * features[feature];
        }
    }
}

export default ApproximateQAgent;
