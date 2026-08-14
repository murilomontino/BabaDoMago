import { filterPlayersBySearch } from "./player-search.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

const players = [
	{ display_name: "Vitinho" },
	{ display_name: "Murilo" },
	{ display_name: "José" },
];

const comma = filterPlayersBySearch(players, "vitinho, murilo");
check(comma.length, 2);
check(comma[0]?.display_name, "Vitinho");
check(comma[1]?.display_name, "Murilo");

const pasted = filterPlayersBySearch(players, "1. Vitinho ✅\n2. Murilo");
check(pasted.length, 2);
check(pasted[0]?.display_name, "Vitinho");
check(pasted[1]?.display_name, "Murilo");

const empty = filterPlayersBySearch(players, "  ,  ");
check(empty.length, 3);

const accent = filterPlayersBySearch(players, "jose");
check(accent.length, 1);
check(accent[0]?.display_name, "José");

const nicknamed = [
	{ display_name: "Murilo", nickname: "Vitinho" },
	{ display_name: "José", nickname: null },
];
const byNick = filterPlayersBySearch(nicknamed, "vitinho");
check(byNick.length, 1);
check(byNick[0]?.display_name, "Murilo");

const byLegal = filterPlayersBySearch(nicknamed, "murilo");
check(byLegal.length, 1);
check(byLegal[0]?.display_name, "Murilo");

console.log("player-search ok");
