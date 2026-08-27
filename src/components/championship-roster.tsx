import { createColumnHelper } from "@tanstack/react-table";
import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import {
	RosterAddPlayerActionsCell,
	RosterAddPlayerForm,
	RosterAddPlayerNameCell,
	RosterAddPlayerRatingCell,
} from "@/components/molecules/roster-add-player-row";
import {
	RosterPlayerActions,
	type RosterPlayerActionsProps,
} from "@/components/molecules/roster-player-actions";
import {
	RosterPlayerCell,
	type RosterPlayerCellProps,
} from "@/components/molecules/roster-player-cell";
import {
	RosterPlayerRating,
	type RosterPlayerRatingProps,
} from "@/components/molecules/roster-player-rating";
import {
	DataTable,
	type DataTableFeatures,
} from "@/components/organisms/data-table";
import {
	type AssignableChampionshipRole,
	CHAMPIONSHIP_ROLE,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { championshipRatingCeiling } from "@/const/player-rating";
import { filterPlayersBySearch, PLAYER_SEARCH } from "@/const/player-search";
import {
	formatRosterAverage,
	formatRosterCount,
	formatRosterWinRate,
	ROSTER_COLUMN,
	ROSTER_COLUMN_ABBR,
	ROSTER_COLUMN_LABEL,
	ROSTER_DEFAULT_COLUMN_VISIBILITY,
	ROSTER_LEGEND_ITEMS,
	ROSTER_STAT_COLUMN_OPTIONS,
	type RosterRow,
	toRosterRow,
} from "@/const/roster-stats";
import { CHIP_CLASS, FIELD_CLASS } from "@/const/ui";
import { handlerWhenAllowed } from "@/lib/handler-when-allowed";
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
	onEditNickname?: (playerId: number) => void;
	nicknamePlayerId?: number | null;
	onEditEventStats?: (playerId: number) => void;
	eventStatsPlayerId?: number | null;
	onChangeRole?: (playerId: number, role: AssignableChampionshipRole) => void;
	onChangeGoalkeeper?: (playerId: number, isGoalkeeper: boolean) => void;
	onUnlink?: (playerId: number) => void;
	unlinkingPlayerId?: number | null;
	onMerge?: (playerId: number) => void;
	onDeactivate?: (playerId: number) => void;
	deactivatingPlayerId?: number | null;
	onReactivate?: (playerId: number) => void;
	reactivatingPlayerId?: number | null;
	onRemove?: (playerId: number) => void;
	removingPlayerId?: number | null;
	emptyTitle?: string;
	withStats?: boolean;
	rosterCeiling?: number;
	searchQuery?: string;
	onSearchQueryChange?: (query: string) => void;
	onSortingChange?: (sorting: { id: string; desc: boolean } | null) => void;
	isAddingPlayer?: boolean;
	addPlayerError?: string | null;
	onAddPlayer?: (values: {
		displayNames: string[];
		rating: number;
		isGoalkeeper: boolean;
	}) => Promise<void>;
};

function rosterRowId(row: RosterRow): string {
	return String(row.id);
}

function rosterPlayerCellProps(
	player: ChampionshipPlayer,
	shared: Omit<RosterPlayerCellProps, "player">,
): RosterPlayerCellProps {
	return { ...shared, player };
}

function rosterPlayerRatingProps(
	player: ChampionshipPlayer,
	shared: Omit<RosterPlayerRatingProps, "player">,
): RosterPlayerRatingProps {
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
	onEditNickname,
	nicknamePlayerId,
	onEditEventStats,
	eventStatsPlayerId,
	onChangeRole,
	onChangeGoalkeeper,
	onUnlink,
	unlinkingPlayerId,
	onMerge,
	onDeactivate,
	deactivatingPlayerId,
	onReactivate,
	reactivatingPlayerId,
	onRemove,
	removingPlayerId,
	emptyTitle = "Nenhum jogador ainda",
	withStats = true,
	rosterCeiling,
	searchQuery: searchQueryProp,
	onSearchQueryChange,
	onSortingChange,
	isAddingPlayer = false,
	addPlayerError = null,
	onAddPlayer,
}: ChampionshipRosterProps) {
	const [uncontrolledQuery, setUncontrolledQuery] = useState("");
	const query = searchQueryProp ?? uncontrolledQuery;
	function setQuery(next: string) {
		if (onSearchQueryChange) {
			onSearchQueryChange(next);
			return;
		}

		setUncontrolledQuery(next);
	}
	const alreadyMember = Boolean(
		currentUserId && players.some((player) => player.user_id === currentUserId),
	);
	const hasUnclaimedPlayer = players.some(
		(player) => !player.user_id && !player.deleted_at,
	);
	const hasLinkedPlayer = players.some(
		(player) =>
			player.user_id && player.user_id !== createdBy && !player.deleted_at,
	);
	const canMerge = Boolean(onMerge && hasUnclaimedPlayer && hasLinkedPlayer);
	const isOwnerViewer = Boolean(currentUserId && currentUserId === createdBy);
	const viewer = players.find((player) => player.user_id === currentUserId);
	const actorRole = resolveChampionshipRole(
		createdBy,
		currentUserId,
		viewer?.role ?? CHAMPIONSHIP_ROLE.member,
	);
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const playerCellShared = useMemo(
		() => ({
			createdBy,
			onChangeRole,
			onChangeGoalkeeper,
		}),
		[createdBy, onChangeRole, onChangeGoalkeeper],
	);
	const playerRatingShared = useMemo(
		() => ({
			isOwnerViewer,
			ceiling,
			onChangeRating,
			ratingPlayerId,
		}),
		[isOwnerViewer, ceiling, onChangeRating, ratingPlayerId],
	);
	const playerActionsShared = useMemo(
		() => ({
			createdBy,
			actorRole,
			currentUserId,
			alreadyMember,
			claimingPlayerId,
			onClaim,
			onEditNickname,
			nicknamePlayerId,
			onEditEventStats,
			eventStatsPlayerId,
			onUnlink,
			unlinkingPlayerId,
			onMerge: handlerWhenAllowed(canMerge, onMerge),
			onDeactivate,
			deactivatingPlayerId,
			onReactivate,
			reactivatingPlayerId,
			onRemove,
			removingPlayerId,
		}),
		[
			createdBy,
			actorRole,
			currentUserId,
			alreadyMember,
			claimingPlayerId,
			onClaim,
			onEditNickname,
			nicknamePlayerId,
			onEditEventStats,
			eventStatsPlayerId,
			onUnlink,
			unlinkingPlayerId,
			canMerge,
			onMerge,
			onDeactivate,
			deactivatingPlayerId,
			onReactivate,
			reactivatingPlayerId,
			onRemove,
			removingPlayerId,
		],
	);

	const visiblePlayers = useMemo(
		() => filterPlayersBySearch(players, query),
		[players, query],
	);
	const rows = useMemo(
		() => visiblePlayers.map((player) => toRosterRow(player)),
		[visiblePlayers],
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
				rosterColumnHelper.accessor("rating", {
					id: ROSTER_COLUMN.rating,
					header: ROSTER_COLUMN_ABBR.rating,
					enableHiding: false,
					meta: { title: ROSTER_COLUMN_LABEL.rating },
					cell: ({ row }) => (
						<RosterPlayerRating
							{...rosterPlayerRatingProps(row.original, playerRatingShared)}
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
				rosterColumnHelper.accessor("assisted_goals", {
					id: ROSTER_COLUMN.assisted_goals,
					header: ROSTER_COLUMN_ABBR.assisted_goals,
					meta: {
						align: "right",
						title: ROSTER_COLUMN_LABEL.assisted_goals,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatRosterCount(getValue())}
						</span>
					),
				}),
				rosterColumnHelper.accessor("own_goals", {
					id: ROSTER_COLUMN.own_goals,
					header: ROSTER_COLUMN_ABBR.own_goals,
					meta: { align: "right", title: ROSTER_COLUMN_LABEL.own_goals },
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
				rosterColumnHelper.accessor("losses", {
					id: ROSTER_COLUMN.losses,
					header: ROSTER_COLUMN_ABBR.losses,
					meta: { align: "right", title: ROSTER_COLUMN_LABEL.losses },
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatRosterCount(getValue())}
						</span>
					),
				}),
				rosterColumnHelper.accessor("draws", {
					id: ROSTER_COLUMN.draws,
					header: ROSTER_COLUMN_ABBR.draws,
					meta: { align: "right", title: ROSTER_COLUMN_LABEL.draws },
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatRosterCount(getValue())}
						</span>
					),
				}),
				rosterColumnHelper.accessor("mvps", {
					id: ROSTER_COLUMN.mvps,
					header: ROSTER_COLUMN_ABBR.mvps,
					meta: { align: "right", title: ROSTER_COLUMN_LABEL.mvps },
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
		[playerCellShared, playerRatingShared, playerActionsShared],
	);

	const addCeiling = rosterCeiling ?? ceiling;
	const addPlayerCells = useMemo(() => {
		if (!onAddPlayer) {
			return undefined;
		}

		return {
			[ROSTER_COLUMN.player]: (
				<RosterAddPlayerNameCell
					isAddingPlayer={isAddingPlayer}
					addPlayerError={addPlayerError}
				/>
			),
			[ROSTER_COLUMN.rating]: (
				<RosterAddPlayerRatingCell
					ceiling={addCeiling}
					isAddingPlayer={isAddingPlayer}
				/>
			),
			[ROSTER_COLUMN.actions]: (
				<RosterAddPlayerActionsCell isAddingPlayer={isAddingPlayer} />
			),
		};
	}, [onAddPlayer, isAddingPlayer, addPlayerError, addCeiling]);

	if (players.length === 0 && !onAddPlayer) {
		return (
			<EmptyState icon={<UserPlus className="size-10" />} title={emptyTitle} />
		);
	}

	const showPlayers = visiblePlayers.length > 0;
	const showList = showPlayers || Boolean(addPlayerCells);

	const roster = (
		<div className="space-y-3">
			<label
				htmlFor="roster-player-search"
				className="block text-sm text-fg-muted"
			>
				<span className="flex items-center justify-between gap-2">
					{PLAYER_SEARCH.label}
					<span className={CHIP_CLASS}>
						{`${players.length} ${PLAYER_SEARCH.countLabel}`}
					</span>
				</span>
				<input
					id="roster-player-search"
					type="search"
					value={query}
					placeholder={PLAYER_SEARCH.placeholder}
					autoComplete="off"
					className={`mt-1 ${FIELD_CLASS}`}
					onChange={(event) => {
						setQuery(event.target.value);
					}}
				/>
			</label>
			{!showPlayers && players.length > 0 && (
				<p className="text-sm text-fg-muted">{PLAYER_SEARCH.empty}</p>
			)}
			{showList && !withStats && (
				<ul className="divide-y divide-line">
					{addPlayerCells && (
						<li className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
							<div className="flex min-w-0 flex-1 items-center justify-between gap-3">
								{addPlayerCells[ROSTER_COLUMN.player]}
								{addPlayerCells[ROSTER_COLUMN.rating]}
							</div>
							{addPlayerCells[ROSTER_COLUMN.actions]}
						</li>
					)}
					{visiblePlayers.map((player) => (
						<li
							key={player.id}
							className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
						>
							<div className="flex min-w-0 flex-1 items-center justify-between gap-3">
								<RosterPlayerCell
									{...rosterPlayerCellProps(player, playerCellShared)}
								/>
								<RosterPlayerRating
									{...rosterPlayerRatingProps(player, playerRatingShared)}
								/>
							</div>
							<RosterPlayerActions
								{...rosterPlayerActionsProps(player, playerActionsShared)}
							/>
						</li>
					))}
				</ul>
			)}
			{showList && withStats && (
				<DataTable
					data={rows}
					columns={columns}
					getRowId={rosterRowId}
					hideableColumns={ROSTER_STAT_COLUMN_OPTIONS}
					initialColumnVisibility={ROSTER_DEFAULT_COLUMN_VISIBILITY}
					legendItems={ROSTER_LEGEND_ITEMS}
					leadingRowCells={addPlayerCells}
					onSortingChange={onSortingChange}
				/>
			)}
		</div>
	);

	if (!onAddPlayer) {
		return roster;
	}

	return (
		<RosterAddPlayerForm onAddPlayer={onAddPlayer}>
			{roster}
		</RosterAddPlayerForm>
	);
}
