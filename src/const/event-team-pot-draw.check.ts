import { mulberry32 } from "../lib/prng.ts";
import {
	validateEventTeams,
	validateTeamsInAttendance,
} from "./championship-event.ts";
import {
	EVENT_DRAW_REVEAL_LABEL,
	EVENT_DRAW_REVEAL_PHASE,
} from "./event-draw-reveal.ts";
import {
	builderTeamsFromPotDrafts,
	drawPotEventTeams,
	EVENT_POT_DRAW_LABEL,
	EVENT_POT_DRAW_STAGE,
	EVENT_TEAM_POT_DRAW_ALGORITHM_VERSION,
	eventPotDrawAdvanceOverride,
	eventPotDrawCeremonyCards,
	eventPotDrawCeremonyTitle,
	eventPotDrawIsPotsStage,
	eventPotDrawPots,
	eventPotDrawPotsComplete,
	eventPotDrawPotTitle,
	eventPotDrawRevealPhase,
	eventPotDrawShowsPosition,
	eventPotDrawVisiblePots,
} from "./event-team-pot-draw.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

function stringify(teams: ReturnType<typeof drawPotEventTeams>): string {
	return teams
		.map((team) => `${team.playerIds.join(",")}|gk=${team.goalkeeperId}`)
		.join(";");
}

const twenty = Array.from({ length: 20 }, (_, index) => ({
	id: index + 1,
	rating: 20 - index,
}));

check(EVENT_TEAM_POT_DRAW_ALGORITHM_VERSION, 2);

const identity = drawPotEventTeams(twenty, 5, () => 0.999);
check(identity.length, 4);
check(String(identity[0]?.playerIds), "1,5,9,13,17");
check(String(identity[1]?.playerIds), "2,6,10,14,18");
check(String(identity[2]?.playerIds), "3,7,11,15,19");
check(String(identity[3]?.playerIds), "4,8,12,16,20");
check(identity[0]?.goalkeeperId, 1);
check(
	validateEventTeams(identity, 5) ??
		validateTeamsInAttendance(
			identity,
			twenty.map((player) => player.id),
		),
	null,
);

const heads = new Set(
	identity.map((team) => team.playerIds[0]).filter((id) => id !== undefined),
);
check(String([...heads].sort((left, right) => left - right)), "1,2,3,4");

const first = drawPotEventTeams(twenty, 5, mulberry32(12345));
const second = drawPotEventTeams(twenty, 5, mulberry32(12345));
check(stringify(first), stringify(second));

const leftoverPlayers = twenty.slice(0, 18);
const leftover = drawPotEventTeams(leftoverPlayers, 5, () => 0.999);
check(leftover.length, 4);
check(String(leftover[0]?.playerIds), "1,5,9,13,17");
check(String(leftover[1]?.playerIds), "2,6,10,14,18");
check(String(leftover[2]?.playerIds), "3,7,11,15");
check(String(leftover[3]?.playerIds), "4,8,12,16");

const volunteer = drawPotEventTeams(twenty, 5, () => 0.999, [17]);
check(volunteer[0]?.goalkeeperId, 17);
check(volunteer[1]?.goalkeeperId, 2);

const cards = builderTeamsFromPotDrafts(identity, 5);
check(cards[0]?.slots[0], "1");
check(cards[0]?.slots[1], "5");

const pots = eventPotDrawPots(twenty, 5, () => 0.999);
check(pots.length, 5);
check(String(pots[0]), "1,2,3,4");
check(String(pots[1]), "5,6,7,8");
check(eventPotDrawPotTitle(0), "Cabeças de chave");
check(eventPotDrawPotTitle(1), "Pote 2");
check(String(eventPotDrawVisiblePots(pots, 1)[0]), "1,2,3,4");
check(eventPotDrawPotsComplete(5, 5), true);
check(eventPotDrawPotsComplete(4, 5), false);
check(EVENT_POT_DRAW_LABEL.potsTitle, "Potes");
check(eventPotDrawCeremonyTitle(EVENT_POT_DRAW_STAGE.pots), "Potes");
check(
	eventPotDrawCeremonyTitle(EVENT_POT_DRAW_STAGE.teams),
	EVENT_DRAW_REVEAL_LABEL.potTitle,
);
check(eventPotDrawIsPotsStage(EVENT_POT_DRAW_STAGE.pots), true);
check(eventPotDrawIsPotsStage(EVENT_POT_DRAW_STAGE.teams), false);
check(eventPotDrawShowsPosition(EVENT_POT_DRAW_STAGE.pots), false);
check(eventPotDrawShowsPosition(EVENT_POT_DRAW_STAGE.teams), true);
check(eventPotDrawAdvanceOverride(EVENT_POT_DRAW_STAGE.pots), true);
check(eventPotDrawAdvanceOverride(EVENT_POT_DRAW_STAGE.teams), undefined);
check(
	eventPotDrawRevealPhase(EVENT_POT_DRAW_STAGE.pots, 0, 0, 20),
	EVENT_DRAW_REVEAL_PHASE.poster,
);
check(
	eventPotDrawRevealPhase(EVENT_POT_DRAW_STAGE.pots, 5, 20, 20),
	EVENT_DRAW_REVEAL_PHASE.playing,
);

const potShare = [
	{
		title: "Cabeças de chave",
		color: null,
		players: [
			{ id: 1, number: 1, name: "A", rating: 5, avatarUrl: null },
			{ id: 2, number: 2, name: "B", rating: 4, avatarUrl: null },
		],
	},
	{
		title: "Pote 2",
		color: null,
		players: [{ id: 3, number: 1, name: "C", rating: 3, avatarUrl: null }],
	},
];
const teamShare = [
	{
		title: "Time 1",
		color: null,
		players: [{ id: 1, number: 1, name: "A", rating: 5, avatarUrl: null }],
	},
];
check(
	eventPotDrawCeremonyCards(EVENT_POT_DRAW_STAGE.pots, potShare, 1, teamShare)
		.length,
	1,
);
check(
	eventPotDrawCeremonyCards(
		EVENT_POT_DRAW_STAGE.pots,
		potShare,
		1,
		teamShare,
	)[0]?.players.length,
	2,
);
check(
	eventPotDrawCeremonyCards(
		EVENT_POT_DRAW_STAGE.teams,
		potShare,
		1,
		teamShare,
	)[0]?.title,
	"Time 1",
);

console.log("event-team-pot-draw ok");
