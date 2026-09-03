import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	endedChampionshipHistoryEvents,
	officialEventRating,
} from "./championship-rating-history.ts";
import {
	applyEventRatingDelta,
	formatEventRating,
} from "./event-rating-adjustment.ts";

export const RATING_INFLATION_LABEL = {
	title: "Inflação da nota",
	empty: "Nenhuma rodada com presentes ranqueados",
	hint: "Média dos presentes ranqueados e teto da fórmula após cada rodada. Não é culpa individual.",
	average: "Média",
	ceiling: "Teto",
} as const;

export const RATING_INFLATION_CHART = {
	height: 280,
	indexKey: "x",
	averageKey: "averageRating",
	ceilingKey: "ceiling",
	averageLabelKey: "averageLabel",
	ceilingLabelKey: "ceilingLabel",
	margin: { top: 32, right: 28, bottom: 8, left: 0 },
	axisWidth: 44,
	labelFontSize: 12,
	labelOffset: 12,
	dotRadius: 4,
	averageStroke: "#0f766e",
	ceilingStroke: "#b45309",
} as const;

export type RatingInflationRow = {
	eventId: number;
	startsAt: string;
	averageRating: number;
	ceiling: number;
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
	averageLabel: string;
	ceilingLabel: string;
};

export function championshipRatingInflation(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
): RatingInflationSummary {
	const ended = endedChampionshipHistoryEvents(events);
	const playerRatings = new Map<number, number>();
	const rows: RatingInflationRow[] = [];

	for (const event of ended) {
		for (const row of event.attendance) {
			const ratingTo = attendanceRatingAfterEvent(row);
			playerRatings.set(row.player_id, ratingTo);
		}

		const averageRating = presentAverageRating(event.attendance);
		if (averageRating === null) {
			continue;
		}

		const ceiling = championshipRatingCeiling(
			players.map((player) => playerRatings.get(player.id) ?? PLAYER_RATING.default),
		);

		rows.push({
			eventId: event.id,
			startsAt: event.starts_at,
			averageRating,
			ceiling,
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
		averageLabel: formatRatingInflationValue(row.averageRating),
		ceilingLabel: formatRatingInflationValue(row.ceiling),
	}));
}

export function formatRatingInflationValue(value: number): string {
	return formatEventRating(value);
}

function attendanceRatingAfterEvent(row: {
	rating: number;
	rating_delta: number;
	vote_rating_delta: number;
}): number {
	const ratingFrom = playerProfileDelta(row.rating);
	const delta = playerProfileDelta(row.rating_delta) + playerProfileDelta(row.vote_rating_delta);
	return applyEventRatingDelta(ratingFrom, delta);
}

function presentAverageRating(
	attendance: readonly {
		rating: number;
		rating_delta: number;
		vote_rating_delta: number;
	}[],
): number | null {
	const official = attendance.flatMap((row) => {
		const rating = officialEventRating(attendanceRatingAfterEvent(row));
		if (rating === null) {
			return [];
		}

		return [rating];
	});

	if (official.length === 0) {
		return null;
	}

	return rosterAverage(
		official.reduce((sum, rating) => sum + rating, 0),
		official.length,
	);
}
