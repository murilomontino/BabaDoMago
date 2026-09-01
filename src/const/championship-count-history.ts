import {
	type ChampionshipRatingHistoryChart,
	type ChampionshipRatingHistoryPlayer,
	championshipHistoryChartRow,
	championshipHistoryPlayerAttended,
	championshipHistorySeries,
	endedChampionshipHistoryEvents,
} from "./championship-rating-history.ts";
import { mvpCount } from "./event-mvp.ts";
import type { PlayerProfileEventInput } from "./player-profile.ts";
import {
	ROSTER_COLUMN,
	rosterGoalInvolvement,
	rosterSafeCount,
} from "./roster-stats.ts";

export const CHAMPIONSHIP_COUNT_HISTORY_METRICS = [
	ROSTER_COLUMN.goals,
	ROSTER_COLUMN.assists,
	ROSTER_COLUMN.assisted_goals,
	ROSTER_COLUMN.own_goals,
	ROSTER_COLUMN.goalInvolvement,
	ROSTER_COLUMN.wins,
	ROSTER_COLUMN.mvps,
	ROSTER_COLUMN.matches,
] as const;

export type ChampionshipCountHistoryMetric =
	(typeof CHAMPIONSHIP_COUNT_HISTORY_METRICS)[number];

type CountAttendance = PlayerProfileEventInput["attendance"][number];

type CumulativeWalk = {
	last: number | null;
	values: (number | null)[];
};

export function isChampionshipCountHistoryMetric(
	metric: string,
): metric is ChampionshipCountHistoryMetric {
	return CHAMPIONSHIP_COUNT_HISTORY_METRICS.some((id) => id === metric);
}

export function championshipCountHistoryChart(
	players: readonly ChampionshipRatingHistoryPlayer[],
	events: readonly PlayerProfileEventInput[],
	metric: ChampionshipCountHistoryMetric,
): ChampionshipRatingHistoryChart {
	const ended = endedChampionshipHistoryEvents(events);
	if (ended.length === 0) {
		return { rows: [], series: [] };
	}

	const seriesWithValues = players.flatMap((player) =>
		includeCountSeries(player, ended, metric),
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

function includeCountSeries(
	player: ChampionshipRatingHistoryPlayer,
	events: readonly PlayerProfileEventInput[],
	metric: ChampionshipCountHistoryMetric,
) {
	if (!championshipHistoryPlayerAttended(events, player.id)) {
		return [];
	}

	return [
		{
			series: championshipHistorySeries(player),
			values: walkCumulative(events, player.id, metric),
		},
	];
}

function walkCumulative(
	events: readonly PlayerProfileEventInput[],
	playerId: number,
	metric: ChampionshipCountHistoryMetric,
): (number | null)[] {
	return events.reduce<CumulativeWalk>(
		(state, event) => {
			const row = event.attendance.find(
				(attendance) => attendance.player_id === playerId,
			);
			if (!row) {
				return {
					last: state.last,
					values: [...state.values, state.last],
				};
			}

			const last = (state.last ?? 0) + attendanceCountDelta(row, metric);
			return {
				last,
				values: [...state.values, last],
			};
		},
		{ last: null, values: [] },
	).values;
}

function attendanceCountDelta(
	row: CountAttendance,
	metric: ChampionshipCountHistoryMetric,
): number {
	switch (metric) {
		case ROSTER_COLUMN.goals:
			return rosterSafeCount(row.goals);
		case ROSTER_COLUMN.assists:
			return rosterSafeCount(row.assists);
		case ROSTER_COLUMN.assisted_goals:
			return rosterSafeCount(row.assisted_goals);
		case ROSTER_COLUMN.own_goals:
			return rosterSafeCount(row.own_goals);
		case ROSTER_COLUMN.goalInvolvement:
			return rosterGoalInvolvement(row.goals, row.assists);
		case ROSTER_COLUMN.wins:
			return rosterSafeCount(row.wins);
		case ROSTER_COLUMN.mvps:
			return mvpCount(row.is_mvp === true);
		case ROSTER_COLUMN.matches:
			return rosterSafeCount(row.matches);
		default: {
			const _never: never = metric;
			return _never;
		}
	}
}
