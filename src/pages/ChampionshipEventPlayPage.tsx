import { useNavigate, useParams } from "@tanstack/react-router";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { Button } from "@/components/button";
import { ChampionshipEventPlay } from "@/components/championship-event-play";
import { MATCH_GOAL_TIMELINE_GRID_CLASS } from "@/components/molecules/match-goal-timeline";
import { TeamCardSkeleton } from "@/components/molecules/team-card-skeleton";
import {
	canStartEventMatch,
	EVENT_ACTION,
	isMatchAlreadyOpenError,
} from "@/const/championship-event";
import {
	openEventMatch,
	shouldStartEventMatch,
} from "@/const/championship-event-match";
import { ROUTES } from "@/const/routes";
import { SKELETON_LABEL } from "@/const/skeleton";
import { BUTTON_VARIANT, ERROR_CLASS } from "@/const/ui";
import {
	useAddChampionshipEventGoal,
	useChampionshipEvent,
	useChampionshipEventRealtime,
	useEndChampionshipEventMatch,
	usePauseChampionshipEventMatch,
	useResumeChampionshipEventMatch,
	useSetChampionshipEventMatchGoalkeeper,
	useSetChampionshipEventMatchPlayer,
	useStartChampionshipEventClock,
	useStartChampionshipEventMatch,
	useUndoChampionshipEventGoal,
	useUpdateChampionshipEventTeam,
} from "@/hooks/championships/use-championship-events";
import { useChampionship } from "@/hooks/championships/use-championships";

const PLAY_SHELL_CLASS = "flex h-dvh flex-col overflow-hidden p-2";

export function ChampionshipEventPlayPage() {
	const { championshipId: championshipIdParam, eventId: eventIdParam } =
		useParams({
			from: "/_authenticated/championships/$championshipId/events/$eventId/play",
		});
	const championshipId = Number(championshipIdParam);
	const eventId = Number(eventIdParam);
	const navigate = useNavigate();
	const championshipQuery = useChampionship(championshipId);
	const eventQuery = useChampionshipEvent(championshipId, eventId);
	const startMatch = useStartChampionshipEventMatch(championshipId);
	const updateTeam = useUpdateChampionshipEventTeam(championshipId);
	const setPlayer = useSetChampionshipEventMatchPlayer(championshipId);
	const setGoalkeeper = useSetChampionshipEventMatchGoalkeeper(championshipId);
	const addGoal = useAddChampionshipEventGoal(championshipId);
	const undoGoal = useUndoChampionshipEventGoal(championshipId);
	const startClock = useStartChampionshipEventClock(championshipId);
	const pauseMatch = usePauseChampionshipEventMatch(championshipId);
	const resumeMatch = useResumeChampionshipEventMatch(championshipId);
	const endMatch = useEndChampionshipEventMatch(championshipId);
	useChampionshipEventRealtime(championshipId, eventId);

	if (championshipQuery.isPending || eventQuery.isPending) {
		return <ChampionshipEventPlayPageSkeleton />;
	}

	if (championshipQuery.isError) {
		return (
			<main className={PLAY_SHELL_CLASS}>
				<p className={ERROR_CLASS}>
					Erro ao carregar campeonato: {championshipQuery.error.message}
				</p>
			</main>
		);
	}

	if (eventQuery.isError) {
		return (
			<main className={PLAY_SHELL_CLASS}>
				<p className={ERROR_CLASS}>
					Erro ao carregar rodada: {eventQuery.error.message}
				</p>
			</main>
		);
	}

	const event = eventQuery.data;
	const openMatch = openEventMatch(event.matches);
	const canStart = canStartEventMatch({
		ended: event.ended_at !== null,
		teamCount: event.teams.length,
	});
	const activePlayers = (championshipQuery.data?.players ?? []).filter(
		(player) => !player.deleted_at,
	);

	async function goToEvent() {
		await navigate({
			to: ROUTES.championshipEvent,
			params: {
				championshipId: String(championshipId),
				eventId: String(eventId),
			},
		});
	}

	return (
		<main className={PLAY_SHELL_CLASS}>
			{!canStart && !openMatch && (
				<p className="text-sm text-fg-muted">
					{EVENT_ACTION.startMatch} indisponível.
				</p>
			)}
			{(canStart || openMatch) && (
				<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
					<ChampionshipEventPlay
						event={event}
						match={openMatch}
						players={activePlayers}
						starting={startMatch.isPending}
						startError={
							startMatch.isError &&
							!isMatchAlreadyOpenError(startMatch.error.message)
								? startMatch.error.message
								: null
						}
						savingPlayer={setPlayer.isPending || setGoalkeeper.isPending}
						playerError={
							(setPlayer.isError && setPlayer.error.message) ||
							(setGoalkeeper.isError && setGoalkeeper.error.message) ||
							null
						}
						savingGoal={addGoal.isPending}
						goalError={addGoal.isError ? addGoal.error.message : null}
						undoing={undoGoal.isPending}
						undoError={undoGoal.isError ? undoGoal.error.message : null}
						ending={endMatch.isPending}
						endError={endMatch.isError ? endMatch.error.message : null}
						clockError={
							(startClock.isError && startClock.error.message) ||
							(pauseMatch.isError && pauseMatch.error.message) ||
							(resumeMatch.isError && resumeMatch.error.message) ||
							null
						}
						pausing={
							startClock.isPending ||
							pauseMatch.isPending ||
							resumeMatch.isPending
						}
						onStart={async (teamAId, teamBId) => {
							const { data } = await eventQuery.refetch();
							const matches = data?.matches ?? event.matches;
							if (!shouldStartEventMatch(matches)) {
								return;
							}

							try {
								await startMatch.mutateAsync({
									eventId: event.id,
									teamAId,
									teamBId,
								});
							} catch (error) {
								if (
									!(error instanceof Error) ||
									!isMatchAlreadyOpenError(error.message)
								) {
									throw error;
								}

								startMatch.reset();
								await eventQuery.refetch();
							}
						}}
						savingColor={updateTeam.isPending}
						colorError={
							(updateTeam.isError && updateTeam.error.message) || null
						}
						onChangeTeamColor={async (teamId, color) => {
							const team = event.teams.find((item) => item.id === teamId);
							if (!team) {
								return;
							}

							await updateTeam.mutateAsync({
								teamId,
								color,
								playerIds: team.players.map((player) => player.player_id),
								goalkeeperId:
									team.players.find((player) => player.is_goalkeeper)
										?.player_id ?? 0,
							});
						}}
						onSetPlayer={async (teamId, slot, playerId, includeStats) => {
							if (!openMatch) {
								return;
							}

							await setPlayer.mutateAsync({
								matchId: openMatch.id,
								teamId,
								slot,
								playerId,
								includeStats,
							});
						}}
						onSetGoalkeeper={async (teamId, playerId) => {
							if (!openMatch) {
								return;
							}

							await setGoalkeeper.mutateAsync({
								matchId: openMatch.id,
								teamId,
								playerId,
							});
						}}
						onAddGoal={async (values) => {
							if (!openMatch) {
								return;
							}

							await addGoal.mutateAsync({
								matchId: openMatch.id,
								...values,
							});
						}}
						onUndoGoal={async (goalId) => {
							if (!openMatch) {
								return;
							}

							await undoGoal.mutateAsync({
								matchId: openMatch.id,
								goalId,
							});
						}}
						onEnd={async () => {
							if (!openMatch) {
								return;
							}

							await endMatch.mutateAsync(openMatch.id);
							await goToEvent();
						}}
						onNext={async () => {
							if (!openMatch) {
								return;
							}

							await endMatch.mutateAsync(openMatch.id);
						}}
						onStartClock={async () => {
							if (!openMatch) {
								return;
							}

							await startClock.mutateAsync(openMatch.id);
						}}
						onPause={async () => {
							if (!openMatch) {
								return;
							}

							await pauseMatch.mutateAsync(openMatch.id);
						}}
						onResume={async () => {
							if (!openMatch) {
								return;
							}

							await resumeMatch.mutateAsync(openMatch.id);
						}}
					/>
				</div>
			)}
		</main>
	);
}

function ChampionshipEventPlayPageSkeleton() {
	return (
		<SkeletonRegion label={SKELETON_LABEL.match}>
			<main className={PLAY_SHELL_CLASS}>
				<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
					<Skeleton className="h-12 w-full shrink-0" />
					<TeamCardSkeleton />
					<div className={MATCH_GOAL_TIMELINE_GRID_CLASS}>
						<Skeleton className="h-4 w-24 justify-self-end" />
						<Skeleton className="h-8 w-16" />
						<Skeleton className="h-4 w-24" />
					</div>
					<TeamCardSkeleton />
					<div className="mt-auto grid shrink-0 grid-cols-2 gap-2">
						<Button
							variant={BUTTON_VARIANT.ghost}
							className="h-14 text-base"
							disabled
						>
							{EVENT_ACTION.endMatch}
						</Button>
						<Button className="h-14 text-base" disabled>
							{EVENT_ACTION.nextMatch}
						</Button>
					</div>
				</div>
			</main>
		</SkeletonRegion>
	);
}
