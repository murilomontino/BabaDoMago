import type {
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "../types/championship-event.ts";
import { countsForSynergy } from "./player-synergy.ts";

export type EventMatchPlayerStatRow = {
	playerId: number;
	wins: number;
	draws: number;
	losses: number;
	matches: number;
	goals: number;
	assists: number;
};

function emptyStatRow(playerId: number): EventMatchPlayerStatRow {
	return {
		playerId,
		wins: 0,
		draws: 0,
		losses: 0,
		matches: 0,
		goals: 0,
		assists: 0,
	};
}

function rosterTeamByPlayerId(
	teams: readonly ChampionshipEventTeam[],
): ReadonlyMap<number, number> {
	return new Map(
		teams.flatMap((team) =>
			team.players.map((player) => [player.player_id, team.id] as const),
		),
	);
}

function applyMatchResult(
	row: EventMatchPlayerStatRow,
	winnerTeamId: number | null,
	teamId: number,
): EventMatchPlayerStatRow {
	const next: EventMatchPlayerStatRow = {
		...row,
		matches: row.matches + 1,
	};

	if (winnerTeamId === null) {
		next.draws += 1;
		return next;
	}

	if (winnerTeamId === teamId) {
		next.wins += 1;
		return next;
	}

	next.losses += 1;
	return next;
}

function matchPlayerById(
	players: readonly ChampionshipEventMatchPlayer[],
): ReadonlyMap<number, ChampionshipEventMatchPlayer> {
	return new Map(players.map((player) => [player.player_id, player]));
}

function goalCountsTowardStats(
	goal: ChampionshipEventGoal,
	playerById: ReadonlyMap<number, ChampionshipEventMatchPlayer>,
	playerId: number,
	kind: "scorer" | "assist",
): boolean {
	if (kind === "scorer") {
		if (goal.scorer_player_id !== playerId) {
			return false;
		}

		if (goal.is_own_goal) {
			return false;
		}

		const scorer = playerById.get(playerId);
		return scorer?.include_stats === true;
	}

	if (goal.assist_player_id !== playerId) {
		return false;
	}

	const assist = playerById.get(playerId);
	return assist?.include_stats === true;
}

function applyMatchGoals(
	row: EventMatchPlayerStatRow,
	goals: readonly ChampionshipEventGoal[],
	playerById: ReadonlyMap<number, ChampionshipEventMatchPlayer>,
): EventMatchPlayerStatRow {
	return goals.reduce((acc, goal) => {
		let next = acc;
		if (goalCountsTowardStats(goal, playerById, acc.playerId, "scorer")) {
			next = { ...next, goals: next.goals + 1 };
		}

		if (goalCountsTowardStats(goal, playerById, acc.playerId, "assist")) {
			next = { ...next, assists: next.assists + 1 };
		}

		return next;
	}, row);
}

export function eventMatchPlayerStats(input: {
	matches: readonly ChampionshipEventMatch[];
	teams: readonly ChampionshipEventTeam[];
	skipGuestGoalkeeperMatches: boolean;
	playerIds: readonly number[];
}): Map<number, EventMatchPlayerStatRow> {
	const rosterTeam = rosterTeamByPlayerId(input.teams);
	const byPlayer = new Map(
		input.playerIds.map((playerId) => [
			playerId,
			emptyStatRow(playerId),
		] as const),
	);

	return input.matches.reduce((acc, match) => {
		const playerById = matchPlayerById(match.players);

		return match.players.reduce((rows, player) => {
			const row = rows.get(player.player_id);
			if (!row) {
				return rows;
			}

			const counts = countsForSynergy(
				player,
				match,
				rosterTeam.get(player.player_id) ?? null,
				input.skipGuestGoalkeeperMatches,
			);
			if (!counts) {
				return rows;
			}

			const withResult = applyMatchResult(
				row,
				match.winner_team_id,
				player.team_id,
			);
			rows.set(
				player.player_id,
				applyMatchGoals(withResult, match.goals, playerById),
			);
			return rows;
		}, acc);
	}, byPlayer);
}
