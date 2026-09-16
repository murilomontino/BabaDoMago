import {
	PLAYER_PERFORMANCE_HEAT_LEGEND,
	PLAYER_PERFORMANCE_LABEL,
	type PlayerPerformanceHeatCell,
	type PlayerPerformanceHeatmap,
	playerPerformanceHeatCellClass,
	playerPerformanceHeatCellLabel,
} from "@/const/player-performance-20";

type ChampionshipPlayerPerformanceHeatmapProps = {
	heatmap: PlayerPerformanceHeatmap;
};

function HeatSwatch({ cell }: { cell: PlayerPerformanceHeatCell }) {
	return (
		<span
			className={`inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-[10px] ${playerPerformanceHeatCellClass(cell)}`}
			aria-hidden
		>
			{playerPerformanceHeatCellLabel(cell)}
		</span>
	);
}

function cellTitle(rowId: string, cell: PlayerPerformanceHeatCell): string {
	const group = PLAYER_PERFORMANCE_HEAT_LEGEND.find(
		(item) => item.id === rowId,
	);
	if (!group) {
		return playerPerformanceHeatCellLabel(cell);
	}
	const match = group.items.find((item) => item.cell === cell);
	if (!match) {
		return playerPerformanceHeatCellLabel(cell);
	}
	return `${group.title}: ${match.caption}`;
}

export function ChampionshipPlayerPerformanceHeatmap({
	heatmap,
}: ChampionshipPlayerPerformanceHeatmapProps) {
	if (heatmap.columns === 0) {
		return null;
	}

	const columnIndexes = Array.from(
		{ length: heatmap.columns },
		(_, index) => index + 1,
	);

	return (
		<div className="space-y-3">
			<div className="overflow-x-auto">
				<p className="mb-2 text-xs font-medium text-fg-muted">
					{PLAYER_PERFORMANCE_LABEL.heatmapTitle}
				</p>
				<table className="w-full min-w-[28rem] border-collapse text-center text-[10px]">
					<thead>
						<tr>
							<th className="sticky left-0 bg-surface px-1 py-1 text-left text-fg-muted">
								{" "}
							</th>
							{columnIndexes.map((index) => (
								<th
									key={index}
									className="px-0.5 py-1 font-medium tabular-nums text-fg-muted"
								>
									{String(index).padStart(2, "0")}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{heatmap.rows.map((row) => (
							<tr key={row.id}>
								<th className="sticky left-0 bg-surface px-1 py-1 text-left font-medium text-fg-muted">
									{row.label}
								</th>
								{columnIndexes.map((column) => {
									const cell = row.cells[column - 1];
									if (!cell) {
										return null;
									}
									return (
										<td key={`${row.id}-${column}`} className="p-0.5">
											<div
												className={`flex size-5 items-center justify-center rounded-sm ${playerPerformanceHeatCellClass(cell)}`}
												title={cellTitle(row.id, cell)}
											>
												{playerPerformanceHeatCellLabel(cell)}
											</div>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="space-y-2 rounded-lg border border-black/10 p-3">
				<p className="text-xs font-medium text-fg-muted">
					{PLAYER_PERFORMANCE_LABEL.heatmapLegend}
				</p>
				{PLAYER_PERFORMANCE_HEAT_LEGEND.map((group) => (
					<div key={group.id} className="space-y-1">
						<p className="text-xs font-medium text-fg">{group.title}</p>
						<div className="flex flex-wrap gap-x-3 gap-y-1.5">
							{group.items.map((item) => (
								<span
									key={`${group.id}-${item.cell}-${item.caption}`}
									className="inline-flex items-center gap-1.5 text-xs text-fg-muted"
								>
									<HeatSwatch cell={item.cell} />
									{item.caption}
								</span>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
