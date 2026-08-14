import { eventMvpStarDelta } from "./event-mvp.ts";
import { playerVisibleName } from "./player-name.ts";
import { championshipRatingCeiling, PLAYER_RATING } from "./player-rating.ts";

export const EVENT_RATING_ADJUSTMENT = {
	upThreshold: 0.55,
	downThreshold: 0.45,
	expectedWinRate: 0.5,
	minMatches: 3,
	scaleDivisor: 2,
} as const;

export type EventRatingPreviewRow = {
	playerId: number;
	name: string;
	from: number;
	to: number;
	isMvp: boolean;
};

function roundAwayFromZero1(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}

	const sign = value < 0 ? -1 : 1;
	return (sign * Math.round(Math.abs(value) * 10)) / 10;
}

function roundRatioToTenths(numerator: number, denominator: number): number {
	if (denominator === 0) {
		return 0;
	}

	const sign = numerator * denominator < 0 ? -1 : 1;
	const absN = Math.abs(numerator);
	const absD = Math.abs(denominator);
	return (sign * Math.floor((absN + absD / 2) / absD)) / 10;
}

export function eventRatingDelta(
	wins: number,
	matches: number,
	rating: number,
	ceiling: number,
): number {
	if (rating === PLAYER_RATING.default) {
		return 0;
	}

	if (matches < EVENT_RATING_ADJUSTMENT.minMatches) {
		return 0;
	}

	const wrScale = 20;
	const winUnits = wins * wrScale;
	if (
		winUnits <=
			matches * Math.round(EVENT_RATING_ADJUSTMENT.upThreshold * wrScale) &&
		winUnits >=
			matches * Math.round(EVENT_RATING_ADJUSTMENT.downThreshold * wrScale)
	) {
		return 0;
	}

	// ponytail: linear no teto; teto 75 e WR 83% = +12.5. Cap de delta se o baba maduro pular demais.
	const ceilingTenths = Math.round(
		Math.min(PLAYER_RATING.max, Math.max(PLAYER_RATING.min, ceiling)) * 10,
	);
	return roundRatioToTenths(
		(2 * wins - matches) * ceilingTenths,
		2 * EVENT_RATING_ADJUSTMENT.scaleDivisor * matches,
	);
}

export function applyEventRatingDelta(rating: number, delta: number): number {
	return Math.min(
		PLAYER_RATING.max,
		Math.max(PLAYER_RATING.min, roundAwayFromZero1(rating + delta)),
	);
}

export function recomputePlayerEventRating(
	rating: number,
	oldDelta: number,
	wins: number,
	matches: number,
	ceiling: number,
): number {
	return applyEventRatingDelta(
		rating,
		-oldDelta + eventRatingDelta(wins, matches, rating, ceiling),
	);
}

export function playerEventRatingAfterSave({
	rating,
	storedDelta,
	oldWins,
	oldMatches,
	wins,
	matches,
	ceiling,
}: {
	rating: number;
	storedDelta: number;
	oldWins: number;
	oldMatches: number;
	wins: number;
	matches: number;
	ceiling: number;
}): number {
	if (
		storedDelta === 0 &&
		eventRatingDelta(oldWins, oldMatches, rating, ceiling) !== 0
	) {
		return rating;
	}

	return recomputePlayerEventRating(
		rating,
		storedDelta,
		wins,
		matches,
		ceiling,
	);
}

export function formatEventRating(rating: number): string {
	return rating.toFixed(1);
}

export function eventRatingPreview({
	attendance,
	players,
	presentPlayerIds,
	mvpPlayerIds = [],
}: {
	attendance: readonly {
		player_id: number;
		display_name: string;
		wins: number;
		matches: number;
	}[];
	players: readonly {
		id: number;
		rating: number;
		nickname: string | null;
		display_name: string;
	}[];
	presentPlayerIds: readonly number[] | null;
	mvpPlayerIds?: readonly number[];
}): EventRatingPreviewRow[] {
	const playerById = new Map(players.map((player) => [player.id, player]));
	const statsById = new Map(attendance.map((row) => [row.player_id, row]));
	const mvpIds = new Set(mvpPlayerIds);
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const mvpBonus = eventMvpStarDelta();
	const ids = presentPlayerIds ?? attendance.map((row) => row.player_id);

	return ids.map((playerId) => {
		const player = playerById.get(playerId);
		const stats = statsById.get(playerId);
		const from = player?.rating ?? PLAYER_RATING.default;
		const isMvp = mvpIds.has(playerId);
		const to = applyEventRatingDelta(
			from,
			eventRatingDelta(stats?.wins ?? 0, stats?.matches ?? 0, from, ceiling) +
				(isMvp ? mvpBonus : 0),
		);

		return {
			playerId,
			name: playerVisibleName(
				player ?? {
					nickname: null,
					display_name: stats?.display_name ?? "",
				},
			),
			from,
			to,
			isMvp,
		};
	});
}
