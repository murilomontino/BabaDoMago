import { createColumnHelper } from "@tanstack/react-table";
import confetti from "canvas-confetti";
import { Trophy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo } from "react";
import { EmptyState } from "@/components/empty-state";
import {
	PLAYER_NAME_LINK_LAYOUT,
	PlayerNameLink,
} from "@/components/molecules/player-name-link";
import PodiumPlaceCard, {
	PodiumMedal,
} from "@/components/molecules/podium-place";
import {
	DataTable,
	type DataTableFeatures,
} from "@/components/organisms/data-table";
import { PlayerRating } from "@/components/player-rating";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import {
	formatSynergyStat,
	SYNERGY_COLUMN,
	SYNERGY_COLUMN_ABBR,
	SYNERGY_LABEL,
	SYNERGY_PAIR_COLUMN_LABEL,
	SYNERGY_PAIR_LEGEND,
	SYNERGY_STAT_COLUMN_OPTIONS,
	type SynergyPairRow,
	synergyPodiumStandings,
} from "@/const/player-synergy";
import {
	formatPodiumMetric,
	PODIUM_CONFETTI,
	PODIUM_DISPLAY_ORDER,
	PODIUM_LABEL,
	PODIUM_METRIC,
	PODIUM_STAND_HEIGHT,
	type PodiumMetricId,
	type PodiumPlace,
	type PodiumPlayerMetricId,
	podiumEnterDelay,
	podiumEnterInitialHeight,
	podiumStandings,
	rankPodiumRows,
} from "@/const/podium";
import {
	formatRosterStat,
	isRosterOptionalColumn,
	ROSTER_COLUMN,
	ROSTER_COLUMN_ABBR,
	ROSTER_COLUMN_LABEL,
	ROSTER_DEFAULT_COLUMN_VISIBILITY,
	ROSTER_LEGEND_ITEMS,
	ROSTER_OPTIONAL_COLUMN_OPTIONS,
	ROSTER_STAT_COLUMNS,
	type RosterRow,
	toRosterRow,
} from "@/const/roster-stats";
import { CHIP_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

const podiumConfettiSession = { fired: false };
const podiumColumnHelper = createColumnHelper<DataTableFeatures, RosterRow>();
const pairColumnHelper = createColumnHelper<
	DataTableFeatures,
	SynergyPairRow
>();

type ChampionshipPodiumProps = {
	players: ChampionshipPlayer[];
	metric: PodiumMetricId;
	synergyPairs?: readonly SynergyPairRow[];
	worstPairs?: readonly SynergyPairRow[];
};

function PodiumTablePlayer({ row }: { row: RosterRow }) {
	return <PlayerNameLink player={row} />;
}

type PodiumTableProps = {
	rows: RosterRow[];
	metric: PodiumPlayerMetricId;
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
						enableHiding: isRosterOptionalColumn(column),
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
								{formatRosterStat(column, getValue())}
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
			hideableColumns={ROSTER_OPTIONAL_COLUMN_OPTIONS}
			initialColumnVisibility={ROSTER_DEFAULT_COLUMN_VISIBILITY}
			legendItems={ROSTER_LEGEND_ITEMS}
		/>
	);
}

function SynergyPairsTable({ rows }: { rows: SynergyPairRow[] }) {
	const columns = useMemo(
		() =>
			pairColumnHelper.columns([
				pairColumnHelper.accessor(
					(row) =>
						`${playerVisibleName(row.left)} ${playerVisibleName(row.right)}`,
					{
						id: SYNERGY_COLUMN.player,
						header: SYNERGY_PAIR_COLUMN_LABEL.player,
						enableHiding: false,
						meta: { title: SYNERGY_PAIR_COLUMN_LABEL.player },
						cell: ({ row }) => (
							<div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
								<PlayerNameLink
									player={row.original.left}
									avatarClassName="size-8 text-xs"
								/>
								<PlayerNameLink
									player={row.original.right}
									avatarClassName="size-8 text-xs"
								/>
							</div>
						),
					},
				),
				pairColumnHelper.accessor("wins", {
					id: SYNERGY_COLUMN.wins,
					header: SYNERGY_COLUMN_ABBR.wins,
					meta: {
						align: "right" as const,
						title: SYNERGY_PAIR_COLUMN_LABEL.wins,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatSynergyStat(SYNERGY_COLUMN.wins, getValue())}
						</span>
					),
				}),
				pairColumnHelper.accessor("matches", {
					id: SYNERGY_COLUMN.matches,
					header: SYNERGY_COLUMN_ABBR.matches,
					meta: {
						align: "right" as const,
						title: SYNERGY_PAIR_COLUMN_LABEL.matches,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatSynergyStat(SYNERGY_COLUMN.matches, getValue())}
						</span>
					),
				}),
				pairColumnHelper.accessor("winRate", {
					id: SYNERGY_COLUMN.winRate,
					header: SYNERGY_COLUMN_ABBR.winRate,
					meta: {
						align: "right" as const,
						title: SYNERGY_PAIR_COLUMN_LABEL.winRate,
					},
					cell: ({ getValue }) => (
						<span className="font-semibold tabular-nums text-pitch-fg">
							{formatSynergyStat(SYNERGY_COLUMN.winRate, getValue())}
						</span>
					),
				}),
			]),
		[],
	);

	return (
		<DataTable
			data={rows}
			columns={columns}
			getRowId={(row) => `${row.left.id}:${row.right.id}`}
			hideableColumns={SYNERGY_STAT_COLUMN_OPTIONS}
			legendItems={SYNERGY_PAIR_LEGEND}
		/>
	);
}

function PodiumPairPlace({
	place,
	row,
}: {
	place: PodiumPlace;
	row: SynergyPairRow;
}) {
	const reduceMotion = useReducedMotion();
	const height = PODIUM_STAND_HEIGHT[place];

	return (
		<div className="flex w-36 flex-col items-center sm:w-40">
			<div className="mb-2 flex w-full flex-col items-center gap-1 text-center">
				<PlayerNameLink
					player={row.left}
					layout={PLAYER_NAME_LINK_LAYOUT.stack}
					avatarClassName="h-10 w-10 text-sm"
				/>
				<PlayerNameLink
					player={row.right}
					layout={PLAYER_NAME_LINK_LAYOUT.stack}
					avatarClassName="h-10 w-10 text-sm"
				/>
				<p className="text-sm font-semibold tabular-nums text-pitch-fg">
					{formatPodiumMetric(PODIUM_METRIC.synergy, row.winRate)}
				</p>
				<PodiumMedal place={place} />
			</div>
			<motion.div
				className="flex w-full items-start justify-center overflow-hidden rounded-t-xl border border-line bg-pitch-soft"
				initial={podiumEnterInitialHeight(reduceMotion, height)}
				animate={{ height }}
				transition={{
					type: "spring",
					stiffness: 120,
					damping: 18,
					delay: podiumEnterDelay(reduceMotion, place),
				}}
			>
				<span className="pt-2 text-lg font-bold text-pitch-fg">{place}</span>
			</motion.div>
		</div>
	);
}

function SynergyPodium({
	pairs,
	worstPairs,
}: {
	pairs: readonly SynergyPairRow[];
	worstPairs: readonly SynergyPairRow[];
}) {
	const standings = useMemo(() => synergyPodiumStandings(pairs), [pairs]);

	useEffect(() => {
		if (podiumConfettiSession.fired || standings.length === 0) {
			return;
		}

		podiumConfettiSession.fired = true;
		void confetti({ ...PODIUM_CONFETTI });
	}, [standings.length]);

	if (pairs.length === 0) {
		return (
			<EmptyState
				icon={<Trophy className="size-10" />}
				title={SYNERGY_LABEL.emptyQualified}
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
							<PodiumPairPlace
								key={`${place}-${row.left.id}-${row.right.id}`}
								place={place}
								row={row}
							/>
						));
					})}
				</div>
			)}
			<h3 className="text-sm font-semibold text-fg">{SYNERGY_LABEL.best}</h3>
			<SynergyPairsTable rows={[...pairs]} />
			{worstPairs.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-sm font-semibold text-fg">
						{SYNERGY_LABEL.worst}
					</h3>
					<SynergyPairsTable rows={[...worstPairs]} />
				</div>
			)}
		</div>
	);
}

export function ChampionshipPodium({
	players,
	metric,
	synergyPairs = [],
	worstPairs = [],
}: ChampionshipPodiumProps) {
	if (metric === PODIUM_METRIC.synergy) {
		return <SynergyPodium pairs={synergyPairs} worstPairs={worstPairs} />;
	}

	return <PlayerPodium players={players} metric={metric} />;
}

function PlayerPodium({
	players,
	metric,
}: {
	players: ChampionshipPlayer[];
	metric: PodiumPlayerMetricId;
}) {
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
