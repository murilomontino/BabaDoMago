import type { ChampionshipPlayer } from "../types/championship.ts";
import {
	eventAttendanceDisplayRating,
	fallbackRosterPlayer,
	playersFromEventAttendance,
	resolveEventPlayers,
	resolveRosterPlayer,
} from "./championship-event-roster.ts";
import { CHAMPIONSHIP_ROLE } from "./championship-role.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

function rosterPlayer(
	id: number,
	displayName: string,
	rating = 5,
): ChampionshipPlayer {
	return {
		...fallbackRosterPlayer(id, displayName),
		championship_id: 1,
		rating,
		role: CHAMPIONSHIP_ROLE.member,
	};
}

const ana = rosterPlayer(1, "Ana", 8);
const byId = new Map([[ana.id, ana]]);

check(resolveRosterPlayer(1, "X", byId).display_name, "Ana");
check(resolveRosterPlayer(1, "X", byId).rating, 8);
check(resolveRosterPlayer(9, "Ghost", byId).display_name, "Ghost");
check(resolveRosterPlayer(9, "Ghost", byId).id, 9);
check(resolveRosterPlayer(9, "Ghost", byId).rating, 0);
check(fallbackRosterPlayer(3, "Bia").role, CHAMPIONSHIP_ROLE.member);
check(
	resolveEventPlayers([{ player_id: 1, display_name: "X" }], byId)[0]
		?.display_name,
	"Ana",
);
check(
	resolveEventPlayers([{ player_id: 9, display_name: "Ghost" }], byId)[0]
		?.display_name,
	"Ghost",
);

const fromAttendance = playersFromEventAttendance(
	[
		{
			player_id: 1,
			display_name: "X",
			goals: 2,
			assists: 1,
			assisted_goals: 3,
			own_goals: 0,
			wins: 4,
			losses: 1,
			draws: 0,
			matches: 5,
			is_mvp: true,
			rating: 3.5,
			rating_delta: 0.5,
			vote_rating_delta: 0.5,
		},
	],
	byId,
)[0];
check(eventAttendanceDisplayRating(true, 8, 3.5), 8);
check(eventAttendanceDisplayRating(false, 0, 2.7), 2.7);
check(fromAttendance?.display_name, "Ana");
check(fromAttendance?.goals, 2);
check(fromAttendance?.assists, 1);
check(fromAttendance?.assisted_goals, 3);
check(fromAttendance?.mvps, 1);
check(fromAttendance?.rating, 8);
check(fromAttendance?.ratingEvolution, 1);

const missing = playersFromEventAttendance(
	[
		{
			player_id: 9,
			display_name: "Ghost",
			goals: 0,
			assists: 0,
			assisted_goals: 0,
			own_goals: 0,
			wins: 0,
			losses: 0,
			draws: 0,
			matches: 0,
			is_mvp: false,
			rating: 2.7,
		},
	],
	byId,
)[0];
check(missing?.display_name, "Ghost");
check(missing?.mvps, 0);
check(missing?.rating, 2.7);

console.log("championship-event-roster ok");
