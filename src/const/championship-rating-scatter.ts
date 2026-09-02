import { includeDefined } from "../lib/include-when.ts";
import {
	championshipRatingChartColor,
	endedChampionshipHistoryEvents,
	officialEventRating,
} from "./championship-rating-history.ts";
import { playerVisibleName } from "./player-name.ts";
import {
	type PlayerProfileEventInput,
	type PlayerProfileHistoryRow,
	playerProfileHistory,
} from "./player-profile.ts";
import { PLAYER_RATING } from "./player-rating.ts";

export const CHAMPIONSHIP_RATING_SCATTER_KIND = {
	initial: "initial",
	current: "current",
} as const;

export type ChampionshipRatingScatterKind =
	(typeof CHAMPIONSHIP_RATING_SCATTER_KIND)[keyof typeof CHAMPIONSHIP_RATING_SCATTER_KIND];

export const CHAMPIONSHIP_RATING_SCATTER_LABEL = {
	initial: "Nota inicial",
	current: "Nota atual",
	rating: "Nota",
	empty: "Ainda sem nota",
} as const;

export const CHAMPIONSHIP_RATING_SCATTER_CHART = {
	height: 280,
	xKey: "x",
	yKey: "rating",
	nameKey: "name",
	dotRadius: 5,
	labelOffset: 8,
	labelFontSize: 11,
	margin: { top: 24, right: 28, bottom: 8, left: 0 },
	domainPad: 0.5,
	axisWidth: 36,
} as const;

export type ChampionshipRatingScatterPlayer = {
	id: number;
	display_name: string;
	nickname: string | null;
	avatar_url: string | null;
	rating: number;
};

export type ChampionshipRatingScatterPoint = {
	playerId: number;
	name: string;
	avatarUrl: string | null;
	color: string;
	initialRating: number;
	currentRating: number;
};

export type ChampionshipRatingScatterSeriesPoint = {
	x: number;
	rating: number;
	playerId: number;
	name: string;
	avatarUrl: string | null;
	color: string;
};

export type ChampionshipRatingScatterDomain = {
	min: number;
	max: number;
};

export function championshipRatingScatterPoints(
	players: readonly ChampionshipRatingScatterPlayer[],
	events: readonly PlayerProfileEventInput[],
): ChampionshipRatingScatterPoint[] {
	const ended = endedChampionshipHistoryEvents(events);

	return players.flatMap((player) =>
		includeDefined(scatterPointForPlayer(player, ended)),
	);
}

export function championshipRatingScatterSeries(
	points: readonly ChampionshipRatingScatterPoint[],
	kind: ChampionshipRatingScatterKind,
): ChampionshipRatingScatterSeriesPoint[] {
	return [...points]
		.sort(
			(left, right) => ratingForKind(right, kind) - ratingForKind(left, kind),
		)
		.map((point, index) => ({
			x: index,
			rating: ratingForKind(point, kind),
			playerId: point.playerId,
			name: point.name,
			avatarUrl: point.avatarUrl,
			color: point.color,
		}));
}

export function championshipRatingScatterTitle(
	kind: ChampionshipRatingScatterKind,
): string {
	if (kind === CHAMPIONSHIP_RATING_SCATTER_KIND.initial) {
		return CHAMPIONSHIP_RATING_SCATTER_LABEL.initial;
	}

	return CHAMPIONSHIP_RATING_SCATTER_LABEL.current;
}

export function championshipRatingScatterEmptyLabel(
	points: readonly ChampionshipRatingScatterPoint[],
): string | null {
	if (points.length === 0) {
		return CHAMPIONSHIP_RATING_SCATTER_LABEL.empty;
	}

	return null;
}

export function championshipRatingScatterDomain(
	series: readonly ChampionshipRatingScatterSeriesPoint[],
): ChampionshipRatingScatterDomain {
	const values = series.map((point) => point.rating);
	if (values.length === 0) {
		return {
			min: PLAYER_RATING.min,
			max: PLAYER_RATING.initialCeiling,
		};
	}

	const rawMin = Math.min(...values);
	const rawMax = Math.max(...values);
	const pad = CHAMPIONSHIP_RATING_SCATTER_CHART.domainPad;
	const min = Math.max(PLAYER_RATING.min, rawMin - pad);
	const max = Math.max(min + pad, rawMax + pad);

	return { min, max };
}

function ratingForKind(
	point: ChampionshipRatingScatterPoint,
	kind: ChampionshipRatingScatterKind,
): number {
	if (kind === CHAMPIONSHIP_RATING_SCATTER_KIND.initial) {
		return point.initialRating;
	}

	return point.currentRating;
}

function scatterPointForPlayer(
	player: ChampionshipRatingScatterPlayer,
	events: readonly PlayerProfileEventInput[],
): ChampionshipRatingScatterPoint | null {
	const history = playerProfileHistory(events, player.id);
	const initialRating = playerInitialOfficialRating(history);
	if (initialRating === null) {
		return null;
	}

	const currentRating = playerLatestOfficialRating(history);
	if (currentRating === null) {
		return null;
	}

	return {
		playerId: player.id,
		name: playerVisibleName(player),
		avatarUrl: player.avatar_url,
		color: championshipRatingChartColor(player.id),
		initialRating,
		currentRating,
	};
}

function playerLatestOfficialRating(
	history: readonly PlayerProfileHistoryRow[],
): number | null {
	const latest = history.find(
		(row) => officialEventRating(row.ratingTo) !== null,
	);
	if (!latest) {
		return null;
	}

	return officialEventRating(latest.ratingTo);
}

function playerInitialOfficialRating(
	history: readonly PlayerProfileHistoryRow[],
): number | null {
	const chronological = history.slice().reverse();
	const oldest = chronological[0];
	if (!oldest) {
		return null;
	}

	const from = officialEventRating(oldest.ratingFrom);
	if (from !== null) {
		return from;
	}

	const seeded = chronological.find(
		(row) => officialEventRating(row.ratingTo) !== null,
	);
	if (!seeded) {
		return null;
	}

	return officialEventRating(seeded.ratingTo);
}
