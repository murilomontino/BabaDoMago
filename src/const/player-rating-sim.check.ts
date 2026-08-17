import {
	EVENT_RATING_ADJUSTMENT,
	EVENT_RATING_INITIAL,
} from "./event-rating-adjustment.ts";
import { PLAYER_RATING } from "./player-rating.ts";
import {
	emptyPlayerRatingSimDraft,
	formatPlayerRatingSimRate,
	PLAYER_RATING_SIM_FIELD,
	PLAYER_RATING_SIM_LABEL,
	setPlayerRatingSimField,
	simulatePlayerEventRating,
} from "./player-rating-sim.ts";

function check(actual: unknown, expected: unknown, message: string): void {
	if (actual !== expected) {
		throw new Error(
			`${message}: expected ${String(expected)}, got ${String(actual)}`,
		);
	}
}

check(PLAYER_RATING_SIM_LABEL.title, "Simulação", "title");
check(emptyPlayerRatingSimDraft().wins, 0, "empty wins");
check(
	setPlayerRatingSimField(
		emptyPlayerRatingSimDraft(),
		PLAYER_RATING_SIM_FIELD.wins,
		2,
	).wins,
	2,
	"set wins",
);
check(formatPlayerRatingSimRate(0.5), "50.0%", "rate 50");

const dead = simulatePlayerEventRating({
	rating: 4,
	wins: 2,
	draws: 0,
	losses: 2,
	ceiling: 5,
});
check(dead.matches, 4, "dead matches");
check(dead.inDeadZone, true, "dead zone");
check(dead.delta, 0, "dead delta");
check(dead.to, 4, "dead to");
check(dead.belowMinMatches, false, "dead not below min");

const seed = simulatePlayerEventRating({
	rating: PLAYER_RATING.default,
	wins: 4,
	draws: 0,
	losses: 0,
	ceiling: 5,
});
check(seed.isSeed, true, "seed flag");
check(seed.to, EVENT_RATING_INITIAL.high, "seed high");
check(seed.delta, EVENT_RATING_INITIAL.high, "seed delta");

const bonus = simulatePlayerEventRating({
	rating: 4,
	wins: 0,
	draws: 3,
	losses: 0,
	ceiling: 5,
});
check(bonus.drawPoints, EVENT_RATING_ADJUSTMENT.drawPointsBonus, "E > D 1.5");
check(bonus.inDeadZone, true, "3E 0D dead");
check(bonus.delta, 0, "3E 0D delta 0");

const floor = simulatePlayerEventRating({
	rating: 0.3,
	wins: 1,
	draws: 0,
	losses: 2,
	ceiling: 75,
});
check(floor.to, PLAYER_RATING.floor, "clamp piso");

const lowGames = simulatePlayerEventRating({
	rating: 4,
	wins: 1,
	draws: 0,
	losses: 0,
	ceiling: 5,
});
check(lowGames.belowMinMatches, true, "below min");
check(lowGames.delta, 0, "below min delta");
check(lowGames.to, 4, "below min to");

const mvp = simulatePlayerEventRating({
	rating: 4,
	wins: 2,
	draws: 0,
	losses: 2,
	ceiling: 5,
	isMvp: true,
});
check(mvp.delta, 0.1, "mvp on dead zone");
check(mvp.to, 4.1, "mvp applies");

console.log("player-rating-sim ok");
