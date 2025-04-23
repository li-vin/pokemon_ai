import { GenderName, Generations } from "@pkmn/data";
import { Dex } from "@pkmn/dex";
import { Generations as Gens, Pokemon } from "@smogon/calc";
import {
    average,
    createPokemonFromInfo,
    getPossibleMoves,
    getPossibleSwitches,
    parseActivePokemonInfo,
    parsePokemonInfoAtIndex,
    splitFirst,
} from "../request_utils";
import { calculate } from "@smogon/calc/dist/calc";
import { Move } from "@smogon/calc/dist/move";

export interface BasicPokemonFeatures {
    expected_damage: number;
    type_matchup_offensive: number;
    type_matchup_defensive: number;
}

export interface PokemonInfo {
    name: string;
    altName: string;
    curHP: number;
    level: number;
    gender: GenderName;
}

export class PokemonBattleState {
    enemyPokemon: PokemonInfo | undefined;
    myActivePokemon: PokemonInfo;
    request: any;

    getLegalActions(): string[] {
        const actions = getPossibleSwitches(this.request).map((s) => s.choice);
        if (this.request.active) {
            const moves = getPossibleMoves(this.request).map((m) => m.choice);
            return actions.concat(moves);
        }
        return actions;
    }

    copy(): PokemonBattleState {
        const newState = new PokemonBattleState();
        newState.enemyPokemon = this.enemyPokemon;
        newState.myActivePokemon = this.myActivePokemon;
        newState.request = this.request;
        return newState;
    }
}

export function extractBasicFeatures(
    state: PokemonBattleState,
    action: string
): BasicPokemonFeatures {
    const gens = new Generations(Dex);
    let damage = 0;
    let enemyPokemon = new Pokemon(gens.get(9), "Terapagos", {
        ability: "Tera Shell",
    });
    if (state.enemyPokemon) {
        enemyPokemon = createPokemonFromInfo(state.enemyPokemon);
    }
    const [move, target] = splitFirst(action, " ");
    if (!state.request) {
        console.log(state);
    }
    let activeInfo = parseActivePokemonInfo(state.request);

    if (move.startsWith("switch")) {
        activeInfo = parsePokemonInfoAtIndex(
            state.request,
            parseInt(target) - 1
        );
    }
    const myPokemon = createPokemonFromInfo(activeInfo);
    if (move.startsWith("move")) {
        if (!state.request.active || state.request.active.length < 1) {
            damage = 0;
        } else {
            let pkmnMove = "";
            try {
                pkmnMove =
                    state.request.active[0].moves[parseInt(target) - 1].move;
            } catch (err) {
                pkmnMove = state.request.active[0].moves[0].move;
            }
            if (pkmnMove.startsWith("Return")) pkmnMove = "Return";
            let acc = Dex.forGen(4).moves.get(pkmnMove).accuracy;
            if (pkmnMove.startsWith("Recharge")) acc = 0;
            if (typeof acc == "boolean") {
                acc = 100;
            }
            let rolls = calculate(
                Gens.get(4),
                myPokemon,
                enemyPokemon,
                new Move(Gens.get(4), pkmnMove)
            ).damage;
            if (Array.isArray(rolls)) {
                if (Array.isArray(rolls[0])) {
                    rolls = average(rolls.map((r) => average(r)));
                } else {
                    rolls = average(rolls as number[]);
                }
            }
            damage = (rolls * acc) / 100;
            if (isNaN(damage)) {
                throw new Error(
                    `Issue while calculating damage for move ${pkmnMove} with accuracy ${acc}`
                );
            }
        }
    }
    const myTypes = myPokemon.types;
    const enemyTypes = enemyPokemon.types;
    const defMatchup = enemyTypes.map((type) =>
        gens.get(4).types.totalEffectiveness(type, myTypes)
    );
    const offMatchup = myTypes.map((type) =>
        gens.get(4).types.totalEffectiveness(type, enemyTypes)
    );
    const defMatchupTotal = defMatchup.reduce((a, b) => a + b);
    const offMatchupTotal = offMatchup.reduce((a, b) => a + b);
    return {
        expected_damage: damage,
        type_matchup_defensive: defMatchupTotal,
        type_matchup_offensive: offMatchupTotal,
    };
}
