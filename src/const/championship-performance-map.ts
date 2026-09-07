import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import { endedChampionshipHistoryEvents } from "./championship-rating-history.ts";
import {
	championshipRecentForm,
	formatRecentFormDelta,
	formatRecentFormRate,
} from "./championship-recent-form.ts";
import {
	EVENT_RATING_ADJUSTMENT,
	formatEventRating,
} from "./event-rating-adjustment.ts";
import { playerVisibleName } from "./player-name.ts";
import { championshipRatingCeiling, PLAYER_RATING } from "./player-rating.ts";
import { formatRosterCount } from "./roster-stats.ts";

export const PERFORMANCE_MAP_WINDOW = {
	last3: "last3",
	last5: "last5",
	last8: "last8",
	month1: "month1",
	month2: "month2",
} as const;

export type PerformanceMapWindow =
	(typeof PERFORMANCE_MAP_WINDOW)[keyof typeof PERFORMANCE_MAP_WINDOW];

export const PERFORMANCE_MAP_WINDOW_DEFAULT = PERFORMANCE_MAP_WINDOW.last5;

export const PERFORMANCE_MAP_WINDOW_COUNT = {
	[PERFORMANCE_MAP_WINDOW.last3]: 3,
	[PERFORMANCE_MAP_WINDOW.last5]: 5,
	[PERFORMANCE_MAP_WINDOW.last8]: 8,
} as const;

export const PERFORMANCE_MAP_WINDOW_MONTHS = {
	[PERFORMANCE_MAP_WINDOW.month1]: 1,
	[PERFORMANCE_MAP_WINDOW.month2]: 2,
} as const;

export const PERFORMANCE_MAP_WINDOW_OPTIONS = [
	PERFORMANCE_MAP_WINDOW.last3,
	PERFORMANCE_MAP_WINDOW.last5,
	PERFORMANCE_MAP_WINDOW.last8,
	PERFORMANCE_MAP_WINDOW.month1,
	PERFORMANCE_MAP_WINDOW.month2,
] as const;

export const PERFORMANCE_MAP_STATE = {
	rising: "rising",
	onLevel: "on_level",
	elite: "elite",
	falling: "falling",
	low: "low",
	neutral: "neutral",
	few_matches: "few_matches",
	unrated: "unrated",
} as const;

export type PerformanceMapState =
	(typeof PERFORMANCE_MAP_STATE)[keyof typeof PERFORMANCE_MAP_STATE];

export const PERFORMANCE_MAP_LABEL = {
	title: "Mapa de Performance",
	subtitle: "Rating atual × aproveitamento recente",
	hint: "Compara o nível atual do jogador com o aproveitamento da fórmula da nota. Elite = top 25% de nota + forma boa; No nível = ≥ mediana + forma boa. Linha vertical = mediana do rating no recorte.",
	gapExplain:
		"Gap = forma recente − nível relativo da nota (rating ÷ teto). Em pp (pontos percentuais): diferença entre as duas taxas. Positivo = forma acima da nota. Negativo = a nota sugere que ainda dá para render mais.",
	empty: "Ninguém com jogos suficientes na janela",
	filter: "Janela",
	showFewMatches: "Mostrar poucos jogos",
	showNames: "Mostrar nomes",
	medianLegend: "Linha vertical = mediana do rating no recorte",
	rating: "Rating",
	rate: "Aproveitamento",
	matches: "Jogos",
	wins: "V",
	draws: "E",
	losses: "D",
	deltaRating: "Δ nota",
	gap: "Gap",
	gapHint: "Gap vs nível da nota",
	reading: "Leitura",
	state: "Estado",
	player: "Jogador",
	[PERFORMANCE_MAP_STATE.rising]: "Ascensão",
	[PERFORMANCE_MAP_STATE.onLevel]: "No nível",
	[PERFORMANCE_MAP_STATE.elite]: "Elite",
	[PERFORMANCE_MAP_STATE.falling]: "Queda",
	[PERFORMANCE_MAP_STATE.low]: "Baixo",
	[PERFORMANCE_MAP_STATE.neutral]: "Neutro",
	[PERFORMANCE_MAP_STATE.few_matches]: "Poucos jogos",
	[PERFORMANCE_MAP_STATE.unrated]: "Sem nota",
	[PERFORMANCE_MAP_WINDOW.last3]: "Últimas 3",
	[PERFORMANCE_MAP_WINDOW.last5]: "Últimas 5",
	[PERFORMANCE_MAP_WINDOW.last8]: "Últimas 8",
	[PERFORMANCE_MAP_WINDOW.month1]: "1 mês",
	[PERFORMANCE_MAP_WINDOW.month2]: "2 meses",
} as const;

export const PERFORMANCE_MAP_GAP_READING = {
	strongAbove:
		"Forma bem acima da nota — está rendendo mais do que o nível sugere.",
	above: "Forma um pouco acima da nota — fase melhor que o histórico.",
	aligned: "Forma alinhada com a nota — desempenho no esperado.",
	below: "Forma um pouco abaixo da nota — ainda dá para render mais.",
	strongBelow:
		"Forma bem abaixo da nota — este jogador pode desempenhar mais do que mostra agora.",
	fewMatches: "Poucos jogos — Gap ainda é barulho.",
	unrated: "Sem nota — Gap não se aplica.",
} as const;

export const PERFORMANCE_MAP_STATE_READING = {
	[PERFORMANCE_MAP_STATE.rising]:
		"Nota ainda abaixo da mediana, mas forma boa — candidato a subir.",
	[PERFORMANCE_MAP_STATE.onLevel]:
		"Nota na metade de cima e forma boa — está no próprio nível.",
	[PERFORMANCE_MAP_STATE.elite]:
		"Topo da liga (top 25% de nota) e forma boa — referência do recorte.",
	[PERFORMANCE_MAP_STATE.falling]:
		"Nota alta com forma fraca — rende abaixo do que a nota promete.",
	[PERFORMANCE_MAP_STATE.low]: "Nota e forma baixas — fase fraca no recorte.",
	[PERFORMANCE_MAP_STATE.neutral]:
		"Na zona morta — resultado estável, sem sinal forte.",
	[PERFORMANCE_MAP_STATE.few_matches]:
		"Menos de 3 jogos — cedo demais para classificar.",
	[PERFORMANCE_MAP_STATE.unrated]:
		"Nota sentinela — ainda não entrou no mapa de nível.",
} as const;

/** |gap| abaixo disso conta como alinhado (8 pp). */
export const PERFORMANCE_MAP_GAP_ALIGNED = 0.08 as const;
/** |gap| a partir disso conta como bem acima/abaixo (18 pp). */
export const PERFORMANCE_MAP_GAP_STRONG = 0.18 as const;
/** Fração do elenco ranqueado que pode ser Elite (top 25%). */
export const PERFORMANCE_MAP_ELITE_TOP_FRACTION = 0.25 as const;

export const PERFORMANCE_MAP_COLOR = {
	[PERFORMANCE_MAP_STATE.rising]: "#16a34a",
	[PERFORMANCE_MAP_STATE.onLevel]: "#ca8a04",
	[PERFORMANCE_MAP_STATE.elite]: "#b45309",
	[PERFORMANCE_MAP_STATE.falling]: "#dc2626",
	[PERFORMANCE_MAP_STATE.low]: "#64748b",
	[PERFORMANCE_MAP_STATE.neutral]: "#94a3b8",
	[PERFORMANCE_MAP_STATE.few_matches]: "#cbd5e1",
	[PERFORMANCE_MAP_STATE.unrated]: "#e2e8f0",
} as const;

export const PERFORMANCE_MAP_CHART = {
	height: 320,
	ratingKey: "rating",
	rateKey: "rate",
	nameKey: "name",
	labelOffset: 8,
	labelFontSize: 11,
	margin: { top: 24, right: 28, bottom: 28, left: 8 },
	axisWidth: 44,
	domainPadX: 0.4,
	domainPadY: 0.05,
	yMin: 0,
	yMax: 1,
	dotMinRadius: 4,
	dotMaxRadius: 14,
	dotMatchesAtMax: 20,
	deadZoneFillOpacity: 0.08,
} as const;

export const PERFORMANCE_MAP_COLUMN = {
	player: "player",
	rating: "rating",
	rate: "rate",
	matches: "matches",
	gap: "gap",
	state: "state",
} as const;

export type PerformanceMapColumnId =
	(typeof PERFORMANCE_MAP_COLUMN)[keyof typeof PERFORMANCE_MAP_COLUMN];

export type PerformanceMapPoint = {
	playerId: number;
	name: string;
	rating: number;
	ratingRelative: number;
	matches: number;
	wins: number;
	draws: number;
	losses: number;
	rate: number;
	deltaRating: number;
	gap: number;
	state: PerformanceMapState;
	color: string;
};

export type PerformanceMapResult = {
	points: PerformanceMapPoint[];
	median: number | null;
	ceiling: number;
};

export function isPerformanceMapWindow(
	value: string,
): value is PerformanceMapWindow {
	return PERFORMANCE_MAP_WINDOW_OPTIONS.some((option) => option === value);
}

export function parsePerformanceMapWindow(value: string): PerformanceMapWindow {
	if (isPerformanceMapWindow(value)) {
		return value;
	}

	return PERFORMANCE_MAP_WINDOW_DEFAULT;
}

export function performanceMapWindowCaption(
	window: PerformanceMapWindow,
): string {
	return PERFORMANCE_MAP_LABEL[window];
}

export function performanceMapEvents<
	T extends { id: number; starts_at: string; ended_at: string | null },
>(
	events: readonly T[],
	window: PerformanceMapWindow,
	nowMs: number = Date.now(),
): T[] {
	const ended = endedChampionshipHistoryEvents(events);

	if (window === PERFORMANCE_MAP_WINDOW.last3) {
		return ended.slice(-PERFORMANCE_MAP_WINDOW_COUNT.last3);
	}

	if (window === PERFORMANCE_MAP_WINDOW.last5) {
		return ended.slice(-PERFORMANCE_MAP_WINDOW_COUNT.last5);
	}

	if (window === PERFORMANCE_MAP_WINDOW.last8) {
		return ended.slice(-PERFORMANCE_MAP_WINDOW_COUNT.last8);
	}

	if (window === PERFORMANCE_MAP_WINDOW.month1) {
		return filterEndedSinceMonths(
			ended,
			PERFORMANCE_MAP_WINDOW_MONTHS.month1,
			nowMs,
		);
	}

	if (window === PERFORMANCE_MAP_WINDOW.month2) {
		return filterEndedSinceMonths(
			ended,
			PERFORMANCE_MAP_WINDOW_MONTHS.month2,
			nowMs,
		);
	}

	const _never: never = window;
	return _never;
}

export function championshipPerformanceMap(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
	window: PerformanceMapWindow = PERFORMANCE_MAP_WINDOW_DEFAULT,
	nowMs: number = Date.now(),
): PerformanceMapResult {
	const windowEvents = performanceMapEvents(events, window, nowMs);
	const formRows = championshipRecentForm(players, windowEvents);
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const ratedRatings = formRows.flatMap((row) => {
		if (row.player.rating === PLAYER_RATING.default) {
			return [];
		}

		return [row.player.rating];
	});
	const median = performanceMapRatingMedian(ratedRatings);
	const eliteCutoff = performanceMapEliteCutoff(ratedRatings);

	const points = formRows
		.map((row) => {
			const rating = row.player.rating;
			const ratingRelative = rating / ceiling;
			const gap = row.rate - ratingRelative;
			const state = performanceMapState(
				row.matches,
				rating,
				row.rate,
				median,
				eliteCutoff,
			);

			return {
				playerId: row.player.id,
				name: playerVisibleName(row.player),
				rating,
				ratingRelative,
				matches: row.matches,
				wins: row.wins,
				draws: row.draws,
				losses: row.losses,
				rate: row.rate,
				deltaRating: row.ratingDeltaSum,
				gap,
				state,
				color: PERFORMANCE_MAP_COLOR[state],
			};
		})
		.sort(comparePerformanceMapPoints);

	return { points, median, ceiling };
}

export function championshipPerformanceMapVisible(
	result: PerformanceMapResult,
	includeFewMatches: boolean,
): PerformanceMapPoint[] {
	return result.points.filter((point) =>
		performanceMapPointVisible(point, includeFewMatches),
	);
}

export function championshipPerformanceMapEmptyLabel(
	points: readonly PerformanceMapPoint[],
): string | null {
	if (points.length === 0) {
		return PERFORMANCE_MAP_LABEL.empty;
	}

	return null;
}

export function performanceMapStateLabel(state: PerformanceMapState): string {
	return PERFORMANCE_MAP_LABEL[state];
}

export function performanceMapGapReading(point: {
	gap: number;
	state: PerformanceMapState;
}): string {
	if (point.state === PERFORMANCE_MAP_STATE.few_matches) {
		return PERFORMANCE_MAP_GAP_READING.fewMatches;
	}

	if (point.state === PERFORMANCE_MAP_STATE.unrated) {
		return PERFORMANCE_MAP_GAP_READING.unrated;
	}

	if (point.gap >= PERFORMANCE_MAP_GAP_STRONG) {
		return PERFORMANCE_MAP_GAP_READING.strongAbove;
	}

	if (point.gap >= PERFORMANCE_MAP_GAP_ALIGNED) {
		return PERFORMANCE_MAP_GAP_READING.above;
	}

	if (point.gap <= -PERFORMANCE_MAP_GAP_STRONG) {
		return PERFORMANCE_MAP_GAP_READING.strongBelow;
	}

	if (point.gap <= -PERFORMANCE_MAP_GAP_ALIGNED) {
		return PERFORMANCE_MAP_GAP_READING.below;
	}

	return PERFORMANCE_MAP_GAP_READING.aligned;
}

export function performanceMapStateReading(state: PerformanceMapState): string {
	return PERFORMANCE_MAP_STATE_READING[state];
}

export function formatPerformanceMapGap(gap: number): string {
	const pp = Math.round(gap * 100);
	if (pp > 0) {
		return `+${pp} pp`;
	}

	return `${pp} pp`;
}

export function formatPerformanceMapRating(rating: number): string {
	return formatEventRating(rating);
}

export function formatPerformanceMapRate(rate: number): string {
	return formatRecentFormRate(rate);
}

export function formatPerformanceMapDelta(value: number): string {
	return formatRecentFormDelta(value);
}

export function formatPerformanceMapCount(value: number): string {
	return formatRosterCount(value);
}

export function performanceMapDotRadius(matches: number): number {
	const clamped = Math.min(
		PERFORMANCE_MAP_CHART.dotMatchesAtMax,
		Math.max(0, matches),
	);
	const t = clamped / PERFORMANCE_MAP_CHART.dotMatchesAtMax;
	return (
		PERFORMANCE_MAP_CHART.dotMinRadius +
		t *
			(PERFORMANCE_MAP_CHART.dotMaxRadius - PERFORMANCE_MAP_CHART.dotMinRadius)
	);
}

export function performanceMapDomainX(
	points: readonly PerformanceMapPoint[],
	median: number | null,
): { min: number; max: number } {
	const values = points.map((point) => point.rating);
	if (median !== null) {
		values.push(median);
	}
	if (values.length === 0) {
		return {
			min: 0,
			max: PLAYER_RATING.initialCeiling,
		};
	}

	const rawMin = Math.min(...values);
	const rawMax = Math.max(...values);
	return {
		min: Math.max(0, rawMin - PERFORMANCE_MAP_CHART.domainPadX),
		max: rawMax + PERFORMANCE_MAP_CHART.domainPadX,
	};
}

export function performanceMapRatingMedian(
	ratings: readonly number[],
): number | null {
	if (ratings.length === 0) {
		return null;
	}

	const sorted = [...ratings].sort((left, right) => left - right);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) {
		return sorted[mid] ?? null;
	}

	const low = sorted[mid - 1];
	const high = sorted[mid];
	if (low === undefined || high === undefined) {
		return null;
	}

	return (low + high) / 2;
}

/** Nota mínima para entrar no top fraction (Elite). */
export function performanceMapEliteCutoff(
	ratings: readonly number[],
	topFraction: number = PERFORMANCE_MAP_ELITE_TOP_FRACTION,
): number | null {
	if (ratings.length === 0) {
		return null;
	}

	const sorted = [...ratings].sort((left, right) => left - right);
	const startIndex = Math.floor(sorted.length * (1 - topFraction));
	return sorted[startIndex] ?? null;
}

function performanceMapState(
	matches: number,
	rating: number,
	rate: number,
	median: number | null,
	eliteCutoff: number | null,
): PerformanceMapState {
	if (matches < EVENT_RATING_ADJUSTMENT.minMatches) {
		return PERFORMANCE_MAP_STATE.few_matches;
	}

	if (rating === PLAYER_RATING.default) {
		return PERFORMANCE_MAP_STATE.unrated;
	}

	const highRating = median !== null && rating >= median;
	const topRating = eliteCutoff !== null && rating >= eliteCutoff;

	if (rate > EVENT_RATING_ADJUSTMENT.upThreshold) {
		if (topRating) {
			return PERFORMANCE_MAP_STATE.elite;
		}

		if (highRating) {
			return PERFORMANCE_MAP_STATE.onLevel;
		}

		return PERFORMANCE_MAP_STATE.rising;
	}

	if (rate < EVENT_RATING_ADJUSTMENT.downThreshold) {
		if (highRating) {
			return PERFORMANCE_MAP_STATE.falling;
		}

		return PERFORMANCE_MAP_STATE.low;
	}

	return PERFORMANCE_MAP_STATE.neutral;
}

function performanceMapPointVisible(
	point: PerformanceMapPoint,
	includeFewMatches: boolean,
): boolean {
	if (point.state === PERFORMANCE_MAP_STATE.unrated) {
		return false;
	}

	if (point.state === PERFORMANCE_MAP_STATE.few_matches) {
		return includeFewMatches;
	}

	return true;
}

function comparePerformanceMapPoints(
	left: PerformanceMapPoint,
	right: PerformanceMapPoint,
): number {
	if (right.gap !== left.gap) {
		return right.gap - left.gap;
	}

	if (right.rate !== left.rate) {
		return right.rate - left.rate;
	}

	return left.name.localeCompare(right.name, "pt");
}

function filterEndedSinceMonths<T extends { starts_at: string }>(
	ended: readonly T[],
	months: number,
	nowMs: number,
): T[] {
	const cutoff = new Date(nowMs);
	cutoff.setMonth(cutoff.getMonth() - months);
	const cutoffMs = cutoff.getTime();

	return ended.filter((event) => Date.parse(event.starts_at) >= cutoffMs);
}
