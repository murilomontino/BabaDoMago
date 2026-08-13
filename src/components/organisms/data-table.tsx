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

export const dataTableFeatures = tableFeatures({
	columnVisibilityFeature,
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
	sortFns: {
		alphanumeric: sortFn_alphanumeric,
		basic: sortFn_basic,
	},
	columnMeta: {} as { align?: "left" | "right"; title?: string },
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
};

export function DataTable<TData extends RowData>({
	data,
	columns,
	getRowId,
	hideableColumns = [],
	legendItems = [],
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
					<thead className="border-b border-stone-200 bg-stone-50">
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
					<tbody className="divide-y divide-stone-100">
						{table.getRowModel().rows.map((row) => (
							<tr key={row.id}>
								{row.getVisibleCells().map((cell) => {
									const align = cell.column.columnDef.meta?.align;
									const alignClass =
										align === "right" ? "text-right" : "text-left";

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
