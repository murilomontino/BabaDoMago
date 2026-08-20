import type { MatchOp } from "../../const/championship-event-match-ops.ts";
import type { MatchOpsRootState } from "./slice.ts";

export const EMPTY_MATCH_OPS: MatchOp[] = [];

export function selectMatchOps(
	state: MatchOpsRootState,
	matchId: number | null,
): readonly MatchOp[] {
	if (matchId === null) {
		return EMPTY_MATCH_OPS;
	}

	return state.matchOps.queues[String(matchId)] ?? EMPTY_MATCH_OPS;
}

export function selectMatchOpsCount(
	state: MatchOpsRootState,
	matchId: number | null,
): number {
	return selectMatchOps(state, matchId).length;
}

export function selectMatchOpsError(state: MatchOpsRootState): string | null {
	return state.matchOps.error;
}

export function selectMatchOpsInFlightId(
	state: MatchOpsRootState,
): string | null {
	return state.matchOps.inFlightId;
}

export function selectMatchOpsFlushAttempt(state: MatchOpsRootState): number {
	return state.matchOps.flushAttempt;
}

export function selectPendingMatchOpIds(state: MatchOpsRootState): number[] {
	return Object.entries(state.matchOps.queues).flatMap(([id, ops]) => {
		if (ops.length === 0) {
			return [];
		}

		return [Number(id)];
	});
}
