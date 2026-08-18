import { createColumnHelper } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Switch } from "@/components/atoms/switch";
import { Button } from "@/components/button";
import { EventAttendanceAddPlayer } from "@/components/event-attendance-add-player";
import {
	DataTable,
	type DataTableFeatures,
} from "@/components/organisms/data-table";
import { PlayerRating } from "@/components/player-rating";
import {
	ATTENDANCE_SEED,
	ATTENDANCE_SEED_HINT,
	ATTENDANCE_SEED_LABEL,
	type AttendanceSeedMode,
	areAllVisiblePresent,
	compareByAttendanceCount,
	EVENT_ATTENDANCE_ACTION,
	EVENT_ATTENDANCE_COLUMN,
	EVENT_ATTENDANCE_COLUMN_LABEL,
} from "@/const/championship-event";
import { playerVisibleName } from "@/const/player-name";
import { PLAYER_NAME_LIST } from "@/const/player-name-list";
import { championshipRatingCeiling } from "@/const/player-rating";
import { filterPlayersBySearch, PLAYER_SEARCH } from "@/const/player-search";
import {
	BUTTON_VARIANT,
	CHIP_CLASS,
	FIELD_CLASS,
	PLAYER_AVATAR_CLASS,
} from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type AttendanceRow = {
	id: number;
	display_name: string;
	avatar_url: string | null;
	rating: number;
	attendanceCount: number;
	present: boolean;
	goalkeeper: boolean;
	onTogglePresent?: (checked: boolean) => void;
	onToggleGoalkeeper?: (checked: boolean) => void;
};

type EventAttendanceTableProps = {
	players: ChampionshipPlayer[];
	attendanceCounts: ReadonlyMap<number, number>;
	presentIds?: readonly number[];
	goalkeeperIds?: readonly number[];
	onSetPresent?: (playerIds: readonly number[], present: boolean) => void;
	onSetGoalkeeper?: (
		playerIds: readonly number[],
		asGoalkeeper: boolean,
	) => void;
	onSeedAttendance?: (mode: AttendanceSeedMode) => void;
	isAddingPlayer?: boolean;
	addPlayerError?: string | null;
	onAddPlayer?: (values: {
		displayNames: string[];
		rating: number;
		isGoalkeeper: boolean;
	}) => Promise<ChampionshipPlayer[]>;
};

const attendanceColumnHelper = createColumnHelper<
	DataTableFeatures,
	AttendanceRow
>();

function stopAttendanceSwitchClick(event: { stopPropagation: () => void }) {
	event.stopPropagation();
}

function attendanceFlagHandler(
	onSet: ((playerIds: readonly number[], checked: boolean) => void) | undefined,
	playerId: number,
): ((checked: boolean) => void) | undefined {
	if (!onSet) {
		return undefined;
	}

	return (checked) => {
		onSet([playerId], checked);
	};
}

function attendanceRowToggleHandler(
	onSet: ((playerIds: readonly number[], present: boolean) => void) | undefined,
): ((row: AttendanceRow) => void) | undefined {
	if (!onSet) {
		return undefined;
	}

	return (row) => {
		onSet([row.id], !row.present);
	};
}

function AttendanceRowSwitch({
	id,
	checked,
	disabled,
	onCheckedChange,
}: {
	id: string;
	checked: boolean;
	disabled?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}) {
	return (
		<label
			htmlFor={id}
			className="inline-flex"
			onClick={stopAttendanceSwitchClick}
			onKeyDown={stopAttendanceSwitchClick}
		>
			<Switch
				id={id}
				checked={checked}
				disabled={disabled}
				onCheckedChange={(next) => {
					onCheckedChange?.(next);
				}}
			/>
		</label>
	);
}

function AttendancePresentCell({ row }: { row: { original: AttendanceRow } }) {
	const player = row.original;

	return (
		<AttendanceRowSwitch
			id={`event-present-${player.id}`}
			checked={player.present}
			onCheckedChange={player.onTogglePresent}
		/>
	);
}

function AttendanceGoalkeeperCell({
	row,
}: {
	row: { original: AttendanceRow };
}) {
	const player = row.original;

	return (
		<AttendanceRowSwitch
			id={`event-goalkeeper-${player.id}`}
			checked={player.goalkeeper}
			disabled={!player.onToggleGoalkeeper}
			onCheckedChange={player.onToggleGoalkeeper}
		/>
	);
}

function AttendancePlayerCell({ player }: { player: AttendanceRow }) {
	return (
		<div className="flex min-w-0 items-center gap-3">
			{player.avatar_url && (
				<img
					src={player.avatar_url}
					alt=""
					referrerPolicy="no-referrer"
					className={`${PLAYER_AVATAR_CLASS} rounded-full object-cover`}
				/>
			)}
			{!player.avatar_url && (
				<span
					className={`flex items-center justify-center rounded-full bg-pitch-soft text-sm font-medium text-pitch-fg ${PLAYER_AVATAR_CLASS}`}
				>
					{player.display_name.charAt(0).toUpperCase()}
				</span>
			)}
			<p className="min-w-0 truncate font-medium text-fg">
				{player.display_name}
			</p>
		</div>
	);
}

export function EventAttendanceTable({
	players,
	attendanceCounts,
	presentIds = [],
	goalkeeperIds = [],
	onSetPresent,
	onSetGoalkeeper,
	onSeedAttendance,
	isAddingPlayer = false,
	addPlayerError = null,
	onAddPlayer,
}: EventAttendanceTableProps) {
	const [query, setQuery] = useState("");
	const selectable = Boolean(onSetPresent);
	const showSeedActions = Boolean(onSeedAttendance);
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const visiblePlayers = useMemo(
		() => filterPlayersBySearch(players, query),
		[players, query],
	);
	const rows = useMemo(() => {
		const list = visiblePlayers.map((player) => ({
			id: player.id,
			display_name: playerVisibleName(player),
			avatar_url: player.avatar_url,
			rating: player.rating,
			attendanceCount: attendanceCounts.get(player.id) ?? 0,
			present: presentIds.includes(player.id),
			goalkeeper: goalkeeperIds.includes(player.id),
			onTogglePresent: attendanceFlagHandler(onSetPresent, player.id),
			onToggleGoalkeeper: attendanceFlagHandler(onSetGoalkeeper, player.id),
		}));

		return [...list].sort(compareByAttendanceCount);
	}, [
		visiblePlayers,
		attendanceCounts,
		presentIds,
		goalkeeperIds,
		onSetPresent,
		onSetGoalkeeper,
	]);
	const visibleIds = rows.map((row) => row.id);
	const allVisiblePresent = areAllVisiblePresent(presentIds, visibleIds);

	const columns = useMemo(() => {
		const playerColumn = attendanceColumnHelper.accessor("display_name", {
			id: EVENT_ATTENDANCE_COLUMN.player,
			header: EVENT_ATTENDANCE_COLUMN_LABEL.player,
			enableHiding: false,
			meta: { title: EVENT_ATTENDANCE_COLUMN_LABEL.player },
			cell: ({ row }) => <AttendancePlayerCell player={row.original} />,
		});
		const ratingColumn = attendanceColumnHelper.accessor("rating", {
			id: EVENT_ATTENDANCE_COLUMN.rating,
			header: EVENT_ATTENDANCE_COLUMN_LABEL.rating,
			enableHiding: false,
			meta: { title: EVENT_ATTENDANCE_COLUMN_LABEL.rating },
			cell: ({ getValue }) => (
				<PlayerRating rating={getValue()} ceiling={ceiling} />
			),
		});
		const countColumn = attendanceColumnHelper.accessor("attendanceCount", {
			id: EVENT_ATTENDANCE_COLUMN.count,
			header: EVENT_ATTENDANCE_COLUMN_LABEL.count,
			enableHiding: false,
			meta: {
				align: "right" as const,
				title: EVENT_ATTENDANCE_COLUMN_LABEL.count,
			},
			cell: ({ getValue }) => (
				<span className="tabular-nums">{getValue()}</span>
			),
		});

		if (!selectable) {
			return attendanceColumnHelper.columns([
				playerColumn,
				ratingColumn,
				countColumn,
			]);
		}

		return attendanceColumnHelper.columns([
			attendanceColumnHelper.accessor("present", {
				id: EVENT_ATTENDANCE_COLUMN.present,
				header: EVENT_ATTENDANCE_COLUMN_LABEL.present,
				enableHiding: false,
				enableSorting: false,
				meta: {
					align: "center" as const,
					title: EVENT_ATTENDANCE_COLUMN_LABEL.present,
				},
				cell: AttendancePresentCell,
			}),
			attendanceColumnHelper.accessor("goalkeeper", {
				id: EVENT_ATTENDANCE_COLUMN.goalkeeper,
				header: EVENT_ATTENDANCE_COLUMN_LABEL.goalkeeper,
				enableHiding: false,
				enableSorting: false,
				meta: {
					align: "center" as const,
					title: EVENT_ATTENDANCE_COLUMN_LABEL.goalkeeper,
				},
				cell: AttendanceGoalkeeperCell,
			}),
			playerColumn,
			ratingColumn,
			countColumn,
		]);
	}, [ceiling, selectable]);

	return (
		<div className="space-y-3">
			<label
				htmlFor="event-attendance-search"
				className="block text-sm text-fg-muted"
			>
				<span className="flex items-center justify-between gap-2">
					{PLAYER_SEARCH.label}
					<span className="flex items-center gap-1">
						<span className={`${CHIP_CLASS} hidden md:inline`}>
							{`${presentIds.length}/${players.length}`}
						</span>
						<span className={CHIP_CLASS}>
							{`${visiblePlayers.length} ${PLAYER_SEARCH.filteredLabel}`}
						</span>
					</span>
				</span>
				<textarea
					id="event-attendance-search"
					rows={4}
					value={query}
					placeholder={PLAYER_NAME_LIST.placeholder}
					autoComplete="off"
					className={`mt-1 min-h-20 resize-y !h-auto ${FIELD_CLASS}`}
					onChange={(event) => {
						setQuery(event.target.value);
					}}
				/>
			</label>
			{onAddPlayer && (
				<EventAttendanceAddPlayer
					ceiling={ceiling}
					isAddingPlayer={isAddingPlayer}
					addPlayerError={addPlayerError}
					onAddPlayer={async (values) => {
						const created = await onAddPlayer(values);
						setQuery("");
						return created;
					}}
				/>
			)}
			{(selectable || showSeedActions) && (
				<div className="space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						{selectable && rows.length > 0 && onSetPresent && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={() => {
									onSetPresent(visibleIds, !allVisiblePresent);
								}}
							>
								{allVisiblePresent
									? EVENT_ATTENDANCE_ACTION.deselectAll
									: EVENT_ATTENDANCE_ACTION.selectAll}
							</Button>
						)}
						{showSeedActions && onSeedAttendance && (
							<>
								<Button
									type="button"
									variant={BUTTON_VARIANT.secondary}
									title={ATTENDANCE_SEED_HINT[ATTENDANCE_SEED.lastEvent]}
									onClick={() => {
										onSeedAttendance(ATTENDANCE_SEED.lastEvent);
									}}
								>
									{ATTENDANCE_SEED_LABEL[ATTENDANCE_SEED.lastEvent]}
								</Button>
								<Button
									type="button"
									variant={BUTTON_VARIANT.secondary}
									title={ATTENDANCE_SEED_HINT[ATTENDANCE_SEED.habitual]}
									onClick={() => {
										onSeedAttendance(ATTENDANCE_SEED.habitual);
									}}
								>
									{ATTENDANCE_SEED_LABEL[ATTENDANCE_SEED.habitual]}
								</Button>
								{presentIds.length > 0 && (
									<Button
										type="button"
										variant={BUTTON_VARIANT.secondary}
										title={ATTENDANCE_SEED_HINT[ATTENDANCE_SEED.clear]}
										onClick={() => {
											onSeedAttendance(ATTENDANCE_SEED.clear);
										}}
									>
										{ATTENDANCE_SEED_LABEL[ATTENDANCE_SEED.clear]}
									</Button>
								)}
							</>
						)}
					</div>
					{showSeedActions && (
						<ul className="space-y-0.5 text-xs text-fg-muted">
							<li>
								{ATTENDANCE_SEED_LABEL[ATTENDANCE_SEED.lastEvent]}:{" "}
								{ATTENDANCE_SEED_HINT[ATTENDANCE_SEED.lastEvent]}
							</li>
							<li>
								{ATTENDANCE_SEED_LABEL[ATTENDANCE_SEED.habitual]}:{" "}
								{ATTENDANCE_SEED_HINT[ATTENDANCE_SEED.habitual]}
							</li>
							<li>
								{ATTENDANCE_SEED_LABEL[ATTENDANCE_SEED.clear]}:{" "}
								{ATTENDANCE_SEED_HINT[ATTENDANCE_SEED.clear]}
							</li>
						</ul>
					)}
				</div>
			)}
			{rows.length === 0 && (
				<p className="text-sm text-fg-muted">{PLAYER_SEARCH.empty}</p>
			)}
			{rows.length > 0 && (
				<DataTable
					data={rows}
					columns={columns}
					getRowId={(row) => String(row.id)}
					onRowClick={attendanceRowToggleHandler(onSetPresent)}
					getRowClassName={(row) =>
						`transition-colors duration-200 ease-in-out motion-reduce:transition-none ${
							row.present ? "bg-pitch-soft" : "even:bg-surface-muted"
						}`
					}
				/>
			)}
		</div>
	);
}
