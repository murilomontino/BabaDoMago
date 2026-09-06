import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	endedChampionshipHistoryEvents,
	officialEventRating,
} from "./championship-rating-history.ts";
import type { TrendsPlayerScope } from "./championship-trends-player-scope.ts";
import {
	trendsPlayerInScope,
	trendsScopedRosterPlayers,
} from "./championship-trends-player-scope.ts";
import {
	applyEventRatingDelta,
	formatEventRating,
} from "./event-rating-adjustment.ts";
import { playerProfileDelta } from "./player-profile.ts";
import {
	championshipRatingCeiling,
	championshipRatingFloor,
	PLAYER_RATING,
} from "./player-rating.ts";
import { rosterAverage } from "./roster-stats.ts";

export const RATING_INFLATION_LABEL = {
	title: "Inflação da nota",
	empty: "Nenhuma rodada com presentes ranqueados",
	hint: "Média dos presentes ranqueados, teto e piso do elenco após cada rodada.",
	average: "Média",
	ceiling: "Teto",
	floor: "Piso",
} as const;

export const RATING_INFLATION_CHART = {
	height: 280,
	indexKey: "x",
	averageKey: "averageRating",
	ceilingKey: "ceiling",
	floorKey: "floor",
	averageLabelKey: "averageLabel",
	ceilingLabelKey: "ceilingLabel",
	floorLabelKey: "floorLabel",
	margin: { top: 32, right: 28, bottom: 8, left: 0 },
	axisWidth: 44,
	labelFontSize: 12,
	labelOffset: 12,
	dotRadius: 4,
	averageStroke: "#0f766e",
	ceilingStroke: "#b45309",
	floorStroke: "#475569",
} as const;

export type RatingInflationRow = {
	eventId: number;
	startsAt: string;
	averageRating: number;
	ceiling: number;
	floor: number;
};

export type RatingInflationSummary = {
	events: number;
	rows: RatingInflationRow[];
};

export type RatingInflationChartPoint = {
	x: number;
	startsAt: string;
	averageRating: number;
	ceiling: number;
	floor: number;
	averageLabel: string;
	ceilingLabel: string;
	floorLabel: string;
};

export function championshipRatingInflation(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
	playerIds: TrendsPlayerScope = null,
): RatingInflationSummary {
	const roster = trendsScopedRosterPlayers(players, playerIds);
	const ended = endedChampionshipHistoryEvents(events);
	const playerRatings = new Map<number, number>();
	const rows: RatingInflationRow[] = [];
	const first = ended[0];
	if (first) {
		const entry = inflationEntryRow(first, roster, playerIds, playerRatings);
		if (entry) {
			rows.push(entry);
		}
	}

	for (const event of ended) {
		for (const row of event.attendance) {
			if (!trendsPlayerInScope(row.player_id, playerIds)) {
				continue;
			}

			const ratingTo = attendanceRatingAfterEvent(row);
			playerRatings.set(row.player_id, ratingTo);
		}

		const scopedAttendance = event.attendance.filter((row) =>
			trendsPlayerInScope(row.player_id, playerIds),
		);
		const averageRating = presentAverageRatingAfter(scopedAttendance);
		if (averageRating === null) {
			continue;
		}

		rows.push({
			eventId: event.id,
			startsAt: event.starts_at,
			averageRating,
			ceiling: rosterInflationCeiling(roster, playerRatings),
			floor: rosterInflationFloor(roster, playerRatings),
		});
	}

	return {
		events: rows.length,
		rows,
	};
}

export function championshipRatingInflationChart(
	summary: RatingInflationSummary,
): RatingInflationChartPoint[] {
	return summary.rows.map((row, index) => ({
		x: index,
		startsAt: row.startsAt,
		averageRating: row.averageRating,
		ceiling: row.ceiling,
		floor: row.floor,
		averageLabel: formatRatingInflationValue(row.averageRating),
		ceilingLabel: formatRatingInflationValue(row.ceiling),
		floorLabel: formatRatingInflationValue(row.floor),
	}));
}

export function formatRatingInflationValue(value: number): string {
	return formatEventRating(value);
}

type AttendanceRatingRow = {
	player_id: number;
	rating: number;
	rating_delta: number;
	vote_rating_delta: number;
};

function inflationEntryRow(
	event: ChampionshipEvent,
	roster: readonly ChampionshipPlayer[],
	playerIds: TrendsPlayerScope,
	playerRatings: Map<number, number>,
): RatingInflationRow | null {
	const scopedAttendance = event.attendance.filter((row) =>
		trendsPlayerInScope(row.player_id, playerIds),
	);
	for (const row of scopedAttendance) {
		seedPlayerRatingFromAttendance(playerRatings, row);
	}

	const averageRating = presentAverageRatingFrom(scopedAttendance);
	if (averageRating === null) {
		playerRatings.clear();
		return null;
	}

	return {
		eventId: event.id,
		startsAt: event.starts_at,
		averageRating,
		ceiling: rosterInflationCeiling(roster, playerRatings),
		floor: rosterInflationFloor(roster, playerRatings),
	};
}

function seedPlayerRatingFromAttendance(
	playerRatings: Map<number, number>,
	row: AttendanceRatingRow,
): void {
	const ratingFrom = officialEventRating(playerProfileDelta(row.rating));
	if (ratingFrom === null) {
		return;
	}

	playerRatings.set(row.player_id, ratingFrom);
}

function attendanceRatingAfterEvent(row: AttendanceRatingRow): number {
	const ratingFrom = playerProfileDelta(row.rating);
	const delta =
		playerProfileDelta(row.rating_delta) +
		playerProfileDelta(row.vote_rating_delta);
	return applyEventRatingDelta(ratingFrom, delta);
}

function presentAverageRatingFrom(
	attendance: readonly AttendanceRatingRow[],
): number | null {
	return averageOfficialRatings(
		attendance.flatMap((row) => {
			const rating = officialEventRating(playerProfileDelta(row.rating));
			if (rating === null) {
				return [];
			}

			return [rating];
		}),
	);
}

function presentAverageRatingAfter(
	attendance: readonly AttendanceRatingRow[],
): number | null {
	return averageOfficialRatings(
		attendance.flatMap((row) => {
			const rating = officialEventRating(attendanceRatingAfterEvent(row));
			if (rating === null) {
				return [];
			}

			return [rating];
		}),
	);
}

function averageOfficialRatings(official: readonly number[]): number | null {
	if (official.length === 0) {
		return null;
	}

	return rosterAverage(
		official.reduce((sum, rating) => sum + rating, 0),
		official.length,
	);
}

function rosterInflationRatings(
	roster: readonly ChampionshipPlayer[],
	playerRatings: ReadonlyMap<number, number>,
): number[] {
	return roster.map(
		(player) => playerRatings.get(player.id) ?? PLAYER_RATING.default,
	);
}

function rosterInflationCeiling(
	roster: readonly ChampionshipPlayer[],
	playerRatings: ReadonlyMap<number, number>,
): number {
	return championshipRatingCeiling(
		rosterInflationRatings(roster, playerRatings),
	);
}

function rosterInflationFloor(
	roster: readonly ChampionshipPlayer[],
	playerRatings: ReadonlyMap<number, number>,
): number {
	return championshipRatingFloor(rosterInflationRatings(roster, playerRatings));
}
