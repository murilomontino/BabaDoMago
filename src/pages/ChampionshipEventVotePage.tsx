import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { EventPlayerVoteList } from "@/components/event-player-vote-list";
import { applyPlayOps } from "@/const/championship-event-match-ops";
import {
	CHAMPIONSHIP_ROLE,
	canVoteEventPlayers,
	resolveChampionshipRole,
} from "@/const/championship-role";
import {
	EVENT_PLAYER_VOTE_LABEL,
	type EventPlayerVoteChoice,
} from "@/const/event-player-vote";
import { championshipRatingCeiling } from "@/const/player-rating";
import { ROUTES } from "@/const/routes";
import { SKELETON_LABEL } from "@/const/skeleton";
import { ERROR_CLASS, PAGE_SHELL_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import {
	useChampionshipEvent,
	useChampionshipEventRealtime,
	useMyChampionshipEventPlayerVotes,
	useVoteChampionshipEventPlayer,
} from "@/hooks/championships/use-championship-events";
import { useChampionship } from "@/hooks/championships/use-championships";
import { caughtErrorMessage } from "@/lib/error-message";
import { useAppSelector } from "@/store/hooks";
import { selectMatchOps } from "@/store/match-ops/selectors";

const VOTE_SHELL_CLASS = `${PAGE_SHELL_CLASS} max-w-2xl space-y-4`;

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
	const voteMutation = useVoteChampionshipEventPlayer(championshipId, eventId);
	const matchOps = useAppSelector((state) => selectMatchOps(state, eventId));
	const [localError, setLocalError] = useState<string | null>(null);

	const championship = championshipQuery.data;
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
	const actorRole = resolveChampionshipRole(
		championship?.created_by ?? "",
		user?.id ?? null,
		currentPlayer?.role ?? CHAMPIONSHIP_ROLE.member,
	);
	const canVoteRole = canVoteEventPlayers(actorRole);
	const voterPlayerId = currentPlayer?.id ?? null;
	const voterPresent = Boolean(
		event?.attendance.some((row) => row.player_id === voterPlayerId),
	);
	const ceiling = championshipRatingCeiling(
		(championship?.players ?? []).map((player) => player.rating),
	);
	const myVotes = useMemo(() => {
		const map = new Map<number, EventPlayerVoteChoice>();
		for (const row of myVotesQuery.data ?? []) {
			map.set(row.target_player_id, row.value);
		}
		return map;
	}, [myVotesQuery.data]);

	const loading =
		championshipQuery.isLoading ||
		eventQuery.isLoading ||
		myVotesQuery.isLoading;
	const error =
		championshipQuery.error?.message ??
		eventQuery.error?.message ??
		myVotesQuery.error?.message ??
		localError;

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

	return (
		<div className={VOTE_SHELL_CLASS}>
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
				voterPresent={voterPresent}
				voterPlayerId={voterPlayerId}
				myVotes={myVotes}
				pendingTargetId={
					voteMutation.isPending
						? (voteMutation.variables?.targetPlayerId ?? null)
						: null
				}
				error={null}
				onVote={(targetPlayerId, value) => {
					setLocalError(null);
					voteMutation.mutate(
						{ targetPlayerId, value },
						{
							onError: (voteError) => {
								setLocalError(
									caughtErrorMessage(
										voteError,
										EVENT_PLAYER_VOTE_LABEL.voteFailed,
									),
								);
							},
						},
					);
				}}
			/>
		</div>
	);
}
