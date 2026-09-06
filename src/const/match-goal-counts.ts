import { includeWhen } from "../lib/include-when.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";

export function matchGoalsForTeam(
	match: ChampionshipEvent["matches"][number],
	teamId: number,
): number {
	const teamPlayerIds = new Set(
		match.players.flatMap((player) =>
			includeWhen(player.team_id === teamId, player.player_id),
		),
	);

	return match.goals.filter((goal) => {
		const scorerOnTeam = teamPlayerIds.has(goal.scorer_player_id);
		if (goal.is_own_goal) {
			return !scorerOnTeam;
		}

		return scorerOnTeam;
	}).length;
}

export function matchGoalsConceded(
	match: ChampionshipEvent["matches"][number],
	teamId: number,
): number {
	const teamPlayerIds = new Set(
		match.players.flatMap((player) =>
			includeWhen(player.team_id === teamId, player.player_id),
		),
	);

	return match.goals.filter((goal) => {
		const scorerOnTeam = teamPlayerIds.has(goal.scorer_player_id);
		if (goal.is_own_goal) {
			return scorerOnTeam;
		}

		return !scorerOnTeam;
	}).length;
}

export function matchGoalMargin(
	match: ChampionshipEvent["matches"][number],
): number {
	const teamIds = [...new Set(match.players.map((player) => player.team_id))];
	if (teamIds.length < 2) {
		return 0;
	}

	const [teamA, teamB] = teamIds;
	if (teamA === undefined || teamB === undefined) {
		return 0;
	}

	return Math.abs(
		matchGoalsForTeam(match, teamA) - matchGoalsForTeam(match, teamB),
	);
}

export function isCloseMatch(
	match: ChampionshipEvent["matches"][number],
): boolean {
	if (match.winner_team_id === null) {
		return true;
	}

	return matchGoalMargin(match) <= 1;
}
