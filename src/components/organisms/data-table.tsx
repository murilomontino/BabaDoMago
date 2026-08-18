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
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { memo, type ReactNode, useEffect, useId } from "react";
import { SortableHeader } from "@/components/atoms/sortable-header";
import { ColumnVisibilityPanel } from "@/components/molecules/column-visibility-panel";
import { TableLegend } from "@/components/molecules/table-legend";
import {
	DATA_TABLE_MOBILE_ACTIONS,
	DATA_TABLE_MOBILE_PRIMARY,
	DATA_TABLE_SORT,
	dataTableDefaultDesc,
	dataTableRowClickHandler,
	dataTableRowKeyDownHandler,
	dataTableSortDirectionLabel,
	mobileTableCellAbbr,
	splitMobileTableCells,
} from "@/const/data-table";
import { TOOLTIP_ID } from "@/const/tooltip";
import { BUTTON_ICON_CLASS, FIELD_CLASS } from "@/const/ui";

const TABLE_CELL_ALIGN = {
	left: "text-left",
	center: "text-center",
	right: "text-right",
} as const;

type TableCellAlign = keyof typeof TABLE_CELL_ALIGN;

function extraRowCellClass(columnId: string, align: TableCellAlign): string {
	const alignClass = TABLE_CELL_ALIGN[align];
	if (columnId === DATA_TABLE_MOBILE_ACTIONS.actions) {
		return `w-px px-0.5 py-1 ${alignClass}`;
	}

	if (columnId === DATA_TABLE_MOBILE_PRIMARY.player) {
		return `px-3 py-3 ${alignClass}`;
	}

	return `whitespace-nowrap px-3 py-3 ${alignClass}`;
}

type ExtraRowCells = Readonly<Record<string, ReactNode>>;

function ExtraMobileRow({ cells }: { cells: ExtraRowCells }) {
	return (
		<li className="py-3">
			<div className="flex min-w-0 items-center justify-between gap-3">
				{[
					DATA_TABLE_MOBILE_PRIMARY.player,
					DATA_TABLE_MOBILE_PRIMARY.rating,
				].flatMap((id) => {
					const cell = cells[id];
					if (!cell) {
						return [];
					}

					return [
						<div
							key={id}
							className={
								id === DATA_TABLE_MOBILE_PRIMARY.player
									? "min-w-0 flex-1"
									: "shrink-0"
							}
						>
							{cell}
						</div>,
					];
				})}
			</div>
			{cells[DATA_TABLE_MOBILE_ACTIONS.actions] && (
				<div className="mt-2 w-full">
					{cells[DATA_TABLE_MOBILE_ACTIONS.actions]}
				</div>
			)}
		</li>
	);
}

function ExtraDesktopRow({
	cells,
	columns,
}: {
	cells: ExtraRowCells;
	columns: ReadonlyArray<{ id: string; align: TableCellAlign }>;
}) {
	return (
		<tr>
			{columns.map((column) => (
				<td
					key={column.id}
					className={extraRowCellClass(column.id, column.align)}
				>
					{cells[column.id] ?? null}
				</td>
			))}
		</tr>
	);
}

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
	initialColumnVisibility?: Readonly<Record<string, boolean>>;
	legendItems?: readonly DataTableLegendItem[];
	onRowClick?: (row: TData) => void;
	getRowClassName?: (row: TData) => string;
	leadingRowCells?: Readonly<Record<string, ReactNode>>;
	trailingRowCells?: Readonly<Record<string, ReactNode>>;
	onSortingChange?: (sorting: { id: string; desc: boolean } | null) => void;
};

function DataTableInner<TData extends RowData>({
	data,
	columns,
	getRowId,
	hideableColumns = [],
	initialColumnVisibility,
	legendItems = [],
	onRowClick,
	getRowClassName,
	leadingRowCells,
	trailingRowCells,
	onSortingChange,
}: DataTableProps<TData>) {
	const sortSelectId = useId();
	const table = useTable(
		{
			features: dataTableFeatures,
			data,
			columns,
			getRowId,
			initialState: {
				columnVisibility: initialColumnVisibility ?? {},
			},
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
				onToggle: (visible: boolean) => {
					column.toggleVisibility(visible);
				},
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

	const sortableColumns = table
		.getAllLeafColumns()
		.filter((column) => column.getCanSort());
	const activeSort = table.state.sorting[0];
	const sortDirectionLabel = dataTableSortDirectionLabel(activeSort?.desc);
	const sortId = activeSort?.id ?? "";
	const sortDesc = activeSort?.desc ?? false;

	useEffect(() => {
		if (!onSortingChange) {
			return;
		}

		if (!sortId) {
			onSortingChange(null);
			return;
		}

		onSortingChange({ id: sortId, desc: sortDesc });
	}, [onSortingChange, sortDesc, sortId]);

	const extraDesktopColumns = table.getVisibleLeafColumns().map((column) => ({
		id: column.id,
		align: column.columnDef.meta?.align ?? "left",
	}));

	return (
		<div>
			{(visibilityItems.length > 0 || sortableColumns.length > 0) && (
				<div className="mb-3 flex flex-wrap items-end gap-3">
					<ColumnVisibilityPanel items={visibilityItems} />
					{sortableColumns.length > 0 && (
						<div className="ml-auto flex items-end gap-1">
							<label
								htmlFor={sortSelectId}
								className="block w-40 text-sm text-fg-muted"
							>
								{DATA_TABLE_SORT.label}
								<select
									id={sortSelectId}
									value={activeSort?.id ?? ""}
									className={`mt-1 ${FIELD_CLASS}`}
									onChange={(event) => {
										const columnId = event.target.value;
										if (!columnId) {
											table.setSorting([]);
											return;
										}

										table.setSorting([
											{
												id: columnId,
												desc: dataTableDefaultDesc(columnId),
											},
										]);
									}}
								>
									<option value="">{DATA_TABLE_SORT.none}</option>
									{sortableColumns.map((column) => (
										<option key={column.id} value={column.id}>
											{column.columnDef.meta?.title ?? column.id}
										</option>
									))}
								</select>
							</label>
							{activeSort && (
								<button
									type="button"
									aria-label={sortDirectionLabel}
									data-tooltip-id={TOOLTIP_ID}
									data-tooltip-content={sortDirectionLabel}
									className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg ${BUTTON_ICON_CLASS}`}
									onClick={() => {
										table.setSorting([
											{
												id: activeSort.id,
												desc: !activeSort.desc,
											},
										]);
									}}
								>
									{activeSort.desc && (
										<ArrowDownWideNarrow className="size-4" />
									)}
									{!activeSort.desc && <ArrowUpNarrowWide className="size-4" />}
								</button>
							)}
						</div>
					)}
				</div>
			)}
			<div className="mb-3">
				<TableLegend items={legend} />
			</div>
			<ul className="divide-y divide-line md:hidden">
				{leadingRowCells && <ExtraMobileRow cells={leadingRowCells} />}
				{table.getRowModel().rows.map((row) => {
					const { primary, stats, actions } = splitMobileTableCells(
						row.getVisibleCells(),
					);

					return (
						<li
							key={row.id}
							className={[
								"py-3",
								onRowClick ? "cursor-pointer" : "",
								getRowClassName?.(row.original) ?? "even:bg-surface-muted",
							]
								.filter(Boolean)
								.join(" ")}
							onClick={dataTableRowClickHandler(onRowClick, row.original)}
							onKeyDown={dataTableRowKeyDownHandler(onRowClick, row.original)}
						>
							<div className="flex min-w-0 items-center justify-between gap-3">
								{primary.map((cell) => (
									<div
										key={cell.id}
										className={
											cell.column.id === DATA_TABLE_MOBILE_PRIMARY.player
												? "min-w-0 flex-1"
												: "shrink-0"
										}
									>
										<table.FlexRender cell={cell} />
									</div>
								))}
							</div>
							{stats.length > 0 && (
								<div className="mt-2 overflow-x-auto">
									<table className="w-full border-collapse text-sm">
										<thead>
											<tr>
												{stats.map((cell) => {
													const label = mobileTableCellAbbr(
														cell.column.id,
														legendItems,
														cell.column.columnDef.meta?.title,
													);

													return (
														<th
															key={cell.id}
															title={cell.column.columnDef.meta?.title}
															className="px-1 py-1 text-center text-xs font-semibold uppercase tracking-wide text-fg-muted"
														>
															{label}
														</th>
													);
												})}
											</tr>
										</thead>
										<tbody>
											<tr>
												{stats.map((cell) => (
													<td
														key={cell.id}
														className="whitespace-nowrap px-1 py-1 text-center tabular-nums"
													>
														<table.FlexRender cell={cell} />
													</td>
												))}
											</tr>
										</tbody>
									</table>
								</div>
							)}
							{actions.length > 0 && (
								<div className="mt-2 w-full">
									{actions.map((cell) => (
										<div key={cell.id}>
											<table.FlexRender cell={cell} />
										</div>
									))}
								</div>
							)}
						</li>
					);
				})}
				{trailingRowCells && <ExtraMobileRow cells={trailingRowCells} />}
			</ul>
			<div className="hidden overflow-x-auto md:block">
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
						{leadingRowCells && (
							<ExtraDesktopRow
								cells={leadingRowCells}
								columns={extraDesktopColumns}
							/>
						)}
						{table.getRowModel().rows.map((row) => (
							<tr
								key={row.id}
								className={[
									onRowClick ? "cursor-pointer" : "",
									getRowClassName?.(row.original) ?? "even:bg-surface-muted",
								]
									.filter(Boolean)
									.join(" ")}
								onClick={dataTableRowClickHandler(onRowClick, row.original)}
							>
								{row.getVisibleCells().map((cell) => {
									const align = cell.column.columnDef.meta?.align ?? "left";
									const alignClass = TABLE_CELL_ALIGN[align];
									const isActions =
										cell.column.id === DATA_TABLE_MOBILE_ACTIONS.actions;

									return (
										<td
											key={cell.id}
											className={`${isActions ? "w-px px-0.5 py-1" : "whitespace-nowrap px-3 py-3"} ${alignClass}`}
										>
											<table.FlexRender cell={cell} />
										</td>
									);
								})}
							</tr>
						))}
						{trailingRowCells && (
							<ExtraDesktopRow
								cells={trailingRowCells}
								columns={extraDesktopColumns}
							/>
						)}
					</tbody>
				</table>
			</div>
			<div className="mt-3">
				<TableLegend items={legend} />
			</div>
		</div>
	);
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;
