import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	CHAMPIONSHIP_EVENT,
	compareStartsAtOldestFirst,
} from "./championship-event.ts";
import { mvpCount } from "./event-mvp.ts";
import { applyEventRatingDelta } from "./event-rating-adjustment.ts";
import { playerVisibleName } from "./player-name.ts";
import {
	formatPlayerProfileDelta,
	playerProfileDelta,
} from "./player-profile.ts";
import {
	formatRosterCount,
	formatRosterStat,
	formatRosterWinRate,
	ROSTER_COLUMN,
	ROSTER_COLUMN_LABEL,
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
	synergy: "Sinergia",
	assistedGoals: "O mais servido",
	ratingEvolution: "Evolução da nota",
	emptyPlayers: "Nenhum jogador ainda",
	emptyStats: "Nenhuma estatística ainda",
} as const;

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
	seasonPrefix: "Temporada",
	[PODIUM_SEMESTER.first]: "Primeiro Semestre",
	[PODIUM_SEMESTER.second]: "Segundo Semestre",
	currentMonth: "Mês atual",
	allMonths: "Todos",
} as const;

export const PODIUM_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type PodiumMonth = (typeof PODIUM_MONTHS)[number];

export const PODIUM_MONTH_LABEL = {
	1: "Janeiro",
	2: "Fevereiro",
	3: "Março",
	4: "Abril",
	5: "Maio",
	6: "Junho",
	7: "Julho",
	8: "Agosto",
	9: "Setembro",
	10: "Outubro",
	11: "Novembro",
	12: "Dezembro",
} as const;

export const PODIUM_DEFAULT_METRIC = ROSTER_COLUMN.goals;

export const PODIUM_METRIC = {
	synergy: "synergy",
} as const;

export const PODIUM_PLAYER_METRICS = [
	ROSTER_COLUMN.rating,
	ROSTER_COLUMN.ratingEvolution,
	ROSTER_COLUMN.goals,
	ROSTER_COLUMN.assists,
	ROSTER_COLUMN.assisted_goals,
	ROSTER_COLUMN.own_goals,
	ROSTER_COLUMN.goalInvolvement,
	ROSTER_COLUMN.wins,
	ROSTER_COLUMN.mvps,
	ROSTER_COLUMN.matches,
	ROSTER_COLUMN.goalsAverage,
	ROSTER_COLUMN.assistsAverage,
	ROSTER_COLUMN.winRate,
] as const;

export type PodiumPlayerMetricId = (typeof PODIUM_PLAYER_METRICS)[number];

export const PODIUM_METRICS = [
	...PODIUM_PLAYER_METRICS,
	PODIUM_METRIC.synergy,
] as const;

export type PodiumMetricId = (typeof PODIUM_METRICS)[number];

export function isPodiumPlayerMetric(
	metric: PodiumMetricId,
): metric is PodiumPlayerMetricId {
	return metric !== PODIUM_METRIC.synergy;
}

export function podiumMetricLabel(metric: PodiumMetricId): string {
	if (metric === PODIUM_METRIC.synergy) {
		return PODIUM_LABEL.synergy;
	}

	if (metric === ROSTER_COLUMN.assisted_goals) {
		return PODIUM_LABEL.assistedGoals;
	}

	if (metric === ROSTER_COLUMN.ratingEvolution) {
		return PODIUM_LABEL.ratingEvolution;
	}

	return ROSTER_COLUMN_LABEL[metric];
}

export const PODIUM_METRIC_OPTIONS = PODIUM_METRICS.map((id) => ({
	id,
	label: podiumMetricLabel(id),
}));

export const PODIUM_PLAYER_METRIC_OPTIONS = PODIUM_PLAYER_METRICS.map((id) => ({
	id,
	label: podiumMetricLabel(id),
}));

export function podiumMetricOptions(includeSynergy: boolean) {
	if (includeSynergy) {
		return PODIUM_METRIC_OPTIONS;
	}

	return PODIUM_PLAYER_METRIC_OPTIONS;
}

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

export function podiumEnterDelay(
	reduceMotion: boolean | null,
	place: PodiumPlace,
): number {
	if (reduceMotion) {
		return 0;
	}

	return PODIUM_ANIMATION_DELAY[place];
}

export function podiumEnterInitialHeight(
	reduceMotion: boolean | null,
	height: number,
): { height: number } {
	if (reduceMotion) {
		return { height };
	}

	return { height: 0 };
}

export const PODIUM_CONFETTI = {
	particleCount: 80,
	spread: 70,
	origin: { y: 0.6 },
	disableForReducedMotion: true,
	colors: ["#166534", "#4ade80", "#fbbf24", "#fafaf9"],
};

export type PodiumStanding = {
	place: PodiumPlace;
	rows: RosterRow[];
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
	switch (column) {
		case PODIUM_METRIC.synergy:
			return formatRosterWinRate(value);
		case ROSTER_COLUMN.rating:
			return formatRosterCount(value);
		case ROSTER_COLUMN.ratingEvolution:
			return formatPlayerProfileDelta(value);
		case ROSTER_COLUMN.goals:
		case ROSTER_COLUMN.assists:
		case ROSTER_COLUMN.assisted_goals:
		case ROSTER_COLUMN.own_goals:
		case ROSTER_COLUMN.goalInvolvement:
		case ROSTER_COLUMN.wins:
		case ROSTER_COLUMN.mvps:
		case ROSTER_COLUMN.matches:
		case ROSTER_COLUMN.goalsAverage:
		case ROSTER_COLUMN.assistsAverage:
		case ROSTER_COLUMN.winRate:
			return formatRosterStat(column, value);
		default: {
			const _never: never = column;
			return _never;
		}
	}
}

export function rankPodiumRows(
	rows: readonly RosterRow[],
	metric: PodiumPlayerMetricId,
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
	metric: PodiumPlayerMetricId,
): PodiumStanding[] {
	const scored = ranked.filter((row) => row[metric] > 0);
	const distinct = [...new Set(scored.map((row) => row[metric]))].slice(
		0,
		PODIUM_PLACES.length,
	);

	return distinct.flatMap((score, index) => {
		const place = PODIUM_PLACES[index];
		if (!place) {
			return [];
		}

		return [
			{
				place,
				rows: scored.filter((row) => row[metric] === score),
			},
		];
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

export function podiumSeasonLabel(year: number): string {
	return `${PODIUM_FILTER_LABEL.seasonPrefix} ${year}`;
}

export function podiumEventYear(startsAt: string): number | null {
	return eventLocalYearMonth(startsAt)?.year ?? null;
}

export function podiumAvailableYears(
	events: readonly { starts_at: string }[],
): number[] {
	const years = new Set(
		events.flatMap((event) => {
			const year = podiumEventYear(event.starts_at);
			if (year === null) {
				return [];
			}

			return [year];
		}),
	);

	return [...years].sort((left, right) => right - left);
}

export function podiumDefaultYear(
	events: readonly { starts_at: string }[],
	now = new Date(),
): number {
	const latest = podiumAvailableYears(events)[0];
	if (latest !== undefined) {
		return latest;
	}

	return podiumEventYear(now.toISOString()) ?? 0;
}

export function parsePodiumYear(
	value: number,
	availableYears: readonly number[],
): number | null {
	if (!Number.isInteger(value)) {
		return null;
	}

	if (!availableYears.includes(value)) {
		return null;
	}

	return value;
}

export function resolvePodiumYear(
	events: readonly { starts_at: string }[],
	requestedYear: number | null,
	now = new Date(),
): number {
	const available = podiumAvailableYears(events);
	const fallback = podiumDefaultYear(events, now);
	if (requestedYear === null) {
		return fallback;
	}

	if (available.length === 0) {
		if (requestedYear === fallback) {
			return requestedYear;
		}

		return fallback;
	}

	return parsePodiumYear(requestedYear, available) ?? fallback;
}

export function eventMatchesPodiumPeriod(
	startsAt: string,
	year: number,
	semester: PodiumSemester | null,
	months: readonly PodiumMonth[] = [],
): boolean {
	const local = eventLocalYearMonth(startsAt);
	if (!local || local.year !== year) {
		return false;
	}

	if (months.length > 0) {
		return months.some((month) => month === local.month);
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

export function parsePodiumMonth(value: number): PodiumMonth | null {
	const month = PODIUM_MONTHS.find((item) => item === value);
	if (!month) {
		return null;
	}

	return month;
}

export function podiumCurrentMonth(now = new Date()): PodiumMonth {
	const local = eventLocalYearMonth(now.toISOString());
	if (!local) {
		return PODIUM_MONTHS[0];
	}

	return parsePodiumMonth(local.month) ?? PODIUM_MONTHS[0];
}

export function togglePodiumMonth(
	selected: readonly PodiumMonth[],
	clicked: PodiumMonth,
): PodiumMonth[] {
	if (selected.includes(clicked)) {
		return selected.filter((month) => month !== clicked);
	}

	return [...selected, clicked].sort((left, right) => left - right);
}

export function selectPodiumCurrentMonth(current: PodiumMonth): PodiumMonth[] {
	return [current];
}

export function selectPodiumAllMonths(): PodiumMonth[] {
	return [...PODIUM_MONTHS];
}

export function isPodiumCurrentMonthSelected(
	selected: readonly PodiumMonth[],
	current: PodiumMonth,
): boolean {
	return selected.length === 1 && selected[0] === current;
}

export function isPodiumAllMonthsSelected(
	selected: readonly PodiumMonth[],
): boolean {
	return (
		selected.length === PODIUM_MONTHS.length &&
		PODIUM_MONTHS.every((month) => selected.includes(month))
	);
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

type PodiumRatingBound = {
	eventId: number;
	startsAt: string;
	ratingFrom: number;
	ratingAfter: number;
};

type PodiumStatAcc = {
	goals: number;
	assists: number;
	assisted_goals: number;
	own_goals: number;
	wins: number;
	losses: number;
	draws: number;
	matches: number;
	mvps: number;
	first: PodiumRatingBound | null;
	last: PodiumRatingBound | null;
};

function emptyPodiumStatAcc(): PodiumStatAcc {
	return {
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
		first: null,
		last: null,
	};
}

export type PodiumSourcePlayer = ChampionshipPlayer & {
	ratingEvolution: number;
};

export function attendanceRatingAfter(row: {
	rating: number;
	rating_delta: number;
	vote_rating_delta: number;
}): number {
	return applyEventRatingDelta(
		playerProfileDelta(row.rating),
		playerProfileDelta(row.rating_delta) +
			playerProfileDelta(row.vote_rating_delta),
	);
}

function roundPodiumEvolution(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}

	if (value === 0) {
		return 0;
	}

	if (value < 0) {
		return (-1 * Math.round(Math.abs(value) * 10)) / 10;
	}

	return Math.round(value * 10) / 10;
}

export function podiumRatingEvolution(from: number, to: number): number {
	return roundPodiumEvolution(
		playerProfileDelta(to) - playerProfileDelta(from),
	);
}

export function attendanceRatingEvolution(row: {
	rating: number;
	rating_delta: number;
	vote_rating_delta: number;
}): number {
	return podiumRatingEvolution(
		playerProfileDelta(row.rating),
		attendanceRatingAfter(row),
	);
}

export function podiumPeriodIncludesNow(
	year: number,
	semester: PodiumSemester | null,
	months: readonly PodiumMonth[] = [],
	now = new Date(),
): boolean {
	return eventMatchesPodiumPeriod(now.toISOString(), year, semester, months);
}

function podiumRatingBoundIsBefore(
	left: PodiumRatingBound,
	right: PodiumRatingBound,
): boolean {
	return (
		compareStartsAtOldestFirst(
			{ starts_at: left.startsAt, id: left.eventId },
			{ starts_at: right.startsAt, id: right.eventId },
		) < 0
	);
}

function podiumAttendanceBound(
	event: { id: number; starts_at: string },
	row: {
		rating: number;
		rating_delta: number;
		vote_rating_delta: number;
	},
): PodiumRatingBound {
	return {
		eventId: event.id,
		startsAt: event.starts_at,
		ratingFrom: playerProfileDelta(row.rating),
		ratingAfter: attendanceRatingAfter(row),
	};
}

function trackPodiumRatingBounds(
	acc: PodiumStatAcc,
	bound: PodiumRatingBound,
): void {
	if (!acc.first || podiumRatingBoundIsBefore(bound, acc.first)) {
		acc.first = bound;
	}

	if (!acc.last || podiumRatingBoundIsBefore(acc.last, bound)) {
		acc.last = bound;
	}
}

function podiumPeriodRatingEnd(
	useLiveRating: boolean,
	liveRating: number,
	lastAfter: number,
): number {
	if (useLiveRating) {
		return playerProfileDelta(liveRating);
	}

	return lastAfter;
}

export function aggregatePodiumPlayersFromEvents(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
	year: number,
	semester: PodiumSemester | null,
	months: readonly PodiumMonth[] = [],
	now = new Date(),
): PodiumSourcePlayer[] {
	const byPlayerId = new Map<number, PodiumStatAcc>();
	const useLiveRating = podiumPeriodIncludesNow(year, semester, months, now);

	for (const event of events) {
		if (!eventMatchesPodiumPeriod(event.starts_at, year, semester, months)) {
			continue;
		}

		for (const row of event.attendance) {
			const acc = byPlayerId.get(row.player_id) ?? emptyPodiumStatAcc();
			acc.goals += row.goals;
			acc.assists += row.assists;
			acc.assisted_goals += row.assisted_goals;
			acc.own_goals += row.own_goals;
			acc.wins += row.wins;
			acc.losses += row.losses;
			acc.draws += row.draws;
			acc.matches += row.matches;
			acc.mvps += mvpCount(row.is_mvp);
			trackPodiumRatingBounds(acc, podiumAttendanceBound(event, row));
			byPlayerId.set(row.player_id, acc);
		}
	}

	return players.flatMap((player) => {
		const acc = byPlayerId.get(player.id);
		if (!acc?.first || !acc.last) {
			return [];
		}

		return [
			{
				...player,
				goals: acc.goals,
				assists: acc.assists,
				assisted_goals: acc.assisted_goals,
				own_goals: acc.own_goals,
				wins: acc.wins,
				losses: acc.losses,
				draws: acc.draws,
				matches: acc.matches,
				mvps: acc.mvps,
				ratingEvolution: podiumRatingEvolution(
					acc.first.ratingFrom,
					podiumPeriodRatingEnd(
						useLiveRating,
						player.rating,
						acc.last.ratingAfter,
					),
				),
			},
		];
	});
}
