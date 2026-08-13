import { Link } from "@tanstack/react-router";
import { Copy, Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AddEventTeamModal } from "@/components/add-event-team-modal";
import { Button } from "@/components/button";
import { ChampionshipEventBuilder } from "@/components/championship-event-builder";
import { DeleteEventAttendanceModal } from "@/components/delete-event-attendance-modal";
import { DeleteEventMatchModal } from "@/components/delete-event-match-modal";
import { DeleteEventModal } from "@/components/delete-event-modal";
import { DeleteEventTeamModal } from "@/components/delete-event-team-modal";
import { EditEventAttendanceModal } from "@/components/edit-event-attendance-modal";
import { EditEventAttendanceStatsModal } from "@/components/edit-event-attendance-stats-modal";
import { EndEventModal } from "@/components/end-event-modal";
import {
	EventTeamColorDot,
	EventTeamPlayerRow,
	EventTeamRatingAverage,
} from "@/components/event-team-player";
import { PlayerRating } from "@/components/player-rating";
import {
	attendanceGoalkeeperIds,
	builderTeamsFromEvent,
	CHAMPIONSHIP_EVENT,
	canEditEventTeams,
	canRemoveEventAttendance,
	canStartEventMatch,
	draftAttendanceForEnd,
	EVENT_ACTION,
	EVENT_ATTENDANCE_COLUMN_LABEL,
	EVENT_ATTENDANCE_STAT_ABBR,
	EVENT_BUILDER_STEP,
	EVENT_STATUS,
	EVENT_STATUS_LABEL,
	EVENT_TEAM_POSITION_LABEL,
	type EventAttendanceStatsDraft,
	type EventTeamDraft,
	eventStatus,
	eventTeamPlayerIds,
	eventTeamPlayerPosition,
	formatEventStartsAt,
	keepGoalkeepersPresent,
	teamHasMatches,
} from "@/const/championship-event";
import {
	EVENT_MATCH_LABEL,
	formatMatchScore,
	isOpenMatch,
	matchPlayUrl,
	matchScore,
	openEventMatch,
} from "@/const/championship-event-match";
import { CHAMPIONSHIP_ROLE } from "@/const/championship-role";
import { eventRatingPreview } from "@/const/event-rating-adjustment";
import {
	EVENT_TEAM_COLOR,
	type EventTeamColor,
	eventTeamColorFg,
	eventTeamColorStyle,
	eventTeamName,
} from "@/const/event-team-color";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import { ROUTES } from "@/const/routes";
import { BUTTON_VARIANT, CHIP_CLASS } from "@/const/ui";
import { useEventBuilderStep } from "@/hooks/use-event-builder-step";
import type { ChampionshipPlayer } from "@/types/championship";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventMatch,
	ChampionshipEventTeam,
} from "@/types/championship-event";

function formatAttendanceEventDate(value: string): string {
	if (!value) {
		return "—";
	}

	const [year, month, day] = value.split("-");
	if (!year || !month || !day) {
		return value;
	}

	return `${day}/${month}/${year}`;
}

function AttendanceStatLine({
	row,
	ceiling,
}: {
	row: ChampionshipEventAttendance;
	ceiling: number;
}) {
	const items = [
		{
			abbr: EVENT_ATTENDANCE_STAT_ABBR.goals,
			label: EVENT_ATTENDANCE_COLUMN_LABEL.goals,
			value: row.goals,
		},
		{
			abbr: EVENT_ATTENDANCE_STAT_ABBR.assists,
			label: EVENT_ATTENDANCE_COLUMN_LABEL.assists,
			value: row.assists,
		},
		{
			abbr: EVENT_ATTENDANCE_STAT_ABBR.ownGoals,
			label: EVENT_ATTENDANCE_COLUMN_LABEL.ownGoals,
			value: row.own_goals,
		},
		{
			abbr: EVENT_ATTENDANCE_STAT_ABBR.wins,
			label: EVENT_ATTENDANCE_COLUMN_LABEL.wins,
			value: row.wins,
		},
		{
			abbr: EVENT_ATTENDANCE_STAT_ABBR.matches,
			label: EVENT_ATTENDANCE_COLUMN_LABEL.matches,
			value: row.matches,
		},
	] as const;

	return (
		<div className="mt-0.5 space-y-0.5">
			<div className="flex items-center gap-2">
				<PlayerRating rating={row.rating} ceiling={ceiling} />
				<span
					className={CHIP_CLASS}
					title={EVENT_ATTENDANCE_COLUMN_LABEL.rating}
				>
					{row.rating}
				</span>
			</div>
			<p className="flex flex-wrap gap-x-2 text-xs text-fg-muted">
				<span title={EVENT_ATTENDANCE_COLUMN_LABEL.eventDate}>
					{formatAttendanceEventDate(row.event_date)}
				</span>
				{items.map((item) => (
					<span key={item.abbr} title={item.label}>
						{item.abbr} {item.value}
					</span>
				))}
			</p>
		</div>
	);
}

type ChampionshipEventDetailProps = {
	event: ChampionshipEvent;
	players: ChampionshipPlayer[];
	attendanceCounts: ReadonlyMap<number, number>;
	canManage: boolean;
	canOverrideEnded: boolean;
	onSaveTeams: (values: {
		presentPlayerIds: number[];
		goalkeeperPlayerIds: number[];
		teams: EventTeamDraft[];
	}) => Promise<void>;
	onSaveAttendance: (
		presentPlayerIds: number[],
		goalkeeperPlayerIds: number[],
	) => Promise<void>;
	onSaveAttendanceStats: (stats: EventAttendanceStatsDraft[]) => Promise<void>;
	onAddTeam: (values: {
		color: EventTeamColor | null;
		playerIds: number[];
		goalkeeperId: number;
	}) => Promise<void>;
	onUpdateTeam: (values: {
		teamId: number;
		color: EventTeamColor | null;
		playerIds: number[];
		goalkeeperId: number;
	}) => Promise<void>;
	onDeleteTeam: (teamId: number) => Promise<void>;
	onDeleteMatch: (matchId: number) => Promise<void>;
	onEnd: (presentPlayerIds: number[] | null) => Promise<void>;
	onDelete: () => Promise<void>;
	savingTeams: boolean;
	saveTeamsError: string | null;
	savingAttendance: boolean;
	saveAttendanceError: string | null;
	savingAttendanceStats: boolean;
	saveAttendanceStatsError: string | null;
	addingTeam: boolean;
	addTeamError: string | null;
	updatingTeam: boolean;
	updateTeamError: string | null;
	deletingTeam: boolean;
	deleteTeamError: string | null;
	deletingMatch: boolean;
	deleteMatchError: string | null;
	ending: boolean;
	endError: string | null;
	deleting: boolean;
	deleteError: string | null;
};

function TeamChip({
	color,
	sortOrder,
}: {
	color: EventTeamColor | null;
	sortOrder: number;
}) {
	const label = eventTeamName(color, sortOrder);
	if (color === null) {
		return (
			<span className="inline-flex items-center rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-medium text-fg">
				{label}
			</span>
		);
	}

	return (
		<span
			className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
			style={{
				backgroundColor: color,
				color: eventTeamColorFg(color),
			}}
		>
			{label}
		</span>
	);
}

function fallbackRosterPlayer(
	playerId: number,
	displayName: string,
): ChampionshipPlayer {
	return {
		id: playerId,
		championship_id: 0,
		user_id: null,
		display_name: displayName,
		nickname: null,
		avatar_url: null,
		rating: 0,
		role: CHAMPIONSHIP_ROLE.member,
		deleted_at: null,
		goals: 0,
		assists: 0,
		own_goals: 0,
		wins: 0,
		matches: 0,
	};
}

function resolveRosterPlayer(
	playerId: number,
	displayName: string,
	byId: Map<number, ChampionshipPlayer>,
): ChampionshipPlayer {
	return byId.get(playerId) ?? fallbackRosterPlayer(playerId, displayName);
}

function resolveEventPlayers(
	rows: readonly { player_id: number; display_name: string }[],
	byId: Map<number, ChampionshipPlayer>,
): ChampionshipPlayer[] {
	return rows.map((row) =>
		resolveRosterPlayer(row.player_id, row.display_name, byId),
	);
}

export function ChampionshipEventDetail({
	event,
	players,
	attendanceCounts,
	canManage,
	canOverrideEnded,
	onSaveTeams,
	onSaveAttendance,
	onSaveAttendanceStats,
	onAddTeam,
	onUpdateTeam,
	onDeleteTeam,
	onDeleteMatch,
	onEnd,
	onDelete,
	savingTeams,
	saveTeamsError,
	savingAttendance,
	saveAttendanceError,
	savingAttendanceStats,
	saveAttendanceStatsError,
	addingTeam,
	addTeamError,
	updatingTeam,
	updateTeamError,
	deletingTeam,
	deleteTeamError,
	deletingMatch,
	deleteMatchError,
	ending,
	endError,
	deleting,
	deleteError,
}: ChampionshipEventDetailProps) {
	const when = formatEventStartsAt(event.starts_at);
	const status = eventStatus(event.ended_at);
	const ended = status === EVENT_STATUS.ended;
	const teamById = new Map(event.teams.map((team) => [team.id, team]));
	const rosterById = new Map(players.map((player) => [player.id, player]));
	const presentPlayers = resolveEventPlayers(event.attendance, rosterById);
	const volunteerGoalkeeperIds = attendanceGoalkeeperIds(event.attendance);
	const teamPlayerIds = eventTeamPlayerIds(event.teams);
	const ceiling = championshipRatingCeiling([
		...players.map((player) => player.rating),
		...event.attendance.map((row) => row.rating),
	]);
	const teamsEditable = canManage && canEditEventTeams(event);
	const [step, setStep] = useEventBuilderStep();
	const mustBuild =
		teamsEditable && event.teams.length < CHAMPIONSHIP_EVENT.minTeams;
	const showTeamBuilder = teamsEditable && (step !== null || mustBuild);
	const builderStep = step ?? EVENT_BUILDER_STEP.attendance;
	const showAttendanceActions = canOverrideEnded && !showTeamBuilder;
	const showAddTeam = canOverrideEnded && !showTeamBuilder;
	const showStartMatch =
		!showTeamBuilder &&
		canStartEventMatch({
			ended,
			teamCount: event.teams.length,
		});
	const openMatch = openEventMatch(event.matches);
	const [copied, setCopied] = useState(false);
	const showMatchDelete = canOverrideEnded && !showTeamBuilder;
	const [isEndOpen, setIsEndOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
	const [isAttendanceStatsOpen, setIsAttendanceStatsOpen] = useState(false);
	const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
	const [teamToEdit, setTeamToEdit] = useState<ChampionshipEventTeam | null>(
		null,
	);
	const [teamToRemove, setTeamToRemove] =
		useState<ChampionshipEventTeam | null>(null);
	const [attendanceToRemove, setAttendanceToRemove] =
		useState<ChampionshipPlayer | null>(null);
	const [matchToRemove, setMatchToRemove] =
		useState<ChampionshipEventMatch | null>(null);
	const draftPresentIdsRef = useRef(
		event.attendance.map((row) => row.player_id),
	);

	const ratingPreview = eventRatingPreview({
		attendance: event.attendance,
		players,
		presentPlayerIds: draftAttendanceForEnd(
			showTeamBuilder,
			draftPresentIdsRef.current,
		),
	});
	const previewCeiling = championshipRatingCeiling([
		...players.map((player) => player.rating),
		...ratingPreview.map((row) => row.to),
	]);

	useEffect(() => {
		if (!mustBuild) {
			return;
		}

		if (step !== null) {
			return;
		}

		void setStep(EVENT_BUILDER_STEP.attendance);
	}, [mustBuild, setStep, step]);

	return (
		<article className="space-y-6">
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-sm font-semibold tracking-tight text-fg">
					{when.date} · {when.time}
				</p>
				<span className={CHIP_CLASS}>{EVENT_STATUS_LABEL[status]}</span>
				{(canManage || showStartMatch) && (
					<div className="ml-auto flex flex-wrap items-center gap-2">
						{showStartMatch && (
							<Link
								to={ROUTES.championshipEventPlay}
								params={{
									championshipId: String(event.championship_id),
									eventId: String(event.id),
								}}
								className="inline-flex items-center justify-center gap-2 rounded-lg bg-pitch px-4 py-2 text-sm font-medium text-white hover:bg-pitch-dark"
							>
								{openMatch
									? EVENT_ACTION.continueMatch
									: EVENT_ACTION.startMatch}
							</Link>
						)}
						{showStartMatch && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={async () => {
									const url = matchPlayUrl(
										window.location.origin,
										event.championship_id,
										event.id,
										ROUTES.championshipEventPlay,
									);
									await navigator.clipboard.writeText(url);
									setCopied(true);
								}}
							>
								<Copy className="size-4" />
								{copied ? EVENT_MATCH_LABEL.copied : EVENT_ACTION.copyMatchLink}
							</Button>
						)}
						{canManage && teamsEditable && !showTeamBuilder && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={() => {
									void setStep(EVENT_BUILDER_STEP.teams);
								}}
							>
								{EVENT_ACTION.editTeams}
							</Button>
						)}
						{canManage && showAttendanceActions && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={() => setIsAttendanceOpen(true)}
							>
								{EVENT_ACTION.addAttendance}
							</Button>
						)}
						{canManage &&
							showAttendanceActions &&
							event.attendance.length > 0 && (
								<Button
									variant={BUTTON_VARIANT.secondary}
									onClick={() => setIsAttendanceStatsOpen(true)}
								>
									{EVENT_ACTION.markAttendanceStats}
								</Button>
							)}
						{canManage && showAddTeam && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={() => setIsAddTeamOpen(true)}
							>
								{EVENT_ACTION.addTeam}
							</Button>
						)}
						{canManage && status === EVENT_STATUS.open && (
							<Button
								variant={BUTTON_VARIANT.ghost}
								onClick={() => setIsEndOpen(true)}
							>
								{EVENT_ACTION.endEvent}
							</Button>
						)}
						{canManage && (
							<Button
								variant={BUTTON_VARIANT.danger}
								onClick={() => setIsDeleteOpen(true)}
							>
								Excluir
							</Button>
						)}
					</div>
				)}
			</div>
			{showTeamBuilder && (
				<ChampionshipEventBuilder
					playersPerTeam={event.players_per_team}
					players={players}
					attendanceCounts={attendanceCounts}
					step={builderStep}
					initialPresentIds={event.attendance.map((row) => row.player_id)}
					initialGoalkeeperIds={volunteerGoalkeeperIds}
					initialTeams={builderTeamsFromEvent(
						event.teams,
						event.players_per_team,
						event.attendance.length,
					)}
					isPending={savingTeams}
					errorMessage={saveTeamsError}
					onStepChange={(next) => {
						void setStep(next);
					}}
					onCancel={
						event.teams.length >= CHAMPIONSHIP_EVENT.minTeams
							? () => {
									void setStep(null);
								}
							: undefined
					}
					onPresentIdsChange={(playerIds) => {
						draftPresentIdsRef.current = [...playerIds];
					}}
					onSubmit={async (values, keepOpen) => {
						await onSaveTeams(values);
						if (keepOpen) {
							return;
						}

						void setStep(null);
					}}
				/>
			)}
			{!showTeamBuilder && (
				<ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{event.teams.map((team) => {
						const cardStyle = eventTeamColorStyle(team.color);
						const teamRoster = team.players.map((row) => ({
							row,
							player: resolveRosterPlayer(
								row.player_id,
								row.display_name,
								rosterById,
							),
						}));

						return (
							<li
								key={team.id}
								className="relative rounded-lg border border-line bg-surface p-2 text-sm"
								style={cardStyle}
							>
								<EventTeamColorDot color={team.color} />
								<div className="mb-1 flex items-center gap-1 pr-5">
									<p className="min-w-0 flex-1 text-xs font-medium">
										{eventTeamName(team.color, team.sort_order)}
									</p>
									{canOverrideEnded && (
										<button
											type="button"
											aria-label={EVENT_ACTION.editTeam}
											className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-black/10"
											onClick={() => setTeamToEdit(team)}
										>
											<Pencil className="size-3.5" />
										</button>
									)}
									{canOverrideEnded &&
										!teamHasMatches(team.id, event.matches) && (
											<button
												type="button"
												aria-label={EVENT_ACTION.removeTeam}
												className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-black/10 hover:text-danger-fg"
												onClick={() => setTeamToRemove(team)}
											>
												<X className="size-3.5" />
											</button>
										)}
								</div>
								<ul className="space-y-1">
									{teamRoster.map(({ row, player }) => {
										const position = eventTeamPlayerPosition(row.is_goalkeeper);

										return (
											<li
												key={row.id}
												className="flex min-h-7 items-center gap-1.5 rounded-md bg-white px-1.5 py-1"
											>
												<span className={`${CHIP_CLASS} shrink-0`}>
													{EVENT_TEAM_POSITION_LABEL[position]}
												</span>
												<EventTeamPlayerRow
													player={player}
													ceiling={ceiling}
													backgroundColor={EVENT_TEAM_COLOR.white}
												/>
											</li>
										);
									})}
								</ul>
								<EventTeamRatingAverage
									ratings={teamRoster.map(({ player }) => player.rating)}
								/>
							</li>
						);
					})}
				</ul>
			)}
			{!showTeamBuilder && (
				<div>
					<p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
						Partidas
					</p>
					{event.matches.length === 0 && (
						<p className="text-sm text-fg-muted">{EVENT_MATCH_LABEL.none}</p>
					)}
					{event.matches.length > 0 && (
						<ul className="space-y-2">
							{event.matches.map((match) => {
								const teamA = teamById.get(match.team_a_id);
								const teamB = teamById.get(match.team_b_id);
								if (!teamA || !teamB) {
									return null;
								}

								const teamAIds = new Set(
									match.players
										.filter((player) => player.team_id === match.team_a_id)
										.map((player) => player.player_id),
								);
								const score = matchScore(match.goals, teamAIds);
								const winner =
									match.winner_team_id === null
										? null
										: teamById.get(match.winner_team_id);
								const open = isOpenMatch(match);
								const playedA = match.players.filter(
									(player) => player.team_id === match.team_a_id,
								);
								const playedB = match.players.filter(
									(player) => player.team_id === match.team_b_id,
								);

								return (
									<li
										key={match.id}
										className={`rounded-lg border border-line p-2 text-sm ${
											open ? "ring-1 ring-pitch/40" : ""
										}`}
									>
										<div className="flex flex-wrap items-center gap-2">
											<TeamChip
												color={teamA.color}
												sortOrder={teamA.sort_order}
											/>
											<span className="tabular-nums text-fg">
												{formatMatchScore(score.teamA, score.teamB)}
											</span>
											<TeamChip
												color={teamB.color}
												sortOrder={teamB.sort_order}
											/>
											<span className="text-xs text-fg-muted">
												{EVENT_MATCH_LABEL.winner}
											</span>
											{open && (
												<span className={CHIP_CLASS}>
													{EVENT_MATCH_LABEL.open}
												</span>
											)}
											{!open && winner && (
												<TeamChip
													color={winner.color}
													sortOrder={winner.sort_order}
												/>
											)}
											{!open && !winner && (
												<span className={CHIP_CLASS}>
													{EVENT_MATCH_LABEL.draw}
												</span>
											)}
											{showMatchDelete && (
												<button
													type="button"
													aria-label={EVENT_ACTION.removeMatch}
													className="ml-auto inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-danger-fg"
													onClick={() => setMatchToRemove(match)}
												>
													<X className="size-4" />
												</button>
											)}
										</div>
										{match.players.length > 0 && (
											<p className="mt-1 text-xs text-fg-muted">
												{playedA
													.map((row) =>
														playerVisibleName(
															resolveRosterPlayer(
																row.player_id,
																row.display_name,
																rosterById,
															),
														),
													)
													.join(", ")}
												{" · "}
												{playedB
													.map((row) =>
														playerVisibleName(
															resolveRosterPlayer(
																row.player_id,
																row.display_name,
																rosterById,
															),
														),
													)
													.join(", ")}
											</p>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</div>
			)}
			{!showTeamBuilder && (
				<div>
					<p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
						Presentes
					</p>
					{event.attendance.length === 0 && (
						<p className="text-sm text-fg-muted">Ninguém marcado.</p>
					)}
					{event.attendance.length > 0 && (
						<ul className="divide-y divide-line">
							{event.attendance.map((row) => {
								const player = resolveRosterPlayer(
									row.player_id,
									row.display_name,
									rosterById,
								);

								return (
									<li
										key={row.id}
										className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
									>
										{player.avatar_url && (
											<img
												src={player.avatar_url}
												alt=""
												referrerPolicy="no-referrer"
												className="h-8 w-8 rounded-full object-cover"
											/>
										)}
										{!player.avatar_url && (
											<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pitch-soft text-xs font-medium text-pitch-fg">
												{playerVisibleName(player).charAt(0).toUpperCase()}
											</span>
										)}
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium text-fg">
												{playerVisibleName(player)}
											</p>
											<AttendanceStatLine row={row} ceiling={ceiling} />
										</div>
										{showAttendanceActions &&
											canRemoveEventAttendance(
												player.id,
												event.attendance.length,
												teamPlayerIds,
											) && (
												<button
													type="button"
													aria-label={EVENT_ACTION.removeAttendance}
													className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-danger-fg"
													onClick={() => setAttendanceToRemove(player)}
												>
													<X className="size-4" />
												</button>
											)}
									</li>
								);
							})}
						</ul>
					)}
				</div>
			)}
			{isAttendanceOpen && (
				<EditEventAttendanceModal
					players={players}
					attendanceCounts={attendanceCounts}
					initialPresentIds={event.attendance.map((row) => row.player_id)}
					initialGoalkeeperIds={volunteerGoalkeeperIds}
					teamPlayerIds={teamPlayerIds}
					isPending={savingAttendance}
					errorMessage={saveAttendanceError}
					onCancel={() => {
						if (savingAttendance) {
							return;
						}

						setIsAttendanceOpen(false);
					}}
					onSave={async (presentPlayerIds, goalkeeperPlayerIds) => {
						await onSaveAttendance(presentPlayerIds, goalkeeperPlayerIds);
						setIsAttendanceOpen(false);
					}}
				/>
			)}
			{isAttendanceStatsOpen && (
				<EditEventAttendanceStatsModal
					attendance={event.attendance}
					players={players}
					isPending={savingAttendanceStats}
					errorMessage={saveAttendanceStatsError}
					onCancel={() => {
						if (savingAttendanceStats) {
							return;
						}

						setIsAttendanceStatsOpen(false);
					}}
					onSave={async (stats) => {
						await onSaveAttendanceStats(stats);
						setIsAttendanceStatsOpen(false);
					}}
				/>
			)}
			{isAddTeamOpen && (
				<AddEventTeamModal
					playersPerTeam={event.players_per_team}
					presentPlayers={presentPlayers}
					goalkeeperIds={volunteerGoalkeeperIds}
					usedColors={event.teams.flatMap((team) =>
						team.color === null ? [] : [team.color],
					)}
					takenPlayerIds={teamPlayerIds}
					isPending={addingTeam}
					errorMessage={addTeamError}
					onCancel={() => {
						if (addingTeam) {
							return;
						}

						setIsAddTeamOpen(false);
					}}
					onAdd={async (values) => {
						await onAddTeam(values);
						setIsAddTeamOpen(false);
					}}
				/>
			)}
			{teamToEdit && (
				<AddEventTeamModal
					playersPerTeam={event.players_per_team}
					presentPlayers={presentPlayers}
					goalkeeperIds={volunteerGoalkeeperIds}
					usedColors={event.teams
						.filter((team) => team.id !== teamToEdit.id)
						.flatMap((team) => (team.color === null ? [] : [team.color]))}
					takenPlayerIds={eventTeamPlayerIds(
						event.teams.filter((team) => team.id !== teamToEdit.id),
					)}
					initialTeam={{
						color: teamToEdit.color,
						players: teamToEdit.players,
					}}
					isPending={updatingTeam}
					errorMessage={updateTeamError}
					onCancel={() => {
						if (updatingTeam) {
							return;
						}

						setTeamToEdit(null);
					}}
					onAdd={async (values) => {
						await onUpdateTeam({
							teamId: teamToEdit.id,
							...values,
						});
						setTeamToEdit(null);
					}}
				/>
			)}
			{teamToRemove && (
				<DeleteEventTeamModal
					isPending={deletingTeam}
					errorMessage={deleteTeamError}
					onCancel={() => {
						if (deletingTeam) {
							return;
						}

						setTeamToRemove(null);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								await onDeleteTeam(teamToRemove.id);
								setTeamToRemove(null);
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
			{attendanceToRemove && (
				<DeleteEventAttendanceModal
					playerName={playerVisibleName(attendanceToRemove)}
					isPending={savingAttendance}
					errorMessage={saveAttendanceError}
					onCancel={() => {
						if (savingAttendance) {
							return;
						}

						setAttendanceToRemove(null);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								const playerId = attendanceToRemove.id;
								const nextPresent = event.attendance
									.map((row) => row.player_id)
									.filter((id) => id !== playerId);
								await onSaveAttendance(
									nextPresent,
									keepGoalkeepersPresent(volunteerGoalkeeperIds, nextPresent),
								);
								setAttendanceToRemove(null);
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
			{matchToRemove && (
				<DeleteEventMatchModal
					isPending={deletingMatch}
					errorMessage={deleteMatchError}
					onCancel={() => {
						if (deletingMatch) {
							return;
						}

						setMatchToRemove(null);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								await onDeleteMatch(matchToRemove.id);
								setMatchToRemove(null);
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
			{isEndOpen && (
				<EndEventModal
					rows={ratingPreview}
					ceiling={previewCeiling}
					isPending={ending}
					errorMessage={endError}
					onCancel={() => {
						if (ending) {
							return;
						}

						setIsEndOpen(false);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								const presentPlayerIds = draftAttendanceForEnd(
									showTeamBuilder,
									draftPresentIdsRef.current,
								);
								await onEnd(presentPlayerIds);
								setIsEndOpen(false);
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
			{isDeleteOpen && (
				<DeleteEventModal
					isPending={deleting}
					errorMessage={deleteError}
					onCancel={() => {
						if (deleting) {
							return;
						}

						setIsDeleteOpen(false);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								await onDelete();
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
		</article>
	);
}
