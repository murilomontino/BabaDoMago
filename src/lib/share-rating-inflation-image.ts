import { formatEventRating } from "@/const/event-rating-adjustment";
import {
	RATING_INFLATION_SHARE,
	RATING_INFLATION_SHARE_COLOR,
	RATING_INFLATION_SHARE_LABEL,
	RATING_INFLATION_SHARE_SERIES_ORDER,
	type RatingInflationShareCard,
	type RatingInflationSharePoint,
	type RatingInflationShareSeriesId,
	ratingInflationShareFileName,
	ratingInflationShareImageHeight,
	ratingInflationShareSeriesColor,
	ratingInflationShareSeriesDashed,
	ratingInflationShareSeriesLabel,
	ratingInflationShareSeriesValue,
	ratingInflationShareSeriesValueLabel,
	ratingInflationShareText,
	ratingInflationShareYDomain,
} from "@/const/rating-inflation-share";
import { shareOrDownload } from "@/lib/share-file";

const SHARE_SCALE = 2;
const CORNER = 16;

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		try {
			canvas.toBlob((blob) => {
				if (!blob) {
					reject(new Error(RATING_INFLATION_SHARE_LABEL.shareFailed));
					return;
				}

				resolve(blob);
			}, RATING_INFLATION_SHARE.mimePng);
		} catch {
			reject(new Error(RATING_INFLATION_SHARE_LABEL.shareFailed));
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

function drawHeader(
	context: CanvasRenderingContext2D,
	card: RatingInflationShareCard,
	x: number,
	y: number,
	innerWidth: number,
) {
	context.fillStyle = RATING_INFLATION_SHARE_COLOR.pitch;
	context.font = "700 28px system-ui, sans-serif";
	context.textAlign = "start";
	context.textBaseline = "top";
	context.fillText(
		fitText(
			context,
			card.championshipName || RATING_INFLATION_SHARE.title,
			innerWidth,
		),
		x,
		y,
	);
	context.fillStyle = RATING_INFLATION_SHARE_COLOR.fgMuted;
	context.font = "600 20px system-ui, sans-serif";
	context.fillText(card.title, x, y + 34);
	context.fillStyle = RATING_INFLATION_SHARE_COLOR.fgSubtle;
	context.font = "500 15px system-ui, sans-serif";
	const subtitle = card.context || card.hint;
	context.fillText(fitText(context, subtitle, innerWidth), x, y + 60);
	if (!card.context) {
		return;
	}

	context.fillText(fitText(context, card.hint, innerWidth), x, y + 78);
}

function chartPointT(index: number, lastIndex: number): number {
	if (lastIndex <= 0) {
		return 0.5;
	}

	return index / lastIndex;
}

function valueToY(
	value: number,
	plotY: number,
	plotH: number,
	min: number,
	max: number,
): number {
	const span = max - min;
	if (span <= 0) {
		return plotY + plotH / 2;
	}

	const ratio = Math.min(1, Math.max(0, (value - min) / span));
	return plotY + plotH * (1 - ratio);
}

function drawSeriesLine(
	context: CanvasRenderingContext2D,
	coords: readonly { x: number; y: number }[],
	series: RatingInflationShareSeriesId,
) {
	const first = coords[0];
	if (!first) {
		return;
	}

	context.beginPath();
	context.moveTo(first.x, first.y);
	for (const point of coords.slice(1)) {
		context.lineTo(point.x, point.y);
	}
	context.strokeStyle = ratingInflationShareSeriesColor(series);
	context.lineWidth = 3;
	context.lineJoin = "round";
	context.lineCap = "round";
	if (ratingInflationShareSeriesDashed(series)) {
		context.setLineDash([10, 7]);
	} else {
		context.setLineDash([]);
	}
	context.stroke();
	context.setLineDash([]);
}

function drawSeriesDots(
	context: CanvasRenderingContext2D,
	coords: readonly {
		x: number;
		y: number;
		label: string;
	}[],
	series: RatingInflationShareSeriesId,
) {
	const color = ratingInflationShareSeriesColor(series);
	for (const point of coords) {
		context.beginPath();
		context.arc(point.x, point.y, RATING_INFLATION_SHARE.dotRadius, 0, Math.PI * 2);
		context.fillStyle = color;
		context.fill();
		context.strokeStyle = RATING_INFLATION_SHARE_COLOR.surface;
		context.lineWidth = 2;
		context.stroke();

		context.fillStyle = RATING_INFLATION_SHARE_COLOR.fg;
		context.font = "600 14px system-ui, sans-serif";
		context.textAlign = "center";
		if (series === "floor") {
			context.textBaseline = "top";
			context.fillText(point.label, point.x, point.y + 10);
			continue;
		}

		context.textBaseline = "bottom";
		context.fillText(point.label, point.x, point.y - 10);
	}
}

function drawChart(
	context: CanvasRenderingContext2D,
	points: readonly RatingInflationSharePoint[],
	x: number,
	y: number,
	width: number,
) {
	const {
		chartHeight,
		chartAxis,
		chartBottom,
		chartTopPad,
	} = RATING_INFLATION_SHARE;
	const domain = ratingInflationShareYDomain(points);
	const plotX = x + chartAxis;
	const plotY = y + chartTopPad;
	const plotW = width - chartAxis;
	const plotH = chartHeight - chartTopPad - chartBottom;
	const lastIndex = points.length - 1;
	const ticks = [
		domain.min,
		(domain.min + domain.max) / 2,
		domain.max,
	];

	for (const tick of ticks) {
		const ty = valueToY(tick, plotY, plotH, domain.min, domain.max);
		context.strokeStyle = RATING_INFLATION_SHARE_COLOR.line;
		context.lineWidth = 1;
		context.beginPath();
		context.moveTo(plotX, ty);
		context.lineTo(plotX + plotW, ty);
		context.stroke();
		context.fillStyle = RATING_INFLATION_SHARE_COLOR.fgMuted;
		context.font = "500 14px system-ui, sans-serif";
		context.textAlign = "right";
		context.textBaseline = "middle";
		context.fillText(formatEventRating(tick), plotX - 8, ty);
	}

	for (const series of RATING_INFLATION_SHARE_SERIES_ORDER) {
		const coords = points.map((point, index) => {
			const value = ratingInflationShareSeriesValue(point, series);
			return {
				x: plotX + chartPointT(index, lastIndex) * plotW,
				y: valueToY(value, plotY, plotH, domain.min, domain.max),
				label: ratingInflationShareSeriesValueLabel(point, series),
			};
		});
		drawSeriesLine(context, coords, series);
		drawSeriesDots(context, coords, series);
	}

	context.fillStyle = RATING_INFLATION_SHARE_COLOR.fgMuted;
	context.font = "500 13px system-ui, sans-serif";
	context.textBaseline = "top";
	const first = points[0];
	const last = points[lastIndex];
	if (first) {
		context.textAlign = "left";
		context.fillText(first.label, plotX, plotY + plotH + 10);
	}
	if (last && lastIndex > 0) {
		context.textAlign = "right";
		context.fillText(last.label, plotX + plotW, plotY + plotH + 10);
	}
	if (points.length > 2) {
		const mid = points[Math.floor(lastIndex / 2)];
		if (mid) {
			context.textAlign = "center";
			context.fillText(
				mid.label,
				plotX + chartPointT(Math.floor(lastIndex / 2), lastIndex) * plotW,
				plotY + plotH + 10,
			);
		}
	}
}

function drawLegend(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
) {
	const { legendSwatch, legendItemGap } = RATING_INFLATION_SHARE;
	let cursorX = x;

	context.font = "500 14px system-ui, sans-serif";
	context.textAlign = "start";
	context.textBaseline = "middle";

	for (const series of RATING_INFLATION_SHARE_SERIES_ORDER) {
		const color = ratingInflationShareSeriesColor(series);
		const label = ratingInflationShareSeriesLabel(series);
		context.strokeStyle = color;
		context.lineWidth = 3;
		context.lineCap = "round";
		if (ratingInflationShareSeriesDashed(series)) {
			context.setLineDash([8, 6]);
		} else {
			context.setLineDash([]);
		}
		context.beginPath();
		context.moveTo(cursorX, y);
		context.lineTo(cursorX + legendSwatch, y);
		context.stroke();
		context.setLineDash([]);
		context.beginPath();
		context.arc(cursorX + legendSwatch / 2, y, 4, 0, Math.PI * 2);
		context.fillStyle = color;
		context.fill();
		cursorX += legendSwatch + 8;
		context.fillStyle = RATING_INFLATION_SHARE_COLOR.fgMuted;
		context.fillText(label, cursorX, y);
		cursorX += context.measureText(label).width + legendItemGap;
	}
}

async function renderRatingInflationPng(
	card: RatingInflationShareCard,
): Promise<Blob> {
	const width = RATING_INFLATION_SHARE.width;
	const height = ratingInflationShareImageHeight();
	const canvas = document.createElement("canvas");
	canvas.width = width * SHARE_SCALE;
	canvas.height = height * SHARE_SCALE;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(RATING_INFLATION_SHARE_LABEL.shareFailed);
	}

	context.scale(SHARE_SCALE, SHARE_SCALE);
	context.fillStyle = RATING_INFLATION_SHARE_COLOR.field;
	context.fillRect(0, 0, width, height);

	const { padding, headerHeight, chartHeight, gap, legendHeight } =
		RATING_INFLATION_SHARE;
	const inner = width - padding * 2;

	context.fillStyle = RATING_INFLATION_SHARE_COLOR.surface;
	context.strokeStyle = RATING_INFLATION_SHARE_COLOR.line;
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

	let y = padding;
	drawHeader(context, card, padding, y, inner);
	y += headerHeight;
	drawChart(context, card.points, padding, y, inner);
	y += chartHeight + gap;
	drawLegend(context, padding, y + legendHeight / 2);

	return canvasToPng(canvas);
}

export async function shareRatingInflationImage(
	card: RatingInflationShareCard,
): Promise<void> {
	if (card.points.length === 0) {
		throw new Error(RATING_INFLATION_SHARE_LABEL.shareFailed);
	}

	const blob = await renderRatingInflationPng(card);
	const file = new File(
		[blob],
		ratingInflationShareFileName({
			championshipName: card.championshipName,
			generatedAt: new Date().toISOString(),
		}),
		{ type: RATING_INFLATION_SHARE.mimePng },
	);
	await shareOrDownload({
		files: [file],
		text: ratingInflationShareText(card),
		title: RATING_INFLATION_SHARE.title,
	});
}
