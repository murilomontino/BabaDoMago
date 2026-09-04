import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { Button } from "@/components/button";
import { EventPlayerVoteList } from "@/components/event-player-vote-list";
import { EventPlayerVoteSubmitFab } from "@/components/molecules/event-player-vote-submit-fab";
import { applyPlayOps } from "@/const/championship-event-match-ops";
import {
	CHAMPIONSHIP_ROLE,
	canOverrideEndedEvent,
	canVoteEventPlayers,
	resolveChampionshipRole,
} from "@/const/championship-role";
import {
	EVENT_PLAYER_VOTE_LABEL,
	type EventPlayerVoteChoice,
	canEditEventPlayerBallot,
	ownerEventPlayerVoteCounts,
	eventPlayerVoteBudgetSummary,
	eventPlayerVoteDraftToSubmit,
	initialEventPlayerBallotLocked,
	isEventPlayerVoteDraftDirty,
	isEventPlayerVotesClosed,
	isEventPlayerVotesVoided,
	savedEventPlayerVoteDraft,
} from "@/const/event-player-vote";
import { championshipRatingCeiling } from "@/const/player-rating";
import { ROUTES } from "@/const/routes";
import { SKELETON_LABEL } from "@/const/skeleton";
import { BUTTON_VARIANT, ERROR_CLASS, PAGE_SHELL_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import {
	useChampionshipEvent,
	useChampionshipEventPlayerVoteCounts,
	useChampionshipEventRealtime,
	useCloseChampionshipEventPlayerVotes,
	useMyChampionshipEventPlayerVotes,
	useSubmitChampionshipEventPlayerVotes,
} from "@/hooks/championships/use-championship-events";
import { useChampionship } from "@/hooks/championships/use-championships";
import { caughtErrorMessage } from "@/lib/error-message";
import { useAppSelector } from "@/store/hooks";
import { selectMatchOps } from "@/store/match-ops/selectors";
import type { ChampionshipWithPlayers } from "@/types/championship";

const VOTE_SHELL_CLASS = `${PAGE_SHELL_CLASS} max-w-2xl space-y-4`;
const VOTE_SHELL_WITH_FAB_CLASS = `${VOTE_SHELL_CLASS} pb-28`;

export function ChampionshipEventVotePage() {
	const { championshipId: championshipIdParam, eventId: eventIdParam } =
		useParams({
			from: "/_authenticated/championships/$championshipId/events/$eventId/vote",
		});
	const championshipId = Number(championshipIdParam);
	const eventId = Number(eventIdParam);
	const { user } = useAuth();
	const championshipQuery = useChampionship(championshipId);
	const eventQuery = useChampionshipEvent(championshipId, eventId);
	useChampionshipEventRealtime(championshipId, eventId);
	const myVotesQuery = useMyChampionshipEventPlayerVotes(eventId);
	const submitVotesMutation = useSubmitChampionshipEventPlayerVotes(
		championshipId,
		eventId,
	);
	const closeVotesMutation = useCloseChampionshipEventPlayerVotes(
		championshipId,
		eventId,
	);
	const matchOps = useAppSelector((state) => selectMatchOps(state, eventId));
	const [localError, setLocalError] = useState<string | null>(null);
	const [draftVotes, setDraftVotes] = useState<
		Map<number, EventPlayerVoteChoice | null>
	>(new Map());
	const [ballotLocked, setBallotLocked] = useState(false);
	const [ballotHydrated, setBallotHydrated] = useState(false);

	const championship: ChampionshipWithPlayers | undefined =
		championshipQuery.data;
	const serverEvent = eventQuery.data;
	const event = useMemo(() => {
		if (!serverEvent) {
			return null;
		}

		return applyPlayOps(serverEvent, matchOps);
	}, [serverEvent, matchOps]);

	const currentPlayer = championship?.players.find(
		(player) => player.user_id === user?.id,
	);
	const isMonthly = currentPlayer?.is_monthly === true;
	const actorRole = resolveChampionshipRole(
		championship?.created_by ?? "",
		user?.id ?? null,
		currentPlayer?.role ?? CHAMPIONSHIP_ROLE.member,
	);
	const canVoteRole = canVoteEventPlayers(actorRole, isMonthly);
	const canCloseVotesAsOwner = canOverrideEndedEvent(actorRole);
	const allowSelfVote = championship?.player_vote_allow_self !== false;
	const voterPlayerId = currentPlayer?.id ?? null;
	const voterPresent =
		Boolean(event?.attendance.some((row) => row.player_id === voterPlayerId)) ||
		isMonthly;
	const votesClosed = isEventPlayerVotesClosed(
		event?.player_votes_closed_at ?? null,
	);
	const votesVoided = isEventPlayerVotesVoided(event?.player_votes_voided_at);
	const voteCountsQuery = useChampionshipEventPlayerVoteCounts(
		eventId,
		canCloseVotesAsOwner,
		!votesVoided,
	);
	const voteCounts = useMemo(
		() => ownerEventPlayerVoteCounts(canCloseVotesAsOwner, voteCountsQuery.data),
		[canCloseVotesAsOwner, voteCountsQuery.data],
	);
	const ceiling = championshipRatingCeiling(
		(championship?.players ?? []).map((player) => player.rating),
	);
	const savedVotes = useMemo(() => {
		const map = new Map<number, EventPlayerVoteChoice>();
		for (const row of myVotesQuery.data ?? []) {
			map.set(row.target_player_id, row.value);
		}
		return map;
	}, [myVotesQuery.data]);

	useEffect(() => {
		setDraftVotes(savedEventPlayerVoteDraft(savedVotes));
		if (ballotHydrated || myVotesQuery.isLoading) {
			return;
		}

		setBallotLocked(initialEventPlayerBallotLocked(savedVotes.size));
		setBallotHydrated(true);
	}, [savedVotes, ballotHydrated, myVotesQuery.isLoading]);

	const loading =
		championshipQuery.isLoading ||
		eventQuery.isLoading ||
		myVotesQuery.isLoading;
	const error =
		championshipQuery.error?.message ??
		eventQuery.error?.message ??
		myVotesQuery.error?.message ??
		voteCountsQuery.error?.message ??
		localError;
	const canSubmitVotes =
		canVoteRole &&
		event?.ended_at !== null &&
		!votesClosed &&
		!votesVoided &&
		voterPresent;
	const draftDirty = isEventPlayerVoteDraftDirty(draftVotes, savedVotes);
	const showSubmitFab = canSubmitVotes && !ballotLocked;
	const showEditVotes = canEditEventPlayerBallot({
		ballotLocked,
		canSubmitVotes,
	});
	const votingEnabled = showSubmitFab;

	if (loading) {
		return (
			<div className={VOTE_SHELL_CLASS}>
				<SkeletonRegion label={SKELETON_LABEL.event}>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-24 w-full" />
				</SkeletonRegion>
			</div>
		);
	}

	if (!event || !championship) {
		return (
			<div className={VOTE_SHELL_CLASS}>
				<p className={ERROR_CLASS}>{error ?? "Rodada não encontrada"}</p>
				<Link
					to={ROUTES.championshipEvent}
					params={{
						championshipId: String(championshipId),
						eventId: String(eventId),
					}}
					className="text-sm text-pitch"
				>
					{EVENT_PLAYER_VOTE_LABEL.back}
				</Link>
			</div>
		);
	}

	const showCloseVotesButton =
		canCloseVotesAsOwner &&
		event.ended_at !== null &&
		!votesClosed &&
		!votesVoided;
	const shellClass = showSubmitFab
		? VOTE_SHELL_WITH_FAB_CLASS
		: VOTE_SHELL_CLASS;

	return (
		<div className={shellClass}>
			<header className="flex items-center gap-3">
				<Link
					to={ROUTES.championshipEvent}
					params={{
						championshipId: String(championshipId),
						eventId: String(eventId),
					}}
					className="inline-flex size-10 items-center justify-center rounded-lg border border-line text-fg-muted hover:bg-surface-muted"
					aria-label={EVENT_PLAYER_VOTE_LABEL.back}
				>
					<ArrowLeft className="size-5" />
				</Link>
				<div className="min-w-0">
					<h1 className="truncate text-lg font-semibold text-fg">
						{EVENT_PLAYER_VOTE_LABEL.title}
					</h1>
					<p className="truncate text-sm text-fg-muted">{championship.name}</p>
				</div>
			</header>

			{error && <p className={ERROR_CLASS}>{error}</p>}

			<EventPlayerVoteList
				attendance={event.attendance}
				teams={event.teams}
				players={championship.players}
				ceiling={ceiling}
				canVoteRole={canVoteRole}
				eventEnded={event.ended_at !== null}
				votesClosed={votesClosed}
				votesVoided={votesVoided}
				voterPresent={voterPresent}
				voterPlayerId={voterPlayerId}
				draftVotes={draftVotes}
				votingEnabled={votingEnabled}
				ballotLocked={ballotLocked && canSubmitVotes}
				showBudget={false}
				allowSelfVote={allowSelfVote}
				voteCounts={voteCounts}
				error={null}
				onDraftChange={(targetPlayerId, value) => {
					setDraftVotes((current) => {
						const next = new Map(current);
						if (value === null) {
							next.delete(targetPlayerId);
							return next;
						}

						next.set(targetPlayerId, value);
						return next;
					});
				}}
			/>

			{showEditVotes && (
				<section className="border-t border-line pt-4">
					<Button
						variant={BUTTON_VARIANT.secondary}
						className="w-full"
						onClick={() => {
							setBallotLocked(false);
						}}
					>
						{EVENT_PLAYER_VOTE_LABEL.editVotes}
					</Button>
				</section>
			)}

			{showCloseVotesButton && (
				<section className="border-t border-line pt-4">
					<Button
						variant={BUTTON_VARIANT.primary}
						className="w-full"
						disabled={closeVotesMutation.isPending}
						onClick={() => {
							setLocalError(null);
							closeVotesMutation.mutate(undefined, {
								onError: (closeError) => {
									setLocalError(
										caughtErrorMessage(
											closeError,
											EVENT_PLAYER_VOTE_LABEL.closeVotesFailed,
										),
									);
								},
							});
						}}
					>
						<Square className="fill-current" />
						{EVENT_PLAYER_VOTE_LABEL.closeVotes}
					</Button>
				</section>
			)}

			{canCloseVotesAsOwner && votesVoided && (
				<p className="text-sm text-fg-muted">
					{EVENT_PLAYER_VOTE_LABEL.votesVoided}
				</p>
			)}
			{canCloseVotesAsOwner && !votesVoided && votesClosed && (
				<p className="text-sm text-fg-muted">
					{EVENT_PLAYER_VOTE_LABEL.votesClosed}
				</p>
			)}

			{showSubmitFab && (
				<EventPlayerVoteSubmitFab
					budgetLabel={eventPlayerVoteBudgetSummary(draftVotes)}
					disabled={!draftDirty}
					pending={submitVotesMutation.isPending}
					onClick={() => {
						setLocalError(null);
						submitVotesMutation.mutate(
							eventPlayerVoteDraftToSubmit(draftVotes),
							{
								onSuccess: () => {
									setBallotLocked(true);
								},
								onError: (submitError) => {
									setLocalError(
										caughtErrorMessage(
											submitError,
											EVENT_PLAYER_VOTE_LABEL.submitVotesFailed,
										),
									);
								},
							},
						);
					}}
				>
					{EVENT_PLAYER_VOTE_LABEL.submitVotes}
				</EventPlayerVoteSubmitFab>
			)}
		</div>
	);
}
