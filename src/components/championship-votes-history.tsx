import { Link } from "@tanstack/react-router";
import { Vote } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { EventPlayerVotesConfirmModal } from "@/components/event-player-votes-confirm-modal";
import { SectionCard } from "@/components/section-card";
import {
	compareStartsAtNewestFirst,
	formatEventStartsAt,
} from "@/const/championship-event";
import {
	EVENT_PLAYER_VOTE_LABEL,
	EVENT_PLAYER_VOTE_STATUS,
	eventPlayerVoteStatus,
	eventPlayerVoteStatusLabel,
} from "@/const/event-player-vote";
import { ROUTES } from "@/const/routes";
import {
	BUTTON_VARIANT,
	buttonClassName,
	CHIP_CLASS,
	ERROR_CLASS,
} from "@/const/ui";
import { CHAMPIONSHIP_EVENTS_QUERY_KEY } from "@/hooks/championships/championships-query-keys";
import {
	useReopenChampionshipEventPlayerVotes,
	useVoidChampionshipEventPlayerVotes,
} from "@/hooks/championships/use-championship-events";
import { caughtErrorMessage, mutationErrorMessage } from "@/lib/error-message";
import type { ChampionshipEvent } from "@/types/championship-event";

type ChampionshipVotesHistoryProps = {
	championshipId: number;
	events: readonly ChampionshipEvent[];
	canOverrideEnded: boolean;
};

export function ChampionshipVotesHistory({
	championshipId,
	events,
	canOverrideEnded,
}: ChampionshipVotesHistoryProps) {
	const voidVotes = useVoidChampionshipEventPlayerVotes(championshipId);
	const reopenVotes = useReopenChampionshipEventPlayerVotes(championshipId);
	const [voidEventId, setVoidEventId] = useState<number | null>(null);
	const [reopenEventId, setReopenEventId] = useState<number | null>(null);
	const [localError, setLocalError] = useState<string | null>(null);

	const endedEvents = useMemo(
		() =>
			events
				.filter((event) => event.ended_at !== null)
				.slice()
				.sort(compareStartsAtNewestFirst),
		[events],
	);

	const pendingEventId = (() => {
		if (voidVotes.isPending && typeof voidVotes.variables === "number") {
			return voidVotes.variables;
		}

		if (reopenVotes.isPending && typeof reopenVotes.variables === "number") {
			return reopenVotes.variables;
		}

		return null;
	})();

	return (
		<>
			<SectionCard
				title={EVENT_PLAYER_VOTE_LABEL.historyTitle}
				icon={<Vote className="size-4 text-pitch-fg" />}
				queryKey={CHAMPIONSHIP_EVENTS_QUERY_KEY}
			>
				{localError && <p className={ERROR_CLASS}>{localError}</p>}
				{endedEvents.length === 0 && (
					<EmptyState
						icon={<Vote className="size-10" />}
						title={EVENT_PLAYER_VOTE_LABEL.historyEmpty}
					/>
				)}
				{endedEvents.length > 0 && (
					<ul className="space-y-2">
						{endedEvents.map((event) => {
							const status = eventPlayerVoteStatus({
								playerVotesClosedAt: event.player_votes_closed_at,
								playerVotesVoidedAt: event.player_votes_voided_at,
							});
							const starts = formatEventStartsAt(event.starts_at);
							const busy = pendingEventId === event.id;

							return (
								<li
									key={event.id}
									className="flex flex-col gap-3 rounded-xl border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
								>
									<div className="min-w-0 space-y-1">
										<p className="truncate text-sm font-medium text-fg">
											{starts.date}
											<span className="text-fg-muted"> · {starts.time}</span>
										</p>
										<span className={CHIP_CLASS}>
											{eventPlayerVoteStatusLabel(status)}
										</span>
									</div>
									<div className="flex flex-wrap gap-2">
										{status !== EVENT_PLAYER_VOTE_STATUS.voided && (
											<Link
												to={ROUTES.championshipEventVote}
												params={{
													championshipId: String(championshipId),
													eventId: String(event.id),
												}}
												className={buttonClassName(
													BUTTON_VARIANT.secondary,
													"h-9",
												)}
											>
												{EVENT_PLAYER_VOTE_LABEL.openHistory}
											</Link>
										)}
										{canOverrideEnded &&
											status !== EVENT_PLAYER_VOTE_STATUS.voided && (
												<Button
													variant={BUTTON_VARIANT.danger}
													className="h-9"
													disabled={busy}
													onClick={() => {
														setLocalError(null);
														setVoidEventId(event.id);
													}}
												>
													{EVENT_PLAYER_VOTE_LABEL.cancelVotes}
												</Button>
											)}
										{canOverrideEnded &&
											status === EVENT_PLAYER_VOTE_STATUS.voided && (
												<Button
													variant={BUTTON_VARIANT.secondary}
													className="h-9"
													disabled={busy}
													onClick={() => {
														setLocalError(null);
														setReopenEventId(event.id);
													}}
												>
													{EVENT_PLAYER_VOTE_LABEL.reopenVotes}
												</Button>
											)}
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</SectionCard>
			{voidEventId !== null && (
				<EventPlayerVotesConfirmModal
					title={EVENT_PLAYER_VOTE_LABEL.cancelVotes}
					hint={EVENT_PLAYER_VOTE_LABEL.cancelVotesHint}
					confirmLabel={EVENT_PLAYER_VOTE_LABEL.cancelVotes}
					confirmVariant={BUTTON_VARIANT.danger}
					isPending={voidVotes.isPending}
					errorMessage={localError ?? mutationErrorMessage(voidVotes)}
					onCancel={() => {
						setVoidEventId(null);
						setLocalError(null);
						voidVotes.reset();
					}}
					onConfirm={() => {
						setLocalError(null);
						voidVotes.mutate(voidEventId, {
							onSuccess: () => {
								setVoidEventId(null);
							},
							onError: (voidError) => {
								setLocalError(
									caughtErrorMessage(
										voidError,
										EVENT_PLAYER_VOTE_LABEL.cancelVotesFailed,
									),
								);
							},
						});
					}}
				/>
			)}
			{reopenEventId !== null && (
				<EventPlayerVotesConfirmModal
					title={EVENT_PLAYER_VOTE_LABEL.reopenVotes}
					hint={EVENT_PLAYER_VOTE_LABEL.reopenVotesHint}
					confirmLabel={EVENT_PLAYER_VOTE_LABEL.reopenVotes}
					confirmVariant={BUTTON_VARIANT.primary}
					isPending={reopenVotes.isPending}
					errorMessage={localError ?? mutationErrorMessage(reopenVotes)}
					onCancel={() => {
						setReopenEventId(null);
						setLocalError(null);
						reopenVotes.reset();
					}}
					onConfirm={() => {
						setLocalError(null);
						reopenVotes.mutate(reopenEventId, {
							onSuccess: () => {
								setReopenEventId(null);
							},
							onError: (reopenError) => {
								setLocalError(
									caughtErrorMessage(
										reopenError,
										EVENT_PLAYER_VOTE_LABEL.reopenVotesFailed,
									),
								);
							},
						});
					}}
				/>
			)}
		</>
	);
}
