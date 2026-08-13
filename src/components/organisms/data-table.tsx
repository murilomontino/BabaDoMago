import {
	type ColumnDef,
	columnVisibilityFeature,
	createSortedRowModel,
	type RowData,
	rowSortingFeature,
	sortFn_alphanumeric,
	sortFn_basic,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { SortableHeader } from "@/components/atoms/sortable-header";
import { ColumnVisibilityPanel } from "@/components/molecules/column-visibility-panel";
import { TableLegend } from "@/components/molecules/table-legend";

const TABLE_CELL_ALIGN = {
	left: "text-left",
	center: "text-center",
	right: "text-right",
} as const;

export const dataTableFeatures = tableFeatures({
	columnVisibilityFeature,
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
	sortFns: {
		alphanumeric: sortFn_alphanumeric,
		basic: sortFn_basic,
	},
	columnMeta: {} as { align?: "left" | "center" | "right"; title?: string },
});

export type DataTableFeatures = typeof dataTableFeatures;

export type DataTableColumnDef<TData extends RowData> = ColumnDef<
	DataTableFeatures,
	TData,
	unknown
>;

export type DataTableHideableColumn = {
	id: string;
	label: string;
};

export type DataTableLegendItem = {
	id: string;
	abbr: string;
	label: string;
};

type DataTableProps<TData extends RowData> = {
	data: TData[];
	columns: ReadonlyArray<DataTableColumnDef<TData>>;
	getRowId: (row: TData) => string;
	hideableColumns?: readonly DataTableHideableColumn[];
	legendItems?: readonly DataTableLegendItem[];
	onRowClick?: (row: TData) => void;
	getRowClassName?: (row: TData) => string;
};

export function DataTable<TData extends RowData>({
	data,
	columns,
	getRowId,
	hideableColumns = [],
	legendItems = [],
	onRowClick,
	getRowClassName,
}: DataTableProps<TData>) {
	const table = useTable(
		{
			features: dataTableFeatures,
			data,
			columns,
			getRowId,
		},
		(state) => ({
			sorting: state.sorting,
			columnVisibility: state.columnVisibility,
		}),
	);

	const visibilityItems = hideableColumns.flatMap((item) => {
		const column = table.getColumn(item.id);
		if (!column?.getCanHide()) {
			return [];
		}

		return [
			{
				id: item.id,
				label: item.label,
				visible: column.getIsVisible(),
				onToggle: column.getToggleVisibilityHandler(),
			},
		];
	});

	const legend = legendItems.flatMap((item) => {
		const column = table.getColumn(item.id);
		if (!column?.getIsVisible()) {
			return [];
		}

		return [{ abbr: item.abbr, label: item.label }];
	});

	return (
		<div>
			<ColumnVisibilityPanel items={visibilityItems} />
			<div className="mb-3">
				<TableLegend items={legend} />
			</div>
			<div className="overflow-x-auto">
				<table className="w-full min-w-max border-collapse text-sm">
					<thead className="border-b border-line bg-surface-muted">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<SortableHeader
										key={header.id}
										canSort={header.column.getCanSort()}
										sorted={header.column.getIsSorted()}
										onSort={header.column.getToggleSortingHandler()}
										align={header.column.columnDef.meta?.align}
										title={header.column.columnDef.meta?.title}
									>
										{!header.isPlaceholder && (
											<table.FlexRender header={header} />
										)}
									</SortableHeader>
								))}
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-line">
						{table.getRowModel().rows.map((row) => (
							<tr
								key={row.id}
								className={[
									onRowClick ? "cursor-pointer" : "",
									getRowClassName?.(row.original) ?? "even:bg-surface-muted",
								]
									.filter(Boolean)
									.join(" ")}
								onClick={
									onRowClick
										? () => {
												onRowClick(row.original);
											}
										: undefined
								}
							>
								{row.getVisibleCells().map((cell) => {
									const align = cell.column.columnDef.meta?.align ?? "left";
									const alignClass = TABLE_CELL_ALIGN[align];

									return (
										<td
											key={cell.id}
											className={`whitespace-nowrap px-3 py-3 ${alignClass}`}
										>
											<table.FlexRender cell={cell} />
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="mt-3">
				<TableLegend items={legend} />
			</div>
		</div>
	);
}
