import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import {
	ATTENDANCE_STAT_META,
	attendanceStatsFromRows,
	EVENT_ACTION,
	type EventAttendanceStatsDraft,
	parseAttendanceStatInput,
	setAttendanceStat,
	validateEventAttendanceStats,
} from "@/const/championship-event";
import { playerVisibleName } from "@/const/player-name";
import { BUTTON_VARIANT, ERROR_CLASS, STAT_FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEventAttendance } from "@/types/championship-event";

type EditEventAttendanceStatsModalProps = {
	attendance: readonly ChampionshipEventAttendance[];
	players: ChampionshipPlayer[];
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onSave: (stats: EventAttendanceStatsDraft[]) => Promise<void>;
};

export function EditEventAttendanceStatsModal({
	attendance,
	players,
	isPending,
	errorMessage,
	onCancel,
	onSave,
}: EditEventAttendanceStatsModalProps) {
	const rosterById = new Map(players.map((player) => [player.id, player]));
	const attendanceById = new Map(attendance.map((row) => [row.player_id, row]));
	const presentIds = attendance.map((row) => row.player_id);
	const [draft, setDraft] = useState(() => attendanceStatsFromRows(attendance));
	const [localError, setLocalError] = useState<string | null>(null);

	return (
		<AppDialog onClose={onCancel}>
			<div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface p-6 shadow-lg">
				<p className="mb-5 text-sm font-medium tracking-tight text-fg">
					{EVENT_ACTION.markAttendanceStats}
				</p>
				<ul className="space-y-3">
					{draft.map((row) => {
						const player = rosterById.get(row.player_id);
						const name = playerVisibleName({
							nickname: player?.nickname ?? null,
							display_name:
								player?.display_name ??
								attendanceById.get(row.player_id)?.display_name ??
								String(row.player_id),
						});
						const avatarUrl = player?.avatar_url ?? null;

						return (
							<li
								key={row.player_id}
								className="space-y-4 rounded-xl bg-surface-muted p-4"
							>
								<div className="flex min-w-0 items-center gap-3">
									{avatarUrl && (
										<img
											src={avatarUrl}
											alt=""
											referrerPolicy="no-referrer"
											className="h-9 w-9 rounded-full object-cover"
										/>
									)}
									{!avatarUrl && (
										<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pitch-soft text-xs font-medium text-pitch-fg">
											{name.charAt(0).toUpperCase()}
										</span>
									)}
									<p className="min-w-0 truncate text-sm font-medium text-fg">
										{name}
									</p>
								</div>
								<div className="grid grid-cols-5 gap-3">
									{ATTENDANCE_STAT_META.map((field) => {
										const inputId = `attendance-stat-${row.player_id}-${field.id}`;

										return (
											<label
												key={field.id}
												htmlFor={inputId}
												className="flex flex-col items-center gap-1.5 text-xs font-medium text-fg-muted"
											>
												<span title={field.label}>{field.abbr}</span>
												<input
													id={inputId}
													type="number"
													min={0}
													step={1}
													inputMode="numeric"
													value={row[field.id]}
													className={STAT_FIELD_CLASS}
													onChange={(event) => {
														const next = parseAttendanceStatInput(
															event.target.value,
														);
														if (next === null) {
															return;
														}

														setLocalError(null);
														setDraft((current) =>
															setAttendanceStat(
																current,
																row.player_id,
																field.id,
																next,
															),
														);
													}}
												/>
											</label>
										);
									})}
								</div>
							</li>
						);
					})}
				</ul>
				{localError && <p className={`mt-2 ${ERROR_CLASS}`}>{localError}</p>}
				{errorMessage && (
					<p className={`mt-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-6 flex justify-end gap-2">
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
								const invalid = validateEventAttendanceStats(draft, presentIds);
								if (invalid) {
									setLocalError(invalid);
									return;
								}

								await onSave(draft);
							})();
						}}
						disabled={isPending}
					>
						{EVENT_ACTION.saveAttendanceStats}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
