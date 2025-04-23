import { Streams } from "@pkmn/sim";
import { splitFirst } from "./request_utils";
import * as fs from "fs";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A class to track the winner of a battle, as well as log the battle if an
 * error occurs.
 */
class BattleTracker {
    readonly stream: Streams.ObjectReadWriteStream<string>;
    public winner: string;
    protected prefix: string;
    protected verbose: number;
    public log: boolean;
    protected logBuffer: string[];
    constructor(omniStream, logPrefix: string = "", verbose = 0) {
        this.stream = omniStream;
        this.prefix = logPrefix;
        this.verbose = verbose;
        this.log = false;
        this.logBuffer = [];
    }
    async start() {
        for await (const chunk of this.stream) {
            this.receive(chunk);
        }
    }
    receive(chunk) {
        for (const line of chunk.split("\n")) {
            const [action, rest] = splitFirst(line.slice(1), "|");
            switch (action) {
                case "move":
                case "switch":
                case "drag":
                case "faint":
                    if (this.verbose > 0) console.log(`${this.prefix}${line}`);
                    break;
                case "win":
                    const [_, winner] = splitFirst(line.slice(1), "|");
                    console.log(`${this.prefix}${line}`);
                    this.winner = winner;
                    break;
            }
            // console.log(line);
        }
        this.logBuffer.push(chunk);
    }

    setLogFlag(message) {
        console.log(
            `Error occured in ${this.prefix}. Battlestream will be logged.`
        );
        if (message) {
            this.logBuffer.push(message);
        }
        this.log = true;
    }

    writeToFile(fname) {
        console.log(`Logging ${this.prefix}`);
        const path = join(__dirname, "logs/");
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        const writer = fs.createWriteStream(join(path, fname), {
            flags: "w",
        });
        writer.write(this.logBuffer.join("\n"));
    }
}

export default BattleTracker;
