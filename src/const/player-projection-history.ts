import {
	compareStartsAtNewestFirst,
	compareStartsAtOldestFirst,
	formatEventStartsAt,
} from "./championship-event.ts";
import {
	formatPerformanceMapGap,
	formatPerformanceMapRating,
	PERFORMANCE_MAP_WINDOW_COUNT,
	PERFORMANCE_MAP_WINDOW_DEFAULT,
	performanceMapProjectRating,
	type PerformanceMapProjectedStop,
} from "./championship-performance-map.ts";
import {
	applyEventRatingDelta,
	EVENT_RATING_ADJUSTMENT,
	eventActivePlayerRating,
	eventRatingRate,
	formatEventRating,
} from "./event-rating-adjustment.ts";
import { championshipRatingCeiling } from "./player-rating.ts";
import {
	formatPlayerProfileDelta,
	playerProfileDelta,
	type PlayerProfileEventInput,
} from "./player-profile.ts";
import { rosterSafeCount } from "./roster-stats.ts";

export const PLAYER_PROJECTION_HISTORY_LABEL = {
	title: "Projeção × realizado",
	hint: "Prevista = nota em que o Gap fica neutro: aproveitamento das 5 rodadas anteriores (mesmo posto, linha ou gol) × teto da liga. Gap grande sobe ou desce mais; Gap pequeno, ajuste pequeno. Gravada na hora e não muda depois. Estável = mesma nota-alvo.",
	empty: "Ainda sem rodadas para comparar projeção",
	emptyProjection: "Poucos jogos antes — sem previsão",
	future: "Próxima",
	pendingRealized: "Ainda não",
	ratingFrom: "Nota",
	projected: "Prevista",
	projectedStable: "Estável",
	ratingTo: "Realizada",
	miss: "Erro",
	gap: "Gap",
	date: "Data",
	actualSeries: "Nota",
	projectedSeries: "Prevista",
} as const;

export const PLAYER_PROJECTION_HISTORY_CHART = {
	height: 220,
	indexKey: "x",
	actualKey: "actual",
	projectedKey: "projected",
	labelOffset: 8,
	labelFontSize: 11,
	actualStroke: "#0f766e",
	projectedStroke: "#b45309",
} as const;

export const PLAYER_PROJECTION_HISTORY_COLUMN = {
	date: "date",
	ratingFrom: "ratingFrom",
	projectedNext: "projectedNext",
	projectedStable: "projectedStable",
	ratingTo: "ratingTo",
	miss: "miss",
	gap: "gap",
} as const;

export type PlayerProjectionHistoryColumnId =
	(typeof PLAYER_PROJECTION_HISTORY_COLUMN)[keyof typeof PLAYER_PROJECTION_HISTORY_COLUMN];

export const PLAYER_PROJECTION_HISTORY_COLUMNS = [
	PLAYER_PROJECTION_HISTORY_COLUMN.date,
	PLAYER_PROJECTION_HISTORY_COLUMN.ratingFrom,
	PLAYER_PROJECTION_HISTORY_COLUMN.projectedNext,
	PLAYER_PROJECTION_HISTORY_COLUMN.projectedStable,
	PLAYER_PROJECTION_HISTORY_COLUMN.ratingTo,
	PLAYER_PROJECTION_HISTORY_COLUMN.miss,
	PLAYER_PROJECTION_HISTORY_COLUMN.gap,
] as const;

export const PLAYER_PROJECTION_HISTORY_COLUMN_LABEL = {
	date: PLAYER_PROJECTION_HISTORY_LABEL.date,
	ratingFrom: PLAYER_PROJECTION_HISTORY_LABEL.ratingFrom,
	projectedNext: PLAYER_PROJECTION_HISTORY_LABEL.projected,
	projectedStable: PLAYER_PROJECTION_HISTORY_LABEL.projectedStable,
	ratingTo: PLAYER_PROJECTION_HISTORY_LABEL.ratingTo,
	miss: PLAYER_PROJECTION_HISTORY_LABEL.miss,
	gap: PLAYER_PROJECTION_HISTORY_LABEL.gap,
} as const;

export type PlayerProjectionHistoryRow = {
	eventId: number;
	championshipId: number;
	startsAt: string;
	ratingFrom: number;
	ratingTo: number | null;
	rate: number;
	matches: number;
	gap: number;
	projectedNext: number;
	projectedStable: number;
	projectedRounds: number;
	projectedStop: PerformanceMapProjectedStop | null;
	miss: number | null;
	hasProjection: boolean;
	isFuture: boolean;
	fromSaved: boolean;
	isGoalkeeper: boolean;
};

export type PlayerProjectionHistoryChartPoint = {
	x: number;
	startsAt: string;
	actual: number | null;
	projected: number | null;
};

const PROFILE_PROJECTION_WINDOW_COUNT =
	PERFORMANCE_MAP_WINDOW_COUNT[PERFORMANCE_MAP_WINDOW_DEFAULT];

export const PLAYER_PROJECTION_HISTORY_NEXT_EVENT_ID = -1 as const;

export type PlayerProjectionHistoryOptions = {
	windowCount?: number;
	nextProjected?: number | null;
	currentRating?: number;
	isGoalkeeper?: boolean;
	nowIso?: string;
};

type AttendanceTrackInput = {
	rating: number;
	rating_delta: number;
	goalkeeper_rating?: number;
	goalkeeper_rating_delta?: number;
	is_goalkeeper?: boolean;
	wins: number;
	draws: number;
	losses: number;
	matches: number;
};

export function playerProjectionHistory(
	events: readonly PlayerProfileEventInput[],
	playerId: number,
	options: PlayerProjectionHistoryOptions = {},
): PlayerProjectionHistoryRow[] {
	const windowCount =
		options.windowCount ?? PROFILE_PROJECTION_WINDOW_COUNT;
	const timeline = projectionHistoryTimeline(events);

	const rows: PlayerProjectionHistoryRow[] = timeline.flatMap(
		(event, index) => {
			const attendance = event.attendance.find(
				(row) => row.player_id === playerId,
			);
			if (!attendance) {
				return [];
			}

			const isGoalkeeper = attendance.is_goalkeeper === true;
			const isFuture = !event.ended_at;
			const ratingFrom = attendanceTrackRating(attendance);
			const ratingDelta = attendanceTrackDelta(attendance);
			const ratingTo = isFuture
				? null
				: applyEventRatingDelta(ratingFrom, ratingDelta);
			const form = aggregateFormBefore(
				timeline,
				index,
				playerId,
				windowCount,
				isGoalkeeper,
			);
			const ceiling = championshipRatingCeiling(
				event.attendance.map((row) =>
					attendanceTrackRatingForCeiling(row, isGoalkeeper),
				),
			);
			const savedProjected = readSavedProjected(attendance.rating_projected);
			const rebuilt = rebuildProjection({
				ratingFrom,
				form,
				ceiling,
			});
			const projectedNext = savedProjected ?? rebuilt.projectedNext;
			const hasProjection =
				savedProjected !== null || rebuilt.hasProjection;
			const fromSaved = savedProjected !== null;
			const miss =
				hasProjection && ratingTo !== null
					? roundMiss(ratingTo - projectedNext)
					: null;

			const row: PlayerProjectionHistoryRow = {
				eventId: event.id,
				championshipId: event.championship_id,
				startsAt: event.starts_at,
				ratingFrom,
				ratingTo,
				rate: rebuilt.rate,
				matches: form?.matches ?? 0,
				gap: rebuilt.gap,
				projectedNext: hasProjection ? projectedNext : ratingFrom,
				projectedStable: rebuilt.projectedStable,
				projectedRounds: rebuilt.projectedRounds,
				projectedStop: rebuilt.projectedStop,
				miss,
				hasProjection,
				isFuture,
				fromSaved,
				isGoalkeeper,
			};
			return [row];
		},
	);

	const withNext = appendNextProjectionRow(rows, events, playerId, options);

	return withNext.sort((left, right) =>
		compareStartsAtNewestFirst(
			{ starts_at: left.startsAt, id: left.eventId },
			{ starts_at: right.startsAt, id: right.eventId },
		),
	);
}

function appendNextProjectionRow(
	rows: readonly PlayerProjectionHistoryRow[],
	events: readonly PlayerProfileEventInput[],
	playerId: number,
	options: PlayerProjectionHistoryOptions,
): PlayerProjectionHistoryRow[] {
	if (rows.some((row) => row.isFuture)) {
		return [...rows];
	}

	const savedNext = readSavedProjected(options.nextProjected);
	if (savedNext === null && options.currentRating === undefined) {
		return [...rows];
	}

	const isGoalkeeper = options.isGoalkeeper === true;
	const championshipId =
		events[0]?.championship_id ?? rows[0]?.championshipId ?? 0;
	const ratingFrom = playerProfileDelta(
		options.currentRating ?? rows[0]?.ratingTo ?? rows[0]?.ratingFrom ?? 0,
	);
	const timeline = projectionHistoryTimeline(events);
	const form = aggregateFormBefore(
		timeline,
		timeline.length,
		playerId,
		options.windowCount ?? PROFILE_PROJECTION_WINDOW_COUNT,
		isGoalkeeper,
	);
	const ceiling = championshipRatingCeiling([
		...timeline.flatMap((event) =>
			event.attendance.map((row) =>
				attendanceTrackRatingForCeiling(row, isGoalkeeper),
			),
		),
		ratingFrom,
	]);
	const rebuilt = rebuildProjection({ ratingFrom, form, ceiling });
	const projectedNext = savedNext ?? rebuilt.projectedNext;
	const hasProjection = savedNext !== null || rebuilt.hasProjection;
	if (!hasProjection) {
		return [...rows];
	}

	return [
		...rows,
		{
			eventId: PLAYER_PROJECTION_HISTORY_NEXT_EVENT_ID,
			championshipId,
			startsAt: options.nowIso ?? new Date().toISOString(),
			ratingFrom,
			ratingTo: null,
			rate: rebuilt.rate,
			matches: form?.matches ?? 0,
			gap: rebuilt.gap,
			projectedNext,
			projectedStable: rebuilt.projectedStable,
			projectedRounds: rebuilt.projectedRounds,
			projectedStop: rebuilt.projectedStop,
			miss: null,
			hasProjection: true,
			isFuture: true,
			fromSaved: savedNext !== null,
			isGoalkeeper,
		},
	];
}

export function playerProjectionHistoryChartSeries(
	rows: readonly PlayerProjectionHistoryRow[],
): PlayerProjectionHistoryChartPoint[] {
	const chronological = [...rows].reverse();

	return chronological.map((row, index) => ({
		x: index,
		startsAt: row.startsAt,
		actual: row.ratingTo,
		projected: row.hasProjection ? row.projectedNext : null,
	}));
}

export function playerProjectionHistoryEmptyLabel(
	rows: readonly PlayerProjectionHistoryRow[],
): string | null {
	if (rows.length === 0) {
		return PLAYER_PROJECTION_HISTORY_LABEL.empty;
	}

	return null;
}

export function formatPlayerProjectionHistoryGap(gap: number): string {
	return formatPerformanceMapGap(gap);
}

export function formatPlayerProjectionHistoryRating(value: number): string {
	return formatPerformanceMapRating(value);
}

export function formatPlayerProjectionHistoryMiss(
	miss: number | null,
): string {
	if (miss === null) {
		return "—";
	}

	return formatPlayerProfileDelta(miss);
}

export function formatPlayerProjectionHistoryRatingTo(
	row: PlayerProjectionHistoryRow,
): string {
	if (row.ratingTo === null) {
		return PLAYER_PROJECTION_HISTORY_LABEL.pendingRealized;
	}

	return formatEventRating(row.ratingTo);
}

export function formatPlayerProjectionHistoryProjected(
	row: PlayerProjectionHistoryRow,
): string {
	if (!row.hasProjection) {
		return PLAYER_PROJECTION_HISTORY_LABEL.emptyProjection;
	}

	return formatEventRating(row.projectedNext);
}

export function formatPlayerProjectionHistoryStable(
	row: PlayerProjectionHistoryRow,
): string {
	if (!row.hasProjection) {
		return PLAYER_PROJECTION_HISTORY_LABEL.emptyProjection;
	}

	return formatEventRating(row.projectedStable);
}

export function playerProjectionHistoryChartTickLabel(
	points: readonly PlayerProjectionHistoryChartPoint[],
	x: number,
): string {
	const current = points[x];
	if (!current) {
		return "";
	}

	return formatEventStartsAt(current.startsAt).date;
}

type FormAgg = {
	wins: number;
	draws: number;
	losses: number;
	matches: number;
};

type RebuiltProjection = {
	projectedNext: number;
	projectedStable: number;
	projectedRounds: number;
	projectedStop: PerformanceMapProjectedStop | null;
	rate: number;
	gap: number;
	hasProjection: boolean;
};

function projectionHistoryTimeline(
	events: readonly PlayerProfileEventInput[],
): PlayerProfileEventInput[] {
	return [...events].sort((left, right) =>
		compareStartsAtOldestFirst(
			{ starts_at: left.starts_at, id: left.id },
			{ starts_at: right.starts_at, id: right.id },
		),
	);
}

function attendanceTrackRating(row: AttendanceTrackInput): number {
	return eventActivePlayerRating(
		row.is_goalkeeper === true,
		playerProfileDelta(row.rating),
		playerProfileDelta(row.goalkeeper_rating),
	);
}

function attendanceTrackDelta(row: AttendanceTrackInput): number {
	if (row.is_goalkeeper === true) {
		return playerProfileDelta(row.goalkeeper_rating_delta);
	}

	return playerProfileDelta(row.rating_delta);
}

function attendanceTrackRatingForCeiling(
	row: AttendanceTrackInput,
	trackIsGoalkeeper: boolean,
): number {
	if (trackIsGoalkeeper) {
		if (row.is_goalkeeper !== true) {
			return 0;
		}

		return playerProfileDelta(row.goalkeeper_rating);
	}

	if (row.is_goalkeeper === true) {
		return 0;
	}

	return playerProfileDelta(row.rating);
}

function readSavedProjected(value: unknown): number | null {
	if (value === null || value === undefined) {
		return null;
	}

	const n = Number(value);
	if (!Number.isFinite(n)) {
		return null;
	}

	return n;
}

function rebuildProjection(input: {
	ratingFrom: number;
	form: FormAgg | null;
	ceiling: number;
}): RebuiltProjection {
	const { ratingFrom, form, ceiling } = input;
	if (!form || form.matches < EVENT_RATING_ADJUSTMENT.minMatches) {
		return {
			projectedNext: ratingFrom,
			projectedStable: ratingFrom,
			projectedRounds: 0,
			projectedStop: null,
			rate: 0,
			gap: 0,
			hasProjection: false,
		};
	}

	const rate = eventRatingRate(
		form.wins,
		form.draws,
		form.losses,
		form.matches,
	);
	const safeCeiling = Math.max(ceiling, 0.1);
	const gap = rate - ratingFrom / safeCeiling;
	const projection = performanceMapProjectRating({
		rating: ratingFrom,
		rate,
		matches: form.matches,
		ceiling,
	});

	return {
		projectedNext: projection.projectedNext,
		projectedStable: projection.projectedStable,
		projectedRounds: projection.projectedRounds,
		projectedStop: projection.projectedStop,
		rate,
		gap,
		hasProjection: true,
	};
}

function aggregateFormBefore(
	timelineOldestFirst: readonly PlayerProfileEventInput[],
	eventIndex: number,
	playerId: number,
	windowCount: number,
	isGoalkeeper: boolean,
): FormAgg | null {
	const priorPlayed = timelineOldestFirst
		.slice(0, eventIndex)
		.flatMap((event) => {
			if (!event.ended_at) {
				return [];
			}

			const row = event.attendance.find((item) => item.player_id === playerId);
			if (!row) {
				return [];
			}

			if ((row.is_goalkeeper === true) !== isGoalkeeper) {
				return [];
			}

			if (rosterSafeCount(row.matches) <= 0) {
				return [];
			}

			return [row];
		});
	const windowRows = priorPlayed.slice(-windowCount);
	if (windowRows.length === 0) {
		return null;
	}

	return windowRows.reduce<FormAgg>(
		(sum, row) => ({
			wins: sum.wins + rosterSafeCount(row.wins),
			draws: sum.draws + rosterSafeCount(row.draws),
			losses: sum.losses + rosterSafeCount(row.losses),
			matches: sum.matches + rosterSafeCount(row.matches),
		}),
		{ wins: 0, draws: 0, losses: 0, matches: 0 },
	);
}

function roundMiss(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}

	if (value < 0) {
		return -Math.round(Math.abs(value) * 10) / 10;
	}

	return Math.round(Math.abs(value) * 10) / 10;
}
