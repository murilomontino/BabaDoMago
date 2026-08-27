import {
	listingScrollY,
	pullDeltaFromTouch,
	QUERY_REFRESH,
	queryRefreshPullOffset,
	shouldCommitQueryRefresh,
} from "./query-refresh.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(QUERY_REFRESH.pullThresholdPx === 64, "pull threshold");
check(QUERY_REFRESH.mediaQuery === "(min-width: 768px)", "desktop media query");

check(listingScrollY(10, 4) === 14, "sums window and listing scroll");
check(pullDeltaFromTouch(10, 0, 80) === 0, "no pull when scrolled");
check(pullDeltaFromTouch(0, 40, 20) === 0, "no pull upward");
check(pullDeltaFromTouch(0, 10, 50) === 40, "pull at top");

check(shouldCommitQueryRefresh(64, 64) === true, "at threshold");
check(shouldCommitQueryRefresh(63, 64) === false, "below threshold");

check(queryRefreshPullOffset(0, false, 64) === 0, "hidden at rest");
check(queryRefreshPullOffset(20, false, 64) === 20, "follows finger");
check(queryRefreshPullOffset(90, false, 64) === 64, "clamps at threshold");
check(queryRefreshPullOffset(0, true, 64) === 64, "pending parks at threshold");

console.log("query-refresh ok");
