import { endedChampionshipHistoryEvents } from "./championship-rating-history.ts";
import type { ChampionshipPlayer } from "../types/championship.ts";

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

export const TRENDS_AUDIENCE = {
	all: "all",
	monthly: "monthly",
} as const;

export type TrendsAudience =
	(typeof TRENDS_AUDIENCE)[keyof typeof TRENDS_AUDIENCE];

export const TRENDS_AUDIENCE_DEFAULT = TRENDS_AUDIENCE.all;

export const TRENDS_AUDIENCE_OPTIONS = [
	TRENDS_AUDIENCE.all,
	TRENDS_AUDIENCE.monthly,
] as const;

export const TRENDS_AUDIENCE_LABEL = {
	filter: "Elenco",
	[TRENDS_AUDIENCE.all]: "Todos",
	[TRENDS_AUDIENCE.monthly]: "Mensalistas",
	emptyMonthly: "Nenhum mensalista com dados no recorte",
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

export function isTrendsAudience(value: string): value is TrendsAudience {
	return TRENDS_AUDIENCE_OPTIONS.some((option) => option === value);
}

export function parseTrendsAudience(value: string): TrendsAudience {
	if (isTrendsAudience(value)) {
		return value;
	}

	return TRENDS_AUDIENCE_DEFAULT;
}

export function trendsAudienceCaption(audience: TrendsAudience): string {
	return TRENDS_AUDIENCE_LABEL[audience];
}

export function trendsHasMonthlyPlayers(
	players: readonly ChampionshipPlayer[],
): boolean {
	return players.some((player) => player.is_monthly);
}

export function trendsAudiencePlayers(
	players: readonly ChampionshipPlayer[],
	audience: TrendsAudience,
): ChampionshipPlayer[] {
	if (audience === TRENDS_AUDIENCE.monthly) {
		return players.filter((player) => player.is_monthly);
	}

	return [...players];
}

export function trendsSectionEmptyLabel(
	audience: TrendsAudience,
	defaultLabel: string,
): string {
	if (audience === TRENDS_AUDIENCE.monthly) {
		return TRENDS_AUDIENCE_LABEL.emptyMonthly;
	}

	return defaultLabel;
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
