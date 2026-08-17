import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import {
	compareByAttendanceCount,
	EVENT_LATE_JOIN_LABEL,
} from "@/const/championship-event";
import { playerVisibleName } from "@/const/player-name";
import { BUTTON_VARIANT, ERROR_CLASS, FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type LateJoinAttendanceModalProps = {
	players: ChampionshipPlayer[];
	presentIds: readonly number[];
	attendanceCounts: ReadonlyMap<number, number>;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: (playerId: number) => Promise<void>;
};

function selectNumberValue(value: number | ""): string {
	if (value === "") {
		return "";
	}

	return String(value);
}

function parseSelectNumber(raw: string): number | "" {
	const next = Number(raw);
	if (!Number.isFinite(next)) {
		return "";
	}

	return next;
}

export function LateJoinAttendanceModal({
	players,
	presentIds,
	attendanceCounts,
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: LateJoinAttendanceModalProps) {
	const present = new Set(presentIds);
	const candidates = players
		.filter((player) => !present.has(player.id))
		.map((player) => ({
			player,
			attendanceCount: attendanceCounts.get(player.id) ?? 0,
			display_name: playerVisibleName(player),
		}))
		.sort(compareByAttendanceCount);
	const [playerId, setPlayerId] = useState<number | "">(
		candidates[0]?.player.id ?? "",
	);
	const [localError, setLocalError] = useState<string | null>(null);

	return (
		<AppDialog onClose={onCancel}>
			<div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl bg-surface p-4 shadow-lg">
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{EVENT_LATE_JOIN_LABEL.title}
				</p>
				<p className="mb-3 text-sm text-fg-muted">
					{EVENT_LATE_JOIN_LABEL.hint}
				</p>
				{candidates.length === 0 && (
					<p className="mb-3 text-sm text-fg-muted">
						{EVENT_LATE_JOIN_LABEL.empty}
					</p>
				)}
				{candidates.length > 0 && (
					<select
						className={FIELD_CLASS}
						value={selectNumberValue(playerId)}
						disabled={isPending}
						onChange={(event) => {
							setLocalError(null);
							setPlayerId(parseSelectNumber(event.target.value));
						}}
					>
						{candidates.map((row) => (
							<option key={row.player.id} value={String(row.player.id)}>
								{row.display_name}
							</option>
						))}
					</select>
				)}
				{(localError || errorMessage) && (
					<p className={`mt-2 ${ERROR_CLASS}`}>{localError ?? errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						{EVENT_LATE_JOIN_LABEL.cancel}
					</Button>
					{candidates.length > 0 && (
						<Button
							disabled={isPending || playerId === ""}
							onClick={() => {
								if (playerId === "") {
									setLocalError(EVENT_LATE_JOIN_LABEL.empty);
									return;
								}

								void onConfirm(playerId);
							}}
						>
							{EVENT_LATE_JOIN_LABEL.confirm}
						</Button>
					)}
				</div>
			</div>
		</AppDialog>
	);
}
