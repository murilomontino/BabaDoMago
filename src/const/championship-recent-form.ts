import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	EVENT_RATING_ADJUSTMENT,
	eventRatingInDeadZone,
	eventRatingRate,
	formatEventRating,
} from "./event-rating-adjustment.ts";
import { playerVisibleName } from "./player-name.ts";
import { PLAYER_RATING } from "./player-rating.ts";
import {
	formatRosterCount,
	formatRosterWinRate,
	rosterSafeCount,
} from "./roster-stats.ts";

export const RECENT_FORM_TREND = {
	up: "up",
	down: "down",
	deadZone: "deadZone",
	seed: "seed",
	insufficient: "insufficient",
} as const;

export type RecentFormTrend =
	(typeof RECENT_FORM_TREND)[keyof typeof RECENT_FORM_TREND];

export const RECENT_FORM_LABEL = {
	title: "Forma recente",
	empty: "Ninguém com jogos na janela",
	hint: "Aproveitamento da fórmula da nota. Zona morta não conta como queda.",
	rate: "Aproveitamento",
	ratingDelta: "Δ nota",
	voteDelta: "Voto",
	trend: "Tendência",
	[RECENT_FORM_TREND.up]: "Em alta",
	[RECENT_FORM_TREND.down]: "Em baixa",
	[RECENT_FORM_TREND.deadZone]: "Zona morta",
	[RECENT_FORM_TREND.seed]: "Semente",
	[RECENT_FORM_TREND.insufficient]: "Poucos jogos",
	wins: "V",
	draws: "E",
	losses: "D",
	matches: "J",
} as const;

export const RECENT_FORM_COLUMN = {
	player: "player",
	matches: "matches",
	wins: "wins",
	draws: "draws",
	losses: "losses",
	rate: "rate",
	ratingDelta: "ratingDelta",
	voteDelta: "voteDelta",
	trend: "trend",
} as const;

export type RecentFormColumnId =
	(typeof RECENT_FORM_COLUMN)[keyof typeof RECENT_FORM_COLUMN];

export type RecentFormRow = {
	player: ChampionshipPlayer;
	wins: number;
	draws: number;
	losses: number;
	matches: number;
	rate: number;
	ratingDeltaSum: number;
	voteDeltaSum: number;
	trend: RecentFormTrend;
};

type AttendanceAgg = {
	wins: number;
	draws: number;
	losses: number;
	matches: number;
	ratingDeltaSum: number;
	voteDeltaSum: number;
	eventsWithMatches: number;
	seedOnly: boolean;
};

export function championshipRecentForm(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
): RecentFormRow[] {
	const byPlayer = new Map<number, AttendanceAgg>();

	for (const event of events) {
		for (const row of event.attendance) {
			const matches = rosterSafeCount(row.matches);
			const wins = rosterSafeCount(row.wins);
			const draws = rosterSafeCount(row.draws);
			const losses = rosterSafeCount(row.losses);
			const prev = byPlayer.get(row.player_id) ?? emptyAgg();
			const next: AttendanceAgg = {
				wins: prev.wins + wins,
				draws: prev.draws + draws,
				losses: prev.losses + losses,
				matches: prev.matches + matches,
				ratingDeltaSum: prev.ratingDeltaSum + row.rating_delta,
				voteDeltaSum: prev.voteDeltaSum + row.vote_rating_delta,
				eventsWithMatches:
					prev.eventsWithMatches +
					Number(matches >= EVENT_RATING_ADJUSTMENT.minMatches),
				seedOnly: prev.seedOnly && row.rating === PLAYER_RATING.default,
			};
			byPlayer.set(row.player_id, next);
		}
	}

	const rows = players.flatMap((player) => {
		const agg = byPlayer.get(player.id);
		if (!agg || agg.matches === 0) {
			return [];
		}

		const rate = eventRatingRate(agg.wins, agg.draws, agg.losses, agg.matches);
		return [
			{
				player,
				wins: agg.wins,
				draws: agg.draws,
				losses: agg.losses,
				matches: agg.matches,
				rate,
				ratingDeltaSum: roundAwayFromZero1(agg.ratingDeltaSum),
				voteDeltaSum: roundAwayFromZero1(agg.voteDeltaSum),
				trend: recentFormTrend(agg),
			},
		];
	});

	return rows.sort(compareRecentFormRows);
}

export function formatRecentFormRate(rate: number): string {
	return formatRosterWinRate(rate);
}

export function formatRecentFormDelta(value: number): string {
	if (value > 0) {
		return `+${formatEventRating(value)}`;
	}

	return formatEventRating(value);
}

export function recentFormTrendLabel(trend: RecentFormTrend): string {
	return RECENT_FORM_LABEL[trend];
}

function emptyAgg(): AttendanceAgg {
	return {
		wins: 0,
		draws: 0,
		losses: 0,
		matches: 0,
		ratingDeltaSum: 0,
		voteDeltaSum: 0,
		eventsWithMatches: 0,
		seedOnly: true,
	};
}

function recentFormTrend(agg: AttendanceAgg): RecentFormTrend {
	if (agg.matches < EVENT_RATING_ADJUSTMENT.minMatches) {
		return RECENT_FORM_TREND.insufficient;
	}

	if (agg.seedOnly && agg.eventsWithMatches === 1) {
		return RECENT_FORM_TREND.seed;
	}

	if (eventRatingInDeadZone(agg.wins, agg.draws, agg.losses, agg.matches)) {
		return RECENT_FORM_TREND.deadZone;
	}

	const rate = eventRatingRate(agg.wins, agg.draws, agg.losses, agg.matches);
	if (rate > EVENT_RATING_ADJUSTMENT.upThreshold) {
		return RECENT_FORM_TREND.up;
	}

	if (rate < EVENT_RATING_ADJUSTMENT.downThreshold) {
		return RECENT_FORM_TREND.down;
	}

	return RECENT_FORM_TREND.deadZone;
}

function compareRecentFormRows(
	left: RecentFormRow,
	right: RecentFormRow,
): number {
	const leftInsufficient = left.trend === RECENT_FORM_TREND.insufficient;
	const rightInsufficient = right.trend === RECENT_FORM_TREND.insufficient;
	if (leftInsufficient !== rightInsufficient) {
		return Number(leftInsufficient) - Number(rightInsufficient);
	}

	if (right.rate !== left.rate) {
		return right.rate - left.rate;
	}

	if (right.matches !== left.matches) {
		return right.matches - left.matches;
	}

	return playerVisibleName(left.player).localeCompare(
		playerVisibleName(right.player),
		"pt",
	);
}

function signedUnit(value: number): number {
	if (value < 0) {
		return -1;
	}

	return 1;
}

function roundAwayFromZero1(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}

	return (signedUnit(value) * Math.round(Math.abs(value) * 10)) / 10;
}

export function formatRecentFormCount(value: number): string {
	return formatRosterCount(value);
}

export const RECENT_FORM_STAT_COLUMNS = [
	RECENT_FORM_COLUMN.matches,
	RECENT_FORM_COLUMN.wins,
	RECENT_FORM_COLUMN.draws,
	RECENT_FORM_COLUMN.losses,
	RECENT_FORM_COLUMN.rate,
	RECENT_FORM_COLUMN.ratingDelta,
	RECENT_FORM_COLUMN.voteDelta,
	RECENT_FORM_COLUMN.trend,
] as const;

export function formatRecentFormStat(
	column: (typeof RECENT_FORM_STAT_COLUMNS)[number],
	row: RecentFormRow,
): string {
	switch (column) {
		case RECENT_FORM_COLUMN.matches:
			return formatRecentFormCount(row.matches);
		case RECENT_FORM_COLUMN.wins:
			return formatRecentFormCount(row.wins);
		case RECENT_FORM_COLUMN.draws:
			return formatRecentFormCount(row.draws);
		case RECENT_FORM_COLUMN.losses:
			return formatRecentFormCount(row.losses);
		case RECENT_FORM_COLUMN.rate:
			return formatRecentFormRate(row.rate);
		case RECENT_FORM_COLUMN.ratingDelta:
			return formatRecentFormDelta(row.ratingDeltaSum);
		case RECENT_FORM_COLUMN.voteDelta:
			return formatRecentFormDelta(row.voteDeltaSum);
		case RECENT_FORM_COLUMN.trend:
			return recentFormTrendLabel(row.trend);
		default: {
			const _never: never = column;
			return _never;
		}
	}
}
