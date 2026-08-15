import { Link } from "@tanstack/react-router";
import {
	Award,
	ChartColumn,
	Copy,
	LoaderCircle,
	Pencil,
	Play,
	Plus,
	Share2,
	Square,
	Trash2,
	UserPlus,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AddEventTeamModal } from "@/components/add-event-team-modal";
import { Button } from "@/components/button";
import { ChampionshipEventBuilder } from "@/components/championship-event-builder";
import { ChampionshipEventMatchHistory } from "@/components/championship-event-match-history";
import { ChampionshipPodiumTab } from "@/components/championship-podium-tab";
import { DeleteEventAttendanceModal } from "@/components/delete-event-attendance-modal";
import { DeleteEventMatchModal } from "@/components/delete-event-match-modal";
import { DeleteEventModal } from "@/components/delete-event-modal";
import { DeleteEventTeamModal } from "@/components/delete-event-team-modal";
import { EditEventAttendanceModal } from "@/components/edit-event-attendance-modal";
import { EditEventAttendanceStatsModal } from "@/components/edit-event-attendance-stats-modal";
import { EndEventModal } from "@/components/end-event-modal";
import {
	EVENT_TEAM_PLAYER_SLOT_CLASS,
	EVENT_TEAM_POSITION_CHIP_CLASS,
	EventTeamColorDot,
	EventTeamPlayerRow,
	EventTeamRatingAverage,
} from "@/components/event-team-player";
import { IconTooltipButton } from "@/components/molecules/icon-tooltip-button";
import { PlayerRating } from "@/components/player-rating";
import { ReopenEventMatchModal } from "@/components/reopen-event-match-modal";
import { SetEventMvpModal } from "@/components/set-event-mvp-modal";
import { Tabs } from "@/components/tabs";
import {
	attendanceGoalkeeperIds,
	builderTeamsFromEvent,
	builderTeamsHavePlayers,
	CHAMPIONSHIP_EVENT,
	canEditEventTeams,
	canRemoveEventAttendance,
	canStartEventMatch,
	draftAttendanceForEnd,
	EVENT_ACTION,
	EVENT_ATTENDANCE_COLUMN_LABEL,
	EVENT_ATTENDANCE_STAT_ABBR,
	EVENT_BUILDER_STEP,
	EVENT_BUILDER_STEP_LABEL,
	EVENT_SECTION_LABEL,
	EVENT_STATUS,
	EVENT_TEAM_POSITION_LABEL,
	type EventAttendanceStatsDraft,
	type EventTeamDraft,
	eventStatus,
	eventTeamPlayerIds,
	eventTeamPlayerPosition,
	keepGoalkeepersPresent,
	teamHasMatches,
} from "@/const/championship-event";
import {
	EVENT_MATCH_LABEL,
	isOpenMatch,
	matchPlayUrl,
	openEventMatch,
} from "@/const/championship-event-match";
import {
	EVENT_TAB,
	EVENT_TABS,
	showEventDetailTabs,
} from "@/const/championship-event-tab";
import { CHAMPIONSHIP_ROLE } from "@/const/championship-role";
import {
	EVENT_MVP_LABEL,
	eventMvpCandidates,
	eventMvpPickCandidates,
	toggleEventMvpPlayerId,
} from "@/const/event-mvp";
import { eventRatingPreview } from "@/const/event-rating-adjustment";
import {
	type EventTeamColor,
	eventTeamColorStyle,
	eventTeamName,
} from "@/const/event-team-color";
import {
	EVENT_TEAM_SHARE_LABEL,
	eventTeamsShareCards,
} from "@/const/event-team-share";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import { ROUTES } from "@/const/routes";
import {
	BUTTON_VARIANT,
	buttonClassName,
	CHIP_CLASS,
	ERROR_CLASS,
} from "@/const/ui";
import { useEventBuilderStep } from "@/hooks/use-event-builder-step";
import { useEventTab } from "@/hooks/use-event-tab";
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

type ChampionshipEventDetailProps = {
	event: ChampionshipEvent;
	championshipName: string;
	players: ChampionshipPlayer[];
	attendanceCounts: ReadonlyMap<number, number>;
	canManage: boolean;
	canOverrideEnded: boolean;
	canSetMvp: boolean;
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
	onOpenMatch: (match: ChampionshipEventMatch) => Promise<void>;
	onEnd: (
		presentPlayerIds: number[] | null,
		mvpPlayerIds: number[] | null,
	) => Promise<void>;
	onSetMvps: (playerIds: number[]) => Promise<void>;
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
	openingMatch: boolean;
	openMatchError: string | null;
	ending: boolean;
	endError: string | null;
	settingMvp: boolean;
	setMvpError: string | null;
	deleting: boolean;
	deleteError: string | null;
};

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
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
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

function playersFromEventAttendance(
	attendance: readonly ChampionshipEventAttendance[],
	byId: Map<number, ChampionshipPlayer>,
): ChampionshipPlayer[] {
	return attendance.map((row) => ({
		...resolveRosterPlayer(row.player_id, row.display_name, byId),
		goals: row.goals,
		assists: row.assists,
		assisted_goals: row.assisted_goals,
		own_goals: row.own_goals,
		wins: row.wins,
		losses: row.losses,
		draws: row.draws,
		matches: row.matches,
		mvps: row.is_mvp ? 1 : 0,
		rating: row.rating,
	}));
}

export function ChampionshipEventDetail({
	event,
	championshipName,
	players,
	attendanceCounts,
	canManage,
	canOverrideEnded,
	canSetMvp,
	onSaveTeams,
	onSaveAttendance,
	onSaveAttendanceStats,
	onAddTeam,
	onUpdateTeam,
	onDeleteTeam,
	onDeleteMatch,
	onOpenMatch,
	onEnd,
	onSetMvps,
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
	openingMatch,
	openMatchError,
	ending,
	endError,
	settingMvp,
	setMvpError,
	deleting,
	deleteError,
}: ChampionshipEventDetailProps) {
	const status = eventStatus(event.ended_at);
	const ended = status === EVENT_STATUS.ended;
	const rosterById = new Map(players.map((player) => [player.id, player]));
	const presentPlayers = resolveEventPlayers(event.attendance, rosterById);
	const podiumPlayers = playersFromEventAttendance(
		event.attendance,
		rosterById,
	);
	const volunteerGoalkeeperIds = attendanceGoalkeeperIds(event.attendance);
	const teamPlayerIds = eventTeamPlayerIds(event.teams);
	const ceiling = championshipRatingCeiling([
		...players.map((player) => player.rating),
		...event.attendance.map((row) => row.rating),
	]);
	const teamsEditable = canManage && canEditEventTeams(event);
	const [step, setStep] = useEventBuilderStep();
	const [tab, setTab] = useEventTab();
	const mustBuild =
		teamsEditable && event.teams.length < CHAMPIONSHIP_EVENT.minTeams;
	const showTeamBuilder = teamsEditable && (step !== null || mustBuild);
	const showEventTabs = showEventDetailTabs({
		showTeamBuilder,
		attendanceCount: event.attendance.length,
	});
	const selectedTab =
		showEventTabs && tab === EVENT_TAB.podium
			? EVENT_TAB.podium
			: EVENT_TAB.event;
	const builderStep = step ?? EVENT_BUILDER_STEP.attendance;
	const detailTeams = builderTeamsFromEvent(
		event.teams,
		event.players_per_team,
		event.attendance.length,
	);
	const showShareTeams =
		!showTeamBuilder && builderTeamsHavePlayers(detailTeams);
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
	const [isSharing, setIsSharing] = useState(false);
	const [shareError, setShareError] = useState<string | null>(null);
	const showMatchDelete = canOverrideEnded && !showTeamBuilder;
	const [isEndOpen, setIsEndOpen] = useState(false);
	const [endMvpPlayerIds, setEndMvpPlayerIds] = useState<number[] | null>(null);
	const [isMvpOpen, setIsMvpOpen] = useState(false);
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
	const [matchToReopen, setMatchToReopen] =
		useState<ChampionshipEventMatch | null>(null);
	const draftPresentIdsRef = useRef(
		event.attendance.map((row) => row.player_id),
	);

	const presentPlayerIdsForEnd = draftAttendanceForEnd(
		showTeamBuilder,
		draftPresentIdsRef.current,
	);
	const mvpCandidateIds = eventMvpCandidates(event.attendance)
		.map((row) => row.playerId)
		.filter(
			(playerId) =>
				presentPlayerIdsForEnd === null ||
				presentPlayerIdsForEnd.includes(playerId),
		);
	const selectedMvpIds = event.attendance.flatMap((row) =>
		row.is_mvp ? [row.player_id] : [],
	);
	const attendanceNameByPlayerId = new Map(
		event.attendance.map((row) => [row.player_id, row.display_name]),
	);
	const mvpPlayerIds = endMvpPlayerIds ?? mvpCandidateIds;
	const ratingPreview = eventRatingPreview({
		attendance: event.attendance,
		players,
		presentPlayerIds: presentPlayerIdsForEnd,
		mvpPlayerIds,
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

	async function handleCopyMatchLink() {
		const url = matchPlayUrl(
			window.location.origin,
			event.championship_id,
			event.id,
			ROUTES.championshipEventPlay,
		);
		await navigator.clipboard.writeText(url);
		setCopied(true);
	}

	function openEndEvent() {
		setEndMvpPlayerIds(null);
		setIsEndOpen(true);
	}

	const canEndEvent = canManage && status === EVENT_STATUS.open;
	const copyMatchLinkLabel = copied
		? EVENT_MATCH_LABEL.copied
		: EVENT_ACTION.copyMatchLink;

	return (
		<article className="space-y-6">
			{(showStartMatch || canManage) && (
				<div className="flex flex-col gap-2">
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-center gap-1">
							{showStartMatch && (
								<IconTooltipButton
									showLabel
									label={copyMatchLinkLabel}
									icon={<Copy className="size-4" />}
									onClick={() => {
										void handleCopyMatchLink();
									}}
								/>
							)}
							{canEndEvent && (
								<span className="hidden md:inline-flex">
									<IconTooltipButton
										showLabel
										label={EVENT_ACTION.endEvent}
										icon={<Square className="size-4 fill-current" />}
										variant={BUTTON_VARIANT.ghost}
										onClick={openEndEvent}
									/>
								</span>
							)}
							{canManage && (
								<IconTooltipButton
									showLabel
									label={EVENT_ACTION.deleteEvent}
									icon={<Trash2 className="size-4" />}
									variant={BUTTON_VARIANT.danger}
									onClick={() => setIsDeleteOpen(true)}
								/>
							)}
						</div>
						{showStartMatch && (
							<Link
								to={ROUTES.championshipEventPlay}
								params={{
									championshipId: String(event.championship_id),
									eventId: String(event.id),
								}}
								className={buttonClassName(
									BUTTON_VARIANT.primary,
									"w-full md:ml-auto md:w-auto",
								)}
							>
								<Play className="size-4" />
								{openMatch
									? EVENT_ACTION.continueMatch
									: EVENT_ACTION.startMatch}
							</Link>
						)}
					</div>
					{canEndEvent && (
						<Button
							variant={BUTTON_VARIANT.secondary}
							className="w-full md:hidden"
							onClick={openEndEvent}
						>
							<Square className="fill-current" />
							{EVENT_ACTION.endEvent}
						</Button>
					)}
				</div>
			)}
			{showEventTabs && (
				<Tabs
					value={selectedTab}
					items={EVENT_TABS}
					onChange={(id) => {
						if (id === EVENT_TAB.event) {
							void setTab(null);
							return;
						}

						void setTab(id);
					}}
				/>
			)}
			{selectedTab === EVENT_TAB.event && showTeamBuilder && (
				<ChampionshipEventBuilder
					playersPerTeam={event.players_per_team}
					players={players}
					attendanceCounts={attendanceCounts}
					step={builderStep}
					startsAt={event.starts_at}
					championshipName={championshipName}
					initialPresentIds={event.attendance.map((row) => row.player_id)}
					initialGoalkeeperIds={volunteerGoalkeeperIds}
					initialTeams={detailTeams}
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
			{selectedTab === EVENT_TAB.event && !showTeamBuilder && (
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
										void setStep(EVENT_BUILDER_STEP.teams);
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
									/>
								</li>
							);
						})}
					</ul>
				</div>
			)}
			{selectedTab === EVENT_TAB.event && !showTeamBuilder && (
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
			{selectedTab === EVENT_TAB.event && !showTeamBuilder && (
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
							{canManage && showAttendanceActions && (
								<IconTooltipButton
									showLabel
									label={EVENT_ACTION.addAttendance}
									icon={<UserPlus className="size-4" />}
									onClick={() => setIsAttendanceOpen(true)}
								/>
							)}
							{canManage &&
								showAttendanceActions &&
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
			{showEventTabs && selectedTab === EVENT_TAB.podium && (
				<ChampionshipPodiumTab
					players={podiumPlayers}
					championshipName={championshipName}
					eventStartsAt={event.starts_at}
				/>
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
			{isEndOpen && (
				<EndEventModal
					rows={ratingPreview}
					ceiling={previewCeiling}
					canSetMvp={canSetMvp}
					mvpCandidateIds={mvpCandidateIds}
					isPending={ending}
					errorMessage={endError}
					onToggleMvp={(playerId) => {
						setEndMvpPlayerIds((current) =>
							toggleEventMvpPlayerId(current ?? mvpCandidateIds, playerId),
						);
					}}
					onCancel={() => {
						if (ending) {
							return;
						}

						setEndMvpPlayerIds(null);
						setIsEndOpen(false);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								await onEnd(
									presentPlayerIdsForEnd,
									canSetMvp ? mvpPlayerIds : null,
								);
								setEndMvpPlayerIds(null);
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
