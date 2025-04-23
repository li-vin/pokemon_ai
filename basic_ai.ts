import { BattleStreams, Dex, GenderName, Streams } from "@pkmn/sim";
import {
    average,
    getPossibleMoves,
    parseActivePokemon,
    parseSwitchToPokemon,
    splitFirst,
} from "./request_utils";
import { GenerationNum, Generations, Pokemon } from "@smogon/calc";
import { calculate } from "@smogon/calc/dist/calc";
import { Move } from "@smogon/calc/dist/move";
import { error } from "console";

/**simple ai that chooses the move with the highest damage calc.
 * only reads info on the active opponent pokemon.
 * when forced to switch, chooses default.
 */
class BasicAIPlayer extends BattleStreams.BattlePlayer {
    // readonly enemyStream: Streams.ObjectReadWriteStream<string>;
    enemyPokemon: any;
    waitForSwitch: boolean;
    activeRequest: any;
    enemyPlayer: string;
    player: number;
    tracker: any;

    constructor(
        playerStream,
        tracker: any = undefined,
        player = 1,
        debug = false
    ) {
        super(playerStream, debug);
        this.waitForSwitch = false;
        this.player = player;
        this.enemyPlayer = `p${player === 1 ? 2 : 1}`;
        this.tracker = tracker;
    }

    receiveLine(line) {
        if (this.debug) console.log(`DEBUG${line}`);
        if (!line.startsWith("|")) return;
        const [cmd, rest] = splitFirst(line.slice(1), "|");
        switch (cmd) {
            case "faint":
                const [faintUser, _d] = splitFirst(rest, "|");
                if (faintUser.startsWith(this.enemyPlayer)) {
                    this.enemyPokemon = undefined;
                    this.waitForSwitch = true;
                }
                break;
            case "switch":
            case "drag":
                const [switchUser, _] = splitFirst(rest, "|");
                if (switchUser.startsWith(this.enemyPlayer)) {
                    this.enemyPokemon = parseSwitchToPokemon(rest);
                    if (this.waitForSwitch) {
                        this.chooseMove(this.activeRequest);
                    }
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
        if (this.tracker) {
            this.tracker.setLogFlag(
                `############################\nPlayer ${this.player} Error: ${error.message}.\n`
            );
        }
    }

    receiveRequest(request) {
        if (!request.wait) {
            if (request.teamPreview) {
                this.choose("default");
            } else if (request.active) {
                if (!this.enemyPokemon) {
                    this.waitForSwitch = true;
                    this.activeRequest = request;
                } else {
                    this.chooseMove(request);
                }
            } else if (request.forceSwitch) {
                this.choose("default");
            }
        }
    }

    chooseMove(request) {
        const validMoves = getPossibleMoves(request);
        const calcs = validMoves.map((move) => {
            let acc = Dex.forGen(4).moves.get(move.move.move).accuracy;
            const activePokemon = parseActivePokemon(request);
            if (typeof acc == "boolean") {
                acc = 100;
            }
            let rolls = calculate(
                Generations.get(4),
                activePokemon,
                this.enemyPokemon,
                new Move(Generations.get(4), move.move.move)
            ).damage;
            if (Array.isArray(rolls)) {
                if (Array.isArray(rolls[0])) {
                    rolls = average(rolls.map((r) => average(r)));
                } else {
                    rolls = average(rolls as number[]);
                }
            }
            return { choice: move.choice, dmg: (rolls * acc) / 100 };
        });
        let bestChoice = "default";
        let dmg = -1;
        for (const i in calcs) {
            if (calcs[i].dmg > dmg) {
                dmg = calcs[i].dmg;
                bestChoice = calcs[i].choice;
            }
        }
        this.waitForSwitch = false;
        this.choose(bestChoice);
    }
}

export default BasicAIPlayer;
