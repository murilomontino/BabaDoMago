import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import {
	DataTable,
	type DataTableFeatures,
} from "@/components/organisms/data-table";
import { PlayerRating } from "@/components/player-rating";
import {
	compareByAttendanceCount,
	EVENT_ATTENDANCE_COLUMN,
	EVENT_ATTENDANCE_COLUMN_LABEL,
} from "@/const/championship-event";
import { championshipRatingCeiling } from "@/const/player-rating";
import type { ChampionshipPlayer } from "@/types/championship";

type AttendanceRow = {
	id: number;
	display_name: string;
	avatar_url: string | null;
	rating: number;
	attendanceCount: number;
	present: boolean;
};

type EventAttendanceTableProps = {
	players: ChampionshipPlayer[];
	attendanceCounts: ReadonlyMap<number, number>;
	presentIds?: readonly number[];
	onToggle?: (playerId: number) => void;
};

const attendanceColumnHelper = createColumnHelper<
	DataTableFeatures,
	AttendanceRow
>();

function AttendancePlayerCell({
	player,
	ceiling,
}: {
	player: AttendanceRow;
	ceiling: number;
}) {
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
			<div className="min-w-0">
				<p className="font-medium text-fg">{player.display_name}</p>
				<div className="mt-1">
					<PlayerRating rating={player.rating} ceiling={ceiling} />
				</div>
			</div>
		</div>
	);
}

export function EventAttendanceTable({
	players,
	attendanceCounts,
	presentIds = [],
	onToggle,
}: EventAttendanceTableProps) {
	const selectable = Boolean(onToggle);
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const rows = useMemo(() => {
		const list = players.map((player) => ({
			id: player.id,
			display_name: player.display_name,
			avatar_url: player.avatar_url,
			rating: player.rating,
			attendanceCount: attendanceCounts.get(player.id) ?? 0,
			present: presentIds.includes(player.id),
		}));

		return [...list].sort(compareByAttendanceCount);
	}, [players, attendanceCounts, presentIds]);

	const columns = useMemo(() => {
		const playerColumn = attendanceColumnHelper.accessor("display_name", {
			id: EVENT_ATTENDANCE_COLUMN.player,
			header: EVENT_ATTENDANCE_COLUMN_LABEL.player,
			enableHiding: false,
			meta: { title: EVENT_ATTENDANCE_COLUMN_LABEL.player },
			cell: ({ row }) => (
				<AttendancePlayerCell player={row.original} ceiling={ceiling} />
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

		if (!selectable || !onToggle) {
			return attendanceColumnHelper.columns([playerColumn, countColumn]);
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
						<label htmlFor={inputId} className="inline-flex cursor-pointer">
							<input
								id={inputId}
								type="checkbox"
								checked={row.original.present}
								onChange={() => onToggle(row.original.id)}
							/>
						</label>
					);
				},
			}),
			playerColumn,
			countColumn,
		]);
	}, [ceiling, onToggle, selectable]);

	return (
		<DataTable
			data={rows}
			columns={columns}
			getRowId={(row) => String(row.id)}
		/>
	);
}
