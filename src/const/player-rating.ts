export const PLAYER_RATING = {
	min: 1,
	max: 100,
	default: 50,
	starCount: 5,
} as const;

export const PLAYER_STARS = [
	{ id: "star-1" },
	{ id: "star-2" },
	{ id: "star-3" },
	{ id: "star-4" },
	{ id: "star-5" },
] as const;

export function championshipRatingCeiling(ratings: readonly number[]): number {
	if (ratings.length === 0) {
		return PLAYER_RATING.min;
	}

	return Math.max(...ratings);
}

export function ratingToStarFill(rating: number, ceiling: number): number {
	if (ceiling <= 0) {
		return 0;
	}

	return (rating / ceiling) * PLAYER_RATING.starCount;
}
