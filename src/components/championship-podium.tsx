import { createColumnHelper } from "@tanstack/react-table";
import confetti from "canvas-confetti";
import { Trophy } from "lucide-react";
import { useEffect, useMemo } from "react";
import { EmptyState } from "@/components/empty-state";
import { PlayerNameLink } from "@/components/molecules/player-name-link";
import PodiumPlaceCard from "@/components/molecules/podium-place";
import {
	DataTable,
	type DataTableFeatures,
} from "@/components/organisms/data-table";
import { PlayerRating } from "@/components/player-rating";
import { championshipRatingCeiling } from "@/const/player-rating";
import {
	formatPodiumMetric,
	PODIUM_CONFETTI,
	PODIUM_DISPLAY_ORDER,
	PODIUM_LABEL,
	type PodiumMetricId,
	podiumStandings,
	rankPodiumRows,
} from "@/const/podium";
import {
	ROSTER_COLUMN,
	ROSTER_COLUMN_ABBR,
	ROSTER_COLUMN_LABEL,
	ROSTER_LEGEND_ITEMS,
	ROSTER_STAT_COLUMNS,
	type RosterRow,
	toRosterRow,
} from "@/const/roster-stats";
import { CHIP_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

const podiumConfettiSession = { fired: false };
const podiumColumnHelper = createColumnHelper<DataTableFeatures, RosterRow>();

type ChampionshipPodiumProps = {
	players: ChampionshipPlayer[];
	metric: PodiumMetricId;
};

function PodiumTablePlayer({ row }: { row: RosterRow }) {
	return <PlayerNameLink player={row} />;
}

type PodiumTableProps = {
	rows: RosterRow[];
	metric: PodiumMetricId;
	ceiling: number;
};

function PodiumTable({ rows, metric, ceiling }: PodiumTableProps) {
	const columns = useMemo(
		() =>
			podiumColumnHelper.columns([
				podiumColumnHelper.accessor("display_name", {
					id: ROSTER_COLUMN.player,
					header: ROSTER_COLUMN_ABBR.player,
					enableHiding: false,
					meta: { title: ROSTER_COLUMN_LABEL.player },
					cell: ({ row }) => <PodiumTablePlayer row={row.original} />,
				}),
				podiumColumnHelper.accessor("rating", {
					id: ROSTER_COLUMN.rating,
					header: ROSTER_COLUMN_ABBR.rating,
					enableHiding: false,
					meta: { title: ROSTER_COLUMN_LABEL.rating },
					cell: ({ row }) => (
						<div className="flex items-center gap-2">
							<PlayerRating rating={row.original.rating} ceiling={ceiling} />
							<span
								className={
									metric === ROSTER_COLUMN.rating
										? "font-semibold tabular-nums text-pitch-fg"
										: CHIP_CLASS
								}
							>
								{formatPodiumMetric(ROSTER_COLUMN.rating, row.original.rating)}
							</span>
						</div>
					),
				}),
				...ROSTER_STAT_COLUMNS.map((column) =>
					podiumColumnHelper.accessor(column, {
						id: column,
						header: ROSTER_COLUMN_ABBR[column],
						enableHiding: false,
						meta: {
							align: "right" as const,
							title: ROSTER_COLUMN_LABEL[column],
						},
						cell: ({ getValue }) => (
							<span
								className={
									column === metric
										? "font-semibold tabular-nums text-pitch-fg"
										: "tabular-nums"
								}
							>
								{formatPodiumMetric(column, getValue())}
							</span>
						),
					}),
				),
			]),
		[ceiling, metric],
	);

	return (
		<DataTable
			data={rows}
			columns={columns}
			getRowId={(row) => String(row.id)}
			legendItems={ROSTER_LEGEND_ITEMS}
		/>
	);
}

export function ChampionshipPodium({
	players,
	metric,
}: ChampionshipPodiumProps) {
	const rows = useMemo(
		() =>
			rankPodiumRows(
				players.map((player) => toRosterRow(player)),
				metric,
			),
		[metric, players],
	);
	const standings = useMemo(
		() => podiumStandings(rows, metric),
		[metric, rows],
	);
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);

	useEffect(() => {
		if (podiumConfettiSession.fired || standings.length === 0) {
			return;
		}

		podiumConfettiSession.fired = true;
		void confetti({ ...PODIUM_CONFETTI });
	}, [standings.length]);

	if (players.length === 0) {
		return (
			<EmptyState
				icon={<Trophy className="size-10" />}
				title={PODIUM_LABEL.emptyPlayers}
			/>
		);
	}

	return (
		<div className="space-y-8">
			{standings.length === 0 && (
				<EmptyState
					icon={<Trophy className="size-10" />}
					title={PODIUM_LABEL.emptyStats}
				/>
			)}
			{standings.length > 0 && (
				<div className="flex flex-wrap items-end justify-center gap-3 sm:gap-6">
					{PODIUM_DISPLAY_ORDER.flatMap((place) => {
						const standing = standings.find((item) => item.place === place);
						if (!standing) {
							return [];
						}

						return standing.rows.map((row) => (
							<PodiumPlaceCard
								key={`${metric}-${place}-${row.id}`}
								place={place}
								row={row}
								metric={metric}
								ceiling={ceiling}
							/>
						));
					})}
				</div>
			)}
			<PodiumTable rows={rows} metric={metric} ceiling={ceiling} />
		</div>
	);
}
