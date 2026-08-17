import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EventAttendanceTable } from "@/components/event-attendance-table";
import {
	applyVisibleAttendance,
	defaultGoalkeeperIds,
	EVENT_ACTION,
	eventGoalkeeperIds,
	keepGoalkeepersPresent,
	keepTeamPlayersPresent,
	setGoalkeeperSelection,
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
	onAddPlayer?: (values: {
		displayNames: string[];
		rating: number;
		isGoalkeeper: boolean;
	}) => Promise<ChampionshipPlayer[]>;
	isAddingPlayer?: boolean;
	addPlayerError?: string | null;
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
	onAddPlayer,
	isAddingPlayer = false,
	addPlayerError = null,
	onSave,
}: EditEventAttendanceModalProps) {
	const locked = new Set(teamPlayerIds);
	const rosterIds = players.map((player) => player.id);
	const [presentIds, setPresentIds] = useState(() =>
		keepTeamPlayersPresent(initialPresentIds, teamPlayerIds),
	);
	const [goalkeeperIds, setGoalkeeperIds] = useState(() =>
		eventGoalkeeperIds(defaultGoalkeeperIds(players), initialGoalkeeperIds),
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
							setPresentIds(
								applyVisibleAttendance(presentIds, removable, false),
							);
							return;
						}

						setPresentIds(applyVisibleAttendance(presentIds, playerIds, true));
					}}
					onSetGoalkeeper={(playerIds, asGoalkeeper) => {
						setLocalError(null);
						setGoalkeeperIds((current) =>
							setGoalkeeperSelection(current, playerIds, asGoalkeeper),
						);
					}}
					isAddingPlayer={isAddingPlayer}
					addPlayerError={addPlayerError}
					onAddPlayer={
						onAddPlayer
							? async (values) => {
									const created = await onAddPlayer(values);
									if (created.length === 0) {
										return created;
									}

									setLocalError(null);
									setPresentIds(
										applyVisibleAttendance(
											presentIds,
											created.map((player) => player.id),
											true,
										),
									);
									return created;
								}
							: undefined
					}
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
