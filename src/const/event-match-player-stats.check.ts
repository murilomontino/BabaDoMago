import type {
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "../types/championship-event.ts";
import {
	eventMatchPlayerStats,
	type EventMatchPlayerStatRow,
} from "./event-match-player-stats.ts";

function checkEq<T>(actual: T, expected: T, message: string) {
	if (actual !== expected) {
		throw new Error(
			`${message}: got ${String(actual)}, want ${String(expected)}`,
		);
	}
}

function team(
	id: number,
	players: { playerId: number; isGoalkeeper?: boolean }[],
): ChampionshipEventTeam {
	return {
		id,
		event_id: 1,
		color: null,
		sort_order: id,
		is_active: true,
		template_player_ids: [],
		template_goalkeeper_id: 0,
		players: players.map((player, index) => ({
			id: index + 1,
			event_id: 1,
			team_id: id,
			player_id: player.playerId,
			display_name: `P${player.playerId}`,
			is_goalkeeper: player.isGoalkeeper === true,
		})),
	};
}

function matchPlayer(input: {
	id: number;
	teamId: number;
	playerId: number;
	includeStats?: boolean;
	isGoalkeeper?: boolean;
}): ChampionshipEventMatchPlayer {
	return {
		id: input.id,
		match_id: 1,
		event_id: 1,
		team_id: input.teamId,
		player_id: input.playerId,
		display_name: `P${input.playerId}`,
		is_goalkeeper: input.isGoalkeeper === true,
		slot: 1,
		is_substituted: false,
		include_stats: input.includeStats !== false,
	};
}

function goal(input: {
	id: number;
	scorerPlayerId: number;
	assistPlayerId?: number | null;
	isOwnGoal?: boolean;
}): ChampionshipEventGoal {
	return {
		id: input.id,
		match_id: 1,
		event_id: 1,
		scorer_player_id: input.scorerPlayerId,
		assist_player_id: input.assistPlayerId ?? null,
		is_own_goal: input.isOwnGoal === true,
		elapsed_seconds: 30,
		created_at: "2026-08-01T22:05:00.000Z",
	};
}

function endedMatch(input: {
	id: number;
	teamAId: number;
	teamBId: number;
	winnerTeamId: number | null;
	players: ChampionshipEventMatchPlayer[];
	goals?: ChampionshipEventGoal[];
}): ChampionshipEventMatch {
	return {
		id: input.id,
		event_id: 1,
		team_a_id: input.teamAId,
		team_b_id: input.teamBId,
		created_at: "2026-08-01T22:00:00.000Z",
		ended_at: "2026-08-01T22:10:00.000Z",
		winner_team_id: input.winnerTeamId,
		duration_seconds: 420,
		started_at: "2026-08-01T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		players: input.players,
		goals: input.goals ?? [],
	};
}

function row(
	map: Map<number, EventMatchPlayerStatRow>,
	playerId: number,
): EventMatchPlayerStatRow {
	const found = map.get(playerId);
	if (!found) {
		throw new Error(`missing player ${playerId}`);
	}

	return found;
}

const white = team(10, [{ playerId: 1 }, { playerId: 3, isGoalkeeper: true }]);
const black = team(20, [{ playerId: 2 }]);

const winMatch = endedMatch({
	id: 1,
	teamAId: 10,
	teamBId: 20,
	winnerTeamId: 10,
	players: [
		matchPlayer({ id: 1, teamId: 10, playerId: 1 }),
		matchPlayer({ id: 2, teamId: 20, playerId: 2 }),
	],
	goals: [
		goal({ id: 1, scorerPlayerId: 1, assistPlayerId: 1 }),
		goal({ id: 2, scorerPlayerId: 2 }),
	],
});

const winStats = eventMatchPlayerStats({
	matches: [winMatch],
	teams: [white, black],
	skipGuestGoalkeeperMatches: true,
	playerIds: [1, 2, 3],
});

checkEq(row(winStats, 1).wins, 1, "winner wins");
checkEq(row(winStats, 1).losses, 0, "winner losses");
checkEq(row(winStats, 1).matches, 1, "winner matches");
checkEq(row(winStats, 1).goals, 1, "winner goals");
checkEq(row(winStats, 1).assists, 1, "winner assists");
checkEq(row(winStats, 2).losses, 1, "loser losses");
checkEq(row(winStats, 2).goals, 1, "loser goals");
checkEq(row(winStats, 3).matches, 0, "absent stays zero");

const drawMatch = endedMatch({
	id: 2,
	teamAId: 10,
	teamBId: 20,
	winnerTeamId: null,
	players: [
		matchPlayer({ id: 3, teamId: 10, playerId: 1 }),
		matchPlayer({ id: 4, teamId: 20, playerId: 2 }),
	],
});

const drawStats = eventMatchPlayerStats({
	matches: [drawMatch],
	teams: [white, black],
	skipGuestGoalkeeperMatches: true,
	playerIds: [1, 2],
});
checkEq(row(drawStats, 1).draws, 1, "draw recorded");
checkEq(row(drawStats, 2).draws, 1, "draw both");

const skippedStats = eventMatchPlayerStats({
	matches: [
		endedMatch({
			id: 3,
			teamAId: 10,
			teamBId: 20,
			winnerTeamId: 10,
			players: [
				matchPlayer({
					id: 5,
					teamId: 10,
					playerId: 1,
					includeStats: false,
				}),
				matchPlayer({ id: 6, teamId: 20, playerId: 2 }),
			],
			goals: [goal({ id: 3, scorerPlayerId: 1 })],
		}),
	],
	teams: [white, black],
	skipGuestGoalkeeperMatches: true,
	playerIds: [1, 2],
});
checkEq(row(skippedStats, 1).matches, 0, "include_stats false skips match");
checkEq(row(skippedStats, 1).goals, 0, "include_stats false skips goals");

const guestGkMatch = endedMatch({
	id: 4,
	teamAId: 10,
	teamBId: 20,
	winnerTeamId: 10,
	players: [
		matchPlayer({
			id: 7,
			teamId: 20,
			playerId: 3,
			isGoalkeeper: true,
		}),
		matchPlayer({ id: 8, teamId: 10, playerId: 1 }),
	],
});

const guestSkipped = eventMatchPlayerStats({
	matches: [guestGkMatch],
	teams: [white, black],
	skipGuestGoalkeeperMatches: true,
	playerIds: [1, 3],
});
checkEq(row(guestSkipped, 3).matches, 0, "guest gk loss skipped");

const guestCounted = eventMatchPlayerStats({
	matches: [
		endedMatch({
			id: 5,
			teamAId: 10,
			teamBId: 20,
			winnerTeamId: 20,
			players: [
				matchPlayer({
					id: 9,
					teamId: 20,
					playerId: 3,
					isGoalkeeper: true,
				}),
				matchPlayer({ id: 10, teamId: 10, playerId: 1 }),
			],
		}),
	],
	teams: [white, black],
	skipGuestGoalkeeperMatches: true,
	playerIds: [1, 3],
});
checkEq(row(guestCounted, 3).wins, 1, "guest gk win counts");

const openIgnored = eventMatchPlayerStats({
	matches: [
		{
			...winMatch,
			id: 99,
			ended_at: null,
			winner_team_id: null,
		},
	],
	teams: [white, black],
	skipGuestGoalkeeperMatches: true,
	playerIds: [1, 2],
});
checkEq(row(openIgnored, 1).matches, 0, "open match ignored");

console.log("event-match-player-stats ok");
