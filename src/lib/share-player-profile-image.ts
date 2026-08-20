import { formatEventStartsAt } from "@/const/championship-event";
import { formatEventRating } from "@/const/event-rating-adjustment";
import {
	PLAYER_PROFILE_SHARE,
	PLAYER_PROFILE_SHARE_COLOR,
	PLAYER_PROFILE_SHARE_LABEL,
	type PlayerProfileShareCard,
	playerProfileShareFileName,
	playerProfileShareText,
} from "@/const/player-profile-share";
import {
	PLAYER_RATING,
	PLAYER_STAR_PATH,
	PLAYER_STARS,
	ratingToStarFill,
} from "@/const/player-rating";
import { shareOrDownload } from "@/lib/share-file";

const SHARE_SCALE = 2;
const STAR_VIEWBOX = 24;
const STAT_ROW_HEIGHT = 88;
const CORNER = 28;

function loadAvatar(src: string): Promise<HTMLImageElement | null> {
	return new Promise((resolve) => {
		const image = new Image();
		image.crossOrigin = "anonymous";
		image.referrerPolicy = "no-referrer";
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", () => resolve(null));
		image.src = src;
	});
}

async function loadOptionalAvatar(
	url: string | null | undefined,
): Promise<HTMLImageElement | null> {
	if (!url) {
		return null;
	}

	return loadAvatar(url);
}

function ratioAgainstCeiling(value: number, ceiling: number): number {
	if (ceiling <= 0) {
		return 0;
	}

	return value / ceiling;
}

function chartPointT(index: number, lastIndex: number): number {
	if (lastIndex <= 0) {
		return 0.5;
	}

	return index / lastIndex;
}

function legalNameBlockHeight(legalName: string | null): number {
	if (!legalName) {
		return 0;
	}

	return 36;
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		try {
			canvas.toBlob((blob) => {
				if (!blob) {
					reject(new Error(PLAYER_PROFILE_SHARE_LABEL.shareFailed));
					return;
				}

				resolve(blob);
			}, PLAYER_PROFILE_SHARE.mimePng);
		} catch {
			reject(new Error(PLAYER_PROFILE_SHARE_LABEL.shareFailed));
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

function drawStars(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	rating: number,
	ceiling: number,
) {
	const size = PLAYER_PROFILE_SHARE.star;
	const fill = ratingToStarFill(rating, ceiling);
	const path = new Path2D(PLAYER_STAR_PATH);
	const scale = size / STAR_VIEWBOX;

	function paint(color: string) {
		context.fillStyle = color;
		for (const star of PLAYER_STARS) {
			context.save();
			context.translate(x + star.index * size, y);
			context.scale(scale, scale);
			context.fill(path);
			context.restore();
		}
	}

	paint(PLAYER_PROFILE_SHARE_COLOR.starEmpty);
	context.save();
	context.beginPath();
	context.rect(
		x,
		y,
		(fill / PLAYER_RATING.starCount) * size * PLAYER_RATING.starCount,
		size,
	);
	context.clip();
	paint(PLAYER_PROFILE_SHARE_COLOR.starFill);
	context.restore();
}

function drawAvatar(
	context: CanvasRenderingContext2D,
	cx: number,
	y: number,
	name: string,
	image: HTMLImageElement | null,
) {
	const size = PLAYER_PROFILE_SHARE.avatar;
	const x = cx - size / 2;
	const radius = size / 2;

	context.save();
	context.beginPath();
	context.arc(cx, y + radius, radius, 0, Math.PI * 2);
	context.closePath();
	context.clip();

	if (image) {
		context.drawImage(image, x, y, size, size);
		context.restore();
		return;
	}

	context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.avatar;
	context.fill();
	context.restore();
	context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.fgMuted;
	context.font = "700 56px system-ui, sans-serif";
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(name.charAt(0).toUpperCase() || "?", cx, y + radius);
}

function shareChartBlockHeight(pointCount: number): number {
	if (pointCount === 0) {
		return 0;
	}

	const { gap, chartHeight, chartTitle, chartLabelGap, chartXLabel } =
		PLAYER_PROFILE_SHARE;
	return gap * 2 + chartTitle + chartLabelGap + chartHeight + chartXLabel;
}

function drawRatingChart(
	context: CanvasRenderingContext2D,
	card: PlayerProfileShareCard,
	ceiling: number,
	x: number,
	y: number,
	width: number,
) {
	if (card.chart.length === 0) {
		return;
	}

	const { chartHeight, chartAxis, chartTitle, chartLabelGap } =
		PLAYER_PROFILE_SHARE;
	context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.fg;
	context.font = "600 22px system-ui, sans-serif";
	context.textAlign = "left";
	context.textBaseline = "top";
	context.fillText(PLAYER_PROFILE_SHARE_LABEL.chart, x, y);

	const plotX = x + chartAxis;
	const plotY = y + chartTitle + chartLabelGap;
	const plotW = width - chartAxis;
	const ticks = [0, ceiling / 2, ceiling];
	for (const tick of ticks) {
		const ratio = ratioAgainstCeiling(tick, ceiling);
		const ty = plotY + chartHeight * (1 - ratio);
		context.strokeStyle = PLAYER_PROFILE_SHARE_COLOR.line;
		context.lineWidth = 1;
		context.beginPath();
		context.moveTo(plotX, ty);
		context.lineTo(plotX + plotW, ty);
		context.stroke();
		context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.fgMuted;
		context.font = "500 18px system-ui, sans-serif";
		context.textAlign = "right";
		context.textBaseline = "middle";
		context.fillText(formatEventRating(tick), plotX - 10, ty);
	}

	const lastIndex = card.chart.length - 1;
	const points = card.chart.map((point, index) => {
		const t = chartPointT(index, lastIndex);
		const ratio = Math.min(
			1,
			Math.max(0, ratioAgainstCeiling(point.rating, ceiling)),
		);
		return {
			x: plotX + t * plotW,
			y: plotY + chartHeight * (1 - ratio),
			startsAt: point.startsAt,
			rating: point.rating,
		};
	});
	const first = points[0];
	const last = points[lastIndex];
	if (!first || !last) {
		return;
	}

	context.beginPath();
	context.moveTo(first.x, plotY + chartHeight);
	for (const point of points) {
		context.lineTo(point.x, point.y);
	}
	context.lineTo(last.x, plotY + chartHeight);
	context.closePath();
	context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.pitchSoft;
	context.fill();

	context.beginPath();
	context.moveTo(first.x, first.y);
	for (const point of points.slice(1)) {
		context.lineTo(point.x, point.y);
	}
	context.strokeStyle = PLAYER_PROFILE_SHARE_COLOR.pitch;
	context.lineWidth = 4;
	context.lineJoin = "round";
	context.lineCap = "round";
	context.stroke();

	for (const point of points) {
		context.beginPath();
		context.arc(point.x, point.y, 7, 0, Math.PI * 2);
		context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.pitch;
		context.fill();
		context.strokeStyle = PLAYER_PROFILE_SHARE_COLOR.surface;
		context.lineWidth = 2;
		context.stroke();

		context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.fg;
		context.font = "600 16px system-ui, sans-serif";
		context.textAlign = "center";
		context.textBaseline = "bottom";
		context.fillText(
			formatEventRating(point.rating),
			point.x,
			point.y - 10,
		);
	}

	context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.fgMuted;
	context.font = "500 18px system-ui, sans-serif";
	context.textBaseline = "top";
	context.textAlign = "left";
	context.fillText(
		formatEventStartsAt(first.startsAt).date,
		plotX,
		plotY + chartHeight + 8,
	);
	context.textAlign = "right";
	context.fillText(
		formatEventStartsAt(last.startsAt).date,
		plotX + plotW,
		plotY + chartHeight + 8,
	);
}

function profileImageHeight(card: PlayerProfileShareCard): number {
	const { padding, avatar, star, gap, statColumns } = PLAYER_PROFILE_SHARE;
	const legal = legalNameBlockHeight(card.legalName);
	const statRows = Math.ceil(card.stats.length / statColumns);
	return (
		padding * 2 +
		32 +
		gap +
		avatar +
		gap +
		40 +
		legal +
		36 +
		gap +
		star +
		gap * 2 +
		statRows * STAT_ROW_HEIGHT +
		shareChartBlockHeight(card.chart.length)
	);
}

async function renderPlayerProfilePng(
	card: PlayerProfileShareCard,
	ceiling: number,
): Promise<Blob> {
	const image = await loadOptionalAvatar(card.avatarUrl);
	const width = PLAYER_PROFILE_SHARE.width;
	const height = profileImageHeight(card);
	const canvas = document.createElement("canvas");
	canvas.width = width * SHARE_SCALE;
	canvas.height = height * SHARE_SCALE;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(PLAYER_PROFILE_SHARE_LABEL.shareFailed);
	}

	context.scale(SHARE_SCALE, SHARE_SCALE);
	context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.field;
	context.fillRect(0, 0, width, height);

	const { padding, gap, avatar, star, statColumns } = PLAYER_PROFILE_SHARE;
	const inner = width - padding * 2;
	context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.surface;
	context.strokeStyle = PLAYER_PROFILE_SHARE_COLOR.line;
	context.lineWidth = 2;
	context.beginPath();
	context.roundRect(
		padding / 2,
		padding / 2,
		width - padding,
		height - padding,
		CORNER,
	);
	context.fill();
	context.stroke();

	const cx = width / 2;
	let y = padding;
	context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.pitch;
	context.font = "600 22px system-ui, sans-serif";
	context.textAlign = "center";
	context.textBaseline = "top";
	context.fillText(fitText(context, card.championshipName, inner), cx, y);
	y += 32 + gap;

	drawAvatar(context, cx, y, card.name, image);
	y += avatar + gap;

	context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.fg;
	context.font = "700 40px system-ui, sans-serif";
	context.fillText(fitText(context, card.name, inner), cx, y);
	y += 40;
	if (card.legalName) {
		context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.fgMuted;
		context.font = "500 22px system-ui, sans-serif";
		context.fillText(fitText(context, card.legalName, inner), cx, y);
		y += 36;
	}

	context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.pitchSoft;
	context.beginPath();
	context.roundRect(cx - 90, y, 180, 36, 18);
	context.fill();
	context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.pitch;
	context.font = "600 18px system-ui, sans-serif";
	context.textBaseline = "middle";
	context.fillText(card.roleLabel, cx, y + 18);
	y += 36 + gap;

	drawStars(
		context,
		cx - (star * PLAYER_RATING.starCount) / 2,
		y,
		card.rating,
		ceiling,
	);
	y += star + gap * 2;

	const colWidth = inner / statColumns;
	for (const [index, stat] of card.stats.entries()) {
		const col = index % statColumns;
		const row = Math.floor(index / statColumns);
		const sx = padding + col * colWidth;
		const sy = y + row * STAT_ROW_HEIGHT;
		context.textAlign = "center";
		context.textBaseline = "top";
		context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.fgMuted;
		context.font = "600 18px system-ui, sans-serif";
		context.fillText(stat.abbr, sx + colWidth / 2, sy);
		context.fillStyle = PLAYER_PROFILE_SHARE_COLOR.fg;
		context.font = "700 32px system-ui, sans-serif";
		context.fillText(stat.value, sx + colWidth / 2, sy + 28);
	}

	y += Math.ceil(card.stats.length / statColumns) * STAT_ROW_HEIGHT;
	if (card.chart.length > 0) {
		y += gap * 2;
		drawRatingChart(context, card, ceiling, padding, y, inner);
	}

	return canvasToPng(canvas);
}

export async function sharePlayerProfileImage(
	card: PlayerProfileShareCard,
	ceiling: number,
): Promise<void> {
	const blob = await renderPlayerProfilePng(card, ceiling);
	const file = new File(
		[blob],
		playerProfileShareFileName({
			championshipName: card.championshipName,
			name: card.name,
			playerId: card.playerId,
			generatedAt: new Date().toISOString(),
		}),
		{ type: PLAYER_PROFILE_SHARE.mimePng },
	);
	await shareOrDownload({
		files: [file],
		text: playerProfileShareText(card),
		title: card.name,
	});
}
