export const PLAYER_RATING = {
	min: 0,
	max: 100,
	default: 0,
	starCount: 5,
	initialCeiling: 5,
} as const;

export const PLAYER_STAR_CLASS = {
	default: "h-5 w-5 shrink-0 fill-current",
	compact: "h-3.5 w-3.5 shrink-0 fill-current",
} as const;

export const PLAYER_STARS = [
	{ id: "star-1", index: 0 },
	{ id: "star-2", index: 1 },
	{ id: "star-3", index: 2 },
	{ id: "star-4", index: 3 },
	{ id: "star-5", index: 4 },
] as const;

export const STAR_SIDE = {
	left: "left",
	right: "right",
} as const;

export type StarSide = (typeof STAR_SIDE)[keyof typeof STAR_SIDE];

export function championshipRatingCeiling(ratings: readonly number[]): number {
	const maxRating = ratings.length === 0 ? 0 : Math.max(...ratings);
	return Math.min(
		PLAYER_RATING.max,
		Math.max(maxRating, PLAYER_RATING.initialCeiling),
	);
}

export function ratingToStarFill(rating: number, ceiling: number): number {
	if (ceiling <= 0) {
		return 0;
	}

	return (rating / ceiling) * PLAYER_RATING.starCount;
}

export function snapStarFill(fill: number): number {
	return Math.round(fill * 2) / 2;
}

export function starHalfToFill(starIndex: number, side: StarSide): number {
	switch (side) {
		case STAR_SIDE.left:
			return starIndex + 0.5;
		case STAR_SIDE.right:
			return starIndex + 1;
		default: {
			const _exhaustive: never = side;
			return _exhaustive;
		}
	}
}

export function starFillToRating(starFill: number, ceiling: number): number {
	if (ceiling <= 0) {
		return PLAYER_RATING.min;
	}

	const rating =
		Math.round((starFill / PLAYER_RATING.starCount) * ceiling * 10) / 10;
	return Math.min(PLAYER_RATING.max, Math.max(PLAYER_RATING.min, rating));
}
