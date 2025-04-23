import { GenderName } from "@pkmn/sim";
import { Generations, Pokemon } from "@smogon/calc";
import { PokemonInfo } from "./reinforcement/approx_learn_features";

/** Miscelaneous util functions for parsing the simulator requests,
 *  calculating damage, creating Pokemon, etc.
 *
 */

function range(start, end, step = 1) {
    if (end === undefined) {
        end = start;
        start = 0;
    }
    const result: number[] = [];
    for (; start <= end; start += step) {
        result.push(start);
    }
    return result;
}

function average(array: number[]) {
    const sum = array.reduce((a, b) => a + b);
    return sum / array.length;
}

function getPossibleMoves(request: any) {
    const active = request.active[0];
    const possibleMoves = active.moves;
    let canMove = range(1, possibleMoves.length)
        .filter((j) => !possibleMoves[j - 1].disabled)
        .map((j) => ({
            slot: j,
            move: possibleMoves[j - 1].move,
            target: possibleMoves[j - 1].target,
            zMove: false,
        }));
    const filtered = canMove.filter((m) => m.target !== "adjacentAlly");
    canMove = filtered.length ? filtered : canMove;
    const moves = canMove.map((m) => {
        return { choice: `move ${m.slot}`, move: m };
    });
    return moves;
}

/**
 * Parses an active request for the users current active pokemon
 * @param request the request string to be parsed
 * @returns a Pokemon object
 */
function parseActivePokemon(request: any) {
    const info = parseActivePokemonInfo(request);
    return createPokemonFromInfo(info);
}

function parseActivePokemonInfo(request: any) {
    let pokemon = request.side.pokemon;
    const active = pokemon.filter((p) => p.active)[0];
    const altName = active.ident.split(":")[1].slice(1);
    const detail = active.details.split(",");
    const name = detail[0];
    const curHP = parseInt(active.condition);
    let level = 100;
    let gender: GenderName = "N";
    let i = 1;
    if (detail[i] && detail[i].length > 1) {
        level = parseInt(detail[1].slice(2));
        i++;
    }
    if (detail[i] && detail[i].length === 1) {
        gender = detail[1] === "M" ? "M" : "F";
    }
    return { name, altName, level, gender, curHP };
}

function parsePokemonInfoAtIndex(request: any, index: number): PokemonInfo {
    let pokemon = request.side.pokemon[index];
    const altName = pokemon.ident.split(":")[1].slice(1);
    const detail = pokemon.details.split(",");
    const name = detail[0];
    const curHP = parseInt(pokemon.condition);
    let level = 100;
    let gender: GenderName = "N";
    let i = 1;
    if (detail[i] && detail[i].length > 1) {
        level = parseInt(detail[1].slice(2));
        i++;
    }
    if (detail[i] && detail[i].length === 1) {
        gender = detail[1] === "M" ? "M" : "F";
    }
    return { name, altName, level, gender, curHP };
}

function getPossibleSwitches(request: any) {
    let pokemon = request.side.pokemon;
    const active = request.active ? request.active[0] : false;
    const canSwitch = [1, 2, 3, 4, 5, 6]
        .filter(
            (p) =>
                pokemon[p - 1] &&
                !pokemon[p - 1].active &&
                !pokemon[p - 1].condition.endsWith(` fnt`)
        )
        .map((p) => ({
            choice: `switch ${p}`,
            target: pokemon[p - 1],
        }));
    const switches = active.trapped ? [] : canSwitch;
    return switches;
}

function splitFirst(str: string, delimiter: string, limit = 1) {
    const splitStr: string[] = [];
    while (splitStr.length < limit) {
        const delimiterIndex = str.indexOf(delimiter);
        if (delimiterIndex >= 0) {
            splitStr.push(str.slice(0, delimiterIndex));
            str = str.slice(delimiterIndex + delimiter.length);
        } else {
            splitStr.push(str);
            str = "";
        }
    }
    splitStr.push(str);
    return splitStr;
}

/**
 * Parses a `|switch|POKEMON|DETAILS|HP STATUS` or
 * `|drag|POKEMON|DETAILS|HP STATUS` message for the opponents pokemon.
 * @param message the message string to be parsed
 * @returns An pokemon object
 */
function parseSwitchToPokemon(message: string) {
    const info = parseSwitchToPokemonInfo(message);
    return createPokemonFromInfo(info);
}

function parseSwitchToPokemonInfo(message: string): PokemonInfo {
    const [pokemon, details, hp] = message.split("|");
    const altName = pokemon.split(":")[1].slice(1);
    const detail = details.split(",");
    const name = detail[0];
    const curHP = parseInt(hp);
    let level = 100;
    let gender: GenderName = "N";
    let i = 1;
    if (detail[i] && detail[i].length > 1) {
        level = parseInt(detail[1].slice(2));
        i++;
    }
    if (detail[i] && detail[i].length === 1) {
        gender = detail[1] === "M" ? "M" : "F";
    }
    return { name, altName, level, gender, curHP };
}

function createPokemonFromInfo(info: PokemonInfo) {
    const gen = Generations.get(4);
    const options = {
        gender: info.gender,
        level: info.level,
        curHP: info.curHP,
    };
    try {
        return new Pokemon(gen, info.name, options);
    } catch (err) {
        return new Pokemon(gen, info.altName, options);
    }
}

export {
    average,
    range,
    splitFirst,
    parseActivePokemon,
    parseActivePokemonInfo,
    parsePokemonInfoAtIndex,
    getPossibleMoves,
    getPossibleSwitches,
    parseSwitchToPokemon,
    parseSwitchToPokemonInfo,
    createPokemonFromInfo,
};
