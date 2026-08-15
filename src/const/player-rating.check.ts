import {
	championshipRatingCeiling,
	PLAYER_RATING,
	PLAYER_RATING_INPUT,
	PLAYER_STARS,
	parsePlayerRatingInput,
	ratingToStarFill,
	STAR_SIDE,
	starFillToRating,
	starHalfToFill,
} from "./player-rating.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(PLAYER_STARS.length === PLAYER_RATING.starCount, "5 star slots");
check(championshipRatingCeiling([]) === 5, "empty uses initial ceiling");
check(championshipRatingCeiling([0, 0]) === 5, "unrated uses initial ceiling");
check(championshipRatingCeiling([3, 1]) === 5, "below 5 keeps initial ceiling");
check(championshipRatingCeiling([6, 3, 1]) === 6, "above 5 uses max");
check(championshipRatingCeiling([10]) === 10, "teto 10");
check(championshipRatingCeiling([100]) === 100, "teto 100");
check(championshipRatingCeiling([150, 80]) === 100, "teto geral 100");

check(starFillToRating(5, 5) === 5, "initial 5 stars = 5 points");
check(starFillToRating(3, 5) === 3, "initial 3 stars = 3 points");
check(starFillToRating(3.5, 5) === 3.5, "teto 5 3.5 stars = 3.5");
check(starFillToRating(2.5, 5) === 2.5, "teto 5 half star stays");
check(starFillToRating(2.5, 10) === 5, "teto 10 and 2.5 stars = 5");
check(starFillToRating(5, 10) === 10, "teto 10 and 5 stars = 10");
check(starFillToRating(0, 5) === 0, "0 stars = 0");

check(ratingToStarFill(0, 5) === 0, "unrated shows empty");
check(ratingToStarFill(5, 5) === 5, "5 points = 5 stars initially");
check(ratingToStarFill(5, 10) === 2.5, "5 of 10 = 2.5 stars");

check(starHalfToFill(0, STAR_SIDE.left) === 0.5, "first left = 0.5");
check(starHalfToFill(4, STAR_SIDE.right) === 5, "last right = 5");

check(PLAYER_RATING_INPUT.ariaLabel === "Corrigir nota", "input label");
check(parsePlayerRatingInput("46,3") === 46.3, "comma decimal");
check(parsePlayerRatingInput(" 46.3 ") === 46.3, "trim decimal");
check(parsePlayerRatingInput("101") === null, "over max");
check(parsePlayerRatingInput("-1") === null, "below min");
check(parsePlayerRatingInput("") === null, "empty");
check(PLAYER_RATING.floor === 0.1, "rated floor");
check(parsePlayerRatingInput("0") === 0, "zero ok");
check(parsePlayerRatingInput("100") === 100, "max ok");

console.log("player-rating ok");
