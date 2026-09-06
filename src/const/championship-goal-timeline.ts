import type { ChampionshipEvent } from "../types/championship-event.ts";
import type { TrendsPlayerScope } from "./championship-trends-player-scope.ts";
import {
	trendsScopedEndedMatches,
	trendsScopedGoalCount,
} from "./championship-trends-player-scope.ts";
import type { TrendLineChartPoint } from "./championship-trend-line-chart.ts";
import { averageOrZero } from "./player-rating.ts";
import {
	formatRosterAverage,
	formatRosterCount,
	formatRosterWinRate,
	rosterWinRate,
} from "./roster-stats.ts";

export const GOAL_TIMELINE_BUCKET_COUNT = 3 as const;

export const GOAL_TIMELINE_MIN_COVERAGE = 0.5 as const;

export const GOAL_TIMELINE_LABEL = {
	title: "Timeline de gols",
	empty: "Poucos gols com minuto na janela",
	hint: "Faixas relativas à duração da partida. Some se a cobertura de minuto for baixa.",
	coverage: "Cobertura de minuto",
	avgFirstGoal: "Tempo médio até o 1º gol",
	lateShare: "Gols no terço final",
	bucketEarly: "Início",
	bucketMid: "Meio",
	bucketLate: "Final",
} as const;

export type GoalTimelineBucket = {
	index: number;
	label: string;
	goals: number;
	share: number;
};

export type GoalTimelineSummary = {
	totalGoals: number;
	timedGoals: number;
	coverage: number;
	enoughCoverage: boolean;
	averageFirstGoalSeconds: number | null;
	lateShare: number;
	buckets: GoalTimelineBucket[];
};

function bucketLabel(index: number): string {
	switch (index) {
		case 0:
			return GOAL_TIMELINE_LABEL.bucketEarly;
		case 1:
			return GOAL_TIMELINE_LABEL.bucketMid;
		case 2:
			return GOAL_TIMELINE_LABEL.bucketLate;
		default:
			return GOAL_TIMELINE_LABEL.bucketMid;
	}
}

function goalBucketIndex(elapsedSeconds: number, durationSeconds: number): number {
	if (durationSeconds <= 0) {
		return 0;
	}

	const ratio = elapsedSeconds / durationSeconds;
	if (ratio < 1 / GOAL_TIMELINE_BUCKET_COUNT) {
		return 0;
	}

	if (ratio < 2 / GOAL_TIMELINE_BUCKET_COUNT) {
		return 1;
	}

	return 2;
}

function emptyBuckets(): GoalTimelineBucket[] {
	return Array.from({ length: GOAL_TIMELINE_BUCKET_COUNT }, (_, index) => ({
		index,
		label: bucketLabel(index),
		goals: 0,
		share: 0,
	}));
}

export function championshipGoalTimeline(
	events: readonly ChampionshipEvent[],
	playerIds: TrendsPlayerScope = null,
): GoalTimelineSummary {
	const bucketCounts = [0, 0, 0];
	let totalGoals = 0;
	let timedGoals = 0;
	let firstGoalSum = 0;
	let firstGoalCount = 0;

	for (const event of events) {
		if (event.ended_at === null) {
			continue;
		}

		const endedMatches = trendsScopedEndedMatches(event, playerIds);
		for (const match of endedMatches) {
			totalGoals += trendsScopedGoalCount(match.goals, playerIds);

			const timed = match.goals.flatMap((goal) => {
				if (goal.elapsed_seconds === null) {
					return [];
				}

				if (playerIds !== null && !playerIds.has(goal.scorer_player_id)) {
					return [];
				}

				return [goal.elapsed_seconds];
			});
			timedGoals += timed.length;

			const first = timed.reduce<number | null>((min, seconds) => {
				if (min === null || seconds < min) {
					return seconds;
				}

				return min;
			}, null);
			if (first !== null) {
				firstGoalSum += first;
				firstGoalCount += 1;
			}

			for (const seconds of timed) {
				const index = goalBucketIndex(seconds, match.duration_seconds);
				bucketCounts[index] = (bucketCounts[index] ?? 0) + 1;
			}
		}
	}

	const coverage = rosterWinRate(timedGoals, totalGoals);
	const buckets = emptyBuckets().map((bucket) => {
		const goals = bucketCounts[bucket.index] ?? 0;
		return {
			...bucket,
			goals,
			share: rosterWinRate(goals, timedGoals),
		};
	});
	const lateGoals = bucketCounts[2] ?? 0;

	return {
		totalGoals,
		timedGoals,
		coverage,
		enoughCoverage: coverage >= GOAL_TIMELINE_MIN_COVERAGE && timedGoals > 0,
		averageFirstGoalSeconds: firstGoalAverageSeconds(
			firstGoalSum,
			firstGoalCount,
		),
		lateShare: rosterWinRate(lateGoals, timedGoals),
		buckets,
	};
}

function firstGoalAverageSeconds(
	sum: number,
	count: number,
): number | null {
	if (count <= 0) {
		return null;
	}

	return averageOrZero(sum, count);
}

export function championshipGoalTimelineChart(
	summary: GoalTimelineSummary,
): TrendLineChartPoint[] {
	if (!summary.enoughCoverage) {
		return [];
	}

	return summary.buckets.map((bucket) => ({
		x: bucket.index,
		startsAt: bucket.label,
		value: bucket.goals,
		label: formatRosterCount(bucket.goals),
	}));
}

export function formatGoalTimelineCoverage(summary: GoalTimelineSummary): string {
	return formatRosterWinRate(summary.coverage);
}

export function formatGoalTimelineLateShare(summary: GoalTimelineSummary): string {
	return formatRosterWinRate(summary.lateShare);
}

export function formatGoalTimelineFirstGoal(
	summary: GoalTimelineSummary,
): string {
	if (summary.averageFirstGoalSeconds === null) {
		return "—";
	}

	return `${formatRosterAverage(summary.averageFirstGoalSeconds / 60)} min`;
}
