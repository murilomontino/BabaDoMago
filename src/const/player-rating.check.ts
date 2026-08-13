import {
	championshipRatingCeiling,
	PLAYER_RATING,
	PLAYER_STARS,
	ratingToStarFill,
} from "./player-rating.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(PLAYER_STARS.length === PLAYER_RATING.starCount, "5 star slots");
check(championshipRatingCeiling([6, 3, 1]) === 6, "ceiling is max in baba");
check(championshipRatingCeiling([50]) === 50, "single player is ceiling");
check(ratingToStarFill(6, 6) === 5, "highest in baba -> 5 stars");
check(ratingToStarFill(3, 6) === 2.5, "half of ceiling");
check(ratingToStarFill(50, 100) === 2.5, "50 of 100");
check(ratingToStarFill(100, 100) === PLAYER_RATING.starCount, "100 of 100");
check(ratingToStarFill(1, 100) === 0.05, "min vs full scale");

console.log("player-rating ok");
