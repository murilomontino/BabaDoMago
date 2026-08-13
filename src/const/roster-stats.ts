import type { ChampionshipPlayer } from "@/types/championship";

export const ROSTER_COLUMN = {
	player: "player",
	goals: "goals",
	assists: "assists",
	goalInvolvement: "goalInvolvement",
	wins: "wins",
	matches: "matches",
	goalsAverage: "goalsAverage",
	assistsAverage: "assistsAverage",
	winRate: "winRate",
	actions: "actions",
} as const;

export type RosterColumnId = (typeof ROSTER_COLUMN)[keyof typeof ROSTER_COLUMN];

export const ROSTER_COLUMN_ABBR = {
	player: "Jog",
	goals: "G",
	assists: "A",
	goalInvolvement: "PG",
	wins: "V",
	matches: "J",
	goalsAverage: "MG",
	assistsAverage: "MA",
	winRate: "WR",
	actions: "Aç",
} as const;

export const ROSTER_COLUMN_LABEL = {
	player: "Jogador",
	goals: "Gols",
	assists: "Assistências",
	goalInvolvement: "Participação em Gols",
	wins: "Vitórias",
	matches: "Jogos",
	goalsAverage: "Média de Gols",
	assistsAverage: "Média de Assistências",
	winRate: "WinRate",
	actions: "Ações",
} as const;

export const ROSTER_STAT_COLUMNS = [
	ROSTER_COLUMN.goals,
	ROSTER_COLUMN.assists,
	ROSTER_COLUMN.goalInvolvement,
	ROSTER_COLUMN.wins,
	ROSTER_COLUMN.matches,
	ROSTER_COLUMN.goalsAverage,
	ROSTER_COLUMN.assistsAverage,
	ROSTER_COLUMN.winRate,
] as const;

export type RosterStatColumnId = (typeof ROSTER_STAT_COLUMNS)[number];

export const EMPTY_ROSTER_STATS = {
	goals: 0,
	assists: 0,
	wins: 0,
	matches: 0,
} as const;

export type RosterStatsInput = {
	goals: number;
	assists: number;
	wins: number;
	matches: number;
};

export type RosterRow = ChampionshipPlayer & {
	goals: number;
	assists: number;
	goalInvolvement: number;
	wins: number;
	matches: number;
	goalsAverage: number;
	assistsAverage: number;
	winRate: number;
};

export function rosterGoalInvolvement(goals: number, assists: number): number {
	return goals + assists;
}

export function rosterAverage(value: number, matches: number): number {
	if (matches === 0) {
		return 0;
	}

	return value / matches;
}

export function rosterWinRate(wins: number, matches: number): number {
	if (matches === 0) {
		return 0;
	}

	return wins / matches;
}

export function toRosterRow(
	player: ChampionshipPlayer,
	stats: RosterStatsInput = EMPTY_ROSTER_STATS,
): RosterRow {
	return {
		...player,
		goals: stats.goals,
		assists: stats.assists,
		goalInvolvement: rosterGoalInvolvement(stats.goals, stats.assists),
		wins: stats.wins,
		matches: stats.matches,
		goalsAverage: rosterAverage(stats.goals, stats.matches),
		assistsAverage: rosterAverage(stats.assists, stats.matches),
		winRate: rosterWinRate(stats.wins, stats.matches),
	};
}

export function formatRosterCount(value: number): string {
	return String(value);
}

export function formatRosterAverage(value: number): string {
	return value.toFixed(1);
}

export function formatRosterWinRate(value: number): string {
	return `${Math.round(value * 100)}%`;
}

export const ROSTER_STAT_COLUMN_OPTIONS = ROSTER_STAT_COLUMNS.map((id) => ({
	id,
	label: ROSTER_COLUMN_LABEL[id],
}));

export const ROSTER_COLUMN_IDS = [
	ROSTER_COLUMN.player,
	...ROSTER_STAT_COLUMNS,
	ROSTER_COLUMN.actions,
] as const;

export const ROSTER_LEGEND_ITEMS = ROSTER_COLUMN_IDS.map((id) => ({
	id,
	abbr: ROSTER_COLUMN_ABBR[id],
	label: ROSTER_COLUMN_LABEL[id],
}));
