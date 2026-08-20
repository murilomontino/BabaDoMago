import type { MatchClockSnapshot } from "../../const/championship-event-match.ts";
import type { MatchClockRootState } from "./slice.ts";

export function selectMatchClockSnapshot(
	state: MatchClockRootState,
	matchId: number | null,
): MatchClockSnapshot | undefined {
	if (matchId === null) {
		return undefined;
	}

	return state.matchClock.clocks[String(matchId)];
}

export function selectMatchClockHeld(state: MatchClockRootState): boolean {
	return state.matchClock.held;
}

export function selectMatchClockError(
	state: MatchClockRootState,
): string | null {
	return state.matchClock.error;
}

export function selectMatchClockUiError(
	state: MatchClockRootState,
): string | null {
	if (selectPendingMatchClockIds(state).length > 0) {
		return null;
	}

	return state.matchClock.error;
}

export function selectMatchClockFlushAttempt(
	state: MatchClockRootState,
): number {
	return state.matchClock.flushAttempt;
}

export function selectMatchClockDeferredClear(
	state: MatchClockRootState,
	matchId: number,
): boolean {
	return Boolean(state.matchClock.deferredClear[String(matchId)]);
}

export function selectPendingMatchClockIds(
	state: MatchClockRootState,
): number[] {
	return Object.entries(state.matchClock.clocks).flatMap(([id, clock]) => {
		if (clock.pending.length === 0) {
			return [];
		}

		return [Number(id)];
	});
}
