import { BattleStreams, PRNG } from "@pkmn/sim";
import * as readline from "readline/promises";
import { splitFirst } from "./request_utils";

/**
 * A barebones implementation to support a human player.
 */
class HumanPlayer extends BattleStreams.BattlePlayer {
    constructor(playerStream, debug = false) {
        super(playerStream, debug);
    }

    receive(chunk) {
        for (const line of chunk.split("\n")) {
            this.receiveLine(line);
        }
    }

    receiveLine(line) {
        if (this.debug) console.log(line);
        if (!line.startsWith("|")) return;
        const [cmd, rest] = splitFirst(line.slice(1), "|");
        if (cmd === "switch") {
            const [user, details] = splitFirst(rest, "|");
            if (user.startsWith("p2a")) {
                console.log(details);
            }
        }
        if (cmd === "request") return this.receiveRequest(JSON.parse(rest));
        if (cmd === "error") return this.receiveError(new Error(rest));
        this.log.push(line);
    }

    receiveError(error) {
        // If we made an unavailable choice we will receive a followup request to
        // allow us the opportunity to correct our decision.
        if (error.message.startsWith("[Unavailable choice]")) return;
        throw error;
    }

    receiveRequest(request) {
        console.log(request);
        if (request.wait) {
        } else if (request.active) {
            let pokemon = request.side.pokemon;
            const active = request.active[0];
            const possibleMoves = active.moves;
            let canMove = possibleMoves
                .filter((p) => !p.disabled)
                .map((p, index) => ({
                    slot: index + 1,
                    move: p.move,
                    target: p.target,
                }));
            const filtered = canMove.filter((m) => m.target !== "adjacentAlly");
            canMove = filtered.length ? filtered : canMove;
            const moves = canMove.map((m) => {
                let move = `move ${m.slot}`;
                return { choice: move, move: m };
            });
            const canSwitch = [1, 2, 3, 4, 5, 6]
                .filter(
                    (p) =>
                        p &&
                        !pokemon[p - 1].active &&
                        !pokemon[p - 1].condition.endsWith(` fnt`)
                )
                .map((p) => ({
                    choice: `switch ${p}`,
                    target: pokemon[p - 1],
                }));
            const switches = active.trapped ? [] : canSwitch;

            // console.log("VALID MOVES:", moves);
            // console.log("VALID SWITCHES:", switches);
            this.makeChoice();
        } else if (request.forceSwitch) {
            // console.log(request.forceSwitch);
            this.makeChoice();
        }
    }

    async makeChoice() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const choice = await rl.question(``, {});

        this.choose(choice);
        rl.close();
    }
    chooseTeamPreview(team) {
        // console.log(team);
        return `default`;
    }
    chooseMove(active, moves) {
        // console.log(active, moves);
        return this.makeChoice();
    }
    chooseSwitch(active, switches) {
        // console.log(active, switches);
        return this.makeChoice();
    }
}

export default HumanPlayer;
