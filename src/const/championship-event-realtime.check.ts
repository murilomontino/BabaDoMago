import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	EVENT_REALTIME_CHANGE,
	EVENT_REALTIME_TABLE,
	patchChampionshipEventRealtime,
} from "./championship-event-realtime.ts";

function check(actual: unknown, expected: unknown, message: string): void {
	if (actual !== expected) {
		throw new Error(`${message}: ${String(actual)} !== ${String(expected)}`);
	}
}

const event: ChampionshipEvent = {
	id: 1,
	championship_id: 1,
	starts_at: "2026-08-20T12:00:00.000Z",
	players_per_team: 5,
	skip_guest_goalkeeper_matches: false,
	ended_at: null,
	attendance: [],
	rsvps: [],
	teams: [],
	matches: [
		{
			id: 7,
			event_id: 1,
			team_a_id: 10,
			team_b_id: 20,
			created_at: "2026-08-20T12:00:00.000Z",
			ended_at: null,
			winner_team_id: null,
			duration_seconds: 420,
			started_at: null,
			paused_at: null,
			pause_accumulated_seconds: 0,
			players: [],
			goals: [],
		},
	],
};

const withGoal = patchChampionshipEventRealtime(
	event,
	EVENT_REALTIME_TABLE.goals,
	EVENT_REALTIME_CHANGE.insert,
	{
		id: 3,
		match_id: 7,
		event_id: 1,
		scorer_player_id: 101,
		assist_player_id: null,
		is_own_goal: false,
		elapsed_seconds: 12,
		created_at: "2026-08-20T12:00:12.000Z",
	},
);
check(withGoal.matches[0]?.goals.length, 1, "inserts goal on match");
check(withGoal.matches[0]?.goals[0]?.scorer_player_id, 101, "goal scorer");

const withoutGoal = patchChampionshipEventRealtime(
	withGoal,
	EVENT_REALTIME_TABLE.goals,
	EVENT_REALTIME_CHANGE.delete,
	{ id: 3, match_id: 7 },
);
check(withoutGoal.matches[0]?.goals.length, 0, "deletes goal");

console.log("championship-event-realtime ok");
