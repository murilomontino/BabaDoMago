import { formatEventStartsAt } from "@/const/championship-event";
import { EVENT_MVP_LABEL } from "@/const/event-mvp";
import { formatEventRating } from "@/const/event-rating-adjustment";
import {
	EVENT_RECAP_SHARE,
	EVENT_RECAP_SHARE_COPY,
	EVENT_RECAP_SHARE_LABEL,
	type EventRecapShareRank,
	type EventRecapShareRatingChange,
	eventRecapShareDataFromEvent,
	eventRecapShareDeltaLabel,
	eventRecapShareFileName,
	eventRecapShareImageHeight,
	eventRecapShareRankCardHeight,
	eventRecapShareText,
} from "@/const/event-recap-share";
import { shareOrDownload } from "@/lib/share-file";
import type {
	ChampionshipEventMatch,
	ChampionshipEventTeam,
} from "@/types/championship-event";

const SHARE_SCALE = 2;

const SHARE_COLOR = {
	field: "#fafaf9",
	surface: "#ffffff",
	fg: "#1c1917",
	fgMuted: "#57534e",
	fgSubtle: "#a8a29e",
	line: "#e7e5e4",
	pitch: "#166534",
	pitchSoft: "#ecfdf5",
	danger: "#b91c1c",
	dangerSoft: "#fef2f2",
} as const;

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		try {
			canvas.toBlob((blob) => {
				if (!blob) {
					reject(new Error(EVENT_RECAP_SHARE_LABEL.shareFailed));
					return;
				}

				resolve(blob);
			}, EVENT_RECAP_SHARE.mimePng);
		} catch {
			reject(new Error(EVENT_RECAP_SHARE_LABEL.shareFailed));
		}
	});
}

function fitText(
	context: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
): string {
	if (context.measureText(text).width <= maxWidth) {
		return text;
	}

	let truncated = text;
	while (
		truncated.length > 0 &&
		context.measureText(`${truncated}…`).width > maxWidth
	) {
		truncated = truncated.slice(0, -1);
	}

	if (!truncated) {
		return "…";
	}

	return `${truncated}…`;
}

function drawOuter(
	context: CanvasRenderingContext2D,
	width: number,
	height: number,
): void {
	context.fillStyle = SHARE_COLOR.field;
	context.fillRect(0, 0, width, height);
}

function drawCard(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	fill: string = SHARE_COLOR.surface,
): void {
	context.fillStyle = fill;
	context.strokeStyle = SHARE_COLOR.line;
	context.lineWidth = EVENT_RECAP_SHARE.cardStrokeWidth;
	context.beginPath();
	context.roundRect(x, y, width, height, EVENT_RECAP_SHARE.cardRadius);
	context.fill();
	context.stroke();
}

function drawSectionTitle(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	title: string,
): number {
	context.fillStyle = SHARE_COLOR.fg;
	context.font = `800 ${EVENT_RECAP_SHARE.sectionTitleSizePx}px system-ui, sans-serif`;
	context.textAlign = "start";
	context.textBaseline = "top";
	context.fillText(title, x, y);
	return (
		y + EVENT_RECAP_SHARE.sectionTitleSizePx + EVENT_RECAP_SHARE.sectionTitleGap
	);
}

function drawHeader(
	context: CanvasRenderingContext2D,
	championshipName: string,
	startsAt: string,
): void {
	const width = EVENT_RECAP_SHARE.width;
	const innerX = EVENT_RECAP_SHARE.padding;
	const innerWidth = width - EVENT_RECAP_SHARE.padding * 2;
	const cardY = EVENT_RECAP_SHARE.padding;
	const padX = EVENT_RECAP_SHARE.headerPadX;
	const nameMax = innerWidth - padX * 2;

	drawCard(context, innerX, cardY, innerWidth, EVENT_RECAP_SHARE.headerHeight);

	context.textBaseline = "middle";
	context.textAlign = "start";
	context.fillStyle = SHARE_COLOR.fgMuted;
	context.font = "700 22px system-ui, sans-serif";
	context.fillText(
		fitText(context, championshipName, nameMax),
		innerX + padX,
		cardY + 34,
	);

	const dateLabel = formatEventStartsAt(startsAt).date;
	context.fillStyle = SHARE_COLOR.fg;
	context.font = "900 32px system-ui, sans-serif";
	context.fillText(
		fitText(context, `${EVENT_RECAP_SHARE.title} · ${dateLabel}`, nameMax),
		innerX + padX,
		cardY + 72,
	);
}

function drawMatchRow(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	row: {
		teamAName: string;
		teamBName: string;
		scoreLabel: string;
	},
): number {
	drawCard(context, x, y, width, EVENT_RECAP_SHARE.matchesRowHeight);

	const pad = EVENT_RECAP_SHARE.cardPadX;
	const col = (width - pad * 2) / 3;
	const midY = y + EVENT_RECAP_SHARE.matchesRowHeight / 2;

	context.fillStyle = SHARE_COLOR.fg;
	context.font = "800 24px system-ui, sans-serif";
	context.textBaseline = "middle";

	context.textAlign = "start";
	context.fillText(fitText(context, row.teamAName, col - 8), x + pad, midY);

	context.textAlign = "center";
	context.font = "900 28px system-ui, sans-serif";
	context.fillText(fitText(context, row.scoreLabel, col), x + width / 2, midY);

	context.textAlign = "end";
	context.font = "800 24px system-ui, sans-serif";
	context.fillText(
		fitText(context, row.teamBName, col - 8),
		x + width - pad,
		midY,
	);

	return y + EVENT_RECAP_SHARE.matchesRowHeight + EVENT_RECAP_SHARE.matchGap;
}

function drawStatCard(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	label: string,
	value: string,
	hint: string,
	fill: string,
): void {
	drawCard(context, x, y, width, EVENT_RECAP_SHARE.statCardHeight, fill);

	const pad = EVENT_RECAP_SHARE.cardPadX;
	const max = width - pad * 2;

	context.textAlign = "start";
	context.textBaseline = "middle";

	context.fillStyle = SHARE_COLOR.fgMuted;
	context.font = "700 16px system-ui, sans-serif";
	context.fillText(fitText(context, label, max), x + pad, y + 24);

	context.fillStyle = SHARE_COLOR.fg;
	context.font = "800 26px system-ui, sans-serif";
	context.fillText(fitText(context, value, max), x + pad, y + 54);

	context.fillStyle = SHARE_COLOR.fgMuted;
	context.font = "600 16px system-ui, sans-serif";
	context.fillText(fitText(context, hint, max), x + pad, y + 78);
}

function drawRankCard(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	title: string,
	rows: readonly EventRecapShareRank[],
	unit: string,
): void {
	const height = eventRecapShareRankCardHeight(rows.length);
	drawCard(context, x, y, width, height);

	const pad = EVENT_RECAP_SHARE.rankCardPad;
	const innerX = x + pad;
	const max = width - pad * 2;

	context.textAlign = "start";
	context.textBaseline = "middle";
	context.fillStyle = SHARE_COLOR.fg;
	context.font = "800 20px system-ui, sans-serif";
	context.fillText(
		fitText(context, title, max),
		innerX,
		y + pad + EVENT_RECAP_SHARE.rankTitleHeight / 2,
	);

	const listY = y + pad + EVENT_RECAP_SHARE.rankTitleHeight;
	if (rows.length === 0) {
		context.fillStyle = SHARE_COLOR.fgSubtle;
		context.font = "600 20px system-ui, sans-serif";
		context.fillText(
			EVENT_RECAP_SHARE_COPY.emptyValue,
			innerX,
			listY + EVENT_RECAP_SHARE.rankRowHeight / 2,
		);
		return;
	}

	for (const [index, row] of rows.entries()) {
		const rowY = listY + index * EVENT_RECAP_SHARE.rankRowHeight;
		const midY = rowY + EVENT_RECAP_SHARE.rankRowHeight / 2;
		const value = `${row.value} ${unit}`;

		context.font = "700 18px system-ui, sans-serif";
		context.fillStyle = SHARE_COLOR.fgMuted;
		context.textAlign = "start";
		const rank = `${index + 1}`;
		context.fillText(rank, innerX, midY);
		const rankWidth = context.measureText("0").width + 16;

		context.font = "700 20px system-ui, sans-serif";
		context.fillStyle = SHARE_COLOR.fgMuted;
		context.textAlign = "end";
		context.fillText(value, x + width - pad, midY);
		const valueWidth = context.measureText(value).width + 12;

		context.fillStyle = SHARE_COLOR.fg;
		context.textAlign = "start";
		context.fillText(
			fitText(context, row.name, max - rankWidth - valueWidth),
			innerX + rankWidth,
			midY,
		);
	}
}

const RATING_CHIP_TONE = {
	muted: { fill: "#f5f5f4", value: SHARE_COLOR.fg },
	up: { fill: SHARE_COLOR.pitchSoft, value: SHARE_COLOR.pitch },
	down: { fill: SHARE_COLOR.dangerSoft, value: SHARE_COLOR.danger },
} as const;

type RatingChipTone = keyof typeof RATING_CHIP_TONE;

function ratingChipToneStyle(
	tone: RatingChipTone,
): (typeof RATING_CHIP_TONE)[RatingChipTone] {
	switch (tone) {
		case "muted":
			return RATING_CHIP_TONE.muted;
		case "up":
			return RATING_CHIP_TONE.up;
		case "down":
			return RATING_CHIP_TONE.down;
		default: {
			const _never: never = tone;
			return _never;
		}
	}
}

function ratingDeltaChipTone(delta: number): RatingChipTone {
	if (delta >= 0) {
		return "up";
	}

	return "down";
}

function drawRatingChip(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	caption: string,
	value: string,
	tone: RatingChipTone,
): void {
	const style = ratingChipToneStyle(tone);

	context.fillStyle = style.fill;
	context.beginPath();
	context.roundRect(x, y, width, height, 12);
	context.fill();

	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillStyle = SHARE_COLOR.fgMuted;
	context.font = "700 13px system-ui, sans-serif";
	context.fillText(caption, x + width / 2, y + 14);

	context.fillStyle = style.value;
	context.font = "800 24px system-ui, sans-serif";
	context.fillText(value, x + width / 2, y + height - 16);
}

function drawRatingRow(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	row: EventRecapShareRatingChange,
): number {
	const fill = row.isMvp ? SHARE_COLOR.pitchSoft : SHARE_COLOR.surface;
	drawCard(context, x, y, width, EVENT_RECAP_SHARE.ratingRowHeight, fill);

	const pad = EVENT_RECAP_SHARE.cardPadX;
	const nameY = y + 22;
	const delta = eventRecapShareDeltaLabel(row.delta);
	const from = formatEventRating(row.from);
	const to = formatEventRating(row.to);
	const deltaColor = ratingChipToneStyle(ratingDeltaChipTone(row.delta)).value;

	context.textBaseline = "middle";
	context.textAlign = "start";
	context.fillStyle = SHARE_COLOR.fg;
	context.font = "800 22px system-ui, sans-serif";
	const nameMax = width - pad * 2 - (row.isMvp ? 72 : 0);
	context.fillText(fitText(context, row.name, nameMax), x + pad, nameY);

	if (row.isMvp) {
		context.textAlign = "end";
		context.fillStyle = SHARE_COLOR.pitch;
		context.font = "800 16px system-ui, sans-serif";
		context.fillText(EVENT_MVP_LABEL.badge, x + width - pad, nameY);
	}

	const chipY = y + 42;
	const chipH = 52;
	const chipW = 168;
	const arrowGap = 36;
	drawRatingChip(
		context,
		x + pad,
		chipY,
		chipW,
		chipH,
		EVENT_RECAP_SHARE_COPY.ratingFrom,
		from,
		"muted",
	);

	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillStyle = SHARE_COLOR.fg;
	context.font = "800 22px system-ui, sans-serif";
	context.fillText(
		EVENT_RECAP_SHARE_COPY.arrow,
		x + pad + chipW + arrowGap / 2,
		chipY + chipH / 2,
	);

	drawRatingChip(
		context,
		x + pad + chipW + arrowGap,
		chipY,
		chipW,
		chipH,
		EVENT_RECAP_SHARE_COPY.ratingTo,
		to,
		ratingDeltaChipTone(row.delta),
	);

	context.textAlign = "end";
	context.fillStyle = deltaColor;
	context.font = "800 28px system-ui, sans-serif";
	context.fillText(delta, x + width - pad, chipY + chipH / 2);

	return y + EVENT_RECAP_SHARE.ratingRowHeight + EVENT_RECAP_SHARE.ratingRowGap;
}

function renderRecapPng(input: {
	championshipName: string;
	startsAt: string;
	matches: readonly ChampionshipEventMatch[];
	teams: readonly ChampionshipEventTeam[];
	ratingChanges: readonly EventRecapShareRatingChange[];
}): Promise<Blob> {
	const data = eventRecapShareDataFromEvent({
		championshipName: input.championshipName,
		startsAt: input.startsAt,
		matches: input.matches,
		teams: input.teams,
		ratingChanges: input.ratingChanges,
	});

	const width = EVENT_RECAP_SHARE.width;
	const ratingRows = [...data.ratingDeltaUp, ...data.ratingDeltaDown];
	const height = eventRecapShareImageHeight({
		matchCount: data.endedMatches.length,
		scorerCount: data.topScorers.length,
		assistCount: data.topAssists.length,
		ratingCount: ratingRows.length,
	});

	const canvas = document.createElement("canvas");
	canvas.width = width * SHARE_SCALE;
	canvas.height = height * SHARE_SCALE;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(EVENT_RECAP_SHARE_LABEL.shareFailed);
	}
	context.scale(SHARE_SCALE, SHARE_SCALE);

	drawOuter(context, width, height);
	drawHeader(context, input.championshipName, input.startsAt);

	let y =
		EVENT_RECAP_SHARE.padding +
		EVENT_RECAP_SHARE.headerHeight +
		EVENT_RECAP_SHARE.gap;
	const innerX = EVENT_RECAP_SHARE.padding;
	const innerWidth = width - EVENT_RECAP_SHARE.padding * 2;

	y = drawSectionTitle(context, innerX, y, EVENT_RECAP_SHARE_COPY.matches);
	if (data.endedMatches.length === 0) {
		drawCard(
			context,
			innerX,
			y,
			innerWidth,
			EVENT_RECAP_SHARE.matchesRowHeight,
		);
		context.fillStyle = SHARE_COLOR.fgMuted;
		context.font = "600 22px system-ui, sans-serif";
		context.textAlign = "start";
		context.textBaseline = "middle";
		context.fillText(
			EVENT_RECAP_SHARE_COPY.emptyMatches,
			innerX + EVENT_RECAP_SHARE.cardPadX,
			y + EVENT_RECAP_SHARE.matchesRowHeight / 2,
		);
		y += EVENT_RECAP_SHARE.matchesRowHeight;
	} else {
		y = data.endedMatches.reduce(
			(nextY, matchRow) =>
				drawMatchRow(context, innerX, nextY, innerWidth, matchRow),
			y,
		);
		y -= EVENT_RECAP_SHARE.matchGap;
	}

	y += EVENT_RECAP_SHARE.gap;
	y = drawSectionTitle(context, innerX, y, EVENT_RECAP_SHARE_COPY.highlights);

	const colGap = EVENT_RECAP_SHARE.columnGap;
	const colWidth = (innerWidth - colGap) / 2;
	const mvpValue =
		data.mvpNames.length === 0
			? EVENT_RECAP_SHARE_COPY.emptyValue
			: data.mvpNames.join(", ");
	const mostWinsValue = data.mostWinsTeam
		? data.mostWinsTeam.names.join(", ")
		: EVENT_RECAP_SHARE_COPY.emptyValue;
	const mostWinsHint = data.mostWinsTeam
		? `${data.mostWinsTeam.value} ${EVENT_RECAP_SHARE_COPY.wins}`
		: EVENT_RECAP_SHARE_COPY.emptyMostWins;
	const mvpHint =
		data.mvpNames.length === 0
			? EVENT_RECAP_SHARE_COPY.emptyMvp
			: EVENT_MVP_LABEL.badge;

	drawStatCard(
		context,
		innerX,
		y,
		colWidth,
		EVENT_RECAP_SHARE_COPY.mostWins,
		mostWinsValue,
		mostWinsHint,
		SHARE_COLOR.surface,
	);
	drawStatCard(
		context,
		innerX + colWidth + colGap,
		y,
		colWidth,
		EVENT_RECAP_SHARE_COPY.mvp,
		mvpValue,
		mvpHint,
		SHARE_COLOR.pitchSoft,
	);
	y += EVENT_RECAP_SHARE.statCardHeight;

	const hasRankRow = data.topScorers.length > 0 || data.topAssists.length > 0;
	if (hasRankRow) {
		y += colGap;
		drawRankCard(
			context,
			innerX,
			y,
			colWidth,
			EVENT_RECAP_SHARE_COPY.topScorers,
			data.topScorers,
			EVENT_RECAP_SHARE_COPY.goals,
		);
		drawRankCard(
			context,
			innerX + colWidth + colGap,
			y,
			colWidth,
			EVENT_RECAP_SHARE_COPY.topAssists,
			data.topAssists,
			EVENT_RECAP_SHARE_COPY.assists,
		);
		y += eventRecapShareRankCardHeight(
			Math.max(data.topScorers.length, data.topAssists.length),
		);
	}

	y += EVENT_RECAP_SHARE.gap;
	y = drawSectionTitle(context, innerX, y, EVENT_RECAP_SHARE_COPY.rating);

	if (ratingRows.length === 0) {
		drawCard(context, innerX, y, innerWidth, EVENT_RECAP_SHARE.ratingRowHeight);
		context.fillStyle = SHARE_COLOR.fgMuted;
		context.font = "600 22px system-ui, sans-serif";
		context.textAlign = "start";
		context.textBaseline = "middle";
		context.fillText(
			EVENT_RECAP_SHARE_COPY.emptyRating,
			innerX + EVENT_RECAP_SHARE.cardPadX,
			y + EVENT_RECAP_SHARE.ratingRowHeight / 2,
		);
	} else {
		ratingRows.reduce(
			(nextY, row) => drawRatingRow(context, innerX, nextY, innerWidth, row),
			y,
		);
	}

	return canvasToPng(canvas);
}

export async function shareEventRecapImage(input: {
	championshipName: string;
	startsAt: string;
	matches: readonly ChampionshipEventMatch[];
	teams: readonly ChampionshipEventTeam[];
	ratingChanges: readonly EventRecapShareRatingChange[];
}): Promise<void> {
	const generatedAt = new Date().toISOString();
	const data = eventRecapShareDataFromEvent({
		championshipName: input.championshipName,
		startsAt: input.startsAt,
		matches: input.matches,
		teams: input.teams,
		ratingChanges: input.ratingChanges,
	});

	const blob = await renderRecapPng(input);
	// #region agent log
	fetch("http://127.0.0.1:7501/ingest/7aa36caa-8689-4af1-a425-f57dce975cbd", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Debug-Session-Id": "4c2f81",
		},
		body: JSON.stringify({
			sessionId: "4c2f81",
			runId: "pre-fix",
			hypothesisId: "G",
			location: "share-event-recap-image.ts:shareEventRecapImage",
			message: "painted recap rating lines",
			data: {
				painted: [...data.ratingDeltaUp, ...data.ratingDeltaDown]
					.slice(0, 8)
					.map((row) => ({
						name: row.name,
						from: formatEventRating(row.from),
						to: formatEventRating(row.to),
						delta: eventRecapShareDeltaLabel(row.delta),
						line: `${row.name} ${formatEventRating(row.from)} → ${formatEventRating(row.to)} (${eventRecapShareDeltaLabel(row.delta)})`,
					})),
			},
			timestamp: Date.now(),
		}),
	}).catch(() => {});
	// #endregion
	const file = new File(
		[blob],
		eventRecapShareFileName({
			championshipName: input.championshipName,
			startsAt: input.startsAt,
			generatedAt,
		}),
		{ type: EVENT_RECAP_SHARE.mimePng },
	);

	await shareOrDownload({
		files: [file],
		text: eventRecapShareText(data),
		title: EVENT_RECAP_SHARE.title,
	});
}
