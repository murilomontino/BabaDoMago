import type { ChampionshipEvent } from "../types/championship-event.ts";
import type { TrendsPlayerScope } from "./championship-trends-player-scope.ts";
import {
	trendsScopedEndedMatches,
	trendsScopedGoalCount,
} from "./championship-trends-player-scope.ts";
import type { TrendLineChartPoint } from "./championship-trend-line-chart.ts";
import {
	formatRosterAverage,
	formatRosterCount,
	rosterAverage,
} from "./roster-stats.ts";

export const ROUND_GOALS_LABEL = {
	title: "Gols da rodada",
	empty: "Nenhuma rodada na janela",
	hint: "Total de gols marcados na rodada. Complementa gols/jogo em Saúde da rodada.",
	avgTotal: "Média de gols",
} as const;

export type RoundGoalsRow = {
	eventId: number;
	startsAt: string;
	totalGoals: number;
};

export type RoundGoalsSummary = {
	events: number;
	averageTotal: number;
	rows: RoundGoalsRow[];
};

export function championshipRoundGoals(
	events: readonly ChampionshipEvent[],
	playerIds: TrendsPlayerScope = null,
): RoundGoalsSummary {
	const rows = events.flatMap((event) => {
		if (event.ended_at === null) {
			return [];
		}

		const endedMatches = trendsScopedEndedMatches(event, playerIds);
		if (endedMatches.length === 0) {
			return [];
		}

		const totalGoals = endedMatches.reduce(
			(sum, match) => sum + trendsScopedGoalCount(match.goals, playerIds),
			0,
		);

		return [
			{
				eventId: event.id,
				startsAt: event.starts_at,
				totalGoals,
			},
		];
	});

	const goalsTotal = rows.reduce((sum, row) => sum + row.totalGoals, 0);

	return {
		events: rows.length,
		averageTotal: rosterAverage(goalsTotal, rows.length),
		rows,
	};
}

export function championshipRoundGoalsChart(
	summary: RoundGoalsSummary,
): TrendLineChartPoint[] {
	return summary.rows.map((row, index) => ({
		x: index,
		startsAt: row.startsAt,
		value: row.totalGoals,
		label: formatRoundGoalsChartValue(row.totalGoals),
	}));
}

export function formatRoundGoalsKpi(summary: RoundGoalsSummary): string {
	return formatRosterAverage(summary.averageTotal);
}

export function formatRoundGoalsChartValue(value: number): string {
	return formatRosterCount(value);
}
