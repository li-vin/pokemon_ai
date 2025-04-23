import { Dex, BattleStreams, RandomPlayerAI, Teams } from "@pkmn/sim";
import { TeamGenerators } from "@pkmn/randoms";

Teams.setGeneratorFactory(TeamGenerators);

const streams = BattleStreams.getPlayerStreams(
    new BattleStreams.BattleStream()
);
const spec = { formatid: "gen7customgame" };

const p1spec = {
    name: "Bot 1",
    team: Teams.pack(Teams.generate("gen7randombattle")),
};
const p2spec = {
    name: "Bot 2",
    team: Teams.pack(Teams.generate("gen7randombattle")),
};

const p1 = new RandomPlayerAI(streams.p1);
const p2 = new RandomPlayerAI(streams.p2);

// void p1.start();
// void p2.start();

let acc = Dex.forGen(4).moves.get("Return");
console.log(acc);

// void (async () => {
//     for await (const chunk of streams.omniscient) {
//         console.log("#################");
//         console.log(chunk);
//     }
// })();

// void streams.omniscient.write(`>start ${JSON.stringify(spec)}
// >player p1 ${JSON.stringify(p1spec)}
// >player p2 ${JSON.stringify(p2spec)}`);
