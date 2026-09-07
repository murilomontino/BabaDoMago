import {
	formatPredictedVsRealizedRate,
	formatPredictedVsRealizedSigned,
	formatPredictedVsRealizedValue,
	PREDICTED_VS_REALIZED_LABEL,
	PREDICTED_VS_REALIZED_SHARE,
	type PredictedVsRealizedMatch,
	type PredictedVsRealizedSummary,
	type PredictedVsRealizedWindow,
	predictedVsRealizedShareFileName,
	predictedVsRealizedWindowCaption,
} from "@/const/championship-predicted-vs-realized";
import { shareOrDownload } from "@/lib/share-file";

const SHARE_SCALE = 2;
const CORNER = 16;

const SHARE_COLOR = {
	field: "#fafaf9",
	surface: "#ffffff",
	fg: "#1c1917",
	fgMuted: "#57534e",
	line: "#e7e5e4",
	pitch: "#0f766e",
	reference: "#a8a29e",
} as const;

type SharePredictedVsRealizedInput = {
	championshipName: string;
	window: PredictedVsRealizedWindow;
	summary: PredictedVsRealizedSummary;
	matches: readonly PredictedVsRealizedMatch[];
};

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		try {
			canvas.toBlob((blob) => {
				if (!blob) {
					reject(new Error(PREDICTED_VS_REALIZED_LABEL.shareFailed));
					return;
				}

				resolve(blob);
			}, PREDICTED_VS_REALIZED_SHARE.mimePng);
		} catch {
			reject(new Error(PREDICTED_VS_REALIZED_LABEL.shareFailed));
		}
	});
}

function axisMax(matches: readonly PredictedVsRealizedMatch[]): number {
	const values = matches.flatMap((row) => [
		row.predictedDifference,
		row.realizedDifference,
	]);
	const highest = Math.max(0, ...values);
	return Math.max(1, Math.ceil(highest + 0.5));
}

function favoriteCaption(summary: PredictedVsRealizedSummary): string {
	if (summary.favoriteWinRate === null) {
		return PREDICTED_VS_REALIZED_LABEL.favoriteWonDraw;
	}

	return formatPredictedVsRealizedRate(summary.favoriteWinRate);
}

export async function sharePredictedVsRealizedImage(
	input: SharePredictedVsRealizedInput,
): Promise<void> {
	const width = PREDICTED_VS_REALIZED_SHARE.width;
	const height =
		PREDICTED_VS_REALIZED_SHARE.padding * 2 +
		PREDICTED_VS_REALIZED_SHARE.headerHeight +
		PREDICTED_VS_REALIZED_SHARE.kpiHeight +
		PREDICTED_VS_REALIZED_SHARE.chartHeight;
	const canvas = document.createElement("canvas");
	canvas.width = width * SHARE_SCALE;
	canvas.height = height * SHARE_SCALE;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(PREDICTED_VS_REALIZED_LABEL.shareFailed);
	}

	context.scale(SHARE_SCALE, SHARE_SCALE);
	context.fillStyle = SHARE_COLOR.field;
	context.fillRect(0, 0, width, height);

	const pad = PREDICTED_VS_REALIZED_SHARE.padding;
	roundRect(context, pad, pad, width - pad * 2, height - pad * 2, CORNER);
	context.fillStyle = SHARE_COLOR.surface;
	context.fill();

	let y = pad + 28;
	context.fillStyle = SHARE_COLOR.fg;
	context.font = "700 28px system-ui, sans-serif";
	context.fillText(PREDICTED_VS_REALIZED_LABEL.title, pad + 28, y);
	y += 28;
	context.fillStyle = SHARE_COLOR.fgMuted;
	context.font = "500 16px system-ui, sans-serif";
	context.fillText(input.championshipName, pad + 28, y);
	y += 22;
	context.fillText(
		`${predictedVsRealizedWindowCaption(input.window)} · ${PREDICTED_VS_REALIZED_LABEL.subtitle}`,
		pad + 28,
		y,
	);

	y = pad + PREDICTED_VS_REALIZED_SHARE.headerHeight;
	const kpiGap = 24;
	const kpiWidth = (width - pad * 2 - 56 - kpiGap * 2) / 3;
	drawKpi(
		context,
		pad + 28,
		y,
		kpiWidth,
		PREDICTED_VS_REALIZED_LABEL.mae,
		formatPredictedVsRealizedValue(input.summary.meanAbsoluteError),
	);
	drawKpi(
		context,
		pad + 28 + kpiWidth + kpiGap,
		y,
		kpiWidth,
		PREDICTED_VS_REALIZED_LABEL.bias,
		formatPredictedVsRealizedSigned(input.summary.meanError),
	);
	drawKpi(
		context,
		pad + 28 + (kpiWidth + kpiGap) * 2,
		y,
		kpiWidth,
		PREDICTED_VS_REALIZED_LABEL.withinOne,
		formatPredictedVsRealizedRate(input.summary.withinOneGoalRate),
	);
	context.fillStyle = SHARE_COLOR.fgMuted;
	context.font = "500 13px system-ui, sans-serif";
	context.fillText(
		`${PREDICTED_VS_REALIZED_LABEL.favoriteWin}: ${favoriteCaption(input.summary)}`,
		pad + 28,
		y + 64,
	);

	const chartTop =
		pad +
		PREDICTED_VS_REALIZED_SHARE.headerHeight +
		PREDICTED_VS_REALIZED_SHARE.kpiHeight;
	const chartLeft = pad + PREDICTED_VS_REALIZED_SHARE.chartPad;
	const chartRight = width - pad - PREDICTED_VS_REALIZED_SHARE.chartPad;
	const chartBottom =
		chartTop +
		PREDICTED_VS_REALIZED_SHARE.chartHeight -
		PREDICTED_VS_REALIZED_SHARE.chartPad;
	const chartInnerTop = chartTop + 24;
	const chartWidth = chartRight - chartLeft;
	const chartHeight = chartBottom - chartInnerTop;
	const max = axisMax(input.matches);

	context.strokeStyle = SHARE_COLOR.line;
	context.lineWidth = 1;
	context.beginPath();
	context.moveTo(chartLeft, chartBottom);
	context.lineTo(chartRight, chartBottom);
	context.lineTo(chartRight, chartInnerTop);
	context.stroke();

	context.setLineDash([6, 6]);
	context.strokeStyle = SHARE_COLOR.reference;
	context.beginPath();
	context.moveTo(chartLeft, chartBottom);
	context.lineTo(chartRight, chartInnerTop);
	context.stroke();
	context.setLineDash([]);

	context.fillStyle = SHARE_COLOR.pitch;
	for (const row of input.matches) {
		const x = chartLeft + (row.predictedDifference / max) * chartWidth;
		const yPoint = chartBottom - (row.realizedDifference / max) * chartHeight;
		context.beginPath();
		context.arc(
			x,
			yPoint,
			PREDICTED_VS_REALIZED_SHARE.dotRadius,
			0,
			Math.PI * 2,
		);
		context.fill();
	}

	context.fillStyle = SHARE_COLOR.fgMuted;
	context.font = "500 13px system-ui, sans-serif";
	context.fillText(
		PREDICTED_VS_REALIZED_LABEL.predicted,
		chartLeft,
		chartBottom + 22,
	);
	context.save();
	context.translate(chartLeft - 28, chartInnerTop + chartHeight / 2);
	context.rotate(-Math.PI / 2);
	context.fillText(PREDICTED_VS_REALIZED_LABEL.realized, 0, 0);
	context.restore();

	const blob = await canvasToPng(canvas);
	const fileName = predictedVsRealizedShareFileName(
		input.championshipName,
		input.window,
		input.matches[0]?.eventStartsAt ?? null,
	);
	const file = new File([blob], fileName, {
		type: PREDICTED_VS_REALIZED_SHARE.mimePng,
	});
	await shareOrDownload({
		files: [file],
		title: PREDICTED_VS_REALIZED_LABEL.title,
		text: `${input.championshipName} · ${PREDICTED_VS_REALIZED_LABEL.title}`,
	});
}

function drawKpi(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	label: string,
	value: string,
) {
	context.fillStyle = SHARE_COLOR.fgMuted;
	context.font = "600 13px system-ui, sans-serif";
	context.fillText(label, x, y);
	context.fillStyle = SHARE_COLOR.fg;
	context.font = "700 28px system-ui, sans-serif";
	context.fillText(value, x, y + 32);
	void width;
}

function roundRect(
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
