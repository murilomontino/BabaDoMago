import { useCallback, useEffect, useReducer, useRef } from "react";
import {
	attendanceGoalkeeperIds,
	builderTeamsFromDrafts,
	EVENT_TEAM_MESSAGE,
	eventDrawInputRating,
	formatEventStartsAt,
	keepGoalkeepersPresent,
	validateEventAttendance,
	validateEventTeams,
	validateTeamsInAttendance,
} from "@/const/championship-event";
import {
	EVENT_DRAW_CEREMONY_INITIAL,
	eventDrawCeremonyCards,
	eventDrawCeremonyReducer,
	eventDrawCeremonyVideoFileName,
} from "@/const/event-draw-ceremony";
import {
	EVENT_DRAW_REVEAL_PHASE,
	eventDrawRevealCards,
	eventDrawRevealDelayMs,
	eventDrawRevealItemCount,
	eventDrawRevealPageSettled,
	eventDrawRevealPhase,
	eventDrawRevealShouldAutoStart,
	eventDrawRevealShouldTick,
	eventDrawUrl,
	type EventDrawRevealPageStatus,
} from "@/const/event-draw-reveal";
import type { EventTeamColor } from "@/const/event-team-color";
import {
	EVENT_TEAM_SHARE_LABEL,
	type EventTeamShareCard,
	eventTeamsShareCards,
} from "@/const/event-team-share";
import { championshipRatingCeiling } from "@/const/player-rating";
import { caughtErrorMessage } from "@/lib/error-message";
import { generateEventDrawVideo } from "@/lib/event-draw-video";
import { runEventTeamDraw } from "@/lib/event-team-draw";
import { eventTeamDrawHash } from "@/lib/event-team-draw-hash";
import { shareEventTeamsImage } from "@/lib/share-event-teams-image";
import { saveEventDrawAudit } from "@/services/championship-events";
import type { Championship, ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type SaveTeamsMutate = (input: {
	eventId: number;
	presentPlayerIds: readonly number[];
	teams: readonly {
		color: EventTeamColor | null;
		playerIds: readonly number[];
		goalkeeperId: number;
		isActive?: boolean;
	}[];
	goalkeeperPlayerIds: readonly number[];
	isDraw?: boolean;
}) => Promise<unknown>;

type UseEventDrawCeremonyArgs = {
	championshipId: number;
	eventId: number;
	drawRoute: string;
	liveCards: readonly EventTeamShareCard[];
	reduceMotion: boolean;
	pageStatus: EventDrawRevealPageStatus;
	teamsReady: boolean;
	event: ChampionshipEvent | null;
	championship: Championship | null;
	activePlayers: readonly ChampionshipPlayer[];
	saveTeams: SaveTeamsMutate;
};

export async function shareEventDrawVideoFile(params: {
	videoBlob: Blob;
	championshipName: string;
	eventId: number;
}): Promise<void> {
	const fileName = eventDrawCeremonyVideoFileName(
		params.championshipName,
		params.eventId,
	);
	const file = new File([params.videoBlob], fileName, { type: "video/mp4" });

	if (navigator.canShare && navigator.canShare({ files: [file] })) {
		try {
			await navigator.share({
				files: [file],
				title: "Sorteio de Times Auditado",
				text: `Confira o sorteio auditado do ${params.championshipName}!`,
			});
			return;
		} catch {
			// Fallback se o usuario cancelar
		}
	}

	const url = URL.createObjectURL(params.videoBlob);
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	a.click();
	URL.revokeObjectURL(url);
}

export function useEventDrawCeremony({
	championshipId,
	eventId,
	drawRoute,
	liveCards,
	reduceMotion,
	pageStatus,
	teamsReady,
	event,
	championship,
	activePlayers,
	saveTeams,
}: UseEventDrawCeremonyArgs) {
	const [state, dispatch] = useReducer(
		eventDrawCeremonyReducer,
		EVENT_DRAW_CEREMONY_INITIAL,
	);
	const videoAbortRef = useRef<AbortController | null>(null);
	const drawWorkerRef = useRef<Worker | null>(null);
	const readyRef = useRef<boolean | null>(null);

	const cards = eventDrawCeremonyCards(state, liveCards);
	const total = eventDrawRevealItemCount(cards);
	const phase = eventDrawRevealPhase(state.visibleCount, total);
	const playing = phase === EVENT_DRAW_REVEAL_PHASE.playing;

	useEffect(() => {
		return () => {
			drawWorkerRef.current?.terminate();
		};
	}, []);

	useEffect(() => {
		if (
			!eventDrawRevealShouldTick({
				phase,
				autoplay: state.autoplay,
				reduceMotion,
			})
		) {
			return;
		}

		if (state.visibleCount >= total) {
			return;
		}

		const delay = eventDrawRevealDelayMs(reduceMotion);
		const timer = window.setTimeout(() => {
			dispatch({ type: "TICK_TEAMS", total });
		}, delay);

		return () => {
			window.clearTimeout(timer);
		};
	}, [phase, reduceMotion, state.autoplay, state.visibleCount, total]);

	const startReveal = useCallback(() => {
		dispatch({
			type: "BEGIN_TEAMS_CEREMONY",
			cards: state.frozenCards ?? [...liveCards],
			reduceMotion,
		});
	}, [liveCards, reduceMotion, state.frozenCards]);

	useEffect(() => {
		const settled = eventDrawRevealPageSettled(pageStatus);
		if (
			!eventDrawRevealShouldAutoStart({
				previousReady: readyRef.current,
				ready: teamsReady,
				visibleCount: state.visibleCount,
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
	}, [pageStatus, startReveal, state.visibleCount, teamsReady]);

	function replayReveal() {
		dispatch({ type: "REPLAY_TEAMS" });
	}

	function pauseReveal() {
		dispatch({ type: "PAUSE" });
	}

	function resumeReveal() {
		dispatch({ type: "RESUME" });
	}

	function nextReveal() {
		dispatch({
			type: "NEXT_TEAMS",
			cards,
			total,
		});
	}

	function dismissVideo() {
		dispatch({ type: "VIDEO_DISMISS" });
	}

	async function copyDrawLink() {
		const url = eventDrawUrl(
			window.location.origin,
			championshipId,
			eventId,
			drawRoute,
		);
		await navigator.clipboard.writeText(url);
		dispatch({ type: "LINK_COPIED" });
	}

	async function startVideoGeneration(params: {
		seed: number;
		algorithmVersion: number;
		inputHash: string;
		cards: readonly EventTeamShareCard[];
		ceiling: number;
		championshipName: string;
		eventDateLabel: string;
	}) {
		if (videoAbortRef.current) {
			videoAbortRef.current.abort();
		}
		const controller = new AbortController();
		videoAbortRef.current = controller;

		dispatch({ type: "VIDEO_START" });

		try {
			const result = await generateEventDrawVideo({
				data: {
					championshipName: params.championshipName,
					eventDateLabel: params.eventDateLabel,
					algorithmVersion: params.algorithmVersion,
					seed: params.seed,
					inputHash: params.inputHash,
					cards: params.cards,
					ceiling: params.ceiling,
				},
				onProgress: (percent) =>
					dispatch({ type: "VIDEO_PROGRESS", percent }),
				signal: controller.signal,
			});

			if (result) {
				dispatch({
					type: "VIDEO_READY",
					blob: result.blob,
					hasAudio: result.hasAudio,
				});
				return;
			}

			dispatch({ type: "VIDEO_ERROR" });
		} catch {
			if (!controller.signal.aborted) {
				dispatch({ type: "VIDEO_ERROR" });
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
			dispatch({ type: "DRAW_FAIL", error: attendanceInvalid });
			return;
		}

		const present = new Set(presentIds);
		const volunteerIds = keepGoalkeepersPresent(
			attendanceGoalkeeperIds(event.attendance),
			presentIds,
		);
		dispatch({ type: "DRAW_START" });
		try {
			const volunteerSet = new Set(volunteerIds);
			const drawPlayers = activePlayers.flatMap((player) => {
				if (!present.has(player.id)) {
					return [];
				}

				return [
					{
						id: player.id,
						rating: eventDrawInputRating(player, volunteerSet.has(player.id)),
					},
				];
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
				dispatch({ type: "DRAW_FAIL", error: teamsInvalid });
				return;
			}

			await saveTeams({
				eventId,
				presentPlayerIds: presentIds,
				teams: drafts,
				goalkeeperPlayerIds: volunteerIds,
				isDraw: true,
			});

			const drawnCards = eventDrawRevealCards(
				eventTeamsShareCards(
					builderTeamsFromDrafts(drafts, event.players_per_team),
					activePlayers,
					volunteerIds,
				),
			);
			const drawnCeiling = championshipRatingCeiling(
				activePlayers.flatMap((player) => [
					player.rating,
					player.goalkeeper_rating,
				]),
			);
			const drawnWhen = formatEventStartsAt(event.starts_at);

			void eventTeamDrawHash({
				seed,
				algorithmVersion,
				players: drawPlayers,
				playersPerTeam: event.players_per_team,
				volunteerIds,
			}).then(async (inputHash) => {
				const audit = saveEventDrawAudit({
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
				}).catch(console.error);

				await startVideoGeneration({
					seed,
					algorithmVersion,
					inputHash,
					cards: drawnCards,
					ceiling: drawnCeiling,
					championshipName: championship.name,
					eventDateLabel: `${drawnWhen.date} · ${drawnWhen.time}`,
				});

				await audit;
			});
			dispatch({ type: "DRAW_DONE" });
		} catch (error) {
			dispatch({
				type: "DRAW_FAIL",
				error: caughtErrorMessage(error, EVENT_TEAM_MESSAGE.drawFailed),
			});
		} finally {
			drawWorkerRef.current?.terminate();
			drawWorkerRef.current = null;
		}
	}

	async function shareTeams(params: {
		ceiling: number;
		championshipName: string;
		startsAt: string;
	}) {
		dispatch({ type: "SHARE_START" });
		try {
			await shareEventTeamsImage(cards, params.ceiling, {
				championshipName: params.championshipName,
				startsAt: params.startsAt,
			});
			dispatch({ type: "SHARE_OK" });
		} catch {
			dispatch({
				type: "SHARE_FAIL",
				error: EVENT_TEAM_SHARE_LABEL.shareFailed,
			});
		}
	}

	async function shareVideo(championshipName: string) {
		if (!state.videoBlob) {
			return;
		}

		await shareEventDrawVideoFile({
			videoBlob: state.videoBlob,
			championshipName,
			eventId,
		});
	}

	return {
		...state,
		cards,
		total,
		phase,
		playing,
		startReveal,
		replayReveal,
		pauseReveal,
		resumeReveal,
		nextReveal,
		dismissVideo,
		copyDrawLink,
		drawTeams,
		shareTeams,
		shareVideo,
	};
}
