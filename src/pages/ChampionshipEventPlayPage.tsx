import { useNavigate, useParams } from "@tanstack/react-router";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { Button } from "@/components/button";
import { ChampionshipEventPlay } from "@/components/championship-event-play";
import { MATCH_GOAL_TIMELINE_GRID_CLASS } from "@/components/molecules/match-goal-timeline";
import { TeamCardSkeleton } from "@/components/molecules/team-card-skeleton";
import {
	canStartEventMatch,
	EVENT_ACTION,
	eventMatchTeamCount,
	isMatchAlreadyOpenError,
} from "@/const/championship-event";
import {
	MATCH_CLOCK_ACTION,
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
	useSetChampionshipEventMatchGoalkeeper,
	useSetChampionshipEventMatchPlayer,
	useStartChampionshipEventMatch,
	useSwapChampionshipEventMatchTeam,
	useUndoChampionshipEventGoal,
	useUpdateChampionshipEventTeam,
} from "@/hooks/championships/use-championship-events";
import { useChampionship } from "@/hooks/championships/use-championships";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { mutationErrorMessage } from "@/lib/error-message";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { requestMatchClock } from "@/store/match-clock/actions";
import { selectMatchClockUiError } from "@/store/match-clock/selectors";
import { useFlushMatchClock } from "@/store/match-clock/use-flush-match-clock";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEventMatch } from "@/types/championship-event";

const PLAY_SHELL_CLASS =
	"flex h-dvh flex-col overflow-hidden overscroll-contain select-none touch-manipulation pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))]";

function startMatchErrorMessage(startMatch: {
	isError: boolean;
	error: { message: string } | null;
}): string | null {
	const message = mutationErrorMessage(startMatch);
	if (!message) {
		return null;
	}

	if (isMatchAlreadyOpenError(message)) {
		return null;
	}

	return message;
}

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
	const endMatch = useEndChampionshipEventMatch(championshipId);
	const swapTeam = useSwapChampionshipEventMatchTeam(championshipId);
	const dispatch = useAppDispatch();
	const clockError = useAppSelector(selectMatchClockUiError);
	useChampionshipEventRealtime(championshipId, eventId);
	const openMatchId =
		openEventMatch<ChampionshipEventMatch>(eventQuery.data?.matches ?? [])
			?.id ?? null;
	useFlushMatchClock(openMatchId);
	useWakeLock(openMatchId !== null);

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
	const openMatch = openEventMatch<ChampionshipEventMatch>(event.matches);
	const canStart = canStartEventMatch({
		ended: event.ended_at !== null,
		teamCount: eventMatchTeamCount(event.teams),
	});
	const activePlayers = (championshipQuery.data?.players ?? []).filter(
		(player: ChampionshipPlayer) => !player.deleted_at,
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
						startError={startMatchErrorMessage(startMatch)}
						savingPlayer={setPlayer.isPending || setGoalkeeper.isPending}
						playerError={
							mutationErrorMessage(setPlayer) ??
							mutationErrorMessage(setGoalkeeper)
						}
						savingGoal={addGoal.isPending}
						goalError={mutationErrorMessage(addGoal)}
						undoing={undoGoal.isPending}
						undoError={mutationErrorMessage(undoGoal)}
						ending={endMatch.isPending}
						endError={mutationErrorMessage(endMatch)}
						swapping={swapTeam.isPending}
						swapError={mutationErrorMessage(swapTeam)}
						clockError={clockError}
						onStart={async (teamAId, teamBId, durationMinutes) => {
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
									durationMinutes,
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
						savingTeam={updateTeam.isPending}
						teamError={(updateTeam.isError && updateTeam.error.message) || null}
						onUpdateTeam={async ({
							teamId,
							color,
							playerIds,
							goalkeeperId,
						}) => {
							await updateTeam.mutateAsync({
								teamId,
								color,
								playerIds,
								goalkeeperId,
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
								await goToEvent();
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
						onSwapTeam={async (outgoingTeamId, incomingTeamId) => {
							if (!openMatch) {
								return;
							}

							await swapTeam.mutateAsync({
								matchId: openMatch.id,
								outgoingTeamId,
								incomingTeamId,
							});
						}}
						onStartClock={() => {
							if (!openMatch) {
								return;
							}

							dispatch(
								requestMatchClock(
									openMatch.id,
									MATCH_CLOCK_ACTION.start,
									openMatch,
								),
							);
						}}
						onPause={() => {
							if (!openMatch) {
								return;
							}

							dispatch(
								requestMatchClock(
									openMatch.id,
									MATCH_CLOCK_ACTION.pause,
									openMatch,
								),
							);
						}}
						onResume={() => {
							if (!openMatch) {
								return;
							}

							dispatch(
								requestMatchClock(
									openMatch.id,
									MATCH_CLOCK_ACTION.resume,
									openMatch,
								),
							);
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
