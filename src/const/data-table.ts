export const DATA_TABLE_MOBILE_PRIMARY = {
	player: "player",
	rating: "rating",
} as const;

export const DATA_TABLE_MOBILE_ACTIONS = {
	actions: "actions",
} as const;

export const DATA_TABLE_SORT = {
	label: "Ordenar",
	none: "Padrão",
	asc: "Crescente",
	desc: "Decrescente",
} as const;

export function dataTableDefaultDesc(columnId: string): boolean {
	return columnId !== DATA_TABLE_MOBILE_PRIMARY.player;
}

const MOBILE_PRIMARY_ORDER = [
	DATA_TABLE_MOBILE_PRIMARY.player,
	DATA_TABLE_MOBILE_PRIMARY.rating,
] as const;

const MOBILE_PRIMARY_IDS = new Set<string>(MOBILE_PRIMARY_ORDER);

type CellWithColumnId = {
	column: { id: string };
};

type LegendAbbrItem = {
	id: string;
	abbr: string;
};

export function splitMobileTableCells<T extends CellWithColumnId>(
	cells: readonly T[],
): { primary: T[]; stats: T[]; actions: T[] } {
	const byId = new Map(cells.map((cell) => [cell.column.id, cell]));
	const primary = MOBILE_PRIMARY_ORDER.flatMap((id) => {
		const cell = byId.get(id);
		if (!cell) {
			return [];
		}

		return [cell];
	});
	const rest = cells.filter((cell) => !MOBILE_PRIMARY_IDS.has(cell.column.id));
	const stats = rest.filter(
		(cell) => cell.column.id !== DATA_TABLE_MOBILE_ACTIONS.actions,
	);
	const actions = rest.filter(
		(cell) => cell.column.id === DATA_TABLE_MOBILE_ACTIONS.actions,
	);

	return { primary, stats, actions };
}

export function mobileTableCellAbbr(
	columnId: string,
	legendItems: readonly LegendAbbrItem[],
	title?: string,
): string {
	const match = legendItems.find((item) => item.id === columnId);
	if (match) {
		return match.abbr;
	}

	return title ?? "";
}
