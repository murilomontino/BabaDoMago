import {
	EVENT_BALANCE_INDEX_SHARE,
	EVENT_BALANCE_INDEX_SHARE_COLOR,
	EVENT_BALANCE_INDEX_SHARE_LABEL,
	type EventBalanceIndexShareCard,
	eventBalanceIndexShareFileName,
	eventBalanceIndexShareImageHeight,
	eventBalanceIndexShareText,
	formatEventBalanceIndexShareScore,
} from "@/const/event-balance-index-share";
import { shareOrDownload } from "@/lib/share-file";

const SHARE_SCALE = 2;
const CORNER = 16;

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		try {
			canvas.toBlob((blob) => {
				if (!blob) {
					reject(new Error(EVENT_BALANCE_INDEX_SHARE_LABEL.shareFailed));
					return;
				}

				resolve(blob);
			}, EVENT_BALANCE_INDEX_SHARE.mimePng);
		} catch {
			reject(new Error(EVENT_BALANCE_INDEX_SHARE_LABEL.shareFailed));
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

function drawRoundRect(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
) {
	context.beginPath();
	context.moveTo(x + radius, y);
	context.arcTo(x + width, y, x + width, y + height, radius);
	context.arcTo(x + width, y + height, x, y + height, radius);
	context.arcTo(x, y + height, x, y, radius);
	context.arcTo(x, y, x + width, y, radius);
	context.closePath();
}

function drawHeader(
	context: CanvasRenderingContext2D,
	card: EventBalanceIndexShareCard,
	x: number,
	y: number,
	innerWidth: number,
) {
	context.fillStyle = EVENT_BALANCE_INDEX_SHARE_COLOR.pitch;
	context.font = "700 28px system-ui, sans-serif";
	context.textAlign = "start";
	context.textBaseline = "top";
	context.fillText(
		fitText(
			context,
			card.championshipName || EVENT_BALANCE_INDEX_SHARE.title,
			innerWidth,
		),
		x,
		y,
	);
	context.fillStyle = EVENT_BALANCE_INDEX_SHARE_COLOR.fgMuted;
	context.font = "600 20px system-ui, sans-serif";
	context.fillText(card.title, x, y + 34);
	context.fillStyle = EVENT_BALANCE_INDEX_SHARE_COLOR.fgSubtle;
	context.font = "500 15px system-ui, sans-serif";
	const subtitle = [card.eventDate, card.context]
		.filter((part) => part.length > 0)
		.join(" · ");
	context.fillText(fitText(context, subtitle, innerWidth), x, y + 60);
}

function drawScoreBlock(
	context: CanvasRenderingContext2D,
	card: EventBalanceIndexShareCard,
	x: number,
	y: number,
	width: number,
	height: number,
) {
	context.fillStyle = EVENT_BALANCE_INDEX_SHARE_COLOR.surface;
	drawRoundRect(context, x, y, width, height, CORNER);
	context.fill();
	context.strokeStyle = EVENT_BALANCE_INDEX_SHARE_COLOR.line;
	context.lineWidth = 2;
	context.stroke();

	const centerX = x + width / 2;
	context.textAlign = "center";
	context.textBaseline = "top";
	context.fillStyle = EVENT_BALANCE_INDEX_SHARE_COLOR.pitch;
	context.font = "800 96px system-ui, sans-serif";
	context.fillText(formatEventBalanceIndexShareScore(card.balanceIndex), centerX, y + 36);
	context.fillStyle = EVENT_BALANCE_INDEX_SHARE_COLOR.fg;
	context.font = "700 28px system-ui, sans-serif";
	context.fillText(card.classification.toUpperCase(), centerX, y + 150);

	const barX = x + 48;
	const barY = y + height - 36;
	const barW = width - 96;
	const barH = 14;
	context.fillStyle = EVENT_BALANCE_INDEX_SHARE_COLOR.barTrack;
	drawRoundRect(context, barX, barY, barW, barH, 7);
	context.fill();
	const fillW = Math.max(0, Math.min(barW, (card.balanceIndex / 100) * barW));
	context.fillStyle = EVENT_BALANCE_INDEX_SHARE_COLOR.pitch;
	drawRoundRect(context, barX, barY, fillW, barH, 7);
	context.fill();
}

function drawStats(
	context: CanvasRenderingContext2D,
	card: EventBalanceIndexShareCard,
	x: number,
	y: number,
	width: number,
	height: number,
) {
	context.fillStyle = EVENT_BALANCE_INDEX_SHARE_COLOR.surface;
	drawRoundRect(context, x, y, width, height, CORNER);
	context.fill();
	context.strokeStyle = EVENT_BALANCE_INDEX_SHARE_COLOR.line;
	context.lineWidth = 2;
	context.stroke();

	const rows = [
		`${card.tightGameRateLabel} dos jogos apertados`,
		`Previsto: ${card.predictedMeanLabel}`,
		`Realizado: ${card.realizedMeanLabel}`,
	];

	context.textAlign = "start";
	context.textBaseline = "top";
	context.fillStyle = EVENT_BALANCE_INDEX_SHARE_COLOR.fg;
	context.font = "600 22px system-ui, sans-serif";
	rows.forEach((row, index) => {
		context.fillText(row, x + 32, y + 28 + index * 40);
	});
}

export async function shareEventBalanceIndexImage(
	card: EventBalanceIndexShareCard,
): Promise<void> {
	const width = EVENT_BALANCE_INDEX_SHARE.width;
	const height = eventBalanceIndexShareImageHeight();
	const canvas = document.createElement("canvas");
	canvas.width = width * SHARE_SCALE;
	canvas.height = height * SHARE_SCALE;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(EVENT_BALANCE_INDEX_SHARE_LABEL.shareFailed);
	}

	context.scale(SHARE_SCALE, SHARE_SCALE);
	context.fillStyle = EVENT_BALANCE_INDEX_SHARE_COLOR.field;
	context.fillRect(0, 0, width, height);

	const pad = EVENT_BALANCE_INDEX_SHARE.padding;
	const innerWidth = width - pad * 2;
	let y = pad;
	drawHeader(context, card, pad, y, innerWidth);
	y += EVENT_BALANCE_INDEX_SHARE.headerHeight + EVENT_BALANCE_INDEX_SHARE.gap;
	drawScoreBlock(
		context,
		card,
		pad,
		y,
		innerWidth,
		EVENT_BALANCE_INDEX_SHARE.scoreBlockHeight,
	);
	y +=
		EVENT_BALANCE_INDEX_SHARE.scoreBlockHeight + EVENT_BALANCE_INDEX_SHARE.gap;
	drawStats(
		context,
		card,
		pad,
		y,
		innerWidth,
		EVENT_BALANCE_INDEX_SHARE.statsHeight,
	);

	const blob = await canvasToPng(canvas);
	const fileName = eventBalanceIndexShareFileName({
		championshipName: card.championshipName,
		generatedAt: new Date().toISOString(),
	});
	const file = new File([blob], fileName, {
		type: EVENT_BALANCE_INDEX_SHARE.mimePng,
	});
	await shareOrDownload({
		files: [file],
		title: eventBalanceIndexShareText(card),
		text: eventBalanceIndexShareText(card),
	});
}
