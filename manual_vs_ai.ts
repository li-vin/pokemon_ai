import { Dex, BattleStreams, RandomPlayerAI, Teams } from "@pkmn/sim";
import { TeamGenerators } from "@pkmn/randoms";
import HumanPlayer from "./human-player";
import BasicAIPlayer from "./basic_ai";

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

const p1 = new HumanPlayer(streams.p1, true);
const p2 = new RandomPlayerAI(streams.p2);

void p1.start();
void p2.start();

// void (async () => {
//     for await (const chunk of streams.omniscient) {
//         console.log("#################");
//         console.log(chunk);
//     }
// })();

void streams.omniscient.write(`>start ${JSON.stringify(spec)}
>player p1 ${JSON.stringify(p1spec)}
>player p2 ${JSON.stringify(p2spec)}`);
