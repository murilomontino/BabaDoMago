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
	actions: "Ações",
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

export type RosterRow = ChampionshipPlayer & {
	goalInvolvement: number;
	goalsAverage: number;
	assistsAverage: number;
	winRate: number;
};

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

export function toRosterRow(player: ChampionshipPlayer): RosterRow {
	const goals = rosterSafeCount(player.goals);
	const assists = rosterSafeCount(player.assists);
	const wins = rosterSafeCount(player.wins);
	const matches = rosterSafeCount(player.matches);

	return {
		...player,
		goals,
		assists,
		wins,
		matches,
		goalInvolvement: rosterGoalInvolvement(goals, assists),
		goalsAverage: rosterAverage(goals, matches),
		assistsAverage: rosterAverage(assists, matches),
		winRate: rosterWinRate(wins, matches),
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

export const ROSTER_STAT_COLUMN_OPTIONS = ROSTER_STAT_COLUMNS.map((id) => ({
	id,
	label: ROSTER_COLUMN_LABEL[id],
}));

export const ROSTER_COLUMN_IDS = [
	ROSTER_COLUMN.player,
	...ROSTER_STAT_COLUMNS,
] as const;

export const ROSTER_LEGEND_ITEMS = ROSTER_COLUMN_IDS.map((id) => ({
	id,
	abbr: ROSTER_COLUMN_ABBR[id],
	label: ROSTER_COLUMN_LABEL[id],
}));
