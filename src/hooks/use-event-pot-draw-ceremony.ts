import { useCallback, useEffect, useReducer, useRef } from "react";
import {
	attendanceGoalkeeperIds,
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
	eventDrawCeremonyReducer,
} from "@/const/event-draw-ceremony";
import {
	EVENT_DRAW_REVEAL_LABEL,
	EVENT_DRAW_REVEAL_PHASE,
	eventDrawRevealCards,
	eventDrawRevealDelayMs,
	eventDrawRevealItemCount,
	eventDrawRevealPageSettled,
	eventDrawRevealShouldAutoStart,
	eventDrawRevealShouldTick,
	eventDrawUrl,
	type EventDrawRevealPageStatus,
} from "@/const/event-draw-reveal";
import {
	builderTeamsFromPotDrafts,
	eventPotDrawCeremonyCards,
	eventPotDrawCeremonyVisibleCount,
	eventPotDrawIsPotsStage,
	eventPotDrawPots,
	eventPotDrawRevealPhase,
	eventPotDrawShareCards,
} from "@/const/event-team-pot-draw";
import {
	EVENT_TEAM_SHARE_LABEL,
	type EventTeamShareCard,
	eventTeamsShareCards,
} from "@/const/event-team-share";
import type { EventTeamColor } from "@/const/event-team-color";
import { championshipRatingCeiling } from "@/const/player-rating";
import { caughtErrorMessage } from "@/lib/error-message";
import { generateEventDrawVideo } from "@/lib/event-draw-video";
import { eventTeamDrawHash } from "@/lib/event-team-draw-hash";
import { runEventTeamPotDraw } from "@/lib/event-team-pot-draw";
import { mulberry32 } from "@/lib/prng";
import { shareEventTeamsImage } from "@/lib/share-event-teams-image";
import { saveEventDrawAudit } from "@/services/championship-events";
import type { Championship, ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";
import { shareEventDrawVideoFile } from "./use-event-draw-ceremony";

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

type UseEventPotDrawCeremonyArgs = {
	championshipId: number;
	eventId: number;
	drawRoute: string;
	liveCards: readonly EventTeamShareCard[];
	livePotCards: readonly EventTeamShareCard[];
	reduceMotion: boolean;
	pageStatus: EventDrawRevealPageStatus;
	teamsReady: boolean;
	event: ChampionshipEvent | null;
	championship: Championship | null;
	activePlayers: readonly ChampionshipPlayer[];
	saveTeams: SaveTeamsMutate;
};

export function useEventPotDrawCeremony({
	championshipId,
	eventId,
	drawRoute,
	liveCards,
	livePotCards,
	reduceMotion,
	pageStatus,
	teamsReady,
	event,
	championship,
	activePlayers,
	saveTeams,
}: UseEventPotDrawCeremonyArgs) {
	const [state, dispatch] = useReducer(
		eventDrawCeremonyReducer,
		EVENT_DRAW_CEREMONY_INITIAL,
	);
	const videoAbortRef = useRef<AbortController | null>(null);
	const drawWorkerRef = useRef<Worker | null>(null);
	const readyRef = useRef<boolean | null>(null);

	const teamCards = state.frozenCards ?? [...liveCards];
	const potCards = state.frozenPotCards ?? [...livePotCards];
	const ceremonyCards = eventPotDrawCeremonyCards(
		state.ceremonyStage,
		potCards,
		state.potVisibleCount,
		teamCards,
	);
	const teamTotal = eventDrawRevealItemCount(teamCards);
	const visibleCountForReveal = eventPotDrawCeremonyVisibleCount(
		state.ceremonyStage,
		ceremonyCards,
		state.visibleCount,
	);
	const phase = eventPotDrawRevealPhase(
		state.ceremonyStage,
		state.potVisibleCount,
		state.visibleCount,
		teamTotal,
	);
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

		const delay = eventDrawRevealDelayMs(reduceMotion);
		if (eventPotDrawIsPotsStage(state.ceremonyStage)) {
			const timer = window.setTimeout(() => {
				dispatch({
					type: "TICK_POTS",
					potCardsLength: potCards.length,
					teamTotal,
					reduceMotion,
				});
			}, delay);

			return () => {
				window.clearTimeout(timer);
			};
		}

		if (state.visibleCount >= teamTotal) {
			return;
		}

		const timer = window.setTimeout(() => {
			dispatch({
				type: "TICK_POTS",
				potCardsLength: potCards.length,
				teamTotal,
				reduceMotion,
			});
		}, delay);

		return () => {
			window.clearTimeout(timer);
		};
	}, [
		phase,
		potCards.length,
		reduceMotion,
		state.autoplay,
		state.ceremonyStage,
		state.potVisibleCount,
		state.visibleCount,
		teamTotal,
	]);

	const beginCeremony = useCallback(
		(teamSnapshot: EventTeamShareCard[], potSnapshot: EventTeamShareCard[]) => {
			dispatch({
				type: "BEGIN_POTS_CEREMONY",
				cards: teamSnapshot,
				potCards: potSnapshot,
				reduceMotion,
			});
		},
		[reduceMotion],
	);

	const startReveal = useCallback(() => {
		beginCeremony(
			state.frozenCards ?? [...liveCards],
			state.frozenPotCards ?? [...livePotCards],
		);
	}, [
		beginCeremony,
		liveCards,
		livePotCards,
		state.frozenCards,
		state.frozenPotCards,
	]);

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
		dispatch({ type: "REPLAY_POTS" });
	}

	function pauseReveal() {
		dispatch({ type: "PAUSE" });
	}

	function resumeReveal() {
		dispatch({ type: "RESUME" });
	}

	function nextReveal() {
		dispatch({
			type: "NEXT_POTS",
			teamCards,
			potCardsLength: potCards.length,
			teamTotal,
			reduceMotion,
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
		pots: readonly EventTeamShareCard[];
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
					pots: params.pots,
					ceiling: params.ceiling,
					title: EVENT_DRAW_REVEAL_LABEL.potTitle,
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
			const { worker, done } = runEventTeamPotDraw({
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
					builderTeamsFromPotDrafts(drafts, event.players_per_team),
					activePlayers,
					volunteerIds,
				),
			);
			const drawnPots = eventDrawRevealCards(
				eventPotDrawShareCards(
					eventPotDrawPots(
						drawPlayers,
						event.players_per_team,
						mulberry32(seed),
					),
					activePlayers,
					volunteerIds,
				),
			);
			beginCeremony(drawnCards, drawnPots);
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
					pots: drawnPots,
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
			await shareEventTeamsImage(teamCards, params.ceiling, {
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
		teamCards,
		potCards,
		ceremonyCards,
		teamTotal,
		visibleCountForReveal,
		phase,
		playing,
		startReveal,
		beginCeremony,
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
