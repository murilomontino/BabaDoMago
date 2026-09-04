import {
	HAMMER_VERTICAL_SWIPE,
	VERTICAL_SWIPE_DIRECTION,
	verticalSwipeFromDelta,
} from "./hammer-swipe.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(
	verticalSwipeFromDelta(-40, HAMMER_VERTICAL_SWIPE.threshold) ===
		VERTICAL_SWIPE_DIRECTION.up,
	"negative delta is up",
);
check(
	verticalSwipeFromDelta(40, HAMMER_VERTICAL_SWIPE.threshold) ===
		VERTICAL_SWIPE_DIRECTION.down,
	"positive delta is down",
);
check(
	verticalSwipeFromDelta(-10, HAMMER_VERTICAL_SWIPE.threshold) === null,
	"small move is ignored",
);
check(
	verticalSwipeFromDelta(10, HAMMER_VERTICAL_SWIPE.threshold) === null,
	"small down is ignored",
);

console.log("hammer-swipe ok");
