import { eventMvpBonus } from "./event-mvp.ts";
import { playerVisibleName } from "./player-name.ts";
import { championshipRatingCeiling, PLAYER_RATING } from "./player-rating.ts";

export const EVENT_RATING_ADJUSTMENT = {
	upThreshold: 0.55,
	downThreshold: 0.45,
	expectedRate: 0.5,
	minMatches: 3,
	scaleDivisor: 2,
	winPoints: 3,
	drawPoints: 1,
	drawPointsBonus: 1.5,
} as const;

export const EVENT_RATING_INITIAL = {
	low: 2.7,
	mid: 3,
	high: 3.5,
} as const;

export type EventRatingPreviewRow = {
	playerId: number;
	name: string;
	from: number;
	to: number;
	isMvp: boolean;
};

export function previewRatingTos(
	preview: readonly EventRatingPreviewRow[] | false | null | undefined,
): number[] {
	if (!preview) {
		return [];
	}

	return preview.map((row) => row.to);
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

function roundRatioToTenths(numerator: number, denominator: number): number {
	if (denominator === 0) {
		return 0;
	}

	const absN = Math.abs(numerator);
	const absD = Math.abs(denominator);
	return (
		(signedUnit(numerator * denominator) *
			Math.floor((absN + absD / 2) / absD)) /
		10
	);
}

export function eventRatingDrawPoints(draws: number, losses: number): number {
	if (draws > losses) {
		return EVENT_RATING_ADJUSTMENT.drawPointsBonus;
	}

	return EVENT_RATING_ADJUSTMENT.drawPoints;
}

export function eventRatingPoints(
	wins: number,
	draws: number,
	losses: number,
): number {
	return (
		wins * EVENT_RATING_ADJUSTMENT.winPoints +
		draws * eventRatingDrawPoints(draws, losses)
	);
}

export function eventRatingDelta(
	wins: number,
	draws: number,
	losses: number,
	matches: number,
	rating: number,
	ceiling: number,
): number {
	if (matches < EVENT_RATING_ADJUSTMENT.minMatches) {
		return 0;
	}

	const points = eventRatingPoints(wins, draws, losses);
	const maxPoints = matches * EVENT_RATING_ADJUSTMENT.winPoints;
	const wrScale = 20;
	const pointUnits = points * wrScale;
	const upUnits =
		maxPoints * Math.round(EVENT_RATING_ADJUSTMENT.upThreshold * wrScale);
	const downUnits =
		maxPoints * Math.round(EVENT_RATING_ADJUSTMENT.downThreshold * wrScale);
	const inDeadZone = pointUnits <= upUnits && pointUnits >= downUnits;

	if (rating === PLAYER_RATING.default) {
		if (inDeadZone) {
			return EVENT_RATING_INITIAL.mid;
		}

		if (pointUnits > upUnits) {
			return EVENT_RATING_INITIAL.high;
		}

		return EVENT_RATING_INITIAL.low;
	}

	if (inDeadZone) {
		return 0;
	}

	// ponytail: linear no teto; teto 75 e 83% = +12.5. Cap de delta se o baba maduro pular demais.
	const ceilingTenths = Math.round(
		Math.min(PLAYER_RATING.max, Math.max(PLAYER_RATING.min, ceiling)) * 10,
	);
	return roundRatioToTenths(
		(2 * points - maxPoints) * ceilingTenths,
		2 * EVENT_RATING_ADJUSTMENT.scaleDivisor * maxPoints,
	);
}

export function applyEventRatingDelta(rating: number, delta: number): number {
	const next = roundAwayFromZero1(rating + delta);
	if (rating === PLAYER_RATING.default && next <= PLAYER_RATING.default) {
		return PLAYER_RATING.default;
	}

	return Math.min(PLAYER_RATING.max, Math.max(PLAYER_RATING.floor, next));
}

export function recomputePlayerEventRating(
	rating: number,
	oldDelta: number,
	wins: number,
	draws: number,
	losses: number,
	matches: number,
	ceiling: number,
	snapshotRating = rating,
): number {
	return applyEventRatingDelta(
		rating,
		-oldDelta +
			eventRatingDelta(wins, draws, losses, matches, snapshotRating, ceiling),
	);
}

export function playerEventRatingAfterSave({
	rating,
	storedDelta,
	oldWins,
	oldDraws,
	oldLosses,
	oldMatches,
	wins,
	draws,
	losses,
	matches,
	ceiling,
	snapshotRating,
}: {
	rating: number;
	storedDelta: number;
	oldWins: number;
	oldDraws: number;
	oldLosses: number;
	oldMatches: number;
	wins: number;
	draws: number;
	losses: number;
	matches: number;
	ceiling: number;
	snapshotRating?: number;
}): number {
	if (
		rating !== PLAYER_RATING.default &&
		storedDelta === 0 &&
		eventRatingDelta(
			oldWins,
			oldDraws,
			oldLosses,
			oldMatches,
			rating,
			ceiling,
		) !== 0
	) {
		return rating;
	}

	return recomputePlayerEventRating(
		rating,
		storedDelta,
		wins,
		draws,
		losses,
		matches,
		ceiling,
		snapshotRating ?? rating,
	);
}

export function formatEventRating(rating: number): string {
	return rating.toFixed(1);
}

export function eventRatingPreviewFrom(
	snapshotRating: number | undefined,
	playerRating: number | undefined,
): number {
	if (snapshotRating !== undefined) {
		return snapshotRating;
	}

	if (playerRating !== undefined) {
		return playerRating;
	}

	return PLAYER_RATING.default;
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
		draws: number;
		losses: number;
		matches: number;
		rating?: number;
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
	const ids = presentPlayerIds ?? attendance.map((row) => row.player_id);

	return ids.map((playerId) => {
		const player = playerById.get(playerId);
		const stats = statsById.get(playerId);
		const from = eventRatingPreviewFrom(stats?.rating, player?.rating);
		const isMvp = mvpIds.has(playerId);
		const to = applyEventRatingDelta(
			from,
			eventRatingDelta(
				stats?.wins ?? 0,
				stats?.draws ?? 0,
				stats?.losses ?? 0,
				stats?.matches ?? 0,
				from,
				ceiling,
			) + eventMvpBonus(isMvp, from),
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
