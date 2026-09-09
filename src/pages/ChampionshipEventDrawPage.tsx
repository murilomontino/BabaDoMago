import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle, RefreshCw, Video } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { Button } from "@/components/button";
import { ChampionshipDrawRatingAlignmentWarning } from "@/components/championship-draw-rating-alignment-warning";
import {
	EventDrawReveal,
	EventDrawWaiting,
} from "@/components/event-draw-reveal";
import { EventDrawViewers } from "@/components/event-draw-viewers";
import { EventMatchupAnalysis } from "@/components/event-matchup-analysis";
import { EventTeamDrawLog } from "@/components/event-team-draw-log";
import { TeamCardSkeleton } from "@/components/molecules/team-card-skeleton";
import {
	attendanceGoalkeeperIds,
	builderTeamsFromEvent,
	EVENT_TEAM_MESSAGE,
	eventTeamsAreReady,
	formatEventStartsAt,
} from "@/const/championship-event";
import {
	CHAMPIONSHIP_ROLE,
	canManageEvent,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { EVENT_DRAW_VIDEO_STATUS } from "@/const/event-draw-ceremony";
import {
	EVENT_DRAW_REVEAL_LABEL,
	EVENT_DRAW_REVEAL_PAGE,
	eventDrawRevealCards,
	eventDrawRevealPageStatus,
} from "@/const/event-draw-reveal";
import {
	matchupHistoryEvents,
	matchupTeamsFromShareCards,
} from "@/const/event-matchup-analysis";
import { eventTeamsShareCards } from "@/const/event-team-share";
import { championshipRatingCeiling } from "@/const/player-rating";
import {
	calculatePlayersRatingAlignment,
	ratingAlignmentDrawWarnings,
} from "@/const/player-rating-alignment";
import { ROUTES } from "@/const/routes";
import { SKELETON_LABEL } from "@/const/skeleton";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import {
	useChampionshipEvent,
	useChampionshipEvents,
	useSaveChampionshipEventTeams,
} from "@/hooks/championships/use-championship-events";
import { useChampionship } from "@/hooks/championships/use-championships";
import { useEventDrawPresence } from "@/hooks/championships/use-event-draw-presence";
import { useEventDrawCeremony } from "@/hooks/use-event-draw-ceremony";
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
	const eventsQuery = useChampionshipEvents(championshipId);
	const saveTeams = useSaveChampionshipEventTeams(championshipId);
	const reduceMotion = useReducedMotion();

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
	const actorRole = resolveChampionshipRole(
		championship?.created_by ?? "",
		user?.id ?? null,
		currentPlayer?.role ?? CHAMPIONSHIP_ROLE.member,
	);
	const canDraw = canManageEvent(actorRole);
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
				attendanceGoalkeeperIds(event.attendance),
			),
		);
	}, [activePlayers, event]);

	const pageStatus = eventDrawRevealPageStatus({
		championshipPending: championshipQuery.isPending,
		eventPending: eventQuery.isPending,
		championshipError: championshipQuery.isError,
		eventError: eventQuery.isError,
		teamsReady: event ? eventTeamsAreReady(event.teams) : false,
	});
	const teamsReady = pageStatus === EVENT_DRAW_REVEAL_PAGE.ready;

	const ceremony = useEventDrawCeremony({
		championshipId,
		eventId,
		drawRoute: ROUTES.championshipEventDraw,
		liveCards,
		reduceMotion: Boolean(reduceMotion),
		pageStatus,
		teamsReady,
		event,
		championship,
		activePlayers,
		saveTeams: saveTeams.mutateAsync,
	});
	useWakeLock(ceremony.playing);

	const matchupTeams = useMemo(
		() =>
			matchupTeamsFromShareCards(ceremony.cards, event?.attendance ?? []),
		[ceremony.cards, event?.attendance],
	);
	const matchupHistory = useMemo(() => {
		if (!event) {
			return [];
		}

		return matchupHistoryEvents(eventsQuery.data ?? [], event);
	}, [event, eventsQuery.data]);

	const drawAlignmentWarnings = useMemo(() => {
		const playerIds = matchupTeams.flatMap((team) => team.playerIds);
		const rows = calculatePlayersRatingAlignment(activePlayers, matchupHistory);
		return ratingAlignmentDrawWarnings(rows, playerIds);
	}, [activePlayers, matchupHistory, matchupTeams]);

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
		activePlayers.flatMap((player) => [
			player.rating,
			player.goalkeeper_rating,
		]),
	);
	const championshipName = championship.name;
	const startsAt = event.starts_at;

	return (
		<main className={DRAW_SHELL_CLASS}>
			{ceremony.isDrawing && (
				<AppDialog onClose={() => undefined}>
					<div
						className={`${MODAL_CLASS} max-w-sm text-center`}
						role="status"
						aria-live="polite"
					>
						<LoaderCircle
							className="mx-auto size-8 animate-spin text-pitch"
							aria-hidden
						/>
						<p className="mt-3 text-sm font-medium text-fg">
							{EVENT_TEAM_MESSAGE.drawing}
						</p>
					</div>
				</AppDialog>
			)}
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
				<EventDrawWaiting
					championshipName={championshipName}
					dateLabel={when.date}
					canDraw={canDraw}
					copied={ceremony.copiedDrawLink}
					isDrawing={ceremony.isDrawing}
					drawError={ceremony.drawError}
					onCopyLink={() => {
						void ceremony.copyDrawLink();
					}}
					onDraw={() => {
						void ceremony.drawTeams();
					}}
				/>
			)}
			{pageStatus === EVENT_DRAW_REVEAL_PAGE.ready && (
				<EventDrawReveal
					championshipName={championshipName}
					startsAt={startsAt}
					cards={ceremony.cards}
					visibleCount={ceremony.visibleCount}
					phase={ceremony.phase}
					autoplay={ceremony.autoplay}
					ceiling={ceiling}
					rosterById={rosterById}
					onStart={ceremony.startReveal}
					onReplay={ceremony.replayReveal}
					onPause={ceremony.pauseReveal}
					onPlay={ceremony.resumeReveal}
					onNext={ceremony.nextReveal}
					onShare={() => {
						void ceremony.shareTeams({
							ceiling,
							championshipName,
							startsAt,
						});
					}}
					isSharing={ceremony.isSharing}
					shareError={ceremony.shareError}
					footer={
						<div className="space-y-4">
							<ChampionshipDrawRatingAlignmentWarning
								warnings={drawAlignmentWarnings}
								players={activePlayers}
							/>
							<EventMatchupAnalysis
								teams={matchupTeams}
								historyEvents={matchupHistory}
								roster={activePlayers}
							/>
						</div>
					}
				/>
			)}
			{ceremony.videoStatus === EVENT_DRAW_VIDEO_STATUS.generating && (
				<div className="mx-auto w-full max-w-sm rounded-xl border border-border bg-surface-elevated p-4 text-center my-4 shadow-sm">
					<div className="flex justify-between text-xs font-medium text-fg-muted mb-2">
						<span>Gerando vídeo auditável...</span>
						<span>{ceremony.videoProgress}%</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
						<div
							className="h-full bg-pitch transition-all duration-300"
							style={{ width: `${ceremony.videoProgress}%` }}
						/>
					</div>
				</div>
			)}
			{ceremony.videoStatus === EVENT_DRAW_VIDEO_STATUS.ready && (
				<div className="mx-auto w-full max-w-sm text-center my-4">
					<Button
						type="button"
						onClick={() => {
							void ceremony.shareVideo(championshipName);
						}}
						className="w-full justify-center gap-2 bg-pitch text-pitch-fg hover:bg-pitch-hover font-semibold py-3"
					>
						<Video className="size-5" />
						Compartilhar vídeo MP4
					</Button>
					{!ceremony.videoHasAudio && (
						<p className="mt-2 text-xs text-fg-muted">
							Vídeo sem som: este navegador não gera áudio AAC.
						</p>
					)}
				</div>
			)}
			{ceremony.videoStatus === EVENT_DRAW_VIDEO_STATUS.error && (
				<div className="mx-auto w-full max-w-sm text-center my-4">
					<Button
						type="button"
						variant={BUTTON_VARIANT.secondary}
						onClick={ceremony.dismissVideo}
						className="w-full justify-center gap-2 text-fg-muted border-border"
					>
						<RefreshCw className="size-4" />
						Vídeo indisponível
					</Button>
				</div>
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
