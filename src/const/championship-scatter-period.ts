import { endedChampionshipHistoryEvents } from "./championship-rating-history.ts";

export const CHAMPIONSHIP_SCATTER_PERIOD = {
	last4: "last4",
	last8: "last8",
	month1: "month1",
	month2: "month2",
} as const;

export type ChampionshipScatterPeriod =
	(typeof CHAMPIONSHIP_SCATTER_PERIOD)[keyof typeof CHAMPIONSHIP_SCATTER_PERIOD];

export const CHAMPIONSHIP_SCATTER_PERIOD_DEFAULT =
	CHAMPIONSHIP_SCATTER_PERIOD.last8;

export const CHAMPIONSHIP_SCATTER_PERIOD_LABEL = {
	filter: "Período",
	[CHAMPIONSHIP_SCATTER_PERIOD.last4]: "Últimas 4 rodadas",
	[CHAMPIONSHIP_SCATTER_PERIOD.last8]: "Últimas 8 rodadas",
	[CHAMPIONSHIP_SCATTER_PERIOD.month1]: "1 mês",
	[CHAMPIONSHIP_SCATTER_PERIOD.month2]: "2 meses",
} as const;

export const CHAMPIONSHIP_SCATTER_PERIOD_OPTIONS = [
	CHAMPIONSHIP_SCATTER_PERIOD.last4,
	CHAMPIONSHIP_SCATTER_PERIOD.last8,
	CHAMPIONSHIP_SCATTER_PERIOD.month1,
	CHAMPIONSHIP_SCATTER_PERIOD.month2,
] as const;

export const CHAMPIONSHIP_SCATTER_PERIOD_COUNT = {
	[CHAMPIONSHIP_SCATTER_PERIOD.last4]: 4,
	[CHAMPIONSHIP_SCATTER_PERIOD.last8]: 8,
} as const;

export const CHAMPIONSHIP_SCATTER_PERIOD_MONTHS = {
	[CHAMPIONSHIP_SCATTER_PERIOD.month1]: 1,
	[CHAMPIONSHIP_SCATTER_PERIOD.month2]: 2,
} as const;

export function isChampionshipScatterPeriod(
	value: string,
): value is ChampionshipScatterPeriod {
	return CHAMPIONSHIP_SCATTER_PERIOD_OPTIONS.some((option) => option === value);
}

export function parseChampionshipScatterPeriod(
	value: string,
): ChampionshipScatterPeriod {
	if (isChampionshipScatterPeriod(value)) {
		return value;
	}

	return CHAMPIONSHIP_SCATTER_PERIOD_DEFAULT;
}

export function championshipScatterPeriodCaption(
	period: ChampionshipScatterPeriod,
): string {
	return CHAMPIONSHIP_SCATTER_PERIOD_LABEL[period];
}

export function championshipScatterPeriodEvents<
	T extends { id: number; starts_at: string; ended_at: string | null },
>(
	events: readonly T[],
	period: ChampionshipScatterPeriod,
	nowMs: number = Date.now(),
): T[] {
	const ended = endedChampionshipHistoryEvents(events);

	if (period === CHAMPIONSHIP_SCATTER_PERIOD.last4) {
		return ended.slice(-CHAMPIONSHIP_SCATTER_PERIOD_COUNT.last4);
	}

	if (period === CHAMPIONSHIP_SCATTER_PERIOD.last8) {
		return ended.slice(-CHAMPIONSHIP_SCATTER_PERIOD_COUNT.last8);
	}

	if (period === CHAMPIONSHIP_SCATTER_PERIOD.month1) {
		return filterEndedSinceMonths(
			ended,
			CHAMPIONSHIP_SCATTER_PERIOD_MONTHS.month1,
			nowMs,
		);
	}

	if (period === CHAMPIONSHIP_SCATTER_PERIOD.month2) {
		return filterEndedSinceMonths(
			ended,
			CHAMPIONSHIP_SCATTER_PERIOD_MONTHS.month2,
			nowMs,
		);
	}

	const _never: never = period;
	return _never;
}

function filterEndedSinceMonths<T extends { starts_at: string }>(
	ended: readonly T[],
	months: number,
	nowMs: number,
): T[] {
	const cutoffMs = scatterPeriodCutoffMs(months, nowMs);

	return ended.filter((event) => Date.parse(event.starts_at) >= cutoffMs);
}

function scatterPeriodCutoffMs(months: number, nowMs: number): number {
	const cutoff = new Date(nowMs);
	cutoff.setMonth(cutoff.getMonth() - months);
	return cutoff.getTime();
}
