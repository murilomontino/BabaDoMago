import { MATCH_CLOCK_ACTION } from "../../const/championship-event-match.ts";
import {
	clearMatchClock,
	MATCH_CLOCK_INITIAL_STATE,
	matchClockReducer,
	shiftPending,
} from "./slice.ts";

function check(actual: unknown, expected: unknown, message: string): void {
	if (actual !== expected) {
		throw new Error(`${message}: ${String(actual)} !== ${String(expected)}`);
	}
}

const pendingClock = {
	started_at: "2026-08-14T12:00:00.000Z",
	paused_at: "2026-08-14T12:00:10.000Z",
	pause_accumulated_seconds: 0,
	pending: [MATCH_CLOCK_ACTION.pause],
};

const withPending = {
	...MATCH_CLOCK_INITIAL_STATE,
	clocks: { "7": pendingClock },
};

const kept = matchClockReducer(withPending, clearMatchClock(7));
check(
	kept.clocks["7"]?.pending.join(","),
	MATCH_CLOCK_ACTION.pause,
	"keeps pending",
);
check(kept.deferredClear["7"], true, "defers clear");

const drained = matchClockReducer(kept, shiftPending(7));
check(drained.clocks["7"], undefined, "clears after drain");
check(drained.deferredClear["7"], undefined, "drops deferred clear");

const idle = matchClockReducer(
	{
		...MATCH_CLOCK_INITIAL_STATE,
		clocks: {
			"7": { ...pendingClock, pending: [] },
		},
	},
	clearMatchClock(7),
);
check(idle.clocks["7"], undefined, "clears idle clock");

console.log("match-clock slice ok");
