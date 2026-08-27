import { applyPalette, GIFEncoder, type GifPalette, quantize } from "gifenc";
import { formatEventStartsAt } from "@/const/championship-event";
import type {
	ChampionshipRatingHistoryChartPoint,
	ChampionshipRatingHistorySeries,
} from "@/const/championship-rating-history";
import { formatEventRating } from "@/const/event-rating-adjustment";
import {
	RATING_RACE_COLOR,
	RATING_RACE_LABEL,
	RATING_RACE_SHARE,
	type RatingRaceEntry,
	type RatingRaceLeader,
	type RatingRaceLimit,
	type RatingRacePoint,
	ratingRaceEntries,
	ratingRaceFrames,
	ratingRaceGifFileName,
	ratingRaceLeaders,
	ratingRaceLimitCaption,
	ratingRacePositionLabel,
	ratingRaceSeriesPath,
} from "@/const/rating-race-share";
import { loadAvatarMap } from "@/lib/load-avatar";
import { shareOrDownload } from "@/lib/share-file";

export type RatingRaceGifInput = {
	championshipName: string;
	rows: readonly ChampionshipRatingHistoryChartPoint[];
	series: readonly ChampionshipRatingHistorySeries[];
	ceiling: number;
	limit: RatingRaceLimit;
	generatedAt: string;
};

const RATING_RACE_FONT = {
	title: "700 22px system-ui, sans-serif",
	subtitle: "700 16px system-ui, sans-serif",
	meta: "400 13px system-ui, sans-serif",
	axis: "400 12px system-ui, sans-serif",
	label: "700 14px system-ui, sans-serif",
	initial: "600 16px system-ui, sans-serif",
} as const;

export async function shareRatingRaceGif(
	input: RatingRaceGifInput,
): Promise<void> {
	if (input.series.length === 0) {
		throw new Error(RATING_RACE_LABEL.failed);
	}

	const canvas = document.createElement("canvas");
	canvas.width = RATING_RACE_SHARE.width;
	canvas.height = RATING_RACE_SHARE.height;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(RATING_RACE_LABEL.failed);
	}

	const entries = ratingRaceEntries(input.rows, input.series);
	const avatars = await loadAvatarMap(
		input.series.map((item) => item.avatarUrl),
	);
	const blob = encodeRatingRaceGif(context, input, entries, avatars);
	const file = new File(
		[blob],
		ratingRaceGifFileName({
			championshipName: input.championshipName,
			limit: input.limit,
			generatedAt: input.generatedAt,
		}),
		{ type: RATING_RACE_SHARE.mimeGif },
	);

	await shareOrDownload({
		files: [file],
		title: RATING_RACE_LABEL.title,
		text: ratingRaceShareText(input),
	});
}

function encodeRatingRaceGif(
	context: CanvasRenderingContext2D,
	input: RatingRaceGifInput,
	entries: readonly RatingRaceEntry[],
	avatars: ReadonlyMap<string, HTMLImageElement>,
): Blob {
	// ponytail: encode síncrono no main thread, O(frames × pixels), pode travar a UI por 1-3s; upgrade é Web Worker + OffscreenCanvas.
	const { width, height } = RATING_RACE_SHARE;
	const frames = ratingRaceFrames(input.rows.length);
	const lastProgress = frames.at(-1) ?? 0;

	drawRaceFrame(context, input, entries, avatars, lastProgress);
	const palette = quantize(
		context.getImageData(0, 0, width, height).data,
		RATING_RACE_SHARE.maxColors,
		{ format: RATING_RACE_SHARE.gifFormat },
	);

	const encoder = GIFEncoder();
	for (const [index, progress] of frames.entries()) {
		drawRaceFrame(context, input, entries, avatars, progress);
		const { data } = context.getImageData(0, 0, width, height);
		const indexed = applyPalette(data, palette, RATING_RACE_SHARE.gifFormat);
		encoder.writeFrame(
			indexed,
			width,
			height,
			frameOptions(index === 0, palette),
		);
	}

	encoder.finish();
	return gifBytesBlob(encoder.bytes());
}

function gifBytesBlob(bytes: Uint8Array): Blob {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	return new Blob([copy], { type: RATING_RACE_SHARE.mimeGif });
}

function frameOptions(isFirst: boolean, palette: GifPalette) {
	if (isFirst) {
		return {
			palette,
			delay: RATING_RACE_SHARE.frameDelayMs,
			repeat: 0,
		};
	}

	return {
		delay: RATING_RACE_SHARE.frameDelayMs,
	};
}

function plotX(): number {
	return RATING_RACE_SHARE.padding + RATING_RACE_SHARE.axisWidth;
}

function plotY(): number {
	return RATING_RACE_SHARE.headerHeight;
}

function plotWidth(): number {
	return (
		RATING_RACE_SHARE.width -
		plotX() -
		RATING_RACE_SHARE.padding -
		RATING_RACE_SHARE.rightGutter
	);
}

function plotHeight(): number {
	return (
		RATING_RACE_SHARE.height -
		plotY() -
		RATING_RACE_SHARE.padding -
		RATING_RACE_SHARE.xLabelHeight
	);
}

function xForAt(at: number, lastIndex: number): number {
	if (lastIndex <= 0) {
		return plotX() + plotWidth() / 2;
	}

	return plotX() + (at / lastIndex) * plotWidth();
}

function clamp01(value: number): number {
	if (value < 0) {
		return 0;
	}

	if (value > 1) {
		return 1;
	}

	return value;
}

function yForRating(rating: number, ceiling: number): number {
	if (ceiling <= 0) {
		return plotY() + plotHeight();
	}

	return plotY() + plotHeight() * (1 - clamp01(rating / ceiling));
}

function lastRowIndex(rowCount: number): number {
	return Math.max(0, rowCount - 1);
}

function frameDateLabel(
	rows: readonly ChampionshipRatingHistoryChartPoint[],
	progress: number,
): string {
	const row = rows[Math.round(progress)];
	if (!row) {
		return "";
	}

	return formatEventStartsAt(row.startsAt).date;
}

function firstDateLabel(
	rows: readonly ChampionshipRatingHistoryChartPoint[],
): string {
	const row = rows[0];
	if (!row) {
		return "";
	}

	return formatEventStartsAt(row.startsAt).date;
}

function ratingRaceShareText(input: RatingRaceGifInput): string {
	return `${input.championshipName} · ${ratingRaceLimitCaption(input.limit)}`;
}

function leaderValues(
	entries: readonly RatingRaceEntry[],
	series: ChampionshipRatingHistorySeries,
): readonly (number | null)[] {
	const entry = entries.find(
		(item) => item.series.playerId === series.playerId,
	);
	if (!entry) {
		return [];
	}

	return entry.values;
}

function seriesInitial(name: string): string {
	const initial = name.charAt(0).toUpperCase();
	if (!initial) {
		return "?";
	}

	return initial;
}

function avatarForSeries(
	series: ChampionshipRatingHistorySeries,
	avatars: ReadonlyMap<string, HTMLImageElement>,
): HTMLImageElement | undefined {
	if (!series.avatarUrl) {
		return undefined;
	}

	return avatars.get(series.avatarUrl);
}

function gridRatings(ceiling: number): number[] {
	return [0, ceiling / 2, ceiling];
}

function drawRaceFrame(
	context: CanvasRenderingContext2D,
	input: RatingRaceGifInput,
	entries: readonly RatingRaceEntry[],
	avatars: ReadonlyMap<string, HTMLImageElement>,
	progress: number,
) {
	const { width, height, padding } = RATING_RACE_SHARE;
	context.fillStyle = RATING_RACE_COLOR.field;
	context.fillRect(0, 0, width, height);

	context.fillStyle = RATING_RACE_COLOR.pitch;
	context.font = RATING_RACE_FONT.title;
	context.textAlign = "left";
	context.textBaseline = "top";
	context.fillText(input.championshipName, padding, 24);

	context.fillStyle = RATING_RACE_COLOR.fg;
	context.font = RATING_RACE_FONT.subtitle;
	context.fillText(RATING_RACE_LABEL.subtitle, padding, 52);

	context.fillStyle = RATING_RACE_COLOR.fgMuted;
	context.font = RATING_RACE_FONT.meta;
	context.fillText(
		`${ratingRaceLimitCaption(input.limit)} · ${frameDateLabel(input.rows, progress)}`,
		padding,
		78,
	);

	drawGrid(context, input.ceiling);
	drawXLabels(context, input.rows, progress);

	const lastIndex = lastRowIndex(input.rows.length);
	const leaders = ratingRaceLeaders(entries, progress, input.limit);
	for (const leader of [...leaders].reverse()) {
		drawLeader(
			context,
			leader,
			leaderValues(entries, leader.series),
			avatars,
			progress,
			lastIndex,
			input.ceiling,
		);
	}
}

function drawGrid(context: CanvasRenderingContext2D, ceiling: number) {
	const left = plotX();
	const right = left + plotWidth();
	context.strokeStyle = RATING_RACE_COLOR.line;
	context.lineWidth = 1;
	context.font = RATING_RACE_FONT.axis;
	context.textAlign = "right";
	context.textBaseline = "middle";
	context.fillStyle = RATING_RACE_COLOR.fgMuted;

	for (const rating of gridRatings(ceiling)) {
		const y = yForRating(rating, ceiling);
		context.beginPath();
		context.moveTo(left, y);
		context.lineTo(right, y);
		context.stroke();
		context.fillText(formatEventRating(rating), left - 8, y);
	}
}

function drawXLabels(
	context: CanvasRenderingContext2D,
	rows: readonly ChampionshipRatingHistoryChartPoint[],
	progress: number,
) {
	const y = plotY() + plotHeight() + 8;
	const first = firstDateLabel(rows);
	const current = frameDateLabel(rows, progress);
	context.font = RATING_RACE_FONT.axis;
	context.fillStyle = RATING_RACE_COLOR.fgMuted;
	context.textBaseline = "top";

	if (first) {
		context.textAlign = "left";
		context.fillText(first, plotX(), y);
	}

	if (current) {
		context.textAlign = "right";
		context.fillText(current, plotX() + plotWidth(), y);
	}
}

function drawLeader(
	context: CanvasRenderingContext2D,
	leader: RatingRaceLeader,
	values: readonly (number | null)[],
	avatars: ReadonlyMap<string, HTMLImageElement>,
	progress: number,
	lastIndex: number,
	ceiling: number,
) {
	const path = ratingRaceSeriesPath(values, progress);
	const tip = path.at(-1);
	if (!tip) {
		return;
	}

	drawSeriesStroke(context, leader.series, path, lastIndex, ceiling);
	drawSeriesDots(context, leader.series, path, lastIndex, ceiling);
	drawSeriesTip(context, leader, tip, avatars, lastIndex, ceiling);
}

function drawSeriesStroke(
	context: CanvasRenderingContext2D,
	series: ChampionshipRatingHistorySeries,
	path: readonly RatingRacePoint[],
	lastIndex: number,
	ceiling: number,
) {
	const first = path[0];
	if (!first) {
		return;
	}

	context.beginPath();
	context.strokeStyle = series.color;
	context.lineWidth = RATING_RACE_SHARE.lineWidth;
	context.lineJoin = "round";
	context.lineCap = "round";
	context.moveTo(
		xForAt(first.at, lastIndex),
		yForRating(first.rating, ceiling),
	);
	for (const point of path.slice(1)) {
		context.lineTo(
			xForAt(point.at, lastIndex),
			yForRating(point.rating, ceiling),
		);
	}
	context.stroke();
}

function drawSeriesDots(
	context: CanvasRenderingContext2D,
	series: ChampionshipRatingHistorySeries,
	path: readonly RatingRacePoint[],
	lastIndex: number,
	ceiling: number,
) {
	context.fillStyle = series.color;
	for (const point of path.slice(0, -1)) {
		context.beginPath();
		context.arc(
			xForAt(point.at, lastIndex),
			yForRating(point.rating, ceiling),
			RATING_RACE_SHARE.dotRadius,
			0,
			Math.PI * 2,
		);
		context.fill();
	}
}

function drawSeriesTip(
	context: CanvasRenderingContext2D,
	leader: RatingRaceLeader,
	tip: RatingRacePoint,
	avatars: ReadonlyMap<string, HTMLImageElement>,
	lastIndex: number,
	ceiling: number,
) {
	const size = RATING_RACE_SHARE.avatar;
	const radius = size / 2;
	const ring = radius + 2;
	const cx = xForAt(tip.at, lastIndex);
	const cy = yForRating(tip.rating, ceiling);
	const image = avatarForSeries(leader.series, avatars);

	context.beginPath();
	context.arc(cx, cy, ring, 0, Math.PI * 2);
	context.fillStyle = leader.series.color;
	context.fill();

	drawTipAvatar(context, image, leader.series.name, cx, cy, radius, size);

	context.fillStyle = RATING_RACE_COLOR.fg;
	context.font = RATING_RACE_FONT.label;
	context.textAlign = "left";
	context.textBaseline = "middle";
	context.fillText(
		`${ratingRacePositionLabel(leader.position)}  ${formatEventRating(leader.rating)}`,
		cx + ring + 8,
		cy,
	);
}

function drawTipAvatar(
	context: CanvasRenderingContext2D,
	image: HTMLImageElement | undefined,
	name: string,
	cx: number,
	cy: number,
	radius: number,
	size: number,
) {
	if (!image) {
		context.fillStyle = RATING_RACE_COLOR.onColor;
		context.font = RATING_RACE_FONT.initial;
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.fillText(seriesInitial(name), cx, cy);
		return;
	}

	context.save();
	context.beginPath();
	context.arc(cx, cy, radius, 0, Math.PI * 2);
	context.closePath();
	context.clip();
	context.drawImage(image, cx - radius, cy - radius, size, size);
	context.restore();
}
