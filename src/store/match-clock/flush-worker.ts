import type { SagaIterator } from "redux-saga";
import { call, delay, put, select } from "redux-saga/effects";
import {
	MATCH_CLOCK_FLUSH_ERROR,
	MATCH_CLOCK_FLUSH_RETRY,
	type MatchClockAction,
	matchClockRetryDelayMs,
} from "../../const/championship-event-match.ts";
import { caughtErrorMessage } from "../../lib/error-message.ts";
import { selectClockRpcMatchId } from "../match-ops/selectors.ts";
import type { MatchOpsRootState } from "../match-ops/slice.ts";
import { readOnline, waitForOnline } from "../online-channel.ts";
import { selectMatchClockHeld, selectMatchClockSnapshot } from "./selectors.ts";
import {
	flushAttemptSet,
	flushFailed,
	type MatchClockRootState,
	shiftPending,
} from "./slice.ts";

type ClockFlushRootState = MatchClockRootState & MatchOpsRootState;

export async function runMatchClockRpc(
	matchId: number,
	action: MatchClockAction,
): Promise<void> {
	const { runBoundMatchClockRpc } = await import("./rpc.ts");
	await runBoundMatchClockRpc(matchId, action);
}

export async function invalidateMatchClockQueries(): Promise<void> {
	const { invalidateBoundMatchClockQueries } = await import("./rpc.ts");
	await invalidateBoundMatchClockQueries();
}

function selectMatchClockById(matchId: number) {
	return (state: MatchClockRootState) =>
		selectMatchClockSnapshot(state, matchId);
}

function selectRpcMatchId(matchId: number) {
	return (state: ClockFlushRootState) => selectClockRpcMatchId(state, matchId);
}

export function* flushPendingAction(
	matchId: number,
	action: MatchClockAction,
): SagaIterator<boolean> {
	for (let attempt = 0; ; attempt += 1) {
		yield call(waitForOnline);
		let rpcMatchId = matchId;
		if (matchId < 0) {
			const mapped: number | null = yield select(selectRpcMatchId(matchId));
			if (mapped === null) {
				continue;
			}

			rpcMatchId = mapped;
		}

		try {
			yield call(runMatchClockRpc, rpcMatchId, action);
			yield put(shiftPending(rpcMatchId));
			yield put(flushFailed(null));
			yield put(flushAttemptSet(0));
			yield call(invalidateMatchClockQueries);
			return true;
		} catch (error) {
			yield put(
				flushFailed(
					caughtErrorMessage(error, MATCH_CLOCK_FLUSH_ERROR.fallback),
				),
			);
			yield put(flushAttemptSet(attempt + 1));
			const online: boolean = yield call(readOnline);
			if (!online) {
				continue;
			}

			yield delay(matchClockRetryDelayMs(attempt));
		}
	}
}

export function* flushMatchClockWorker(matchId: number): SagaIterator {
	for (;;) {
		const held: boolean = yield select(selectMatchClockHeld);
		if (held) {
			return;
		}

		let lookupId = matchId;
		if (matchId < 0) {
			const mapped: number | null = yield select(selectRpcMatchId(matchId));
			if (mapped === null) {
				yield call(waitForOnline);
				yield delay(MATCH_CLOCK_FLUSH_RETRY.baseMs);
				continue;
			}

			lookupId = mapped;
		}

		const snapshot: ReturnType<typeof selectMatchClockSnapshot> = yield select(
			selectMatchClockById(lookupId),
		);
		const action = snapshot?.pending[0];
		if (!action) {
			return;
		}

		const flushed: boolean = yield call(flushPendingAction, lookupId, action);
		if (!flushed) {
			return;
		}
	}
}
