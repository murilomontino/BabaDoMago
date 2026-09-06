import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	championshipProjectionCalibration,
	PROJECTION_CALIBRATION_MIN_EVENTS,
} from "./championship-projection-calibration.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function eventWithBalance(
	id: number,
	day: string,
	spreadSide: "tight" | "wide",
	favoriteWon: boolean,
): ChampionshipEvent {
	const ratingA = spreadSide === "tight" ? 5 : 8;
	const ratingB = spreadSide === "tight" ? 4.5 : 3;
	const winner = favoriteWon ? 10 : 20;

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
				display_name: "A",
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
				rating: ratingA,
				rating_delta: 0,
				goalkeeper_rating: 0,
				goalkeeper_rating_delta: 0,
				vote_rating_delta: 0,
				goalkeeper_vote_rating_delta: 0,
				is_mvp: false,
				mvp_overridden: false,
			},
			{
				id: 2,
				event_id: id,
				player_id: 2,
				display_name: "B",
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
				rating: ratingB,
				rating_delta: 0,
				goalkeeper_rating: 0,
				goalkeeper_rating_delta: 0,
				vote_rating_delta: 0,
				goalkeeper_vote_rating_delta: 0,
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
				template_player_ids: [1],
				template_goalkeeper_id: 0,
				players: [
					{
						id: 1,
						event_id: id,
						team_id: 10,
						player_id: 1,
						display_name: "A",
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
				template_player_ids: [2],
				template_goalkeeper_id: 0,
				players: [
					{
						id: 2,
						event_id: id,
						team_id: 20,
						player_id: 2,
						display_name: "B",
						is_goalkeeper: false,
					},
				],
			},
		],
		matches: [
			{
				id: id,
				event_id: id,
				team_a_id: 10,
				team_b_id: 20,
				created_at: `${day}T22:00:00.000Z`,
				ended_at: `${day}T22:10:00.000Z`,
				winner_team_id: winner,
				duration_seconds: 600,
				started_at: `${day}T22:00:00.000Z`,
				paused_at: null,
				pause_accumulated_seconds: 0,
				players: [],
				goals: [],
			},
		],
	};
}

const few = championshipProjectionCalibration([
	eventWithBalance(1, "2026-01-01", "wide", true),
	eventWithBalance(2, "2026-01-08", "wide", true),
]);
check(few.rows.length === 0, "hide bands below min events");
check(few.samples.length === 2, "samples kept");
check(PROJECTION_CALIBRATION_MIN_EVENTS === 3, "min events 3");

const enough = championshipProjectionCalibration([
	eventWithBalance(1, "2026-01-01", "wide", true),
	eventWithBalance(2, "2026-01-08", "wide", true),
	eventWithBalance(3, "2026-01-15", "wide", false),
]);
check(enough.rows.length === 1, "one visible band");
check(enough.rows[0]?.events === 3, "three events in band");
check(enough.source === "public", "public source");

console.log("championship-projection-calibration.check.ts ok");
