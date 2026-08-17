import {
	Award,
	ChartColumn,
	LoaderCircle,
	Pencil,
	Plus,
	Share2,
	UserCheck,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import { type RefObject, useState } from "react";
import { AddEventTeamModal } from "@/components/add-event-team-modal";
import { Button } from "@/components/button";
import { ChampionshipEventBuilder } from "@/components/championship-event-builder";
import { ChampionshipEventMatchHistory } from "@/components/championship-event-match-history";
import { DeleteEventAttendanceModal } from "@/components/delete-event-attendance-modal";
import { DeleteEventMatchModal } from "@/components/delete-event-match-modal";
import { DeleteEventTeamModal } from "@/components/delete-event-team-modal";
import { EditEventAttendanceModal } from "@/components/edit-event-attendance-modal";
import { EditEventAttendanceStatsModal } from "@/components/edit-event-attendance-stats-modal";
import {
	EVENT_TEAM_PLAYER_SLOT_CLASS,
	EVENT_TEAM_POSITION_CHIP_CLASS,
	EventTeamColorDot,
	EventTeamPlayerRow,
	EventTeamRatingAverage,
} from "@/components/event-team-player";
import { LateJoinAttendanceModal } from "@/components/late-join-attendance-modal";
import { IconTooltipButton } from "@/components/molecules/icon-tooltip-button";
import { PlayerRating } from "@/components/player-rating";
import { ReopenEventMatchModal } from "@/components/reopen-event-match-modal";
import { SetEventMvpModal } from "@/components/set-event-mvp-modal";
import {
	attendanceGoalkeeperIds,
	builderTeamsFromEvent,
	builderTeamsHavePlayers,
	CHAMPIONSHIP_EVENT,
	canEditEventTeams,
	canRemoveEventAttendance,
	canSelfCheckIn,
	clearAttendanceDraft,
	EVENT_ACTION,
	EVENT_ATTENDANCE_COLUMN_LABEL,
	EVENT_ATTENDANCE_STAT_ABBR,
	EVENT_BUILDER_STEP,
	EVENT_BUILDER_STEP_LABEL,
	EVENT_CHECK_IN_LABEL,
	EVENT_RSVP_CHOICES,
	EVENT_RSVP_LABEL,
	EVENT_RSVP_STATUS,
	EVENT_RSVP_STATUS_LABEL,
	EVENT_SECTION_LABEL,
	EVENT_STATUS,
	EVENT_TEAM_POSITION_LABEL,
	type EventAttendanceStatsDraft,
	type EventBuilderStep,
	type EventRsvpStatus,
	type EventStatus,
	type EventTeamDraft,
	eventRsvpButtonVariant,
	eventTeamPlayerIds,
	eventTeamPlayerPosition,
	keepGoalkeepersPresent,
	resolveBuilderInitialPresentIds,
	rsvpGoingPlayerIds,
	teamHasMatches,
	writeAttendanceDraft,
} from "@/const/championship-event";
import { isOpenMatch } from "@/const/championship-event-match";
import {
	resolveEventPlayers,
	resolveRosterPlayer,
} from "@/const/championship-event-roster";
import {
	attendanceMvpPlayerIds,
	EVENT_MVP_LABEL,
	eventMvpPickCandidates,
} from "@/const/event-mvp";
import {
	type EventTeamColor,
	eventTeamColorStyle,
	eventTeamName,
	usedEventTeamColors,
} from "@/const/event-team-color";
import {
	EVENT_TEAM_SHARE_LABEL,
	eventTeamsShareCards,
} from "@/const/event-team-share";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import { CHIP_CLASS, ERROR_CLASS } from "@/const/ui";
import { handlerWhenAllowed } from "@/lib/handler-when-allowed";
import { shareEventTeamsImage } from "@/lib/share-event-teams-image";
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
			abbr: EVENT_ATTENDANCE_STAT_ABBR.assistedGoals,
			label: EVENT_ATTENDANCE_COLUMN_LABEL.assistedGoals,
			value: row.assisted_goals,
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
			abbr: EVENT_ATTENDANCE_STAT_ABBR.losses,
			label: EVENT_ATTENDANCE_COLUMN_LABEL.losses,
			value: row.losses,
		},
		{
			abbr: EVENT_ATTENDANCE_STAT_ABBR.draws,
			label: EVENT_ATTENDANCE_COLUMN_LABEL.draws,
			value: row.draws,
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
				{row.is_mvp && (
					<span
						className={CHIP_CLASS}
						title={EVENT_ATTENDANCE_COLUMN_LABEL.mvp}
					>
						{EVENT_MVP_LABEL.badge}
					</span>
				)}
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

type ChampionshipEventRoundTabProps = {
	event: ChampionshipEvent;
	championshipName: string;
	players: ChampionshipPlayer[];
	attendanceCounts: ReadonlyMap<number, number>;
	seedEvents: readonly ChampionshipEvent[];
	currentPlayerId: number | null;
	canManage: boolean;
	canOverrideEnded: boolean;
	canSetMvp: boolean;
	rosterById: ReadonlyMap<number, ChampionshipPlayer>;
	showTeamBuilder: boolean;
	builderStep: EventBuilderStep;
	onBuilderStepChange: (step: EventBuilderStep | null) => void;
	draftPresentIdsRef: RefObject<number[]>;
	status: EventStatus;
	onSaveTeams: (values: {
		presentPlayerIds: number[];
		goalkeeperPlayerIds: number[];
		teams: EventTeamDraft[];
	}) => Promise<void>;
	onSaveAttendance: (
		presentPlayerIds: number[],
		goalkeeperPlayerIds: number[],
	) => Promise<void>;
	onEnsureAttendance: (playerId: number) => Promise<void>;
	onUpsertRsvp: (status: EventRsvpStatus) => Promise<void>;
	onPromoteRsvpGoing: () => Promise<void>;
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
	onOpenMatch: (match: ChampionshipEventMatch) => Promise<void>;
	onSetMvps: (playerIds: number[]) => Promise<void>;
	savingTeams: boolean;
	saveTeamsError: string | null;
	savingAttendance: boolean;
	saveAttendanceError: string | null;
	ensuringAttendance: boolean;
	ensureAttendanceError: string | null;
	savingRsvp: boolean;
	rsvpError: string | null;
	promotingRsvp: boolean;
	promoteRsvpError: string | null;
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
	openingMatch: boolean;
	openMatchError: string | null;
	settingMvp: boolean;
	setMvpError: string | null;
	onAddPlayer?: (values: {
		displayNames: string[];
		rating: number;
		isGoalkeeper: boolean;
	}) => Promise<ChampionshipPlayer[]>;
	isAddingPlayer?: boolean;
	addPlayerError?: string | null;
};

export function ChampionshipEventRoundTab({
	event,
	championshipName,
	players,
	attendanceCounts,
	seedEvents,
	currentPlayerId,
	canManage,
	canOverrideEnded,
	canSetMvp,
	rosterById,
	showTeamBuilder,
	builderStep,
	onBuilderStepChange,
	draftPresentIdsRef,
	status,
	onSaveTeams,
	onSaveAttendance,
	onEnsureAttendance,
	onUpsertRsvp,
	onPromoteRsvpGoing,
	onSaveAttendanceStats,
	onAddTeam,
	onUpdateTeam,
	onDeleteTeam,
	onDeleteMatch,
	onOpenMatch,
	onSetMvps,
	savingTeams,
	saveTeamsError,
	savingAttendance,
	saveAttendanceError,
	ensuringAttendance,
	ensureAttendanceError,
	savingRsvp,
	rsvpError,
	promotingRsvp,
	promoteRsvpError,
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
	openingMatch,
	openMatchError,
	settingMvp,
	setMvpError,
	onAddPlayer,
	isAddingPlayer = false,
	addPlayerError = null,
}: ChampionshipEventRoundTabProps) {
	const ended = status === EVENT_STATUS.ended;
	const presentPlayers = resolveEventPlayers(event.attendance, rosterById);
	const volunteerGoalkeeperIds = attendanceGoalkeeperIds(event.attendance);
	const teamPlayerIds = eventTeamPlayerIds(event.teams);
	const presentRatings = presentPlayers.map((player) => player.rating);
	const ceiling = championshipRatingCeiling([
		...players.map((player) => player.rating),
		...event.attendance.map((row) => row.rating),
	]);
	const teamsEditable = canManage && canEditEventTeams(event);
	const detailTeams = builderTeamsFromEvent(
		event.teams,
		event.players_per_team,
		event.attendance.length,
	);
	const showShareTeams =
		!showTeamBuilder && builderTeamsHavePlayers(detailTeams);
	const showAddAttendance = canManage && !showTeamBuilder;
	const showAttendanceOwnerActions = canOverrideEnded && !showTeamBuilder;
	const showAddTeam = canOverrideEnded && !showTeamBuilder;
	const showMatchDelete = canOverrideEnded && !showTeamBuilder;
	const [isSharing, setIsSharing] = useState(false);
	const [shareError, setShareError] = useState<string | null>(null);
	const [isMvpOpen, setIsMvpOpen] = useState(false);
	const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
	const [isLateJoinOpen, setIsLateJoinOpen] = useState(false);
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
	const [matchToReopen, setMatchToReopen] =
		useState<ChampionshipEventMatch | null>(null);

	const attendanceIds = event.attendance.map((row) => row.player_id);
	const selfCheckIn = canSelfCheckIn({
		endedAt: event.ended_at,
		startsAt: event.starts_at,
		playerId: currentPlayerId,
		attendanceIds,
	});
	const myRsvp = event.rsvps.find((row) => row.player_id === currentPlayerId);
	const goingRsvpIds = rsvpGoingPlayerIds(event.rsvps);
	const goingNotPresentIds = goingRsvpIds.filter(
		(playerId) => !attendanceIds.includes(playerId),
	);
	const selectedMvpIds = attendanceMvpPlayerIds(event.attendance);
	const attendanceNameByPlayerId = new Map(
		event.attendance.map((row) => [row.player_id, row.display_name]),
	);

	async function handleShareTeams() {
		setIsSharing(true);
		setShareError(null);
		try {
			await shareEventTeamsImage(
				eventTeamsShareCards(detailTeams, players),
				ceiling,
				{ championshipName, startsAt: event.starts_at },
			);
		} catch {
			setShareError(EVENT_TEAM_SHARE_LABEL.shareFailed);
		} finally {
			setIsSharing(false);
		}
	}

	return (
		<>
			{showTeamBuilder && (
				<ChampionshipEventBuilder
					playersPerTeam={event.players_per_team}
					players={players}
					attendanceCounts={attendanceCounts}
					seedEvents={seedEvents}
					step={builderStep}
					startsAt={event.starts_at}
					championshipName={championshipName}
					initialPresentIds={resolveBuilderInitialPresentIds(
						event.attendance.map((row) => row.player_id),
						event.id,
					)}
					initialGoalkeeperIds={volunteerGoalkeeperIds}
					initialTeams={detailTeams}
					isPending={savingTeams}
					errorMessage={saveTeamsError}
					onStepChange={(next) => {
						void onBuilderStepChange(next);
					}}
					onCancel={handlerWhenAllowed(
						event.teams.length >= CHAMPIONSHIP_EVENT.minTeams,
						() => {
							void onBuilderStepChange(null);
						},
					)}
					onPresentIdsChange={(playerIds) => {
						draftPresentIdsRef.current = [...playerIds];
						writeAttendanceDraft(event.id, playerIds);
					}}
					onAddPlayer={onAddPlayer}
					isAddingPlayer={isAddingPlayer}
					addPlayerError={addPlayerError}
					onSubmit={async (values, keepOpen) => {
						await onSaveTeams(values);
						clearAttendanceDraft(event.id);
						if (keepOpen) {
							return;
						}

						void onBuilderStepChange(null);
					}}
				/>
			)}
			{!showTeamBuilder && (
				<div>
					<div className="mb-1 flex items-center gap-2">
						<p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
							{EVENT_BUILDER_STEP_LABEL.teams}
						</p>
						<div className="ml-auto flex items-center gap-1">
							{showShareTeams && (
								<IconTooltipButton
									showLabel
									label={
										isSharing
											? EVENT_TEAM_SHARE_LABEL.sharing
											: EVENT_TEAM_SHARE_LABEL.shareTeams
									}
									icon={
										<>
											{isSharing && (
												<LoaderCircle className="size-4 animate-spin" />
											)}
											{!isSharing && <Share2 className="size-4" />}
										</>
									}
									disabled={isSharing}
									onClick={() => {
										void handleShareTeams();
									}}
								/>
							)}
							{canManage && teamsEditable && (
								<IconTooltipButton
									showLabel
									label={EVENT_ACTION.editTeams}
									icon={<Pencil className="size-4" />}
									onClick={() => {
										void onBuilderStepChange(EVENT_BUILDER_STEP.teams);
									}}
								/>
							)}
							{canManage && showAddTeam && (
								<IconTooltipButton
									showLabel
									label={EVENT_ACTION.addTeam}
									icon={<Plus className="size-4" />}
									onClick={() => setIsAddTeamOpen(true)}
								/>
							)}
						</div>
					</div>
					{shareError && <p className={ERROR_CLASS}>{shareError}</p>}
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
											const position = eventTeamPlayerPosition(
												row.is_goalkeeper,
											);

											return (
												<li
													key={row.id}
													className={EVENT_TEAM_PLAYER_SLOT_CLASS}
												>
													<span
														className={`${EVENT_TEAM_POSITION_CHIP_CLASS} shrink-0`}
													>
														{EVENT_TEAM_POSITION_LABEL[position]}
													</span>
													<EventTeamPlayerRow
														player={player}
														ceiling={ceiling}
													/>
												</li>
											);
										})}
									</ul>
									<EventTeamRatingAverage
										ratings={teamRoster.map(({ player }) => player.rating)}
										presentRatings={presentRatings}
									/>
								</li>
							);
						})}
					</ul>
				</div>
			)}
			{!showTeamBuilder && (
				<ChampionshipEventMatchHistory
					matches={event.matches}
					teams={event.teams}
					rosterById={rosterById}
					showMatchDelete={showMatchDelete}
					canOpenMatch={!ended}
					onOpenMatch={(match) => {
						if (isOpenMatch(match)) {
							void onOpenMatch(match);
							return;
						}

						setMatchToReopen(match);
					}}
					onRemoveMatch={setMatchToRemove}
				/>
			)}
			{!showTeamBuilder && (
				<div className="space-y-6">
					{status === EVENT_STATUS.open && currentPlayerId !== null && (
						<div>
							<p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
								{EVENT_RSVP_LABEL.section}
							</p>
							<div className="flex flex-wrap gap-2">
								{EVENT_RSVP_CHOICES.map((statusId) => {
									const selected = myRsvp?.status === statusId;
									const isOut = statusId === EVENT_RSVP_STATUS.out;
									let outClassName: string | undefined;
									if (isOut && selected) {
										outClassName = "bg-danger-soft";
									}
									if (isOut && !selected) {
										outClassName = "text-danger-fg";
									}

									return (
										<Button
											key={statusId}
											variant={eventRsvpButtonVariant(statusId, selected)}
											className={outClassName}
											disabled={savingRsvp}
											onClick={() => {
												void onUpsertRsvp(statusId);
											}}
										>
											{EVENT_RSVP_STATUS_LABEL[statusId]}
										</Button>
									);
								})}
								{selfCheckIn && (
									<Button
										disabled={ensuringAttendance}
										onClick={() => {
											void onEnsureAttendance(currentPlayerId);
										}}
									>
										<UserCheck className="size-4" />
										{EVENT_CHECK_IN_LABEL.action}
									</Button>
								)}
							</div>
							{rsvpError && <p className={ERROR_CLASS}>{rsvpError}</p>}
							{ensureAttendanceError && (
								<p className={ERROR_CLASS}>{ensureAttendanceError}</p>
							)}
						</div>
					)}
					<div>
						<div className="mb-1 flex items-center gap-2">
							<p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
								{EVENT_SECTION_LABEL.attendance}
							</p>
							<div className="ml-auto flex items-center gap-1">
								{canSetMvp && ended && event.attendance.length > 0 && (
									<IconTooltipButton
										showLabel
										label={EVENT_ACTION.setMvp}
										icon={<Award className="size-4" />}
										onClick={() => setIsMvpOpen(true)}
									/>
								)}
								{canManage && showAddAttendance && (
									<IconTooltipButton
										showLabel
										label={EVENT_ACTION.lateJoin}
										icon={<UserPlus className="size-4" />}
										onClick={() => setIsLateJoinOpen(true)}
									/>
								)}
								{canManage && showAddAttendance && (
									<IconTooltipButton
										showLabel
										label={EVENT_ACTION.addAttendance}
										icon={<Plus className="size-4" />}
										onClick={() => setIsAttendanceOpen(true)}
									/>
								)}
								{canManage &&
									showAddAttendance &&
									goingNotPresentIds.length > 0 && (
										<IconTooltipButton
											showLabel
											label={EVENT_ACTION.promoteRsvp}
											icon={<Users className="size-4" />}
											disabled={promotingRsvp}
											onClick={() => {
												void onPromoteRsvpGoing();
											}}
										/>
									)}
								{canManage &&
									showAttendanceOwnerActions &&
									event.attendance.length > 0 && (
										<IconTooltipButton
											showLabel
											label={EVENT_ACTION.markAttendanceStats}
											icon={<ChartColumn className="size-4" />}
											onClick={() => setIsAttendanceStatsOpen(true)}
										/>
									)}
							</div>
						</div>
						{promoteRsvpError && (
							<p className={ERROR_CLASS}>{promoteRsvpError}</p>
						)}
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
											{showAttendanceOwnerActions &&
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
					onAddPlayer={onAddPlayer}
					isAddingPlayer={isAddingPlayer}
					addPlayerError={addPlayerError}
					onSave={async (presentPlayerIds, goalkeeperPlayerIds) => {
						await onSaveAttendance(presentPlayerIds, goalkeeperPlayerIds);
						setIsAttendanceOpen(false);
					}}
				/>
			)}
			{isLateJoinOpen && (
				<LateJoinAttendanceModal
					players={players}
					presentIds={attendanceIds}
					attendanceCounts={attendanceCounts}
					isPending={ensuringAttendance}
					errorMessage={ensureAttendanceError}
					onCancel={() => {
						if (ensuringAttendance) {
							return;
						}

						setIsLateJoinOpen(false);
					}}
					onConfirm={async (playerId) => {
						await onEnsureAttendance(playerId);
						setIsLateJoinOpen(false);
					}}
				/>
			)}
			{isAttendanceStatsOpen && (
				<EditEventAttendanceStatsModal
					attendance={event.attendance}
					teams={event.teams}
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
						usedEventTeamColors(team.color),
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
						.flatMap((team) => usedEventTeamColors(team.color))}
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
			{matchToReopen && (
				<ReopenEventMatchModal
					isPending={openingMatch}
					errorMessage={openMatchError}
					onCancel={() => {
						if (openingMatch) {
							return;
						}

						setMatchToReopen(null);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								await onOpenMatch(matchToReopen);
								setMatchToReopen(null);
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
			{isMvpOpen && (
				<SetEventMvpModal
					players={eventMvpPickCandidates(event.attendance, selectedMvpIds).map(
						(row) => ({
							id: row.playerId,
							name: playerVisibleName(
								resolveRosterPlayer(
									row.playerId,
									attendanceNameByPlayerId.get(row.playerId) ?? "",
									rosterById,
								),
							),
							goals: row.goals,
							assists: row.assists,
							wins: row.wins,
							matches: row.matches,
						}),
					)}
					initialPlayerIds={selectedMvpIds}
					isPending={settingMvp}
					errorMessage={setMvpError}
					onCancel={() => {
						if (settingMvp) {
							return;
						}

						setIsMvpOpen(false);
					}}
					onSave={async (playerIds) => {
						await onSetMvps(playerIds);
						setIsMvpOpen(false);
					}}
				/>
			)}
		</>
	);
}
