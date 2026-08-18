import type { ChampionshipEvent } from "../types/championship-event.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";
import {
	championshipTeamBalance,
	eventTeamBalance,
} from "./team-balance-stats.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function eventRow(): ChampionshipEvent {
	return {
		id: 1,
		championship_id: 1,
		starts_at: "2026-08-01T22:00:00.000Z",
		players_per_team: 5,
		skip_guest_goalkeeper_matches: true,
		ended_at: "2026-08-01T23:00:00.000Z",
		attendance: [
			{
				id: 1,
				event_id: 1,
				player_id: 1,
				display_name: "Ana",
				is_goalkeeper: false,
				event_date: "2026-08-01",
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
				is_mvp: false,
				mvp_overridden: false,
			},
			{
				id: 2,
				event_id: 1,
				player_id: 2,
				display_name: "Bruno",
				is_goalkeeper: false,
				event_date: "2026-08-01",
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
				is_mvp: false,
				mvp_overridden: false,
			},
		],
		rsvps: [],
		teams: [
			{
				id: 10,
				event_id: 1,
				color: EVENT_TEAM_COLOR.white,
				sort_order: 0,
				is_active: true,
				template_player_ids: [],
				template_goalkeeper_id: 0,
				players: [
					{
						id: 1,
						event_id: 1,
						team_id: 10,
						player_id: 1,
						display_name: "Ana",
						is_goalkeeper: false,
					},
				],
			},
			{
				id: 20,
				event_id: 1,
				color: EVENT_TEAM_COLOR.black,
				sort_order: 1,
				is_active: true,
				template_player_ids: [],
				template_goalkeeper_id: 0,
				players: [
					{
						id: 2,
						event_id: 1,
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
				id: 1,
				event_id: 1,
				team_a_id: 10,
				team_b_id: 20,
				created_at: "2026-08-01T22:00:00.000Z",
				ended_at: "2026-08-01T22:10:00.000Z",
				winner_team_id: 10,
				duration_seconds: 420,
				started_at: "2026-08-01T22:00:00.000Z",
				paused_at: null,
				pause_accumulated_seconds: 0,
				players: [],
				goals: [],
			},
		],
	};
}

check(eventTeamBalance({ ...eventRow(), teams: [] }) === null, "no teams");

const row = eventTeamBalance(eventRow());
check(row !== null, "balance exists");
check(row?.spread === 2, "predicted spread");
check(row?.favoriteWon === true, "favorite won");
check(row?.teams[0]?.predictedRating === 5, "white rating");
check(row?.teams[0]?.winRate === 1, "white wr");

const upset = eventRow();
const upsetMatch = upset.matches[0];
if (upsetMatch === undefined) {
	throw new Error("upset fixture");
}
upsetMatch.winner_team_id = 20;
const upsetRow = eventTeamBalance(upset);
check(upsetRow?.favoriteWon === false, "favorite lost");

const summary = championshipTeamBalance([eventRow(), upset]);
check(summary.events === 2, "two events");
check(summary.favoriteDecided === 2, "two decided");
check(summary.favoriteWon === 1, "one favorite win");
check(summary.favoriteWinRate === 0.5, "favorite wr");

const open = eventRow();
open.ended_at = null;
check(championshipTeamBalance([open]).events === 0, "skips open event");

console.log("team-balance-stats ok");
