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
} from "@/const/championship-event";
import {
	MATCH_CLOCK_ACTION,
	matchDurationSeconds,
	openEventMatch,
} from "@/const/championship-event-match";
import { applyPlayOps, MATCH_OP } from "@/const/championship-event-match-ops";
import { matchOpDisplayName } from "@/const/player-name";
import { ROUTES } from "@/const/routes";
import { SKELETON_LABEL } from "@/const/skeleton";
import { BUTTON_VARIANT, ERROR_CLASS } from "@/const/ui";
import {
	useChampionshipEvent,
	useChampionshipEventRealtime,
} from "@/hooks/championships/use-championship-events";
import { useChampionship } from "@/hooks/championships/use-championships";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { requestMatchClock } from "@/store/match-clock/actions";
import { selectMatchClockUiError } from "@/store/match-clock/selectors";
import { clearMatchClock } from "@/store/match-clock/slice";
import { useFlushMatchClock } from "@/store/match-clock/use-flush-match-clock";
import { requestMatchOp } from "@/store/match-ops/actions";
import {
	selectMatchOps,
	selectMatchOpsError,
} from "@/store/match-ops/selectors";
import { useFlushMatchOps } from "@/store/match-ops/use-flush-match-ops";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEventMatch } from "@/types/championship-event";

const PLAY_SHELL_CLASS =
	"flex h-dvh flex-col overflow-hidden overscroll-contain select-none touch-manipulation pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))]";

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
	const dispatch = useAppDispatch();
	const clockError = useAppSelector(selectMatchClockUiError);
	const matchOps = useAppSelector((state) => selectMatchOps(state, eventId));
	const opsError = useAppSelector(selectMatchOpsError);
	useChampionshipEventRealtime(championshipId, eventId);
	const playEvent = eventQuery.data
		? applyPlayOps(eventQuery.data, matchOps)
		: null;
	const openMatch =
		openEventMatch<ChampionshipEventMatch>(playEvent?.matches ?? []) ?? null;
	useFlushMatchClock(openMatch?.id ?? null);
	useFlushMatchOps(eventId);
	useWakeLock(openMatch !== null);

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

	if (!playEvent) {
		return <ChampionshipEventPlayPageSkeleton />;
	}

	const event = playEvent;
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
						opsError={opsError}
						pendingOps={matchOps.length}
						clockError={clockError}
						onStart={(teamAId, teamBId, durationMinutes) => {
							dispatch(
								requestMatchOp(event.id, {
									kind: MATCH_OP.startMatch,
									eventId: event.id,
									teamAId,
									teamBId,
									durationSeconds: matchDurationSeconds(durationMinutes),
								}),
							);
						}}
						onUpdateTeam={({ teamId, color, playerIds, goalkeeperId }) => {
							dispatch(
								requestMatchOp(event.id, {
									kind: MATCH_OP.updateTeam,
									teamId,
									color,
									playerIds,
									goalkeeperId,
									members: playerIds.map((playerId) => ({
										playerId,
										displayName: matchOpDisplayName(
											playerId,
											activePlayers,
											event.attendance,
										),
										isGoalkeeper: playerId === goalkeeperId,
									})),
								}),
							);
						}}
						onSetPlayer={(teamId, slot, playerId, includeStats) => {
							if (!openMatch) {
								return;
							}

							dispatch(
								requestMatchOp(event.id, {
									kind: MATCH_OP.setPlayer,
									matchId: openMatch.id,
									teamId,
									slot,
									playerId,
									displayName: matchOpDisplayName(
										playerId,
										activePlayers,
										event.attendance,
									),
									includeStats: includeStats === true,
								}),
							);
						}}
						onSetGoalkeeper={(teamId, playerId) => {
							if (!openMatch) {
								return;
							}

							dispatch(
								requestMatchOp(event.id, {
									kind: MATCH_OP.setGoalkeeper,
									matchId: openMatch.id,
									teamId,
									playerId,
								}),
							);
						}}
						onAddGoal={(values) => {
							if (!openMatch) {
								return;
							}

							dispatch(
								requestMatchOp(event.id, {
									kind: MATCH_OP.addGoal,
									matchId: openMatch.id,
									...values,
								}),
							);
						}}
						onUndoGoal={(goalId) => {
							if (!openMatch) {
								return;
							}

							dispatch(
								requestMatchOp(event.id, {
									kind: MATCH_OP.undoGoal,
									matchId: openMatch.id,
									goalId,
								}),
							);
						}}
						onEnd={() => {
							if (openMatch) {
								dispatch(
									requestMatchOp(event.id, {
										kind: MATCH_OP.endMatch,
										matchId: openMatch.id,
									}),
								);
								dispatch(clearMatchClock(openMatch.id));
							}

							void goToEvent();
						}}
						onNext={() => {
							if (!openMatch) {
								return;
							}

							dispatch(
								requestMatchOp(event.id, {
									kind: MATCH_OP.endMatch,
									matchId: openMatch.id,
								}),
							);
							dispatch(clearMatchClock(openMatch.id));
						}}
						onSwapTeam={(outgoingTeamId, incomingTeamId) => {
							if (!openMatch) {
								return;
							}

							dispatch(
								requestMatchOp(event.id, {
									kind: MATCH_OP.swapTeam,
									matchId: openMatch.id,
									outgoingTeamId,
									incomingTeamId,
								}),
							);
						}}
						onDiscard={() => {
							if (!openMatch) {
								return;
							}

							dispatch(
								requestMatchOp(event.id, {
									kind: MATCH_OP.discardMatch,
									matchId: openMatch.id,
								}),
							);
							dispatch(clearMatchClock(openMatch.id));
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
