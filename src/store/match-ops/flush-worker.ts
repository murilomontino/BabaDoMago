import type { SagaIterator } from "redux-saga";
import { call, delay, put, select } from "redux-saga/effects";
import {
	MATCH_CLOCK_FLUSH_RETRY,
	matchClockRetryDelayMs,
} from "../../const/championship-event-match.ts";
import {
	isFatalMatchOpMessage,
	MATCH_OPS_FLUSH_ERROR,
	type MatchOp,
} from "../../const/championship-event-match-ops.ts";
import { caughtErrorMessage } from "../../lib/error-message.ts";
import { readOnline, waitForOnline } from "../online-channel.ts";
import { selectMatchOps } from "./selectors.ts";
import {
	flushAttemptSet,
	flushFailed,
	inFlightSet,
	type MatchOpsRootState,
	opDropped,
	opSettled,
} from "./slice.ts";

export async function runMatchOpRpc(
	matchId: number,
	op: MatchOp,
): Promise<void> {
	const { runBoundMatchOpRpc } = await import("./rpc.ts");
	await runBoundMatchOpRpc(matchId, op);
}

export async function invalidateMatchOpQueries(): Promise<void> {
	const { invalidateBoundMatchOpQueries } = await import("./rpc.ts");
	await invalidateBoundMatchOpQueries();
}

function selectMatchOpsById(matchId: number) {
	return (state: MatchOpsRootState) => selectMatchOps(state, matchId);
}

export function* flushMatchOp(
	matchId: number,
	op: MatchOp,
): SagaIterator<boolean> {
	for (let attempt = 0; ; attempt += 1) {
		yield call(waitForOnline);
		yield put(inFlightSet(op.id));
		try {
			yield call(runMatchOpRpc, matchId, op);
			yield call(invalidateMatchOpQueries);
			yield put(opSettled(matchId));
			return true;
		} catch (error) {
			const message = caughtErrorMessage(error, MATCH_OPS_FLUSH_ERROR.fallback);
			yield put(inFlightSet(null));
			yield put(flushFailed(message));
			const online: boolean = yield call(readOnline);
			if (!online) {
				continue;
			}

			if (
				isFatalMatchOpMessage(message) ||
				attempt + 1 >= MATCH_CLOCK_FLUSH_RETRY.attempts
			) {
				yield put(opDropped({ matchId, message }));
				yield call(invalidateMatchOpQueries);
				return true;
			}

			yield put(flushAttemptSet(attempt + 1));
			yield delay(matchClockRetryDelayMs(attempt));
		}
	}
}

export function* flushMatchOpsWorker(matchId: number): SagaIterator {
	for (;;) {
		const ops: readonly MatchOp[] = yield select(selectMatchOpsById(matchId));
		const op = ops[0];
		if (!op) {
			return;
		}

		const flushed: boolean = yield call(flushMatchOp, matchId, op);
		if (!flushed) {
			return;
		}
	}
}
