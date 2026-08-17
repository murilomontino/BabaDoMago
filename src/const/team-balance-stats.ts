import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	eventDrawRatings,
	eventTeamRatingAverage,
} from "./championship-event.ts";
import { eventTeamName } from "./event-team-color.ts";
import { averageOrZero } from "./player-rating.ts";
import {
	formatRosterCount,
	formatRosterWinRate,
	rosterWinRate,
} from "./roster-stats.ts";

export const TEAM_BALANCE_LABEL = {
	title: "Equilíbrio dos times",
	empty: "Nenhuma partida encerrada",
	predicted: "Nota prevista",
	spread: "Diferença prevista",
	actual: "Aproveitamento",
	favorite: "Favorito venceu",
	hint: "Nota prevista usa o snapshot da presença. Aproveitamento vem das partidas encerradas.",
} as const;

export type TeamBalanceTeam = {
	teamId: number;
	label: string;
	predictedRating: number;
	matches: number;
	wins: number;
	winRate: number;
};

export type TeamBalanceEvent = {
	eventId: number;
	startsAt: string;
	spread: number;
	favoriteWon: boolean | null;
	teams: TeamBalanceTeam[];
};

export type TeamBalanceSummary = {
	events: number;
	averageSpread: number;
	favoriteDecided: number;
	favoriteWon: number;
	favoriteWinRate: number;
	rows: TeamBalanceEvent[];
};

function teamMatchRecord(
	event: ChampionshipEvent,
	teamId: number,
): { matches: number; wins: number } {
	return event.matches
		.filter((match) => match.ended_at !== null)
		.filter((match) => match.team_a_id === teamId || match.team_b_id === teamId)
		.reduce(
			(acc, match) => ({
				matches: acc.matches + 1,
				wins: acc.wins + (match.winner_team_id === teamId ? 1 : 0),
			}),
			{ matches: 0, wins: 0 },
		);
}

export function eventTeamBalance(
	event: ChampionshipEvent,
): TeamBalanceEvent | null {
	if (event.teams.length === 0) {
		return null;
	}

	const attendanceByPlayer = new Map(
		event.attendance.map((row) => [row.player_id, row] as const),
	);
	const drawRatings = eventDrawRatings(
		event.teams.flatMap((team) =>
			team.players.map((player) => ({
				id: player.player_id,
				rating: attendanceByPlayer.get(player.player_id)?.rating ?? 0,
			})),
		),
	);
	const ratingByPlayer = new Map(
		drawRatings.map((player) => [player.id, player.rating] as const),
	);
	const teams = event.teams.map((team) => {
		const record = teamMatchRecord(event, team.id);
		const ratings = team.players.map(
			(player) => ratingByPlayer.get(player.player_id) ?? 0,
		);

		return {
			teamId: team.id,
			label: eventTeamName(team.color, team.sort_order),
			predictedRating: eventTeamRatingAverage(ratings),
			matches: record.matches,
			wins: record.wins,
			winRate: rosterWinRate(record.wins, record.matches),
		};
	});
	const predicted = teams.map((team) => team.predictedRating);
	const highest = Math.max(...predicted);
	const lowest = Math.min(...predicted);
	const favorites = teams.filter((team) => team.predictedRating === highest);
	const actualLeaders = teams.filter((team) => {
		const bestWr = Math.max(...teams.map((item) => item.winRate));
		return team.winRate === bestWr && team.matches > 0;
	});
	const decided =
		favorites.length === 1 && actualLeaders.length === 1 && highest !== lowest;
	const favoriteWon = decided
		? favorites[0]?.teamId === actualLeaders[0]?.teamId
		: null;

	return {
		eventId: event.id,
		startsAt: event.starts_at,
		spread: highest - lowest,
		favoriteWon,
		teams,
	};
}

export function championshipTeamBalance(
	events: readonly ChampionshipEvent[],
): TeamBalanceSummary {
	const rows = events.flatMap((event) => {
		if (event.ended_at === null) {
			return [];
		}

		const row = eventTeamBalance(event);
		if (!row) {
			return [];
		}

		return [row];
	});
	const favoriteDecided = rows.filter((row) => row.favoriteWon !== null);
	const favoriteWon = favoriteDecided.filter((row) => row.favoriteWon).length;
	const spreadTotal = rows.reduce((sum, row) => sum + row.spread, 0);

	return {
		events: rows.length,
		averageSpread: averageOrZero(spreadTotal, rows.length),
		favoriteDecided: favoriteDecided.length,
		favoriteWon,
		favoriteWinRate: rosterWinRate(favoriteWon, favoriteDecided.length),
		rows,
	};
}

export function formatTeamBalanceSpread(value: number): string {
	return value.toFixed(1);
}

export function formatTeamBalanceCount(value: number): string {
	return formatRosterCount(value);
}

export function formatTeamBalanceWinRate(value: number): string {
	return formatRosterWinRate(value);
}
