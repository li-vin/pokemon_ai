import { BattleStreams } from "@pkmn/sim";
import {
    getPossibleMoves,
    getPossibleSwitches,
    parseActivePokemon,
    parseActivePokemonInfo,
    parseSwitchToPokemon,
    parseSwitchToPokemonInfo,
    splitFirst,
} from "../request_utils";
import {
    BasicPokemonFeatures,
    PokemonBattleState,
} from "./approx_learn_features";
import ApproximateQAgent from "./learning_agents";

class ApproximateQPlayer extends BattleStreams.BattlePlayer {
    waitForSwitch: boolean;
    state: PokemonBattleState;
    agent: ApproximateQAgent<PokemonBattleState, string, BasicPokemonFeatures>;
    lastState: PokemonBattleState;
    lastAction: string;
    latestReward: number;
    learn: boolean;
    tracker: any;
    player: number;
    private started: boolean;

    constructor(
        playerStream,
        agent,
        player = 1,
        tracker: any = undefined,
        learn = true,
        debug = false
    ) {
        super(playerStream, debug);
        this.waitForSwitch = false;
        this.player = player; // unimplemented still, this player can only be player 1
        this.agent = agent;
        this.state = new PokemonBattleState();
        this.lastState = this.state.copy();
        this.lastAction = "default";
        this.latestReward = 0;
        this.learn = learn;
        this.tracker = tracker;
        this.started = false;
    }

    receiveLine(line: string): void {
        if (!line.startsWith("|")) return;
        const [cmd, rest] = splitFirst(line.slice(1), "|");
        switch (cmd) {
            case "faint":
                const [faintUser, _d] = splitFirst(rest, "|");
                if (faintUser.startsWith("p2a")) {
                    this.state.enemyPokemon = undefined;
                    this.waitForSwitch = true;
                }
                break;
            case "-damage":
            case "-heal":
                const [damageUser, hpRemaining] = splitFirst(rest, "|");
                if (damageUser.startsWith("p2")) {
                    if (this.state.enemyPokemon) {
                        this.latestReward +=
                            this.state.enemyPokemon.curHP -
                            parseInt(hpRemaining);
                        this.state.enemyPokemon.curHP = parseInt(hpRemaining);
                    } else {
                        // this should not happen
                        console.log(
                            "Something went wrong with tracking enemy pokemon"
                        );
                    }
                }
                if (damageUser.startsWith("p1")) {
                    this.latestReward -=
                        this.state.myActivePokemon.curHP -
                        parseInt(hpRemaining);
                    this.state.myActivePokemon.curHP = parseInt(hpRemaining);
                }
                break;
            case "switch":
            case "drag":
            case "replace":
            case "detailschange":
                const [switchUser, _] = splitFirst(rest, "|");
                if (switchUser.startsWith("p2a")) {
                    this.state.enemyPokemon = parseSwitchToPokemonInfo(rest);
                    if (this.waitForSwitch) {
                        this.waitForSwitch = false;
                        this.chooseAction();
                    }
                } else if (switchUser.startsWith("p1a")) {
                    this.state.myActivePokemon = parseSwitchToPokemonInfo(rest);
                }
                break;
            case "request":
                return this.receiveRequest(JSON.parse(rest));
            case "error":
                return this.receiveError(new Error(rest));
        }
    }

    receiveError(error: Error): void {
        // console.log(error);
        // console.log(this.state);
        // console.log(this.lastState.request.active.trapped);
        // console.log(this.lastAction);
        // throw new Error(error.message);
        if (this.tracker) {
            this.tracker.setLogFlag(
                `############################\nPlayer ${this.player} Error: ${error.message}.\nLast action: ${this.lastAction}\nLast State: ${this.state}`
            );
        }
        this.choose("default");
    }

    receiveRequest(request) {
        if (!request.wait) {
            if (request.teamPreview) {
                this.choose("default");
                return;
            }
            this.state.request = request;
            // update q-learning agent
            if (this.debug && this.latestReward < 0) {
                console.log("Weights:", this.agent.getWeights());
                console.log("Last State:", this.lastState);
                console.log("Last Action:", this.lastAction);
                console.log("New State:", this.state);
                console.log("Latest Reward:", this.latestReward);
            }
            if (this.learn && this.started) {
                this.agent.update(
                    this.lastState,
                    this.lastAction,
                    this.state,
                    this.latestReward
                );
            }
            if (this.debug)
                console.log("New Weights:", this.agent.getWeights());
            this.started = true;
            this.lastState = this.state.copy();
            this.latestReward = 0;
            if (request.active) {
                if (!this.state.enemyPokemon) {
                    this.waitForSwitch = true;
                } else {
                    this.chooseAction();
                }
            } else if (request.forceSwitch) {
                this.chooseAction();
            }
        }
    }

    chooseAction() {
        try {
            const action = this.learn
                ? this.agent.getAction(this.state)
                : this.agent.computeActionFromQValues(this.state);
            this.lastAction = action;
            this.choose(action);
        } catch {
            console.log("Error occured while choosing action, defaulting");
            console.log(`Legal Actions: ${this.state.getLegalActions()}`);
            this.choose("default");
        }
    }
}

export default ApproximateQPlayer;
