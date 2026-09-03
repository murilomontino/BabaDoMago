import {
	championshipCountHistoryChart,
	isChampionshipCountHistoryMetric,
} from "./championship-count-history.ts";
import {
	CHAMPIONSHIP_RATING_HISTORY_LABEL,
	type ChampionshipRatingHistoryChart,
	type ChampionshipRatingHistoryPlayer,
	type ChampionshipRatingHistorySeries,
	championshipRatingHistoryChart,
} from "./championship-rating-history.ts";
import {
	championshipRatioHistoryChart,
	isChampionshipRatioHistoryMetric,
} from "./championship-ratio-history.ts";
import { formatEventRating } from "./event-rating-adjustment.ts";
import type { PlayerProfileEventInput } from "./player-profile.ts";
import {
	eventMatchesPodiumPeriod,
	formatPodiumMetric,
	isPodiumPlayerMetric,
	type PodiumMetricId,
	type PodiumMonth,
	type PodiumPlayerMetricId,
	type PodiumSemester,
} from "./podium.ts";
import { ROSTER_COLUMN } from "./roster-stats.ts";

export const CHAMPIONSHIP_METRIC_HISTORY_LABEL = {
	empty: CHAMPIONSHIP_RATING_HISTORY_LABEL.empty,
	emptyRatings: CHAMPIONSHIP_RATING_HISTORY_LABEL.emptyRatings,
	emptyStats: "Ainda sem estatística",
} as const;

export const CHAMPIONSHIP_METRIC_HISTORY_TITLE = {
	[ROSTER_COLUMN.rating]: CHAMPIONSHIP_RATING_HISTORY_LABEL.title,
	[ROSTER_COLUMN.goals]: "Evolução dos gols",
	[ROSTER_COLUMN.assists]: "Evolução das assistências",
	[ROSTER_COLUMN.assisted_goals]: "Evolução dos gols servidos",
	[ROSTER_COLUMN.own_goals]: "Evolução dos gols contra",
	[ROSTER_COLUMN.goalInvolvement]: "Evolução da participação em gols",
	[ROSTER_COLUMN.wins]: "Evolução das vitórias",
	[ROSTER_COLUMN.mvps]: "Evolução dos destaques",
	[ROSTER_COLUMN.matches]: "Evolução dos jogos",
	[ROSTER_COLUMN.goalsAverage]: "Evolução da média de gols",
	[ROSTER_COLUMN.assistsAverage]: "Evolução da média de assistências",
	[ROSTER_COLUMN.winRate]: "Evolução do WinRate",
} as const;

export const CHAMPIONSHIP_METRIC_HISTORY_Y = {
	min: 0,
	fallbackMax: 1,
	width: 36,
	winRateWidth: 44,
	winRateMax: 1,
} as const;

export function championshipPodiumHistoryChart(
	metric: PodiumPlayerMetricId,
	players: readonly ChampionshipRatingHistoryPlayer[],
	events: readonly PlayerProfileEventInput[],
	nowIso: string | null,
): ChampionshipRatingHistoryChart {
	if (metric === ROSTER_COLUMN.rating) {
		return championshipRatingHistoryChart(players, events, nowIso);
	}

	if (isChampionshipCountHistoryMetric(metric)) {
		return championshipCountHistoryChart(players, events, metric);
	}

	if (isChampionshipRatioHistoryMetric(metric)) {
		return championshipRatioHistoryChart(players, events, metric);
	}

	const _never: never = metric;
	return _never;
}

export function championshipPodiumHistoryMetric(
	metric: PodiumMetricId,
): PodiumPlayerMetricId | null {
	if (!isPodiumPlayerMetric(metric)) {
		return null;
	}

	return metric;
}

export function isChampionshipRatingHistoryMetric(
	metric: PodiumPlayerMetricId,
): boolean {
	return metric === ROSTER_COLUMN.rating;
}

export function championshipMetricHistoryTitle(
	metric: PodiumPlayerMetricId,
): string {
	return CHAMPIONSHIP_METRIC_HISTORY_TITLE[metric];
}

export function championshipMetricHistoryEmptyLabel(
	chart: ChampionshipRatingHistoryChart,
	metric: PodiumPlayerMetricId,
): string | null {
	if (chart.rows.length === 0) {
		return CHAMPIONSHIP_METRIC_HISTORY_LABEL.empty;
	}

	if (chart.series.length > 0) {
		return null;
	}

	if (metric === ROSTER_COLUMN.rating) {
		return CHAMPIONSHIP_METRIC_HISTORY_LABEL.emptyRatings;
	}

	return CHAMPIONSHIP_METRIC_HISTORY_LABEL.emptyStats;
}

export function championshipMetricHistoryFormat(
	metric: PodiumPlayerMetricId,
	value: number,
): string {
	if (metric === ROSTER_COLUMN.rating) {
		return formatEventRating(value);
	}

	return formatPodiumMetric(metric, value);
}

export function championshipMetricHistoryYDomain(
	metric: PodiumPlayerMetricId,
	chart: ChampionshipRatingHistoryChart,
	ratingCeiling: number,
): [number, number] {
	if (metric === ROSTER_COLUMN.rating) {
		return [CHAMPIONSHIP_METRIC_HISTORY_Y.min, ratingCeiling];
	}

	if (metric === ROSTER_COLUMN.winRate) {
		return [
			CHAMPIONSHIP_METRIC_HISTORY_Y.min,
			CHAMPIONSHIP_METRIC_HISTORY_Y.winRateMax,
		];
	}

	return [
		CHAMPIONSHIP_METRIC_HISTORY_Y.min,
		championshipMetricHistoryYMax(chart),
	];
}

export function championshipMetricHistoryYAxisWidth(
	metric: PodiumPlayerMetricId,
): number {
	if (metric === ROSTER_COLUMN.winRate) {
		return CHAMPIONSHIP_METRIC_HISTORY_Y.winRateWidth;
	}

	return CHAMPIONSHIP_METRIC_HISTORY_Y.width;
}

export function championshipMetricHistoryNowIso(
	metric: PodiumPlayerMetricId,
	nowIso: string,
	year: number,
	semester: PodiumSemester | null,
	months: readonly PodiumMonth[],
): string | null {
	if (metric !== ROSTER_COLUMN.rating) {
		return null;
	}

	if (!eventMatchesPodiumPeriod(nowIso, year, semester, months)) {
		return null;
	}

	return nowIso;
}

export function championshipMetricHistoryYMax(
	chart: ChampionshipRatingHistoryChart,
): number {
	const values = chart.rows.flatMap((row) =>
		chart.series.flatMap((item) => rowMetricValue(row, item)),
	);
	const max = Math.max(CHAMPIONSHIP_METRIC_HISTORY_Y.min, ...values);
	if (max <= CHAMPIONSHIP_METRIC_HISTORY_Y.min) {
		return CHAMPIONSHIP_METRIC_HISTORY_Y.fallbackMax;
	}

	return max;
}

function rowMetricValue(
	row: ChampionshipRatingHistoryChart["rows"][number],
	series: ChampionshipRatingHistorySeries,
): number[] {
	const value = row[series.dataKey];
	if (typeof value !== "number") {
		return [];
	}

	return [value];
}
