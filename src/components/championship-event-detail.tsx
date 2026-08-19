import { useEffect, useRef } from "react";
import { ChampionshipEventDetailActions } from "@/components/championship-event-detail-actions";
import { ChampionshipEventRoundTab } from "@/components/championship-event-round-tab";
import { ChampionshipPodiumTab } from "@/components/championship-podium-tab";
import { Tabs } from "@/components/tabs";
import {
	canEditEventTeams,
	EVENT_BUILDER_STEP,
	type EventAttendanceStatsDraft,
	type EventRsvpStatus,
	type EventTeamDraft,
	eventStatus,
	eventTeamsAreReady,
	resolveBuilderInitialPresentIds,
} from "@/const/championship-event";
import { playersFromEventAttendance } from "@/const/championship-event-roster";
import {
	EVENT_TAB,
	EVENT_TABS,
	eventDetailSelectedTab,
	showEventDetailTabs,
} from "@/const/championship-event-tab";
import type { EventTeamColor } from "@/const/event-team-color";
import { useEventBuilderStep } from "@/hooks/use-event-builder-step";
import { useEventTab } from "@/hooks/use-event-tab";
import type { ChampionshipPlayer } from "@/types/championship";
import type {
	ChampionshipEvent,
	ChampionshipEventMatch,
} from "@/types/championship-event";

type ChampionshipEventDetailProps = {
	event: ChampionshipEvent;
	championshipName: string;
	players: ChampionshipPlayer[];
	attendanceCounts: ReadonlyMap<number, number>;
	seedEvents: readonly ChampionshipEvent[];
	currentPlayerId: number | null;
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
	ending: boolean;
	endError: string | null;
	settingMvp: boolean;
	setMvpError: string | null;
	deleting: boolean;
	deleteError: string | null;
	onAddPlayer?: (values: {
		displayNames: string[];
		rating: number;
		isGoalkeeper: boolean;
	}) => Promise<ChampionshipPlayer[]>;
	isAddingPlayer?: boolean;
	addPlayerError?: string | null;
};

export function ChampionshipEventDetail({
	event,
	championshipName,
	players,
	attendanceCounts,
	seedEvents,
	currentPlayerId,
	canManage,
	canOverrideEnded,
	canSetMvp,
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
	onEnd,
	onSetMvps,
	onDelete,
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
	ending,
	endError,
	settingMvp,
	setMvpError,
	deleting,
	deleteError,
	onAddPlayer,
	isAddingPlayer = false,
	addPlayerError = null,
}: ChampionshipEventDetailProps) {
	const status = eventStatus(event.ended_at);
	const rosterById = new Map(players.map((player) => [player.id, player]));
	const podiumPlayers = playersFromEventAttendance(
		event.attendance,
		rosterById,
	);
	const teamsEditable = canManage && canEditEventTeams(event);
	const [step, setStep] = useEventBuilderStep();
	const [tab, setTab] = useEventTab();
	const mustBuild = teamsEditable && !eventTeamsAreReady(event.teams);
	const showTeamBuilder = teamsEditable && (step !== null || mustBuild);
	const showEventTabs = showEventDetailTabs({
		showTeamBuilder,
		attendanceCount: event.attendance.length,
	});
	const selectedTab = eventDetailSelectedTab(showEventTabs, tab);
	const builderStep = step ?? EVENT_BUILDER_STEP.attendance;
	const draftPresentIdsRef = useRef(
		resolveBuilderInitialPresentIds(
			event.attendance.map((row) => row.player_id),
			event.id,
		),
	);

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
			<ChampionshipEventDetailActions
				championshipName={championshipName}
				event={event}
				players={players}
				canManage={canManage}
				canSetMvp={canSetMvp}
				showTeamBuilder={showTeamBuilder}
				status={status}
				draftPresentIdsRef={draftPresentIdsRef}
				onEnd={onEnd}
				onDelete={onDelete}
				ending={ending}
				endError={endError}
				deleting={deleting}
				deleteError={deleteError}
			/>
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
			{selectedTab === EVENT_TAB.event && (
				<ChampionshipEventRoundTab
					event={event}
					championshipName={championshipName}
					players={players}
					attendanceCounts={attendanceCounts}
					seedEvents={seedEvents}
					currentPlayerId={currentPlayerId}
					canManage={canManage}
					canOverrideEnded={canOverrideEnded}
					canSetMvp={canSetMvp}
					rosterById={rosterById}
					showTeamBuilder={showTeamBuilder}
					builderStep={builderStep}
					onBuilderStepChange={(next) => {
						void setStep(next);
					}}
					draftPresentIdsRef={draftPresentIdsRef}
					status={status}
					onSaveTeams={onSaveTeams}
					onSaveAttendance={onSaveAttendance}
					onEnsureAttendance={onEnsureAttendance}
					onUpsertRsvp={onUpsertRsvp}
					onPromoteRsvpGoing={onPromoteRsvpGoing}
					onSaveAttendanceStats={onSaveAttendanceStats}
					onAddTeam={onAddTeam}
					onUpdateTeam={onUpdateTeam}
					onDeleteTeam={onDeleteTeam}
					onDeleteMatch={onDeleteMatch}
					onOpenMatch={onOpenMatch}
					onSetMvps={onSetMvps}
					savingTeams={savingTeams}
					saveTeamsError={saveTeamsError}
					savingAttendance={savingAttendance}
					saveAttendanceError={saveAttendanceError}
					ensuringAttendance={ensuringAttendance}
					ensureAttendanceError={ensureAttendanceError}
					savingRsvp={savingRsvp}
					rsvpError={rsvpError}
					promotingRsvp={promotingRsvp}
					promoteRsvpError={promoteRsvpError}
					savingAttendanceStats={savingAttendanceStats}
					saveAttendanceStatsError={saveAttendanceStatsError}
					addingTeam={addingTeam}
					addTeamError={addTeamError}
					updatingTeam={updatingTeam}
					updateTeamError={updateTeamError}
					deletingTeam={deletingTeam}
					deleteTeamError={deleteTeamError}
					deletingMatch={deletingMatch}
					deleteMatchError={deleteMatchError}
					openingMatch={openingMatch}
					openMatchError={openMatchError}
					settingMvp={settingMvp}
					setMvpError={setMvpError}
					onAddPlayer={onAddPlayer}
					isAddingPlayer={isAddingPlayer}
					addPlayerError={addPlayerError}
				/>
			)}
			{showEventTabs && selectedTab === EVENT_TAB.podium && (
				<ChampionshipPodiumTab
					players={podiumPlayers}
					championshipName={championshipName}
					eventStartsAt={event.starts_at}
				/>
			)}
		</article>
	);
}
