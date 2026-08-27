import { includeWhen } from "../lib/include-when.ts";
import {
	compareStartsAtOldestFirst,
	formatEventStartsAt,
} from "./championship-event.ts";
import { playerVisibleName } from "./player-name.ts";
import {
	type PlayerProfileEventInput,
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

type SeriesValues = {
	series: ChampionshipRatingHistorySeries;
	values: readonly (number | null)[];
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
	nowIso: string,
): ChampionshipRatingHistoryChart {
	const ended = endedChampionshipEvents(events);
	if (ended.length === 0) {
		return { rows: [], series: [] };
	}

	const seriesWithValues = players.flatMap((player) =>
		includeDefinedSeries(player, ended),
	);
	const rows = [
		...ended.map((event, index) =>
			chartRow(index, event.starts_at, seriesWithValues, index),
		),
		chartRow(ended.length, nowIso, seriesWithValues, ended.length),
	];

	return {
		rows,
		series: seriesWithValues.map((item) => item.series),
	};
}

function endedChampionshipEvents(
	events: readonly PlayerProfileEventInput[],
): PlayerProfileEventInput[] {
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

function includeDefinedSeries(
	player: ChampionshipRatingHistoryPlayer,
	events: readonly PlayerProfileEventInput[],
): SeriesValues[] {
	const values = playerRatingValuesAlongEvents(
		events,
		playerProfileHistory(events, player.id),
		player.rating,
	);
	if (!valuesIncludeOfficialRating(values)) {
		return [];
	}

	return [
		{
			series: {
				playerId: player.id,
				name: playerVisibleName(player),
				avatarUrl: player.avatar_url,
				color: championshipRatingChartColor(player.id),
				dataKey: championshipRatingChartDataKey(player.id),
			},
			values,
		},
	];
}

function playerRatingValuesAlongEvents(
	events: readonly PlayerProfileEventInput[],
	history: readonly { eventId: number; ratingTo: number }[],
	currentRating: number,
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

function chartRow(
	x: number,
	startsAt: string,
	seriesWithValues: readonly SeriesValues[],
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
