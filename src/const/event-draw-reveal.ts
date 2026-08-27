import { EVENT_ACTION } from "./championship-event.ts";
import type { EventTeamShareCard } from "./event-team-share.ts";

export const EVENT_DRAW_REVEAL = {
	itemDelayMs: 1500,
	channelPrefix: "event-draw",
	auditChannelPrefix: "event-draw-audit",
	realtimeDebounceMs: 50,
} as const;

export const EVENT_DRAW_REVEAL_LABEL = {
	title: "Sorteio dos times",
	start: "Iniciar",
	replay: "Ver de novo",
	empty: "Ainda não sorteou",
	copied: "Link copiado.",
	back: "Voltar",
	pause: "Pausar sorteio",
	play: "Play sorteio",
	next: "Próximo jogador sorteado",
	pauseShort: "Pausar",
	playShort: "Play",
	nextShort: "Próximo",
	viewingOne: "1 presenciando",
	viewingMany: "{count} presenciando",
	viewingEmpty: "Ninguém presenciando",
} as const;

export type EventDrawViewer = {
	playerId: number;
	displayName: string;
	avatarUrl: string | null;
};

export const EVENT_DRAW_REVEAL_MOTION = {
	y: 16,
	duration: 0.35,
} as const;

export const EVENT_DRAW_REVEAL_PHASE = {
	poster: "poster",
	playing: "playing",
	done: "done",
} as const;

export type EventDrawRevealPhase =
	(typeof EVENT_DRAW_REVEAL_PHASE)[keyof typeof EVENT_DRAW_REVEAL_PHASE];

export const EVENT_DRAW_REVEAL_PAGE = {
	loading: "loading",
	championshipError: "championshipError",
	eventError: "eventError",
	empty: "empty",
	ready: "ready",
} as const;

export type EventDrawRevealPageStatus =
	(typeof EVENT_DRAW_REVEAL_PAGE)[keyof typeof EVENT_DRAW_REVEAL_PAGE];

export function eventDrawUrl(
	origin: string,
	championshipId: number,
	eventId: number,
	drawPath: string,
): string {
	return `${origin}${drawPath
		.replace("$championshipId", String(championshipId))
		.replace("$eventId", String(eventId))}`;
}

export function copyDrawLinkLabel(copied: boolean): string {
	if (copied) {
		return EVENT_DRAW_REVEAL_LABEL.copied;
	}

	return EVENT_ACTION.copyDrawLink;
}

export function eventDrawRevealCards(
	cards: readonly EventTeamShareCard[],
): EventTeamShareCard[] {
	return cards.filter((card) => card.players.length > 0);
}

export function eventDrawRevealCardKey(card: EventTeamShareCard): string {
	return `${card.title}:${card.color ?? ""}`;
}

export function eventDrawRevealItemCount(
	cards: readonly EventTeamShareCard[],
): number {
	return cards.reduce((sum, card) => sum + 1 + card.players.length, 0);
}

export function eventDrawRevealVisibleCards(
	cards: readonly EventTeamShareCard[],
	visibleCount: number,
): EventTeamShareCard[] {
	if (visibleCount <= 0) {
		return [];
	}

	let remaining = visibleCount;
	const visible: EventTeamShareCard[] = [];

	for (const card of cards) {
		if (remaining <= 0) {
			break;
		}

		remaining -= 1;
		const playerCount = Math.min(card.players.length, Math.max(0, remaining));
		remaining -= playerCount;
		visible.push({
			...card,
			players: card.players.slice(0, playerCount),
		});
	}

	return visible;
}

export function eventDrawRevealVisiblePlayerCount(
	cards: readonly EventTeamShareCard[],
	visibleCount: number,
): number {
	return eventDrawRevealVisibleCards(cards, visibleCount).reduce(
		(sum, card) => sum + card.players.length,
		0,
	);
}

export function eventDrawRevealNextPlayerCount(
	cards: readonly EventTeamShareCard[],
	visibleCount: number,
): number {
	const total = eventDrawRevealItemCount(cards);
	if (visibleCount >= total) {
		return total;
	}

	const currentPlayers = eventDrawRevealVisiblePlayerCount(cards, visibleCount);
	for (let next = visibleCount + 1; next <= total; next += 1) {
		if (eventDrawRevealVisiblePlayerCount(cards, next) > currentPlayers) {
			return next;
		}
	}

	return total;
}

export function eventDrawRevealCanNext(
	visibleCount: number,
	total: number,
): boolean {
	return visibleCount < total;
}

export function eventDrawRevealShouldTick(input: {
	phase: EventDrawRevealPhase;
	autoplay: boolean;
	reduceMotion: boolean;
}): boolean {
	if (input.phase !== EVENT_DRAW_REVEAL_PHASE.playing) {
		return false;
	}

	if (!input.autoplay) {
		return false;
	}

	if (input.reduceMotion) {
		return false;
	}

	return true;
}

export function eventDrawRevealShowControls(
	phase: EventDrawRevealPhase,
	reduceMotion: boolean,
): boolean {
	if (reduceMotion) {
		return false;
	}

	return phase === EVENT_DRAW_REVEAL_PHASE.playing;
}

export function eventDrawRevealShowShare(phase: EventDrawRevealPhase): boolean {
	switch (phase) {
		case EVENT_DRAW_REVEAL_PHASE.poster:
		case EVENT_DRAW_REVEAL_PHASE.done:
			return true;
		case EVENT_DRAW_REVEAL_PHASE.playing:
			return false;
		default: {
			const _exhaustive: never = phase;
			return _exhaustive;
		}
	}
}

export function eventDrawRevealShareIsPrimary(
	phase: EventDrawRevealPhase,
): boolean {
	switch (phase) {
		case EVENT_DRAW_REVEAL_PHASE.done:
			return true;
		case EVENT_DRAW_REVEAL_PHASE.poster:
		case EVENT_DRAW_REVEAL_PHASE.playing:
			return false;
		default: {
			const _exhaustive: never = phase;
			return _exhaustive;
		}
	}
}

export function eventDrawRevealDelayMs(reduceMotion: boolean): number {
	if (reduceMotion) {
		return 0;
	}

	return EVENT_DRAW_REVEAL.itemDelayMs;
}

export function eventDrawRevealCountAfterStart(
	total: number,
	reduceMotion: boolean,
): number {
	if (total <= 0) {
		return 0;
	}

	if (reduceMotion) {
		return total;
	}

	return 1;
}

export function eventDrawRevealPhase(
	visibleCount: number,
	total: number,
): EventDrawRevealPhase {
	if (visibleCount <= 0) {
		return EVENT_DRAW_REVEAL_PHASE.poster;
	}

	if (total > 0 && visibleCount >= total) {
		return EVENT_DRAW_REVEAL_PHASE.done;
	}

	return EVENT_DRAW_REVEAL_PHASE.playing;
}

export function eventDrawRevealSlotIsGoalkeeper(number: number): boolean {
	return number === 1;
}

export function eventDrawRevealPageStatus(input: {
	championshipPending: boolean;
	eventPending: boolean;
	championshipError: boolean;
	eventError: boolean;
	teamsReady: boolean;
}): EventDrawRevealPageStatus {
	if (input.championshipPending || input.eventPending) {
		return EVENT_DRAW_REVEAL_PAGE.loading;
	}

	if (input.championshipError) {
		return EVENT_DRAW_REVEAL_PAGE.championshipError;
	}

	if (input.eventError) {
		return EVENT_DRAW_REVEAL_PAGE.eventError;
	}

	if (!input.teamsReady) {
		return EVENT_DRAW_REVEAL_PAGE.empty;
	}

	return EVENT_DRAW_REVEAL_PAGE.ready;
}

export function eventDrawRevealChannelName(eventId: number): string {
	return `${EVENT_DRAW_REVEAL.channelPrefix}:${eventId}`;
}

export function eventDrawRevealAuditChannelName(eventId: number): string {
	return `${EVENT_DRAW_REVEAL.auditChannelPrefix}:${eventId}`;
}

export function eventDrawRevealViewingLabel(count: number): string {
	if (count <= 0) {
		return EVENT_DRAW_REVEAL_LABEL.viewingEmpty;
	}

	if (count === 1) {
		return EVENT_DRAW_REVEAL_LABEL.viewingOne;
	}

	return EVENT_DRAW_REVEAL_LABEL.viewingMany.replace("{count}", String(count));
}

export function eventDrawRevealViewingBadgeCount(count: number): string {
	if (count > 99) {
		return "99+";
	}

	if (count < 0) {
		return "0";
	}

	return String(count);
}

function eventDrawRevealViewerFromMeta(
	meta: Record<string, unknown>,
): EventDrawViewer | null {
	if (typeof meta.playerId !== "number" || !Number.isFinite(meta.playerId)) {
		return null;
	}

	if (typeof meta.displayName !== "string" || meta.displayName.length === 0) {
		return null;
	}

	const avatarUrl = meta.avatarUrl;
	if (avatarUrl !== null && typeof avatarUrl !== "string") {
		return null;
	}

	return {
		playerId: meta.playerId,
		displayName: meta.displayName,
		avatarUrl,
	};
}

export function eventDrawRevealViewersFromPresence(
	state: Record<string, readonly Record<string, unknown>[]>,
): EventDrawViewer[] {
	const metas = Object.values(state).flat();
	const byId = new Map<number, EventDrawViewer>();

	for (const meta of metas) {
		const viewer = eventDrawRevealViewerFromMeta(meta);
		if (!viewer) {
			continue;
		}

		byId.set(viewer.playerId, viewer);
	}

	return [...byId.values()];
}
