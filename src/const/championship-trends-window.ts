import { endedChampionshipHistoryEvents } from "./championship-rating-history.ts";

export const TRENDS_WINDOW = {
	last3: "last3",
	last5: "last5",
} as const;

export type TrendsWindow = (typeof TRENDS_WINDOW)[keyof typeof TRENDS_WINDOW];

export const TRENDS_WINDOW_DEFAULT = TRENDS_WINDOW.last5;

export const TRENDS_WINDOW_COUNT = {
	[TRENDS_WINDOW.last3]: 3,
	[TRENDS_WINDOW.last5]: 5,
} as const;

export const TRENDS_WINDOW_MIN_ENDED = 3 as const;

export const TRENDS_WINDOW_LABEL = {
	filter: "Janela",
	[TRENDS_WINDOW.last3]: "Últimas 3",
	[TRENDS_WINDOW.last5]: "Últimas 5",
	empty: "Precisa de pelo menos 3 rodadas encerradas",
	windowCaption: "Recorte das últimas rodadas encerradas",
	allEndedCaption: "Todas as rodadas encerradas",
} as const;

export const TRENDS_RATING_HISTORY_LABEL = {
	title: "Evolução da nota",
	hint: "Nota ao longo das rodadas do recorte. Quem subiu nas últimas peladas.",
} as const;

export const TRENDS_WINDOW_OPTIONS = [
	TRENDS_WINDOW.last3,
	TRENDS_WINDOW.last5,
] as const;

export function isTrendsWindow(value: string): value is TrendsWindow {
	return TRENDS_WINDOW_OPTIONS.some((option) => option === value);
}

export function parseTrendsWindow(value: string): TrendsWindow {
	if (isTrendsWindow(value)) {
		return value;
	}

	return TRENDS_WINDOW_DEFAULT;
}

export function trendsWindowCaption(window: TrendsWindow): string {
	return TRENDS_WINDOW_LABEL[window];
}

export function championshipTrendsEvents<
	T extends { id: number; starts_at: string; ended_at: string | null },
>(events: readonly T[], window: TrendsWindow): T[] {
	const ended = endedChampionshipHistoryEvents(events);
	return ended.slice(-TRENDS_WINDOW_COUNT[window]);
}

export function championshipTrendsHasEnoughEnded<
	T extends { ended_at: string | null },
>(events: readonly T[]): boolean {
	const ended = events.filter((event) => event.ended_at !== null);
	return ended.length >= TRENDS_WINDOW_MIN_ENDED;
}
