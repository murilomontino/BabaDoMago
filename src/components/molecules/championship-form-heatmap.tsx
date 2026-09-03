import { formatEventStartsAt } from "@/const/championship-event";
import {
	FORM_HEATMAP_CELL,
	FORM_HEATMAP_LABEL,
	type FormHeatmapCell,
	type FormHeatmapCellKind,
	type FormHeatmapGrid,
	formHeatmapCellLabel,
	formHeatmapCellTitle,
} from "@/const/championship-form-heatmap";
import { PlayerNameLink } from "@/components/molecules/player-name-link";

type ChampionshipFormHeatmapProps = {
	grid: FormHeatmapGrid;
};

const FORM_HEATMAP_CELL_CLASS: Record<FormHeatmapCellKind, string> = {
	[FORM_HEATMAP_CELL.absent]: "bg-transparent",
	[FORM_HEATMAP_CELL.insufficient]:
		"bg-surface-muted ring-1 ring-inset ring-black/10",
	[FORM_HEATMAP_CELL.up]: "bg-pitch/25",
	[FORM_HEATMAP_CELL.down]: "bg-danger/20",
	[FORM_HEATMAP_CELL.deadZone]: "bg-black/10",
};

function formHeatmapCellClass(kind: FormHeatmapCellKind): string {
	return FORM_HEATMAP_CELL_CLASS[kind];
}

function FormHeatmapLegendItem({ kind }: { kind: FormHeatmapCellKind }) {
	return (
		<span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
			<span
				className={`inline-block size-3 rounded-sm ${formHeatmapCellClass(kind)}`}
				aria-hidden
			/>
			{formHeatmapCellLabel(kind)}
		</span>
	);
}

function FormHeatmapDataCell({ cell }: { cell: FormHeatmapCell }) {
	return (
		<td className="p-0.5">
			<div
				className={`h-7 min-w-7 rounded-sm ${formHeatmapCellClass(cell.kind)}`}
				title={formHeatmapCellTitle(cell)}
			/>
		</td>
	);
}

export function ChampionshipFormHeatmap({ grid }: ChampionshipFormHeatmapProps) {
	return (
		<div className="space-y-3">
			<div className="overflow-x-auto">
				<table className="w-full min-w-max border-collapse text-xs">
					<thead>
						<tr>
							<th className="sticky left-0 z-10 bg-surface px-2 py-1 text-left font-medium text-fg-muted">
								Jog
							</th>
							{grid.columns.map((column) => (
								<th
									key={column.eventId}
									className="px-1 py-1 text-center font-medium text-fg-muted"
								>
									{formatEventStartsAt(column.startsAt).date}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{grid.rows.map((row) => (
							<tr key={row.player.id}>
								<td className="sticky left-0 z-10 bg-surface px-2 py-1">
									<PlayerNameLink player={row.player} />
								</td>
								{row.cells.map((cell, index) => (
									<FormHeatmapDataCell
										key={`${row.player.id}-${grid.columns[index]?.eventId ?? index}`}
										cell={cell}
									/>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="flex flex-wrap gap-x-4 gap-y-2">
				<span className="text-xs font-medium text-fg-muted">
					{FORM_HEATMAP_LABEL.legend}
				</span>
				<FormHeatmapLegendItem kind={FORM_HEATMAP_CELL.up} />
				<FormHeatmapLegendItem kind={FORM_HEATMAP_CELL.deadZone} />
				<FormHeatmapLegendItem kind={FORM_HEATMAP_CELL.down} />
				<FormHeatmapLegendItem kind={FORM_HEATMAP_CELL.insufficient} />
				<FormHeatmapLegendItem kind={FORM_HEATMAP_CELL.absent} />
			</div>
		</div>
	);
}
