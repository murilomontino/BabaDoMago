import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle, RefreshCw, Video } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { Button } from "@/components/button";
import {
	EventDrawReveal,
	EventDrawWaiting,
} from "@/components/event-draw-reveal";
import { EventDrawViewers } from "@/components/event-draw-viewers";
import { EventTeamDrawLog } from "@/components/event-team-draw-log";
import { TeamCardSkeleton } from "@/components/molecules/team-card-skeleton";
import {
	attendanceGoalkeeperIds,
	builderTeamsFromEvent,
	EVENT_TEAM_MESSAGE,
	type EventTeamDraft,
	eventTeamsAreReady,
	formatEventStartsAt,
	keepGoalkeepersPresent,
	validateEventAttendance,
	validateEventTeams,
	validateTeamsInAttendance,
} from "@/const/championship-event";
import {
	CHAMPIONSHIP_ROLE,
	canManageEvent,
	resolveChampionshipRole,
} from "@/const/championship-role";
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
	eventDrawRevealPageSettled,
	eventDrawRevealPageStatus,
	eventDrawRevealPhase,
	eventDrawRevealShouldAutoStart,
	eventDrawRevealShouldTick,
	eventDrawUrl,
} from "@/const/event-draw-reveal";
import {
	EVENT_TEAM_SHARE_LABEL,
	type EventTeamShareCard,
	eventTeamsShareCards,
} from "@/const/event-team-share";
import { championshipRatingCeiling } from "@/const/player-rating";
import { ROUTES } from "@/const/routes";
import { SKELETON_LABEL } from "@/const/skeleton";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import {
	useChampionshipEvent,
	useSaveChampionshipEventTeams,
} from "@/hooks/championships/use-championship-events";
import { useChampionship } from "@/hooks/championships/use-championships";
import { useEventDrawPresence } from "@/hooks/championships/use-event-draw-presence";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { caughtErrorMessage } from "@/lib/error-message";
import { generateEventDrawVideo } from "@/lib/event-draw-video";
import { runEventTeamDraw } from "@/lib/event-team-draw";
import { eventTeamDrawHash } from "@/lib/event-team-draw-hash";
import { shareEventTeamsImage } from "@/lib/share-event-teams-image";
import { saveEventDrawAudit } from "@/services/championship-events";
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
	const saveTeams = useSaveChampionshipEventTeams(championshipId);
	const reduceMotion = useReducedMotion();
	const [frozenCards, setFrozenCards] = useState<EventTeamShareCard[] | null>(
		null,
	);
	const [visibleCount, setVisibleCount] = useState(0);
	const [autoplay, setAutoplay] = useState(true);
	const [isSharing, setIsSharing] = useState(false);
	const [shareError, setShareError] = useState<string | null>(null);
	const [copiedDrawLink, setCopiedDrawLink] = useState(false);
	const [isDrawing, setIsDrawing] = useState(false);
	const [drawError, setDrawError] = useState<string | null>(null);
	const [videoStatus, setVideoStatus] = useState<
		"idle" | "generating" | "ready" | "error"
	>("idle");
	const [videoProgress, setVideoProgress] = useState(0);
	const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
	const videoAbortRef = useRef<AbortController | null>(null);
	const drawWorkerRef = useRef<Worker | null>(null);
	const readyRef = useRef<boolean | null>(null);

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
	const teamsReady = pageStatus === EVENT_DRAW_REVEAL_PAGE.ready;

	useEffect(() => {
		return () => {
			drawWorkerRef.current?.terminate();
		};
	}, []);

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

	const startReveal = useCallback(() => {
		const snapshot = frozenCards ?? liveCards;
		setFrozenCards(snapshot);
		setAutoplay(true);
		setVisibleCount(
			eventDrawRevealCountAfterStart(
				eventDrawRevealItemCount(snapshot),
				Boolean(reduceMotion),
			),
		);
	}, [frozenCards, liveCards, reduceMotion]);

	useEffect(() => {
		const settled = eventDrawRevealPageSettled(pageStatus);
		if (
			!eventDrawRevealShouldAutoStart({
				previousReady: readyRef.current,
				ready: teamsReady,
				visibleCount,
				settled,
			})
		) {
			if (settled) {
				readyRef.current = teamsReady;
			}
			return;
		}

		readyRef.current = teamsReady;
		startReveal();
	}, [pageStatus, startReveal, teamsReady, visibleCount]);

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

	async function copyDrawLink() {
		const url = eventDrawUrl(
			window.location.origin,
			championshipId,
			eventId,
			ROUTES.championshipEventDraw,
		);
		await navigator.clipboard.writeText(url);
		setCopiedDrawLink(true);
	}

	async function startVideoGeneration(params: {
		seed: number;
		algorithmVersion: number;
		inputHash: string;
		cards: readonly EventTeamShareCard[];
		ceiling: number;
		drawPlayers: readonly { id: number; rating: number }[];
	}) {
		if (videoAbortRef.current) {
			videoAbortRef.current.abort();
		}
		const controller = new AbortController();
		videoAbortRef.current = controller;

		setVideoStatus("generating");
		setVideoProgress(0);
		setVideoBlob(null);

		try {
			const blob = await generateEventDrawVideo({
				data: {
					championshipName: championship?.name ?? "Campeonato",
					eventDateLabel: event?.starts_at ? new Date(event.starts_at).toLocaleDateString("pt-BR") : "",
					algorithmVersion: params.algorithmVersion,
					seed: params.seed,
					inputHash: params.inputHash,
					cards,
					ceiling,
				},
				onProgress: (percent) => setVideoProgress(percent),
				signal: controller.signal,
			});

			if (blob) {
				setVideoBlob(blob);
				setVideoStatus("ready");
			} else {
				setVideoStatus("error");
			}
		} catch {
			if (!controller.signal.aborted) {
				setVideoStatus("error");
			}
		}
	}

	async function drawTeams() {
		if (!event || !championship) {
			return;
		}

		const championshipEntityId = championship.id;
		const presentIds = event.attendance.map((row) => row.player_id);
		const rosterIds = activePlayers.map((player) => player.id);
		const attendanceInvalid = validateEventAttendance(presentIds, rosterIds);
		if (attendanceInvalid) {
			setDrawError(attendanceInvalid);
			return;
		}

		const present = new Set(presentIds);
		const volunteerIds = keepGoalkeepersPresent(
			attendanceGoalkeeperIds(event.attendance),
			presentIds,
		);
		setIsDrawing(true);
		setDrawError(null);
		try {
			const drawPlayers = activePlayers.flatMap((player) => {
				if (!present.has(player.id)) {
					return [];
				}

				return [{ id: player.id, rating: player.rating }];
			});
			const { worker, done } = runEventTeamDraw({
				players: drawPlayers,
				playersPerTeam: event.players_per_team,
				volunteerIds,
			});
			drawWorkerRef.current = worker;
			const { teams: drafts, seed, algorithmVersion } = await done;
			const teamsInvalid =
				validateEventTeams(drafts, event.players_per_team) ??
				validateTeamsInAttendance(drafts, presentIds);
			if (teamsInvalid) {
				setDrawError(teamsInvalid);
				return;
			}

			await saveTeams.mutateAsync({
				eventId,
				presentPlayerIds: presentIds,
				teams: drafts,
				goalkeeperPlayerIds: volunteerIds,
				isDraw: true,
			});

			eventTeamDrawHash({
				seed,
				algorithmVersion,
				players: drawPlayers,
				playersPerTeam: event.players_per_team,
				volunteerIds,
			}).then((inputHash) =>
				saveEventDrawAudit({
					eventId,
					championshipId: championshipEntityId,
					seed,
					algorithmVersion,
					inputSnapshot: {
						players: drawPlayers,
						playersPerTeam: event.players_per_team,
						volunteerIds,
					},
					outputSnapshot: {
						teams: drafts.map((team) => ({
							playerIds: [...team.playerIds],
							goalkeeperId: team.goalkeeperId,
						})),
					},
					inputHash,
				})
					.then(() => {
						void startVideoGeneration({
							seed,
							algorithmVersion,
							inputHash,
							cards,
							ceiling,
							drawPlayers,
						});
					})
					.catch(console.error),
			);
		} catch (error) {
			setDrawError(caughtErrorMessage(error, EVENT_TEAM_MESSAGE.drawFailed));
		} finally {
			drawWorkerRef.current?.terminate();
			drawWorkerRef.current = null;
			setIsDrawing(false);
		}
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

	async function handleShareVideo() {
		if (!videoBlob) return;
		const fileName =
			`sorteio-${championship?.name ?? "baba"}-${event?.id ?? 0}.mp4`
				.toLowerCase()
				.replace(/[^a-z0-9.]+/g, "-");
		const file = new File([videoBlob], fileName, { type: "video/mp4" });

		if (navigator.canShare && navigator.canShare({ files: [file] })) {
			try {
				await navigator.share({
					files: [file],
					title: "Sorteio de Times Auditado",
					text: `Confira o sorteio auditado do ${championship?.name ?? "campeonato"}!`,
				});
				return;
			} catch {
				// Fallback se o usuario cancelar
			}
		}

		const url = URL.createObjectURL(videoBlob);
		const a = document.createElement("a");
		a.href = url;
		a.download = fileName;
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<main className={DRAW_SHELL_CLASS}>
			{isDrawing && (
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
					copied={copiedDrawLink}
					isDrawing={isDrawing}
					drawError={drawError}
					onCopyLink={() => {
						void copyDrawLink();
					}}
					onDraw={() => {
						void drawTeams();
					}}
				/>
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
			{videoStatus === "generating" && (
				<div className="mx-auto w-full max-w-sm rounded-xl border border-border bg-surface-elevated p-4 text-center my-4 shadow-sm">
					<div className="flex justify-between text-xs font-medium text-fg-muted mb-2">
						<span>Gerando vídeo auditável...</span>
						<span>{videoProgress}%</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
						<div
							className="h-full bg-pitch transition-all duration-300"
							style={{ width: `${videoProgress}%` }}
						/>
					</div>
				</div>
			)}
			{videoStatus === "ready" && (
				<div className="mx-auto w-full max-w-sm text-center my-4">
					<Button
						type="button"
						onClick={() => {
							void handleShareVideo();
						}}
						className="w-full justify-center gap-2 bg-pitch text-pitch-fg hover:bg-pitch-hover font-semibold py-3"
					>
						<Video className="size-5" />
						Compartilhar vídeo MP4
					</Button>
				</div>
			)}
			{videoStatus === "error" && (
				<div className="mx-auto w-full max-w-sm text-center my-4">
					<Button
						type="button"
						variant={BUTTON_VARIANT.secondary}
						onClick={() => {
							setVideoStatus("idle");
						}}
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
