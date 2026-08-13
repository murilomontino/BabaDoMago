import { createColumnHelper } from "@tanstack/react-table";
import { UserPlus } from "lucide-react";
import { useMemo } from "react";
import { EmptyState } from "@/components/empty-state";
import {
	RosterPlayerActions,
	type RosterPlayerActionsProps,
} from "@/components/molecules/roster-player-actions";
import {
	RosterPlayerCell,
	type RosterPlayerCellProps,
} from "@/components/molecules/roster-player-cell";
import {
	DataTable,
	type DataTableFeatures,
} from "@/components/organisms/data-table";
import type { AssignableChampionshipRole } from "@/const/championship-role";
import { championshipRatingCeiling } from "@/const/player-rating";
import {
	formatRosterAverage,
	formatRosterCount,
	formatRosterWinRate,
	ROSTER_COLUMN,
	ROSTER_COLUMN_ABBR,
	ROSTER_COLUMN_LABEL,
	ROSTER_LEGEND_ITEMS,
	ROSTER_STAT_COLUMN_OPTIONS,
	type RosterRow,
	toRosterRow,
} from "@/const/roster-stats";
import type { ChampionshipPlayer } from "@/types/championship";

const rosterColumnHelper = createColumnHelper<DataTableFeatures, RosterRow>();

type ChampionshipRosterProps = {
	players: ChampionshipPlayer[];
	createdBy: string;
	currentUserId: string | null;
	claimingPlayerId?: number | null;
	onClaim?: (playerId: number) => void;
	onChangeRating?: (playerId: number, rating: number) => void;
	ratingPlayerId?: number | null;
	onChangeRole?: (playerId: number, role: AssignableChampionshipRole) => void;
	onUnlink?: (playerId: number) => void;
	unlinkingPlayerId?: number | null;
	onDeactivate?: (playerId: number) => void;
	deactivatingPlayerId?: number | null;
	onReactivate?: (playerId: number) => void;
	reactivatingPlayerId?: number | null;
	emptyTitle?: string;
	withStats?: boolean;
};

function rosterPlayerCellProps(
	player: ChampionshipPlayer,
	shared: Omit<RosterPlayerCellProps, "player">,
): RosterPlayerCellProps {
	return { ...shared, player };
}

function rosterPlayerActionsProps(
	player: ChampionshipPlayer,
	shared: Omit<RosterPlayerActionsProps, "player">,
): RosterPlayerActionsProps {
	return { ...shared, player };
}

export function ChampionshipRoster({
	players,
	createdBy,
	currentUserId,
	claimingPlayerId,
	onClaim,
	onChangeRating,
	ratingPlayerId,
	onChangeRole,
	onUnlink,
	unlinkingPlayerId,
	onDeactivate,
	deactivatingPlayerId,
	onReactivate,
	reactivatingPlayerId,
	emptyTitle = "Nenhum jogador ainda",
	withStats = true,
}: ChampionshipRosterProps) {
	const alreadyMember = Boolean(
		currentUserId && players.some((player) => player.user_id === currentUserId),
	);
	const isOwnerViewer = Boolean(currentUserId && currentUserId === createdBy);
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const playerCellShared = useMemo(
		() => ({
			createdBy,
			isOwnerViewer,
			ceiling,
			onChangeRating,
			ratingPlayerId,
			onChangeRole,
		}),
		[
			createdBy,
			isOwnerViewer,
			ceiling,
			onChangeRating,
			ratingPlayerId,
			onChangeRole,
		],
	);
	const playerActionsShared = useMemo(
		() => ({
			createdBy,
			alreadyMember,
			claimingPlayerId,
			onClaim,
			onUnlink,
			unlinkingPlayerId,
			onDeactivate,
			deactivatingPlayerId,
			onReactivate,
			reactivatingPlayerId,
		}),
		[
			createdBy,
			alreadyMember,
			claimingPlayerId,
			onClaim,
			onUnlink,
			unlinkingPlayerId,
			onDeactivate,
			deactivatingPlayerId,
			onReactivate,
			reactivatingPlayerId,
		],
	);

	const rows = useMemo(
		() => players.map((player) => toRosterRow(player)),
		[players],
	);

	const columns = useMemo(
		() =>
			rosterColumnHelper.columns([
				rosterColumnHelper.accessor("display_name", {
					id: ROSTER_COLUMN.player,
					header: ROSTER_COLUMN_ABBR.player,
					enableHiding: false,
					meta: { title: ROSTER_COLUMN_LABEL.player },
					cell: ({ row }) => (
						<RosterPlayerCell
							{...rosterPlayerCellProps(row.original, playerCellShared)}
						/>
					),
				}),
				rosterColumnHelper.accessor("goals", {
					id: ROSTER_COLUMN.goals,
					header: ROSTER_COLUMN_ABBR.goals,
					meta: { align: "right", title: ROSTER_COLUMN_LABEL.goals },
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatRosterCount(getValue())}
						</span>
					),
				}),
				rosterColumnHelper.accessor("assists", {
					id: ROSTER_COLUMN.assists,
					header: ROSTER_COLUMN_ABBR.assists,
					meta: { align: "right", title: ROSTER_COLUMN_LABEL.assists },
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatRosterCount(getValue())}
						</span>
					),
				}),
				rosterColumnHelper.accessor("goalInvolvement", {
					id: ROSTER_COLUMN.goalInvolvement,
					header: ROSTER_COLUMN_ABBR.goalInvolvement,
					meta: {
						align: "right",
						title: ROSTER_COLUMN_LABEL.goalInvolvement,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatRosterCount(getValue())}
						</span>
					),
				}),
				rosterColumnHelper.accessor("wins", {
					id: ROSTER_COLUMN.wins,
					header: ROSTER_COLUMN_ABBR.wins,
					meta: { align: "right", title: ROSTER_COLUMN_LABEL.wins },
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatRosterCount(getValue())}
						</span>
					),
				}),
				rosterColumnHelper.accessor("matches", {
					id: ROSTER_COLUMN.matches,
					header: ROSTER_COLUMN_ABBR.matches,
					meta: { align: "right", title: ROSTER_COLUMN_LABEL.matches },
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatRosterCount(getValue())}
						</span>
					),
				}),
				rosterColumnHelper.accessor("goalsAverage", {
					id: ROSTER_COLUMN.goalsAverage,
					header: ROSTER_COLUMN_ABBR.goalsAverage,
					meta: { align: "right", title: ROSTER_COLUMN_LABEL.goalsAverage },
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatRosterAverage(getValue())}
						</span>
					),
				}),
				rosterColumnHelper.accessor("assistsAverage", {
					id: ROSTER_COLUMN.assistsAverage,
					header: ROSTER_COLUMN_ABBR.assistsAverage,
					meta: {
						align: "right",
						title: ROSTER_COLUMN_LABEL.assistsAverage,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatRosterAverage(getValue())}
						</span>
					),
				}),
				rosterColumnHelper.accessor("winRate", {
					id: ROSTER_COLUMN.winRate,
					header: ROSTER_COLUMN_ABBR.winRate,
					meta: { align: "right", title: ROSTER_COLUMN_LABEL.winRate },
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatRosterWinRate(getValue())}
						</span>
					),
				}),
				rosterColumnHelper.display({
					id: ROSTER_COLUMN.actions,
					header: ROSTER_COLUMN_ABBR.actions,
					enableHiding: false,
					enableSorting: false,
					meta: { align: "center", title: ROSTER_COLUMN_LABEL.actions },
					cell: ({ row }) => (
						<RosterPlayerActions
							{...rosterPlayerActionsProps(row.original, playerActionsShared)}
						/>
					),
				}),
			]),
		[playerCellShared, playerActionsShared],
	);

	if (players.length === 0) {
		return (
			<EmptyState icon={<UserPlus className="size-10" />} title={emptyTitle} />
		);
	}

	if (!withStats) {
		return (
			<ul className="divide-y divide-line">
				{players.map((player) => (
					<li
						key={player.id}
						className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
					>
						<RosterPlayerCell
							{...rosterPlayerCellProps(player, playerCellShared)}
						/>
						<RosterPlayerActions
							{...rosterPlayerActionsProps(player, playerActionsShared)}
						/>
					</li>
				))}
			</ul>
		);
	}

	return (
		<DataTable
			data={rows}
			columns={columns}
			getRowId={(row) => String(row.id)}
			hideableColumns={ROSTER_STAT_COLUMN_OPTIONS}
			legendItems={ROSTER_LEGEND_ITEMS}
		/>
	);
}
