import { includeWhen } from "../lib/include-when.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import { countsForSynergy } from "./player-synergy.ts";
import {
	formatRosterCount,
	formatRosterWinRate,
	rosterAverage,
	rosterSafeCount,
	rosterWinRate,
} from "./roster-stats.ts";

export const GOALKEEPER_STATS_LABEL = {
	title: "Como goleiro",
	empty: "Ainda não jogou no gol",
	matches: "Jogos",
	wins: "Vitórias",
	winRate: "Aproveitamento",
	goalsConceded: "Gols sofridos",
	goalsConcededAverage: "Média sofrida",
	hint: "Gols sofridos vêm do placar adversário, não de defesas.",
} as const;

export type GoalkeeperStats = {
	matches: number;
	wins: number;
	draws: number;
	losses: number;
	winRate: number;
	goalsConceded: number;
	goalsConcededAverage: number;
};

function rosterTeamByPlayerId(
	event: ChampionshipEvent,
): ReadonlyMap<number, number> {
	return new Map(
		event.teams.flatMap((team) =>
			team.players.map((player) => [player.player_id, team.id] as const),
		),
	);
}

function matchGoalsConceded(
	event: ChampionshipEvent["matches"][number],
	teamId: number,
): number {
	const teamPlayerIds = new Set(
		event.players.flatMap((player) =>
			includeWhen(player.team_id === teamId, player.player_id),
		),
	);

	return event.goals.filter((goal) => {
		const scorerOnTeam = teamPlayerIds.has(goal.scorer_player_id);
		if (goal.is_own_goal) {
			return scorerOnTeam;
		}

		return !scorerOnTeam;
	}).length;
}

export function playerGoalkeeperStats(
	events: readonly ChampionshipEvent[],
	playerId: number,
): GoalkeeperStats | null {
	const rows = events.flatMap((event) => {
		const rosterByPlayer = rosterTeamByPlayerId(event);
		return event.matches.flatMap((match) => {
			const player = match.players.find(
				(item) => item.player_id === playerId && item.is_goalkeeper,
			);
			if (!player) {
				return [];
			}

			if (
				!countsForSynergy(
					player,
					match,
					rosterByPlayer.get(player.player_id) ?? null,
					event.skip_guest_goalkeeper_matches,
				)
			) {
				return [];
			}

			const won = match.winner_team_id === player.team_id;
			const draw = match.winner_team_id === null;

			return [
				{
					won,
					draw,
					goalsConceded: matchGoalsConceded(match, player.team_id),
				},
			];
		});
	});

	if (rows.length === 0) {
		return null;
	}

	const wins = rows.filter((row) => row.won).length;
	const draws = rows.filter((row) => row.draw).length;
	const matches = rows.length;
	const goalsConceded = rows.reduce((sum, row) => sum + row.goalsConceded, 0);

	return {
		matches,
		wins,
		draws,
		losses: matches - wins - draws,
		winRate: rosterWinRate(wins, matches),
		goalsConceded,
		goalsConcededAverage: rosterAverage(goalsConceded, matches),
	};
}

export function formatGoalkeeperCount(value: number): string {
	return formatRosterCount(value);
}

export function formatGoalkeeperWinRate(value: number): string {
	return formatRosterWinRate(value);
}

export function formatGoalkeeperAverage(value: number): string {
	return rosterSafeCount(value).toFixed(1);
}
