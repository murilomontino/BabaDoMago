import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	championshipGoalkeeperRanking,
	GOALKEEPER_TREND,
} from "./championship-goalkeeper-ranking.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";
import { SYNERGY_MIN_MATCHES } from "./player-synergy.ts";

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
		role: "member",
		rating: 3,
		goalkeeper_rating: 0,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
		is_goalkeeper: true,
		is_monthly: false,
		deleted_at: null,
	};
}

function gkEvent(
	id: number,
	day: string,
	goalsConceded: number,
	winnerTeamId: number | null,
): ChampionshipEvent {
	const goals = Array.from({ length: goalsConceded }, (_, index) => ({
		id: index + 1,
		match_id: id,
		event_id: id,
		scorer_player_id: 2,
		assist_player_id: null,
		is_own_goal: false,
		elapsed_seconds: null,
		created_at: `${day}T22:05:00.000Z`,
	}));

	return {
		id,
		championship_id: 1,
		starts_at: `${day}T22:00:00.000Z`,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: `${day}T23:00:00.000Z`,
		attendance: [],
		rsvps: [],
		teams: [
			{
				id: 10,
				event_id: id,
				color: EVENT_TEAM_COLOR.white,
				sort_order: 0,
				is_active: true,
				template_player_ids: [],
				template_goalkeeper_id: 1,
				players: [
					{
						id: 1,
						event_id: id,
						team_id: 10,
						player_id: 1,
						display_name: "Ana",
						is_goalkeeper: true,
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
				ended_at: `${day}T22:10:00.000Z`,
				winner_team_id: winnerTeamId,
				duration_seconds: 420,
				started_at: `${day}T22:00:00.000Z`,
				paused_at: null,
				pause_accumulated_seconds: 0,
				players: [
					{
						id: 1,
						match_id: id,
						event_id: id,
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
						match_id: id,
						event_id: id,
						team_id: 20,
						player_id: 2,
						display_name: "Bruno",
						is_goalkeeper: false,
						slot: 1,
						is_substituted: false,
						include_stats: true,
					},
				],
				goals,
			},
		],
	};
}

const players = [player(1, "Ana"), player(2, "Bruno")];

const short = [
	gkEvent(1, "2026-01-01", 1, 10),
	gkEvent(2, "2026-01-08", 2, 20),
];
check(
	championshipGoalkeeperRanking(players, short).length === 0,
	"below synergy floor",
);
check(SYNERGY_MIN_MATCHES === 3, "synergy floor 3");

const three = [
	gkEvent(1, "2026-01-01", 3, 20),
	gkEvent(2, "2026-01-08", 2, 10),
	gkEvent(3, "2026-01-15", 1, 10),
];
const rows = championshipGoalkeeperRanking(players, three);
check(rows.length === 1, "one qualified gk");
check(rows[0]?.matches === 3, "three matches");
check(rows[0]?.goalsConceded === 6, "total conceded");
check(rows[0]?.goalsConcededAverage === 2, "average conceded");
check(rows[0]?.wins === 2, "two wins");
check(rows[0]?.losses === 1, "one loss");
check(rows[0]?.trend === GOALKEEPER_TREND.up, "average falling is up");

const rising = [
	gkEvent(1, "2026-01-01", 1, 10),
	gkEvent(2, "2026-01-08", 2, 10),
	gkEvent(3, "2026-01-15", 3, 20),
];
const risingRows = championshipGoalkeeperRanking(players, rising);
check(risingRows[0]?.trend === GOALKEEPER_TREND.down, "average rising is down");

console.log("championship-goalkeeper-ranking ok");
