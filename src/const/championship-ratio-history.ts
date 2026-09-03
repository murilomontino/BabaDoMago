import {
	type ChampionshipRatingHistoryChart,
	type ChampionshipRatingHistoryPlayer,
	championshipHistoryChartRow,
	championshipHistoryPlayerAttended,
	championshipHistorySeries,
	endedChampionshipHistoryEvents,
} from "./championship-rating-history.ts";
import type { PlayerProfileEventInput } from "./player-profile.ts";
import {
	ROSTER_COLUMN,
	rosterAverage,
	rosterSafeCount,
	rosterWinRate,
} from "./roster-stats.ts";

export const CHAMPIONSHIP_RATIO_HISTORY_METRICS = [
	ROSTER_COLUMN.goalsAverage,
	ROSTER_COLUMN.assistsAverage,
	ROSTER_COLUMN.winRate,
] as const;

export type ChampionshipRatioHistoryMetric =
	(typeof CHAMPIONSHIP_RATIO_HISTORY_METRICS)[number];

type RatioAttendance = PlayerProfileEventInput["attendance"][number];

type RatioWalk = {
	numerator: number;
	matches: number;
	last: number | null;
	values: (number | null)[];
};

export function isChampionshipRatioHistoryMetric(
	metric: string,
): metric is ChampionshipRatioHistoryMetric {
	return CHAMPIONSHIP_RATIO_HISTORY_METRICS.some((id) => id === metric);
}

export function championshipRatioHistoryChart(
	players: readonly ChampionshipRatingHistoryPlayer[],
	events: readonly PlayerProfileEventInput[],
	metric: ChampionshipRatioHistoryMetric,
): ChampionshipRatingHistoryChart {
	const ended = endedChampionshipHistoryEvents(events);
	if (ended.length === 0) {
		return { rows: [], series: [] };
	}

	const seriesWithValues = players.flatMap((player) =>
		includeRatioSeries(player, ended, metric),
	);
	const rows = ended.map((event, index) =>
		championshipHistoryChartRow(
			index,
			event.starts_at,
			seriesWithValues,
			index,
		),
	);

	return {
		rows,
		series: seriesWithValues.map((item) => item.series),
	};
}

function includeRatioSeries(
	player: ChampionshipRatingHistoryPlayer,
	events: readonly PlayerProfileEventInput[],
	metric: ChampionshipRatioHistoryMetric,
) {
	if (!championshipHistoryPlayerAttended(events, player.id)) {
		return [];
	}

	return [
		{
			series: championshipHistorySeries(player),
			values: walkRatio(events, player.id, metric),
		},
	];
}

function walkRatio(
	events: readonly PlayerProfileEventInput[],
	playerId: number,
	metric: ChampionshipRatioHistoryMetric,
): (number | null)[] {
	return events.reduce<RatioWalk>(
		(state, event) => {
			const row = event.attendance.find(
				(attendance) => attendance.player_id === playerId,
			);
			if (!row) {
				return {
					numerator: state.numerator,
					matches: state.matches,
					last: state.last,
					values: [...state.values, state.last],
				};
			}

			const numerator = state.numerator + ratioNumerator(row, metric);
			const matches = state.matches + rosterSafeCount(row.matches);
			const last = ratioAfterAttendance(numerator, matches, metric);
			return {
				numerator,
				matches,
				last,
				values: [...state.values, last],
			};
		},
		{ numerator: 0, matches: 0, last: null, values: [] },
	).values;
}

function ratioAfterAttendance(
	numerator: number,
	matches: number,
	metric: ChampionshipRatioHistoryMetric,
): number | null {
	if (matches === 0) {
		return null;
	}

	switch (metric) {
		case ROSTER_COLUMN.goalsAverage:
		case ROSTER_COLUMN.assistsAverage:
			return rosterAverage(numerator, matches);
		case ROSTER_COLUMN.winRate:
			return rosterWinRate(numerator, matches);
		default: {
			const _never: never = metric;
			return _never;
		}
	}
}

function ratioNumerator(
	row: RatioAttendance,
	metric: ChampionshipRatioHistoryMetric,
): number {
	switch (metric) {
		case ROSTER_COLUMN.goalsAverage:
			return rosterSafeCount(row.goals);
		case ROSTER_COLUMN.assistsAverage:
			return rosterSafeCount(row.assists);
		case ROSTER_COLUMN.winRate:
			return rosterSafeCount(row.wins);
		default: {
			const _never: never = metric;
			return _never;
		}
	}
}
