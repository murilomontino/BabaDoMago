import type { ChampionshipEvent } from "../types/championship-event.ts";
import { matchClockElapsedSeconds } from "./championship-event-match.ts";
import {
	formatRosterAverage,
	formatRosterCount,
	rosterAverage,
	rosterWinRate,
} from "./roster-stats.ts";
import {
	championshipTeamBalance,
	eventTeamBalance,
	formatTeamBalanceSpread,
	formatTeamBalanceWinRate,
	TEAM_BALANCE_LABEL,
} from "./team-balance-stats.ts";

export const EVENT_HEALTH_METRIC = {
	matches: "matches",
	goalsPerMatch: "goalsPerMatch",
	playedMinutes: "playedMinutes",
	spread: "spread",
	favoriteRate: "favoriteRate",
} as const;

export type EventHealthMetric =
	(typeof EVENT_HEALTH_METRIC)[keyof typeof EVENT_HEALTH_METRIC];

export const EVENT_HEALTH_METRIC_DEFAULT = EVENT_HEALTH_METRIC.spread;

export const EVENT_HEALTH_LABEL = {
	title: "Saúde da rodada",
	empty: "Nenhuma rodada na janela",
	hint: "Tempo jogado usa o cronômetro, não a duração configurada.",
	filter: "Métrica",
	[EVENT_HEALTH_METRIC.matches]: "Partidas",
	[EVENT_HEALTH_METRIC.goalsPerMatch]: "Gols / jogo",
	[EVENT_HEALTH_METRIC.playedMinutes]: "Minutos jogados",
	[EVENT_HEALTH_METRIC.spread]: TEAM_BALANCE_LABEL.spread,
	[EVENT_HEALTH_METRIC.favoriteRate]: TEAM_BALANCE_LABEL.favorite,
	avgMatches: "Média de partidas",
	avgSpread: TEAM_BALANCE_LABEL.spread,
	avgFavorite: TEAM_BALANCE_LABEL.favorite,
} as const;

export const EVENT_HEALTH_METRIC_HINT = {
	[EVENT_HEALTH_METRIC.matches]:
		"Quantas partidas encerradas cada rodada teve.",
	[EVENT_HEALTH_METRIC.goalsPerMatch]:
		"Média de gols marcados por partida na rodada.",
	[EVENT_HEALTH_METRIC.playedMinutes]:
		"Média de minutos no cronômetro por partida. Não usa a duração configurada.",
	[EVENT_HEALTH_METRIC.spread]:
		"Diferença prevista de nota entre o time mais forte e o mais fraco no sorteio.",
	[EVENT_HEALTH_METRIC.favoriteRate]:
		"Taxa cumulativa: com que frequência o favorito do sorteio terminou na frente.",
} as const;

export const EVENT_HEALTH_METRIC_OPTIONS = [
	EVENT_HEALTH_METRIC.matches,
	EVENT_HEALTH_METRIC.goalsPerMatch,
	EVENT_HEALTH_METRIC.playedMinutes,
	EVENT_HEALTH_METRIC.spread,
	EVENT_HEALTH_METRIC.favoriteRate,
] as const;

export const EVENT_HEALTH_CHART = {
	height: 280,
	indexKey: "x",
	valueKey: "value",
	labelKey: "label",
	margin: { top: 32, right: 28, bottom: 8, left: 0 },
	axisWidth: 44,
	labelFontSize: 12,
	labelOffset: 12,
	dotRadius: 4,
} as const;

export type EventHealthRow = {
	eventId: number;
	startsAt: string;
	matches: number;
	goalsPerMatch: number;
	playedSeconds: number;
	spread: number;
	favoriteWon: boolean | null;
};

export type EventHealthSummary = {
	events: number;
	averageMatches: number;
	averageSpread: number;
	favoriteWinRate: number;
	rows: EventHealthRow[];
};

export type EventHealthChartPoint = {
	x: number;
	startsAt: string;
	value: number;
	label: string;
};

export function isEventHealthMetric(value: string): value is EventHealthMetric {
	return EVENT_HEALTH_METRIC_OPTIONS.some((option) => option === value);
}

export function parseEventHealthMetric(value: string): EventHealthMetric {
	if (isEventHealthMetric(value)) {
		return value;
	}

	return EVENT_HEALTH_METRIC_DEFAULT;
}

export function eventHealthMetricCaption(metric: EventHealthMetric): string {
	return EVENT_HEALTH_LABEL[metric];
}

export function eventHealthMetricHint(metric: EventHealthMetric): string {
	return EVENT_HEALTH_METRIC_HINT[metric];
}

export function championshipEventHealth(
	events: readonly ChampionshipEvent[],
): EventHealthSummary {
	const rows = events.flatMap((event) => {
		if (event.ended_at === null) {
			return [];
		}

		const endedMatches = event.matches.filter(
			(match) => match.ended_at !== null,
		);
		if (endedMatches.length === 0) {
			return [];
		}

		const goals = endedMatches.reduce(
			(sum, match) => sum + match.goals.length,
			0,
		);
		const playedSecondsTotal = endedMatches.reduce((sum, match) => {
			const endedAtMs = Date.parse(match.ended_at ?? "");
			return sum + matchClockElapsedSeconds(match, endedAtMs);
		}, 0);
		const balance = eventTeamBalance(event);

		return [
			{
				eventId: event.id,
				startsAt: event.starts_at,
				matches: endedMatches.length,
				goalsPerMatch: rosterAverage(goals, endedMatches.length),
				playedSeconds: rosterAverage(playedSecondsTotal, endedMatches.length),
				spread: balance?.spread ?? 0,
				favoriteWon: balance?.favoriteWon ?? null,
			},
		];
	});

	const balanceSummary = championshipTeamBalance(events);

	return {
		events: rows.length,
		averageMatches: rosterAverage(
			rows.reduce((sum, row) => sum + row.matches, 0),
			rows.length,
		),
		averageSpread: balanceSummary.averageSpread,
		favoriteWinRate: balanceSummary.favoriteWinRate,
		rows,
	};
}

export function championshipEventHealthChart(
	summary: EventHealthSummary,
	metric: EventHealthMetric,
): EventHealthChartPoint[] {
	if (metric === EVENT_HEALTH_METRIC.favoriteRate) {
		return cumulativeFavoriteRate(summary.rows, metric);
	}

	return summary.rows.map((row, index) => {
		const value = eventHealthMetricValue(row, metric);
		return {
			x: index,
			startsAt: row.startsAt,
			value,
			label: formatEventHealthChartValue(metric, value),
		};
	});
}

export function formatEventHealthKpi(
	kind: "matches" | "spread" | "favorite",
	summary: EventHealthSummary,
): string {
	switch (kind) {
		case "matches":
			return formatRosterAverage(summary.averageMatches);
		case "spread":
			return formatTeamBalanceSpread(summary.averageSpread);
		case "favorite":
			return formatTeamBalanceWinRate(summary.favoriteWinRate);
		default: {
			const _never: never = kind;
			return _never;
		}
	}
}

export function formatEventHealthChartValue(
	metric: EventHealthMetric,
	value: number,
): string {
	switch (metric) {
		case EVENT_HEALTH_METRIC.matches:
			return formatRosterCount(value);
		case EVENT_HEALTH_METRIC.goalsPerMatch:
			return formatRosterAverage(value);
		case EVENT_HEALTH_METRIC.playedMinutes:
			return formatRosterAverage(value);
		case EVENT_HEALTH_METRIC.spread:
			return formatTeamBalanceSpread(value);
		case EVENT_HEALTH_METRIC.favoriteRate:
			return formatTeamBalanceWinRate(value);
		default: {
			const _never: never = metric;
			return _never;
		}
	}
}

function eventHealthMetricValue(
	row: EventHealthRow,
	metric: Exclude<EventHealthMetric, "favoriteRate">,
): number {
	switch (metric) {
		case EVENT_HEALTH_METRIC.matches:
			return row.matches;
		case EVENT_HEALTH_METRIC.goalsPerMatch:
			return row.goalsPerMatch;
		case EVENT_HEALTH_METRIC.playedMinutes:
			return row.playedSeconds / 60;
		case EVENT_HEALTH_METRIC.spread:
			return row.spread;
		default: {
			const _never: never = metric;
			return _never;
		}
	}
}

function cumulativeFavoriteRate(
	rows: readonly EventHealthRow[],
	metric: EventHealthMetric,
): EventHealthChartPoint[] {
	return rows.reduce<{
		decided: number;
		won: number;
		points: EventHealthChartPoint[];
	}>(
		(state, row, index) => {
			const decided = state.decided + Number(row.favoriteWon !== null);
			const won = state.won + Number(row.favoriteWon === true);
			const value = rosterWinRate(won, decided);
			return {
				decided,
				won,
				points: [
					...state.points,
					{
						x: index,
						startsAt: row.startsAt,
						value,
						label: formatEventHealthChartValue(metric, value),
					},
				],
			};
		},
		{ decided: 0, won: 0, points: [] },
	).points;
}
