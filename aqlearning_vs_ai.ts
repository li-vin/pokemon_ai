import { Dex, BattleStreams, RandomPlayerAI, Teams } from "@pkmn/sim";
import { TeamGenerators } from "@pkmn/randoms";
import HumanPlayer from "./human-player";
import BasicAIPlayer from "./basic_ai";
import ApproximateQPlayer from "./reinforcement/approx_learn_environment";
import {
    BasicPokemonFeatures,
    extractBasicFeatures,
    PokemonBattleState,
} from "./reinforcement/approx_learn_features";
import ApproximateQAgent from "./reinforcement/learning_agents";

// Runs a single game with an approximate Q-learning agent against the basic-ai

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

const q_agent = new ApproximateQAgent<
    PokemonBattleState,
    string,
    BasicPokemonFeatures
>(
    extractBasicFeatures,
    {
        expected_damage: 1,
        type_matchup_offensive: 1,
        type_matchup_defensive: 1,
    },
    1,
    1,
    0.00001
);
const p1 = new ApproximateQPlayer(
    streams.p1,
    q_agent,
    1,
    undefined,
    true,
    true
);
const p2 = new RandomPlayerAI(streams.p2);

void p1.start();
void p2.start();

void (async () => {
    for await (const chunk of streams.omniscient) {
        console.log("#################");
        console.log(chunk);
    }

    console.log(q_agent.getWeights());
})();

void streams.omniscient.write(`>start ${JSON.stringify(spec)}
>player p1 ${JSON.stringify(p1spec)}
>player p2 ${JSON.stringify(p2spec)}`);
