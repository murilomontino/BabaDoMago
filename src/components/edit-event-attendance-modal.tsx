import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EventAttendanceTable } from "@/components/event-attendance-table";
import {
	applyVisibleAttendance,
	EVENT_ACTION,
	keepGoalkeepersPresent,
	keepTeamPlayersPresent,
	validateEventAttendance,
} from "@/const/championship-event";
import { BUTTON_VARIANT, ERROR_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type EditEventAttendanceModalProps = {
	players: ChampionshipPlayer[];
	attendanceCounts: ReadonlyMap<number, number>;
	initialPresentIds: readonly number[];
	initialGoalkeeperIds?: readonly number[];
	teamPlayerIds: readonly number[];
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onSave: (
		presentPlayerIds: number[],
		goalkeeperPlayerIds: number[],
	) => Promise<void>;
};

export function EditEventAttendanceModal({
	players,
	attendanceCounts,
	initialPresentIds,
	initialGoalkeeperIds = [],
	teamPlayerIds,
	isPending,
	errorMessage,
	onCancel,
	onSave,
}: EditEventAttendanceModalProps) {
	const locked = new Set(teamPlayerIds);
	const rosterIds = players.map((player) => player.id);
	const [presentIds, setPresentIds] = useState(() =>
		keepTeamPlayersPresent(initialPresentIds, teamPlayerIds),
	);
	const [goalkeeperIds, setGoalkeeperIds] = useState(() =>
		keepGoalkeepersPresent(
			initialGoalkeeperIds,
			keepTeamPlayersPresent(initialPresentIds, teamPlayerIds),
		),
	);
	const [localError, setLocalError] = useState<string | null>(null);

	return (
		<AppDialog onClose={onCancel}>
			<div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface p-4 shadow-lg">
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{EVENT_ACTION.addAttendance}
				</p>
				<p className="mb-3 text-sm text-fg-muted">
					Quem está em time permanece na presença.
				</p>
				<EventAttendanceTable
					players={players}
					attendanceCounts={attendanceCounts}
					presentIds={presentIds}
					goalkeeperIds={goalkeeperIds}
					onSetPresent={(playerIds, present) => {
						setLocalError(null);
						if (!present) {
							const removable = playerIds.filter((id) => !locked.has(id));
							const nextPresent = applyVisibleAttendance(
								presentIds,
								removable,
								false,
							);
							setPresentIds(nextPresent);
							setGoalkeeperIds((current) =>
								keepGoalkeepersPresent(current, nextPresent),
							);
							return;
						}

						const nextPresent = applyVisibleAttendance(
							presentIds,
							playerIds,
							true,
						);
						setPresentIds(nextPresent);
						setGoalkeeperIds((current) =>
							keepGoalkeepersPresent(current, nextPresent),
						);
					}}
					onSetGoalkeeper={(playerIds, asGoalkeeper) => {
						setLocalError(null);
						if (asGoalkeeper) {
							const nextPresent = applyVisibleAttendance(
								presentIds,
								playerIds,
								true,
							);
							setPresentIds(nextPresent);
							setGoalkeeperIds((current) =>
								keepGoalkeepersPresent([...current, ...playerIds], nextPresent),
							);
							return;
						}

						const visible = new Set(playerIds);
						setGoalkeeperIds((current) =>
							keepGoalkeepersPresent(
								current.filter((id) => !visible.has(id)),
								presentIds,
							),
						);
					}}
				/>
				{localError && <p className={`mt-2 ${ERROR_CLASS}`}>{localError}</p>}
				{errorMessage && (
					<p className={`mt-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						Cancelar
					</Button>
					<Button
						onClick={() => {
							void (async () => {
								const next = keepTeamPlayersPresent(presentIds, teamPlayerIds);
								const invalid = validateEventAttendance(next, rosterIds);
								if (invalid) {
									setLocalError(invalid);
									return;
								}

								await onSave(next, keepGoalkeepersPresent(goalkeeperIds, next));
							})();
						}}
						disabled={isPending}
					>
						{EVENT_ACTION.saveAttendance}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
