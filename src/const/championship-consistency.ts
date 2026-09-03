import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	championshipRatingChartColor,
	endedChampionshipHistoryEvents,
} from "./championship-rating-history.ts";
import { playerVisibleName } from "./player-name.ts";
import { rosterAverage, rosterSafeCount } from "./roster-stats.ts";

// ponytail: desvio com n=3 é ruidoso. Upgrade: exigir 5 presenças quando a liga crescer.
export const CONSISTENCY_MIN_PRESENCES = 3 as const;

export const CONSISTENCY_METRIC = {
	goalsPerMatch: "goalsPerMatch",
	assistsPerMatch: "assistsPerMatch",
	goalInvolvementPerMatch: "goalInvolvementPerMatch",
	ratingDelta: "ratingDelta",
} as const;

export type ConsistencyMetric =
	(typeof CONSISTENCY_METRIC)[keyof typeof CONSISTENCY_METRIC];

export const CONSISTENCY_METRIC_DEFAULT = CONSISTENCY_METRIC.goalsPerMatch;

export const CONSISTENCY_LABEL = {
	title: "Consistência × volume",
	empty: "Precisa de pelo menos 3 presenças",
	hint: "Canto inferior: estável. Direita alta: irregular. Esquerda: pouco volume.",
	filter: "Métrica",
	[CONSISTENCY_METRIC.goalsPerMatch]: "Gols / jogo",
	[CONSISTENCY_METRIC.assistsPerMatch]: "Assistências / jogo",
	[CONSISTENCY_METRIC.goalInvolvementPerMatch]: "Participação em gols / jogo",
	[CONSISTENCY_METRIC.ratingDelta]: "Delta da nota",
	volume: "Jogos",
	deviation: "Desvio",
	mean: "Média",
	presences: "Presenças",
} as const;

export const CONSISTENCY_METRIC_OPTIONS = [
	CONSISTENCY_METRIC.goalsPerMatch,
	CONSISTENCY_METRIC.assistsPerMatch,
	CONSISTENCY_METRIC.goalInvolvementPerMatch,
	CONSISTENCY_METRIC.ratingDelta,
] as const;

export const CONSISTENCY_CHART = {
	height: 280,
	volumeKey: "volume",
	deviationKey: "deviation",
	nameKey: "name",
	dotRadius: 5,
	labelOffset: 8,
	labelFontSize: 11,
	margin: { top: 24, right: 28, bottom: 24, left: 0 },
	domainPad: 0.5,
	axisWidth: 36,
	fallbackMax: 1,
} as const;

export type ConsistencyPoint = {
	playerId: number;
	name: string;
	avatarUrl: string | null;
	color: string;
	volume: number;
	deviation: number;
	mean: number;
	presences: number;
};

export function isConsistencyMetric(value: string): value is ConsistencyMetric {
	return CONSISTENCY_METRIC_OPTIONS.some((option) => option === value);
}

export function parseConsistencyMetric(value: string): ConsistencyMetric {
	if (isConsistencyMetric(value)) {
		return value;
	}

	return CONSISTENCY_METRIC_DEFAULT;
}

export function consistencyMetricCaption(metric: ConsistencyMetric): string {
	return CONSISTENCY_LABEL[metric];
}

export function championshipConsistencyPoints(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
	metric: ConsistencyMetric,
): ConsistencyPoint[] {
	const ended = endedChampionshipHistoryEvents(events);

	return players.flatMap((player) => {
		const samples = ended.flatMap((event) => {
			const row = event.attendance.find(
				(attendance) => attendance.player_id === player.id,
			);
			if (!row) {
				return [];
			}

			return [sampleValue(row, metric)];
		});
		if (samples.length < CONSISTENCY_MIN_PRESENCES) {
			return [];
		}

		const volume = ended.reduce((sum, event) => {
			const row = event.attendance.find(
				(attendance) => attendance.player_id === player.id,
			);
			if (!row) {
				return sum;
			}

			return sum + rosterSafeCount(row.matches);
		}, 0);

		return [
			{
				playerId: player.id,
				name: playerVisibleName(player),
				avatarUrl: player.avatar_url,
				color: championshipRatingChartColor(player.id),
				volume,
				deviation: sampleStdDev(samples),
				mean: rosterAverage(
					samples.reduce((sum, value) => sum + value, 0),
					samples.length,
				),
				presences: samples.length,
			},
		];
	});
}

export function championshipConsistencyEmptyLabel(
	points: readonly ConsistencyPoint[],
): string | null {
	if (points.length === 0) {
		return CONSISTENCY_LABEL.empty;
	}

	return null;
}

export function consistencyDomain(
	points: readonly ConsistencyPoint[],
	key: "volume" | "deviation",
): { min: number; max: number } {
	const values = points.map((point) => point[key]);
	if (values.length === 0) {
		return { min: 0, max: CONSISTENCY_CHART.fallbackMax };
	}

	const rawMax = Math.max(...values);
	const pad = CONSISTENCY_CHART.domainPad;
	return {
		min: 0,
		max: Math.max(pad, rawMax + pad),
	};
}

function sampleValue(
	row: {
		goals: number;
		assists: number;
		matches: number;
		rating_delta: number;
	},
	metric: ConsistencyMetric,
): number {
	switch (metric) {
		case CONSISTENCY_METRIC.ratingDelta:
			return row.rating_delta;
		case CONSISTENCY_METRIC.goalsPerMatch:
			return perMatch(rosterSafeCount(row.goals), row.matches);
		case CONSISTENCY_METRIC.assistsPerMatch:
			return perMatch(rosterSafeCount(row.assists), row.matches);
		case CONSISTENCY_METRIC.goalInvolvementPerMatch:
			return perMatch(
				rosterSafeCount(row.goals) + rosterSafeCount(row.assists),
				row.matches,
			);
		default: {
			const _never: never = metric;
			return _never;
		}
	}
}

function perMatch(value: number, matches: number): number {
	const safe = rosterSafeCount(matches);
	if (safe === 0) {
		return 0;
	}

	return value / safe;
}

function sampleStdDev(values: readonly number[]): number {
	if (values.length < 2) {
		return 0;
	}

	const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
	const variance =
		values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
		(values.length - 1);
	return Math.sqrt(variance);
}
