import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	championshipEventHealth,
	championshipEventHealthChart,
	EVENT_HEALTH_METRIC,
} from "./championship-event-health.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function eventRow(
	id: number,
	day: string,
	winnerTeamId: number,
	goalCount: number,
): ChampionshipEvent {
	const goals = Array.from({ length: goalCount }, (_, index) => ({
		id: index + 1,
		match_id: id,
		event_id: id,
		scorer_player_id: 1,
		assist_player_id: null,
		is_own_goal: false,
		elapsed_seconds: 60,
		created_at: `${day}T22:05:00.000Z`,
	}));

	return {
		id,
		championship_id: 1,
		starts_at: `${day}T22:00:00.000Z`,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: `${day}T23:00:00.000Z`,
		attendance: [
			{
				id: 1,
				event_id: id,
				player_id: 1,
				display_name: "Ana",
				is_goalkeeper: false,
				event_date: day,
				goals: 0,
				assists: 0,
				assisted_goals: 0,
				own_goals: 0,
				wins: 1,
				losses: 0,
				draws: 0,
				matches: 1,
				rating: 5,
				rating_delta: 0,
				vote_rating_delta: 0,
				is_mvp: false,
				mvp_overridden: false,
			},
			{
				id: 2,
				event_id: id,
				player_id: 2,
				display_name: "Bruno",
				is_goalkeeper: false,
				event_date: day,
				goals: 0,
				assists: 0,
				assisted_goals: 0,
				own_goals: 0,
				wins: 0,
				losses: 1,
				draws: 0,
				matches: 1,
				rating: 3,
				rating_delta: 0,
				vote_rating_delta: 0,
				is_mvp: false,
				mvp_overridden: false,
			},
		],
		rsvps: [],
		teams: [
			{
				id: 10,
				event_id: id,
				color: EVENT_TEAM_COLOR.white,
				sort_order: 0,
				is_active: true,
				template_player_ids: [],
				template_goalkeeper_id: 0,
				players: [
					{
						id: 1,
						event_id: id,
						team_id: 10,
						player_id: 1,
						display_name: "Ana",
						is_goalkeeper: false,
					},
				],
			},
			{
				id: 20,
				event_id: id,
				color: EVENT_TEAM_COLOR.black,
				sort_order: 1,
				is_active: true,
				template_player_ids: [],
				template_goalkeeper_id: 0,
				players: [
					{
						id: 2,
						event_id: id,
						team_id: 20,
						player_id: 2,
						display_name: "Bruno",
						is_goalkeeper: false,
					},
				],
			},
		],
		matches: [
			{
				id,
				event_id: id,
				team_a_id: 10,
				team_b_id: 20,
				created_at: `${day}T22:00:00.000Z`,
				ended_at: `${day}T22:07:00.000Z`,
				winner_team_id: winnerTeamId,
				duration_seconds: 999,
				started_at: `${day}T22:00:00.000Z`,
				paused_at: null,
				pause_accumulated_seconds: 0,
				players: [],
				goals,
			},
		],
	};
}

const events = [
	eventRow(1, "2026-01-01", 10, 2),
	eventRow(2, "2026-01-08", 20, 4),
];

const summary = championshipEventHealth(events);
check(summary.events === 2, "two health rows");
check(summary.averageMatches === 1, "avg matches");
check(summary.rows[0]?.goalsPerMatch === 2, "goals per match event1");
check(summary.rows[1]?.goalsPerMatch === 4, "goals per match event2");
check(summary.rows[0]?.playedSeconds === 420, "played seconds from clock");
check(summary.rows[0]?.playedSeconds !== 999, "not duration_seconds");
check(summary.favoriteWinRate === 0.5, "favorite rate");
check(summary.averageSpread === 2, "avg spread");

const favoriteChart = championshipEventHealthChart(
	summary,
	EVENT_HEALTH_METRIC.favoriteRate,
);
check(favoriteChart.length === 2, "favorite chart points");
check(favoriteChart[0]?.value === 1, "first favorite win");
check(favoriteChart[0]?.label === "100%", "first favorite label");
check(favoriteChart[1]?.value === 0.5, "cumulative favorite");
check(favoriteChart[1]?.label === "50%", "cumulative favorite label");

const spreadChart = championshipEventHealthChart(
	summary,
	EVENT_HEALTH_METRIC.spread,
);
check(spreadChart[0]?.value === 2, "spread chart");
check(spreadChart[0]?.label === "2.0", "spread label on point");

console.log("championship-event-health ok");
