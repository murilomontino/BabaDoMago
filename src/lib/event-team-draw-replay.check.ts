import { drawBalancedEventTeams } from "../const/championship-event.ts";
import { replayEventDraw } from "./event-team-draw-replay.ts";
import { mulberry32 } from "./prng.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

const players = [
	{ id: 10, rating: 9 },
	{ id: 20, rating: 8 },
	{ id: 30, rating: 7 },
	{ id: 40, rating: 6 },
] as const;

const seed = 424242;
const generated = drawBalancedEventTeams(players, 2, mulberry32(seed));

const auditPayload = {
	seed,
	algorithmVersion: 1,
	inputSnapshot: {
		players: [...players],
		playersPerTeam: 2,
		volunteerIds: [],
	},
	outputSnapshot: {
		teams: generated.map((t) => ({
			playerIds: [...t.playerIds],
			goalkeeperId: t.goalkeeperId,
		})),
	},
};

const replayed = replayEventDraw(auditPayload);
check(
	replayed.matchesSavedOutput,
	"replay com mesma seed deve bater 100% com output salvo",
);
check(
	replayed.teams.length === generated.length,
	"quantidade de times deve bater",
);

const tamperedAudit = {
	...auditPayload,
	outputSnapshot: {
		teams: generated.map((t) => ({
			playerIds: [...t.playerIds].reverse(),
			goalkeeperId: t.goalkeeperId,
		})),
	},
};
const tamperedReplayed = replayEventDraw(tamperedAudit);
check(
	!tamperedReplayed.matchesSavedOutput,
	"se output salvo foi alterado, matchesSavedOutput deve ser falso",
);

console.log("event-team-draw-replay ok");
