import {
	MATCH_PROJECTION_DEFAULT_SCALE,
	projectedTeamWinRates,
	projectedWinRate,
	projectionScaleFromFavoriteRates,
} from "./championship-match-projection.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(projectedWinRate(0) === 0.5, "zero spread 50%");
check(projectedWinRate(8, 8) > 0.7, "spread = scale favors");
check(projectedWinRate(-8, 8) < 0.3, "negative spread underdog");
check(projectedWinRate(100, 8) > 0.99, "huge spread near 1");

const rates = projectedTeamWinRates(60, 40, 8);
check(Math.abs(rates.teamA + rates.teamB - 1) < 1e-9, "rates sum 1");
check(rates.teamA > rates.teamB, "stronger team higher");

check(
	projectionScaleFromFavoriteRates([]) === MATCH_PROJECTION_DEFAULT_SCALE,
	"empty uses default",
);
check(
	projectionScaleFromFavoriteRates([
		{ spread: 4, favoriteWon: true },
		{ spread: 4, favoriteWon: true },
		{ spread: 4, favoriteWon: false },
		{ spread: 4, favoriteWon: true },
	]) > 0,
	"scale from samples",
);

console.log("championship-match-projection.check.ts ok");
