import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import {
	ATTENDANCE_STAT_META,
	ATTENDANCE_STATS_TEAM_FILTER,
	ATTENDANCE_STATS_TEAM_FILTER_LABEL,
	type AttendanceStatsTeamFilter,
	attendanceStatsFromRows,
	EVENT_ACTION,
	type EventAttendanceStatsDraft,
	eventTeamByPlayerId,
	filterAttendanceByTeam,
	parseAttendanceStatInput,
	setAttendanceStat,
	sortAttendanceByTeam,
	validateEventAttendanceStats,
} from "@/const/championship-event";
import {
	eventTeamColorFg,
	eventTeamColorStyle,
	eventTeamName,
} from "@/const/event-team-color";
import { playerVisibleName } from "@/const/player-name";
import { BUTTON_VARIANT, ERROR_CLASS, STAT_FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type {
	ChampionshipEventAttendance,
	ChampionshipEventTeam,
} from "@/types/championship-event";

const FILTER_CHIP =
	"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition";
const FILTER_CHIP_ON = `${FILTER_CHIP} bg-pitch text-white hover:bg-pitch-dark`;
const FILTER_CHIP_OFF = `${FILTER_CHIP} bg-surface-muted text-fg-muted hover:bg-black/10 hover:text-fg`;
const TEAM_FILTER_CHIP = `${FILTER_CHIP} ring-offset-2 ring-offset-surface`;

function neutralFilterChipClass(selected: boolean): string {
	if (selected) {
		return FILTER_CHIP_ON;
	}

	return FILTER_CHIP_OFF;
}

function teamFilterChipClass(selected: boolean): string {
	if (!selected) {
		return TEAM_FILTER_CHIP;
	}

	return `${TEAM_FILTER_CHIP} ring-2 ring-pitch-fg`;
}

function AttendanceTeamFilterChip({
	selected,
	label,
	color,
	onSelect,
}: {
	selected: boolean;
	label: string;
	color: string | null;
	onSelect: () => void;
}) {
	if (color === null) {
		return (
			<button
				type="button"
				aria-pressed={selected}
				className={neutralFilterChipClass(selected)}
				onClick={onSelect}
			>
				{label}
			</button>
		);
	}

	return (
		<button
			type="button"
			aria-pressed={selected}
			className={teamFilterChipClass(selected)}
			style={{
				backgroundColor: color,
				color: eventTeamColorFg(color),
			}}
			onClick={onSelect}
		>
			{label}
		</button>
	);
}

type EditEventAttendanceStatsModalProps = {
	attendance: readonly ChampionshipEventAttendance[];
	teams: readonly ChampionshipEventTeam[];
	players: ChampionshipPlayer[];
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onSave: (stats: EventAttendanceStatsDraft[]) => Promise<void>;
};

export function EditEventAttendanceStatsModal({
	attendance,
	teams,
	players,
	isPending,
	errorMessage,
	onCancel,
	onSave,
}: EditEventAttendanceStatsModalProps) {
	const rosterById = new Map(players.map((player) => [player.id, player]));
	const attendanceById = new Map(attendance.map((row) => [row.player_id, row]));
	const presentIds = attendance.map((row) => row.player_id);
	const teamByPlayerId = eventTeamByPlayerId(teams);
	const orderedTeams = [...teams].sort(
		(left, right) => left.sort_order - right.sort_order,
	);
	const [draft, setDraft] = useState(() => attendanceStatsFromRows(attendance));
	const [teamFilter, setTeamFilter] = useState<AttendanceStatsTeamFilter>(
		ATTENDANCE_STATS_TEAM_FILTER.all,
	);
	const [localError, setLocalError] = useState<string | null>(null);
	const hasUnassigned = draft.some((row) => !teamByPlayerId.has(row.player_id));
	const visibleRows = filterAttendanceByTeam(
		sortAttendanceByTeam(draft, teamByPlayerId),
		teamByPlayerId,
		teamFilter,
	);

	return (
		<AppDialog onClose={onCancel}>
			<div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface p-6 shadow-lg">
				<p className="mb-5 text-sm font-medium tracking-tight text-fg">
					{EVENT_ACTION.markAttendanceStats}
				</p>
				{teams.length > 0 && (
					<fieldset className="mb-4 flex flex-wrap gap-1.5 border-0 p-0">
						<legend className="sr-only">
							{ATTENDANCE_STATS_TEAM_FILTER_LABEL.group}
						</legend>
						<AttendanceTeamFilterChip
							selected={teamFilter === ATTENDANCE_STATS_TEAM_FILTER.all}
							label={ATTENDANCE_STATS_TEAM_FILTER_LABEL.all}
							color={null}
							onSelect={() => setTeamFilter(ATTENDANCE_STATS_TEAM_FILTER.all)}
						/>
						{orderedTeams.map((team) => (
							<AttendanceTeamFilterChip
								key={team.id}
								selected={teamFilter === team.id}
								label={eventTeamName(team.color, team.sort_order)}
								color={team.color}
								onSelect={() => setTeamFilter(team.id)}
							/>
						))}
						{hasUnassigned && (
							<AttendanceTeamFilterChip
								selected={teamFilter === ATTENDANCE_STATS_TEAM_FILTER.none}
								label={ATTENDANCE_STATS_TEAM_FILTER_LABEL.none}
								color={null}
								onSelect={() =>
									setTeamFilter(ATTENDANCE_STATS_TEAM_FILTER.none)
								}
							/>
						)}
					</fieldset>
				)}
				<ul className="space-y-3">
					{visibleRows.map((row) => {
						const player = rosterById.get(row.player_id);
						const name = playerVisibleName({
							nickname: player?.nickname ?? null,
							display_name:
								player?.display_name ??
								attendanceById.get(row.player_id)?.display_name ??
								String(row.player_id),
						});
						const avatarUrl = player?.avatar_url ?? null;
						const team = teamByPlayerId.get(row.player_id);

						return (
							<li
								key={row.player_id}
								className="space-y-4 rounded-xl bg-surface-muted p-4 text-fg"
								style={eventTeamColorStyle(team?.color ?? null)}
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
									<p className="min-w-0 truncate text-sm font-medium">{name}</p>
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
