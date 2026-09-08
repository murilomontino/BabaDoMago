import {
	CHAMPIONSHIP_TRENDS_FILTERS_INITIAL,
	championshipTrendsFiltersReducer,
} from "./championship-trends-filters.ts";
import { TRENDS_WINDOW_DEFAULT } from "./championship-trends-window.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

{
	const next = championshipTrendsFiltersReducer(
		CHAMPIONSHIP_TRENDS_FILTERS_INITIAL,
		{ type: "SET_WINDOW", value: "all" },
	);
	check(next.window !== undefined, true);
	check(next.audience, CHAMPIONSHIP_TRENDS_FILTERS_INITIAL.audience);
}

{
	const toggled = championshipTrendsFiltersReducer(
		CHAMPIONSHIP_TRENDS_FILTERS_INITIAL,
		{ type: "SET_SHOW_FEW_MATCHES", value: true },
	);
	check(toggled.showFewMatches, true);

	const named = championshipTrendsFiltersReducer(toggled, {
		type: "SET_SHOW_PERFORMANCE_NAMES",
		value: true,
	});
	check(named.showPerformanceNames, true);
	check(named.showFewMatches, true);
}

{
	const dirty = championshipTrendsFiltersReducer(
		CHAMPIONSHIP_TRENDS_FILTERS_INITIAL,
		{ type: "SET_SHOW_CONTRIBUTION_TABLE", value: false },
	);
	check(dirty.showContributionTable, false);

	const reset = championshipTrendsFiltersReducer(dirty, { type: "RESET" });
	check(reset.window, TRENDS_WINDOW_DEFAULT);
	check(reset.showContributionTable, true);
	check(reset.showFewMatches, false);
}

console.log("championship-trends-filters.check.ts: ok");
