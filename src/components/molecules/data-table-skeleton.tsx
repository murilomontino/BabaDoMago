import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/atoms/skeleton";
import { TableLegend } from "@/components/molecules/table-legend";
import { DATA_TABLE_SORT } from "@/const/data-table";
import { PLAYER_SEARCH } from "@/const/player-search";
import {
	ROSTER_COLUMN_ABBR,
	ROSTER_COLUMN_IDS,
	ROSTER_LEGEND_ITEMS,
} from "@/const/roster-stats";
import { SKELETON_TABLE_ROWS, skeletonStatHeaders } from "@/const/skeleton";
import { CHIP_CLASS, FIELD_CLASS, PLAYER_AVATAR_CLASS } from "@/const/ui";

const ROSTER_HEADERS = ROSTER_COLUMN_IDS.map((id) => ROSTER_COLUMN_ABBR[id]);

type DataTableLegendItem = {
	abbr: string;
	label: string;
};

type DataTableSkeletonProps = {
	headers?: readonly string[];
	legendItems?: readonly DataTableLegendItem[];
	rows?: readonly number[];
	withSearch?: boolean;
	withColumns?: boolean;
	withPlayerColumn?: boolean;
};

export function DataTableSkeleton({
	headers = ROSTER_HEADERS,
	legendItems = ROSTER_LEGEND_ITEMS,
	rows = SKELETON_TABLE_ROWS,
	withSearch = false,
	withColumns = false,
	withPlayerColumn = true,
}: DataTableSkeletonProps) {
	const statHeaders = skeletonStatHeaders(headers, withPlayerColumn);

	return (
		<div>
			{withSearch && (
				<div className="mb-3 block text-sm text-fg-muted">
					<span className="flex items-center justify-between gap-2">
						{PLAYER_SEARCH.label}
						<span className={CHIP_CLASS}>
							<Skeleton className="inline-block h-3 w-6 align-middle" />{" "}
							{PLAYER_SEARCH.countLabel}
						</span>
					</span>
					<div className={`mt-1 ${FIELD_CLASS}`} />
				</div>
			)}
			{withColumns && (
				<div className="mb-3 flex flex-wrap items-end gap-3">
					<div className="inline-flex items-center gap-1 text-sm font-medium text-fg-muted">
						Colunas
						<ChevronDown className="size-4" />
					</div>
					<div className="ml-auto flex items-end gap-1">
						<div className="block w-40 text-sm text-fg-muted">
							{DATA_TABLE_SORT.label}
							<div className={`mt-1 ${FIELD_CLASS}`} />
						</div>
					</div>
				</div>
			)}
			<div className="mb-3">
				<TableLegend items={legendItems} />
			</div>
			<ul className="divide-y divide-line md:hidden">
				{rows.map((row) => (
					<li key={row} className="py-3">
						{withPlayerColumn && (
							<div className="flex min-w-0 items-center justify-between gap-3">
								<div className="flex min-w-0 flex-1 items-center gap-3">
									<Skeleton className={`${PLAYER_AVATAR_CLASS} rounded-full`} />
									<div className="min-w-0">
										<Skeleton className="h-4 w-28" />
										<Skeleton className="mt-1 h-4 w-14 rounded-full" />
									</div>
								</div>
								<Skeleton className="h-5 w-24 shrink-0" />
							</div>
						)}
						{!withPlayerColumn && <Skeleton className="h-4 w-36" />}
						{statHeaders.length > 0 && (
							<div className="mt-2 overflow-x-auto">
								<table className="w-full border-collapse text-sm">
									<thead>
										<tr>
											{statHeaders.map((header) => (
												<th
													key={header}
													className="px-1 py-1 text-center text-xs font-semibold uppercase tracking-wide text-fg-muted"
												>
													{header}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										<tr>
											{statHeaders.map((header) => (
												<td
													key={header}
													className="whitespace-nowrap px-1 py-1"
												>
													<Skeleton className="mx-auto h-4 w-6" />
												</td>
											))}
										</tr>
									</tbody>
								</table>
							</div>
						)}
					</li>
				))}
			</ul>
			<div className="hidden overflow-x-auto md:block">
				<table className="w-full min-w-max border-collapse text-sm">
					<thead className="border-b border-line bg-surface-muted">
						<tr>
							{headers.map((header) => (
								<th
									key={header}
									className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-fg-muted"
								>
									{header}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-line">
						{rows.map((row) => (
							<tr key={row}>
								{headers.map((header, index) => (
									<td key={header} className="whitespace-nowrap px-3 py-3">
										<TableCellSkeleton
											index={index}
											withPlayerColumn={withPlayerColumn}
										/>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function TableCellSkeleton({
	index,
	withPlayerColumn,
}: {
	index: number;
	withPlayerColumn: boolean;
}) {
	if (withPlayerColumn && index === 0) {
		return (
			<div className="flex items-center gap-3">
				<Skeleton className="size-9 shrink-0 rounded-full" />
				<Skeleton className="h-4 w-28" />
			</div>
		);
	}

	if (withPlayerColumn && index === 1) {
		return <Skeleton className="h-5 w-24" />;
	}

	if (!withPlayerColumn && index === 0) {
		return <Skeleton className="h-4 w-32" />;
	}

	return <Skeleton className="h-4 w-8" />;
}
