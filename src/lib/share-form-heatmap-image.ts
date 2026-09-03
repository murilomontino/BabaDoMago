import {
	FORM_HEATMAP_SHARE,
	FORM_HEATMAP_SHARE_COLOR,
	FORM_HEATMAP_SHARE_LABEL,
	FORM_HEATMAP_SHARE_LEGEND,
	type FormHeatmapShareCard,
	type FormHeatmapShareRow,
	formHeatmapShareBarWidth,
	formHeatmapShareCellColor,
	formHeatmapShareColumnWidth,
	formHeatmapShareDrawsCell,
	formHeatmapShareFileName,
	formHeatmapShareImageHeight,
	formHeatmapShareImageWidth,
	formHeatmapShareLegendLabel,
	formHeatmapShareText,
} from "@/const/form-heatmap-share";
import { loadAvatarMap } from "@/lib/load-avatar";
import { shareOrDownload } from "@/lib/share-file";

const SHARE_SCALE = 2;
const CORNER = 16;

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		try {
			canvas.toBlob((blob) => {
				if (!blob) {
					reject(new Error(FORM_HEATMAP_SHARE_LABEL.shareFailed));
					return;
				}

				resolve(blob);
			}, FORM_HEATMAP_SHARE.mimePng);
		} catch {
			reject(new Error(FORM_HEATMAP_SHARE_LABEL.shareFailed));
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
	card: FormHeatmapShareCard,
	x: number,
	y: number,
	innerWidth: number,
) {
	context.fillStyle = FORM_HEATMAP_SHARE_COLOR.pitch;
	context.font = "700 28px system-ui, sans-serif";
	context.textAlign = "start";
	context.textBaseline = "top";
	context.fillText(
		fitText(
			context,
			card.championshipName || FORM_HEATMAP_SHARE.title,
			innerWidth,
		),
		x,
		y,
	);
	context.fillStyle = FORM_HEATMAP_SHARE_COLOR.fgMuted;
	context.font = "600 20px system-ui, sans-serif";
	context.fillText(card.title, x, y + 34);
	context.fillStyle = FORM_HEATMAP_SHARE_COLOR.fgSubtle;
	context.font = "500 15px system-ui, sans-serif";
	const subtitle = card.context || card.hint;
	context.fillText(fitText(context, subtitle, innerWidth), x, y + 60);
	if (!card.context) {
		return;
	}

	context.fillText(fitText(context, card.hint, innerWidth), x, y + 78);
}

function drawTableHeader(
	context: CanvasRenderingContext2D,
	card: FormHeatmapShareCard,
	x: number,
	y: number,
	columnWidth: number,
) {
	const { tableHeaderHeight, playerColumnWidth } = FORM_HEATMAP_SHARE;
	const midY = y + tableHeaderHeight / 2;

	context.fillStyle = FORM_HEATMAP_SHARE_COLOR.fgMuted;
	context.font = "600 14px system-ui, sans-serif";
	context.textAlign = "start";
	context.textBaseline = "middle";
	context.fillText("Jog", x, midY);

	context.textAlign = "center";
	for (const [index, column] of card.columns.entries()) {
		const cellCenter =
			x + playerColumnWidth + index * columnWidth + columnWidth / 2;
		context.fillText(column.label, cellCenter, midY);
	}
}

function drawAvatar(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	name: string,
	image: HTMLImageElement | undefined,
) {
	const size = FORM_HEATMAP_SHARE.avatar;
	const radius = size / 2;
	const cx = x + radius;
	const cy = y + radius;

	context.save();
	context.beginPath();
	context.arc(cx, cy, radius, 0, Math.PI * 2);
	context.closePath();
	context.clip();

	if (image) {
		context.drawImage(image, x, y, size, size);
		context.restore();
		return;
	}

	context.fillStyle = FORM_HEATMAP_SHARE_COLOR.avatar;
	context.fill();
	context.restore();
	context.fillStyle = FORM_HEATMAP_SHARE_COLOR.avatarText;
	context.font = "600 16px system-ui, sans-serif";
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(name.charAt(0).toUpperCase() || "?", cx, cy);
	context.textAlign = "start";
	context.textBaseline = "alphabetic";
}

function drawPlayerIdentity(
	context: CanvasRenderingContext2D,
	row: FormHeatmapShareRow,
	x: number,
	midY: number,
	avatars: ReadonlyMap<string, HTMLImageElement>,
) {
	const { avatar, avatarGap, playerColumnWidth } = FORM_HEATMAP_SHARE;
	const avatarY = midY - avatar / 2;
	const image = row.avatarUrl ? avatars.get(row.avatarUrl) : undefined;
	drawAvatar(context, x, avatarY, row.name, image);

	const textX = x + avatar + avatarGap;
	const textWidth = playerColumnWidth - avatar - avatarGap - 8;
	context.textAlign = "start";
	context.textBaseline = "middle";

	if (row.legalName) {
		context.fillStyle = FORM_HEATMAP_SHARE_COLOR.fg;
		context.font = "600 16px system-ui, sans-serif";
		context.fillText(fitText(context, row.name, textWidth), textX, midY - 9);
		context.fillStyle = FORM_HEATMAP_SHARE_COLOR.fgMuted;
		context.font = "500 12px system-ui, sans-serif";
		context.fillText(fitText(context, row.legalName, textWidth), textX, midY + 11);
		return;
	}

	context.fillStyle = FORM_HEATMAP_SHARE_COLOR.fg;
	context.font = "600 16px system-ui, sans-serif";
	context.fillText(fitText(context, row.name, textWidth), textX, midY);
}

function drawRow(
	context: CanvasRenderingContext2D,
	card: FormHeatmapShareCard,
	rowIndex: number,
	x: number,
	y: number,
	columnWidth: number,
	avatars: ReadonlyMap<string, HTMLImageElement>,
) {
	const row = card.rows[rowIndex];
	if (!row) {
		return;
	}

	const { rowHeight, playerColumnWidth, barHeight, barRadius } =
		FORM_HEATMAP_SHARE;
	const midY = y + rowHeight / 2;
	const barWidth = formHeatmapShareBarWidth(columnWidth);

	drawPlayerIdentity(context, row, x, midY, avatars);

	for (const [index, kind] of row.cells.entries()) {
		if (!formHeatmapShareDrawsCell(kind)) {
			continue;
		}

		const cellX =
			x + playerColumnWidth + index * columnWidth + (columnWidth - barWidth) / 2;
		const cellY = midY - barHeight / 2;
		context.fillStyle = formHeatmapShareCellColor(kind);
		context.beginPath();
		context.roundRect(cellX, cellY, barWidth, barHeight, barRadius);
		context.fill();
	}
}

function drawLegend(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
) {
	const { legendSwatch, legendItemGap } = FORM_HEATMAP_SHARE;
	let cursorX = x;

	context.font = "500 13px system-ui, sans-serif";
	context.textAlign = "start";
	context.textBaseline = "middle";

	for (const kind of FORM_HEATMAP_SHARE_LEGEND) {
		const label = formHeatmapShareLegendLabel(kind);
		if (formHeatmapShareDrawsCell(kind)) {
			context.fillStyle = formHeatmapShareCellColor(kind);
			context.beginPath();
			context.roundRect(
				cursorX,
				y - legendSwatch / 2,
				legendSwatch * 1.6,
				legendSwatch,
				4,
			);
			context.fill();
			cursorX += legendSwatch * 1.6 + 6;
		} else {
			context.strokeStyle = FORM_HEATMAP_SHARE_COLOR.line;
			context.lineWidth = 1;
			context.strokeRect(
				cursorX,
				y - legendSwatch / 2,
				legendSwatch * 1.6,
				legendSwatch,
			);
			cursorX += legendSwatch * 1.6 + 6;
		}

		context.fillStyle = FORM_HEATMAP_SHARE_COLOR.fgMuted;
		context.fillText(label, cursorX, y);
		cursorX += context.measureText(label).width + legendItemGap;
	}
}

async function renderFormHeatmapPng(
	card: FormHeatmapShareCard,
): Promise<Blob> {
	const avatars = await loadAvatarMap(card.rows.map((row) => row.avatarUrl));
	const columnWidth = formHeatmapShareColumnWidth(card.columns.length);
	const width = formHeatmapShareImageWidth(card.columns.length);
	const height = formHeatmapShareImageHeight(card.rows.length);
	const canvas = document.createElement("canvas");
	canvas.width = width * SHARE_SCALE;
	canvas.height = height * SHARE_SCALE;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(FORM_HEATMAP_SHARE_LABEL.shareFailed);
	}

	context.scale(SHARE_SCALE, SHARE_SCALE);
	context.fillStyle = FORM_HEATMAP_SHARE_COLOR.field;
	context.fillRect(0, 0, width, height);

	const { padding, headerHeight, tableHeaderHeight, rowHeight, gap } =
		FORM_HEATMAP_SHARE;
	const inner = width - padding * 2;

	context.fillStyle = FORM_HEATMAP_SHARE_COLOR.surface;
	context.strokeStyle = FORM_HEATMAP_SHARE_COLOR.line;
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
	drawTableHeader(context, card, padding, y, columnWidth);
	y += tableHeaderHeight;

	for (const [index] of card.rows.entries()) {
		drawRow(
			context,
			card,
			index,
			padding,
			y + index * rowHeight,
			columnWidth,
			avatars,
		);
	}

	y += card.rows.length * rowHeight + gap;
	drawLegend(context, padding, y + FORM_HEATMAP_SHARE.legendLineHeight / 2);

	return canvasToPng(canvas);
}

export async function shareFormHeatmapImage(
	card: FormHeatmapShareCard,
): Promise<void> {
	if (card.rows.length === 0) {
		throw new Error(FORM_HEATMAP_SHARE_LABEL.shareFailed);
	}

	const blob = await renderFormHeatmapPng(card);
	const file = new File(
		[blob],
		formHeatmapShareFileName({
			championshipName: card.championshipName,
			generatedAt: new Date().toISOString(),
		}),
		{ type: FORM_HEATMAP_SHARE.mimePng },
	);
	await shareOrDownload({
		files: [file],
		text: formHeatmapShareText(card),
		title: FORM_HEATMAP_SHARE.title,
	});
}
