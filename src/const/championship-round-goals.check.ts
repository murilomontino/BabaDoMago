import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	championshipRoundGoals,
	championshipRoundGoalsChart,
	formatRoundGoalsKpi,
} from "./championship-round-goals.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function goal(id: number, matchId: number, eventId: number) {
	return {
		id,
		match_id: matchId,
		event_id: eventId,
		scorer_player_id: 1,
		assist_player_id: null,
		is_own_goal: false,
		elapsed_seconds: 60,
		created_at: "2026-01-01T22:05:00.000Z",
	};
}

function match(
	id: number,
	eventId: number,
	goalCount: number,
	ended: boolean,
) {
	return {
		id,
		event_id: eventId,
		team_a_id: 1,
		team_b_id: 2,
		created_at: "2026-01-01T22:00:00.000Z",
		ended_at: ended ? "2026-01-01T23:00:00.000Z" : null,
		winner_team_id: 1,
		duration_seconds: 600,
		started_at: "2026-01-01T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		players: [],
		goals: Array.from({ length: goalCount }, (_, index) =>
			goal(index + 1, id, eventId),
		),
	};
}

function eventRow(
	id: number,
	day: string,
	matches: ReturnType<typeof match>[],
): ChampionshipEvent {
	return {
		id,
		championship_id: 1,
		starts_at: `${day}T22:00:00.000Z`,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: `${day}T23:00:00.000Z`,
		attendance: [],
		rsvps: [],
		teams: [],
		matches,
	};
}

const summary = championshipRoundGoals([
	eventRow(1, "2026-01-01", [match(1, 1, 3, true), match(2, 1, 5, true)]),
	eventRow(2, "2026-01-08", [match(3, 2, 0, true)]),
	eventRow(3, "2026-01-15", [match(4, 3, 2, false)]),
]);

check(summary.events === 2, "two ended with matches");
check(summary.rows[0]?.totalGoals === 8, "sum goals in round");
check(summary.rows[1]?.totalGoals === 0, "zero goals round");
check(formatRoundGoalsKpi(summary) === "4.0", "average total");

const chart = championshipRoundGoalsChart(summary);
check(chart.length === 2, "chart points");
check(chart[0]?.value === 8, "first chart value");

console.log("championship-round-goals.check.ts ok");
