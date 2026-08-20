import type { SagaIterator } from "redux-saga";
import { call, delay, put, select } from "redux-saga/effects";
import {
	MATCH_CLOCK_FLUSH_RETRY,
	matchClockRetryDelayMs,
} from "../../const/championship-event-match.ts";
import {
	isFatalMatchOpMessage,
	MATCH_OP,
	MATCH_OPS_FLUSH_ERROR,
	type MatchOp,
} from "../../const/championship-event-match-ops.ts";
import { caughtErrorMessage } from "../../lib/error-message.ts";
import { matchClockFlushRequested } from "../match-clock/actions.ts";
import { readOnline, waitForOnline } from "../online-channel.ts";
import { matchIdRemapped } from "./actions.ts";
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
	eventId: number,
	op: MatchOp,
): Promise<number | null> {
	const { runBoundMatchOpRpc } = await import("./rpc.ts");
	return runBoundMatchOpRpc(eventId, op);
}

export async function invalidateMatchOpQueries(op: MatchOp): Promise<void> {
	const { invalidateBoundMatchOpQueries } = await import("./rpc.ts");
	await invalidateBoundMatchOpQueries(op);
}

function selectMatchOpsById(eventId: number) {
	return (state: MatchOpsRootState) => selectMatchOps(state, eventId);
}

export function* flushMatchOp(
	eventId: number,
	op: MatchOp,
): SagaIterator<boolean> {
	for (let attempt = 0; ; attempt += 1) {
		yield call(waitForOnline);
		yield put(inFlightSet(op.id));
		try {
			const serverMatchId: number | null = yield call(
				runMatchOpRpc,
				eventId,
				op,
			);
			if (op.kind === MATCH_OP.startMatch) {
				if (serverMatchId === null) {
					throw new Error(MATCH_OPS_FLUSH_ERROR.fallback);
				}

				yield put(
					matchIdRemapped({
						eventId,
						localMatchId: op.localId,
						serverMatchId,
					}),
				);
				yield put(matchClockFlushRequested({ matchId: serverMatchId }));
			}

			yield call(invalidateMatchOpQueries, op);
			yield put(opSettled(eventId));
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
				yield put(opDropped({ eventId, message }));
				yield call(invalidateMatchOpQueries, op);
				return true;
			}

			yield put(flushAttemptSet(attempt + 1));
			yield delay(matchClockRetryDelayMs(attempt));
		}
	}
}

export function* flushMatchOpsWorker(eventId: number): SagaIterator {
	for (;;) {
		const ops: readonly MatchOp[] = yield select(selectMatchOpsById(eventId));
		const op = ops[0];
		if (!op) {
			return;
		}

		const flushed: boolean = yield call(flushMatchOp, eventId, op);
		if (!flushed) {
			return;
		}
	}
}
