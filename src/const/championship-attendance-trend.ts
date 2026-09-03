import type { ChampionshipEvent } from "../types/championship-event.ts";
import { endedChampionshipHistoryEvents } from "./championship-rating-history.ts";
import type { TrendLineChartPoint } from "./championship-trend-line-chart.ts";
import {
	formatRosterAverage,
	formatRosterCount,
	formatRosterWinRate,
	rosterAverage,
} from "./roster-stats.ts";

export const ATTENDANCE_TREND_METRIC = {
	count: "count",
	share: "share",
} as const;

export type AttendanceTrendMetric =
	(typeof ATTENDANCE_TREND_METRIC)[keyof typeof ATTENDANCE_TREND_METRIC];

export const ATTENDANCE_TREND_METRIC_DEFAULT =
	ATTENDANCE_TREND_METRIC.count;

export const ATTENDANCE_TREND_LABEL = {
	title: "Presença no tempo",
	empty: "Nenhuma rodada encerrada com presença",
	hint: "Cada ponto é uma rodada. % = presentes / elenco ativo.",
	filter: "Métrica",
	avgPresent: "Média presente",
	avgShare: "Média do elenco",
	[ATTENDANCE_TREND_METRIC.count]: "Presentes",
	[ATTENDANCE_TREND_METRIC.share]: "% do elenco",
} as const;

export const ATTENDANCE_TREND_METRIC_OPTIONS = [
	ATTENDANCE_TREND_METRIC.count,
	ATTENDANCE_TREND_METRIC.share,
] as const;

export type AttendanceTrendRow = {
	eventId: number;
	startsAt: string;
	presentCount: number;
	rosterShare: number;
};

export type AttendanceTrendSummary = {
	events: number;
	averagePresent: number;
	averageShare: number;
	rows: AttendanceTrendRow[];
};

export function isAttendanceTrendMetric(
	value: string,
): value is AttendanceTrendMetric {
	return ATTENDANCE_TREND_METRIC_OPTIONS.some((option) => option === value);
}

export function parseAttendanceTrendMetric(
	value: string,
): AttendanceTrendMetric {
	if (isAttendanceTrendMetric(value)) {
		return value;
	}

	return ATTENDANCE_TREND_METRIC_DEFAULT;
}

export function attendanceTrendMetricCaption(
	metric: AttendanceTrendMetric,
): string {
	return ATTENDANCE_TREND_LABEL[metric];
}

export function championshipAttendanceTrend(
	events: readonly ChampionshipEvent[],
	rosterSize: number,
): AttendanceTrendSummary {
	const rows = endedChampionshipHistoryEvents(events).flatMap((event) => {
		const presentCount = event.attendance.length;
		if (presentCount === 0) {
			return [];
		}

		return [
			{
				eventId: event.id,
				startsAt: event.starts_at,
				presentCount,
				rosterShare: rosterShare(presentCount, rosterSize),
			},
		];
	});

	const presentTotal = rows.reduce((sum, row) => sum + row.presentCount, 0);
	const shareTotal = rows.reduce((sum, row) => sum + row.rosterShare, 0);

	return {
		events: rows.length,
		averagePresent: rosterAverage(presentTotal, rows.length),
		averageShare: rosterAverage(shareTotal, rows.length),
		rows,
	};
}

export function championshipAttendanceTrendChart(
	summary: AttendanceTrendSummary,
	metric: AttendanceTrendMetric,
): TrendLineChartPoint[] {
	return summary.rows.map((row, index) => {
		const value = attendanceTrendMetricValue(row, metric);
		return {
			x: index,
			startsAt: row.startsAt,
			value,
			label: formatAttendanceTrendChartValue(metric, value),
		};
	});
}

export function formatAttendanceTrendKpi(
	metric: AttendanceTrendMetric,
	summary: AttendanceTrendSummary,
): string {
	switch (metric) {
		case ATTENDANCE_TREND_METRIC.count:
			return formatRosterAverage(summary.averagePresent);
		case ATTENDANCE_TREND_METRIC.share:
			return formatRosterWinRate(summary.averageShare);
		default: {
			const _never: never = metric;
			return _never;
		}
	}
}

export function formatAttendanceTrendChartValue(
	metric: AttendanceTrendMetric,
	value: number,
): string {
	switch (metric) {
		case ATTENDANCE_TREND_METRIC.count:
			return formatRosterCount(value);
		case ATTENDANCE_TREND_METRIC.share:
			return formatRosterWinRate(value);
		default: {
			const _never: never = metric;
			return _never;
		}
	}
}

function attendanceTrendMetricValue(
	row: AttendanceTrendRow,
	metric: AttendanceTrendMetric,
): number {
	switch (metric) {
		case ATTENDANCE_TREND_METRIC.count:
			return row.presentCount;
		case ATTENDANCE_TREND_METRIC.share:
			return row.rosterShare;
		default: {
			const _never: never = metric;
			return _never;
		}
	}
}

function rosterShare(presentCount: number, rosterSize: number): number {
	if (rosterSize <= 0) {
		return 0;
	}

	return presentCount / rosterSize;
}
