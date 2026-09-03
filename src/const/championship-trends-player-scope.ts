import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventGoal,
	ChampionshipEventMatch,
} from "../types/championship-event.ts";
import type { TrendsAudience } from "./championship-trends-window.ts";
import { TRENDS_AUDIENCE } from "./championship-trends-window.ts";

export type TrendsPlayerScope = ReadonlySet<number> | null;

export function trendsAudiencePlayerScope(
	players: readonly ChampionshipPlayer[],
	audience: TrendsAudience,
): TrendsPlayerScope {
	if (audience === TRENDS_AUDIENCE.all) {
		return null;
	}

	return new Set(
		players.flatMap((player) => (player.is_monthly ? [player.id] : [])),
	);
}

export function trendsPlayerInScope(
	playerId: number,
	playerIds: TrendsPlayerScope,
): boolean {
	if (playerIds === null) {
		return true;
	}

	return playerIds.has(playerId);
}

export function trendsScopedRosterPlayers(
	players: readonly ChampionshipPlayer[],
	playerIds: TrendsPlayerScope,
): readonly ChampionshipPlayer[] {
	if (playerIds === null) {
		return players;
	}

	return players.filter((player) => playerIds.has(player.id));
}

export function trendsScopedPresentCount(
	attendance: readonly { player_id: number }[],
	playerIds: TrendsPlayerScope,
): number {
	if (playerIds === null) {
		return attendance.length;
	}

	return attendance.filter((row) => playerIds.has(row.player_id)).length;
}

export function trendsScopedRosterSize(
	players: readonly ChampionshipPlayer[],
	playerIds: TrendsPlayerScope,
): number {
	if (playerIds === null) {
		return players.length;
	}

	return playerIds.size;
}

export function trendsScopedEndedMatches(
	event: ChampionshipEvent,
	playerIds: TrendsPlayerScope,
): ChampionshipEventMatch[] {
	const ended = event.matches.filter((match) => match.ended_at !== null);
	if (playerIds === null) {
		return ended;
	}

	if (playerIds.size === 0) {
		return [];
	}

	return ended.filter((match) =>
		match.players.some((player) => playerIds.has(player.player_id)),
	);
}

export function trendsScopedGoalCount(
	goals: readonly ChampionshipEventGoal[],
	playerIds: TrendsPlayerScope,
): number {
	if (playerIds === null) {
		return goals.length;
	}

	return goals.filter((goal) => playerIds.has(goal.scorer_player_id)).length;
}
