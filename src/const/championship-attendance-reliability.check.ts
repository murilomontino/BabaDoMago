import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import { championshipAttendanceReliability } from "./championship-attendance-reliability.ts";
import { CHAMPIONSHIP_ROLE } from "./championship-role.ts";
import { PLAYER_RATING } from "./player-rating.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function player(id: number, name: string): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: name,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		rating: PLAYER_RATING.default,
		goalkeeper_rating: PLAYER_RATING.default,
		role: CHAMPIONSHIP_ROLE.member,
		is_goalkeeper: false,
		is_monthly: false,
		deleted_at: null,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
	};
}

function attendance(playerId: number, eventId: number) {
	return {
		id: playerId,
		event_id: eventId,
		player_id: playerId,
		display_name: "x",
		is_goalkeeper: false,
		event_date: "2026-01-01",
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		rating: 0,
		rating_delta: 0,
		goalkeeper_rating: 0,
		goalkeeper_rating_delta: 0,
		vote_rating_delta: 0,
		goalkeeper_vote_rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
	};
}

function rsvp(playerId: number, eventId: number, status: string) {
	return {
		id: playerId,
		event_id: eventId,
		player_id: playerId,
		status,
		updated_at: "2026-01-01T12:00:00.000Z",
	};
}

function eventRow(
	id: number,
	day: string,
	attendanceRows: ReturnType<typeof attendance>[],
	rsvps: ReturnType<typeof rsvp>[],
): ChampionshipEvent {
	return {
		id,
		championship_id: 1,
		starts_at: `${day}T22:00:00.000Z`,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: `${day}T23:00:00.000Z`,
		attendance: attendanceRows,
		rsvps,
		teams: [],
		matches: [],
	};
}

const ana = player(1, "Ana");
const bruno = player(2, "Bruno");
const caio = player(3, "Caio");

const rows = championshipAttendanceReliability(
	[ana, bruno, caio],
	[
		eventRow(
			1,
			"2026-01-01",
			[attendance(1, 1)],
			[rsvp(1, 1, "going"), rsvp(2, 1, "going"), rsvp(3, 1, "out")],
		),
		eventRow(
			2,
			"2026-01-08",
			[attendance(1, 2)],
			[rsvp(1, 2, "going"), rsvp(2, 2, "going")],
		),
	],
);

check(rows.length === 2, "only going players");
const brunoRow = rows.find((row) => row.player.id === 2);
check(brunoRow?.confirmed === 2, "bruno confirmed twice");
check(brunoRow?.attended === 0, "bruno never attended");
check(brunoRow?.noShows === 2, "bruno two no-shows");
check(brunoRow?.noShowStreak === 2, "bruno streak 2");
check(brunoRow?.rate === 0, "bruno rate 0");

const anaRow = rows.find((row) => row.player.id === 1);
check(anaRow?.noShows === 0, "ana no no-shows");
check(anaRow?.rate === 1, "ana always came");
check(anaRow?.noShowStreak === 0, "ana streak 0");

check(
	championshipAttendanceReliability(
		[caio],
		[eventRow(3, "2026-01-15", [], [rsvp(3, 3, "out")])],
	).length === 0,
	"out alone does not count",
);

console.log("championship-attendance-reliability.check.ts ok");
