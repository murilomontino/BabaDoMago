import type {
	ChampionshipRatingHistoryChartPoint,
	ChampionshipRatingHistorySeries,
} from "./championship-rating-history.ts";
import {
	SHARE_FILE,
	shareFileDateStamp,
	shareFileName,
} from "./share-file-name.ts";

export const RATING_RACE_SHARE = {
	width: 960,
	height: 600,
	padding: 40,
	headerHeight: 104,
	nameWidth: 132,
	axisWidth: 56,
	rightGutter: 64,
	xLabelHeight: 28,
	avatar: 44,
	lineWidth: 4,
	dotRadius: 4,
	stepsPerRound: 16,
	frameDelayMs: 80,
	holdFrames: 36,
	maxColors: 256,
	gifFormat: "rgb565",
	mimeGif: "image/gif",
	mimeMp4: "video/mp4",
	mp4Codec: "avc1.42001f",
	mp4Bitrate: 1_500_000,
	filePrefix: "corrida-nota",
} as const;

export const RATING_RACE_COLOR = {
	field: "#fafaf9",
	surface: "#ffffff",
	fg: "#1c1917",
	fgMuted: "#57534e",
	line: "#e7e5e4",
	pitch: "#166534",
	avatar: "#e7e5e4",
	onColor: "#ffffff",
} as const;

export const RATING_RACE_LABEL = {
	generate: "Gerar GIF",
	generating: "Gerando GIF...",
	failed: "Não foi possível gerar o GIF",
	generateVideo: "Gerar vídeo",
	generatingVideo: "Gerando vídeo...",
	failedVideo: "Não foi possível gerar o vídeo",
	title: "Corrida da nota",
	subtitle: "Evolução da nota",
	limit: "Jogadores no GIF",
	limitAll: "Todos",
	topPrefix: "Top",
} as const;

export const RATING_RACE_SHARE_KIND = {
	gif: "gif",
	video: "video",
} as const;

export type RatingRaceShareKind =
	(typeof RATING_RACE_SHARE_KIND)[keyof typeof RATING_RACE_SHARE_KIND];

export const RATING_RACE_LIMIT = {
	options: [3, 5, 10, 15, 20],
	default: 10,
	all: "all",
} as const;

export type RatingRaceLimit = number | null;

export type RatingRacePoint = {
	at: number;
	rating: number;
};

export type RatingRaceEntry = {
	series: ChampionshipRatingHistorySeries;
	values: readonly (number | null)[];
};

export type RatingRaceLeader = {
	series: ChampionshipRatingHistorySeries;
	rating: number;
	position: number;
};

export function ratingRaceSeriesValues(
	rows: readonly ChampionshipRatingHistoryChartPoint[],
	series: ChampionshipRatingHistorySeries,
): (number | null)[] {
	return rows.map((row) => {
		const value = row[series.dataKey];
		if (typeof value !== "number") {
			return null;
		}

		return value;
	});
}

export function ratingRaceEntries(
	rows: readonly ChampionshipRatingHistoryChartPoint[],
	series: readonly ChampionshipRatingHistorySeries[],
): RatingRaceEntry[] {
	return series.map((item) => ({
		series: item,
		values: ratingRaceSeriesValues(rows, item),
	}));
}

export function ratingRaceFrames(rowCount: number): number[] {
	const lastIndex = Math.max(0, rowCount - 1);
	const steps = lastIndex * RATING_RACE_SHARE.stepsPerRound;
	const growing = Array.from(
		{ length: steps + 1 },
		(_unused, step) => step / RATING_RACE_SHARE.stepsPerRound,
	);
	const hold = Array.from(
		{ length: RATING_RACE_SHARE.holdFrames },
		() => lastIndex,
	);

	return [...growing, ...hold];
}

export function ratingRaceValueAt(
	values: readonly (number | null)[],
	progress: number,
): number | null {
	const index = Math.floor(progress);
	const current = values[index];
	if (current == null) {
		return null;
	}

	const next = values[index + 1];
	if (next == null) {
		return current;
	}

	return current + (next - current) * (progress - index);
}

export function ratingRaceSeriesPath(
	values: readonly (number | null)[],
	progress: number,
): RatingRacePoint[] {
	const index = Math.floor(progress);
	const drawn = values.flatMap((value, valueIndex) => {
		if (valueIndex > index) {
			return [];
		}

		if (value === null) {
			return [];
		}

		return [{ at: valueIndex, rating: value }];
	});
	const tip = ratingRaceValueAt(values, progress);
	if (tip === null) {
		return drawn;
	}

	if (drawn.at(-1)?.at === progress) {
		return drawn;
	}

	return [...drawn, { at: progress, rating: tip }];
}

function compareRatingRaceLeaders(
	left: { rating: number; series: ChampionshipRatingHistorySeries },
	right: { rating: number; series: ChampionshipRatingHistorySeries },
): number {
	if (left.rating !== right.rating) {
		return right.rating - left.rating;
	}

	const byName = left.series.name.localeCompare(right.series.name, "pt-BR");
	if (byName !== 0) {
		return byName;
	}

	return left.series.playerId - right.series.playerId;
}

export function ratingRaceLeaders(
	entries: readonly RatingRaceEntry[],
	progress: number,
	limit: RatingRaceLimit,
): RatingRaceLeader[] {
	const ranked = entries
		.flatMap((entry) => {
			const rating = ratingRaceValueAt(entry.values, progress);
			if (rating === null) {
				return [];
			}

			return [{ series: entry.series, rating }];
		})
		.sort(compareRatingRaceLeaders)
		.map((entry, index) => ({ ...entry, position: index + 1 }));

	if (limit === null) {
		return ranked;
	}

	return ranked.slice(0, limit);
}

export function parseRatingRaceLimit(value: string): RatingRaceLimit {
	if (value === RATING_RACE_LIMIT.all) {
		return null;
	}

	const parsed = Number(value);
	const known = RATING_RACE_LIMIT.options.find((option) => option === parsed);
	if (known === undefined) {
		return RATING_RACE_LIMIT.default;
	}

	return known;
}

export function ratingRaceLimitValue(limit: RatingRaceLimit): string {
	if (limit === null) {
		return RATING_RACE_LIMIT.all;
	}

	return String(limit);
}

export function ratingRaceLimitCaption(limit: RatingRaceLimit): string {
	if (limit === null) {
		return RATING_RACE_LABEL.limitAll;
	}

	return `${RATING_RACE_LABEL.topPrefix} ${limit}`;
}

function ratingRaceFileNameParts({
	championshipName,
	limit,
	generatedAt,
}: {
	championshipName: string;
	limit: RatingRaceLimit;
	generatedAt: string;
}): (string | null)[] {
	return [
		RATING_RACE_SHARE.filePrefix,
		championshipName,
		ratingRaceLimitCaption(limit),
		shareFileDateStamp(generatedAt),
	];
}

export function ratingRaceGifFileName(input: {
	championshipName: string;
	limit: RatingRaceLimit;
	generatedAt: string;
}): string {
	return shareFileName(ratingRaceFileNameParts(input), SHARE_FILE.gif);
}

export function ratingRaceMp4FileName(input: {
	championshipName: string;
	limit: RatingRaceLimit;
	generatedAt: string;
}): string {
	return shareFileName(ratingRaceFileNameParts(input), SHARE_FILE.mp4);
}

export function ratingRacePositionLabel(position: number): string {
	return `${position}º`;
}
