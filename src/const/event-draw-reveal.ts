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
	potTitle: "Sorteio por potes",
	start: "Iniciar",
	replay: "Ver de novo",
	shareShort: "Compartilhar",
	empty: "Ainda não sorteou",
	waitingHost: "Copie o link, espere a galera e sorteie.",
	waitingGuest: "Espere o sorteio começar.",
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

export function eventDrawRevealHeading(title: string | undefined): string {
	if (title) {
		return title;
	}

	return EVENT_DRAW_REVEAL_LABEL.title;
}

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
	return cards.reduce((sum, card) => sum + card.players.length, 0);
}

export type EventDrawRevealSlot = {
	teamIndex: number;
	playerIndex: number;
};

export function eventDrawRevealRoundRobinSlots(
	cards: readonly EventTeamShareCard[],
): EventDrawRevealSlot[] {
	const maxPlayers = cards.reduce(
		(max, card) => Math.max(max, card.players.length),
		0,
	);

	return Array.from(
		{ length: maxPlayers },
		(_, playerIndex) => playerIndex,
	).flatMap((playerIndex) =>
		cards.flatMap((card, teamIndex) =>
			eventDrawRevealSlotWhenPresent(card, teamIndex, playerIndex),
		),
	);
}

function eventDrawRevealSlotWhenPresent(
	card: EventTeamShareCard,
	teamIndex: number,
	playerIndex: number,
): EventDrawRevealSlot[] {
	if (playerIndex >= card.players.length) {
		return [];
	}

	return [{ teamIndex, playerIndex }];
}

function eventDrawRevealRevealedCountByTeam(
	cards: readonly EventTeamShareCard[],
	visibleCount: number,
): number[] {
	const counts = cards.map(() => 0);
	const slots = eventDrawRevealRoundRobinSlots(cards).slice(
		0,
		Math.max(0, visibleCount),
	);

	return slots.reduce((acc, slot) => {
		acc[slot.teamIndex] += 1;
		return acc;
	}, counts);
}

export function eventDrawRevealVisibleCards(
	cards: readonly EventTeamShareCard[],
	visibleCount: number,
): EventTeamShareCard[] {
	if (visibleCount <= 0) {
		return [];
	}

	const revealedByTeam = eventDrawRevealRevealedCountByTeam(
		cards,
		visibleCount,
	);

	return cards.map((card, teamIndex) => ({
		...card,
		players: card.players.slice(0, revealedByTeam[teamIndex] ?? 0),
	}));
}

export function eventDrawRevealVisiblePlayerCount(
	cards: readonly EventTeamShareCard[],
	visibleCount: number,
): number {
	return Math.min(Math.max(0, visibleCount), eventDrawRevealItemCount(cards));
}

export function eventDrawRevealNextPlayerCount(
	cards: readonly EventTeamShareCard[],
	visibleCount: number,
): number {
	const total = eventDrawRevealItemCount(cards);
	if (visibleCount >= total) {
		return total;
	}

	return visibleCount + 1;
}

export function eventDrawRevealGridClass(teamCount: number): string {
	if (teamCount <= 1) {
		return "grid-cols-1";
	}

	return "grid-cols-2";
}

export function eventDrawRevealCanNext(
	visibleCount: number,
	total: number,
): boolean {
	return visibleCount < total;
}

export function eventDrawRevealAdvanceEnabled(
	canAdvance: boolean | undefined,
	visibleCount: number,
	total: number,
): boolean {
	if (canAdvance === undefined) {
		return eventDrawRevealCanNext(visibleCount, total);
	}

	return canAdvance;
}

export function eventDrawRevealShowsPosition(
	showPosition: boolean | undefined,
): boolean {
	if (showPosition === false) {
		return false;
	}

	return true;
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

export function eventDrawRevealWaitingHint(canDraw: boolean): string {
	if (canDraw) {
		return EVENT_DRAW_REVEAL_LABEL.waitingHost;
	}

	return EVENT_DRAW_REVEAL_LABEL.waitingGuest;
}

export function eventDrawRevealPageSettled(
	status: EventDrawRevealPageStatus,
): boolean {
	switch (status) {
		case EVENT_DRAW_REVEAL_PAGE.empty:
		case EVENT_DRAW_REVEAL_PAGE.ready:
			return true;
		case EVENT_DRAW_REVEAL_PAGE.loading:
		case EVENT_DRAW_REVEAL_PAGE.championshipError:
		case EVENT_DRAW_REVEAL_PAGE.eventError:
			return false;
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}

export function eventDrawRevealShouldAutoStart(input: {
	previousReady: boolean | null;
	ready: boolean;
	visibleCount: number;
	settled: boolean;
}): boolean {
	if (!input.settled) {
		return false;
	}

	if (input.previousReady === null) {
		return false;
	}

	if (!input.ready) {
		return false;
	}

	if (input.previousReady) {
		return false;
	}

	if (input.visibleCount !== 0) {
		return false;
	}

	return true;
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
