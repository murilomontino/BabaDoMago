import type { ChampionshipPlayer } from "../types/championship.ts";
import { playerProfileDelta } from "./player-profile.ts";

export const ROSTER_COLUMN = {
	player: "player",
	rating: "rating",
	ratingEvolution: "ratingEvolution",
	goals: "goals",
	assists: "assists",
	assisted_goals: "assisted_goals",
	own_goals: "own_goals",
	goalInvolvement: "goalInvolvement",
	wins: "wins",
	losses: "losses",
	draws: "draws",
	mvps: "mvps",
	matches: "matches",
	goalsAverage: "goalsAverage",
	assistsAverage: "assistsAverage",
	winRate: "winRate",
	actions: "actions",
} as const;

export type RosterColumnId = (typeof ROSTER_COLUMN)[keyof typeof ROSTER_COLUMN];

export const ROSTER_COLUMN_ABBR = {
	player: "Jog",
	rating: "Rat",
	ratingEvolution: "Evol.",
	goals: "G",
	assists: "A",
	assisted_goals: "GS",
	own_goals: "GC",
	goalInvolvement: "PG",
	wins: "V",
	losses: "D",
	draws: "E",
	mvps: "MVP",
	matches: "J",
	goalsAverage: "MG",
	assistsAverage: "MA",
	winRate: "WR",
	actions: "Ações",
} as const;

export const ROSTER_COLUMN_LABEL = {
	player: "Jogador",
	rating: "Rating",
	ratingEvolution: "Evolução da nota",
	goals: "Gols",
	assists: "Assistências",
	assisted_goals: "Gols servidos",
	own_goals: "Gols contra",
	goalInvolvement: "Participação em Gols",
	wins: "Vitórias",
	losses: "Derrotas",
	draws: "Empates",
	mvps: "Destaque da rodada",
	matches: "Jogos",
	goalsAverage: "Média de Gols",
	assistsAverage: "Média de Assistências",
	winRate: "WinRate",
	actions: "Ações",
} as const;

export const ROSTER_STAT_COLUMNS = [
	ROSTER_COLUMN.goals,
	ROSTER_COLUMN.assists,
	ROSTER_COLUMN.assisted_goals,
	ROSTER_COLUMN.own_goals,
	ROSTER_COLUMN.goalInvolvement,
	ROSTER_COLUMN.wins,
	ROSTER_COLUMN.losses,
	ROSTER_COLUMN.draws,
	ROSTER_COLUMN.mvps,
	ROSTER_COLUMN.matches,
	ROSTER_COLUMN.goalsAverage,
	ROSTER_COLUMN.assistsAverage,
	ROSTER_COLUMN.winRate,
] as const;

export type RosterStatColumnId = (typeof ROSTER_STAT_COLUMNS)[number];

export const ROSTER_OPTIONAL_COLUMNS = [
	ROSTER_COLUMN.assisted_goals,
	ROSTER_COLUMN.losses,
	ROSTER_COLUMN.draws,
] as const;

export type RosterOptionalColumnId = (typeof ROSTER_OPTIONAL_COLUMNS)[number];

export const ROSTER_DEFAULT_COLUMN_VISIBILITY = {
	[ROSTER_COLUMN.assisted_goals]: false,
	[ROSTER_COLUMN.losses]: false,
	[ROSTER_COLUMN.draws]: false,
} as const;

export const ROSTER_OPTIONAL_COLUMN_OPTIONS = ROSTER_OPTIONAL_COLUMNS.map(
	(id) => ({
		id,
		label: ROSTER_COLUMN_LABEL[id],
	}),
);

const ROSTER_OPTIONAL_COLUMN_IDS = new Set<string>(ROSTER_OPTIONAL_COLUMNS);

export function isRosterOptionalColumn(
	column: string,
): column is RosterOptionalColumnId {
	return ROSTER_OPTIONAL_COLUMN_IDS.has(column);
}

export type RosterPlayerInput = ChampionshipPlayer & {
	ratingEvolution?: number;
};

export type RosterRow = ChampionshipPlayer & {
	goalInvolvement: number;
	goalsAverage: number;
	assistsAverage: number;
	winRate: number;
	ratingEvolution: number;
};

export function rosterPlayerRatingEvolution(player: RosterPlayerInput): number {
	return playerProfileDelta(player.ratingEvolution);
}

export function rosterSafeCount(value: unknown): number {
	const n = Number(value);
	if (!Number.isFinite(n) || n < 0) {
		return 0;
	}

	return n;
}

export function rosterGoalInvolvement(goals: number, assists: number): number {
	return rosterSafeCount(goals) + rosterSafeCount(assists);
}

export function rosterAverage(value: number, matches: number): number {
	const safeMatches = rosterSafeCount(matches);
	if (safeMatches === 0) {
		return 0;
	}

	return rosterSafeCount(value) / safeMatches;
}

export function rosterWinRate(wins: number, matches: number): number {
	const safeMatches = rosterSafeCount(matches);
	if (safeMatches === 0) {
		return 0;
	}

	return rosterSafeCount(wins) / safeMatches;
}

export function toRosterRow(player: RosterPlayerInput): RosterRow {
	const goals = rosterSafeCount(player.goals);
	const assists = rosterSafeCount(player.assists);
	const assistedGoals = rosterSafeCount(player.assisted_goals);
	const ownGoals = rosterSafeCount(player.own_goals);
	const wins = rosterSafeCount(player.wins);
	const losses = rosterSafeCount(player.losses);
	const draws = rosterSafeCount(player.draws);
	const matches = rosterSafeCount(player.matches);

	return {
		...player,
		goals,
		assists,
		assisted_goals: assistedGoals,
		own_goals: ownGoals,
		wins,
		losses,
		draws,
		matches,
		goalInvolvement: rosterGoalInvolvement(goals, assists),
		goalsAverage: rosterAverage(goals, matches),
		assistsAverage: rosterAverage(assists, matches),
		winRate: rosterWinRate(wins, matches),
		ratingEvolution: rosterPlayerRatingEvolution(player),
	};
}

export function formatRosterCount(value: number): string {
	return String(rosterSafeCount(value));
}

export function formatRosterAverage(value: number): string {
	return rosterSafeCount(value).toFixed(1);
}

export function formatRosterWinRate(value: number): string {
	return `${Math.round(rosterSafeCount(value) * 100)}%`;
}

export function formatRosterStat(
	column: RosterStatColumnId,
	value: number,
): string {
	switch (column) {
		case ROSTER_COLUMN.goals:
		case ROSTER_COLUMN.assists:
		case ROSTER_COLUMN.assisted_goals:
		case ROSTER_COLUMN.own_goals:
		case ROSTER_COLUMN.goalInvolvement:
		case ROSTER_COLUMN.wins:
		case ROSTER_COLUMN.losses:
		case ROSTER_COLUMN.draws:
		case ROSTER_COLUMN.mvps:
		case ROSTER_COLUMN.matches:
			return formatRosterCount(value);
		case ROSTER_COLUMN.goalsAverage:
		case ROSTER_COLUMN.assistsAverage:
			return formatRosterAverage(value);
		case ROSTER_COLUMN.winRate:
			return formatRosterWinRate(value);
		default: {
			const _exhaustive: never = column;
			return _exhaustive;
		}
	}
}

export const ROSTER_STAT_COLUMN_OPTIONS = ROSTER_STAT_COLUMNS.map((id) => ({
	id,
	label: ROSTER_COLUMN_LABEL[id],
}));

export const ROSTER_COLUMN_IDS = [
	ROSTER_COLUMN.player,
	ROSTER_COLUMN.rating,
	...ROSTER_STAT_COLUMNS,
] as const;

export const ROSTER_LEGEND_ITEMS = ROSTER_COLUMN_IDS.map((id) => ({
	id,
	abbr: ROSTER_COLUMN_ABBR[id],
	label: ROSTER_COLUMN_LABEL[id],
}));
