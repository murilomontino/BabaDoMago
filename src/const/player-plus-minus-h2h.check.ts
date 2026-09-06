import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";
import { playerPlusMinus } from "./player-plus-minus.ts";
import { playerHeadToHead } from "./player-head-to-head.ts";

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
		rating: 3,
		goalkeeper_rating: 0,
		role: "member",
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

function matchPlayer(
	id: number,
	matchId: number,
	teamId: number,
	playerId: number,
) {
	return {
		id,
		match_id: matchId,
		event_id: 1,
		team_id: teamId,
		player_id: playerId,
		display_name: String(playerId),
		is_goalkeeper: false,
		slot: 0,
		is_substituted: false,
		include_stats: true,
	};
}

function goal(
	id: number,
	matchId: number,
	scorer: number,
	own = false,
) {
	return {
		id,
		match_id: matchId,
		event_id: 1,
		scorer_player_id: scorer,
		assist_player_id: null,
		is_own_goal: own,
		elapsed_seconds: 60,
		created_at: "2026-01-01T22:05:00.000Z",
	};
}

function endedMatch(
	id: number,
	winner: number,
	players: ReturnType<typeof matchPlayer>[],
	goals: ReturnType<typeof goal>[],
) {
	return {
		id,
		event_id: 1,
		team_a_id: 10,
		team_b_id: 20,
		created_at: "2026-01-01T22:00:00.000Z",
		ended_at: "2026-01-01T22:10:00.000Z",
		winner_team_id: winner,
		duration_seconds: 600,
		started_at: "2026-01-01T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		players,
		goals,
	};
}

const players = [player(1, "Ana"), player(2, "Bruno"), player(3, "Caio")];

const event: ChampionshipEvent = {
	id: 1,
	championship_id: 1,
	starts_at: "2026-01-01T22:00:00.000Z",
	players_per_team: 5,
	skip_guest_goalkeeper_matches: false,
	ended_at: "2026-01-01T23:00:00.000Z",
	attendance: [],
	rsvps: [],
	teams: [
		{
			id: 10,
			event_id: 1,
			color: EVENT_TEAM_COLOR.white,
			sort_order: 0,
			is_active: true,
			template_player_ids: [1],
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
			template_player_ids: [2, 3],
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
				{
					id: 3,
					event_id: 1,
					team_id: 20,
					player_id: 3,
					display_name: "Caio",
					is_goalkeeper: false,
				},
			],
		},
	],
	matches: [
		endedMatch(
			1,
			10,
			[
				matchPlayer(1, 1, 10, 1),
				matchPlayer(2, 1, 20, 2),
				matchPlayer(3, 1, 20, 3),
			],
			[goal(1, 1, 1), goal(2, 1, 1)],
		),
		endedMatch(
			2,
			10,
			[
				matchPlayer(4, 2, 10, 1),
				matchPlayer(5, 2, 20, 2),
				matchPlayer(6, 2, 20, 3),
			],
			[goal(3, 2, 1)],
		),
		endedMatch(
			3,
			20,
			[
				matchPlayer(7, 3, 10, 1),
				matchPlayer(8, 3, 20, 2),
				matchPlayer(9, 3, 20, 3),
			],
			[goal(4, 3, 2)],
		),
	],
};

const pm = playerPlusMinus([event], players, 1);
check(pm !== null, "plus minus exists");
check(pm?.matches === 3, "three matches");
check(pm?.goalsFor === 3, "three for");
check(pm?.goalsAgainst === 1, "one against");
check(pm?.diff === 2, "diff +2");

const h2h = playerHeadToHead([event], players, 1);
check(h2h.length === 2, "two opponents");
check(h2h.every((row) => row.matches === 3), "three each");
const vsBruno = h2h.find((row) => row.opponent.id === 2);
check(vsBruno?.wins === 2, "ana beat bruno twice");

console.log("player-plus-minus-h2h.check.ts ok");
