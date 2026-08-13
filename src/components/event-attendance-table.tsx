import { createColumnHelper } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import {
	DataTable,
	type DataTableFeatures,
} from "@/components/organisms/data-table";
import { PlayerRating } from "@/components/player-rating";
import {
	areAllVisiblePresent,
	compareByAttendanceCount,
	EVENT_ATTENDANCE_ACTION,
	EVENT_ATTENDANCE_COLUMN,
	EVENT_ATTENDANCE_COLUMN_LABEL,
} from "@/const/championship-event";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import { filterPlayersBySearch, PLAYER_SEARCH } from "@/const/player-search";
import { BUTTON_VARIANT, FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type AttendanceRow = {
	id: number;
	display_name: string;
	avatar_url: string | null;
	rating: number;
	attendanceCount: number;
	present: boolean;
	goalkeeper: boolean;
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
};

const attendanceColumnHelper = createColumnHelper<
	DataTableFeatures,
	AttendanceRow
>();

function AttendancePlayerCell({ player }: { player: AttendanceRow }) {
	return (
		<div className="flex min-w-0 items-center gap-3">
			{player.avatar_url && (
				<img
					src={player.avatar_url}
					alt=""
					referrerPolicy="no-referrer"
					className="h-9 w-9 rounded-full object-cover"
				/>
			)}
			{!player.avatar_url && (
				<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pitch-soft text-sm font-medium text-pitch-fg">
					{player.display_name.charAt(0).toUpperCase()}
				</span>
			)}
			<p className="min-w-0 font-medium text-fg">{player.display_name}</p>
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
}: EventAttendanceTableProps) {
	const [query, setQuery] = useState("");
	const selectable = Boolean(onSetPresent);
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
		}));

		return [...list].sort(compareByAttendanceCount);
	}, [visiblePlayers, attendanceCounts, presentIds, goalkeeperIds]);
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

		if (!selectable || !onSetPresent) {
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
				cell: ({ row }) => {
					const inputId = `event-present-${row.original.id}`;

					return (
						<label
							htmlFor={inputId}
							className="pointer-events-none inline-flex"
						>
							<input
								id={inputId}
								type="checkbox"
								checked={row.original.present}
								onChange={() => {
									onSetPresent([row.original.id], !row.original.present);
								}}
							/>
						</label>
					);
				},
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
				cell: ({ row }) => {
					const inputId = `event-goalkeeper-${row.original.id}`;

					return (
						<label
							htmlFor={inputId}
							className="inline-flex"
							onClick={(event) => {
								event.stopPropagation();
							}}
							onKeyDown={(event) => {
								event.stopPropagation();
							}}
						>
							<input
								id={inputId}
								type="checkbox"
								checked={row.original.goalkeeper}
								disabled={!onSetGoalkeeper}
								onChange={() => {
									onSetGoalkeeper?.(
										[row.original.id],
										!row.original.goalkeeper,
									);
								}}
							/>
						</label>
					);
				},
			}),
			playerColumn,
			ratingColumn,
			countColumn,
		]);
	}, [ceiling, onSetGoalkeeper, onSetPresent, selectable]);

	return (
		<div className="space-y-3">
			<label
				htmlFor="event-attendance-search"
				className="block text-sm text-fg-muted"
			>
				{PLAYER_SEARCH.label}
				<input
					id="event-attendance-search"
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
			{rows.length === 0 && (
				<p className="text-sm text-fg-muted">{PLAYER_SEARCH.empty}</p>
			)}
			{rows.length > 0 && (
				<DataTable
					data={rows}
					columns={columns}
					getRowId={(row) => String(row.id)}
					onRowClick={
						onSetPresent
							? (row) => {
									onSetPresent([row.id], !row.present);
								}
							: undefined
					}
					getRowClassName={(row) =>
						row.present ? "bg-pitch-soft" : "even:bg-surface-muted"
					}
				/>
			)}
		</div>
	);
}
