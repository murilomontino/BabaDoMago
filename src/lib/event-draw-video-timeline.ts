import { EVENT_DRAW_REVEAL } from "@/const/event-draw-reveal";
import type { EventTeamShareCard } from "@/const/event-team-share";

/**
 * Linha do tempo unica do video do sorteio: usada pelo render dos frames,
 * pela trilha de audio e pelo encoder, garantindo que imagem e som fiquem
 * no mesmo tempo da tela ao vivo (EVENT_DRAW_REVEAL.itemDelayMs).
 */
export const EVENT_DRAW_VIDEO_CONFIG = {
	width: 540,
	height: 960,
	fps: 30,
	introDurationSec: 2,
	playerRevealSec: EVENT_DRAW_REVEAL.itemDelayMs / 1000,
	outroDurationSec: 4,
} as const;

export function eventDrawTotalPlayers(
	cards: readonly EventTeamShareCard[],
): number {
	return cards.reduce((acc, card) => acc + card.players.length, 0);
}

export function eventDrawRevealTimesSec(
	cards: readonly EventTeamShareCard[],
): number[] {
	const { introDurationSec, playerRevealSec } = EVENT_DRAW_VIDEO_CONFIG;

	return Array.from(
		{ length: eventDrawTotalPlayers(cards) },
		(_, index) => introDurationSec + index * playerRevealSec,
	);
}

/**
 * Momento do acorde final: na tela ao vivo ele toca quando o ultimo jogador
 * entra (fase `done`), nao depois da espera do proximo item.
 */
export function eventDrawCompleteTimeSec(
	cards: readonly EventTeamShareCard[],
): number | null {
	const times = eventDrawRevealTimesSec(cards);
	return times.at(-1) ?? null;
}

export function eventDrawOutroStartSec(
	cards: readonly EventTeamShareCard[],
): number {
	const { introDurationSec, playerRevealSec } = EVENT_DRAW_VIDEO_CONFIG;
	return introDurationSec + eventDrawTotalPlayers(cards) * playerRevealSec;
}

export function eventDrawTotalDurationSec(
	cards: readonly EventTeamShareCard[],
): number {
	return (
		eventDrawOutroStartSec(cards) + EVENT_DRAW_VIDEO_CONFIG.outroDurationSec
	);
}
