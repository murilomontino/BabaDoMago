import { HAMMER_VERTICAL_SWIPE } from "./hammer-swipe.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(HAMMER_VERTICAL_SWIPE.panThreshold === 5, "pan threshold matches pawkeepr");
check(
	HAMMER_VERTICAL_SWIPE.swipeThreshold === 10,
	"swipe threshold matches pawkeepr",
);
check(HAMMER_VERTICAL_SWIPE.velocity === 0.25, "velocity matches pawkeepr");

console.log("hammer-swipe ok");
