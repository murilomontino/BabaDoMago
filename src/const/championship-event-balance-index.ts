import type { ChampionshipEvent } from "../types/championship-event.ts";
import { MATCH_PROJECTION_DEFAULT_SCALE } from "./championship-match-projection.ts";
import {
	isCloseMatch,
	matchGoalMargin,
} from "./match-goal-counts.ts";
import { averageOrZero } from "./player-rating.ts";
import {
	formatRosterAverage,
	formatRosterCount,
	formatRosterWinRate,
	rosterWinRate,
} from "./roster-stats.ts";
import {
	eventTeamBalance,
	formatTeamBalanceSpread,
	TEAM_BALANCE_LABEL,
} from "./team-balance-stats.ts";

export const BALANCE_INDEX_WEIGHTS = {
	predicted: 0.25,
	realized: 0.4,
	tightGames: 0.35,
} as const;

// ponytail: escalas heurísticas de produto. Calibrar com histórico real.
// Previsto alinha à escala de projeção; realizado assume margem ~3 gols no chão.
export const BALANCE_INDEX_SCALE = {
	predicted: MATCH_PROJECTION_DEFAULT_SCALE,
	realized: 3,
} as const;

export const BALANCE_INDEX_THRESHOLDS = {
	excellent: 90,
	veryBalanced: 75,
	balanced: 60,
	moderate: 40,
	unbalanced: 20,
} as const;

export const BALANCE_INDEX_CLASSIFICATION = {
	excellent: "excellent",
	veryBalanced: "very_balanced",
	balanced: "balanced",
	moderate: "moderate",
	unbalanced: "unbalanced",
	veryUnbalanced: "very_unbalanced",
} as const;

export type BalanceIndexClassification =
	(typeof BALANCE_INDEX_CLASSIFICATION)[keyof typeof BALANCE_INDEX_CLASSIFICATION];

export const BALANCE_INDEX_MIN_MATCHES_CONFIDENT = 2 as const;

export const BALANCE_GOAL_DIFF_BUCKET = {
	zero: "0",
	one: "1",
	two: "2",
	three: "3",
	fourPlus: "4+",
} as const;

export type BalanceGoalDiffBucket =
	(typeof BALANCE_GOAL_DIFF_BUCKET)[keyof typeof BALANCE_GOAL_DIFF_BUCKET];

export const BALANCE_GOAL_DIFF_BUCKET_ORDER = [
	BALANCE_GOAL_DIFF_BUCKET.zero,
	BALANCE_GOAL_DIFF_BUCKET.one,
	BALANCE_GOAL_DIFF_BUCKET.two,
	BALANCE_GOAL_DIFF_BUCKET.three,
	BALANCE_GOAL_DIFF_BUCKET.fourPlus,
] as const;

export const BALANCE_VS_PREDICTED = {
	moreBalanced: "more_balanced",
	lessBalanced: "less_balanced",
	equal: "equal",
	unavailable: "unavailable",
} as const;

export type BalanceVsPredicted =
	(typeof BALANCE_VS_PREDICTED)[keyof typeof BALANCE_VS_PREDICTED];

export const BALANCE_INDEX_LABEL = {
	title: "Equilíbrio da rodada",
	hint: "KPI coletivo da rodada. Não altera nota nem sorteio.",
	empty: "Ainda não há rodadas suficientes para calcular o equilíbrio.",
	emptyEvent: "Nenhuma partida encerrada nesta rodada.",
	incomplete: "Não foi possível calcular o índice completo desta rodada.",
	smallSample: "Amostra muito pequena",
	smallSampleHint: "O índice ficará mais confiável com mais partidas.",
	sampleInitial: "Amostra inicial.",
	composition: "Composição",
	predicted: "Previsto",
	realized: "Realizado",
	tightGames: "Jogos apertados",
	favorite: TEAM_BALANCE_LABEL.favorite,
	matches: "Partidas",
	index: "Índice",
	history: "Índice por rodada",
	distribution: "Diferença de gols",
	predictedVsRealized: "Previsto × Realizado",
	predictedMean: "Previsto médio",
	realizedMean: "Realizado médio",
	delta: "Diferença",
	overall: "Equilíbrio médio do campeonato",
	round: "Rodada",
	share: "Compartilhar equilíbrio",
	shareCsv: "Exportar CSV",
	sharing: "Gerando...",
	shareFailed: "Não foi possível compartilhar o equilíbrio",
	[BALANCE_INDEX_CLASSIFICATION.excellent]: "Excelente",
	[BALANCE_INDEX_CLASSIFICATION.veryBalanced]: "Muito equilibrada",
	[BALANCE_INDEX_CLASSIFICATION.balanced]: "Equilibrada",
	[BALANCE_INDEX_CLASSIFICATION.moderate]: "Moderada",
	[BALANCE_INDEX_CLASSIFICATION.unbalanced]: "Desequilibrada",
	[BALANCE_INDEX_CLASSIFICATION.veryUnbalanced]: "Muito desequilibrada",
	[BALANCE_VS_PREDICTED.moreBalanced]:
		"A rodada foi mais equilibrada do que o sorteio previa.",
	[BALANCE_VS_PREDICTED.lessBalanced]:
		"A rodada foi menos equilibrada do que o sorteio previa.",
	[BALANCE_VS_PREDICTED.equal]:
		"A diferença realizada ficou alinhada à diferença prevista.",
	[BALANCE_VS_PREDICTED.unavailable]:
		"Não foi possível comparar previsto e realizado.",
} as const;

export const BALANCE_INDEX_CHART = {
	height: 280,
	indexKey: "x",
	valueKey: "value",
	labelKey: "label",
	margin: { top: 32, right: 28, bottom: 8, left: 0 },
	axisWidth: 44,
	labelFontSize: 12,
	labelOffset: 12,
	dotRadius: 4,
	yDomain: [0, 100] as const,
} as const;

export type EventBalanceIndex = {
	eventId: number;
	eventStartsAt: string;
	matches: number;
	predictedMatchCount: number;
	predictedDifferenceMean: number | null;
	realizedDifferenceMean: number;
	tightGames: number;
	tightGameRate: number;
	predictedScore: number | null;
	realizedScore: number;
	tightGameScore: number;
	balanceIndex: number;
	classification: BalanceIndexClassification;
	incompletePredicted: boolean;
	smallSample: boolean;
	favoriteWon: boolean | null;
	vsPredicted: BalanceVsPredicted;
	predictedVsRealizedDelta: number | null;
};

export type ChampionshipBalanceOverall = {
	events: number;
	matches: number;
	predictedDifferenceMean: number | null;
	realizedDifferenceMean: number;
	tightGameRate: number;
	predictedScore: number | null;
	realizedScore: number;
	tightGameScore: number;
	balanceIndex: number;
	classification: BalanceIndexClassification;
	incompletePredicted: boolean;
};

export type ChampionshipBalanceIndex = {
	current: EventBalanceIndex | null;
	history: EventBalanceIndex[];
	overall: ChampionshipBalanceOverall | null;
};

export type BalanceGoalDiffBucketRow = {
	bucket: BalanceGoalDiffBucket;
	count: number;
};

export type BalanceHistoryChartPoint = {
	x: number;
	startsAt: string;
	value: number;
	label: string;
};

function clampScore(value: number): number {
	if (value < 0) {
		return 0;
	}

	if (value > 100) {
		return 100;
	}

	return value;
}

function roundScore(value: number): number {
	return Math.round(clampScore(value));
}

export function balanceDifferenceScore(
	meanDifference: number,
	scale: number,
): number {
	if (scale <= 0) {
		return 0;
	}

	return clampScore(100 * (1 - meanDifference / scale));
}

export function balanceIndexClassification(
	score: number,
): BalanceIndexClassification {
	if (score >= BALANCE_INDEX_THRESHOLDS.excellent) {
		return BALANCE_INDEX_CLASSIFICATION.excellent;
	}

	if (score >= BALANCE_INDEX_THRESHOLDS.veryBalanced) {
		return BALANCE_INDEX_CLASSIFICATION.veryBalanced;
	}

	if (score >= BALANCE_INDEX_THRESHOLDS.balanced) {
		return BALANCE_INDEX_CLASSIFICATION.balanced;
	}

	if (score >= BALANCE_INDEX_THRESHOLDS.moderate) {
		return BALANCE_INDEX_CLASSIFICATION.moderate;
	}

	if (score >= BALANCE_INDEX_THRESHOLDS.unbalanced) {
		return BALANCE_INDEX_CLASSIFICATION.unbalanced;
	}

	return BALANCE_INDEX_CLASSIFICATION.veryUnbalanced;
}

export function balanceIndexClassificationLabel(
	classification: BalanceIndexClassification,
): string {
	return BALANCE_INDEX_LABEL[classification];
}

function composeBalanceIndex(
	predictedScore: number | null,
	realizedScore: number,
	tightGameScore: number,
): number {
	if (predictedScore === null) {
		const weightSum =
			BALANCE_INDEX_WEIGHTS.realized + BALANCE_INDEX_WEIGHTS.tightGames;
		if (weightSum <= 0) {
			return 0;
		}

		return roundScore(
			(BALANCE_INDEX_WEIGHTS.realized * realizedScore +
				BALANCE_INDEX_WEIGHTS.tightGames * tightGameScore) /
				weightSum,
		);
	}

	return roundScore(
		BALANCE_INDEX_WEIGHTS.predicted * predictedScore +
			BALANCE_INDEX_WEIGHTS.realized * realizedScore +
			BALANCE_INDEX_WEIGHTS.tightGames * tightGameScore,
	);
}

function predictedVsRealizedRelation(
	predictedMean: number | null,
	realizedMean: number,
): { vsPredicted: BalanceVsPredicted; delta: number | null } {
	if (predictedMean === null) {
		return {
			vsPredicted: BALANCE_VS_PREDICTED.unavailable,
			delta: null,
		};
	}

	const delta = realizedMean - predictedMean;
	if (Math.abs(delta) < 0.05) {
		return {
			vsPredicted: BALANCE_VS_PREDICTED.equal,
			delta,
		};
	}

	if (realizedMean < predictedMean) {
		return {
			vsPredicted: BALANCE_VS_PREDICTED.moreBalanced,
			delta,
		};
	}

	return {
		vsPredicted: BALANCE_VS_PREDICTED.lessBalanced,
		delta,
	};
}

function endedMatches(event: ChampionshipEvent) {
	return event.matches.filter((match) => match.ended_at !== null);
}

function teamPredictedRatingMap(
	event: ChampionshipEvent,
): Map<number, number> | null {
	const balance = eventTeamBalance(event, null);
	if (!balance) {
		return null;
	}

	return new Map(
		balance.teams.map((team) => [team.teamId, team.predictedRating] as const),
	);
}

function matchPredictedDifference(
	match: ChampionshipEvent["matches"][number],
	ratingByTeam: Map<number, number>,
): number | null {
	const ratingA = ratingByTeam.get(match.team_a_id);
	const ratingB = ratingByTeam.get(match.team_b_id);
	if (ratingA === undefined || ratingB === undefined) {
		return null;
	}

	return Math.abs(ratingA - ratingB);
}

export function calculateEventBalanceIndex(
	event: ChampionshipEvent,
): EventBalanceIndex | null {
	if (event.ended_at === null) {
		return null;
	}

	const matches = endedMatches(event);
	if (matches.length === 0) {
		return null;
	}

	const ratingByTeam = teamPredictedRatingMap(event);
	const balance = eventTeamBalance(event, null);
	const predictedDifferences = matches.flatMap((match) => {
		if (!ratingByTeam) {
			return [];
		}

		const difference = matchPredictedDifference(match, ratingByTeam);
		if (difference === null) {
			return [];
		}

		return [difference];
	});
	const incompletePredicted =
		ratingByTeam === null || predictedDifferences.length < matches.length;
	const predictedDifferenceMean =
		predictedDifferences.length === 0
			? null
			: averageOrZero(
					predictedDifferences.reduce((sum, value) => sum + value, 0),
					predictedDifferences.length,
				);
	const realizedDifferences = matches.map((match) => matchGoalMargin(match));
	const realizedDifferenceMean = averageOrZero(
		realizedDifferences.reduce((sum, value) => sum + value, 0),
		matches.length,
	);
	const tightGames = matches.filter((match) => isCloseMatch(match)).length;
	const tightGameRate = rosterWinRate(tightGames, matches.length);
	const predictedScore =
		predictedDifferenceMean === null
			? null
			: balanceDifferenceScore(
					predictedDifferenceMean,
					BALANCE_INDEX_SCALE.predicted,
				);
	const realizedScore = balanceDifferenceScore(
		realizedDifferenceMean,
		BALANCE_INDEX_SCALE.realized,
	);
	const tightGameScore = clampScore(tightGameRate * 100);
	const balanceIndex = composeBalanceIndex(
		predictedScore === null ? null : predictedScore,
		realizedScore,
		tightGameScore,
	);
	const relation = predictedVsRealizedRelation(
		predictedDifferenceMean,
		realizedDifferenceMean,
	);

	return {
		eventId: event.id,
		eventStartsAt: event.starts_at,
		matches: matches.length,
		predictedMatchCount: predictedDifferences.length,
		predictedDifferenceMean,
		realizedDifferenceMean,
		tightGames,
		tightGameRate,
		predictedScore:
			predictedScore === null ? null : roundScore(predictedScore),
		realizedScore: roundScore(realizedScore),
		tightGameScore: roundScore(tightGameScore),
		balanceIndex,
		classification: balanceIndexClassification(balanceIndex),
		incompletePredicted,
		smallSample: matches.length < BALANCE_INDEX_MIN_MATCHES_CONFIDENT,
		favoriteWon: balance?.favoriteWon ?? null,
		vsPredicted: relation.vsPredicted,
		predictedVsRealizedDelta: relation.delta,
	};
}

function overallFromHistory(
	history: readonly EventBalanceIndex[],
): ChampionshipBalanceOverall | null {
	if (history.length === 0) {
		return null;
	}

	const matches = history.reduce((sum, row) => sum + row.matches, 0);
	if (matches === 0) {
		return null;
	}

	const realizedTotal = history.reduce(
		(sum, row) => sum + row.realizedDifferenceMean * row.matches,
		0,
	);
	const tightTotal = history.reduce((sum, row) => sum + row.tightGames, 0);
	const predictedSamples = history.flatMap((row) => {
		if (row.predictedDifferenceMean === null || row.predictedMatchCount === 0) {
			return [];
		}

		return [
			{
				total: row.predictedDifferenceMean * row.predictedMatchCount,
				count: row.predictedMatchCount,
			},
		];
	});
	const predictedCount = predictedSamples.reduce(
		(sum, row) => sum + row.count,
		0,
	);
	const predictedTotal = predictedSamples.reduce(
		(sum, row) => sum + row.total,
		0,
	);
	const incompletePredicted =
		predictedCount === 0 ||
		history.some((row) => row.incompletePredicted) ||
		predictedCount < matches;
	const predictedDifferenceMean =
		predictedCount === 0 ? null : averageOrZero(predictedTotal, predictedCount);
	const realizedDifferenceMean = averageOrZero(realizedTotal, matches);
	const tightGameRate = rosterWinRate(tightTotal, matches);
	const predictedScore =
		predictedDifferenceMean === null
			? null
			: roundScore(
					balanceDifferenceScore(
						predictedDifferenceMean,
						BALANCE_INDEX_SCALE.predicted,
					),
				);
	const realizedScore = roundScore(
		balanceDifferenceScore(
			realizedDifferenceMean,
			BALANCE_INDEX_SCALE.realized,
		),
	);
	const tightGameScore = roundScore(clampScore(tightGameRate * 100));
	const balanceIndex = composeBalanceIndex(
		predictedScore,
		realizedScore,
		tightGameScore,
	);

	return {
		events: history.length,
		matches,
		predictedDifferenceMean,
		realizedDifferenceMean,
		tightGameRate,
		predictedScore,
		realizedScore,
		tightGameScore,
		balanceIndex,
		classification: balanceIndexClassification(balanceIndex),
		incompletePredicted,
	};
}

export function calculateChampionshipBalanceIndex(
	events: readonly ChampionshipEvent[],
): ChampionshipBalanceIndex {
	const history = events
		.flatMap((event) => {
			const row = calculateEventBalanceIndex(event);
			if (!row) {
				return [];
			}

			return [row];
		})
		.slice()
		.sort((left, right) =>
			left.eventStartsAt.localeCompare(right.eventStartsAt),
		);

	return {
		current: history[history.length - 1] ?? null,
		history,
		overall: overallFromHistory(history),
	};
}

export function goalDifferenceBucket(
	margin: number,
): BalanceGoalDiffBucket {
	if (margin <= 0) {
		return BALANCE_GOAL_DIFF_BUCKET.zero;
	}

	if (margin === 1) {
		return BALANCE_GOAL_DIFF_BUCKET.one;
	}

	if (margin === 2) {
		return BALANCE_GOAL_DIFF_BUCKET.two;
	}

	if (margin === 3) {
		return BALANCE_GOAL_DIFF_BUCKET.three;
	}

	return BALANCE_GOAL_DIFF_BUCKET.fourPlus;
}

export function goalDifferenceDistribution(
	events: readonly ChampionshipEvent[],
): BalanceGoalDiffBucketRow[] {
	const counts = new Map<BalanceGoalDiffBucket, number>(
		BALANCE_GOAL_DIFF_BUCKET_ORDER.map((bucket) => [bucket, 0]),
	);

	for (const event of events) {
		if (event.ended_at === null) {
			continue;
		}

		for (const match of endedMatches(event)) {
			const bucket = goalDifferenceBucket(matchGoalMargin(match));
			counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
		}
	}

	return BALANCE_GOAL_DIFF_BUCKET_ORDER.map((bucket) => ({
		bucket,
		count: counts.get(bucket) ?? 0,
	}));
}

export function championshipBalanceHistoryChart(
	history: readonly EventBalanceIndex[],
): BalanceHistoryChartPoint[] {
	return history.map((row, index) => ({
		x: index,
		startsAt: row.eventStartsAt,
		value: row.balanceIndex,
		label: formatBalanceIndexScore(row.balanceIndex),
	}));
}

export function balanceIndexHistoryRecentFirst(
	history: readonly EventBalanceIndex[],
): EventBalanceIndex[] {
	return history.slice().reverse();
}

export function formatBalanceIndexScore(value: number): string {
	return formatRosterCount(roundScore(value));
}

export function formatBalanceIndexMean(value: number | null): string {
	if (value === null) {
		return "—";
	}

	return formatTeamBalanceSpread(value);
}

export function formatBalanceTightRate(value: number): string {
	return formatRosterWinRate(value);
}

export function formatBalanceIndexDelta(value: number | null): string {
	if (value === null) {
		return "—";
	}

	const absolute = formatRosterAverage(Math.abs(value));
	if (value > 0) {
		return `+${absolute}`;
	}

	if (value < 0) {
		return `-${absolute}`;
	}

	return absolute;
}

export function formatFavoriteWon(value: boolean | null): string {
	if (value === null) {
		return "—";
	}

	if (value) {
		return "Sim";
	}

	return "Não";
}

export function balanceIndexSummaryMessage(row: EventBalanceIndex): string {
	const classification = balanceIndexClassificationLabel(row.classification);
	const tight = formatBalanceTightRate(row.tightGameRate);
	const parts = [`${formatBalanceIndexScore(row.balanceIndex)}/100`, classification];

	if (row.smallSample) {
		parts.push(BALANCE_INDEX_LABEL.smallSample);
	}

	if (row.incompletePredicted) {
		parts.push(BALANCE_INDEX_LABEL.incomplete);
	}

	parts.push(
		`A rodada teve ${tight} de jogos apertados.`,
	);

	if (row.vsPredicted !== BALANCE_VS_PREDICTED.unavailable) {
		parts.push(BALANCE_INDEX_LABEL[row.vsPredicted]);
	}

	return parts.join(" ");
}

export function balanceVsPredictedLabel(vs: BalanceVsPredicted): string {
	return BALANCE_INDEX_LABEL[vs];
}
