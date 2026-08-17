import type { ChampionshipEvent } from "../types/championship-event.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";
import { playerGoalkeeperStats } from "./goalkeeper-stats.ts";

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
		attendance: [],
		rsvps: [],
		teams: [
			{
				id: 10,
				event_id: 1,
				color: EVENT_TEAM_COLOR.white,
				sort_order: 0,
				players: [
					{
						id: 1,
						event_id: 1,
						team_id: 10,
						player_id: 1,
						display_name: "Ana",
						is_goalkeeper: true,
					},
				],
			},
			{
				id: 20,
				event_id: 1,
				color: EVENT_TEAM_COLOR.black,
				sort_order: 1,
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
				players: [
					{
						id: 1,
						match_id: 1,
						event_id: 1,
						team_id: 10,
						player_id: 1,
						display_name: "Ana",
						is_goalkeeper: true,
						slot: 0,
						is_substituted: false,
						include_stats: true,
					},
					{
						id: 2,
						match_id: 1,
						event_id: 1,
						team_id: 20,
						player_id: 2,
						display_name: "Bruno",
						is_goalkeeper: false,
						slot: 1,
						is_substituted: false,
						include_stats: true,
					},
				],
				goals: [
					{
						id: 1,
						match_id: 1,
						event_id: 1,
						scorer_player_id: 2,
						assist_player_id: null,
						is_own_goal: false,
						elapsed_seconds: null,
						created_at: "2026-08-01T22:05:00.000Z",
					},
					{
						id: 2,
						match_id: 1,
						event_id: 1,
						scorer_player_id: 1,
						assist_player_id: null,
						is_own_goal: true,
						elapsed_seconds: null,
						created_at: "2026-08-01T22:06:00.000Z",
					},
				],
			},
		],
	};
}

check(playerGoalkeeperStats([], 1) === null, "empty events");
check(playerGoalkeeperStats([eventRow()], 2) === null, "field player empty");

const stats = playerGoalkeeperStats([eventRow()], 1);
check(stats !== null, "gk stats exist");
check(stats?.matches === 1, "one gk match");
check(stats?.wins === 1, "gk win");
check(stats?.goalsConceded === 2, "opponent goal plus own goal");
check(stats?.goalsConcededAverage === 2, "average conceded");

const guest = eventRow();
guest.skip_guest_goalkeeper_matches = true;
const guestTeam = guest.teams[0];
const guestMatch = guest.matches[0];
if (guestTeam === undefined || guestMatch === undefined) {
	throw new Error("guest fixture");
}
guestTeam.players = [];
guestMatch.winner_team_id = 20;
const guestStats = playerGoalkeeperStats([guest], 1);
check(guestStats === null, "guest gk loss skipped");

const open = eventRow();
const openMatch = open.matches[0];
if (openMatch === undefined) {
	throw new Error("open fixture");
}
openMatch.ended_at = null;
openMatch.winner_team_id = null;
check(playerGoalkeeperStats([open], 1) === null, "open match skipped");

console.log("goalkeeper-stats ok");
