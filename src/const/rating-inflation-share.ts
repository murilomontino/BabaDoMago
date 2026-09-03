import { formatEventStartsAt } from "./championship-event.ts";
import {
	formatRatingInflationValue,
	RATING_INFLATION_CHART,
	RATING_INFLATION_LABEL,
	type RatingInflationChartPoint,
	type RatingInflationSummary,
} from "./championship-rating-inflation.ts";
import { shareFileDateStamp, sharePngFileName } from "./share-file-name.ts";

export const RATING_INFLATION_SHARE = {
	width: 1080,
	padding: 32,
	gap: 16,
	headerHeight: 96,
	chartHeight: 420,
	chartAxis: 56,
	chartBottom: 48,
	chartTopPad: 28,
	dotRadius: 6,
	legendHeight: 36,
	legendSwatch: 18,
	legendItemGap: 28,
	filePrefix: "inflacao-nota",
	mimePng: "image/png",
	title: RATING_INFLATION_LABEL.title,
	hint: RATING_INFLATION_LABEL.hint,
} as const;

export const RATING_INFLATION_SHARE_LABEL = {
	share: "Compartilhar",
	sharing: "Gerando imagem...",
	shareFailed: "Não foi possível compartilhar a inflação da nota",
} as const;

export const RATING_INFLATION_SHARE_COLOR = {
	field: "#fafaf9",
	surface: "#ffffff",
	fg: "#1c1917",
	fgMuted: "#57534e",
	fgSubtle: "#a8a29e",
	line: "#e7e5e4",
	pitch: "#166534",
	average: RATING_INFLATION_CHART.averageStroke,
	ceiling: RATING_INFLATION_CHART.ceilingStroke,
	floor: RATING_INFLATION_CHART.floorStroke,
} as const;

export const RATING_INFLATION_SHARE_SERIES = {
	average: "average",
	ceiling: "ceiling",
	floor: "floor",
} as const;

export type RatingInflationShareSeriesId =
	(typeof RATING_INFLATION_SHARE_SERIES)[keyof typeof RATING_INFLATION_SHARE_SERIES];

export const RATING_INFLATION_SHARE_SERIES_ORDER = [
	RATING_INFLATION_SHARE_SERIES.average,
	RATING_INFLATION_SHARE_SERIES.ceiling,
	RATING_INFLATION_SHARE_SERIES.floor,
] as const;

export type RatingInflationSharePoint = {
	startsAt: string;
	label: string;
	averageRating: number;
	ceiling: number;
	floor: number;
	averageLabel: string;
	ceilingLabel: string;
	floorLabel: string;
};

export type RatingInflationShareCard = {
	championshipName: string;
	title: string;
	context: string;
	hint: string;
	points: RatingInflationSharePoint[];
};

export function ratingInflationShareCard(
	summary: RatingInflationSummary,
	championshipName: string,
	context: string,
): RatingInflationShareCard {
	return {
		championshipName,
		title: RATING_INFLATION_SHARE.title,
		context,
		hint: RATING_INFLATION_SHARE.hint,
		points: summary.rows.map((row) => ({
			startsAt: row.startsAt,
			label: formatEventStartsAt(row.startsAt).date,
			averageRating: row.averageRating,
			ceiling: row.ceiling,
			floor: row.floor,
			averageLabel: formatRatingInflationValue(row.averageRating),
			ceilingLabel: formatRatingInflationValue(row.ceiling),
			floorLabel: formatRatingInflationValue(row.floor),
		})),
	};
}

export function ratingInflationShareCardFromChart(
	points: readonly RatingInflationChartPoint[],
	championshipName: string,
	context: string,
): RatingInflationShareCard {
	return {
		championshipName,
		title: RATING_INFLATION_SHARE.title,
		context,
		hint: RATING_INFLATION_SHARE.hint,
		points: points.map((point) => ({
			startsAt: point.startsAt,
			label: formatEventStartsAt(point.startsAt).date,
			averageRating: point.averageRating,
			ceiling: point.ceiling,
			floor: point.floor,
			averageLabel: point.averageLabel,
			ceilingLabel: point.ceilingLabel,
			floorLabel: point.floorLabel,
		})),
	};
}

export function ratingInflationShareContext(
	parts: readonly (string | null | undefined)[],
): string {
	return parts
		.flatMap((part) => {
			if (!part) {
				return [];
			}

			return [part];
		})
		.join(" · ");
}

export function ratingInflationShareFileName(input: {
	championshipName: string;
	generatedAt: string;
}): string {
	return sharePngFileName([
		RATING_INFLATION_SHARE.filePrefix,
		input.championshipName,
		shareFileDateStamp(input.generatedAt),
	]);
}

export function ratingInflationShareText(card: RatingInflationShareCard): string {
	if (!card.context) {
		return `${card.title} — ${card.championshipName}`;
	}

	return `${card.title} (${card.context}) — ${card.championshipName}`;
}

export function ratingInflationShareSeriesLabel(
	series: RatingInflationShareSeriesId,
): string {
	switch (series) {
		case RATING_INFLATION_SHARE_SERIES.average:
			return RATING_INFLATION_LABEL.average;
		case RATING_INFLATION_SHARE_SERIES.ceiling:
			return RATING_INFLATION_LABEL.ceiling;
		case RATING_INFLATION_SHARE_SERIES.floor:
			return RATING_INFLATION_LABEL.floor;
		default: {
			const _never: never = series;
			return _never;
		}
	}
}

export function ratingInflationShareSeriesColor(
	series: RatingInflationShareSeriesId,
): string {
	switch (series) {
		case RATING_INFLATION_SHARE_SERIES.average:
			return RATING_INFLATION_SHARE_COLOR.average;
		case RATING_INFLATION_SHARE_SERIES.ceiling:
			return RATING_INFLATION_SHARE_COLOR.ceiling;
		case RATING_INFLATION_SHARE_SERIES.floor:
			return RATING_INFLATION_SHARE_COLOR.floor;
		default: {
			const _never: never = series;
			return _never;
		}
	}
}

export function ratingInflationShareSeriesDashed(
	series: RatingInflationShareSeriesId,
): boolean {
	return series !== RATING_INFLATION_SHARE_SERIES.average;
}

export function ratingInflationShareSeriesValue(
	point: RatingInflationSharePoint,
	series: RatingInflationShareSeriesId,
): number {
	switch (series) {
		case RATING_INFLATION_SHARE_SERIES.average:
			return point.averageRating;
		case RATING_INFLATION_SHARE_SERIES.ceiling:
			return point.ceiling;
		case RATING_INFLATION_SHARE_SERIES.floor:
			return point.floor;
		default: {
			const _never: never = series;
			return _never;
		}
	}
}

export function ratingInflationShareSeriesValueLabel(
	point: RatingInflationSharePoint,
	series: RatingInflationShareSeriesId,
): string {
	switch (series) {
		case RATING_INFLATION_SHARE_SERIES.average:
			return point.averageLabel;
		case RATING_INFLATION_SHARE_SERIES.ceiling:
			return point.ceilingLabel;
		case RATING_INFLATION_SHARE_SERIES.floor:
			return point.floorLabel;
		default: {
			const _never: never = series;
			return _never;
		}
	}
}

export function ratingInflationShareYDomain(
	points: readonly RatingInflationSharePoint[],
): { min: number; max: number } {
	const values = points.flatMap((point) => [
		point.averageRating,
		point.ceiling,
		point.floor,
	]);
	if (values.length === 0) {
		return { min: 0, max: 5 };
	}

	const min = Math.min(...values);
	const max = Math.max(...values);
	const pad = Math.max(0.3, (max - min) * 0.12);
	return {
		min: Math.max(0, min - pad),
		max: max + pad,
	};
}

export function ratingInflationShareImageHeight(): number {
	return (
		RATING_INFLATION_SHARE.padding * 2 +
		RATING_INFLATION_SHARE.headerHeight +
		RATING_INFLATION_SHARE.chartHeight +
		RATING_INFLATION_SHARE.gap +
		RATING_INFLATION_SHARE.legendHeight
	);
}
