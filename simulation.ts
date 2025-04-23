import { TeamGenerators } from "@pkmn/randoms";
import { BattleStreams, RandomPlayerAI, Teams } from "@pkmn/sim";
import BasicAIPlayer from "./basic_ai";
import BattleTracker from "./battle_tracker";
import { range } from "./request_utils";
import ApproximateQPlayer from "./reinforcement/approx_learn_environment";
import {
    PokemonBattleState,
    BasicPokemonFeatures,
    extractBasicFeatures,
} from "./reinforcement/approx_learn_features";
import ApproximateQAgent from "./reinforcement/learning_agents";

const q_agent = new ApproximateQAgent<
    PokemonBattleState,
    string,
    BasicPokemonFeatures
>(
    extractBasicFeatures,
    {
        expected_damage: 1,
        type_matchup_offensive: 0,
        type_matchup_defensive: 1,
    },
    0.2,
    1,
    0.0000001
);
// epsilon, gamma, alpha

/**
 * Runs 2 agents against each other once.
 * @param gameNum the index of the battle to run.
 * @param train Whether or not the approximate q-learning agent is being trained
 * @returns Promise<boolean> which resolves to whether or not p1 ("Player") won the game
 */
const runBattle = async (gameNum: number, train: boolean) => {
    Teams.setGeneratorFactory(TeamGenerators);

    const streams = BattleStreams.getPlayerStreams(
        new BattleStreams.BattleStream()
    );
    const spec = { formatid: "gen4customgame" };

    const p1spec = {
        name: "Player",
        team: Teams.pack(Teams.generate("gen4randombattle")),
    };
    const p2spec = {
        name: "Bot 2",
        team: Teams.pack(Teams.generate("gen4randombattle")),
    };

    const tracker = new BattleTracker(streams.omniscient, `Game ${gameNum}`);
    const p1 = new ApproximateQPlayer(streams.p1, q_agent, 1, tracker, train);
    // const p1 = new BasicAIPlayer(streams.p1, tracker, 1);
    const p2 = new RandomPlayerAI(streams.p2);

    void p1.start();
    void p2.start();

    void streams.omniscient.write(`>start ${JSON.stringify(spec)}
>player p1 ${JSON.stringify(p1spec)}
>player p2 ${JSON.stringify(p2spec)}`);

    await tracker.start();

    if (tracker.log) {
        tracker.writeToFile(`${gameNum}.txt`);
    }
    return tracker.winner === "Player";
};

/**
 * Performs runBattle several times, and prints out the winrate of player 1.
 * @param numTraining The number of training battles to run.
 * @param numTesting The number of testing battles to run.
 */
const runBattles = async (numTraining, numTesting) => {
    const trainingRuns = range(1, numTraining);
    const testingRuns = range(1, numTesting);
    const trainingWins: boolean[] = [];
    const testingWins: boolean[] = [];
    for (const train of trainingRuns) {
        trainingWins.push(await runBattle(train, true));
    }
    for (const test of testingRuns) {
        testingWins.push(await runBattle(test, true));
    }
    console.log(
        `${
            (trainingWins.reduce((a, b) => a + (b ? 1 : 0), 0) / numTraining) *
            100
        }% Training Winrate`
    );
    console.log(q_agent.getWeights());
    console.log(
        `${
            (testingWins.reduce((a, b) => a + (b ? 1 : 0), 0) / numTesting) *
            100
        }% Testing Winrate`
    );
    console.log();
};

runBattles(1000, 1000);
