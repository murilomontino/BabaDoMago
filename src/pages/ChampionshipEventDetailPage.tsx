import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { ChampionshipEventDetail } from "@/components/championship-event-detail";
import { TeamCardSkeleton } from "@/components/molecules/team-card-skeleton";
import { PageHeader } from "@/components/page-header";
import {
	countPlayerAttendance,
	EVENT_BUILDER_STEP_LABEL,
	EVENT_STATUS_LABEL,
	eventStatus,
	formatEventStartsAt,
} from "@/const/championship-event";
import { applyPlayOps } from "@/const/championship-event-match-ops";
import {
	CHAMPIONSHIP_ROLE,
	canInvite,
	canManageEvent,
	canOverrideEndedEvent,
	canSetEventMvp,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { CHAMPIONSHIP_TAB } from "@/const/championship-tab";
import { ROUTES } from "@/const/routes";
import { SKELETON_LABEL, SKELETON_TEAM_CARDS } from "@/const/skeleton";
import { ERROR_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import {
	useAddChampionshipEventTeam,
	useChampionshipEvent,
	useChampionshipEventRealtime,
	useChampionshipEvents,
	useDeleteChampionshipEvent,
	useDeleteChampionshipEventMatch,
	useDeleteChampionshipEventTeam,
	useEndChampionshipEvent,
	useEnsureChampionshipEventAttendancePlayer,
	usePromoteChampionshipEventRsvpGoing,
	useReopenChampionshipEventMatch,
	useSaveChampionshipEventAttendance,
	useSaveChampionshipEventAttendanceStats,
	useSaveChampionshipEventTeams,
	useSetChampionshipEventMvps,
	useUpdateChampionshipEventTeam,
	useUpsertChampionshipEventRsvp,
} from "@/hooks/championships/use-championship-events";
import {
	useAddManualPlayer,
	useChampionship,
} from "@/hooks/championships/use-championships";
import { mutationErrorMessage } from "@/lib/error-message";
import { handlerWhenAllowed } from "@/lib/handler-when-allowed";
import { useAppSelector } from "@/store/hooks";
import { selectMatchOps } from "@/store/match-ops/selectors";

export function ChampionshipEventDetailPage() {
	const { championshipId: championshipIdParam, eventId: eventIdParam } =
		useParams({
			from: "/_authenticated/championships/$championshipId/events/$eventId/",
		});
	const championshipId = Number(championshipIdParam);
	const eventId = Number(eventIdParam);
	const navigate = useNavigate();
	const { user } = useAuth();
	const championshipQuery = useChampionship(championshipId);
	const eventQuery = useChampionshipEvent(championshipId, eventId);
	const eventsQuery = useChampionshipEvents(championshipId);
	const saveTeams = useSaveChampionshipEventTeams(championshipId);
	const saveAttendance = useSaveChampionshipEventAttendance(championshipId);
	const ensureAttendance =
		useEnsureChampionshipEventAttendancePlayer(championshipId);
	const upsertRsvp = useUpsertChampionshipEventRsvp(championshipId);
	const promoteRsvp = usePromoteChampionshipEventRsvpGoing(championshipId);
	const saveAttendanceStats =
		useSaveChampionshipEventAttendanceStats(championshipId);
	const addTeam = useAddChampionshipEventTeam(championshipId);
	const updateTeam = useUpdateChampionshipEventTeam(championshipId);
	const deleteTeam = useDeleteChampionshipEventTeam(championshipId);
	const deleteMatch = useDeleteChampionshipEventMatch(championshipId);
	const reopenMatch = useReopenChampionshipEventMatch(championshipId);
	const endEvent = useEndChampionshipEvent(championshipId);
	const setMvps = useSetChampionshipEventMvps(championshipId);
	const deleteEvent = useDeleteChampionshipEvent(championshipId);
	const addPlayer = useAddManualPlayer(championshipId);
	useChampionshipEventRealtime(championshipId, eventId);
	const matchOps = useAppSelector((state) => selectMatchOps(state, eventId));
	const attendanceCounts = useMemo(
		() => countPlayerAttendance(eventsQuery.data ?? []),
		[eventsQuery.data],
	);

	const championship = championshipQuery.data;
	const currentPlayer = championship?.players.find(
		(player) => !player.deleted_at && player.user_id === user?.id,
	);
	const actorRole = resolveChampionshipRole(
		championship?.created_by ?? "",
		user?.id ?? null,
		currentPlayer?.role ?? CHAMPIONSHIP_ROLE.member,
	);
	const canManage = canManageEvent(actorRole);
	const canOverrideEnded = canOverrideEndedEvent(actorRole);
	const canSetMvp = canSetEventMvp(actorRole);
	const activePlayers = (championship?.players ?? []).filter(
		(player) => !player.deleted_at,
	);

	if (championshipQuery.isPending || eventQuery.isPending) {
		return (
			<ChampionshipEventDetailPageSkeleton championshipId={championshipId} />
		);
	}

	if (championshipQuery.isError) {
		return (
			<p className={ERROR_CLASS}>
				Erro ao carregar campeonato: {championshipQuery.error.message}
			</p>
		);
	}

	if (eventQuery.isError) {
		return (
			<p className={ERROR_CLASS}>
				Erro ao carregar rodada: {eventQuery.error.message}
			</p>
		);
	}

	const event = applyPlayOps(eventQuery.data, matchOps);
	const when = formatEventStartsAt(event.starts_at);
	const status = eventStatus(event.ended_at);

	return (
		<main>
			<PageHeader
				title={`${when.date} · ${when.time}`}
				description={EVENT_STATUS_LABEL[status]}
				action={
					<Link
						to={ROUTES.championship}
						params={{ championshipId: String(championshipId) }}
						className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-pitch-fg"
					>
						<ArrowLeft className="size-4" />
						Voltar
					</Link>
				}
			/>
			<ChampionshipEventDetail
				event={event}
				championshipName={championship?.name ?? ""}
				players={activePlayers}
				attendanceCounts={attendanceCounts}
				seedEvents={eventsQuery.data ?? []}
				currentPlayerId={currentPlayer?.id ?? null}
				canManage={canManage}
				canOverrideEnded={canOverrideEnded}
				canSetMvp={canSetMvp}
				savingTeams={saveTeams.isPending}
				saveTeamsError={mutationErrorMessage(saveTeams)}
				savingAttendance={saveAttendance.isPending}
				saveAttendanceError={mutationErrorMessage(saveAttendance)}
				ensuringAttendance={ensureAttendance.isPending}
				ensureAttendanceError={mutationErrorMessage(ensureAttendance)}
				savingRsvp={upsertRsvp.isPending}
				rsvpError={mutationErrorMessage(upsertRsvp)}
				promotingRsvp={promoteRsvp.isPending}
				promoteRsvpError={mutationErrorMessage(promoteRsvp)}
				savingAttendanceStats={saveAttendanceStats.isPending}
				saveAttendanceStatsError={mutationErrorMessage(saveAttendanceStats)}
				addingTeam={addTeam.isPending}
				addTeamError={mutationErrorMessage(addTeam)}
				updatingTeam={updateTeam.isPending}
				updateTeamError={mutationErrorMessage(updateTeam)}
				deletingTeam={deleteTeam.isPending}
				deleteTeamError={mutationErrorMessage(deleteTeam)}
				deletingMatch={deleteMatch.isPending}
				deleteMatchError={mutationErrorMessage(deleteMatch)}
				openingMatch={reopenMatch.isPending}
				openMatchError={mutationErrorMessage(reopenMatch)}
				ending={endEvent.isPending}
				endError={mutationErrorMessage(endEvent)}
				settingMvp={setMvps.isPending}
				setMvpError={mutationErrorMessage(setMvps)}
				deleting={deleteEvent.isPending}
				deleteError={mutationErrorMessage(deleteEvent)}
				isAddingPlayer={addPlayer.isPending}
				addPlayerError={mutationErrorMessage(addPlayer)}
				onAddPlayer={handlerWhenAllowed(canInvite(actorRole), async (values) =>
					addPlayer.mutateAsync(values),
				)}
				onSaveTeams={async ({
					presentPlayerIds,
					teams,
					goalkeeperPlayerIds,
				}) => {
					await saveTeams.mutateAsync({
						eventId: event.id,
						presentPlayerIds,
						teams,
						goalkeeperPlayerIds,
					});
				}}
				onSaveAttendance={async (presentPlayerIds, goalkeeperPlayerIds) => {
					await saveAttendance.mutateAsync({
						eventId: event.id,
						presentPlayerIds,
						goalkeeperPlayerIds,
					});
				}}
				onEnsureAttendance={async (playerId) => {
					await ensureAttendance.mutateAsync({
						eventId: event.id,
						playerId,
					});
				}}
				onUpsertRsvp={async (status) => {
					await upsertRsvp.mutateAsync({
						eventId: event.id,
						status,
					});
				}}
				onPromoteRsvpGoing={async () => {
					await promoteRsvp.mutateAsync(event.id);
				}}
				onSaveAttendanceStats={async (stats) => {
					await saveAttendanceStats.mutateAsync({
						eventId: event.id,
						stats,
					});
				}}
				onAddTeam={async ({ color, playerIds, goalkeeperId }) => {
					await addTeam.mutateAsync({
						eventId: event.id,
						color,
						playerIds,
						goalkeeperId,
					});
				}}
				onUpdateTeam={async ({ teamId, color, playerIds, goalkeeperId }) => {
					await updateTeam.mutateAsync({
						teamId,
						color,
						playerIds,
						goalkeeperId,
					});
				}}
				onDeleteTeam={async (teamId) => {
					await deleteTeam.mutateAsync(teamId);
				}}
				onDeleteMatch={async (matchId) => {
					await deleteMatch.mutateAsync(matchId);
				}}
				onOpenMatch={async (match) => {
					if (match.ended_at !== null) {
						await reopenMatch.mutateAsync(match.id);
					}

					await navigate({
						to: ROUTES.championshipEventPlay,
						params: {
							championshipId: String(championshipId),
							eventId: String(eventId),
						},
					});
				}}
				onEnd={async (presentPlayerIds, mvpPlayerIds) => {
					await endEvent.mutateAsync({
						eventId: event.id,
						presentPlayerIds,
						mvpPlayerIds,
					});
				}}
				onSetMvps={async (playerIds) => {
					await setMvps.mutateAsync({
						eventId: event.id,
						playerIds,
					});
				}}
				onDelete={async () => {
					await deleteEvent.mutateAsync(event.id);
					await navigate({
						to: ROUTES.championship,
						params: { championshipId: String(championshipId) },
						search: { tab: CHAMPIONSHIP_TAB.events },
					});
				}}
			/>
		</main>
	);
}

function ChampionshipEventDetailPageSkeleton({
	championshipId,
}: {
	championshipId: number;
}) {
	return (
		<SkeletonRegion label={SKELETON_LABEL.event}>
			<main>
				<div className="mb-6 flex items-start justify-between gap-4">
					<div>
						<Skeleton className="h-8 w-48" />
						<Skeleton className="mt-1 h-4 w-24" />
					</div>
					<Link
						to={ROUTES.championship}
						params={{ championshipId: String(championshipId) }}
						className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-pitch-fg"
					>
						<ArrowLeft className="size-4" />
						Voltar
					</Link>
				</div>
				<article className="space-y-6">
					<div>
						<p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
							{EVENT_BUILDER_STEP_LABEL.teams}
						</p>
						<ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
							{SKELETON_TEAM_CARDS.map((card) => (
								<li key={card}>
									<TeamCardSkeleton />
								</li>
							))}
						</ul>
					</div>
				</article>
			</main>
		</SkeletonRegion>
	);
}
