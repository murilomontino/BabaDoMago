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
	padding: 28,
	gap: 16,
	headerHeight: 96,
	tableHeaderHeight: 44,
	rowHeight: 64,
	playerColumnWidth: 320,
	columnMinWidth: 120,
	avatar: 40,
	avatarGap: 12,
	barHeight: 28,
	barRadius: 8,
	legendItemGap: 18,
	legendSwatch: 16,
	legendLineHeight: 28,
	filePrefix: "heatmap-forma",
	mimePng: "image/png",
	title: FORM_HEATMAP_LABEL.title,
	hint: FORM_HEATMAP_LABEL.hint,
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
	avatar: "#dcfce7",
	avatarText: "#166534",
	[FORM_HEATMAP_CELL.absent]: "transparent",
	[FORM_HEATMAP_CELL.insufficient]: "#e7e5e4",
	[FORM_HEATMAP_CELL.up]: "#86efac",
	[FORM_HEATMAP_CELL.down]: "#fca5a5",
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
	legalName: string | null;
	avatarUrl: string | null;
	cells: FormHeatmapCellKind[];
};

export type FormHeatmapShareCard = {
	championshipName: string;
	title: string;
	context: string;
	hint: string;
	columns: FormHeatmapShareColumn[];
	rows: FormHeatmapShareRow[];
};

export function formHeatmapShareLegalName(player: {
	nickname: string | null;
	display_name: string;
}): string | null {
	const visible = playerVisibleName(player);
	const legal = player.display_name.trim();
	if (!legal || legal === visible) {
		return null;
	}

	return legal;
}

export function formHeatmapShareCard(
	grid: FormHeatmapGrid,
	championshipName: string,
	context: string,
): FormHeatmapShareCard {
	return {
		championshipName,
		title: FORM_HEATMAP_SHARE.title,
		context,
		hint: FORM_HEATMAP_SHARE.hint,
		columns: grid.columns.map((column) => ({
			eventId: column.eventId,
			label: formatEventStartsAt(column.startsAt).date,
		})),
		rows: grid.rows.map((row) => ({
			playerId: row.player.id,
			name: playerVisibleName(row.player),
			legalName: formHeatmapShareLegalName(row.player),
			avatarUrl: row.player.avatar_url,
			cells: row.cells.map((cell) => cell.kind),
		})),
	};
}

export function formHeatmapShareContext(
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

export function formHeatmapShareDrawsCell(kind: FormHeatmapCellKind): boolean {
	return kind !== FORM_HEATMAP_CELL.absent;
}

export function formHeatmapShareColumnWidth(columnCount: number): number {
	if (columnCount <= 0) {
		return FORM_HEATMAP_SHARE.columnMinWidth;
	}

	const available =
		FORM_HEATMAP_SHARE.width -
		FORM_HEATMAP_SHARE.padding * 2 -
		FORM_HEATMAP_SHARE.playerColumnWidth;
	const evenly = Math.floor(available / columnCount);
	if (evenly < FORM_HEATMAP_SHARE.columnMinWidth) {
		return FORM_HEATMAP_SHARE.columnMinWidth;
	}

	return evenly;
}

export function formHeatmapShareBarWidth(columnWidth: number): number {
	return Math.max(48, Math.floor(columnWidth * 0.72));
}

export function formHeatmapShareImageWidth(columnCount: number): number {
	const columnsWidth = columnCount * formHeatmapShareColumnWidth(columnCount);
	return Math.max(
		FORM_HEATMAP_SHARE.width,
		FORM_HEATMAP_SHARE.padding * 2 +
			FORM_HEATMAP_SHARE.playerColumnWidth +
			columnsWidth,
	);
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
