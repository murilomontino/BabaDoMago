import { drawBalancedEventTeams } from "../const/championship-event.ts";
import {
	drawPotEventTeams,
	EVENT_TEAM_POT_DRAW_ALGORITHM_VERSION,
} from "../const/event-team-pot-draw.ts";
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

const potPlayers = Array.from({ length: 20 }, (_, index) => ({
	id: index + 1,
	rating: 20 - index,
}));
const potSeed = 777;
const potGenerated = drawPotEventTeams(potPlayers, 5, mulberry32(potSeed));
const potReplayed = replayEventDraw({
	seed: potSeed,
	algorithmVersion: EVENT_TEAM_POT_DRAW_ALGORITHM_VERSION,
	inputSnapshot: {
		players: potPlayers,
		playersPerTeam: 5,
		volunteerIds: [],
	},
	outputSnapshot: {
		teams: potGenerated.map((team) => ({
			playerIds: [...team.playerIds],
			goalkeeperId: team.goalkeeperId,
		})),
	},
});
check(
	potReplayed.matchesSavedOutput,
	"replay v2 com mesma seed deve bater com output salvo",
);

let unsupported = false;
try {
	replayEventDraw({
		...auditPayload,
		algorithmVersion: 99,
	});
} catch {
	unsupported = true;
}
check(unsupported, "versao desconhecida deve falhar");

console.log("event-team-draw-replay ok");
