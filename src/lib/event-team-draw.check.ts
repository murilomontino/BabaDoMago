import { drawBalancedEventTeams } from "../const/championship-event.ts";
import { mulberry32 } from "./prng.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

const players = [
	{ id: 1, rating: 10 },
	{ id: 2, rating: 9 },
	{ id: 3, rating: 8 },
	{ id: 4, rating: 7 },
	{ id: 5, rating: 6 },
	{ id: 6, rating: 5 },
	{ id: 7, rating: 4 },
	{ id: 8, rating: 3 },
] as const;

function stringify(teams: ReturnType<typeof drawBalancedEventTeams>): string {
	return teams
		.map((team) => `${team.playerIds.join(",")}|gk=${team.goalkeeperId}`)
		.join(";");
}

const first = drawBalancedEventTeams(players, 4, mulberry32(12345));
const second = drawBalancedEventTeams(players, 4, mulberry32(12345));
check(
	stringify(first) === stringify(second),
	"mesma seed + mesma entrada deve reproduzir o sorteio",
);

const seeds = [1, 2, 3, 4, 5, 42, 99, 12345];
const outputs = new Set(
	seeds.map((seed) =>
		stringify(drawBalancedEventTeams(players, 4, mulberry32(seed))),
	),
);
check(
	outputs.size > 1,
	"seeds diferentes devem gerar ao menos uma particao diferente",
);

console.log("event-team-draw ok");
