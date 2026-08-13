import { playerVisibleName } from "./player-name.ts";
import {
	ROSTER_COLUMN,
	ROSTER_STAT_COLUMNS,
	type RosterRow,
	type RosterStatColumnId,
} from "./roster-stats.ts";

export const PODIUM_PLACE = {
	first: 1,
	second: 2,
	third: 3,
} as const;

export type PodiumPlace = (typeof PODIUM_PLACE)[keyof typeof PODIUM_PLACE];

export const PODIUM_PLACES = [
	PODIUM_PLACE.first,
	PODIUM_PLACE.second,
	PODIUM_PLACE.third,
] as const;

export const PODIUM_DISPLAY_ORDER = [
	PODIUM_PLACE.second,
	PODIUM_PLACE.first,
	PODIUM_PLACE.third,
] as const;

export const PODIUM_LABEL = {
	tab: "Pódio",
	metric: "Métrica",
	emptyPlayers: "Nenhum jogador ainda",
	emptyStats: "Nenhuma estatística ainda",
} as const;

export const PODIUM_DEFAULT_METRIC = ROSTER_COLUMN.goals;

export const PODIUM_STAND_HEIGHT = {
	[PODIUM_PLACE.first]: 148,
	[PODIUM_PLACE.second]: 108,
	[PODIUM_PLACE.third]: 76,
} as const;

export const PODIUM_ANIMATION_DELAY = {
	[PODIUM_PLACE.first]: 0.24,
	[PODIUM_PLACE.second]: 0.12,
	[PODIUM_PLACE.third]: 0,
} as const;

export const PODIUM_CONFETTI = {
	particleCount: 80,
	spread: 70,
	origin: { y: 0.6 },
	disableForReducedMotion: true,
	colors: ["#166534", "#4ade80", "#fbbf24", "#fafaf9"],
};

export type PodiumStanding = {
	place: PodiumPlace;
	row: RosterRow;
};

export function parsePodiumMetric(value: string): RosterStatColumnId {
	const metric = ROSTER_STAT_COLUMNS.find((id) => id === value);
	if (!metric) {
		return PODIUM_DEFAULT_METRIC;
	}

	return metric;
}

export function rankPodiumRows(
	rows: readonly RosterRow[],
	metric: RosterStatColumnId,
): RosterRow[] {
	return [...rows].sort((left, right) => {
		const metricDiff = right[metric] - left[metric];
		if (metricDiff !== 0) {
			return metricDiff;
		}

		const ratingDiff = right.rating - left.rating;
		if (ratingDiff !== 0) {
			return ratingDiff;
		}

		return playerVisibleName(left).localeCompare(
			playerVisibleName(right),
			"pt",
		);
	});
}

export function podiumStandings(
	ranked: readonly RosterRow[],
	metric: RosterStatColumnId,
): PodiumStanding[] {
	const scored = ranked
		.filter((row) => row[metric] > 0)
		.slice(0, PODIUM_PLACES.length);

	return scored.flatMap((row, index) => {
		const place = PODIUM_PLACES[index];
		if (!place) {
			return [];
		}

		return [{ place, row }];
	});
}
