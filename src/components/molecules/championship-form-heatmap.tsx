import { PlayerNameLink } from "@/components/molecules/player-name-link";
import { formatEventStartsAt } from "@/const/championship-event";
import {
	FORM_HEATMAP_CELL,
	FORM_HEATMAP_LABEL,
	type FormHeatmapCell,
	type FormHeatmapCellKind,
	type FormHeatmapGrid,
	formHeatmapCellClassName,
	formHeatmapCellLabel,
	formHeatmapCellTitle,
} from "@/const/championship-form-heatmap";

type ChampionshipFormHeatmapProps = {
	grid: FormHeatmapGrid;
};

type FormHeatmapCellSwatchProps = {
	kind: FormHeatmapCellKind;
	className?: string;
	title?: string;
};

export function FormHeatmapCellSwatch({
	kind,
	className = "",
	title,
}: FormHeatmapCellSwatchProps) {
	return (
		<div
			className={`rounded-sm ${formHeatmapCellClassName(kind)} ${className}`}
			title={title}
			aria-hidden={title ? undefined : true}
		/>
	);
}

function FormHeatmapLegendItem({ kind }: { kind: FormHeatmapCellKind }) {
	return (
		<span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
			<FormHeatmapCellSwatch kind={kind} className="size-3" />
			{formHeatmapCellLabel(kind)}
		</span>
	);
}

function FormHeatmapDataCell({ cell }: { cell: FormHeatmapCell }) {
	return (
		<td className="p-0.5">
			<FormHeatmapCellSwatch
				kind={cell.kind}
				className="h-7 min-w-7"
				title={formHeatmapCellTitle(cell)}
			/>
		</td>
	);
}

type FormHeatmapPlayerStripProps = {
	cells: readonly FormHeatmapCell[];
	columnIds?: readonly number[];
};

export function FormHeatmapPlayerStrip({
	cells,
	columnIds,
}: FormHeatmapPlayerStripProps) {
	if (cells.length === 0) {
		return null;
	}

	return (
		<div
			className="flex gap-0.5"
			role="img"
			aria-label={FORM_HEATMAP_LABEL.title}
		>
			{cells.map((cell, index) => (
				<FormHeatmapCellSwatch
					key={columnIds?.[index] ?? index}
					kind={cell.kind}
					className="h-4 w-4 shrink-0"
					title={formHeatmapCellTitle(cell)}
				/>
			))}
		</div>
	);
}

export function ChampionshipFormHeatmap({
	grid,
}: ChampionshipFormHeatmapProps) {
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
