import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import { CHAMPIONSHIP_EVENT } from "./championship-event.ts";
import { playerVisibleName } from "./player-name.ts";
import {
	formatRosterCount,
	formatRosterStat,
	ROSTER_COLUMN,
	ROSTER_COLUMN_LABEL,
	ROSTER_STAT_COLUMNS,
	type RosterRow,
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

export const PODIUM_SEASON_YEAR = 2026;

export const PODIUM_SEMESTER = {
	first: "first",
	second: "second",
} as const;

export type PodiumSemester =
	(typeof PODIUM_SEMESTER)[keyof typeof PODIUM_SEMESTER];

export const PODIUM_SEMESTER_MONTHS = {
	[PODIUM_SEMESTER.first]: { start: 1, end: 6 },
	[PODIUM_SEMESTER.second]: { start: 7, end: 12 },
} as const;

export const PODIUM_FILTER_LABEL = {
	season: `Temporada ${PODIUM_SEASON_YEAR}`,
	[PODIUM_SEMESTER.first]: "Primeiro Semestre",
	[PODIUM_SEMESTER.second]: "Segundo Semestre",
} as const;

export const PODIUM_DEFAULT_METRIC = ROSTER_COLUMN.goals;

export const PODIUM_METRICS = [
	ROSTER_COLUMN.rating,
	...ROSTER_STAT_COLUMNS,
] as const;

export type PodiumMetricId = (typeof PODIUM_METRICS)[number];

export const PODIUM_METRIC_OPTIONS = PODIUM_METRICS.map((id) => ({
	id,
	label: ROSTER_COLUMN_LABEL[id],
}));

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

export function parsePodiumMetric(value: string): PodiumMetricId {
	const metric = PODIUM_METRICS.find((id) => id === value);
	if (!metric) {
		return PODIUM_DEFAULT_METRIC;
	}

	return metric;
}

export function formatPodiumMetric(
	column: PodiumMetricId,
	value: number,
): string {
	if (column === ROSTER_COLUMN.rating) {
		return formatRosterCount(value);
	}

	return formatRosterStat(column, value);
}

export function rankPodiumRows(
	rows: readonly RosterRow[],
	metric: PodiumMetricId,
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
	metric: PodiumMetricId,
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

type EventLocalYearMonth = {
	year: number;
	month: number;
};

function eventLocalYearMonth(startsAt: string): EventLocalYearMonth | null {
	const date = new Date(startsAt);
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	const ymd = new Intl.DateTimeFormat("en-CA", {
		timeZone: CHAMPIONSHIP_EVENT.timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
	const year = Number(ymd.slice(0, 4));
	const month = Number(ymd.slice(5, 7));
	if (!Number.isFinite(year) || !Number.isFinite(month)) {
		return null;
	}

	return { year, month };
}

export function eventMatchesPodiumPeriod(
	startsAt: string,
	year: number,
	semester: PodiumSemester | null,
): boolean {
	const local = eventLocalYearMonth(startsAt);
	if (!local || local.year !== year) {
		return false;
	}

	if (semester === null) {
		return true;
	}

	switch (semester) {
		case PODIUM_SEMESTER.first:
		case PODIUM_SEMESTER.second: {
			const range = PODIUM_SEMESTER_MONTHS[semester];
			return local.month >= range.start && local.month <= range.end;
		}
		default: {
			const _never: never = semester;
			return _never;
		}
	}
}

export function togglePodiumSeason(seasonOn: boolean): {
	seasonOn: boolean;
	semester: PodiumSemester | null;
} {
	if (seasonOn) {
		return { seasonOn: false, semester: null };
	}

	return { seasonOn: true, semester: null };
}

export function togglePodiumSemester(
	current: PodiumSemester | null,
	clicked: PodiumSemester,
): {
	seasonOn: true;
	semester: PodiumSemester | null;
} {
	if (current === clicked) {
		return { seasonOn: true, semester: null };
	}

	return { seasonOn: true, semester: clicked };
}

type PodiumStatAcc = {
	goals: number;
	assists: number;
	own_goals: number;
	wins: number;
	matches: number;
	ratingSum: number;
	ratingCount: number;
};

function emptyPodiumStatAcc(): PodiumStatAcc {
	return {
		goals: 0,
		assists: 0,
		own_goals: 0,
		wins: 0,
		matches: 0,
		ratingSum: 0,
		ratingCount: 0,
	};
}

export function aggregatePodiumPlayersFromEvents(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
	year: number,
	semester: PodiumSemester | null,
): ChampionshipPlayer[] {
	const byPlayerId = new Map<number, PodiumStatAcc>();

	for (const event of events) {
		if (!eventMatchesPodiumPeriod(event.starts_at, year, semester)) {
			continue;
		}

		for (const row of event.attendance) {
			const acc = byPlayerId.get(row.player_id) ?? emptyPodiumStatAcc();
			acc.goals += row.goals;
			acc.assists += row.assists;
			acc.own_goals += row.own_goals;
			acc.wins += row.wins;
			acc.matches += row.matches;
			acc.ratingSum += row.rating;
			acc.ratingCount += 1;
			byPlayerId.set(row.player_id, acc);
		}
	}

	return players.flatMap((player) => {
		const acc = byPlayerId.get(player.id);
		if (!acc) {
			return [];
		}

		return [
			{
				...player,
				goals: acc.goals,
				assists: acc.assists,
				own_goals: acc.own_goals,
				wins: acc.wins,
				matches: acc.matches,
				rating: acc.ratingCount === 0 ? 0 : acc.ratingSum / acc.ratingCount,
			},
		];
	});
}
