import { formatEventStartsAt } from "./championship-event.ts";
import {
	FORM_HEATMAP_CELL,
	FORM_HEATMAP_LABEL,
	type FormHeatmapCellKind,
	type FormHeatmapGrid,
	formHeatmapCellLabel,
} from "./championship-form-heatmap.ts";
import { playerVisibleName } from "./player-name.ts";
import { shareFileDateStamp, sharePngFileName } from "./share-file-name.ts";

export const FORM_HEATMAP_SHARE = {
	width: 1080,
	padding: 32,
	gap: 16,
	headerHeight: 88,
	tableHeaderHeight: 40,
	rowHeight: 44,
	playerColumnWidth: 240,
	cellSize: 32,
	cellGap: 6,
	legendItemGap: 20,
	legendSwatch: 14,
	legendLineHeight: 22,
	filePrefix: "heatmap-forma",
	mimePng: "image/png",
	title: FORM_HEATMAP_LABEL.title,
} as const;

export const FORM_HEATMAP_SHARE_LABEL = {
	share: "Compartilhar",
	sharing: "Gerando imagem...",
	shareFailed: "Não foi possível compartilhar o heatmap",
} as const;

export const FORM_HEATMAP_SHARE_COLOR = {
	field: "#fafaf9",
	surface: "#ffffff",
	fg: "#1c1917",
	fgMuted: "#57534e",
	fgSubtle: "#a8a29e",
	line: "#e7e5e4",
	pitch: "#166534",
	pitchSoft: "#ecfdf5",
	[FORM_HEATMAP_CELL.absent]: "#f5f5f4",
	[FORM_HEATMAP_CELL.insufficient]: "#e7e5e4",
	[FORM_HEATMAP_CELL.up]: "#bbf7d0",
	[FORM_HEATMAP_CELL.down]: "#fecaca",
	[FORM_HEATMAP_CELL.deadZone]: "#d6d3d1",
} as const;

export const FORM_HEATMAP_SHARE_LEGEND = [
	FORM_HEATMAP_CELL.up,
	FORM_HEATMAP_CELL.deadZone,
	FORM_HEATMAP_CELL.down,
	FORM_HEATMAP_CELL.insufficient,
	FORM_HEATMAP_CELL.absent,
] as const;

export type FormHeatmapShareColumn = {
	eventId: number;
	label: string;
};

export type FormHeatmapShareRow = {
	playerId: number;
	name: string;
	cells: FormHeatmapCellKind[];
};

export type FormHeatmapShareCard = {
	championshipName: string;
	title: string;
	context: string;
	columns: FormHeatmapShareColumn[];
	rows: FormHeatmapShareRow[];
};

export function formHeatmapShareCard(
	grid: FormHeatmapGrid,
	championshipName: string,
	context: string,
): FormHeatmapShareCard {
	return {
		championshipName,
		title: FORM_HEATMAP_SHARE.title,
		context,
		columns: grid.columns.map((column) => ({
			eventId: column.eventId,
			label: formatEventStartsAt(column.startsAt).date,
		})),
		rows: grid.rows.map((row) => ({
			playerId: row.player.id,
			name: playerVisibleName(row.player),
			cells: row.cells.map((cell) => cell.kind),
		})),
	};
}

export function formHeatmapShareContext(
	parts: readonly (string | null | undefined)[],
): string {
	return parts.flatMap((part) => {
		if (!part) {
			return [];
		}

		return [part];
	}).join(" · ");
}

export function formHeatmapShareFileName(input: {
	championshipName: string;
	generatedAt: string;
}): string {
	return sharePngFileName([
		FORM_HEATMAP_SHARE.filePrefix,
		input.championshipName,
		shareFileDateStamp(input.generatedAt),
	]);
}

export function formHeatmapShareText(card: FormHeatmapShareCard): string {
	if (!card.context) {
		return `${card.title} — ${card.championshipName}`;
	}

	return `${card.title} (${card.context}) — ${card.championshipName}`;
}

export function formHeatmapShareCellColor(kind: FormHeatmapCellKind): string {
	return FORM_HEATMAP_SHARE_COLOR[kind];
}

export function formHeatmapShareLegendLabel(kind: FormHeatmapCellKind): string {
	return formHeatmapCellLabel(kind);
}

export function formHeatmapShareImageHeight(rowCount: number): number {
	return (
		FORM_HEATMAP_SHARE.padding * 2 +
		FORM_HEATMAP_SHARE.headerHeight +
		FORM_HEATMAP_SHARE.tableHeaderHeight +
		rowCount * FORM_HEATMAP_SHARE.rowHeight +
		FORM_HEATMAP_SHARE.gap +
		FORM_HEATMAP_SHARE.legendLineHeight
	);
}

export function formHeatmapShareImageWidth(columnCount: number): number {
	const cells =
		columnCount * (FORM_HEATMAP_SHARE.cellSize + FORM_HEATMAP_SHARE.cellGap);
	return Math.max(
		FORM_HEATMAP_SHARE.width,
		FORM_HEATMAP_SHARE.padding * 2 +
			FORM_HEATMAP_SHARE.playerColumnWidth +
			cells +
			FORM_HEATMAP_SHARE.gap,
	);
}
