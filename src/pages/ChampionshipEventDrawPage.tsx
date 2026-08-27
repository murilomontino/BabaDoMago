import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Shuffle } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { EmptyState } from "@/components/empty-state";
import { EventDrawReveal } from "@/components/event-draw-reveal";
import { EventDrawViewers } from "@/components/event-draw-viewers";
import { EventTeamDrawLog } from "@/components/event-team-draw-log";
import { TeamCardSkeleton } from "@/components/molecules/team-card-skeleton";
import {
	builderTeamsFromEvent,
	eventTeamsAreReady,
	formatEventStartsAt,
} from "@/const/championship-event";
import {
	EVENT_DRAW_REVEAL_LABEL,
	EVENT_DRAW_REVEAL_PAGE,
	EVENT_DRAW_REVEAL_PHASE,
	eventDrawRevealCanNext,
	eventDrawRevealCards,
	eventDrawRevealCountAfterStart,
	eventDrawRevealDelayMs,
	eventDrawRevealItemCount,
	eventDrawRevealNextPlayerCount,
	eventDrawRevealPageStatus,
	eventDrawRevealPhase,
	eventDrawRevealShouldTick,
} from "@/const/event-draw-reveal";
import {
	EVENT_TEAM_SHARE_LABEL,
	type EventTeamShareCard,
	eventTeamsShareCards,
} from "@/const/event-team-share";
import { championshipRatingCeiling } from "@/const/player-rating";
import { ROUTES } from "@/const/routes";
import { SKELETON_LABEL } from "@/const/skeleton";
import { ERROR_CLASS } from "@/const/ui";
import { shareEventTeamsImage } from "@/lib/share-event-teams-image";
import { useAuth } from "@/contexts/auth";
import { useChampionshipEvent } from "@/hooks/championships/use-championship-events";
import { useChampionship } from "@/hooks/championships/use-championships";
import { useEventDrawPresence } from "@/hooks/championships/use-event-draw-presence";
import { useWakeLock } from "@/hooks/use-wake-lock";
import type { ChampionshipPlayer } from "@/types/championship";

const DRAW_SHELL_CLASS =
	"flex h-dvh flex-col overflow-hidden overscroll-contain select-none touch-manipulation pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))]";

const DRAW_HEADER_CLASS =
	"grid shrink-0 grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] items-center";

export function ChampionshipEventDrawPage() {
	const { championshipId: championshipIdParam, eventId: eventIdParam } =
		useParams({
			from: "/_authenticated/championships/$championshipId/events/$eventId/draw",
		});
	const championshipId = Number(championshipIdParam);
	const eventId = Number(eventIdParam);
	const { user } = useAuth();
	const championshipQuery = useChampionship(championshipId);
	const eventQuery = useChampionshipEvent(championshipId, eventId);
	const reduceMotion = useReducedMotion();
	const [frozenCards, setFrozenCards] = useState<EventTeamShareCard[] | null>(
		null,
	);
	const [visibleCount, setVisibleCount] = useState(0);
	const [autoplay, setAutoplay] = useState(true);
	const [isSharing, setIsSharing] = useState(false);
	const [shareError, setShareError] = useState<string | null>(null);

	const event = eventQuery.data ?? null;
	const championship = championshipQuery.data ?? null;
	const activePlayers = (championship?.players ?? []).filter(
		(player: ChampionshipPlayer) => !player.deleted_at,
	);
	const rosterById = useMemo(
		() => new Map(activePlayers.map((player) => [player.id, player])),
		[activePlayers],
	);
	const currentPlayer = useMemo(() => {
		if (!user) {
			return null;
		}

		return activePlayers.find((player) => player.user_id === user.id) ?? null;
	}, [activePlayers, user]);
	const viewers = useEventDrawPresence(
		eventId,
		currentPlayer,
		user?.id ?? null,
	);
	const liveCards = useMemo(() => {
		if (!event) {
			return [];
		}

		return eventDrawRevealCards(
			eventTeamsShareCards(
				builderTeamsFromEvent(
					event.teams,
					event.players_per_team,
					event.attendance.length,
				),
				activePlayers,
			),
		);
	}, [activePlayers, event]);
	const cards = frozenCards ?? liveCards;
	const total = eventDrawRevealItemCount(cards);
	const phase = eventDrawRevealPhase(visibleCount, total);
	const playing = phase === EVENT_DRAW_REVEAL_PHASE.playing;
	useWakeLock(playing);

	const pageStatus = eventDrawRevealPageStatus({
		championshipPending: championshipQuery.isPending,
		eventPending: eventQuery.isPending,
		championshipError: championshipQuery.isError,
		eventError: eventQuery.isError,
		teamsReady: event ? eventTeamsAreReady(event.teams) : false,
	});

	useEffect(() => {
		if (
			!eventDrawRevealShouldTick({
				phase,
				autoplay,
				reduceMotion: Boolean(reduceMotion),
			})
		) {
			return;
		}

		if (visibleCount >= total) {
			return;
		}

		const delay = eventDrawRevealDelayMs(Boolean(reduceMotion));
		const timer = window.setTimeout(() => {
			setVisibleCount((count) => count + 1);
		}, delay);

		return () => {
			window.clearTimeout(timer);
		};
	}, [autoplay, phase, reduceMotion, total, visibleCount]);

	function startReveal() {
		const snapshot = frozenCards ?? liveCards;
		setFrozenCards(snapshot);
		setAutoplay(true);
		setVisibleCount(
			eventDrawRevealCountAfterStart(
				eventDrawRevealItemCount(snapshot),
				Boolean(reduceMotion),
			),
		);
	}

	function replayReveal() {
		setVisibleCount(0);
	}

	function pauseReveal() {
		setAutoplay(false);
	}

	function resumeReveal() {
		setAutoplay(true);
	}

	function nextReveal() {
		if (!eventDrawRevealCanNext(visibleCount, total)) {
			return;
		}

		setVisibleCount(eventDrawRevealNextPlayerCount(cards, visibleCount));
	}

	if (pageStatus === EVENT_DRAW_REVEAL_PAGE.loading) {
		return <ChampionshipEventDrawPageSkeleton />;
	}

	if (pageStatus === EVENT_DRAW_REVEAL_PAGE.championshipError) {
		return (
			<main className={DRAW_SHELL_CLASS}>
				<p className={ERROR_CLASS}>
					Erro ao carregar campeonato: {championshipQuery.error?.message}
				</p>
			</main>
		);
	}

	if (pageStatus === EVENT_DRAW_REVEAL_PAGE.eventError) {
		return (
			<main className={DRAW_SHELL_CLASS}>
				<p className={ERROR_CLASS}>
					Erro ao carregar rodada: {eventQuery.error?.message}
				</p>
			</main>
		);
	}

	if (!championship || !event) {
		return <ChampionshipEventDrawPageSkeleton />;
	}

	const when = formatEventStartsAt(event.starts_at);
	const ceiling = championshipRatingCeiling(
		activePlayers.map((player) => player.rating),
	);
	const championshipName = championship.name;
	const startsAt = event.starts_at;

	async function shareTeams() {
		setIsSharing(true);
		setShareError(null);

		try {
			await shareEventTeamsImage(cards, ceiling, {
				championshipName,
				startsAt,
			});
		} catch {
			setShareError(EVENT_TEAM_SHARE_LABEL.shareFailed);
		} finally {
			setIsSharing(false);
		}
	}

	return (
		<main className={DRAW_SHELL_CLASS}>
			<header className={DRAW_HEADER_CLASS}>
				<Link
					to={ROUTES.championshipEvent}
					params={{
						championshipId: String(championshipId),
						eventId: String(eventId),
					}}
					aria-label={EVENT_DRAW_REVEAL_LABEL.back}
					className="inline-flex size-11 items-center justify-center justify-self-start rounded-lg text-fg-muted hover:bg-surface-muted"
				>
					<ArrowLeft className="size-5" />
				</Link>
				<EventTeamDrawLog
					championshipId={championshipId}
					eventId={eventId}
					showWhenEmpty
					compact
				/>
				<div className="justify-self-end">
					<EventDrawViewers viewers={viewers} rosterById={rosterById} />
				</div>
			</header>
			{pageStatus === EVENT_DRAW_REVEAL_PAGE.empty && (
				<div className="min-h-0 flex-1 overflow-y-auto">
					<EmptyState
						icon={<Shuffle className="size-10" />}
						title={EVENT_DRAW_REVEAL_LABEL.empty}
						description={`${championshipName} · ${when.date}`}
					/>
				</div>
			)}
			{pageStatus === EVENT_DRAW_REVEAL_PAGE.ready && (
				<EventDrawReveal
					championshipName={championshipName}
					startsAt={startsAt}
					cards={cards}
					visibleCount={visibleCount}
					phase={phase}
					autoplay={autoplay}
					ceiling={ceiling}
					rosterById={rosterById}
					onStart={startReveal}
					onReplay={replayReveal}
					onPause={pauseReveal}
					onPlay={resumeReveal}
					onNext={nextReveal}
					onShare={() => {
						void shareTeams();
					}}
					isSharing={isSharing}
					shareError={shareError}
				/>
			)}
		</main>
	);
}

function ChampionshipEventDrawPageSkeleton() {
	return (
		<SkeletonRegion label={SKELETON_LABEL.event}>
			<main className={DRAW_SHELL_CLASS}>
				<div className="flex flex-col gap-2">
					<Skeleton className="h-10 w-10" />
					<Skeleton className="mx-auto h-6 w-40" />
					<Skeleton className="mx-auto h-4 w-28" />
					<TeamCardSkeleton />
					<TeamCardSkeleton />
				</div>
			</main>
		</SkeletonRegion>
	);
}
