import {
	eventDrawRevealCanNext,
	eventDrawRevealCountAfterStart,
	eventDrawRevealItemCount,
	eventDrawRevealNextPlayerCount,
} from "./event-draw-reveal.ts";
import {
	EVENT_POT_DRAW_STAGE,
	type EventPotDrawStage,
	eventPotDrawIsPotsStage,
	eventPotDrawNextCount,
	eventPotDrawPotsComplete,
} from "./event-team-pot-draw.ts";
import type { EventTeamShareCard } from "./event-team-share.ts";

export const EVENT_DRAW_VIDEO_STATUS = {
	idle: "idle",
	generating: "generating",
	ready: "ready",
	error: "error",
} as const;

export type EventDrawVideoStatus =
	(typeof EVENT_DRAW_VIDEO_STATUS)[keyof typeof EVENT_DRAW_VIDEO_STATUS];

export const EVENT_DRAW_CEREMONY_MODE = {
	teams: "teams",
	pots: "pots",
} as const;

export type EventDrawCeremonyMode =
	(typeof EVENT_DRAW_CEREMONY_MODE)[keyof typeof EVENT_DRAW_CEREMONY_MODE];

export type EventDrawCeremonyState = {
	frozenCards: EventTeamShareCard[] | null;
	frozenPotCards: EventTeamShareCard[] | null;
	ceremonyStage: EventPotDrawStage;
	potVisibleCount: number;
	visibleCount: number;
	autoplay: boolean;
	isSharing: boolean;
	shareError: string | null;
	copiedDrawLink: boolean;
	isDrawing: boolean;
	drawError: string | null;
	videoStatus: EventDrawVideoStatus;
	videoProgress: number;
	videoBlob: Blob | null;
	videoHasAudio: boolean;
};

export const EVENT_DRAW_CEREMONY_INITIAL: EventDrawCeremonyState = {
	frozenCards: null,
	frozenPotCards: null,
	ceremonyStage: EVENT_POT_DRAW_STAGE.pots,
	potVisibleCount: 0,
	visibleCount: 0,
	autoplay: true,
	isSharing: false,
	shareError: null,
	copiedDrawLink: false,
	isDrawing: false,
	drawError: null,
	videoStatus: EVENT_DRAW_VIDEO_STATUS.idle,
	videoProgress: 0,
	videoBlob: null,
	videoHasAudio: true,
};

export type EventDrawCeremonyAction =
	| {
			type: "BEGIN_TEAMS_CEREMONY";
			cards: EventTeamShareCard[];
			reduceMotion: boolean;
	  }
	| {
			type: "BEGIN_POTS_CEREMONY";
			cards: EventTeamShareCard[];
			potCards: EventTeamShareCard[];
			reduceMotion: boolean;
	  }
	| {
			type: "TICK_TEAMS";
			total: number;
	  }
	| {
			type: "TICK_POTS";
			potCardsLength: number;
			teamTotal: number;
			reduceMotion: boolean;
	  }
	| {
			type: "NEXT_TEAMS";
			cards: readonly EventTeamShareCard[];
			total: number;
	  }
	| {
			type: "NEXT_POTS";
			teamCards: readonly EventTeamShareCard[];
			potCardsLength: number;
			teamTotal: number;
			reduceMotion: boolean;
	  }
	| { type: "REPLAY_TEAMS" }
	| { type: "REPLAY_POTS" }
	| { type: "PAUSE" }
	| { type: "RESUME" }
	| { type: "DRAW_START" }
	| { type: "DRAW_FAIL"; error: string }
	| { type: "DRAW_DONE" }
	| { type: "VIDEO_START" }
	| { type: "VIDEO_PROGRESS"; percent: number }
	| { type: "VIDEO_READY"; blob: Blob; hasAudio: boolean }
	| { type: "VIDEO_ERROR" }
	| { type: "VIDEO_DISMISS" }
	| { type: "SHARE_START" }
	| { type: "SHARE_OK" }
	| { type: "SHARE_FAIL"; error: string }
	| { type: "LINK_COPIED" };

function beginTeamsCeremony(
	state: EventDrawCeremonyState,
	cards: EventTeamShareCard[],
	reduceMotion: boolean,
): EventDrawCeremonyState {
	return {
		...state,
		frozenCards: cards,
		autoplay: true,
		visibleCount: eventDrawRevealCountAfterStart(
			eventDrawRevealItemCount(cards),
			reduceMotion,
		),
	};
}

function beginPotsCeremony(
	state: EventDrawCeremonyState,
	cards: EventTeamShareCard[],
	potCards: EventTeamShareCard[],
	reduceMotion: boolean,
): EventDrawCeremonyState {
	if (reduceMotion) {
		return {
			...state,
			frozenCards: cards,
			frozenPotCards: potCards,
			autoplay: true,
			ceremonyStage: EVENT_POT_DRAW_STAGE.teams,
			potVisibleCount: potCards.length,
			visibleCount: eventDrawRevealItemCount(cards),
		};
	}

	if (potCards.length === 0) {
		return {
			...state,
			frozenCards: cards,
			frozenPotCards: potCards,
			autoplay: true,
			ceremonyStage: EVENT_POT_DRAW_STAGE.teams,
			visibleCount: eventDrawRevealCountAfterStart(
				eventDrawRevealItemCount(cards),
				false,
			),
		};
	}

	return {
		...state,
		frozenCards: cards,
		frozenPotCards: potCards,
		autoplay: true,
		ceremonyStage: EVENT_POT_DRAW_STAGE.pots,
		visibleCount: 0,
		potVisibleCount: eventDrawRevealCountAfterStart(potCards.length, false),
	};
}

function tickTeams(
	state: EventDrawCeremonyState,
	total: number,
): EventDrawCeremonyState {
	if (state.visibleCount >= total) {
		return state;
	}

	return {
		...state,
		visibleCount: state.visibleCount + 1,
	};
}

function tickPots(
	state: EventDrawCeremonyState,
	potCardsLength: number,
	teamTotal: number,
	reduceMotion: boolean,
): EventDrawCeremonyState {
	if (eventPotDrawIsPotsStage(state.ceremonyStage)) {
		if (eventPotDrawPotsComplete(state.potVisibleCount, potCardsLength)) {
			return {
				...state,
				ceremonyStage: EVENT_POT_DRAW_STAGE.teams,
				visibleCount: eventDrawRevealCountAfterStart(teamTotal, reduceMotion),
			};
		}

		return {
			...state,
			potVisibleCount: eventPotDrawNextCount(
				state.potVisibleCount,
				potCardsLength,
			),
		};
	}

	return tickTeams(state, teamTotal);
}

function nextTeams(
	state: EventDrawCeremonyState,
	cards: readonly EventTeamShareCard[],
	total: number,
): EventDrawCeremonyState {
	if (!eventDrawRevealCanNext(state.visibleCount, total)) {
		return state;
	}

	return {
		...state,
		visibleCount: eventDrawRevealNextPlayerCount(cards, state.visibleCount),
	};
}

function nextPots(
	state: EventDrawCeremonyState,
	teamCards: readonly EventTeamShareCard[],
	potCardsLength: number,
	teamTotal: number,
	reduceMotion: boolean,
): EventDrawCeremonyState {
	if (eventPotDrawIsPotsStage(state.ceremonyStage)) {
		if (eventPotDrawPotsComplete(state.potVisibleCount, potCardsLength)) {
			return {
				...state,
				ceremonyStage: EVENT_POT_DRAW_STAGE.teams,
				visibleCount: eventDrawRevealCountAfterStart(teamTotal, reduceMotion),
			};
		}

		return {
			...state,
			potVisibleCount: eventPotDrawNextCount(
				state.potVisibleCount,
				potCardsLength,
			),
		};
	}

	return nextTeams(state, teamCards, teamTotal);
}

export function eventDrawCeremonyReducer(
	state: EventDrawCeremonyState,
	action: EventDrawCeremonyAction,
): EventDrawCeremonyState {
	switch (action.type) {
		case "BEGIN_TEAMS_CEREMONY":
			return beginTeamsCeremony(state, action.cards, action.reduceMotion);
		case "BEGIN_POTS_CEREMONY":
			return beginPotsCeremony(
				state,
				action.cards,
				action.potCards,
				action.reduceMotion,
			);
		case "TICK_TEAMS":
			return tickTeams(state, action.total);
		case "TICK_POTS":
			return tickPots(
				state,
				action.potCardsLength,
				action.teamTotal,
				action.reduceMotion,
			);
		case "NEXT_TEAMS":
			return nextTeams(state, action.cards, action.total);
		case "NEXT_POTS":
			return nextPots(
				state,
				action.teamCards,
				action.potCardsLength,
				action.teamTotal,
				action.reduceMotion,
			);
		case "REPLAY_TEAMS":
			return {
				...state,
				visibleCount: 0,
			};
		case "REPLAY_POTS":
			return {
				...state,
				ceremonyStage: EVENT_POT_DRAW_STAGE.pots,
				potVisibleCount: 0,
				visibleCount: 0,
			};
		case "PAUSE":
			return {
				...state,
				autoplay: false,
			};
		case "RESUME":
			return {
				...state,
				autoplay: true,
			};
		case "DRAW_START":
			return {
				...state,
				isDrawing: true,
				drawError: null,
			};
		case "DRAW_FAIL":
			return {
				...state,
				isDrawing: false,
				drawError: action.error,
			};
		case "DRAW_DONE":
			return {
				...state,
				isDrawing: false,
			};
		case "VIDEO_START":
			return {
				...state,
				videoStatus: EVENT_DRAW_VIDEO_STATUS.generating,
				videoProgress: 0,
				videoBlob: null,
				videoHasAudio: true,
			};
		case "VIDEO_PROGRESS":
			return {
				...state,
				videoProgress: action.percent,
			};
		case "VIDEO_READY":
			return {
				...state,
				videoBlob: action.blob,
				videoHasAudio: action.hasAudio,
				videoStatus: EVENT_DRAW_VIDEO_STATUS.ready,
			};
		case "VIDEO_ERROR":
			return {
				...state,
				videoStatus: EVENT_DRAW_VIDEO_STATUS.error,
			};
		case "VIDEO_DISMISS":
			return {
				...state,
				videoStatus: EVENT_DRAW_VIDEO_STATUS.idle,
			};
		case "SHARE_START":
			return {
				...state,
				isSharing: true,
				shareError: null,
			};
		case "SHARE_OK":
			return {
				...state,
				isSharing: false,
			};
		case "SHARE_FAIL":
			return {
				...state,
				isSharing: false,
				shareError: action.error,
			};
		case "LINK_COPIED":
			return {
				...state,
				copiedDrawLink: true,
			};
		default: {
			const _exhaustive: never = action;
			void _exhaustive;
			return state;
		}
	}
}

export function eventDrawCeremonyCards(
	state: EventDrawCeremonyState,
	liveCards: readonly EventTeamShareCard[],
): EventTeamShareCard[] {
	return state.frozenCards ?? [...liveCards];
}

export function eventDrawCeremonyVideoFileName(
	championshipName: string,
	eventId: number,
): string {
	return `sorteio-${championshipName}-${eventId}.mp4`
		.toLowerCase()
		.replace(/[^a-z0-9.]+/g, "-");
}
