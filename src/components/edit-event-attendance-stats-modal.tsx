import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { PlayerRating } from "@/components/player-rating";
import {
	ATTENDANCE_STAT_META,
	attendanceStatsFromRows,
	EVENT_ACTION,
	EVENT_ATTENDANCE_COLUMN_LABEL,
	type EventAttendanceStatsDraft,
	parseAttendanceStatInput,
	setAttendanceRating,
	setAttendanceStat,
	validateEventAttendanceStats,
} from "@/const/championship-event";
import { playerVisibleName } from "@/const/player-name";
import { starFillToRating } from "@/const/player-rating";
import {
	BUTTON_VARIANT,
	CHIP_CLASS,
	ERROR_CLASS,
	FIELD_CLASS,
} from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEventAttendance } from "@/types/championship-event";

type EditEventAttendanceStatsModalProps = {
	attendance: readonly ChampionshipEventAttendance[];
	players: ChampionshipPlayer[];
	ceiling: number;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onSave: (stats: EventAttendanceStatsDraft[]) => Promise<void>;
};

export function EditEventAttendanceStatsModal({
	attendance,
	players,
	ceiling,
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
			<div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface p-4 shadow-lg">
				<p className="mb-3 text-sm font-medium tracking-tight text-fg">
					{EVENT_ACTION.markAttendanceStats}
				</p>
				<ul className="divide-y divide-line">
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
								className="space-y-2 py-3 first:pt-0 last:pb-0"
							>
								<div className="flex min-w-0 items-center gap-3">
									{avatarUrl && (
										<img
											src={avatarUrl}
											alt=""
											referrerPolicy="no-referrer"
											className="h-8 w-8 rounded-full object-cover"
										/>
									)}
									{!avatarUrl && (
										<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pitch-soft text-xs font-medium text-pitch-fg">
											{name.charAt(0).toUpperCase()}
										</span>
									)}
									<p className="min-w-0 truncate text-sm font-medium text-fg">
										{name}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs text-fg-muted">
										{EVENT_ATTENDANCE_COLUMN_LABEL.rating}
									</span>
									<PlayerRating
										rating={row.rating}
										ceiling={ceiling}
										onChange={(starFill) => {
											setLocalError(null);
											setDraft((current) =>
												setAttendanceRating(
													current,
													row.player_id,
													starFillToRating(starFill, ceiling),
												),
											);
										}}
									/>
									<span className={CHIP_CLASS}>{row.rating}</span>
								</div>
								<div className="grid grid-cols-5 gap-2">
									{ATTENDANCE_STAT_META.map((field) => {
										const inputId = `attendance-stat-${row.player_id}-${field.id}`;

										return (
											<label
												key={field.id}
												htmlFor={inputId}
												className="block text-xs text-fg-muted"
											>
												<span title={field.label}>{field.abbr}</span>
												<input
													id={inputId}
													type="number"
													min={0}
													step={1}
													inputMode="numeric"
													value={row[field.id]}
													className={`mt-1 ${FIELD_CLASS} px-2 text-center tabular-nums`}
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
