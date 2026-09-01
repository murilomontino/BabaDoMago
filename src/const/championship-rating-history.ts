import { includeDefined, includeWhen } from "../lib/include-when.ts";
import {
	compareStartsAtOldestFirst,
	formatEventStartsAt,
} from "./championship-event.ts";
import { playerVisibleName } from "./player-name.ts";
import {
	type PlayerProfileEventInput,
	type PlayerProfileHistoryRow,
	playerProfileDelta,
	playerProfileHistory,
} from "./player-profile.ts";
import { PLAYER_RATING } from "./player-rating.ts";

export const CHAMPIONSHIP_RATING_HISTORY_LABEL = {
	title: "Evolução da nota",
	all: "Todos",
	none: "Nenhum",
	empty: "Nenhuma rodada encerrada",
	emptyRatings: "Ainda sem nota",
} as const;

export const CHAMPIONSHIP_RATING_HISTORY_CHART = {
	height: 280,
	indexKey: "x",
	avatarSize: 24,
	dotRadius: 3,
	labelFontSize: 12,
	margin: { top: 16, right: 28, bottom: 8, left: 0 },
} as const;

export const CHAMPIONSHIP_RATING_HISTORY_CHIP = {
	base: "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition",
	on: "bg-pitch text-white hover:bg-pitch-dark",
	off: "bg-surface-muted text-fg-muted hover:bg-black/10 hover:text-fg",
} as const;

export const CHAMPIONSHIP_RATING_CHART_COLOR = [
	"#0f766e",
	"#dc2626",
	"#2563eb",
	"#7c3aed",
	"#c2410c",
	"#0891b2",
	"#be185d",
	"#3f6212",
	"#4338ca",
	"#b91c1c",
	"#0e7490",
	"#a21caf",
] as const;

export type ChampionshipRatingHistoryPlayer = {
	id: number;
	display_name: string;
	nickname: string | null;
	avatar_url: string | null;
	rating: number;
};

export type ChampionshipRatingHistorySeries = {
	playerId: number;
	name: string;
	avatarUrl: string | null;
	color: string;
	dataKey: string;
};

export type ChampionshipRatingHistoryChartPoint = {
	x: number;
	startsAt: string;
	[dataKey: string]: number | string | null;
};

export type ChampionshipRatingHistoryChart = {
	rows: ChampionshipRatingHistoryChartPoint[];
	series: ChampionshipRatingHistorySeries[];
};

const RATING_HISTORY_ENTRY_ROW = -1;

type RatingHistoryEntry = {
	index: number;
	rating: number;
};

type SeriesValues = {
	series: ChampionshipRatingHistorySeries;
	values: readonly (number | null)[];
	entry: RatingHistoryEntry | null;
};

export function championshipRatingChartDataKey(playerId: number): string {
	return `p${playerId}`;
}

export function championshipRatingChartColor(playerId: number): string {
	const colors = CHAMPIONSHIP_RATING_CHART_COLOR;
	const color = colors[Math.abs(playerId) % colors.length];
	if (color) {
		return color;
	}

	return CHAMPIONSHIP_RATING_CHART_COLOR[0];
}

export function championshipRatingHistoryChipClass(on: boolean): string {
	if (on) {
		return `${CHAMPIONSHIP_RATING_HISTORY_CHIP.base} ${CHAMPIONSHIP_RATING_HISTORY_CHIP.on}`;
	}

	return `${CHAMPIONSHIP_RATING_HISTORY_CHIP.base} ${CHAMPIONSHIP_RATING_HISTORY_CHIP.off}`;
}

export function officialEventRating(value: number): number | null {
	if (value === PLAYER_RATING.default) {
		return null;
	}

	return value;
}

export function championshipRatingHistoryTickLabel(
	rows: readonly ChampionshipRatingHistoryChartPoint[],
	x: number,
): string {
	const row = rows[x];
	if (!row) {
		return "";
	}

	const next = rows[x + 1];
	if (next && next.startsAt === row.startsAt) {
		return "";
	}

	return formatEventStartsAt(row.startsAt).date;
}

export function championshipRatingHistoryPlayerIds(
	series: readonly ChampionshipRatingHistorySeries[],
): number[] {
	return series.map((item) => item.playerId);
}

export function championshipRatingHistorySelection(
	selected: ReadonlySet<number> | null,
	playerIds: readonly number[],
): Set<number> {
	if (selected) {
		return new Set(selected);
	}

	return new Set(playerIds);
}

export function toggleChampionshipRatingHistoryPlayer(
	selected: ReadonlySet<number>,
	playerId: number,
): Set<number> {
	const next = new Set(selected);
	if (!next.has(playerId)) {
		next.add(playerId);
		return next;
	}

	next.delete(playerId);
	return next;
}

export function championshipRatingHistoryAllSelected(
	playerIds: readonly number[],
	selected: ReadonlySet<number>,
): boolean {
	if (playerIds.length === 0) {
		return false;
	}

	return playerIds.every((playerId) => selected.has(playerId));
}

export function visibleChampionshipRatingHistorySeries(
	series: readonly ChampionshipRatingHistorySeries[],
	selected: ReadonlySet<number>,
): ChampionshipRatingHistorySeries[] {
	return series.flatMap((item) =>
		includeWhen(selected.has(item.playerId), item),
	);
}

export function championshipRatingHistoryEmptyLabel(
	chart: ChampionshipRatingHistoryChart,
): string | null {
	if (chart.rows.length === 0) {
		return CHAMPIONSHIP_RATING_HISTORY_LABEL.empty;
	}

	if (chart.series.length === 0) {
		return CHAMPIONSHIP_RATING_HISTORY_LABEL.emptyRatings;
	}

	return null;
}

export function championshipRatingHistoryChart(
	players: readonly ChampionshipRatingHistoryPlayer[],
	events: readonly PlayerProfileEventInput[],
	nowIso: string | null,
): ChampionshipRatingHistoryChart {
	const ended = endedChampionshipHistoryEvents(events);
	const firstEvent = ended[0];
	if (!firstEvent) {
		return { rows: [], series: [] };
	}

	const seriesWithValues = players.flatMap((player) =>
		includeDefinedSeries(player, ended, nowIso),
	);
	const needsEntryRow = seriesWithValues.some(
		(item) => item.entry?.index === RATING_HISTORY_ENTRY_ROW,
	);
	const withEntry = seriesWithValues.map((item) => ({
		series: item.series,
		values: valuesWithEntryRating(item, needsEntryRow),
		entry: item.entry,
	}));
	const dates = [
		...includeWhen(needsEntryRow, firstEvent.starts_at),
		...ended.map((event) => event.starts_at),
		...includeDefined(nowIso),
	];
	const rows = dates.map((startsAt, index) =>
		championshipHistoryChartRow(index, startsAt, withEntry, index),
	);

	return {
		rows,
		series: seriesWithValues.map((item) => item.series),
	};
}

export function endedChampionshipHistoryEvents<
	T extends { id: number; starts_at: string; ended_at: string | null },
>(events: readonly T[]): T[] {
	return events
		.flatMap((event) => {
			if (!event.ended_at) {
				return [];
			}

			return [event];
		})
		.sort((left, right) =>
			compareStartsAtOldestFirst(
				{ starts_at: left.starts_at, id: left.id },
				{ starts_at: right.starts_at, id: right.id },
			),
		);
}

export function championshipHistorySeries(player: {
	id: number;
	display_name: string;
	nickname: string | null;
	avatar_url: string | null;
}): ChampionshipRatingHistorySeries {
	return {
		playerId: player.id,
		name: playerVisibleName(player),
		avatarUrl: player.avatar_url,
		color: championshipRatingChartColor(player.id),
		dataKey: championshipRatingChartDataKey(player.id),
	};
}

export function championshipHistoryChartRow(
	x: number,
	startsAt: string,
	seriesWithValues: readonly {
		series: ChampionshipRatingHistorySeries;
		values: readonly (number | null)[];
	}[],
	valueIndex: number,
): ChampionshipRatingHistoryChartPoint {
	const ratings = Object.fromEntries(
		seriesWithValues.map((item) => [
			item.series.dataKey,
			item.values[valueIndex] ?? null,
		]),
	);

	return { x, startsAt, ...ratings };
}

export function championshipHistoryPlayerAttended(
	events: readonly PlayerProfileEventInput[],
	playerId: number,
): boolean {
	return events.some((event) =>
		event.attendance.some((row) => row.player_id === playerId),
	);
}

function includeDefinedSeries(
	player: ChampionshipRatingHistoryPlayer,
	events: readonly PlayerProfileEventInput[],
	nowIso: string | null,
): SeriesValues[] {
	const history = playerProfileHistory(events, player.id);
	const values = playerRatingValuesAlongEvents(
		events,
		history,
		player.rating,
		nowIso,
	);
	if (!valuesIncludeOfficialRating(values)) {
		return [];
	}

	return [
		{
			series: championshipHistorySeries(player),
			values,
			entry: playerRatingEntryPoint(events, history),
		},
	];
}

function playerRatingEntryPoint(
	events: readonly PlayerProfileEventInput[],
	history: readonly PlayerProfileHistoryRow[],
): RatingHistoryEntry | null {
	const byEvent = new Map(history.map((row) => [row.eventId, row.ratingFrom]));
	const first = events.findIndex((event) => byEvent.has(event.id));
	const firstEvent = events[first];
	if (!firstEvent) {
		return null;
	}

	const ratingFrom = byEvent.get(firstEvent.id);
	if (ratingFrom === undefined) {
		return null;
	}

	const rating = officialEventRating(ratingFrom);
	if (rating === null) {
		return null;
	}

	return { index: first - 1, rating };
}

function entryRowOffset(needsEntryRow: boolean): number {
	if (needsEntryRow) {
		return 1;
	}

	return 0;
}

function valueOrEntry(
	value: number | null,
	isSlot: boolean,
	rating: number,
): number | null {
	if (isSlot) {
		return rating;
	}

	return value;
}

function valuesWithEntryRating(
	item: SeriesValues,
	needsEntryRow: boolean,
): (number | null)[] {
	const offset = entryRowOffset(needsEntryRow);
	const base = [...includeWhen(needsEntryRow, null), ...item.values];
	const entry = item.entry;
	if (!entry) {
		return base;
	}

	const slot = entry.index + offset;
	if (slot < 0) {
		return base;
	}

	return base.map((value, index) =>
		valueOrEntry(value, index === slot, entry.rating),
	);
}

function playerRatingValuesAlongEvents(
	events: readonly PlayerProfileEventInput[],
	history: readonly PlayerProfileHistoryRow[],
	currentRating: number,
	nowIso: string | null,
): (number | null)[] {
	const byEvent = new Map(history.map((row) => [row.eventId, row.ratingTo]));
	const walked = events.reduce<{
		last: number | null;
		values: (number | null)[];
	}>(
		(state, event) => {
			const last = ratingAfterEvent(state.last, byEvent.get(event.id));
			return {
				last,
				values: [...state.values, last],
			};
		},
		{ last: null, values: [] },
	);
	if (!nowIso) {
		return walked.values;
	}

	const nowRating =
		officialEventRating(playerProfileDelta(currentRating)) ?? walked.last;

	return [...walked.values, nowRating];
}

function ratingAfterEvent(
	last: number | null,
	attendedTo: number | undefined,
): number | null {
	if (attendedTo === undefined) {
		return last;
	}

	return officialEventRating(attendedTo) ?? last;
}

function valuesIncludeOfficialRating(
	values: readonly (number | null)[],
): boolean {
	return values.some((value) => value !== null);
}
