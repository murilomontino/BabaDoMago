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
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
	memo,
	type ReactNode,
	useDeferredValue,
	useEffect,
	useId,
} from "react";
import { SortableHeader } from "@/components/atoms/sortable-header";
import { ColumnVisibilityPanel } from "@/components/molecules/column-visibility-panel";
import { TableLegend } from "@/components/molecules/table-legend";
import {
	DATA_TABLE_DESKTOP_QUERY,
	DATA_TABLE_EXTRA_PRESENT,
	DATA_TABLE_MOBILE_ACTIONS,
	DATA_TABLE_MOBILE_PRIMARY,
	DATA_TABLE_ROW_EXIT,
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
import { useMediaQuery } from "@/hooks/use-media-query";

const EMPTY_TABLE_DATA: never[] = [];

const TABLE_CELL_ALIGN = {
	left: "text-left",
	center: "text-center",
	right: "text-right",
} as const;

type TableCellAlign = keyof typeof TABLE_CELL_ALIGN;

function extraRowCellClass(columnId: string, align: TableCellAlign): string {
	const alignClass = TABLE_CELL_ALIGN[align];
	if (
		columnId === DATA_TABLE_MOBILE_ACTIONS.actions ||
		columnId === DATA_TABLE_EXTRA_PRESENT
	) {
		return `w-px px-0.5 py-1 ${alignClass}`;
	}

	if (columnId === DATA_TABLE_MOBILE_PRIMARY.player) {
		return `px-3 py-3 ${alignClass}`;
	}

	return `whitespace-nowrap px-3 py-3 ${alignClass}`;
}

type ExtraRowCells = Readonly<Record<string, ReactNode>>;
type DataTableRowTag = "li" | "tr";
type DataTableRowKeyEvent = {
	key: string;
	preventDefault: () => void;
};

function dataTableRowClassName(
	base: string,
	clickable: boolean,
	custom: string | undefined,
): string {
	return [
		base,
		clickable ? "cursor-pointer" : "",
		custom ?? "even:bg-surface-muted",
	]
		.filter(Boolean)
		.join(" ");
}

function DataTableExitRow({
	as,
	animate,
	reduceMotion,
	className,
	onClick,
	onKeyDown,
	children,
}: {
	as: DataTableRowTag;
	animate: boolean;
	reduceMotion: boolean;
	className: string;
	onClick?: () => void;
	onKeyDown?: (event: DataTableRowKeyEvent) => void;
	children: ReactNode;
}) {
	const exit = {
		y: DATA_TABLE_ROW_EXIT.y,
		opacity: DATA_TABLE_ROW_EXIT.opacity,
	};
	const transition = {
		duration: reduceMotion ? 0 : DATA_TABLE_ROW_EXIT.duration,
	};

	switch (as) {
		case "li":
			if (!animate) {
				return (
					<li className={className} onClick={onClick} onKeyDown={onKeyDown}>
						{children}
					</li>
				);
			}

			return (
				<motion.li
					className={className}
					onClick={onClick}
					onKeyDown={onKeyDown}
					initial={false}
					exit={exit}
					transition={transition}
				>
					{children}
				</motion.li>
			);
		case "tr":
			if (!animate) {
				return (
					<tr className={className} onClick={onClick}>
						{children}
					</tr>
				);
			}

			return (
				<motion.tr
					className={className}
					onClick={onClick}
					initial={false}
					exit={exit}
					transition={transition}
				>
					{children}
				</motion.tr>
			);
		default: {
			const _never: never = as;
			return _never;
		}
	}
}

function DataTableRowPresence({
	animate,
	children,
}: {
	animate: boolean;
	children: ReactNode;
}) {
	if (!animate) {
		return children;
	}

	return <AnimatePresence initial={false}>{children}</AnimatePresence>;
}

function ExtraMobileRow({ cells }: { cells: ExtraRowCells }) {
	const extraFooter =
		cells[DATA_TABLE_MOBILE_ACTIONS.actions] ?? cells[DATA_TABLE_EXTRA_PRESENT];

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
			{extraFooter && <div className="mt-2 w-full">{extraFooter}</div>}
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
	animateRowExit?: boolean;
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
	animateRowExit = false,
}: DataTableProps<TData>) {
	const sortSelectId = useId();
	const isDesktop = useMediaQuery(DATA_TABLE_DESKTOP_QUERY);
	const reduceMotion = useReducedMotion() === true;
	// Linhas entram no render seguinte para o clique pintar sem esperar a lista.
	const rows = useDeferredValue(data, EMPTY_TABLE_DATA);
	const table = useTable(
		{
			features: dataTableFeatures,
			data: rows,
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
			{!isDesktop && (
				<ul className="divide-y divide-line md:hidden">
					{leadingRowCells && <ExtraMobileRow cells={leadingRowCells} />}
					<DataTableRowPresence animate={animateRowExit}>
						{table.getRowModel().rows.map((row) => {
							const { primary, stats, actions } = splitMobileTableCells(
								row.getVisibleCells(),
							);

							return (
								<DataTableExitRow
									key={row.id}
									as="li"
									animate={animateRowExit}
									reduceMotion={reduceMotion}
									className={dataTableRowClassName(
										"py-3",
										Boolean(onRowClick),
										getRowClassName?.(row.original),
									)}
									onClick={dataTableRowClickHandler(onRowClick, row.original)}
									onKeyDown={dataTableRowKeyDownHandler(
										onRowClick,
										row.original,
									)}
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
								</DataTableExitRow>
							);
						})}
					</DataTableRowPresence>
					{trailingRowCells && <ExtraMobileRow cells={trailingRowCells} />}
				</ul>
			)}
			{isDesktop && (
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
							<DataTableRowPresence animate={animateRowExit}>
								{table.getRowModel().rows.map((row) => (
									<DataTableExitRow
										key={row.id}
										as="tr"
										animate={animateRowExit}
										reduceMotion={reduceMotion}
										className={dataTableRowClassName(
											"",
											Boolean(onRowClick),
											getRowClassName?.(row.original),
										)}
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
									</DataTableExitRow>
								))}
							</DataTableRowPresence>
							{trailingRowCells && (
								<ExtraDesktopRow
									cells={trailingRowCells}
									columns={extraDesktopColumns}
								/>
							)}
						</tbody>
					</table>
				</div>
			)}
			<div className="mt-3">
				<TableLegend items={legend} />
			</div>
		</div>
	);
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;
