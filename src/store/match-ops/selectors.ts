import type { MatchOp } from "../../const/championship-event-match-ops.ts";
import type { MatchOpsRootState } from "./slice.ts";

export const EMPTY_MATCH_OPS: MatchOp[] = [];

export function selectMatchOps(
	state: MatchOpsRootState,
	eventId: number | null,
): readonly MatchOp[] {
	if (eventId === null) {
		return EMPTY_MATCH_OPS;
	}

	return state.matchOps.queues[String(eventId)] ?? EMPTY_MATCH_OPS;
}

export function selectMatchOpsCount(
	state: MatchOpsRootState,
	eventId: number | null,
): number {
	return selectMatchOps(state, eventId).length;
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

export function selectMappedMatchId(
	state: MatchOpsRootState,
	localMatchId: number,
): number | null {
	const mapped = state.matchOps.localMatchMap[String(localMatchId)];
	if (mapped === undefined) {
		return null;
	}

	return mapped;
}

export function selectClockRpcMatchId(
	state: MatchOpsRootState,
	matchId: number,
): number | null {
	if (matchId >= 0) {
		return matchId;
	}

	return selectMappedMatchId(state, matchId);
}
